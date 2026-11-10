# ⚡ Rico — Enterprise Autonomous Financial & Agentic Commerce Platform

[![CI/CD Pipeline](https://github.com/abrarnasirjaffari/Rico/actions/workflows/ci.yml/badge.svg)](https://github.com/abrarnasirjaffari/Rico/actions/workflows/ci.yml)
[![CodeQL Security](https://github.com/abrarnasirjaffari/Rico/actions/workflows/codeql.yml/badge.svg)](https://github.com/abrarnasirjaffari/Rico/actions/workflows/codeql.yml)
[![Node.js >= 22.12](https://img.shields.io/badge/node-%3E%3D22.12.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript 5.0](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Rico** is an enterprise-grade, open-source autonomous financial operations (FinOps) and agentic commerce platform. It unifies **multi-model AI reasoning** (Google Gemini & DeepSeek), **real headless Chromium browser automation** (Playwright CDP), **cryptographically confirmed payment execution** (PayPal Orders v2, Vault v3 & MCP), and **database-enforced financial guardrails** (SQLite & PostgreSQL).

Instead of passive spending dashboards or unguarded AI tool calls, Rico lets individuals and finance teams define **strictly bounded financial mandates** in natural language while guaranteeing that **no AI model or unverified webhook can ever bypass budget ceilings, billing-period idempotency, or human confirmation rules.**

🔗 **Architecture Board:** [Miro System Architecture](https://miro.com/app/board/uXjVETEzN_g=/)  
🐙 **Repository:** [github.com/abrarnasirjaffari/Rico](https://github.com/abrarnasirjaffari/Rico)

---

## 📖 Table of Contents

1. [System Architecture](#-system-architecture)
2. [Core Subsystems & Capabilities](#-core-subsystems--capabilities)
3. [Monorepo Directory Structure](#-monorepo-directory-structure)
4. [Quickstart & Local Development](#-quickstart--local-development)
5. [Database Modes: SQLite vs. PostgreSQL](#-database-modes-sqlite-vs-postgresql)
6. [Testing & Verification Matrix](#-testing--verification-matrix)
7. [Contributing & AI ("Vibe-Coding") Engineering Standards](#-contributing--ai-vibe-coding-engineering-standards)
8. [6-Gate Automated CI/CD Pipeline](#-6-gate-automated-cicd-pipeline)
9. [Production Deployment & Scheduled Monitoring](#-production-deployment--scheduled-monitoring)
10. [Security Model](#-security-model)
11. [License](#-license)

---

## 🏗️ System Architecture

```text
[ Web Command Center / Telegram / WhatsApp / Slack ]
                         │
                         ▼
     ┌───────────────────────────────────────┐
     │     1. Multi-Agent Reasoning Core     │
     │  • Gemini 3.8 Flash (Interactive)     │
     │  • DeepSeek V3/R1 (Batch & Reasoning) │
     │  • Modular SKILL.md Runtime Injector  │
     └───────────────────┬───────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌───────────────┐ ┌──────────────┐ ┌───────────────┐
│ 2. Playwright │ │ 3. FinOps &  │ │ 4. Universal  │
│ Browser Engine│ │ Savings Core │ │ MCP Hub       │
│ • Live CDP    │ │ • Credits    │ │ • PayPal MCP  │
│ • Price DOM   │ │ • Discounts  │ │ • GitHub/Slack│
│   Extraction  │ │ • OCR & Tax  │ │ • Notion/Stripe│
└───────┬───────┘ └──────┬───────┘ └───────┬───────┘
        └────────────────┼─────────────────┘
                         ▼
     ┌───────────────────────────────────────┐
     │   5. Financial Safety & Reservation   │
     │  • Tier 1: Hard Budget Ceiling Block  │
     │  • Tier 2: >20% Price Spike Hold      │
     │  • Tier 3: Two-Step confirmToken HMAC │
     │  • Tier 4: PG Row Lock & Idempotency  │
     └───────────────────┬───────────────────┘
                         ▼
     ┌───────────────────────────────────────┐
     │  6. Dual-Rail Payment Execution       │
     │  • Primary: PayPal Orders v2 & MCP    │
     │  • Backup: Vaulted Visa / Mastercard  │
     │  • AG Grid Audit & Telemetry Center   │
     └───────────────────────────────────────┘
```

---

## 🌟 Core Subsystems & Capabilities

### 1. 🛡️ Multi-Tier Financial Guardrail & Atomic Reservation Engine (`src/lib/safety/`, `src/lib/payments/`)
- **Two-Step Quote & Confirm Flow:** AI chat tools (`execute_paypal_payment`) **never** capture money directly. They generate a server-verified quote and a short-lived HMAC-signed `confirmToken` (`/api/payments/quote` ➔ `/api/payments/execute`).
- **Billing-Period Idempotency:** Every mandate enforces a deterministic period key (`period:<mandateId>:YYYY-MM`, `YYYY-Www`, `YYYY-Qn`, or `YYYY`). Concurrent requests across multiple database pools cannot double-charge a mandate within the same billing cycle.
- **Fail-Closed Reconciliation:** If a network timeout or 5xx occurs during PayPal capture, the reservation stays `PENDING` (`NEEDS_RECONCILIATION`) and blocks all retries until reconciled—preventing blind double-captures.

### 2. 🌐 Headless Chromium Browser Engine (`src/lib/browser/`)
- Launches real headless Chromium instances via Playwright to navigate merchant pricing pages, extract live DOM pricing, stream 30FPS CDP screencast frames to the UI, and run concurrent multi-site price verification workers.
- Strictly separates `live_browser` verified prices from `cache_fallback` baselines so scheduled audits never trigger false holds on unverified cache data.

### 3. 💳 Dual-Rail PayPal Orders v2, Vault v3 & Universal MCP (`src/lib/paypal/`, `src/lib/mcp/`)
- **Primary Rail:** PayPal Orders v2 with deterministic `PayPal-Request-Id` idempotency headers and `Prefer: return=representation`.
- **Secondary Backup Rail:** Zero-knowledge tokenized Visa/Mastercard failover via PayPal Vault and Stripe backup adapters.
- **Universal MCP Registry:** Built-in Model Context Protocol client and dynamic server registry supporting PayPal, GitHub, Slack, Notion, Stripe, and custom HTTP/SSE MCP endpoints with automatic token redaction.

### 4. 📱 24/7 Price Sentinel & Omnichannel Callbacks (`src/lib/sentinel/`)
- Background price auditing (`POST /api/cron/sentinel`) protected by PostgreSQL transactional advisory locks (`pg_advisory_xact_lock`) so overlapping cron triggers never run duplicate scrapes or alerts.
- Interactive two-way webhook handlers for **Telegram**, **WhatsApp Cloud API**, and **Slack Block Kit** (`Approve One-Time`, `Pay with Backup Card`, `1-Click Cancel`).

### 5. 🧾 FinOps Intelligence: Savings, Credits, Bulk OCR & Contract Watchdog
- **Persona Savings & Startup Credit Matcher (`src/lib/savings/`, `src/lib/credits/`):** Matches founder, student, and developer profiles against $300k+ in verified cloud/SaaS credits (AWS Activate, PostHog, Notion, GitHub Student Pack) and drafts application essays.
- **Bulk Invoice OCR & IRS Tax Engine (`src/lib/ocr/`):** Decomposes multi-currency (USD/EUR/GBP) receipts into line items, verifies mathematical integrity, matches active mandates, and classifies IRS Schedule C deductions (100% SaaS vs. 50% business meals).
- **Contract & Subscription Watchdog (`src/lib/watchdog/`):** Detects 24-hour free-trial expirations, 60-day annual auto-renewal lock-in windows, and wasted "zombie seat" licenses across parallel worker pools (`src/lib/batch/`).
- **Modular `SKILL.md` Runtime Injector (`src/lib/skills/`, `skills/`):** Parses domain skills from Markdown/YAML frontmatter and dynamically injects high-confidence domain rules into agent prompts.

---

## 📂 Monorepo Directory Structure

```text
Rico/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                  # 6-Gate Battle-Tested CI/CD Pipeline & PR Diagnostic Bot
│   │   ├── codeql.yml              # CodeQL SAST Security Analysis
│   │   └── sentinel-cron.yml       # Scheduled Daily Price Sentinel Trigger
│   ├── CODEOWNERS                  # Mandatory review rules for safety, payment & DB paths
│   ├── dependabot.yml              # Weekly automated dependency security updates
│   └── pull_request_template.md    # Contributor pre-review verification checklist
├── drizzle/
│   ├── pg/                         # PostgreSQL schema migrations & payment reservation indexes
│   └── sqlite-manual/              # SQLite foreign-key & mandate ownership migrations
├── scripts/
│   ├── ci-guardrails.mjs           # Fast static architectural & security guardrail verifier
│   ├── run-sqlite-suites.mjs       # Ephemeral SQLite runner for all 23 unit/subsystem suites
│   └── run-postgres-suites.mjs     # Real PostgreSQL 16 concurrency & fault-injection runner
├── skills/                         # Built-in domain SKILL.md definitions (OCR, pitch, discounts)
├── src/
│   ├── app/                        # Next.js 14 App Router UI & 35+ REST/SSE API routes
│   ├── components/                 # Dashboard, AG Grid tables, Zephium workspace & shadcn/ui
│   ├── db/                         # Dual Drizzle ORM layer (SQLite default + PostgreSQL)
│   └── lib/                        # Core engines (safety, payments, paypal, auth, sentinel, mcp,
│                                   # gemini, deepseek, browser, batch, ocr, watchdog, credits, skills)
├── website/                        # Standalone Next.js 14 marketing, docs, workflows & pricing app
├── package.json                    # Root dependencies, scripts & test runners
└── render.yaml                     # Turnkey Render cloud deployment blueprint
```

---

## 🚀 Quickstart & Local Development

### Prerequisites
- **Node.js `>= 22.12.0`** *(Required: `src/db/postgres.ts` uses Node's synchronous `process.getBuiltinModule("module")` introduced in Node 22.12)*.
- **npm `>= 10.x`**
- *(Optional)* **PostgreSQL 16+** if running PostgreSQL concurrency suites locally.

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/abrarnasirjaffari/Rico.git
cd Rico

# Install core platform dependencies
npm install

# Install standalone documentation/marketing website dependencies
npm --prefix website install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env.local
```
By default, Rico runs out-of-the-box in **local SQLite + High-Fidelity Sandbox Simulator Mode** without requiring paid external API keys. To connect live sandbox services, configure `.env.local`:

| Variable | Required In Prod | Description |
| :--- | :---: | :--- |
| `DATABASE_PROVIDER` | Yes | `"sqlite"` (default local) or `"postgres"` (never falls back to SQLite). |
| `DATABASE_URL` | SQLite only | Path to SQLite file (default `./sqlite.db`). |
| `SUPABASE_DATABASE_URL` | Postgres only | PostgreSQL connection string when `DATABASE_PROVIDER=postgres`. |
| `AUTH_SECRET` | Yes | 32+ char secret used to sign `rico_auth_session` and `confirmToken` HMACs. |
| `PAYPAL_MODE` | Yes | `"mock"` for deterministic simulator or `"real"` for PayPal Sandbox HTTP API. |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | Real PayPal | PayPal Developer Sandbox credentials (`PAYPAL_ENVIRONMENT=sandbox`). |
| `GEMINI_API_KEY` | Optional | Google Gemini API key (falls back to deterministic simulator if omitted). |
| `CRON_SECRET` | Optional | 32+ char Bearer secret for `POST /api/cron/sentinel` scheduled audits. |

### 3. Start the Development Servers
```bash
# Start Core Financial Platform & Agent Command Center (http://localhost:3000)
npm run dev

# In a second terminal, start the Website & Documentation App (http://localhost:3001)
npm run dev:website
```

---

## 🗄️ Database Modes: SQLite vs. PostgreSQL

Rico's data layer (`src/db/index.ts`) supports two strict providers:
1. **SQLite Mode (`DATABASE_PROVIDER=sqlite`):** Default for instant local development and zero-config evaluations. Uses `better-sqlite3` in WAL mode with `foreign_keys = ON`.
2. **PostgreSQL Mode (`DATABASE_PROVIDER=postgres`):** Production multi-tenant mode backed by `postgres` + Drizzle ORM (`src/db/schema.pg.ts`).
   - Enforces partial unique indexes on `transactions` (`transactions_mandate_pending_uq`) to guarantee only one in-flight payment per mandate at the database level.
   - Uses `SELECT ... FOR UPDATE` row-level locking on `mandates` inside `src/lib/safety/payment-reservation.pg.ts`.
   - **Strict Rule:** Production code in `src/` must **never** call synchronous SQLite methods (`.run()`, `.get()`, `.all()`). All Drizzle queries must be `await`ed so they work identically across both SQLite and PostgreSQL.

---

## 🧪 Testing & Verification Matrix

Rico includes **130+ automated test cases across 29 test suites**. Run the full local pre-flight check (guardrails + dual typecheck + dual ESLint + all 23 isolated SQLite suites) with a single command:

```bash
npm test
```

### Individual Test Commands

| Command | Scope | What It Verifies |
| :--- | :--- | :--- |
| `npm run check:guardrails` | Static / Security | Node >=22.12 check, zero `.run()/.get()/.all()` in prod code, zero `@ts-ignore` in safety/payment paths, zero secret leaks. |
| `npm run typecheck` | TypeScript | Runs `tsc --noEmit` across both root `Rico` and `website/`. |
| `npm run lint:all` | ESLint | Runs `next lint` across both root `Rico` and `website/`. |
| `npm run test:ci:sqlite` | 23 Suites (SQLite) | Runs all 23 unit, guardrail, PayPal stub, ownership isolation, AI agent, MCP, OCR, watchdog, credits & omnichannel suites against an ephemeral temp DB. |
| `npm run test:ci:postgres` | 4 Suites (81 PG Cases) | Runs `test:postgres-runtime`, `test:payment-pg`, `test:payment-paths`, and `test:sentinel-cron` against a real PostgreSQL 16 server (`TEST_DATABASE_URL`). |
| `npm run build:auth-test && npm run test:supabase-auth` | 32 Cases (E2E Server) | Builds production Next.js bundle, boots `next start` with a local GoTrue auth server, and tests login, refresh rotation, cookie tampering & payment confirmation. |
| `npm run test:browser` | 5 Cases (Playwright) | Launches headless Chromium to verify DOM price scraping and parallel helper bots. |

---

## 🤝 Contributing & AI ("Vibe-Coding") Engineering Standards

We welcome contributions from humans and AI coding agents alike! Because AI tools can inadvertently introduce subtle financial regressions or type-safety shortcuts, **every Pull Request is automatically audited before maintainer review.**

### Mandatory Rules for All Contributors & AI Agents

1. **Never Use SQLite-Only Synchronous Calls in Production Code:**
   - Do **not** use `.run()`, `.get()`, or `.all()` on Drizzle queries in `src/` outside of test files. Always `await` Drizzle queries so PostgreSQL compatibility is preserved.
2. **Zero Type-Safety Suppressions in Critical Paths:**
   - `@ts-ignore`, `@ts-nocheck`, and `@ts-expect-error` are strictly blocked by `scripts/ci-guardrails.mjs` inside `src/lib/safety/`, `src/lib/payments/`, `src/lib/paypal/`, `src/lib/auth/`, and `src/app/api/payments/`.
3. **Never Bypass Two-Step Payment Confirmation:**
   - New UI actions, chat tools, or webhooks must never capture payments directly or write raw records to `/api/transactions`. All user-initiated mandate runs must go through `/api/payments/quote` and `/api/payments/execute` with a server-signed `confirmToken`, and all payment captures must pass through `executeAtomicPaymentTransaction`.
4. **Never Mutate `sqlite.db` in Commits:**
   - Do not commit changes to `sqlite.db`. Always use `npm run test:ci:sqlite` (which uses an isolated temporary SQLite file) or reset `sqlite.db` via `git checkout -- sqlite.db` before committing.
5. **Verify Both Apps When Touching Shared Types or Assets:**
   - Always run `npm test` and `npm run build:website` locally before pushing your branch.

---

## 🛡️ 6-Gate Automated CI/CD Pipeline

Every Pull Request and every merge to `main` automatically triggers `.github/workflows/ci.yml`:

```text
[ PR Opened / Synchronized or Push to main ]
                     │
   ┌─────────────────┼─────────────────┬──────────────────────┬──────────────────────┐
   ▼                 ▼                 ▼                      ▼                      ▼
[Gate 1]          [Gate 2]          [Gate 3]               [Gate 4]               [Gate 5]
Static Guardrails 23 Isolated       PostgreSQL 16          Dual Next.js Build     Playwright
TS + ESLint       SQLite Suites     Concurrency & Chaos    + Live Auth E2E        Chromium DOM
   │                 │                 │                      │                      │
   └─────────────────┴─────────────────┴──────────┬───────────┴──────────────────────┘
                                                  ▼
                                     [ Gate 6: ci-gate Verdict ]
                            • Posts diagnostic table comment on the PR
                            • Gives exact local repro command if any gate fails
                            • Unlocks merge to main only when all 5 gates pass
```

If any check fails on your PR, the **Rico Automated Pipeline Verdict Bot** will comment directly on your PR with the failing gate and the exact command to reproduce and fix it locally.

---

## ☁️ Production Deployment & Scheduled Monitoring

### Deploying on Render
Rico includes a declarative `render.yaml` Blueprint:
1. Push or fork this repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), select **New +** ➔ **Blueprint** and connect your repository.
3. Configure your secret environment variables (`AUTH_SECRET`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `GEMINI_API_KEY`, `CRON_SECRET`, and `SUPABASE_DATABASE_URL` if running in PostgreSQL mode).
4. Set **Auto-Deploy** to **After CI Checks Pass**.

### Scheduled 24/7 Price Sentinel Monitoring
Rico's background price auditor (`POST /api/cron/sentinel`) is triggered externally so it works cleanly on serverless and container platforms:
- Set `CRON_SECRET` (at least 32 characters, e.g., `openssl rand -hex 32`) on your production server.
- Add `RICO_PRODUCTION_URL` and `CRON_SECRET` to your GitHub Repository Secrets (`Settings` ➔ `Secrets and variables` ➔ `Actions`).
- `.github/workflows/sentinel-cron.yml` will automatically invoke `POST /api/cron/sentinel` daily at `06:00 UTC` (or on-demand via `workflow_dispatch`). Audits only inspect prices and raise anomaly holds/alerts—**monitoring never executes payments.**

---

## 🔒 Security Model

- **Zero-Knowledge Card Vaulting:** Payment card numbers and CVVs are isolated inside hosted payment frames and tokenized vault rails; raw PANs are never exposed to LLM prompts or application logs.
- **Sealed HttpOnly Session & Refresh Cookies:** Supabase access and refresh tokens are never exposed to browser JavaScript (`accessToken: ""` in JSON responses) and are sealed inside HMAC-SHA256 / AES-GCM `HttpOnly; Secure; SameSite=Lax` cookies (`src/lib/auth/`).
- **Cross-Tenant Mandate Isolation:** Every mandate, transaction, audit log, and Sentinel alert is strictly bound to its verified `owner_id` foreign key and enforced across every API route.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for full details.
