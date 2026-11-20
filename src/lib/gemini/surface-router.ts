import type { SplitWorkspaceSnapshot } from "@/lib/rico-workspace/types";
import { classifyChatIntent, detectKnownService } from "./intent";
import type { ChatHistoryItem } from "./types";

export type RicoRouteTarget = "chat" | "doc" | "excel" | "dashboard" | "browser";

export type BrowserRouteMode =
  | "open_only"
  | "open_url"
  | "semantic_ref"
  | "verify_price"
  | "compare_prices"
  | "web_search";

export type WorkspaceRouteOp = "open" | "read" | "edit";

export type ChatSubkind =
  | "greeting"
  | "mandate_create"
  | "mandate_execute"
  | "session_rules"
  | "advisory"
  | "math"
  | "capabilities"
  | "general_qa";

export interface TurnRoutingDecision {
  target: RicoRouteTarget;
  reason: string;
  browserMode?: BrowserRouteMode;
  workspaceOp?: WorkspaceRouteOp;
  chatSubkind?: ChatSubkind;
  directUrl?: string;
  compareServices?: string[];
}

const KNOWN_SERVICE_CANDIDATES: Array<{ keyword: string; service: string }> = [
  { keyword: "netflix", service: "Netflix Standard HD" },
  { keyword: "spotify", service: "Spotify Premium" },
  { keyword: "aws", service: "AWS Cloud Services" },
  { keyword: "copilot", service: "GitHub Copilot" },
  { keyword: "github", service: "GitHub Copilot" },
  { keyword: "adobe", service: "Adobe Creative Cloud" },
  { keyword: "posthog", service: "PostHog" },
  { keyword: "notion", service: "Notion" },
  { keyword: "chatgpt", service: "ChatGPT Plus" },
  { keyword: "youtube", service: "YouTube Premium" },
];

export function detectAllMentionedServices(message: string): string[] {
  const lower = message.toLowerCase();
  const matched = new Set<string>();
  for (const c of KNOWN_SERVICE_CANDIDATES) {
    if (new RegExp(`\\b${c.keyword}\\b`, "i").test(lower)) {
      matched.add(c.service);
    }
  }
  return Array.from(matched);
}

