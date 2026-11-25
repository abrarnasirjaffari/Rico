import type { ChatContext } from "./types";
import type { TurnRoutingDecision } from "./surface-router";
import { detectKnownService } from "./intent";
import { skillInjector } from "@/lib/skills";

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
    return `${pct}% of ${fmt(base)} is ${fmt(result)}.`;
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
    return `${fmt(a)} ${opSymbol} ${fmt(b)} = ${fmt(res)}.`;
  }

  return null;
}

/**
 * Generates direct, concise plain-text answers for offline/fallback mode
 * without forcing external web search or legacy custom UI blocks.
 */
export function buildDirectChatAnswer(
  userMessage: string,
  routing: TurnRoutingDecision,
  context?: ChatContext
): string {
  const lower = userMessage.toLowerCase().trim();
  const rules = context?.activeMandates ?? [];

  if (routing.chatSubkind === "greeting") {
    if (/\b(thanks|thank you|thx|cheers|appreciate it)\b/i.test(lower)) {
      return "You're welcome! Let me know if you want to adjust a spending rule, model numbers in Excel, draft a Doc, or check live pricing.";
    }
    if (/\b(bye|goodbye|see ya|later)\b/i.test(lower)) {
      return "See you later — your active spending rules and guardrails stay protected.";
    }
    if (/^(ok|okay|got it|cool|nice|great|awesome|sounds good|perfect)$/i.test(lower)) {
      return "Ready whenever you are. Ask anything or pick a workspace in Split View.";
    }
    return "Hi! I'm Rico — ask me about subscriptions, budgets, startup credits, or open Doc, Excel, or Browser in split view.";
  }

  const mathAnswer = tryEvaluateFinancialMath(userMessage);
  if (mathAnswer) {
    return mathAnswer;
  }

  if (routing.chatSubkind === "capabilities") {
    return "Rico combines interactive chat (powered by Google A2UI), collaborative RICO-DOC and RICO-Excel workspaces, live RICO-Browser price verification, and hard spending rule guardrails (budget ceilings, >20% price-spike holds, and two-step payment confirmations).";
  }

  if (routing.chatSubkind === "session_rules") {
    if (rules.length === 0) {
      return "You don't have any active spending rules yet. Say something like \"Pay Netflix max $20 monthly on the 5th\" to create one.";
    }
    const totalSpend = rules.reduce((s, r) => s + r.lastScrapedPrice, 0);
    const totalCap = rules.reduce((s, r) => s + r.budgetCeiling, 0);
    const lines = rules.map(
      (r) =>
        `- ${r.service}: $${r.lastScrapedPrice.toFixed(2)}/mo verified vs $${r.budgetCeiling.toFixed(2)} cap (${r.recurrence}, ${r.status})`
    );
    return [
      `You have ${rules.length} active spending rules ($${totalSpend.toFixed(2)}/mo spend vs $${totalCap.toFixed(2)}/mo total cap):`,
      ...lines,
    ].join("\n");
  }

  const mentionedKnown = detectKnownService(userMessage);
  if (mentionedKnown && (!context?.activeSkills || context.activeSkills.length === 0)) {
    return `You can ask me to check live ${mentionedKnown.service} pricing in Browser or create a spending rule (typical cap around $${mentionedKnown.defaultCeiling.toFixed(2)}/mo).`;
  }

  if (context?.activeSkills && context.activeSkills.length > 0) {
    const skillReply = skillInjector.buildSkillFallbackReply(context.activeSkills);
    if (skillReply) {
      return skillReply;
    }
  }

  if (mentionedKnown) {
    return `You can ask me to check live ${mentionedKnown.service} pricing in Browser or create a spending rule (typical cap around $${mentionedKnown.defaultCeiling.toFixed(2)}/mo).`;
  }

  return "Ask me any financial question, or tell me to draft in Doc, build a formula model in Excel, or verify live pricing in Browser.";
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

  if (/\b(startup|accelerator|y combinator|\byc\b|posthog|nvidia|inception|founders hub|aws activate|credit application)\b/i.test(lower)) {
    const title = "Startup Program & Cloud Credit Application Pack";
    const md = isAppend
      ? `\n## Partner Credit Domino Checklist\n- PostHog for Startups ($50,000 analytics & LLM telemetry, ~10 min approval)\n- NVIDIA Inception ($25,000 AWS Activate + $25,000 Google Cloud partner unlock)\n- Microsoft Founders Hub ($25,000 Azure & OpenAI model credits)\n- Configure $0.00 monthly Rico spending rules before credit expiration\n`
      : `# ${title}\n\n## 1. One-Paragraph Product & Traction Summary\nWe build autonomous financial operations and guarded commerce software that enforces hard budget ceilings, >20% price-spike holds, and two-step cryptographic payment approvals across cloud and SaaS vendors.\n\n## 2. Priority Non-Dilutive Credit Sequence\n1. PostHog for Startups ($50,000 / 12 mos) — Product analytics, session replay, and LLM latency telemetry.\n2. NVIDIA Inception ($25k AWS + $25k GCP) — Multi-model inference and headless browser verification workloads.\n3. Microsoft Founders Hub ($25,000 / 12 mos) — Azure compute, OpenAI throughput, and GitHub Enterprise seats.\n4. Stripe + Notion Startups ($20k fee waiver + $1k workspace) — Payment processing relief and engineering docs.\n\n## 3. Rico Zero-Burn Guardrail Setup\n- Set recurring monthly spending rules to $0.00 while credits are active.\n- Enable 30-day pre-expiration renewal alerts.\n`;
    return { op: isAppend ? "append" : "replace", title: isAppend ? undefined : title, markdown: md };
  }

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

  // 3b. Startup Programs, Accelerators & Cloud Credit Tracker
  if (/\b(startup|credit|accelerator|y combinator|\byc\b|techstars|posthog|nvidia|founders hub)\b/i.test(lower)) {
    const headers = [
      "Program",
      "Track",
      "Credit / Capital (USD)",
      "Monthly Burn Saved",
      "Term (Mos)",
      "Equity %",
      "Net Non-Dilutive Value",
    ];
    const rows: Array<Array<string | number>> = [
      ["PostHog for Startups", "Analytics", 50000, 1200, 12, 0, "=C2"],
      ["NVIDIA -> AWS Activate", "Cloud & AI", 25000, 1500, 24, 0, "=C3"],
      ["NVIDIA -> Google Cloud", "Cloud & AI", 25000, 1400, 12, 0, "=C4"],
      ["Microsoft Founders Hub", "Cloud & AI", 25000, 1100, 12, 0, "=C5"],
      ["Stripe Fee Waiver", "Payments", 580, 50, 12, 0, "=C6"],
      ["Notion for Startups", "Productivity", 1000, 160, 6, 0, "=C7"],
      ["Y Combinator (Optional)", "Accelerator", 500000, 0, 3, 7, 0],
      [
        "Total / Sum",
        "",
        "=SUM(C2:C8)",
        "=SUM(D2:D8)",
        "=AVERAGE(E2:E7)",
        "",
        "=SUM(G2:G7)",
      ],
    ];
    return {
      op: "set_table",
      title: "Startup Credits & Accelerator Tracker",
      start_cell: "A1",
      headers,
      rows,
      description:
        "Built a Startup Credits & Accelerator Tracker in Excel with live =SUM() non-dilutive credit rollups and monthly burn savings.",
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
