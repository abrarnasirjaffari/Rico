import type { RicoUILibrarySpec } from "./types";

/**
 * Canonical RicoUI Component, Function, and Action Specification.
 * Shared between server-side prompt/dashboard synthesis and client-side rendering.
 */
export const RICOUI_LIBRARY_SPEC: RicoUILibrarySpec = {
  id: "ricoui-core",
  version: "1.0.0",
  root: "Stack",
  components: [
    // --- Layout & Typography ---
    {
      name: "Stack",
      category: "layout",
      description: "Vertical or horizontal flex container for grouping RicoUI blocks.",
      props: [
        { name: "children", kind: "nodes", required: true, description: "List of child components [child1, child2]" },
        { name: "direction", kind: "enum", enumValues: ["vertical", "horizontal"], defaultValue: "vertical" },
        { name: "gap", kind: "enum", enumValues: ["sm", "md", "lg"], defaultValue: "md" },
      ],
    },
    {
      name: "Grid",
      category: "layout",
      description: "Responsive multi-column grid for KPI Metrics or Cards.",
      props: [
        { name: "children", kind: "nodes", required: true },
        { name: "columns", kind: "number", defaultValue: 3, description: "Number of columns on desktop (1 to 4)" },
      ],
    },
    {
      name: "Card",
      category: "layout",
      description: "Elevated warm-neutral surface card with optional title, subtitle, and status badge.",
      props: [
        { name: "children", kind: "nodes", required: true },
        { name: "title", kind: "string" },
        { name: "subtitle", kind: "string" },
        { name: "badge", kind: "string" },
        { name: "badgeTone", kind: "enum", enumValues: ["neutral", "accent", "success", "warning", "danger"], defaultValue: "neutral" },
      ],
    },
    {
      name: "Header",
      category: "layout",
      description: "Section heading with subtitle and optional right-aligned status pill.",
      props: [
        { name: "title", kind: "string", required: true },
        { name: "subtitle", kind: "string" },
        { name: "badge", kind: "string" },
      ],
    },
    {
      name: "TextBlock",
      category: "layout",
      description: "Clean paragraph or caption text.",
      props: [
        { name: "text", kind: "string", required: true },
        { name: "tone", kind: "enum", enumValues: ["strong", "base", "muted", "mono"], defaultValue: "base" },
      ],
    },
    {
      name: "Callout",
      category: "layout",
      description: "Highlighted financial notice, guardrail alert, or tip banner.",
      props: [
        { name: "title", kind: "string", required: true },
        { name: "body", kind: "string", required: true },
        { name: "tone", kind: "enum", enumValues: ["info", "success", "warning", "danger"], defaultValue: "info" },
      ],
    },
    {
      name: "Steps",
      category: "layout",
      description: "Numbered or checkmarked workflow checklist.",
      props: [
        { name: "items", kind: "array", required: true, description: "Array of { title, detail, status? } or strings" },
      ],
    },
    {
      name: "Tabs",
      category: "layout",
      description: "Interactive tabbed switcher containing TabItem children.",
      props: [
        { name: "items", kind: "nodes", required: true, description: "List of TabItem components" },
        { name: "defaultTab", kind: "string" },
      ],
    },
    {
      name: "TabItem",
      category: "layout",
      description: "Single tab pane inside Tabs.",
      props: [
        { name: "id", kind: "string", required: true },
        { name: "label", kind: "string", required: true },
        { name: "children", kind: "nodes", required: true },
      ],
    },

    // --- Data & Visualizations ---
    {
      name: "Metric",
      category: "data",
      description: "KPI stat tile with tabular-nums value, sublabel, and trend indicator.",
      props: [
        { name: "label", kind: "string", required: true },
        { name: "value", kind: "string", required: true, description: "Formatted display value, e.g. '$15.49/mo' or '12.0 mos'" },
        { name: "sublabel", kind: "string" },
        { name: "trend", kind: "enum", enumValues: ["up", "down", "neutral", "safe", "warn", "accent"], defaultValue: "neutral" },
      ],
    },
    {
      name: "BarChart",
      category: "data",
      description: "Interactive horizontal/vertical bar chart for spend, budget caps, or runway comparisons.",
      props: [
        { name: "title", kind: "string", required: true },
        { name: "labels", kind: "array", required: true, description: "Category labels array" },
        { name: "values", kind: "array", required: true, description: "Numeric values array" },
        { name: "secondaryValues", kind: "array", description: "Optional comparison values (e.g. budget ceilings)" },
        { name: "valuePrefix", kind: "string", defaultValue: "$" },
        { name: "primaryLabel", kind: "string", defaultValue: "Current" },
        { name: "secondaryLabel", kind: "string", defaultValue: "Ceiling" },
      ],
    },
    {
      name: "LineChart",
      category: "data",
      description: "Interactive trend line chart for cash runway, burn, or monthly spend history.",
      props: [
        { name: "title", kind: "string", required: true },
        { name: "labels", kind: "array", required: true },
        { name: "values", kind: "array", required: true },
        { name: "valuePrefix", kind: "string", defaultValue: "$" },
      ],
    },
    {
      name: "DonutChart",
      category: "data",
      description: "Category spend breakdown ring chart with interactive legend.",
      props: [
        { name: "title", kind: "string", required: true },
        { name: "segments", kind: "array", required: true, description: "Array of { label, value }" },
        { name: "valuePrefix", kind: "string", defaultValue: "$" },
      ],
    },
    {
      name: "DataTable",
      category: "data",
      description: "Sortable, searchable financial table with status badges.",
      props: [
        { name: "columns", kind: "array", required: true, description: "Array of { key, label, align? }" },
        { name: "rows", kind: "array", required: true, description: "Array of row objects" },
        { name: "title", kind: "string" },
        { name: "searchable", kind: "boolean", defaultValue: false },
        { name: "emptyMessage", kind: "string", defaultValue: "No matching records." },
      ],
    },

    // --- Interactive Controls & Actions ---
    {
      name: "SliderInput",
      category: "control",
      description: "Two-way reactive range slider bound to a $state variable.",
      props: [
        { name: "label", kind: "string", required: true },
        { name: "value", kind: "binding", required: true, description: "$state variable binding" },
        { name: "min", kind: "number", required: true },
        { name: "max", kind: "number", required: true },
        { name: "step", kind: "number", defaultValue: 1 },
        { name: "prefix", kind: "string", defaultValue: "$" },
        { name: "suffix", kind: "string", defaultValue: "" },
      ],
    },
    {
      name: "SelectFilter",
      category: "control",
      description: "Segmented pill or dropdown selector bound to a $state variable.",
      props: [
        { name: "label", kind: "string", required: true },
        { name: "value", kind: "binding", required: true },
        { name: "options", kind: "array", required: true, description: "Array of { value, label } or strings" },
      ],
    },
    {
      name: "Button",
      category: "control",
      description: "Interactive button firing a RicoUI action.",
      props: [
        { name: "label", kind: "string", required: true },
        { name: "action", kind: "action", required: true },
        { name: "variant", kind: "enum", enumValues: ["primary", "secondary", "outline", "ghost"], defaultValue: "secondary" },
      ],
    },
    {
      name: "ButtonGroup",
      category: "control",
      description: "Horizontal row of interactive Buttons.",
      props: [
        { name: "buttons", kind: "nodes", required: true },
      ],
    },
    {
      name: "FollowUpChips",
      category: "control",
      description: "Compact clickable follow-up suggestion pills that continue the Rico conversation or open workspaces.",
      props: [
        { name: "items", kind: "array", required: true, description: "Array of { label, prompt?, tool?, url? }" },
      ],
    },

    // --- Rico FinOps Domain Components ---
    {
      name: "MandateBuilderCard",
      category: "finops",
      description: "Interactive inline Spending Rule configurator with live ceiling slider, recurrence selector, and 1-click rule creation.",
      props: [
        { name: "service", kind: "string", required: true },
        { name: "suggestedCeiling", kind: "number", required: true },
        { name: "currentPrice", kind: "number" },
        { name: "defaultRecurrence", kind: "string", defaultValue: "Monthly on 1st" },
        { name: "category", kind: "string", defaultValue: "Software & Cloud" },
      ],
    },
    {
      name: "RunwayCalculatorCard",
      category: "finops",
      description: "Interactive Cash, MRR & Gross Burn calculator with live sliders, runway bar, and 1-click export to RICO-Excel.",
      props: [
        { name: "initialCash", kind: "number", required: true },
        { name: "initialMrr", kind: "number", required: true },
        { name: "initialGrossBurn", kind: "number", required: true },
        { name: "title", kind: "string", defaultValue: "Interactive Runway & Burn Simulator" },
      ],
    },
    {
      name: "VendorComparisonCard",
      category: "finops",
      description: "Side-by-side verified merchant pricing comparison with best-value highlight, browser inspection, and rule setup.",
      props: [
        { name: "title", kind: "string", required: true },
        { name: "vendors", kind: "array", required: true, description: "Array of { service, planName, monthlyPrice, currency?, url?, badge? }" },
      ],
    },
    {
      name: "PaymentGuardrailCard",
      category: "finops",
      description: "Guardrail-safe payment readiness card showing price vs budget cap headroom. Never charges directly; triggers two-step quote confirmation.",
      props: [
        { name: "mandateId", kind: "string", required: true },
        { name: "service", kind: "string", required: true },
        { name: "verifiedPrice", kind: "number", required: true },
        { name: "budgetCeiling", kind: "number", required: true },
        { name: "recurrence", kind: "string", defaultValue: "Monthly" },
        { name: "status", kind: "string", defaultValue: "ACTIVE" },
      ],
    },
    {
      name: "CreditMatchCard",
      category: "finops",
      description: "Eligible startup credits, student discounts, or Schedule C tax deductions card with 1-click Doc & Rule actions.",
      props: [
        { name: "title", kind: "string", required: true },
        { name: "totalValueLabel", kind: "string", required: true },
        { name: "programs", kind: "array", required: true, description: "Array of { name, value, detail, actionPrompt? }" },
      ],
    },
    {
      name: "DashboardPreviewCard",
      category: "finops",
      description: "Inline preview card for a live RicoUI Dashboard that opens inside the right split-screen Dashboard workspace.",
      props: [
        { name: "dashboardId", kind: "string", required: true },
        { name: "title", kind: "string", required: true },
        { name: "description", kind: "string" },
        { name: "version", kind: "number", defaultValue: 1 },
      ],
    },
  ],
  functions: [
    { name: "Count", description: "Count items in an array.", params: ["list"] },
    { name: "Sum", description: "Sum numeric array or numeric field in object array.", params: ["list", "field?"] },
    { name: "Avg", description: "Average of numeric array or field.", params: ["list", "field?"] },
    { name: "Min", description: "Minimum value in numeric array.", params: ["list"] },
    { name: "Max", description: "Maximum value in numeric array.", params: ["list"] },
    { name: "Round", description: "Round number to N decimals.", params: ["value", "decimals?"] },
    { name: "Floor", description: "Floor number.", params: ["value"] },
    { name: "Ceil", description: "Ceiling number.", params: ["value"] },
    { name: "Abs", description: "Absolute value.", params: ["value"] },
    { name: "Mul", description: "Multiply two numbers (a * b).", params: ["a", "b"] },
    { name: "Div", description: "Safe division (a / b, returns 0 if b == 0).", params: ["a", "b"] },
    { name: "Percent", description: "Format part / total as whole or 1-decimal percentage string.", params: ["part", "total"] },
    { name: "Currency", description: "Format number as USD currency string like '$1,240.00'.", params: ["amount", "currency?"] },
    { name: "Filter", description: "Filter array of objects where item[field] op value.", params: ["list", "field", "op", "value"] },
    { name: "Sort", description: "Sort array of objects by field ('asc' or 'desc').", params: ["list", "field", "dir?"] },
  ],
  actions: [
    { name: "ToRico", description: "Send a follow-up prompt (plus optional context) back to Rico chat.", params: ["message", "context?"] },
    { name: "OpenUrl", description: "Open an external URL or focus it in RICO-Browser.", params: ["url"] },
    { name: "OpenWorkspace", description: "Open a split-screen workspace tab ('browser', 'doc', 'excel', or 'dashboard').", params: ["tool", "url?"] },
    { name: "StageMandate", description: "Open Create Spending Rule dialog pre-populated with service and ceiling.", params: ["service", "ceiling", "recurrence?", "category?"] },
    { name: "CreateMandateDirect", description: "Send an explicit spending rule creation turn to Rico.", params: ["service", "ceiling", "recurrence?"] },
    { name: "TriggerMandateQuote", description: "Request a server-signed two-step payment quote for an existing mandateId (never charges directly).", params: ["mandateId"] },
    { name: "OpenDashboard", description: "Open a saved live RicoUI Dashboard in split view.", params: ["dashboardId"] },
    { name: "CopyText", description: "Copy text to user clipboard.", params: ["text"] },
    { name: "Set", description: "Set a $state variable to a new value.", params: ["binding", "value"] },
    { name: "Reset", description: "Reset a $state variable to its initial value.", params: ["binding"] },
    { name: "Run", description: "Trigger a Query refresh or Mutation run.", params: ["targetId"] },
  ],
};

export const COMPONENT_SPEC_MAP = new Map(
  RICOUI_LIBRARY_SPEC.components.map((c) => [c.name, c])
);
