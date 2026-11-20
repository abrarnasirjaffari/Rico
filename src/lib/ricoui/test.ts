import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { db, users, mandates } from "@/db";
import {
  extractRicoUIBlocks,
  generateRicoUISystemPrompt,
  mergeRicoUIStatements,
  parseRicoUI,
  repairRicoUIProgram,
  ricoDashboards,
  RicoUIDashboardError,
  stripStarsPreservingRicoUI,
} from "./index";
import { geminiAgent } from "@/lib/gemini";

const OWNER_A = "usr_ricoui_owner_a";
const OWNER_B = "usr_ricoui_owner_b";

function walkSrc(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkSrc(full));
    } else if (/\.(ts|tsx|js|json)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

async function runRicoUITests() {
  console.log("==================================================");
  console.log("⚡ Testing RicoUI Generative UI & Live Dashboards");
  console.log("==================================================");

  // Seed isolated owners & mandates
  db.insert(users)
    .values([
      { id: OWNER_A, email: "ricoui-a@example.test" },
      { id: OWNER_B, email: "ricoui-b@example.test" },
    ])
    .onConflictDoNothing()
    .run();

  db.insert(mandates)
    .values({
      id: "mandate-ricoui-a1",
      ownerId: OWNER_A,
      service: "Netflix Standard HD",
      budgetCeiling: 20.0,
      lastScrapedPrice: 15.49,
      recurrence: "Monthly on 5th",
      nextRun: "Dec 5, 2026",
      status: "ACTIVE",
      category: "Entertainment",
      currency: "USD",
      strictMode: false,
    })
    .onConflictDoNothing()
    .run();

  // 1. Streaming Partial Closure & Progressive Parsing
  console.log("\n[Test 1] Streaming partial RicoUI Lang closure & evaluation...");
  const partialStream = [
    "Here is your interactive summary:",
    "```ricoui",
    "root = Stack([kpis, chart",
    "kpis = Grid([m1, m2], 2)",
    'm1 = Metric("Spend", "$15.49/mo", "Verified',
  ].join("\n");

  const partialParsed = parseRicoUI(partialStream, { isStreaming: true });
  assert.equal(partialParsed.hasRicoUI, true);
  assert.equal(partialParsed.meta.incomplete, true);
  assert.ok(partialParsed.root !== null, "Partial stream should still render root Stack");
  assert.equal(partialParsed.root?.component, "Stack");
  console.log("✅ Partial streamed RicoUI rendered progressively without throwing.");

  // 2. Reactive $state & @Functions Evaluation
  console.log("\n[Test 2] Reactive $state variables & @Functions (@Currency, @Percent, @Filter)...");
  const reactiveProgram = [
    "```ricoui",
    "root = Stack([mMargin, mProfit])",
    "$rev = 40000",
    "$cogs = 10000",
    'mMargin = Metric("Margin", @Percent($rev - $cogs, $rev), "Gross margin", "safe")',
    'mProfit = Metric("Profit", @Currency($rev - $cogs), "Net contribution", "up")',
    "```",
  ].join("\n");

  const defaultEval = parseRicoUI(reactiveProgram);
  const childrenDefault = defaultEval.root?.props.children as Array<{
    props: Record<string, unknown>;
  }>;
  assert.equal(childrenDefault[0].props.value, "75%");
  assert.equal(childrenDefault[1].props.value, "$30,000.00");

  const overriddenEval = parseRicoUI(reactiveProgram, {
    stateOverrides: { rev: 50000, cogs: 5000 },
  });
  const childrenOverridden = overriddenEval.root?.props.children as Array<{
    props: Record<string, unknown>;
  }>;
  assert.equal(childrenOverridden[0].props.value, "90%");
  assert.equal(childrenOverridden[1].props.value, "$45,000.00");
  console.log("✅ Reactive $state overrides recalculated @Percent & @Currency instantaneously.");

  // 3. Incremental Statement Merging & Self-Healing Auto-Repair
  console.log("\n[Test 3] Surgical statement merging & local auto-repair...");
  const baseProg = [
    "root = Stack([m1, m2])",
    'm1 = Metric("A", "$10", "Base")',
    'm2 = Metric("B", "$20", "To be deleted")',
  ].join("\n");
  const patchProg = [
    "root = Stack([m1, m3])",
    "m2 = null",
    'm3 = Metric("C", "$30", "Added")',
  ].join("\n");
  const merged = mergeRicoUIStatements(baseProg, patchProg);
  const mergedParsed = parseRicoUI(merged);
  assert.equal(mergedParsed.meta.errors.length, 0);
  assert.ok(!merged.includes("m2 ="));
  assert.ok(merged.includes('m3 = Metric("C"'));

  const rootless = 'mSolo = Metric("Headroom", "$4.51", "Buffer")';
  const repaired = repairRicoUIProgram(rootless);
  const repairedParsed = parseRicoUI(repaired);
  assert.ok(repairedParsed.root !== null);
  assert.equal(repairedParsed.root?.component, "Stack");
  console.log("✅ Incremental merge & local auto-repair verified.");

  // 4. Asterisk Sanitizer Preserves RicoUI Math Expressions
  console.log("\n[Test 4] Verifying stripStarsPreservingRicoUI preserves RicoUI syntax...");
  const mixed =
    "**Bold Lead**\n\n```ricoui\nroot = Stack([m1])\nm1 = Metric(\"Calc\", (10 * 2) + (5 * 3) + \"\", \"Math\")\n```";
  const cleaned = stripStarsPreservingRicoUI(mixed);
  assert.ok(!cleaned.startsWith("**"));
  assert.ok(cleaned.includes("(10 * 2) + (5 * 3)"));
  const mathParsed = parseRicoUI(cleaned);
  const mNode = (mathParsed.root?.props.children as Array<{ props: Record<string, unknown> }>)[0];
  assert.equal(mNode.props.value, "35");
  console.log("✅ RicoUI math operators preserved while lead markdown stars stripped.");

  // 5. Self-Hosted Live Dashboards & Multi-Tenant Owner Isolation
  console.log("\n[Test 5] Testing RicoUI Live Dashboards & Owner Isolation...");
  const startersA = ricoDashboards.list(OWNER_A);
  assert.ok(startersA.length >= 3, "Expected starter CFO dashboards for Owner A");

  const createdDash = ricoDashboards.create(OWNER_A, {
    title: "Q4 Spend & Ceiling Board",
    prompt: "Build a live spend and ceiling dashboard with auto-refresh every 60s",
  });
  assert.equal(createdDash.ownerId, OWNER_A);
  assert.equal(createdDash.refreshSeconds, 60);

  const parsedDash = parseRicoUI(createdDash.program);
  assert.ok(parsedDash.root !== null);
  assert.ok(parsedDash.queries.length > 0, "Dashboard must declare live Query() statements");

  // Execute live interpreter against Owner A's real SQLite mandates
  const interpResult = await ricoDashboards.executeInterpreter(OWNER_A, {
    dashboardId: createdDash.id,
    queries: parsedDash.queries.map((q) => ({
      id: q.id,
      tool: q.tool,
      args: q.args,
    })),
  });
  const utilData = interpResult.results.util as {
    totalMonthlySpend: number;
    totalBudgetCap: number;
    ruleCount: number;
  };
  assert.ok(utilData.totalMonthlySpend >= 15.49);
  assert.ok(utilData.totalBudgetCap >= 20.0);
  assert.ok(utilData.ruleCount >= 1);

  // Surgical edit in place
  const edited = ricoDashboards.edit(OWNER_A, {
    id: createdDash.id,
    prompt: "Add a recent transactions table to the dashboard",
  });
  assert.equal(edited.dashboard.version, 2);
  assert.ok(edited.dashboard.program.includes("get_transactions_summary"));

  // Cross-tenant isolation check: Owner B must NOT access Owner A's dashboard
  let blockedCrossTenant = false;
  try {
    ricoDashboards.get(OWNER_B, createdDash.id);
  } catch (err) {
    blockedCrossTenant = err instanceof RicoUIDashboardError && err.status === 404;
  }
  assert.equal(blockedCrossTenant, true, "Owner B must not read Owner A's dashboard");

  let blockedInterpreter = false;
  try {
    await ricoDashboards.executeInterpreter(OWNER_B, {
      dashboardId: createdDash.id,
      queries: [],
    });
  } catch (err) {
    blockedInterpreter = err instanceof RicoUIDashboardError && err.status === 404;
  }
  assert.equal(blockedInterpreter, true, "Owner B must not run Owner A's dashboard interpreter");
  console.log("✅ Live Dashboard creation, DB interpreter, surgical edits, & owner isolation passed.");

  // 6. End-to-End Agent RicoUI Chat & Split Dashboard Stream
  console.log("\n[Test 6] Verifying Agent streams valid RicoUI for Chat & Dashboard prompts...");
  let chatFull = "";
  for await (const ev of geminiAgent.streamResponse("Explain burn rate and runway", {
    ownerId: OWNER_A,
  })) {
    if (ev.type === "token" && ev.text) chatFull += ev.text;
  }
  const chatParsed = parseRicoUI(chatFull);
  assert.equal(chatParsed.hasRicoUI, true);
  assert.ok(chatParsed.root !== null);
  assert.equal(chatParsed.meta.errors.length, 0);

  const dashEvs = [];
  let dashText = "";
  for await (const ev of geminiAgent.streamResponse(
    "Build a renewal watchdog dashboard",
    { ownerId: OWNER_A }
  )) {
    dashEvs.push(ev);
    if (ev.type === "token" && ev.text) dashText += ev.text;
  }
  assert.ok(
    dashEvs.some(
      (e) =>
        e.type === "workspace_action" && e.workspaceAction?.target === "dashboard"
    ),
    "Dashboard prompt must emit workspace_action targeting 'dashboard'"
  );
  assert.equal(extractRicoUIBlocks(dashText).hasRicoUI, true);
  console.log("✅ Agent streamed valid RicoUI chat widgets & split-screen dashboard actions.");

  // 7. System Prompt & Zero External Dependency / Branding Verification
  console.log("\n[Test 7] Verifying RicoUI self-containment & zero external repo references...");
  const sysPrompt = generateRicoUISystemPrompt();
  assert.ok(sysPrompt.includes("RICOUI"));

  const forbiddenExternal = new RegExp(["open" + "ui", "the" + "sys"].join("|"), "i");
  const pkgRaw = readFileSync(path.join(process.cwd(), "package.json"), "utf8");
  assert.doesNotMatch(pkgRaw, forbiddenExternal, "package.json must have zero external UI dependencies");

  const srcFiles = walkSrc(path.join(process.cwd(), "src"));
  for (const f of srcFiles) {
    if (f.endsWith(path.join("ricoui", "test.ts"))) continue;
    const content = readFileSync(f, "utf8");
    assert.doesNotMatch(
      content,
      forbiddenExternal,
      `Found forbidden external reference in ${path.relative(process.cwd(), f)}`
    );
  }
  console.log("✅ Verified 100% self-contained RicoUI with zero external references.");

  console.log("\n==================================================");
  console.log("🎉 All 7 RicoUI Engine & Live Dashboard Tests PASSED!");
  console.log("==================================================");
}

runRicoUITests().catch((err) => {
  console.error("RicoUI test failed:", err);
  process.exit(1);
});
