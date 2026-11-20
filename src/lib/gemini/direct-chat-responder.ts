import type { ChatContext } from "./types";
import type { TurnRoutingDecision } from "./surface-router";
import { detectKnownService } from "./intent";

/**
 * Safely evaluates basic arithmetic and "X% of Y" financial expressions without eval().
 */
export function tryEvaluateFinancialMath(message: string): string | null {
  const clean = message.replace(/,/g, "").trim();

  // Pattern 1: "what is 15% of $2400" / "15% of 2400"
  const pctOf = clean.match(
    /(\d+(?:\.\d+)?)\s*%\s*of\s*\$?\s*(\d+(?:\.\d+)?)/i
  );
  if (pctOf) {
    const pct = parseFloat(pctOf[1]);
    const base = parseFloat(pctOf[2]);
    const hasDollar = clean.includes("$");
    const result = (pct / 100) * base;
    const fmt = (n: number) =>
      hasDollar
        ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : Number.isInteger(n)
        ? n.toLocaleString("en-US")
        : n.toFixed(2);
    return [
      `${pct}% of ${fmt(base)} is ${fmt(result)}.`,
      "",
      "```ricoui",
      "root = Stack([kpis, pctSlider, chips])",
      `$rate = ${pct}`,
      "kpis = Grid([mBase, mRate, mOut], 3)",
      `mBase = Metric("Base Amount", "${fmt(base)}", "Input principal", "neutral")`,
      'mRate = Metric("Selected Rate", $rate + "%", "Drag slider below", "accent")',
      `mOut = Metric("Calculated Result", ${hasDollar ? `@Currency(@Div(@Mul(${base}, $rate), 100))` : `@Round(@Div(@Mul(${base}, $rate), 100), 2) + ""`}, "Live browser math", "safe")`,
      'pctSlider = SliderInput("Adjust Percentage Rate", $rate, 1, 100, 1, "", "%")',
      'chips = FollowUpChips([{ label: "Open Budget Sheet in Excel", tool: "excel" }, { label: "Open Live Spend Dashboard", tool: "dashboard" }])',
      "```",
    ].join("\n");
  }

  // Pattern 2: Simple two-operand arithmetic ("240 * 12", "$15.49 + $11.99", "4500 / 12")
  const binOp = clean.match(
    /(?:^|(?:what is|calculate|compute|how much is)\s+)\$?\s*(-?\d+(?:\.\d+)?)\s*([+\-*/x×÷])\s*\$?\s*(-?\d+(?:\.\d+)?)\s*\??$/i
  );
  if (binOp) {
    const a = parseFloat(binOp[1]);
    const op = binOp[2];
    const b = parseFloat(binOp[3]);
    const hasDollar = clean.includes("$");
    let res: number;
    let opSymbol = op;
    if (op === "+") res = a + b;
    else if (op === "-") res = a - b;
    else if (op === "*" || op === "x" || op === "×") {
      res = a * b;
      opSymbol = "×";
    } else {
      if (b === 0) return "Division by zero is undefined.";
      res = a / b;
      opSymbol = "÷";
    }
    const fmt = (n: number) =>
      hasDollar
        ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : Number.isInteger(n)
        ? n.toLocaleString("en-US")
        : Number(n.toFixed(4)).toString();
    return [
      `${fmt(a)} ${opSymbol} ${fmt(b)} = ${fmt(res)}.`,
      "",
      "```ricoui",
      "root = Stack([kpis, chips])",
      "kpis = Grid([mA, mB, mRes], 3)",
      `mA = Metric("Operand A", "${fmt(a)}", "First value", "neutral")`,
      `mB = Metric("Operand B", "${fmt(b)}", "Operator ${opSymbol}", "neutral")`,
      `mRes = Metric("Exact Result", "${fmt(res)}", "${fmt(a)} ${opSymbol} ${fmt(b)}", "safe")`,
      'chips = FollowUpChips([{ label: "Build Formula Model in Excel", tool: "excel" }, { label: "Runway Simulator", prompt: "Explain burn rate and runway" }])',
      "```",
    ].join("\n");
  }

  return null;
}

