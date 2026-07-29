#!/usr/bin/env node
/**
 * gmail-sync.mjs — Inbox reply detector for career-ops
 *
 * Scans the candidate's Gmail inbox (IMAP, same App Password used by
 * send-email.mjs) for replies from companies tracked in applications.md,
 * classifies them (interview / rejection / offer / assessment / ack), and
 * reports matches as JSON. Read-only: never edits applications.md or
 * follow-ups.md itself — the calling session applies the updates, same
 * division of labor as followup-cadence.mjs / analyze-patterns.mjs.
 *
 * One-time setup: Gmail Settings -> Forwarding and POP/IMAP -> Enable IMAP.
 * Uses the same GMAIL_APP_PASSWORD env var (or config/outreach.yml
 * email.app_password) as send-email.mjs.
 *
 * Run: node gmail-sync.mjs                JSON to stdout
 *      node gmail-sync.mjs --summary      human-readable table
 *      node gmail-sync.mjs --dry-run      don't advance sync state
 *      node gmail-sync.mjs --lookback 90  override lookback_days (first run only)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dns from 'node:dns';
import yaml from 'js-yaml';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

dns.setDefaultResultOrder('ipv4first');

const CAREER_OPS = dirname(fileURLToPath(import.meta.url));
const APPS_FILE = join(CAREER_OPS, 'data/applications.md');
const STATE_FILE = join(CAREER_OPS, 'data/gmail-sync-state.json');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const summaryMode = args.includes('--summary');
const lookbackIdx = args.indexOf('--lookback');
const lookbackOverride = lookbackIdx !== -1 ? parseInt(args[lookbackIdx + 1], 10) : null;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function loadConfig() {
  const outreachPath = join(CAREER_OPS, 'config/outreach.yml');
  const profilePath = join(CAREER_OPS, 'config/profile.yml');
  if (!existsSync(outreachPath) || !existsSync(profilePath)) {
    throw new Error('config/outreach.yml or config/profile.yml not found. Run setup first.');
  }
  const outreach = yaml.load(readFileSync(outreachPath, 'utf-8'));
  const profile = yaml.load(readFileSync(profilePath, 'utf-8'));
  return { outreach, profile };
}

function loadState() {
  if (!existsSync(STATE_FILE)) return {};
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveState(state) {
  if (dryRun) return;
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
}

// ---------------------------------------------------------------------------
// applications.md parsing (company lookup)
// ---------------------------------------------------------------------------

const GENERIC_SUFFIXES = [
  'technologies', 'technology', 'private limited', 'pvt ltd', 'pvt. ltd.',
  'global services', 'solutions', 'labs', 'inc', 'llc', 'ltd', 'group',
  'corporation', 'corp', 'services', 'systems', 'india',
];

function normalizeCompany(name) {
  let n = name.toLowerCase().trim();
  for (const suffix of GENERIC_SUFFIXES) {
    n = n.replace(new RegExp(`\\s*\\b${suffix}\\b\\.?\\s*$`, 'i'), '').trim();
  }
  return n.replace(/[^a-z0-9. ]/g, '').trim();
}

function parseApplications() {
  if (!existsSync(APPS_FILE)) return [];
  const lines = readFileSync(APPS_FILE, 'utf-8').split('\n');
  const rows = [];
  for (const line of lines) {
    const m = line.match(/^\|\s*(\d+)\s*\|\s*([\d-]+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*([\d./]+|-\/5)\s*\|\s*(.+?)\s*\|/);
    if (!m) continue;
    const [, num, date, company, role, , status] = m;
    const core = normalizeCompany(company);
    if (core.length < 4) continue; // too short/generic to match safely (e.g. "BCE")
    rows.push({ appNum: parseInt(num, 10), date, company: company.trim(), role: role.trim(), status: status.trim(), core });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

const CLASSIFIERS = [
  { type: 'offer', re: /\b(pleased to offer|extend(?:ing)? an offer|job offer|offer letter|welcome to the team)\b/i },
  { type: 'interview', re: /\b(schedule (a |an )?(call|interview)|invite you (for|to) an interview|interview (process|round)|book a (slot|time)|calendly|would like to (speak|chat|connect) with you)\b/i },
  { type: 'assessment', re: /\b(coding (challenge|assessment|test)|online assessment|hackerrank|codesignal|take[- ]home (assignment|test)|technical assessment)\b/i },
  { type: 'rejection', re: /\b(unfortunately|not moving forward|not (be )?(selected|proceeding)|other candidates|regret to inform|decided to (proceed|move forward) with other|position has been filled|will not be moving forward)\b/i },
  { type: 'ack', re: /\b(thank you for (applying|your application|your interest)|application (received|has been received)|we have received your)\b/i },
];

function classify(subject, text) {
  const haystack = `${subject}\n${text}`.slice(0, 4000);
  for (const { type, re } of CLASSIFIERS) {
    if (re.test(haystack)) return type;
  }
  return 'other';
}

// Priority order for reporting/urgency (higher = more actionable)
const PRIORITY = { offer: 5, interview: 4, assessment: 3, rejection: 2, ack: 1, other: 0 };

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { outreach, profile } = loadConfig();
  const emailConfig = outreach.email || {};
  const gmailSyncConfig = outreach.gmail_sync || {};
  const user = emailConfig.sender_email || profile.candidate?.email;
  const pass = process.env.GMAIL_APP_PASSWORD || emailConfig.app_password;

  if (!user || !pass) {
    console.error(JSON.stringify({
      error: 'Missing Gmail credentials. Set GMAIL_APP_PASSWORD env var (or config/outreach.yml email.app_password) and config/outreach.yml email.sender_email / profile.yml candidate.email.',
    }));
    process.exit(1);
  }

  const lookbackDays = lookbackOverride ?? gmailSyncConfig.lookback_days ?? 60;
  const applications = parseApplications();
  const state = loadState();

  const client = new ImapFlow({
    host: gmailSyncConfig.imap_host || 'imap.gmail.com',
    port: gmailSyncConfig.imap_port || 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  const matches = [];
  let checked = 0;

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const uidValidity = client.mailbox.uidValidity.toString();
      const priorState = state.INBOX && state.INBOX.uidValidity === uidValidity ? state.INBOX : null;

      let searchCriteria;
      if (priorState && priorState.lastUid) {
        searchCriteria = { uid: `${priorState.lastUid + 1}:*` };
      } else {
        const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
        searchCriteria = { since };
      }

      let maxUid = priorState?.lastUid || 0;

      for await (const msg of client.fetch(searchCriteria, { envelope: true, source: true, uid: true })) {
        checked += 1;
        if (msg.uid > maxUid) maxUid = msg.uid;

        const from = msg.envelope?.from?.[0];
        const fromAddress = from?.address?.toLowerCase() || '';
        const fromName = from?.name || '';
        const subject = msg.envelope?.subject || '';

        let text = '';
        try {
          const parsed = await simpleParser(msg.source);
          text = parsed.text || parsed.html || '';
        } catch {
          // fall back to subject-only matching if parsing fails
        }

        const haystack = `${fromAddress} ${fromName} ${subject} ${text}`.toLowerCase();
        const matchedApp = applications.find((a) => haystack.includes(a.core));
        if (!matchedApp) continue;

        const classification = classify(subject, text);
        if (classification === 'other') continue; // noise — no actionable signal

        matches.push({
          appNum: matchedApp.appNum,
          company: matchedApp.company,
          role: matchedApp.role,
          currentStatus: matchedApp.status,
          from: fromAddress,
          subject,
          date: msg.envelope?.date || null,
          classification,
          snippet: text.replace(/\s+/g, ' ').trim().slice(0, 240),
        });
      }

      saveState({ ...state, INBOX: { uidValidity, lastUid: maxUid } });
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }

  matches.sort((a, b) => PRIORITY[b.classification] - PRIORITY[a.classification]);

  const result = {
    checked,
    newMatches: matches.length,
    dryRun,
    matches,
  };

  if (summaryMode) {
    console.log(`Checked ${checked} new message(s), ${matches.length} matched a tracked application.\n`);
    for (const m of matches) {
      console.log(`#${m.appNum} ${m.company} — ${m.role} [${m.currentStatus} -> ${m.classification.toUpperCase()}]`);
      console.log(`  from: ${m.from}  subject: "${m.subject}"`);
      console.log(`  ${m.snippet}\n`);
    }
    if (matches.length === 0) console.log('Nothing actionable since last sync.');
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

main();
