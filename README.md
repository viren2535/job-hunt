# Career-Ops (Yuvraj's fork)

> Fork of [santifer/career-ops](https://github.com/santifer/career-ops), MIT-licensed. Base system + credit belongs to Santiago Fernández de Valderrama — see [About](#about) below. This fork adds a live Gmail-reply scanner and a LinkedIn/email outreach pipeline, built while running my own job search at real volume against the India market. See [What This Fork Adds](#what-this-fork-adds).

<p align="center">
  <img src="docs/demo.gif" alt="career-ops Demo" width="800">
</p>

## What Is This

career-ops ([career-ops.org](https://career-ops.org), also known as **careerops**) turns any AI coding CLI into a full job search command center. Instead of manually tracking applications in a spreadsheet, you get an AI-powered pipeline that:

- **Evaluates offers** with a structured evaluation -- blocks A-F scored across 5 weighted dimensions, plus block G, a separate posting-legitimacy assessment that never affects the 1-5 score
- **Generates tailored PDFs** -- ATS-optimized CVs customized per job description
- **Scans portals** automatically (Greenhouse, Ashby, Lever, company pages)
- **Processes in batch** -- evaluate 10+ offers in parallel with sub-agents
- **Tracks everything** in a single source of truth with integrity checks
- **Researches companies and finds the right person to contact** -- applications get you in the queue; research gets you a conversation

> **Important: This is NOT a spray-and-pray tool.** career-ops is a filter -- it helps you find the few offers worth your time out of hundreds. The system strongly recommends against applying to anything scoring below 4.0/5. Your time is valuable, and so is the recruiter's. Always review before submitting.

career-ops is agentic: whichever AI coding CLI you choose navigates career pages with Playwright, evaluates fit by reasoning about your CV vs the job description (not keyword matching), and adapts your resume per listing.

> **Heads up: the first evaluations won't be great.** The system doesn't know you yet. Feed it context -- your CV, your career story, your proof points, your preferences, what you're good at, what you want to avoid. The more you nurture it, the better it gets. Think of it as onboarding a new recruiter: the first week they need to learn about you, then they become invaluable.

The base system above is from [santifer/career-ops](https://github.com/santifer/career-ops) — built by Santiago Fernández de Valderrama, who used it to evaluate 740+ offers and land a Head of Applied AI role ([case study](https://santifer.io/career-ops-system)).

This fork adds what running it at real volume in a competitive market (India, junior/mid-level, 2 YOE) required: a Gmail scanner that catches interview/rejection replies sitting unread instead of relying on manual paste, and a LinkedIn + email outreach pipeline for warm intros. See [What This Fork Adds](#what-this-fork-adds) below.

## The CareerOps Manifesto

career-ops is the first reference implementation of [the CareerOps Manifesto](https://career-ops.org/manifesto?utm_source=readme). read it. if it says what you believe, sign it. your signature becomes a commit.

## Features

| Feature                  | Description                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Auto-Pipeline**        | Paste a URL, get a full evaluation + PDF + tracker entry                                                                                 |
| **A-G Evaluation**       | Role summary, CV match, level strategy, comp research, personalization, interview prep (STAR+R) -- plus a Block G posting-legitimacy check that flags scams and ghost jobs, and a Work-Auth signal that flags an explicit no-sponsorship JD as a hard blocker |
| **Interview Story Bank** | Accumulates STAR+Reflection stories across evaluations -- 5-10 master stories that answer any behavioral question                        |
| **Negotiation Scripts**  | Salary negotiation frameworks, geographic discount pushback, competing offer leverage                                                    |
| **ATS PDF Generation**   | Keyword-injected CVs with Space Grotesk + DM Sans design                                                                                 |
| **Cover Letter Generator** | Research-backed cover letters with keyword mirroring, four interactive angle prompts (why/problems/approach/tone), draft-in-chat approval gate, and A4 PDF via the same HTML + Playwright pipeline as CVs. Auto-drafts on every evaluation; complete and generate on demand via `/career-ops cover` |
| **Application Email Drafts** | Formal recruiter/referral/cold application emails from a report or pasted JD, with subject line, attachment checklist, source-backed fit points, and a profile-driven contact block. Draft-only -- career-ops never sends, submits, or clicks anything. |
| **Portal Scanner**       | 100+ companies pre-configured (Anthropic, OpenAI, ElevenLabs, Retool, n8n...) + custom queries across Ashby, Greenhouse, Lever, Wellfound |
| **Batch Processing**     | Parallel evaluation with headless CLI workers (`claude -p` / `opencode run`)                                                             |
| **Dashboard TUI**        | Terminal UI to browse, filter, and sort your pipeline                                                                                    |
| **Human-in-the-Loop**    | AI evaluates and recommends, you decide and act. The system never submits an application -- you always have the final call               |
| **Pipeline Integrity**   | Automated merge, dedup, status normalization, health checks                                                                              |
| **Interview Suite**      | Time-blocked prep plans, practice sessions with feedback, post-interview debriefs ([`interview/`](modes/interview/README.md)), and a company red-flag detector ([`interview-redflag`](modes/interview-redflag.md)) |
| **Offer Stage**          | Contract reading companion -- clause walk plus a lawyer question list ([`offer-prep`](modes/offer-prep.md)) -- and a desired/advertised/actual salary-gap analyzer (`salary-gap.mjs`) |
| **Follow-ups & Replies** | Follow-up cadence calculator and seeded reminders (`followup-cadence.mjs`, `followup-seed.mjs`); employer reply classification into tracker updates ([`reply-watch`](modes/reply-watch.md)) |
| **Pattern Analysis**     | Rejection patterns and per-ATS-channel advance rates (`analyze-patterns.mjs`), lifetime funnel stats (`stats.mjs`), repost/ghost-job detection (`detect-reposts.mjs`) |
| **Plugin System**        | Opt-in integrations (Gmail, Notion, Apify + a community registry), disabled by default -- see [docs/PLUGINS.md](docs/PLUGINS.md)        |
| **Beyond the CV**        | Company research ([`deep`](modes/deep.md)) surfaces AI strategy, recent moves, engineering culture, and the angle your profile should take. Contact discovery ([`contacto`](modes/contacto.md)) identifies the hiring manager, recruiter, or team peer worth reaching out to and drafts a ≤300-character LinkedIn message tuned to each contact type. Formal application email drafts ([`email`](modes/email.md)) turn an evaluated report or pasted JD into a subject line, body, and attachment checklist without sending, submitting, or clicking anything. Applications get you in the queue; research gets you a conversation. |

## What This Fork Adds

Everything above is the base system. On top of it, this fork adds:

| Addition | What it does | Files |
|----------|---------------|-------|
| **Gmail Reply Sync** | Implements the documented-but-unbuilt Gmail scanner for the base system's own [`reply-watch`](modes/reply-watch.md) pipeline — the base only shipped a manual paste-in fallback (`paste-reply.mjs`) since a live scanner "requires OAuth inbox-read access" (its words). This uses an IMAP app password instead of full OAuth: scans the inbox since the last sync, normalizes new messages into the exact candidate shape `reply-watch.mjs` already classifies and matches to tracker rows — no duplicate classifier, just the missing input source | `gmail-sync.mjs` |
| **LinkedIn Outreach Pipeline** | Generates search queries from your profile, finds 1st/2nd-degree connections at target companies, sends connection requests via Playwright, tracks everything in SQLite | `outreach.mjs`, `outreach-db.mjs`, `outreach-query-gen.mjs`, `send-outreach.mjs` |
| **Email Discovery + Sending** | Guesses + SMTP-verifies company email addresses, sends outreach emails via Gmail SMTP with rate limiting and randomized delays | `email-discover.mjs`, `send-email.mjs` |
| **CV Reviewer Pass** | An independent subagent critiques the tailored CV draft against the JD and quick company research before finalizing — checks whether the true, fact-gate-passed claims are actually convincing and correctly targeted, not just true | `modes/pdf.md` step 14.5 |

## Quick Start

**Fastest way — one command:**

```bash
npx @santifer/career-ops init
```

> 💡 `npx` ships with [Node.js](https://nodejs.org) — it runs the installer once,
> without installing anything globally. No Node yet? Install it first.
> (Already using a Claude Code / Gemini / Codex CLI? Then you already have it.)

This clones the latest release into `./career-ops` and installs dependencies. Then:

```bash
cd career-ops
claude   # or codex / qwen / opencode / agy / grok — open your AI CLI here
```

**On first launch, career-ops walks you through setup — your CV, profile and target roles — just by chatting. Nothing to edit by hand.**

<details>
<summary><b>Prefer to set it up manually? (git clone)</b></summary>

```bash
git clone https://github.com/Yuvraj3905/career-ops.git
cd career-ops && npm install
npx playwright install chromium   # only needed for PDF generation

# 2. Check setup
npm run doctor                     # Validates all prerequisites

# 3. Configure
cp config/profile.example.yml config/profile.yml  # Edit with your details
cp templates/portals.example.yml portals.yml       # Customize companies

# 4. Add your CV
# Create cv.md in the project root with your CV in markdown

# 5. Open your AI CLI in this directory
claude   # or codex / opencode / qwen / agy / grok

# Then ask your CLI to adapt the system to you:
# "Change the archetypes to backend engineering roles"
# "Translate the modes to English"
# "Add these 5 companies to portals.yml"
# "Update my profile with this CV I'm pasting"

# 6. Start using
# Paste a job URL or JD text to trigger auto-pipeline
# If your CLI supports slash commands, use /career-ops (or its CLI-specific alias)
# In Codex, ask for the same mode in plain language, e.g.:
# "Run the career-ops scan mode"
# "Run the career-ops pipeline mode for data/pipeline.md"
# "Run the career-ops pdf mode for the latest evaluated role"
# "Run the career-ops tracker mode and summarize the current statuses"
```

</details>

> **The system is designed to be customized by your AI coding CLI itself.** Modes, archetypes, scoring weights, negotiation scripts -- just ask it to change them. It reads the same files it uses, so it knows exactly what to edit.

See [docs/SETUP.md](docs/SETUP.md) for the full setup guide, [docs/RUNNING_ON_A_BUDGET.md](docs/RUNNING_ON_A_BUDGET.md) for instructions on running career-ops cheaply using custom or local models, [docs/AUTOMATION.md](docs/AUTOMATION.md) for scheduling recurring scans and a zero-token triage-to-shortlist recipe, [docs/APPLY_AUTOFILL.md](docs/APPLY_AUTOFILL.md) for details on the ATS auto-fill flow, and [docs/FAQ.md](docs/FAQ.md) for answers to common setup questions. Design principles live in [ARCHITECTURE.md](ARCHITECTURE.md); runtime flows in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Antigravity CLI Integration

career-ops supports Antigravity CLI natively, the same way it supports Claude Code and OpenCode. All slash commands are available through the shared skill entrypoint, using the same `modes/*.md` evaluation logic.

Google has transitioned consumer Gemini CLI access to Antigravity CLI. `GEMINI.md` is now a no-op compatibility guard so Antigravity does not duplicate the full project instructions when it reads both `AGENTS.md` and `GEMINI.md`.

### Native Antigravity CLI

```bash
# 1. Run in the career-ops directory
cd career-ops
agy

# 2. Use the unified /career-ops command with subcommands:
/career-ops "Senior AI Engineer at Anthropic..."
/career-ops pipeline
/career-ops scan
/career-ops pdf
/career-ops tracker
```

The skill is defined using the open standard in `.agents/skills/career-ops/SKILL.md` and symlinked/referenced for each supported CLI (e.g. `.claude/`, `.cursor/`, `.qwen/`, `.antigravitycli/`, `.grok/`).

## Codex Integration

career-ops supports Codex through the same shared router, but the invocation model is different from CLIs that auto-register slash commands. For the full guide, see [docs/CODEX.md](docs/CODEX.md).

### Interactive Codex

```bash
cd career-ops
codex
```

Slash commands are not guaranteed in Codex. If `/career-ops` is unavailable, ask Codex to run the mode directly in plain language:

```text
Evaluate this JD with career-ops auto-pipeline: https://company.com/jobs/123
Run the career-ops scan mode and summarize new matches.
Run the career-ops pipeline mode for data/pipeline.md.
Run the career-ops pdf mode for the latest evaluated role.
Run the career-ops tracker mode and summarize the current statuses.
```

### One-shot Codex (`codex exec`)

```bash
codex exec "Evaluate this JD with career-ops auto-pipeline: https://company.com/jobs/123"
codex exec "Run career-ops scan mode in this repo and summarize new matches."
codex exec "Run career-ops pipeline mode for data/pipeline.md."
codex exec "Run career-ops pdf mode for the latest evaluated role."
codex exec "Run career-ops tracker mode and summarize the current statuses."
```

## Grok Build CLI Integration

career-ops supports Grok Build CLI natively, the same way it supports Claude Code and OpenCode. `AGENTS.md` is auto-loaded as project rules, and all slash commands are available through the shared skill entrypoint.

### Native Grok Build CLI

```bash
# 1. Run in the career-ops directory
cd career-ops
grok

# 2. Use the unified /career-ops command with subcommands:
/career-ops "Senior AI Engineer at Anthropic..."
/career-ops pipeline
/career-ops scan
/career-ops pdf
/career-ops tracker
```

For headless batch workers, use `grok -p "prompt"` (add `--yolo` to auto-approve tool executions).

### Standalone Gemini API Script (No CLI install needed)

```bash
# 1. Get a free API key at https://aistudio.google.com/apikey
cp .env.example .env
# Edit .env, set GEMINI_API_KEY=your_key_here

# 2. Install dependencies
npm install

# 3. Evaluate a job description
node gemini-eval.mjs "We are looking for a Senior AI Engineer..."
node gemini-eval.mjs --file ./jds/my-job.txt
node agent-inbox.mjs add "..."   # queue a request for the next session
npm run gemini:eval -- "JD text here"
```

> **Free tier:** Both options work without billing. Native CLI uses Google OAuth; the API script uses `gemini-3.6-flash` (rate limits are model- and tier-dependent; see Google AI docs for current quotas).

## Usage

career-ops uses a shared command router. In CLIs that register slash commands, it looks like this:

```
/career-ops                → Show all available commands
/career-ops {paste a JD}   → Full auto-pipeline (evaluate + PDF + tracker)
/career-ops scan           → Scan portals for new offers
/career-ops pdf            → Generate ATS-optimized CV
/career-ops cover          → Cover letter generator (paste JD or /career-ops cover {slug})
/career-ops email          → Formal application email draft (draft-only; never sends, submits, or clicks)
/career-ops batch          → Batch evaluate multiple offers
/career-ops tracker        → View application status
/career-ops apply          → Fill application forms with AI
/career-ops outcome        → Record application outcome & archive artifacts
/career-ops pipeline       → Process pending URLs
/career-ops contacto       → Find hiring manager / recruiter / peer + draft a ≤300-char LinkedIn message per contact type
/career-ops deep           → Generate a structured 6-axis research prompt (AI strategy, recent moves, culture, challenges, competitors, candidate angle)
/career-ops training       → Evaluate a course/cert
/career-ops project        → Evaluate a portfolio project
```

Or just paste a job URL or description directly -- career-ops auto-detects it and runs the full pipeline.

In Codex, slash commands are not guaranteed. Use the same mode names in a prompt instead, or call them from `codex exec`.

## How It Works

```
You paste a job URL or description
        │
        ▼
┌──────────────────┐
│  Archetype       │  Classifies: LLMOps / Agentic / PM / SA / FDE / Transformation
│  Detection       │
└────────┬─────────┘
         │
┌────────▼─────────┐
│  A-G Evaluation  │  Match, gaps, comp research, STAR stories, legitimacy
│  (reads cv.md)   │
└────────┬─────────┘
         │
    ┌────┼────┐
    ▼    ▼    ▼
 Report  PDF  Tracker
  .md   .pdf  entry
```

## Pre-configured Portals

The scanner comes with **100+ companies** ready to scan and **45+ search queries** across major job boards. Copy `templates/portals.example.yml` to `portals.yml` and add your own:

**AI Labs:** Anthropic, OpenAI, Mistral, Cohere, LangChain, Pinecone
**Voice AI:** ElevenLabs, PolyAI, Parloa, Hume AI, Deepgram, Vapi, Bland AI
**AI Platforms:** Retool, Airtable, Vercel, Temporal, Glean, Arize AI
**Contact Center:** Ada, LivePerson, Sierra, Decagon, Talkdesk, Genesys
**Enterprise:** Salesforce, Twilio, Gong, Dialpad
**LLMOps:** Langfuse, Weights & Biases, Lindy, Cognigy, Speechmatics
**Automation:** n8n, Zapier, Make.com
**European:** Factorial, Attio, Tinybird, Clarity AI, Travelperk

**Job boards searched:** 55+ provider modules cover ATS APIs, board-wide feeds, XML/RSS feeds, markdown feeds, and local parsers. See [Supported job boards](docs/SUPPORTED_JOB_BOARDS.md) for the full table.

By default `node scan.mjs` (a.k.a. `npm run scan`) trusts what each ATS feed returns. Some companies leave stale postings in their public API even after the role is closed, so those expired entries can leak into `pipeline.md`. Pass `--verify` to launch Playwright after the API pass and drop expired postings before they hit the pipeline:

```bash
node scan.mjs --verify          # zero-token discovery + Playwright liveness check
```

The verification is sequential and only runs against new offers (after dedup), so the cost stays bounded.

## Dashboard TUI

The built-in terminal dashboard lets you browse your pipeline visually:

```bash
npm run serve:dashboard   # launch the TUI
npm run build:dashboard   # optional: build the standalone binary
```

Features: 6 filter tabs, 4 sort modes, grouped/flat view, lazy-loaded previews, inline status changes.

There is also an **experimental web UI** (alpha, opt-in — nothing runs unless you start it): see [`web/README.md`](web/README.md).

## Project Structure

```
career-ops/
├── AGENTS.md                    # Canonical agent instructions (all CLIs)
├── CLAUDE.md                    # Claude Code wrapper (imports AGENTS.md)
├── CODEX.md                     # Codex wrapper (imports AGENTS.md)
├── OPENCODE.md                  # OpenCode wrapper (imports AGENTS.md)
├── GEMINI.md                    # Legacy no-op guard to avoid Antigravity duplicate context
├── cv.md                        # Your CV (create this)
├── article-digest.md            # Your proof points (optional)
├── config/
│   └── profile.example.yml      # Template for your profile
├── modes/                       # Skill modes
│   ├── _shared.md               # Shared context (customize this)
│   ├── oferta.md                # Single evaluation
│   ├── pdf.md                   # PDF generation
│   ├── cover.md                 # Cover letter generation
│   ├── email.md                 # Formal application email drafts
│   ├── scan.md                  # Portal scanner
│   ├── batch.md                 # Batch processing
│   └── ...
├── templates/
│   ├── cv-template.html         # ATS-optimized CV template
│   ├── portals.example.yml      # Scanner config template
│   └── states.yml               # Canonical statuses
├── batch/
│   ├── batch-prompt.md          # Self-contained worker prompt
│   └── batch-runner.sh          # Orchestrator script
├── gmail-sync.mjs               # Gmail scanner input for reply-watch.mjs (fork addition)
├── outreach.mjs                 # LinkedIn + email outreach orchestrator (fork addition)
├── outreach-db.mjs              # SQLite layer for outreach leads (fork addition)
├── send-outreach.mjs            # Playwright LinkedIn connection sender (fork addition)
├── email-discover.mjs           # Email pattern guessing + SMTP verification (fork addition)
├── send-email.mjs               # Gmail SMTP outreach sender (fork addition)
├── dashboard/                   # Go TUI pipeline viewer
├── data/                        # Your tracking data (gitignored)
├── reports/                     # Evaluation reports (gitignored)
├── output/                      # Generated PDFs (gitignored)
├── fonts/                       # Space Grotesk + DM Sans
├── docs/                        # Setup, customization, budget guide, architecture
└── examples/                    # Sample CV, report, proof points
```

## Tech Stack

![Claude Code](https://img.shields.io/badge/Claude_Code-000?style=flat&logo=anthropic&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat&logo=playwright&logoColor=white)
![Go](https://img.shields.io/badge/Go-00ADD8?style=flat&logo=go&logoColor=white)
![Bubble Tea](https://img.shields.io/badge/Bubble_Tea-FF75B5?style=flat&logo=go&logoColor=white)

- **Agent**: AI coding CLI with shared skills and modes (`AGENTS.md` + CLI wrapper)
- **PDF**: Playwright + HTML template
- **Cover letters**: HTML template + Playwright (A4 PDF, same pipeline as CVs)
- **Scanner**: Playwright + Greenhouse API + WebSearch
- **Dashboard**: Go + Bubble Tea + Lipgloss (Catppuccin Mocha theme)
- **Data**: Markdown tables + YAML config + TSV batch files

## Also Open Source

- **[cv-santiago](https://github.com/santifer/cv-santiago)** -- The portfolio website (santifer.io) with AI chatbot, LLMOps dashboard, and case studies. If you need a portfolio to showcase alongside your job search, fork it and make it yours.

## FAQ

**What is career-ops?**
career-ops is an open-source, CLI-agnostic job-search command center. It turns any AI coding CLI into a pipeline that evaluates job offers against your CV, generates ATS-tailored PDFs, finds the right person to contact, and tracks everything in one place — while you keep the final decision. It is the first reference implementation of the CareerOps Manifesto. More at [career-ops.org](https://career-ops.org).

**Can I run career-ops for free, or on a cheaper / local model?**
Yes. career-ops is CLI-agnostic and runs on free and local models — via OpenRouter free models, Ollama, or any OpenAI-compatible endpoint — so you are not tied to a paid subscription. See [docs/RUNNING_ON_A_BUDGET.md](docs/RUNNING_ON_A_BUDGET.md) for the full setup.

**Which AI CLIs does career-ops work with?**
career-ops runs on any major AI coding CLI — Claude Code, Codex, Gemini / Antigravity, OpenCode, Grok, Qwen and more — through the open Agent Skill Standard, so it is never locked to a single vendor. Use the CLI you already have.

**How do I install career-ops on Windows?**
career-ops runs on Windows. If skills fail to load with a symlink error during install, the fix is in [docs/FAQ.md](docs/FAQ.md). Full steps are in [docs/SETUP.md](docs/SETUP.md).

**Does career-ops auto-apply to jobs for me?**
No. career-ops is a filter, not a spray-and-pray auto-applier. The AI evaluates, ranks and drafts; you review and decide. It never submits, sends, or clicks anything — you always have the final call. That human-in-the-loop design is the whole point.

**Is career-ops free and open source?**
Yes. career-ops is free and open source, and for the candidate it always will be — it is the first reference implementation of the [CareerOps Manifesto](https://career-ops.org/manifesto). Read it, and if it says what you believe, sign it.

## About

**The base system** was built by [Santiago Fernández de Valderrama Aparicio](https://santifer.io/about) (santifer) -- Head of Applied AI, former founder. He built career-ops to manage his own job search and used it to land his current role. Portfolio and other open source projects → [santifer.io](https://santifer.io). Curious how the upstream repo is maintained in ~4 hours a week? [Agentic maintenance: how career-ops is run by a fleet of AI agents](https://santifer.io/ai-agent-fleet).

**This fork** is maintained by Yuvraj Singh -- SDE-1, building agentic AI/LLM systems and full-stack backends. I extended career-ops with the Gmail reply sync and outreach pipeline described above while running my own job search at real volume against the India market. [LinkedIn](https://www.linkedin.com/in/yuvraj3905/) · [GitHub](https://github.com/Yuvraj3905)

## Disclaimer

**career-ops is a local, open-source tool, NOT a hosted service.** By using this software, you acknowledge:

1. **You control your data.** Your CV, contact info, and personal data stay on your machine and are sent directly to the AI provider you choose (Anthropic, OpenAI, etc.). We do not collect, store, or have access to any of your data.
2. **You control the AI.** The default prompts instruct the AI not to auto-submit applications, but AI models can behave unpredictably. If you modify the prompts or use different models, you do so at your own risk. **Always review AI-generated content for accuracy before submitting.**
3. **You comply with third-party ToS.** You must use this tool in accordance with the Terms of Service of the career portals you interact with (Greenhouse, Lever, Workday, LinkedIn, etc.). Do not use this tool to spam employers or overwhelm ATS systems.
4. **No guarantees.** Evaluations are recommendations, not truth. AI models may hallucinate skills or experience. The authors are not liable for employment outcomes, rejected applications, account restrictions, or any other consequences.

See [LEGAL_DISCLAIMER.md](LEGAL_DISCLAIMER.md) for full details. This software is provided under the [MIT License](LICENSE) "as is", without warranty of any kind.

Contributions to the base evaluation/CV/scan system belong upstream — see [santifer/career-ops](https://github.com/santifer/career-ops) and its [contributors](https://github.com/santifer/career-ops/graphs/contributors).

## License & Trademark

The code is licensed under [MIT](LICENSE). The "career-ops" name and
brand are governed by the [Trademark Policy](TRADEMARK.md), permissive
for community use, reserved for commercial product naming and
endorsement.

## Let's Connect

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/yuvraj3905/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Yuvraj3905)
[![Email](https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:yuvraj202001@gmail.com)

Questions about the base system, or want to contribute to it? → [santifer/career-ops](https://github.com/santifer/career-ops) · [Discord](https://discord.gg/8pRpHETxa4)