/**
 * Generates a direct, grounded chat response without triggering Browser search.
 */
export function buildDirectChatAnswer(
  userMessage: string,
  routing: TurnRoutingDecision,
  context?: ChatContext
): string {
  const lower = userMessage.toLowerCase().trim();
  const rules = context?.activeMandates ?? [];

  if (routing.chatSubkind === "greeting") {
    return [
      "Hello! I am Rico, your autonomous financial operations and workspace assistant.",
      "",
      "```ricoui",
      "root = Stack([welcomeCard, chips])",
      'welcomeCard = Card([surfaces], "Rico Command Surfaces", "Interactive RicoUI cards, split workspaces, and hard payment guardrails", "Ready", "success")',
      'surfaces = Steps([{ title: "Interactive Chat (RicoUI)", detail: "Live calculators, rule builders, charts, and guardrail previews right in chat" }, { title: "RICO-Dashboard (Split View)", detail: "Live CFO dashboards that query your database directly with zero extra AI cost" }, { title: "RICO-DOC & RICO-Excel", detail: "Collaborative policy memos and multi-sheet =SUM() financial workbooks" }, { title: "RICO-Browser", detail: "Headless Chromium DOM price verification and @eN element actions" }])',
      'chips = FollowUpChips([{ label: "Open Live Dashboard", tool: "dashboard" }, { label: "My Spending Rules", prompt: "Show me my spending rules" }, { label: "Runway Calculator", prompt: "Explain burn rate and runway" }, { label: "Compare Netflix & Spotify", prompt: "Compare Netflix and Spotify" }])',
      "```",
    ].join("\n");
  }

  if (routing.chatSubkind === "capabilities") {
    if (/\bstrict mode\b/i.test(lower)) {
      const enabled = Boolean(context?.strictMode);
      return [
        `Strict Approval Mode is currently ${enabled ? "ENABLED" : "DISABLED"}.`,
        "",
        "```ricoui",
        "root = Stack([banner, modes, chips])",
        `banner = Callout("Strict Approval Mode: ${enabled ? "ENABLED" : "DISABLED"}", "${enabled ? "Every payment quote pauses for your explicit sign-off before funds move." : "Autonomous within rule ceilings, while chat runs still require a signed two-step confirmation token."}", "${enabled ? "warning" : "success"}")`,
        'modes = Steps([{ title: "Tier 1: Hard Budget Ceiling", detail: "Blocks any charge exceeding your authorized max amount" }, { title: "Tier 2: >20% Price Spike Hold", detail: "Halts execution automatically on unexpected vendor rate jumps" }, { title: "Tier 3: Signed Two-Step Confirmation", detail: "Quotes via /api/payments/quote before /api/payments/execute" }])',
        'chips = FollowUpChips([{ label: "View Guardrail Dashboard", prompt: "Build a watchdog security dashboard" }, { label: "Review Active Rules", prompt: "Show me my spending rules" }])',
        "```",
      ].join("\n");
    }

    if (/\b(mcp|skills?)\b/i.test(lower)) {
      return [
        "Here are Rico's active domain skills, MCP connectors, and workspace surfaces:",
        "",
        "```ricoui",
        "root = Stack([tabs, chips])",
        'tabs = Tabs([tabSkills, tabMcp], "skills")',
        'tabSkills = TabItem("skills", "Domain Skills", [skillsList])',
        'skillsList = Steps([{ title: "Startup Credit Drafter", detail: "$50k PostHog, $5k AWS Activate, $1k Notion startup allocations" }, { title: "Student Discount Enforcer", detail: "50% to 67% verified educational rates for Spotify, Adobe, GitHub" }, { title: "IRS Schedule C Classifier", detail: "Separates 100% deductible SaaS/Cloud from 50% meal deductions" }])',
        'tabMcp = TabItem("mcp", "MCP & Workspaces", [mcpList])',
        'mcpList = Steps([{ title: "PayPal Orders v2 & Vault MCP", detail: "Dual-rail execution with backup Visa/Mastercard failover" }, { title: "RICO-Dashboard, Doc & Excel", detail: "Live SQLite/Postgres boards, Markdown memos, and formula sheets" }, { title: "RICO-Browser Playwright CDP", detail: "Live DOM pricing verification and @eN element interaction" }])',
        'chips = FollowUpChips([{ label: "Probe Startup Credits", prompt: "Check startup credits" }, { label: "Open Live Dashboard", tool: "dashboard" }])',
        "```",
      ].join("\n");
    }

    return [
      "Rico routes every request to the right interactive surface:",
      "",
      "```ricoui",
      "root = Stack([guide, chips])",
      'guide = Steps([{ title: "Interactive RicoUI Chat", detail: "Instant calculators, inline rule builders, comparisons, and tax/credit cards" }, { title: "RICO-Dashboard", detail: "Persistent live boards that refresh directly from your database" }, { title: "RICO-DOC & RICO-Excel", detail: "Full Markdown documents and live =SUM() financial models in split view" }, { title: "RICO-Browser", detail: "Opened only when checking live vendor websites or clicking @eN elements" }])',
      'chips = FollowUpChips([{ label: "Open Dashboard", tool: "dashboard" }, { label: "Open Doc", tool: "doc" }, { label: "Open Excel", tool: "excel" }, { label: "Open Browser", tool: "browser" }])',
      "```",
    ].join("\n");
  }

  if (routing.chatSubkind === "session_rules") {
    const specific = detectKnownService(userMessage);
    if (specific) {
      const matched = rules.filter(
        (r) =>
          r.service.toLowerCase().includes(specific.keyword) ||
          r.service.toLowerCase() === specific.service.toLowerCase()
      );
      if (matched.length === 0) {
        return [
          `You do not have an active spending rule for ${specific.service} yet. Configure one directly below:`,
          "",
          "```ricoui",
          "root = Stack([builder, chips])",
          `builder = MandateBuilderCard("${specific.service}", ${specific.defaultCeiling}, null, "${specific.schedule}", "Subscription")`,
          `chips = FollowUpChips([{ label: "Verify Live ${specific.service} Price", prompt: "How much is ${specific.service}?" }, { label: "Open Spend Dashboard", tool: "dashboard" }])`,
          "```",
        ].join("\n");
      }
      const r = matched[0];
      return [
        `Active spending rule for ${r.service}:`,
        "",
        "```ricoui",
        "root = Stack([guardCard, chips])",
        `guardCard = PaymentGuardrailCard("${r.id}", "${r.service}", ${r.lastScrapedPrice || 0}, ${r.budgetCeiling}, "${r.recurrence}", "${r.status}")`,
        `chips = FollowUpChips([{ label: "Verify Live Rate", prompt: "How much is ${r.service}?" }, { label: "Open Spend Dashboard", tool: "dashboard" }, { label: "Export to Excel", tool: "excel" }])`,
        "```",
      ].join("\n");
    }

    if (rules.length === 0) {
      return [
        "You do not have any active spending rules yet. Use the interactive configurator below to create your first rule:",
        "",
        "```ricoui",
        "root = Stack([builder, chips])",
        'builder = MandateBuilderCard("Netflix Standard HD", 20, 15.49, "Monthly on 5th", "Entertainment")',
        'chips = FollowUpChips([{ label: "Compare Netflix & Spotify", prompt: "Compare Netflix and Spotify" }, { label: "Check Startup Credits", prompt: "Check startup credits" }])',
        "```",
      ].join("\n");
    }

    const totalMonthly = rules.reduce((acc, r) => acc + (r.lastScrapedPrice || 0), 0);
    const totalCap = rules.reduce((acc, r) => acc + r.budgetCeiling, 0);
    const headroom = Math.max(0, totalCap - totalMonthly);
    const labelsJson = JSON.stringify(rules.map((r) => r.service));
    const pricesJson = JSON.stringify(rules.map((r) => Number((r.lastScrapedPrice || 0).toFixed(2))));
    const capsJson = JSON.stringify(rules.map((r) => Number(r.budgetCeiling.toFixed(2))));
    const rowsJson = JSON.stringify(
      rules.map((r) => ({
        service: r.service,
        verified: `$${(r.lastScrapedPrice || 0).toFixed(2)}`,
        ceiling: `$${r.budgetCeiling.toFixed(2)}`,
        headroom: `$${Math.max(0, r.budgetCeiling - (r.lastScrapedPrice || 0)).toFixed(2)}`,
        schedule: r.recurrence,
        status: r.status,
      }))
    );

    return [
      `Active spending summary across ${rules.length} rule${rules.length === 1 ? "" : "s"}:`,
      "",
      "```ricoui",
      "root = Stack([kpis, chart, tbl, chips])",
      "kpis = Grid([m1, m2, m3], 3)",
      `m1 = Metric("Verified Monthly", "$${totalMonthly.toFixed(2)}/mo", "${rules.length} active rules", "safe")`,
      `m2 = Metric("Authorized Cap", "$${totalCap.toFixed(2)}/mo", "Hard ceiling total", "neutral")`,
      `m3 = Metric("Protected Headroom", "$${headroom.toFixed(2)}/mo", "Available buffer", "up")`,
      `chart = BarChart("Verified Rate vs Budget Ceiling", ${labelsJson}, ${pricesJson}, ${capsJson}, "$", "Verified", "Ceiling")`,
      `tbl = DataTable([{ key: "service", label: "Service" }, { key: "verified", label: "Verified", align: "right" }, { key: "ceiling", label: "Cap", align: "right" }, { key: "headroom", label: "Headroom", align: "right" }, { key: "schedule", label: "Schedule" }, { key: "status", label: "Status" }], ${rowsJson}, "Active Spending Rules", true)`,
      'chips = FollowUpChips([{ label: "Open Live Dashboard", tool: "dashboard" }, { label: "Model in Excel", prompt: "Put my spending rules into an Excel budget sheet" }, { label: "Draft Policy Memo", prompt: "Draft a SaaS spend policy in Doc" }])',
      "```",
    ].join("\n");
  }

  // Math / arithmetic check (either explicitly routed or embedded)
  const mathAnswer = tryEvaluateFinancialMath(userMessage);
  if (mathAnswer) {
    return mathAnswer;
  }

  // Common financial, SaaS, and operational Q&A (answered directly with interactive RicoUI)
  if (/\b(mrr|arr)\b/i.test(lower)) {
    return [
      "MRR tracks predictable monthly subscription revenue, and ARR equals MRR × 12. Adjust the simulator below to test MRR, burn, and ARR scenarios:",
      "",
      "```ricoui",
      "root = Stack([sim, note, chips])",
      'sim = RunwayCalculatorCard(300000, 18500, 34000, "MRR, ARR & Cash Runway Simulator")',
      'note = Callout("MRR Hygiene Rule", "Include recurring subscription tiers only; exclude one-time setup fees and non-recurring credits.", "info")',
      'chips = FollowUpChips([{ label: "Build MRR Sheet in Excel", prompt: "Build a 6-month MRR and runway model in Excel" }, { label: "Open Live CFO Dashboard", tool: "dashboard" }])',
      "```",
    ].join("\n");
  }

  if (/\b(burn rate|runway)\b/i.test(lower)) {
    return [
      "Runway equals Cash Balance divided by Monthly Net Burn (Gross Burn minus MRR). Drag the sliders below to stress-test your runway live:",
      "",
      "```ricoui",
      "root = Stack([sim, chips])",
      'sim = RunwayCalculatorCard(360000, 15000, 45000, "Interactive Startup Runway & Burn Simulator")',
      'chips = FollowUpChips([{ label: "Open 6-Month Formula Sheet in Excel", prompt: "Create a startup runway model in Excel" }, { label: "Check $55k Startup Credits", prompt: "Check startup credits" }])',
      "```",
    ].join("\n");
  }

  if (/\b(gross margin|unit economics|ltv|cac)\b/i.test(lower)) {
    return [
      "Key SaaS unit economics benchmarks and interactive margin estimator:",
      "",
      "```ricoui",
      "root = Stack([kpis, revSlider, cogsSlider, chips])",
      "$rev = 50000",
      "$cogs = 10000",
      "kpis = Grid([mGm, mNet, mBench], 3)",
      'mGm = Metric("Gross Margin", @Percent($rev - $cogs, $rev), "Target: 75% to 85%", "safe")',
      'mNet = Metric("Gross Profit", @Currency($rev - $cogs), "Monthly contribution", "up")',
      'mBench = Metric("Target LTV : CAC", "3.0x+", "Payback < 12 mos", "neutral")',
      'revSlider = SliderInput("Monthly Revenue", $rev, 5000, 250000, 2500, "$", "")',
      'cogsSlider = SliderInput("Monthly Hosting & COGS", $cogs, 500, 150000, 1000, "$", "")',
      'chips = FollowUpChips([{ label: "Model Unit Economics in Excel", tool: "excel" }, { label: "Open Spend Dashboard", tool: "dashboard" }])',
      "```",
    ].join("\n");
  }

  if (/\b(cancel|cancellation)\b.{0,30}\b(email|message|letter|template)\b/i.test(lower)) {
    const templateText =
      "Subject: Subscription Cancellation Request\\nHello Billing Team, please cancel our subscription effective at the end of the current billing cycle and confirm that no further recurring charges will be billed. Thank you.";
    return [
      "Ready-to-send subscription cancellation notice:",
      "",
      "```ricoui",
      "root = Stack([card, btns])",
      'card = Card([body], "Vendor Cancellation Notice", "Effective end of current billing period", "Template", "neutral")',
      `body = TextBlock("${templateText}", "mono")`,
      `btns = ButtonGroup([bCopy, bDoc])`,
      `bCopy = Button("Copy Template", @CopyText("${templateText}"), "primary")`,
      'bDoc = Button("Open & Edit in RICO-DOC", @ToRico("Put this cancellation template in a Doc"), "outline")',
      "```",
    ].join("\n");
  }

  // Casual mention of a known service without asking to scrape, create, or pay (e.g. "I like Netflix")
  const mentionedKnown = detectKnownService(userMessage);
  if (mentionedKnown) {
    const existing = rules.find(
      (r) =>
        r.service.toLowerCase().includes(mentionedKnown.keyword) ||
        r.service === mentionedKnown.service
    );
    if (existing) {
      return [
        `You have an active rule on file for ${existing.service}:`,
        "",
        "```ricoui",
        "root = Stack([guard, chips])",
        `guard = PaymentGuardrailCard("${existing.id}", "${existing.service}", ${existing.lastScrapedPrice || 0}, ${existing.budgetCeiling}, "${existing.recurrence}", "${existing.status}")`,
        `chips = FollowUpChips([{ label: "Verify Live ${mentionedKnown.service} Price", prompt: "How much is ${mentionedKnown.service}?" }, { label: "Add to Excel Sheet", prompt: "Put ${mentionedKnown.service} in an Excel budget sheet" }])`,
        "```",
      ].join("\n");
    }

    return [
      `Configure a spending rule or verify live pricing for ${mentionedKnown.service}:`,
      "",
      "```ricoui",
      "root = Stack([builder, chips])",
      `builder = MandateBuilderCard("${mentionedKnown.service}", ${mentionedKnown.defaultCeiling}, null, "${mentionedKnown.schedule}", "Subscription")`,
      `chips = FollowUpChips([{ label: "Check Live ${mentionedKnown.service} Price", prompt: "How much is ${mentionedKnown.service}?" }, { label: "Model in Excel", prompt: "Add ${mentionedKnown.service} to an Excel budget sheet" }])`,
      "```",
    ].join("\n");
  }

  return [
    "Choose an interactive workspace or financial tool below:",
    "",
    "```ricoui",
    "root = Stack([card, chips])",
    'card = Callout("Ready in Rico", "Open a live database dashboard, build formulas in Excel, draft a policy in Doc, or verify live vendor pricing in Browser.", "info")',
    'chips = FollowUpChips([{ label: "Open Live Dashboard", tool: "dashboard" }, { label: "Draft in Doc", tool: "doc" }, { label: "Build in Excel", tool: "excel" }, { label: "My Spending Rules", prompt: "Show me my spending rules" }])',
    "```",
  ].join("\n");
}

