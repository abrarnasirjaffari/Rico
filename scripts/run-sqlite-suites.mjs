#!/usr/bin/env node
/**
 * Isolated Runner for All Rico Unit, Subsystem & SQLite Guardrail Test Suites
 * Uses an ephemeral SQLite database so the tracked sqlite.db is never mutated.
 * Writes a detailed Markdown report to GITHUB_STEP_SUMMARY when running in CI.
 */
import { spawnSync } from "node:child_process";
import { appendFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

const rootDir = process.cwd();
const tempDir = mkdtempSync(path.join(os.tmpdir(), "rico-ci-sqlite-"));
const sqlitePath = path.join(tempDir, "ci-test.db");

// Initialize clean SQLite database with full schema + owner_id foreign key migration
const raw = new Database(sqlitePath);
raw.pragma("journal_mode = WAL");
raw.pragma("foreign_keys = ON");
raw.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE mandates (
    id TEXT PRIMARY KEY,
    service TEXT NOT NULL,
    budget_ceiling REAL NOT NULL,
    last_scraped_price REAL NOT NULL DEFAULT 0,
    recurrence TEXT NOT NULL,
    next_run TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    category TEXT NOT NULL DEFAULT 'Subscription',
    currency TEXT NOT NULL DEFAULT 'USD',
    strict_mode INTEGER NOT NULL DEFAULT 0,
    merchant_url TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    mandate_id TEXT REFERENCES mandates(id) ON DELETE SET NULL,
    order_id TEXT NOT NULL,
    idempotency_key TEXT,
    service TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'PENDING',
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    receipt_data TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    mandate_id TEXT REFERENCES mandates(id) ON DELETE SET NULL,
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    event_type TEXT NOT NULL,
    service TEXT NOT NULL,
    details TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info',
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);
raw.exec(
  readFileSync(
    path.join(rootDir, "drizzle", "sqlite-manual", "0001_add_mandate_owner.sql"),
    "utf8"
  )
);
raw.close();

const suites = [
  { name: "Payment Intent & UI Bypass Guards", file: "src/lib/payments/payment-intent.test.ts" },
  { name: "PayPal Provider HTTP Safety (24 cases)", file: "src/lib/paypal/provider-safety.test.ts" },
  { name: "Multi-Tenant Mandate Ownership Isolation", file: "src/lib/safety/mandate-ownership.test.ts" },
  { name: "Financial Guardrails & Anomaly Engine", file: "src/lib/safety/test.ts" },
  { name: "Atomic Transaction & Double-Billing Mutex", file: "src/lib/safety/atomic-transaction.test.ts" },
  { name: "PayPal Orders v2, Vault & Dual-Rail Failover", file: "src/lib/paypal/test.ts" },
  { name: "Gemini 3.8 Flash Agent & Tool Dispatcher", file: "src/lib/gemini/test.ts" },
  { name: "DeepSeek-V3/R1 Client & Rate Limiter", file: "src/lib/deepseek/test.ts" },
  { name: "Supabase Session Bridge & HMAC Cookies", file: "src/lib/auth/test.ts" },
  { name: "PostHog Telemetry & Cost Observability", file: "src/lib/telemetry/test.ts" },
  { name: "24/7 Price Sentinel & Omnichannel Callbacks", file: "src/lib/sentinel/test.ts" },
  { name: "Telegram Two-Way Interactive Webhook", file: "src/lib/sentinel/telegram.test.ts" },
  { name: "WhatsApp Cloud & Slack Block Kit Handlers", file: "src/lib/sentinel/omnichannel-handlers.test.ts" },
  { name: "Persona Savings & Startup Credits Optimizer", file: "src/lib/savings/test.ts" },
  { name: "Priority Batch Queue & Worker Pool", file: "src/lib/batch/test.ts" },
  { name: "Bulk Invoice OCR & IRS Tax Deduction Rules", file: "src/lib/ocr/test.ts" },
  { name: "Contract & Subscription Watchdog Engine", file: "src/lib/watchdog/test.ts" },
  { name: "Startup Credit & Grant Matcher Engine", file: "src/lib/credits/test.ts" },
  { name: "Adversarial Guardrail Simulation Harness", file: "src/lib/simulation/test.ts" },
  { name: "Universal MCP Client & Tool Discovery", file: "src/lib/mcp/test.ts" },
  { name: "External MCP Adapters (Slack/GitHub/Notion/Stripe)", file: "src/lib/mcp/adapters/test.ts" },
  { name: "MCP Server Registry & Endpoint Health", file: "src/lib/mcp/registry.test.ts" },
  { name: "Modular SKILL.md Parser & Runtime Injector", file: "src/lib/skills/test.ts" },
];

const results = [];
let failedCount = 0;

console.log("==================================================");
console.log(`🧪 Running ${suites.length} Isolated Unit & SQLite Suites`);
console.log("==================================================");

for (const suite of suites) {
  const start = Date.now();
  console.log(`\n▶ Running: ${suite.name} (${suite.file})...`);
  const proc = spawnSync(
    process.execPath,
    ["--import", "tsx", suite.file],
    {
      cwd: rootDir,
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "test",
        DATABASE_PROVIDER: "sqlite",
        DATABASE_URL: sqlitePath,
        PAYPAL_MODE: "mock",
        PAYPAL_ENVIRONMENT: "sandbox",
        AUTH_SECRET: "ci-test-only-secret-key-32-chars-minimum",
        GEMINI_API_KEY: "",
        DEEPSEEK_API_KEY: "",
        POSTHOG_API_KEY: "",
        NEXT_PUBLIC_POSTHOG_KEY: "",
        TELEGRAM_BOT_TOKEN: "",
      },
    }
  );
  const durationMs = Date.now() - start;
  const passed = proc.status === 0;
  if (!passed) failedCount++;
  results.push({ ...suite, passed, durationMs });
}

try {
  rmSync(tempDir, { recursive: true, force: true });
} catch {}

console.log("\n==================================================");
console.log("📊 Unit & SQLite Test Suite Summary");
console.log("==================================================");
for (const r of results) {
  const badge = r.passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${badge} | ${(r.durationMs / 1000).toFixed(2)}s | ${r.name}`);
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    "### 🧪 Gate 2: Unit, Subsystem & SQLite Isolation Suites",
    "| Status | Suite | File | Duration |",
    "| :---: | :--- | :--- | :---: |",
    ...results.map(
      (r) =>
        `| ${r.passed ? "✅ PASS" : "❌ FAIL"} | **${r.name}** | \`${r.file}\` | ${(r.durationMs / 1000).toFixed(2)}s |`
    ),
    "",
  ];
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n"));
}

if (failedCount > 0) {
  console.error(`\n❌ ${failedCount} of ${suites.length} suite(s) FAILED.`);
  process.exit(1);
} else {
  console.log(`\n🎉 All ${suites.length} Unit & SQLite Suites PASSED!`);
  process.exit(0);
}
