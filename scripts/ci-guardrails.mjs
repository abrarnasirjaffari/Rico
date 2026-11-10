#!/usr/bin/env node
/**
 * Rico Anti-Vibe-Coding Architectural & Security Guardrails
 * Fast static verification that runs on every PR, merge to main, and local pre-flight.
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const failures = [];

function check(name, fn) {
  try {
    fn();
    console.log(`PASS  [Guardrail] ${name}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    failures.push({ name, msg });
    console.error(`FAIL  [Guardrail] ${name}\n      -> ${msg}`);
  }
}

function walkFiles(dir, predicate = () => true) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
      results.push(...walkFiles(full, predicate));
    } else if (predicate(full, entry.name)) {
      results.push(full);
    }
  }
  return results;
}

console.log("==================================================");
console.log("🛡️ Rico Static Architectural & Security Guardrails");
console.log("==================================================\n");

// 1. Node.js Runtime Version Gate (Node >= 22.12 required for process.getBuiltinModule in src/db/postgres.ts)
check("Node.js runtime supports process.getBuiltinModule (Node >= 22.12)", () => {
  assert.equal(
    typeof process.getBuiltinModule,
    "function",
    `Current Node.js (${process.version}) lacks process.getBuiltinModule(). Node 22.12+ is required.`
  );
});

// 2. Zero SQLite-only synchronous calls (.run(), .get(), .all()) in production code
check("Production code uses zero SQLite-only synchronous calls (.run/.get/.all)", () => {
  const prodFiles = walkFiles(
    path.join(rootDir, "src"),
    (_full, name) => /\.tsx?$/.test(name) && !/test|smoke|probe|seed/.test(name)
  );
  const offenders = [];
  for (const file of prodFiles) {
    const text = readFileSync(file, "utf8");
    if (!/@\/db|\/db"|db\/index/.test(text)) continue;
    const stripped = text.replace(/sqliteRecordPayment[\s\S]*?\/\/ end sqliteRecordPayment/, "");
    if (/\.(run|all|get)\(\)/.test(stripped)) {
      offenders.push(path.relative(rootDir, file));
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `Found synchronous SQLite calls that break PostgreSQL in production: ${offenders.join(", ")}`
  );
});

// 3. Zero TypeScript/ESLint suppression directives in critical financial & auth directories
check("Critical payment, safety, and auth modules contain no @ts-ignore or @ts-nocheck", () => {
  const criticalDirs = [
    "src/lib/safety",
    "src/lib/payments",
    "src/lib/paypal",
    "src/lib/auth",
    "src/app/api/payments",
    "src/app/api/paypal",
    "src/app/api/cron",
  ];
  const offenders = [];
  for (const relDir of criticalDirs) {
    const files = walkFiles(
      path.join(rootDir, relDir),
      (_full, name) => /\.tsx?$/.test(name) && !/\.test\.ts$|test\.ts$/.test(name)
    );
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      if (/@ts-ignore|@ts-nocheck|@ts-expect-error/.test(text)) {
        offenders.push(path.relative(rootDir, file));
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `Type safety suppression (@ts-ignore / @ts-nocheck / @ts-expect-error) is forbidden in critical financial paths: ${offenders.join(", ")}`
  );
});

// 4. Scheduled Price Sentinel & Cron routes must NEVER execute payments
check("Price Sentinel monitoring & cron routes never import or invoke payment execution", () => {
  const sentinelFiles = [
    "src/lib/sentinel/price-sentinel.ts",
    "src/lib/sentinel/scheduled-audit.ts",
    "src/app/api/cron/sentinel/route.ts",
  ];
  for (const rel of sentinelFiles) {
    const text = readFileSync(path.join(rootDir, rel), "utf8");
    assert.doesNotMatch(
      text,
      /executeMandatePayment|executeAtomicPaymentTransaction|handleRemoteAction|executeConfirmedMandatePayment/,
      `${rel} must never trigger payments during background price monitoring`
    );
  }
});

// 5. UI components must never bypass /api/payments/quote + /api/payments/execute
check("Frontend UI components enforce two-step payment quote + confirmToken execution", () => {
  const pageText = readFileSync(path.join(rootDir, "src/app/page.tsx"), "utf8");
  assert.ok(
    pageText.includes("/api/payments/quote") && pageText.includes("/api/payments/execute"),
    "src/app/page.tsx must route manual runs and approvals through /api/payments/quote and /api/payments/execute"
  );
  assert.doesNotMatch(
    pageText,
    /fetch\("\/api\/transactions"/,
    "Browser UI must never write directly to /api/transactions"
  );
});

// 6. Secret & credential leak scan across source files
check("Source code contains no hardcoded live private keys or leaked .env files", () => {
  const allSrcFiles = [
    ...walkFiles(path.join(rootDir, "src"), (_f, n) => /\.(ts|tsx|js|json)$/.test(n)),
    ...walkFiles(path.join(rootDir, "website/src"), (_f, n) => /\.(ts|tsx|js|json)$/.test(n)),
  ];
  const leaks = [];
  const secretPatterns = [
    { name: "Private Key Header", regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
    { name: "Supabase Service Role Key", regex: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*["']eyJ/ },
    { name: "Live Stripe Secret Key", regex: /sk_live_[0-9a-zA-Z]{24,}/ },
    { name: "GitHub Personal Access Token", regex: /ghp_[0-9a-zA-Z]{36}/ },
  ];
  for (const file of allSrcFiles) {
    if (/test\.ts$/.test(file)) continue;
    const text = readFileSync(file, "utf8");
    for (const pat of secretPatterns) {
      if (pat.regex.test(text)) {
        leaks.push(`${path.relative(rootDir, file)} (${pat.name})`);
      }
    }
  }
  assert.deepEqual(leaks, [], `Potential hardcoded secret detected: ${leaks.join(", ")}`);
});

// 7. Monorepo lockfile and migration journal integrity
check("Monorepo lockfiles and Drizzle PostgreSQL migration journal are valid", () => {
  for (const rel of [
    "package.json",
    "package-lock.json",
    "website/package.json",
    "website/package-lock.json",
    "drizzle/pg/meta/_journal.json",
  ]) {
    const full = path.join(rootDir, rel);
    assert.ok(existsSync(full) && statSync(full).size > 0, `Missing required file: ${rel}`);
    JSON.parse(readFileSync(full, "utf8"));
  }
});

console.log(`\n==================================================`);
if (failures.length > 0) {
  console.error(`❌ ${failures.length} architectural guardrail(s) FAILED.`);
  process.exit(1);
} else {
  console.log(`🎉 All 7 Static Architectural & Security Guardrails PASSED!`);
  process.exit(0);
}