/**
 * Generates question-aware RICO-DOC Markdown & title without asterisks.
 */
export function buildTailoredDocPayload(
  userMessage: string,
  context?: ChatContext
): { op: "replace" | "append"; title?: string; markdown: string } {
  const lower = userMessage.toLowerCase();
  const rules = context?.activeMandates ?? [];
  const wsDoc = context?.workspaceSnapshot?.doc;
  const lastAssistant = [...(context?.history ?? [])]
    .reverse()
    .find((h) => h.role === "assistant")?.content;

  const isAppend =
    /\b(append|add (a |another )?(section|note|action items|bullets?) to|add to)\b/i.test(
      lower
    ) && Boolean(wsDoc?.markdown?.trim());

  // Handle "Regarding '...' in Doc: ..." contextual edits
  const selMatch = userMessage.match(/^Regarding\s+"([^"]+)"\s+in\s+Doc:\s*(.*)$/i);
  if (selMatch) {
    const targetSnippet = selMatch[1];
    const instruction = selMatch[2] || "Refine this section";
    const currentMd = wsDoc?.markdown || "";
    const refinedNote = `\n## Refined Section\nUpdated note (${instruction}):\n- ${targetSnippet}\n- Verified against active budget ceiling guardrails and >20% anomaly hold rules.\n`;
    if (currentMd.trim()) {
      return {
        op: "append",
        markdown: refinedNote,
      };
    }
  }

  // Summarize recent conversation into Doc if requested ("put that in a doc", "summarize this into a doc")
  if (
    lastAssistant &&
    /\b(that|this|conversation|chat|above|findings)\b/i.test(lower) &&
    /\b(summarize|put|save|turn|export|write)\b/i.test(lower)
  ) {
    const cleaned = lastAssistant.replace(/\*+/g, "").trim();
    return {
      op: isAppend ? "append" : "replace",
      title: isAppend ? undefined : "Rico Research & Financial Notes",
      markdown: isAppend
        ? `\n## Captured Summary\n${cleaned}\n`
        : `# Rico Research & Financial Notes\n\n## Summary\n${cleaned}\n`,
    };
  }

  const ruleBullets =
    rules.length > 0
      ? rules
          .map(
            (r) =>
              `- ${r.service}: $${r.lastScrapedPrice.toFixed(2)}/mo verified vs $${r.budgetCeiling.toFixed(2)} cap (${r.recurrence})`
          )
          .join("\n")
      : "- Netflix Standard HD: $15.49/mo verified vs $20.00 cap\n- Spotify Premium: $11.99/mo verified vs $15.00 cap\n- GitHub Copilot: $19.00/mo verified vs $25.00 cap";

  if (/\b(policy|compliance|sop|governance|approval)\b/i.test(lower)) {
    const title = "SaaS Spend & Approval Policy";
    const md = isAppend
      ? `\n## Policy Controls\n- Enforce hard monthly budget ceilings per vendor\n- Hold any renewal with >20% price increase for manual review\n- Route payments through primary PayPal rail with vaulted backup card failover\n`
      : `# ${title}\n\n## Purpose\nEstablish clear spending guardrails for recurring software, cloud infrastructure, and team subscriptions.\n\n## Guardrail Rules\n1. Every recurring vendor requires an explicit spending rule and monthly ceiling.\n2. Any invoice or renewal exceeding the baseline rate by more than 20% triggers an automatic hold.\n3. Strict Approval Mode requires human sign-off before payment capture.\n\n## Covered Subscriptions\n${ruleBullets}\n`;
    return { op: isAppend ? "append" : "replace", title: isAppend ? undefined : title, markdown: md };
  }

  if (/\b(meeting|notes|agenda|standup|sync)\b/i.test(lower)) {
    const title = "Finance & Ops Sync Notes";
    const md = isAppend
      ? `\n## Action Items\n- Audit unused SaaS seats before the 1st of next month\n- Confirm startup credit eligibility for analytics & cloud vendors\n`
      : `# ${title}\n\n## Agenda\n- Review monthly recurring software spend and budget headroom\n- Check upcoming renewal dates and annual billing discounts\n\n## Current Active Rules\n${ruleBullets}\n\n## Action Items\n- Verify seat utilization across engineering tools\n- Keep >20% price-spike alerts active\n`;
    return { op: isAppend ? "append" : "replace", title: isAppend ? undefined : title, markdown: md };
  }

  const title = "Monthly Spend & Vendor Brief";
  const md = isAppend
    ? `\n## Action Items Added by Rico\n${ruleBullets}\n`
    : `# ${title}\n\nPrepared collaboratively in Rico Split View.\n\n## Active Subscriptions\n${ruleBullets}\n\n## Next Steps\n- Review annual billing discounts for developer tools\n- Keep strict ceiling alerts active above 20% price changes\n`;
  return { op: isAppend ? "append" : "replace", title: isAppend ? undefined : title, markdown: md };
}

