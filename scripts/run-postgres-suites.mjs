#!/usr/bin/env node
/**
 * Runner for Rico PostgreSQL Concurrency, Fault-Injection & Scheduled Sentinel Suites
 * Requires TEST_DATABASE_URL pointing to a local PostgreSQL 16+ instance.
 */
import { spawnSync } from "node:child_process";
import { appendFileSync } from "node:fs";

const rootDir = process.cwd();
const testDbUrl = process.env.TEST_DATABASE_URL;

if (!testDbUrl) {
  console.error("❌ TEST_DATABASE_URL is required (e.g. postgres://postgres:postgres@127.0.0.1:5432/postgres)");
  process.exit(1);
}

const suites = [
  {
    name: "PostgreSQL Runtime & Cross-Tenant Route Isolation (22 cases)",
    file: "src/lib/safety/postgres-runtime.test.ts",
  },
  {
    name: "PostgreSQL Payment Reservation, Concurrency & Trigger Rollbacks (17 cases)",
    file: "src/lib/safety/payment-reservation.pg.test.ts",
  },
  {
    name: "Guarded Payment Paths E2E (PostgreSQL + SQLite + Mock PayPal HTTP, 26 cases)",
    file: "src/lib/safety/guarded-payment.pg.test.ts",
  },
  {
    name: "Scheduled Sentinel Cron, Advisory Locks & Replay Protection (16 cases)",
    file: "src/lib/sentinel/sentinel-cron.test.ts",
  },
];

const results = [];
let failedCount = 0;

console.log("==================================================");
console.log(`🐘 Running ${suites.length} Real PostgreSQL Chaos & Concurrency Suites`);
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
        TEST_DATABASE_URL: testDbUrl,
      },
    }
  );
  const durationMs = Date.now() - start;
  const passed = proc.status === 0;
  if (!passed) failedCount++;
  results.push({ ...suite, passed, durationMs });
}

console.log("\n==================================================");
console.log("🐘 PostgreSQL Test Suite Summary");
console.log("==================================================");
for (const r of results) {
  const badge = r.passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${badge} | ${(r.durationMs / 1000).toFixed(2)}s | ${r.name}`);
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    "### 🐘 Gate 3: Real PostgreSQL 16 Concurrency & Trigger Fault-Injection Suites",
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
  console.error(`\n❌ ${failedCount} of ${suites.length} PostgreSQL suite(s) FAILED.`);
  process.exit(1);
} else {
  console.log(`\n🎉 All ${suites.length} PostgreSQL Chaos & Concurrency Suites PASSED!`);
  process.exit(0);
}
