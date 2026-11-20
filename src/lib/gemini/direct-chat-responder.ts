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
      "Hello! I am Rico, your financial operations and workspace assistant.",
      "",
      "I route each request to the right tool only when needed:",
      "- Direct Chat: Questions, financial math, spending rules, and account insights",
      "- Doc (Split View): Drafting memos, vendor briefs, policies, and summaries",
      "- Excel (Split View): Building budget tables, runway models, and live =SUM() formulas",
      "- Browser (Split View): Verifying live merchant prices, comparing plans on the web, or acting on @eN page elements",
      "",
      "How can I help you today?",
    ].join("\n");
  }

  if (routing.chatSubkind === "capabilities") {
    if (/\bstrict mode\b/i.test(lower)) {
      return [
        `Strict Approval Mode is currently ${context?.strictMode ? "ENABLED" : "DISABLED"}.`,
        "",
        "- When enabled: Every payment quote pauses for your explicit confirmation, even when the live price is below your budget ceiling.",
        "- When disabled (Autonomous Mode): Guardrails still block any charge above your budget ceiling or any >20% price spike, and chat actions still require your signed confirmation token before funds move.",
      ].join("\n");
    }

    if (/\b(mcp|skills?)\b/i.test(lower)) {
      return [
        "Rico connects domain SKILL.md modules and MCP servers without running unnecessary web searches:",
        "- Financial Skills: Startup Credit Drafter ($50k PostHog / AWS Activate), Student Discount Enforcer (50% edu rates), and IRS Schedule C Tax Classifier",
        "- Connected MCP & Workspace Surfaces: PayPal Orders v2 & Vault rails, RICO-DOC collaborative editor, RICO-Excel formula workbook, and RICO-Browser semantic Playwright engine",
        "",
        "Open MCP & skills in the left rail to inspect server health or toggle individual skills.",
      ].join("\n");
    }

    return [
      "Here is how Rico chooses the right surface for your question:",
      "",
      "1. Direct Chat (no split pane opened): Used for general questions, math, explaining financial concepts, reviewing your active spending rules, and checking startup/student discounts.",
      "2. RICO-DOC: Opened when you ask to write, draft, summarize into, or edit a document, memo, report, policy, or notes (e.g. \"Draft a Q4 SaaS spend memo in Doc\").",
      "3. RICO-Excel: Opened when you ask to build a spreadsheet, budget tracker, runway calculator, comparison matrix, or cell formulas (e.g. \"Build a subscription budget table in Excel\").",
      "4. RICO-Browser: Opened only when live web access is needed — checking current vendor prices, comparing live plans across sites, opening a URL, or clicking @eN elements.",
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
      if (/\baudit log\b/i.test(lower)) {
        return matched.length > 0
          ? `Active rule record for ${matched[0].service}: status ${matched[0].status}, last verified rate $${matched[0].lastScrapedPrice.toFixed(2)} vs $${matched[0].budgetCeiling.toFixed(2)} ceiling (${matched[0].recurrence}). Open Spending -> Activity in the left sidebar to inspect full timestamped audit events.`
          : `No active spending rule is on file for ${specific.service} yet. Open Spending -> Activity in the sidebar to view historical logs.`;
      }
      if (matched.length === 0) {
        return `You do not have an active spending rule for ${specific.service} right now. Say "Create a rule for ${specific.service}, max $${specific.defaultCeiling} monthly" if you want to set one up.`;
      }
      return matched
        .map(
          (r) =>
            `${r.service}: status ${r.status}, last verified $${r.lastScrapedPrice.toFixed(2)}/mo against a $${r.budgetCeiling.toFixed(2)} cap (${r.recurrence}, headroom $${Math.max(0, r.budgetCeiling - r.lastScrapedPrice).toFixed(2)}).`
        )
        .join("\n");
    }

    if (rules.length === 0) {
      return 'You do not have any active spending rules yet. Tell me a rule like "Create a rule for Netflix, max $20 monthly" to add one.';
    }

    const totalMonthly = rules.reduce((acc, r) => acc + (r.lastScrapedPrice || 0), 0);
    const totalCap = rules.reduce((acc, r) => acc + r.budgetCeiling, 0);
    const headroom = Math.max(0, totalCap - totalMonthly);
    const lines = rules.map(
      (r) =>
        `- ${r.service}: $${r.lastScrapedPrice.toFixed(2)}/mo verified vs $${r.budgetCeiling.toFixed(2)} ceiling (${r.recurrence}, ${r.status})`
    );
    return [
      `Here is your active spending summary (${rules.length} rule${rules.length === 1 ? "" : "s"}):`,
      ...lines,
      "",
      `Total verified monthly spend: $${totalMonthly.toFixed(2)}/mo | Total authorized cap: $${totalCap.toFixed(2)}/mo | Protected headroom: $${headroom.toFixed(2)}/mo.`,
    ].join("\n");
  }

  // Math / arithmetic check (either explicitly routed or embedded)
  const mathAnswer = tryEvaluateFinancialMath(userMessage);
  if (mathAnswer) {
    return mathAnswer;
  }

  // Common financial, SaaS, and operational Q&A (answered directly without web search)
  if (/\b(mrr|arr)\b/i.test(lower)) {
    return [
      "MRR (Monthly Recurring Revenue) measures predictable monthly subscription revenue, while ARR (Annual Recurring Revenue) is MRR × 12.",
      "- Example: $8,500 MRR equals $102,000 ARR.",
      "- Tip: Exclude one-time setup fees and variable usage spikes when tracking core MRR.",
      "",
      'Say "Build an MRR & runway model in Excel" if you want a live formula sheet in split view.',
    ].join("\n");
  }

  if (/\b(burn rate|runway)\b/i.test(lower)) {
    return [
      "Gross burn is total monthly cash outflow; Net burn is monthly cash outflow minus monthly cash inflow.",
      "- Runway formula: Cash Balance ÷ Monthly Net Burn.",
      "- Example: $360,000 cash with $30,000/mo net burn gives 12 months of runway.",
      "",
      'Say "Create a startup runway model in Excel" to open an editable 6-month table with live formulas.',
    ].join("\n");
  }

  if (/\b(gross margin|unit economics|ltv|cac)\b/i.test(lower)) {
    return [
      "Key SaaS unit economics benchmarks:",
      "- Gross Margin: (Revenue - COGS) ÷ Revenue; strong SaaS margins typically sit between 75% and 85%.",
      "- LTV : CAC Ratio: Customer Lifetime Value divided by Customer Acquisition Cost; a healthy target is 3:1 or higher with CAC payback under 12 months.",
    ].join("\n");
  }

  if (/\b(cancel|cancellation)\b.{0,30}\b(email|message|letter|template)\b/i.test(lower)) {
    return [
      "Here is a concise cancellation message you can send:",
      "",
      "Subject: Subscription Cancellation Request",
      "Hello Billing Team, please cancel our subscription effective at the end of the current billing cycle and confirm that no further recurring charges will be billed. Thank you.",
      "",
      'Say "Put this in a Doc" if you want to edit or export it in RICO-DOC.',
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
    const ruleNote = existing
      ? `You currently have an active rule for ${existing.service} capped at $${existing.budgetCeiling.toFixed(2)} (${existing.recurrence}).`
      : `You do not have an active spending rule for ${mentionedKnown.service} yet.`;
    return [
      `Got it! ${ruleNote}`,
      "",
      `- Ask "How much is ${mentionedKnown.service}?" to verify live pricing in Browser`,
      `- Say "Create a rule for ${mentionedKnown.service}, max $${mentionedKnown.defaultCeiling} monthly" to set a spending cap`,
      `- Or ask to add ${mentionedKnown.service} to a Doc or Excel budget sheet.`,
    ].join("\n");
  }

  return [
    "I can help with that directly without running an unnecessary web search.",
    "",
    "- If you want a structured document, memo, or summary: ask me to draft or put it in Doc.",
    "- If you want a budget model, table, or formulas: ask me to build it in Excel.",
    "- If you want me to look up live external pricing or web pages: ask for the vendor's current price or start with \"Search ...\".",
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