function extractDirectUrl(message: string): string | null {
  const fullUrl = message.match(/\bhttps?:\/\/[^\s<>")]+/i);
  if (fullUrl) return fullUrl[0];

  const navDomain = message.match(
    /\b(?:open|visit|go to|navigate to|browse to|load)\s+((?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+\b(?:\/[^\s<>")]*)?)/i
  );
  if (navDomain) {
    const raw = navDomain[1];
    if (!/\.(md|txt|csv|xlsx|xls|docx?|pdf)$/i.test(raw)) {
      return raw.startsWith("http") ? raw : `https://${raw}`;
    }
  }
  return null;
}

/**
 * OpenCode-inspired tool & surface router.
 *
 * Mirrors OpenCode's SessionSystemPrompt + ToolRegistry discipline:
 * 1. Communicate directly in chat when session context, active rules, math, or general reasoning answers the question.
 * 2. Route to dedicated workspace surfaces (RICO-DOC or RICO-Excel) when authoring, tabulating, modeling, or editing.
 * 3. Invoke RICO-Browser / live web search ONLY when live pricing verification, external URL inspection, @eN DOM interaction,
 *    or current external web discovery beyond session context is genuinely needed.
 */
export function routeUserQuestion(
  message: string,
  options?: {
    workspaceSnapshot?: SplitWorkspaceSnapshot;
    history?: ChatHistoryItem[];
  }
): TurnRoutingDecision {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase().replace(/\s+/g, " ");
  const ws = options?.workspaceSnapshot;
  const intent = classifyChatIntent(trimmed);

  // 1. Explicit financial mandate creation or execution always stays in guarded chat flow
  if (intent === "create") {
    return {
      target: "chat",
      chatSubkind: "mandate_create",
      reason: "Explicit spending rule creation request",
    };
  }
  if (intent === "execute") {
    return {
      target: "chat",
      chatSubkind: "mandate_execute",
      reason: "Explicit spending rule execution quote request",
    };
  }

  // 2. Greetings & conversational acknowledgements
  if (
    intent === "greeting" &&
    trimmed.split(/\s+/).length <= 5 &&
    !/\b(price|search|browse|doc|excel|sheet|compare|mandate|rule)\b/i.test(lower)
  ) {
    return {
      target: "chat",
      chatSubkind: "greeting",
      reason: "Conversational greeting",
    };
  }
  if (
    /^(thanks|thank you|thx|got it|ok|okay|cool|nice|awesome|great|good morning|good afternoon|good evening|how are you|who are you)\b[\s!.?]*$/i.test(
      lower
    )
  ) {
    return {
      target: "chat",
      chatSubkind: "greeting",
      reason: "Conversational turn requiring direct text reply",
    };
  }

  // 3. Interactive Browser @eN element refs, AXTree snapshots, or explicit URL navigation
  if (
    /@e\d+\b/i.test(trimmed) ||
    /\b(axtree|semantic tree)\b/i.test(lower) ||
    /\b(take|capture|get|show)\s+(a\s+|the\s+)?(browser\s+)?snapshot\b/i.test(lower)
  ) {
    return {
      target: "browser",
      browserMode: "semantic_ref",
      reason: "Interactive @eN element reference or semantic AXTree snapshot",
    };
  }

  if (/^(open|show|launch|switch to)\s+(the\s+)?(live\s+|web\s+)?browser\b[\s!.?]*$/i.test(lower)) {
    return {
      target: "browser",
      browserMode: "open_only",
      workspaceOp: "open",
      reason: "Explicit request to open the Browser split surface",
    };
  }

  const directUrl = extractDirectUrl(trimmed);
  if (directUrl) {
    return {
      target: "browser",
      browserMode: "open_url",
      directUrl,
      reason: `Explicit URL navigation to ${directUrl}`,
    };
  }

  // 4. Explicit surface open commands ("open doc", "open excel")
  if (
    /^(open|show|launch|switch to)\s+(the\s+|my\s+)?(rico[\s-]?)?(doc|docs|document|notes|editor)\b[\s!.?]*$/i.test(
      lower
    )
  ) {
    return {
      target: "doc",
      workspaceOp: "open",
      reason: "Explicit request to open RICO-DOC split workspace",
    };
  }

  if (
    /^(open|show|launch|switch to)\s+(the\s+|my\s+)?(rico[\s-]?)?(excel|spreadsheet|workbook|sheet)\b[\s!.?]*$/i.test(
      lower
    )
  ) {
    return {
      target: "excel",
      workspaceOp: "open",
      reason: "Explicit request to open RICO-Excel split workspace",
    };
  }

  if (
    /^(open|show|launch|switch to)\b[\s\S]{0,40}\b(dashboard|dashboards|kpi board|spend board)\b[\s!.?]*$/i.test(
      lower
    )
  ) {
    return {
      target: "dashboard",
      workspaceOp: "open",
      reason: "Explicit request to open RICO-Dashboard split workspace",
    };
  }

  // 5. Meta questions ABOUT tools/capabilities ("when should I use doc vs excel vs browser?", "what can you do?")
  if (
    /\b(when to use|when should i use|how do i use|what can you do|what tools do you have|available financial skills|connected mcp servers|how does rico work|how do spending rules work|how does strict mode work|what is strict mode)\b/i.test(
      lower
    )
  ) {
    return {
      target: "chat",
      chatSubkind: "capabilities",
      reason: "Meta/capability question answered directly without opening external search",
    };
  }

  // 6. RICO-Excel surface detection (explicit spreadsheet/table/formula work or active Excel context)
  const hasCellRangePrefix = /^cells?\s+[a-z]{1,2}\d+/i.test(trimmed);
  const hasFormulaLiteral = /=\s*(sum|average|min|max|if|count|npv|irr|pmt)\s*\(/i.test(trimmed);
  const mentionsExcelNoun =
    /\b(excel|spreadsheet|workbook|worksheet|csv|cells?|formulas?)\b/i.test(lower) ||
    /\b(in|into|to)\s+(a\s+|an\s+|the\s+|my\s+)?sheet\b/i.test(lower) ||
    hasCellRangePrefix ||
    hasFormulaLiteral;

  const asksTabularModel =
    /\b(create|build|make|generate|populate|set up|prepare|model|calculate)\b.{0,45}\b(budget model|budget table|budget tracker|budget sheet|expense tracker|expense sheet|expense table|runway model|runway calculator|burn rate table|burn model|cash ?flow table|financial model|amortization schedule|roi calculator|pricing matrix|comparison table|comparison sheet|vendor matrix)\b/i.test(
      lower
    );

  const excelReadOnly =
    /\b(what is in|what's in|whats in|read|summarize|explain|describe|show what's in)\b.{0,30}\b(excel|spreadsheet|workbook|sheet|cells?)\b/i.test(
      lower
    ) && !/\b(create|build|make|add|fill|put|update|write|set|clear|populate|insert)\b/i.test(lower);

  if (mentionsExcelNoun || asksTabularModel) {
    return {
      target: "excel",
      workspaceOp: excelReadOnly ? "read" : "edit",
      reason: excelReadOnly
        ? "Read-only inspection of current RICO-Excel snapshot"
        : "Spreadsheet modeling, cell update, or formula task for RICO-Excel",
    };
  }

  if (
    ws?.isOpen &&
    ws.activeTool === "excel" &&
    /\b(add a row|add row|add column|insert row|clear (the |this )?sheet|update cell|add total|sum column|set [a-z]{1,2}\d+)\b/i.test(
      lower
    )
  ) {
    return {
      target: "excel",
      workspaceOp: "edit",
      reason: "Contextual edit targeting the currently open RICO-Excel sheet",
    };
  }

  // 7. RICO-DOC surface detection (explicit document/memo/report authoring or active Doc context)
  const hasDocSelectionPrefix = /^regarding\s+"[^"]+"\s+in\s+doc:/i.test(trimmed);
  const mentionsDocNoun =
    /\b(rico[\s-]?doc|document|memo|memorandum|executive summary|meeting notes|sop|policy document|vendor brief|spend brief|audit report|proposal|write-up|writeup)\b/i.test(
      lower
    ) ||
    /\b(in|into|to|my|the|a|new)\s+doc\b/i.test(lower) ||
    hasDocSelectionPrefix;

  const docReadOnly =
    /\b(what is in|what's in|whats in|what does .* say|read|summarize|explain)\b.{0,30}\b(my |the |this )?(doc|document|memo|notes)\b/i.test(
      lower
    ) &&
    !/\b(into a|in a|create|draft|write|append|add to|update|rewrite|replace|prepare|make)\b/i.test(
      lower
    );

  const docEditVerb =
    /\b(write|draft|create|make|prepare|generate|append|add to|update|edit|rewrite|expand|shorten|format|outline|put|turn|summarize)\b/i.test(
      lower
    );

  if (hasDocSelectionPrefix || (mentionsDocNoun && (docReadOnly || docEditVerb))) {
    return {
      target: "doc",
      workspaceOp: docReadOnly ? "read" : "edit",
      reason: docReadOnly
        ? "Read-only summary of current RICO-DOC snapshot"
        : "Structured document authoring or editing task for RICO-DOC",
    };
  }

  if (
    ws?.isOpen &&
    ws.activeTool === "doc" &&
    /\b(append|add a section|add section|rewrite|make it shorter|make it more formal|add bullet|add action items|update the title)\b/i.test(
      lower
    )
  ) {
    return {
      target: "doc",
      workspaceOp: "edit",
      reason: "Contextual edit targeting the currently open RICO-DOC surface",
    };
  }

  // 7b. RICO-Dashboard live board creation & surgical editing
  const asksDashboardBuildOrEdit =
    /\b(create|build|make|generate|design|set up|add|edit|update|modify|refresh)\b[\s\S]{0,60}\b(dashboard|kpi board|live board)\b/i.test(
      lower
    ) ||
    /\b(to|in|on)\s+(the\s+|my\s+)?dashboard\b/i.test(lower);

  if (
    asksDashboardBuildOrEdit ||
    (ws?.isOpen &&
      ws.activeTool === "dashboard" &&
      /\b(add a chart|add chart|add table|add a table|add filter|auto[- ]?refresh|every minute|every 60s|update board)\b/i.test(
        lower
      ))
  ) {
    return {
      target: "dashboard",
      workspaceOp: "edit",
      reason: "Live RicoUI Dashboard creation or surgical in-place update",
    };
  }

  // 8. Session-local financial inquiries (own rules, spend totals, audit logs, persona savings, tax rules)
  if (
    /\b(startup credits?|posthog credits?|aws activate|zero burn|founder discounts?|persona savings|student discounts?|college deals?|university pricing|edu email|tax deductions?|schedule c|write[- ]offs?)\b/i.test(
      lower
    )
  ) {
    return {
      target: "chat",
      chatSubkind: "advisory",
      reason: "Savings, credit, discount, or tax classification inquiry",
    };
  }

  if (
    /\b(my|our|active|current|existing|list|show)\b.{0,35}\b(spending rules?|rules?|mandates?|subscriptions?|budgets?|caps?|ceilings?|transactions?|receipts?|audit logs?|monthly spend)\b/i.test(
      lower
    ) ||
    /\b(audit log|receipt details|do i have a rule|what am i paying|how much am i spending|total monthly spend|my budget)\b/i.test(
      lower
    )
  ) {
    return {
      target: "chat",
      chatSubkind: "session_rules",
      reason: "Question about the user's own session rules, spend, or audit history",
    };
  }

  // 9. RICO-Browser & Live Web Search — ONLY when external live pricing, comparison, or web lookup is requested
  const allMentionedServices = detectAllMentionedServices(trimmed);
  const singleKnown = detectKnownService(trimmed);

  // Preset category comparisons (e.g. "Compare streaming services pricing")
  const hasCompareIntent = /\b(compare|versus|vs\.?|side[- ]by[- ]side|cheaper between)\b/i.test(
    lower
  );
  if (hasCompareIntent && allMentionedServices.length >= 2) {
    return {
      target: "browser",
      browserMode: "compare_prices",
      compareServices: allMentionedServices,
      reason: `Parallel live price comparison across ${allMentionedServices.join(", ")}`,
    };
  }
  if (hasCompareIntent && /\b(streaming|devtools|developer tools|cloud)\b/i.test(lower)) {
    const presetServices = /\bstreaming\b/i.test(lower)
      ? ["Netflix Standard HD", "Spotify Premium", "YouTube Premium"]
      : /\bcloud\b/i.test(lower)
      ? ["AWS Cloud Services", "PostHog"]
      : ["GitHub Copilot", "ChatGPT Plus"];
    return {
      target: "browser",
      browserMode: "compare_prices",
      compareServices: presetServices,
      reason: "Category preset parallel browser price comparison",
    };
  }

  const asksLivePricing =
    /\b(how much (is|does|do)|what('s| is| are) the (current |live |monthly |annual )?(price|pricing|cost|rate|plan|plans|tier|tiers|fee|fees)|price of|pricing (for|of|on)|cost of|plans? for|verify (the )?price|check (the )?(live )?(price|pricing|cost|rate|plans?)|current (price|pricing|rate|cost)|monthly (price|cost|rate|fee)|subscription (price|cost|tiers?))\b/i.test(
      lower
    ) ||
    /^[a-z0-9 .+-]{2,35}\s+(price|pricing|plans?|cost|rates?)\??$/i.test(lower);

  // Single known merchant live price verification
  if (singleKnown && asksLivePricing) {
    return {
      target: "browser",
      browserMode: "verify_price",
      reason: `Live merchant price verification for ${singleKnown.service}`,
    };
  }

  // Explicit web search / live browser research request or external vendor live pricing lookup
  const explicitWebSearch =
    /\b(search (the web|online|for|google)|browse (the web|for)|look up online|find online|google|on the web|scrape|check website|latest news|current news|in 2026|right now online)\b/i.test(
      lower
    ) || /^(search|browse|look up)\s+\S+/i.test(lower);

  if (explicitWebSearch || asksLivePricing || (hasCompareIntent && asksLivePricing)) {
    return {
      target: "browser",
      browserMode: "web_search",
      reason: explicitWebSearch
        ? "Explicit live web search request"
        : "External vendor live pricing or plan lookup",
    };
  }

  // Compare two external vendors (e.g. "Compare Vercel vs Render", "Linear vs Jira pricing")
  if (
    /\b(compare\s+[a-z0-9.-]+\s+(and|vs\.?|versus)\s+[a-z0-9.-]+|[a-z0-9.-]+\s+(vs\.?|versus)\s+[a-z0-9.-]+\s+(pricing|plans|cost|features))\b/i.test(
      lower
    )
  ) {
    return {
      target: "browser",
      browserMode: "web_search",
      reason: "External multi-vendor web comparison",
    };
  }

  // 10. Pure arithmetic / financial math
  if (
    /(\d[\d,.]*\s*[%+\-*/x×÷]\s*\d[\d,.]*|\b(calculate|compute|what is \d+%|how much is \d+%)\b)/i.test(
      lower
    )
  ) {
    return {
      target: "chat",
      chatSubkind: "math",
      reason: "Direct arithmetic or financial calculation",
    };
  }

  // 11. Default: Direct conversational / analytical response in chat (NO unwanted direct search!)
  return {
    target: "chat",
    chatSubkind: "general_qa",
    reason: "General question or conversation answered directly without external web search",
  };
}

/**
 * Renders OpenCode-style dynamic tool guidance into the system prompt based on
 * available tools and current split workspace state (modeled after OpenCode's
 * packages/core/src/session/system-prompt.ts).
 */
export function renderOpenCodeToolGuidance(options?: {
  workspaceSnapshot?: SplitWorkspaceSnapshot;
  routing?: TurnRoutingDecision;
}): string {
  const ws = options?.workspaceSnapshot;
  const routing = options?.routing;

  const lines: string[] = [
    "### TOOL & WORKSPACE ROUTING POLICY (OPENCODE-STYLE DEDICATED TOOL SELECTION)",
    "- Output text directly in chat to answer questions. Only call a tool when external live data, workspace editing, or financial rule creation/quoting is genuinely needed.",
    "- NEVER default to search_and_browse_web or verify_web_price for greetings, math, general financial concepts, explanations, Rico product questions, questions about active spending rules already in context, or pure Doc/Excel drafting.",
    "- Prefer dedicated workspace tools over prose dumps or browser searches when the user wants structured artifacts:",
    "  1. DIRECT CHAT (No Split Tool): Use for greetings, Q&A, math, financial advice, explaining rules/guardrails, summarizing active spending rules in session context, or answering read-only questions about the open Doc/Excel snapshot.",
    "  2. RICO-DOC (workspace_doc_edit): Use when the user asks to write, draft, create, summarize into, format, rewrite, or append a document, memo, brief, report, proposal, policy, checklist, or notes — or when editing highlighted text in the open Doc.",
    "  3. RICO-EXCEL (workspace_excel_edit): Use when the user asks to create, build, populate, calculate, or update an Excel sheet, spreadsheet, table, budget model, runway/burn calculator, vendor matrix, cell coordinates (A1, B2:D10), or live formulas (=SUM(...)).",
    "  4. RICO-BROWSER (verify_web_price, compare_multi_service_prices, search_and_browse_web, browser_tabs, browser_snapshot, browser_act): Use ONLY when the user asks for current/live merchant pricing, multi-vendor live web comparisons, explicit web search/URL navigation, @eN DOM actions, or time-sensitive external facts beyond session context.",
    "  5. COMBINING TOOLS: If the user explicitly asks to research live web pricing AND put the findings into a Doc or Excel sheet, verify the live data first and then call workspace_doc_edit or workspace_excel_edit.",
  ];

  if (ws?.isOpen && ws.activeTool) {
    lines.push(
      `- Active Split Surface Focus: The user currently has ${ws.activeTool.toUpperCase()} open in split view. Respect this context for follow-up edits unless their question clearly targets another surface or plain chat.`
    );
  }

  if (routing) {
    lines.push(
      `- Turn Routing Hint: Primary target = ${routing.target.toUpperCase()} (${routing.reason}).`
    );
  }

  return lines.join("\n");
}
