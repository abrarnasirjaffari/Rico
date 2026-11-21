import { RICOUI_LIBRARY_SPEC } from "./spec";
import type { RicoUIDataTool, RicoUILibrarySpec } from "./types";

export interface RicoUIPromptOptions {
  preamble?: string;
  additionalRules?: string[];
  examples?: string[];
  dataTools?: Array<Pick<RicoUIDataTool, "name" | "description" | "parametersSchema" | "sampleOutput">>;
  editMode?: boolean;
}

/**
 * Generates the compact RicoUI Lang system prompt from RICOUI_LIBRARY_SPEC.
 * Works with any local or cloud LLM (Gemini, DeepSeek, etc.) with zero external dependencies.
 */
export function generateRicoUISystemPrompt(
  options: RicoUIPromptOptions = {},
  spec: RicoUILibrarySpec = RICOUI_LIBRARY_SPEC
): string {
  const categoryLabels: Record<string, string> = {
    layout: "Layout, Tabs & Disclosure",
    data: "KPIs, Charts & Tables",
    control: "Interactive Controls & Follow-Ups",
    finops: "FinOps, Catalogs & Guardrail Cards",
  };

  const groupedOrder: Array<"layout" | "data" | "control" | "finops"> = [
    "layout",
    "data",
    "control",
    "finops",
  ];

  const sigSections = groupedOrder
    .map((cat) => {
      const comps = spec.components.filter((c) => (c.category ?? "layout") === cat);
      if (comps.length === 0) return "";
      const list = comps
        .map((c) => {
          const propsSig = c.props
            .map((p) => {
              const opt = p.required ? "" : "?";
              const typeStr =
                p.kind === "enum" && p.enumValues
                  ? p.enumValues.map((v) => `"${v}"`).join("|")
                  : p.kind === "binding"
                  ? "$state"
                  : p.kind;
              return `${p.name}${opt}: ${typeStr}`;
            })
            .join(", ");
          return `  - ${c.name}(${propsSig}) — ${c.description}`;
        })
        .join("\n");
      return `[${categoryLabels[cat]}]\n${list}`;
    })
    .filter(Boolean)
    .join("\n\n");

  const fnSigs = spec.functions
    .map((f) => `- @${f.name}(${f.params.join(", ")}) — ${f.description}`)
    .join("\n");

  const actionSigs = spec.actions
    .map((a) => `- @${a.name}(${a.params.join(", ")}) — ${a.description}`)
    .join("\n");

  const lines: string[] = [
    "### RICOUI ADAPTIVE GENERATIVE UI PROTOCOL (MATCH THE MEDIUM TO THE QUESTION)",
    options.preamble ||
      "Choose the response format that fits the user's actual question — never force one fixed template onto every turn:",
    "- Plain Conversational / Yes-No / Short Concept / Greeting Questions: Answer directly in concise, natural plain text (1 to 4 sentences). Do NOT wrap simple answers in ```ricoui, do NOT invent filler KPI tiles, and do NOT append unrelated workspace buttons.",
    "- Multi-Option Directories / Startup Programs / Grants / SaaS Stacks (4+ items): Render ```ricoui with `ProgramCatalogCard` (always pass each item's real `url: \"https://...\"`; omit `actionLabel`/`actionPrompt` unless a specific financial action applies, and NEVER write cryptic labels like \"Draft App\"). Add `Tabs` or `Metric` tiles ONLY when quantitative figures genuinely add clarity.",
    "- Quantitative Calculators / Math / Runway / Margin Scenarios: Render ```ricoui with reactive `$state` + `SliderInput` + `Metric` Grid or `RunwayCalculatorCard`.",
    "- Side-by-Side Comparisons (2 to 5 vendors/options): Render ```ricoui with `DataTable` or `VendorComparisonCard` (plus `BarChart` only when comparing real numbers).",
    "- Step-by-Step Playbooks / Workflows: Render ```ricoui with `Steps` or `Accordion`.",
    "",
    "#### RICOUI LANG SYNTAX RULES",
    "1. When using RicoUI, wrap statements inside ```ricoui ... ```.",
    "2. Write one statement per line: `name = Expression`. Write `root = Stack([...])` or `root = Card([...])` FIRST so layout streams progressively.",
    "3. Arguments are positional in the exact prop order listed below. Omit trailing optional props; pass `null` to skip optional middle props.",
    "4. Keep optional lead text above ```ricoui to 1 short sentence (zero asterisks), with zero trailing prose below ```ricoui.",
    "5. Include `FollowUpChips` ONLY when 2 or 3 specific topic follow-ups help the user explore further — never tack generic Doc/Excel/Dashboard chips onto unrelated questions.",
    "6. Reactive state variables start with `$` (e.g. `$budget = 20`) and bind two-way to `SliderInput` or `SelectFilter`.",
    "7. Built-in functions and actions start with `@` (e.g. `@Sum(items, \"amount\")`, `@ToRico(\"Compare top 2\")`, `@OpenUrl(\"https://...\")`).",
    "",
    "#### ALLOWED RICOUI COMPONENTS (GROUPED BY ROLE)",
    sigSections,
    "",
    "#### ALLOWED @FUNCTIONS",
    fnSigs,
    "",
    "#### ALLOWED @ACTIONS",
    actionSigs,
  ];

  if (options.dataTools && options.dataTools.length > 0) {
    lines.push(
      "",
      "#### LIVE DASHBOARD DATA QUERIES",
      "Use `dataVar = Query(\"tool_name\", { arg: $filter }, fallbackDefault, refreshSeconds?)` so the dashboard loads fresh live data every time it opens without calling an LLM:",
      ...options.dataTools.map(
        (t) =>
          `- ${t.name}: ${t.description}\n  Args: ${JSON.stringify(
            t.parametersSchema
          )}\n  Sample Output: ${JSON.stringify(t.sampleOutput)}`
      )
    );
  }

  if (options.editMode) {
    lines.push(
      "",
      "#### INCREMENTAL EDIT MODE",
      "Output ONLY the changed or added RicoUI statements (plus updated `root` if adding/removing top-level blocks). Set `statementName = null` to remove a block."
    );
  }

  if (options.additionalRules && options.additionalRules.length > 0) {
    lines.push("", "#### ADDITIONAL RULES", ...options.additionalRules.map((r) => `- ${r}`));
  }

  const defaultExamples = [
    [
      "Example A — Subscription pricing & rule configurator:",
      "Verified Netflix Standard HD pricing and rule setup:",
      "```ricoui",
      "root = Stack([kpis, builder, chips])",
      "kpis = Grid([m1, m2, m3], 3)",
      'm1 = Metric("Verified Rate", "$15.49/mo", "Netflix Standard HD", "safe")',
      'm2 = Metric("Suggested Cap", "$20.00/mo", "$4.51 buffer", "neutral")',
      'm3 = Metric("Annualized", "$185.88/yr", "12 billing cycles", "neutral")',
      'builder = MandateBuilderCard("Netflix Standard HD", 20, 15.49, "Monthly on 5th", "Entertainment")',
      'chips = FollowUpChips([{ label: "Compare Streaming Plans", prompt: "Compare Netflix and Spotify" }, { label: "Model in Excel", tool: "excel" }])',
      "```",
    ].join("\n"),
    [
      "Example B — Categorized directory with real official URLs (no clutter buttons):",
      "Top startup accelerators and non-dilutive cloud credit programs:",
      "```ricoui",
      "root = Stack([catalog, chips])",
      'catalog = ProgramCatalogCard("Startup Accelerators & Credit Programs", [{ name: "Y Combinator", category: "Accelerators", value: "$500,000", badge: "7% + MFN SAFE", summary: "Premier 3-month seed batch with Demo Day investor access and $500k+ cloud perks.", eligibility: "Pre-seed / Seed", url: "https://www.ycombinator.com/apply" }, { name: "PostHog for Startups", category: "Analytics & SaaS", value: "$50,000 Credits", badge: "0% Equity", summary: "12 months of product analytics, session replay, feature flags, and LLM observability.", eligibility: "<2 yrs, <$5M raised", url: "https://posthog.com/startups" }, { name: "NVIDIA Inception", category: "Cloud & AI", value: "$25k AWS + $25k GCP", badge: "90% Partner Odds", summary: "Free AI membership unlocking partner-tier AWS Activate and bootstrapped Google Cloud credits.", eligibility: "AI / Compute startups", url: "https://www.nvidia.com/en-us/startups/" }], "Filter by category or open any official program site", "Verified")',
      'chips = FollowUpChips([{ label: "Compare YC vs Techstars terms", prompt: "Compare Y Combinator vs Techstars equity and funding terms" }, { label: "How to unlock $25k AWS & GCP credits", prompt: "Show the cloud credit domino playbook" }])',
      "```",
    ].join("\n"),
  ];

  const examples = options.examples ?? defaultExamples;
  if (examples.length > 0) {
    lines.push("", "#### VALID RICOUI EXAMPLES", ...examples);
  }

  return lines.join("\n");
}
