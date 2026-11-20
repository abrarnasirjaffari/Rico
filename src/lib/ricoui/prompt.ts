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
  const sigs = spec.components
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
      return `- ${c.name}(${propsSig}) — ${c.description}`;
    })
    .join("\n");

  const fnSigs = spec.functions
    .map((f) => `- @${f.name}(${f.params.join(", ")}) — ${f.description}`)
    .join("\n");

  const actionSigs = spec.actions
    .map((a) => `- @${a.name}(${a.params.join(", ")}) — ${a.description}`)
    .join("\n");

  const lines: string[] = [
    "### RICOUI INTERACTIVE GENERATIVE UI PROTOCOL",
    options.preamble ||
      "Instead of returning plain walls of text, render smart interactive financial UIs inside a fenced ```ricoui block whenever showing metrics, spending rules, comparisons, calculators, credits, payment readiness, or structured guidance.",
    "",
    "#### RICOUI LANG SYNTAX RULES",
    "1. Wrap interactive UI inside ```ricoui ... ```.",
    "2. Write one statement per line: `name = Expression`. Always write `root = Stack([...])` or `root = Card([...])` FIRST so the layout streams immediately.",
    "3. Arguments are positional in the exact prop order listed below. Use `null` to skip optional middle arguments.",
    "4. Reactive state variables start with `$` (e.g. `$budget = 20`, `$status = \"ALL\"`) and bind two-way to SliderInput or SelectFilter.",
    "5. Built-in functions and actions start with `@` (e.g. `@Sum(items, \"amount\")`, `@ToRico(\"Build in Excel\")`, `@OpenWorkspace(\"excel\")`).",
    "6. Keep optional lead text above the ```ricoui fence to 1 short sentence (with zero asterisks).",
    "",
    "#### ALLOWED RICOUI COMPONENTS",
    sigs,
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
      "```ricoui",
      "root = Stack([kpis, builder, chips])",
      'kpis = Grid([m1, m2, m3], 3)',
      'm1 = Metric("Verified Rate", "$15.49/mo", "Netflix Standard HD", "safe")',
      'm2 = Metric("Suggested Cap", "$20.00/mo", "$4.51 buffer", "neutral")',
      'm3 = Metric("Annualized", "$185.88/yr", "12 billing cycles", "neutral")',
      'builder = MandateBuilderCard("Netflix Standard HD", 20, 15.49, "Monthly on 5th", "Entertainment")',
      'chips = FollowUpChips([{ label: "Compare Streaming Plans", prompt: "Compare Netflix and Spotify" }, { label: "Model in Excel", tool: "excel" }])',
      "```",
    ].join("\n"),
  ];

  const examples = options.examples ?? defaultExamples;
  if (examples.length > 0) {
    lines.push("", "#### VALID RICOUI EXAMPLE", ...examples);
  }

  return lines.join("\n");
}