/**
 * Generates question-aware RICO-Excel operations (set_cells, clear, or tailored formula tables).
 */
export function buildTailoredExcelPayload(
  userMessage: string,
  context?: ChatContext
): {
  op: "set_table" | "set_cells" | "clear";
  title?: string;
  start_cell?: string;
  headers?: string[];
  rows?: Array<Array<string | number>>;
  cells?: Array<{ a1: string; value: string | number; bold?: boolean }>;
  description: string;
} {
  const lower = userMessage.toLowerCase();

  // 1. Clear sheet request
  if (/\bclear\s+(the\s+|this\s+|my\s+)?(excel|sheet|spreadsheet|workbook|table)\b/i.test(lower)) {
    return {
      op: "clear",
      description: "Cleared the active Excel worksheet.",
    };
  }

  // 2. Targeted cell assignment ("set B5 to =SUM(B2:B4)" or "put 1200 in C3")
  const setCellMatch = userMessage.match(
    /\b(?:set|update|write|put)\s+(?:cell\s+)?([A-Za-z]{1,2}\d+)\s+(?:to|as|=)\s+["']?([^"'\n]+)["']?/i
  );
  if (setCellMatch) {
    const a1 = setCellMatch[1].toUpperCase();
    const val = setCellMatch[2].trim();
    return {
      op: "set_cells",
      cells: [{ a1, value: val, bold: val.startsWith("=") }],
      description: `Updated cell ${a1} to ${val} in RICO-Excel.`,
    };
  }

  // 3. Startup Runway & Burn Rate Model
  if (/\b(runway|burn|cash ?flow|p&l|mrr|arr)\b/i.test(lower)) {
    const headers = [
      "Month",
      "Starting Cash",
      "MRR Inflow",
      "Payroll & Ops",
      "Cloud & SaaS",
      "Net Burn",
      "Ending Cash",
    ];
    const rows: Array<Array<string | number>> = [
      ["Month 1", 250000, 18000, 32000, 2400, "=D2+E2-C2", "=B2-F2"],
      ["Month 2", "=G2", 20500, 32000, 2450, "=D3+E3-C3", "=B3-F3"],
      ["Month 3", "=G3", 23200, 33500, 2500, "=D4+E4-C4", "=B4-F4"],
      ["Month 4", "=G4", 26000, 33500, 2550, "=D5+E5-C5", "=B5-F5"],
      ["Month 5", "=G5", 29400, 35000, 2600, "=D6+E6-C6", "=B6-F6"],
      ["Month 6", "=G6", 33000, 35000, 2650, "=D7+E7-C7", "=B7-F7"],
      [
        "6M Total / Avg",
        "",
        "=SUM(C2:C7)",
        "=SUM(D2:D7)",
        "=SUM(E2:E7)",
        "=AVERAGE(F2:F7)",
        "=G7",
      ],
    ];
    return {
      op: "set_table",
      title: "6-Month Runway & Burn Model",
      start_cell: "A1",
      headers,
      rows,
      description:
        "Built a 6-month Startup Runway & Burn Model in Excel with chained cash balances (=G2), net burn formulas (=D2+E2-C2), and 6-month =SUM() / =AVERAGE() rollups.",
    };
  }

  // 4. Vendor / SaaS Pricing Comparison Matrix
  if (/\b(compare|comparison|matrix|roi|vendor|annual)\b/i.test(lower)) {
    const headers = [
      "Vendor",
      "Monthly Rate",
      "Annualized (12x)",
      "Annual Plan Cost",
      "Annual Savings",
    ];
    const rows: Array<Array<string | number>> = [
      ["Netflix Standard HD", 15.49, "=B2*12", 185.88, "=C2-D2"],
      ["Spotify Premium", 11.99, "=B3*12", 119.88, "=C3-D3"],
      ["GitHub Copilot", 19.0, "=B4*12", 190.0, "=C4-D4"],
      ["Notion Plus", 12.0, "=B5*12", 120.0, "=C5-D5"],
      [
        "Total",
        "=SUM(B2:B5)",
        "=SUM(C2:C5)",
        "=SUM(D2:D5)",
        "=SUM(E2:E5)",
      ],
    ];
    return {
      op: "set_table",
      title: "Vendor Cost & Annual Savings Matrix",
      start_cell: "A1",
      headers,
      rows,
      description:
        "Created a Vendor Cost & Annual Savings Matrix in Excel with annualized (=B2*12), savings (=C2-D2), and =SUM() formulas.",
    };
  }

  // 5. Default: Subscription & Guardrail Budget Model grounded in user's active rules
  const rules = context?.activeMandates ?? [];
  const rows: Array<Array<string | number>> =
    rules.length > 0
      ? rules.map((r, i) => {
          const rowNum = i + 2;
          return [
            r.service,
            r.lastScrapedPrice,
            r.budgetCeiling,
            `=C${rowNum}-B${rowNum}`,
            `=B${rowNum}*12`,
            r.recurrence,
          ];
        })
      : [
          ["Netflix Standard HD", 15.49, 20, "=C2-B2", "=B2*12", "Monthly on 5th"],
          ["Spotify Premium", 11.99, 15, "=C3-B3", "=B3*12", "Monthly on 1st"],
          ["GitHub Copilot", 19.0, 25, "=C4-B4", "=B4*12", "Monthly on 15th"],
        ];

  const lastDataRow = rows.length + 1;
  rows.push([
    "Total",
    `=SUM(B2:B${lastDataRow})`,
    `=SUM(C2:C${lastDataRow})`,
    `=SUM(D2:D${lastDataRow})`,
    `=SUM(E2:E${lastDataRow})`,
    "",
  ]);

  return {
    op: "set_table",
    title: "Subscription Budget Model",
    start_cell: "A1",
    headers: [
      "Service",
      "Monthly Price",
      "Budget Cap",
      "Headroom",
      "Annual Cost",
      "Schedule",
    ],
    rows,
    description: `Updated your Excel workbook in split view with ${rows.length - 1} services, live headroom (=C2-B2), annualized cost (=B2*12), and =SUM() totals.`,
  };
}
