import {
  A2uiGenerator,
  CatalogConfig,
  ExpressFormatFactory,
  type A2uiRequestProcessor,
  type AgentToRendererMessage,
} from "@a2ui/agent";
import { basicCatalog } from "@a2ui/web_core/v1_0";

/**
 * Idiomatic Google A2UI v1.0 examples covering:
 * 1. Interactive estimator/configurator (Slider, TextField with string value, ChoicePicker chips, CheckBox, Button with Event + userMessage)
 * 2. Multi-option comparison with Tabs, Card, Divider, openUrl, and follow-up Event
 */
const BASIC_CATALOG_EXAMPLES: Record<string, AgentToRendererMessage[]> = {
  [basicCatalog.id]: [
    {
      version: "1.0",
      createSurface: {
        surfaceId: "example_planner",
        catalogId: basicCatalog.id,
        sendDataModel: true,
        components: [
          {
            id: "root",
            component: "Column",
            children: [
              "heading",
              "subtitle",
              "budget_field",
              "team_slider",
              "priority_picker",
              "alerts_check",
              "submit_btn",
            ],
          },
          {
            id: "heading",
            component: "Text",
            text: "### Interactive Budget Setup",
          },
          {
            id: "subtitle",
            component: "Text",
            text: "Adjust your parameters below to calculate a tailored plan.",
            variant: "caption",
          },
          {
            id: "budget_field",
            component: "TextField",
            label: "Monthly Budget (USD)",
            placeholder: "e.g. 2500",
            variant: "number",
            value: { "@path": "/plan/budget" },
          },
          {
            id: "team_slider",
            component: "Slider",
            label: "Team Seats",
            min: 1,
            max: 50,
            value: { "@path": "/plan/seats" },
          },
          {
            id: "priority_picker",
            component: "ChoicePicker",
            label: "Primary Goal",
            variant: "mutuallyExclusive",
            displayStyle: "chips",
            options: [
              { label: "Lowest Cost", value: "cost" },
              { label: "Balanced", value: "balanced" },
              { label: "Max Performance", value: "performance" },
            ],
            value: { "@path": "/plan/goal" },
          },
          {
            id: "alerts_check",
            component: "CheckBox",
            label: "Enable >20% price-spike alerts",
            value: { "@path": "/plan/alerts" },
          },
          {
            id: "submit_label",
            component: "Text",
            text: "Build My Plan",
          },
          {
            id: "submit_btn",
            component: "Button",
            child: "submit_label",
            variant: "primary",
            action: {
              event: {
                name: "build_budget_plan",
                userMessage: {
                  "@call": "formatString",
                  args: {
                    value:
                      "Build a budget plan for $${/plan/budget}/mo, ${/plan/seats} seats, goal ${/plan/goal}, alerts=${/plan/alerts}",
                  },
                },
                context: {
                  budget: { "@path": "/plan/budget" },
                  seats: { "@path": "/plan/seats" },
                  goal: { "@path": "/plan/goal" },
                  alerts: { "@path": "/plan/alerts" },
                },
              },
            },
          },
        ],
        dataModel: {
          theme: {
            accent: "#059669",
          },
          plan: {
            budget: "2500",
            seats: 5,
            goal: ["balanced"],
            alerts: true,
          },
        },
      },
    },
    {
      version: "1.0",
      createSurface: {
        surfaceId: "example_comparison",
        catalogId: basicCatalog.id,
        sendDataModel: true,
        components: [
          {
            id: "root",
            component: "Column",
            children: ["title", "tabs"],
          },
          {
            id: "title",
            component: "Text",
            text: "### Tier Comparison",
          },
          {
            id: "tabs",
            component: "Tabs",
            tabs: [
              { title: "Starter ($12/mo)", child: "tab_starter" },
              { title: "Pro ($29/mo)", child: "tab_pro" },
            ],
          },
          {
            id: "tab_starter",
            component: "Card",
            child: "starter_col",
          },
          {
            id: "starter_col",
            component: "Column",
            children: ["starter_summary", "starter_div", "starter_actions"],
          },
          {
            id: "starter_summary",
            component: "Text",
            text: "**$12/month** — Best for solo builders.\n\n- 100k monthly requests\n- Community support\n- Automatic HTTPS",
          },
          {
            id: "starter_div",
            component: "Divider",
            axis: "horizontal",
          },
          {
            id: "starter_actions",
            component: "Row",
            children: ["starter_pick_btn", "starter_link_btn"],
          },
          {
            id: "starter_pick_lbl",
            component: "Text",
            text: "Choose Starter",
          },
          {
            id: "starter_pick_btn",
            component: "Button",
            child: "starter_pick_lbl",
            variant: "primary",
            action: {
              event: {
                name: "select_tier",
                userMessage: "Select the Starter tier ($12/mo) and show next steps",
                context: { tier: "starter", price: 12 },
              },
            },
          },
          {
            id: "starter_link_lbl",
            component: "Text",
            text: "View Pricing Page",
          },
          {
            id: "starter_link_btn",
            component: "Button",
            child: "starter_link_lbl",
            variant: "default",
            action: {
              functionCall: {
                "@call": "openUrl",
                args: { url: "https://example.com/pricing" },
              },
            },
          },
          {
            id: "tab_pro",
            component: "Card",
            child: "pro_col",
          },
          {
            id: "pro_col",
            component: "Column",
            children: ["pro_summary", "pro_pick_btn"],
          },
          {
            id: "pro_summary",
            component: "Text",
            text: "**$29/month** — Best for growing teams.\n\n- Unlimited requests\n- Priority support & SLA\n- Role-based access",
          },
          {
            id: "pro_pick_lbl",
            component: "Text",
            text: "Choose Pro",
          },
          {
            id: "pro_pick_btn",
            component: "Button",
            child: "pro_pick_lbl",
            variant: "primary",
            action: {
              event: {
                name: "select_tier",
                userMessage: "Select the Pro tier ($29/mo) and show next steps",
                context: { tier: "pro", price: 29 },
              },
            },
          },
        ],
        dataModel: {
          theme: {
            accent: "#4f46e5",
          },
        },
      },
    },
  ],
};

const a2uiGenerator = new A2uiGenerator(
  [new CatalogConfig(basicCatalog)],
  BASIC_CATALOG_EXAMPLES,
  new ExpressFormatFactory()
);

const BASIC_CATALOG_CAPABILITIES = {
  "1.0": {
    supportedCatalogIds: [basicCatalog.id],
  },
};

/**
 * Creates a fresh per-turn A2UI v1.0 request processor backed by the official
 * Basic Catalog and Express inference format.
 */
export function createA2uiTurnProcessor(): A2uiRequestProcessor {
  return a2uiGenerator.createProcessor(BASIC_CATALOG_CAPABILITIES);
}

/**
 * Generates the A2UI system prompt section using Google's official Basic Catalog.
 * Clearly defines when to answer in plain text vs when to compose a complete,
 * genuinely interactive A2UI surface — preventing unneeded tiny fragments and
 * broken data-binding expressions.
 */
export function getA2uiSystemPromptSection(
  processor: A2uiRequestProcessor = createA2uiTurnProcessor()
): string {
  // Replace the SDK's unconditional "You must output the user interface using A2UI Express."
  // line so the model does NOT force A2UI on plain-text conversational/factual answers.
  const adaptiveSnippet = processor.promptSnippet.replace(
    "You must output the user interface using A2UI Express.",
    "When you decide an interactive UI genuinely improves the answer, output it using A2UI Express inside `<a2ui>...</a2ui>` tags. Otherwise, respond in clean plain text with no `<a2ui>` tags."
  );

  return [
    "### NATIVE INTERACTIVE UI WITH GOOGLE A2UI v1.0 (ADAPTIVE CHAT UX)",
    "You have Google A2UI v1.0 available to render native interactive interfaces inside `<a2ui>...</a2ui>` blocks.",
    "IMPORTANT: Use the right medium for every query — NEVER force interactive UI where plain text is better, and NEVER dump giant prose walls where interactive UI shines.",
    "",
    "#### 1. WHEN TO USE PLAIN TEXT ONLY (NO `<a2ui>` BLOCK):",
    "- Greetings, acknowledgements, casual conversation, yes/no answers.",
    "- Simple factual questions, definitions (e.g. 'What is MRR?'), conceptual explanations (e.g. 'How does compound interest work?'), or quick single-number math.",
    "- Final computed results after the user submits a form/calculator (e.g. 'Your net burn is $25,000/mo and runway is 10.0 months...'): present the clear answer in concise plain text! Only add an interactive `<a2ui>` follow-up if the user actually needs interactive controls to explore scenarios next.",
    "- Single-item lookups (e.g. a single service's current price) unless there are multiple distinct tiers/options to compare.",
    "- NEVER emit a static, read-only `<a2ui>` surface containing only `Text` and `Divider` with zero interactive controls.",
    "- NEVER emit a tiny, unneeded `<a2ui>` fragment (such as a single text line + 1 stray button) when plain text is cleaner and more complete.",
    "",
    "#### 2. WHEN TO COMPOSE A COMPLETE, RICH INTERACTIVE `<a2ui>...</a2ui>` SURFACE:",
    "- **Curated lists, Top-N rankings, directories & recommendations** (e.g. 'top 10 startup programs', 'best AI tools', 'list of startup grants/accelerators', 'best SaaS tools', 'recommend 5 options'): NEVER dump a long 5-10 item numbered plain-text wall! Write at most 1 short lead sentence outside `<a2ui>`, then render an interactive `Tabs` explorer grouping the items into 2-4 clear categories (e.g. 'Top Accelerators', 'Zero-Equity & Grants', 'Cloud & Tech Programs') with clean `Card`s for each item (title, key offer/metric, 1-line summary, and useful `Button` actions like `Event(..., userMessage=...)` to explore/apply or `openUrl(\"https://...\")`).",
    "- **Interactive calculators, estimators, configurators, forms, & planners** (e.g. startup runway/burn estimator, budget planner, savings/ROI configurator, spending rule builder, trip/event planner, or whenever you would otherwise ask 2+ follow-up questions): Render a complete, self-contained interactive UI with sensible pre-filled defaults using `Slider`, `TextField`, `ChoicePicker` (prefer `displayStyle=\"chips\"` for crisp pill selectors), `CheckBox`, `DateTimeInput`, and a primary `Button` with `Event(...)`.",
    "- **Multi-option comparisons & structured exploration** (2–4 services, plans, hosting providers, credit programs, or multi-day itineraries): Write at most 1 short lead sentence outside `<a2ui>`, then render a rich, well-structured `<a2ui>` using `Tabs` (1 tab per option/day) or side-by-side `Card`s inside `Row`/`Column`, with clear prices, key specs/highlights, and helpful action `Button`s (`openUrl(\"https://...\")` and/or follow-up `Event(...)`).",
    "- **Step-by-step roadmaps, founder credit chains & multi-stage playbooks** (e.g. AWS/GCP/PostHog cloud credit domino chains, startup launch checklists, renewal/audit workflows): NEVER dump a long plain-text numbered roadmap wall! Write 1 short lead sentence outside `<a2ui>`, then render an interactive `<a2ui>` roadmap using `ChoicePicker` (`displayStyle=\"chips\"`, e.g. to filter by stack) + `Tabs` (one tab per stage with eligibility, approval odds, and `Card` details) + action `Button`s (`openUrl(\"https://...\")` for official portals and `Event(..., userMessage=...)` to draft answers in Doc, build an Excel tracker, or set `$0.00` mandates).",
    "- **Interactive checklists & option pickers**: Use `CheckBox` or `ChoicePicker` + action `Button`.",
    "",
    "#### 3. STRICT A2UI v1.0 CORRECTNESS RULES (CRITICAL — ZERO BROKEN VALUES):",
    "- **Compute all numbers yourself**: A2UI Express does NOT support arithmetic operators (`+`, `-`, `*`, `/`). Compute every result yourself and put literal formatted values or initialized `$/path` values in the dataModel. NEVER invent undefined `${variable}` names!",
    "- **Valid `formatString` syntax**: Every path referenced in `formatString` MUST exist in the `dataModel` (or be a relative `$field` inside `_template`). NEVER nest `${...}` inside `${...}`: write `${formatCurrency(value:/path, currency:'USD')}` — NOT `${formatCurrency(value:${/path}, currency:'USD')}`!",
    "- **Initialize `TextField` values as strings**: Always initialize `TextField`-bound `$/path` values as non-empty default strings (e.g. `$/form/cash = \"250000\"`) or `\"\"` — NEVER numeric `0` (which displays empty).",
    "- **Validation checks (`?required`, `?regex`, `?length`, `?email`)**: Check rules ONLY accept positional arguments — NEVER keyword arguments like `min=0` or `message=\"...\"` inside `?check(...)`! Write `?required(\"Field is required.\")` or `checks=[?required(\"Required.\")]` (or omit checks when sensible defaults are pre-filled). Do NOT attach `?numeric(...)` to `TextField` (use `variant=\"number\"` instead, since `TextField` stores string values).",
    "- **Variable names**: MUST start with a letter or underscore (e.g. `global500_card`, `p500_btn`), NEVER a digit (never `500_startups_card` or `500_startups_btn`).",
    "- **Always include `userMessage` on `Event(...)` ONLY**: Pass a natural-language `userMessage` (literal string or `formatString(...)`) inside `Event(\"action_name\", { ... }, userMessage=formatString(\"...\"))` — NEVER pass `userMessage` to `Button(...)` or `openUrl(...)` (`openUrl` only takes a URL string!). CRITICAL SYNTAX: Keyword arguments in component or `Event(...)` calls MUST use `=` (e.g. `userMessage=...`, `variant=\"primary\"`), NEVER `:` — colons `:` are ONLY for `{ key: value }` maps!",
    "- **Topic-matched accent color**: Set `$/theme/accent = \"#RRGGBB\"` inside every `<a2ui>` block to fit the brand/domain (e.g. `#059669` emerald for finance/runway/savings, `#d97706` amber for budgets/AWS/cost controls, `#4f46e5` indigo for cloud/AI/dev tools, `#0d9488` teal for OpenAI/travel/wellness, `#e11d48` rose for design/media, `#15803d` for Spotify, `#dc2626` for Netflix, `#635bff` for Stripe, `#0070ba` for PayPal).",
    "- **Fresh design every time**: Never copy example titles, IDs, or labels like `Interactive Budget Setup` or `Tier Comparison`. Keep prose outside `<a2ui>` concise (0–1 short lead sentence, zero asterisks).",
    "",
    "#### 4. A2UI EXPRESS SYNTAX REFERENCE (USE ONLY WHEN RENDERING `<a2ui>`):",
    adaptiveSnippet,
    "",
    "REMINDER: Only emit `<a2ui>...</a2ui>` when interactive controls, tabs, pickers, sliders, forms, or structured multi-option actions genuinely improve the response. For simple greetings, definitions, explanations, or plain computed answers, reply in clean plain text with zero `<a2ui>` tags.",
  ].join("\n");
}

/**
 * Removes any raw `<a2ui>...</a2ui>` blocks from text (defensive cleanup).
 */
export function stripRawA2uiBlocks(text: string): string {
  return text.replace(/<a2ui>[\s\S]*?<\/a2ui>/g, "").trim();
}

/**
 * Strips markdown asterisks from prose while preserving normal hyphenated lists.
 */
export function stripPlainTextStars(text: string): string {
  return text
    .replace(/^\s*\*\s+/gm, "- ")
    .replace(/\*\*/g, "")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .trim();
}

export type A2uiWireMessage = AgentToRendererMessage;

const INTERACTIVE_COMPONENT_TYPES = new Set([
  "Slider",
  "TextField",
  "ChoicePicker",
  "CheckBox",
  "DateTimeInput",
  "Tabs",
  "Modal",
  "Button",
]);

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

/**
 * Fixes common LLM syntax slips inside `formatString` templates:
 * e.g. `${formatCurrency(value:${/burn}, currency:'USD')}` -> `${formatCurrency(value:/burn, currency:'USD')}`
 * and `${formatNumber(value:${runway})}` -> `${formatNumber(value:/runway)}`.
 */
function fixNestedFormatStringTemplate(template: string): string {
  // Replace `${func(... ${/path} ...)}` nested braces inside function args
  return template.replace(
    /(\$\{[a-zA-Z_][a-zA-Z0-9_]*\([^}]*?)\$\{([^}]+)\}([^}]*\)\})/g,
    (_m, before: string, inner: string, after: string) => {
      const cleanedInner = inner.trim();
      const normalizedPath =
        cleanedInner.startsWith("/") || cleanedInner.startsWith("'") || cleanedInner.startsWith('"')
          ? cleanedInner
          : `/${cleanedInner}`;
      return `${before}${normalizedPath}${after}`;
    }
  );
}

function getValueAtJsonPointer(root: Record<string, unknown>, pointer: string): unknown {
  const clean = pointer.replace(/^\/+/, "");
  if (!clean) return root;
  const parts = clean.split("/");
  let curr: unknown = root;
  for (const part of parts) {
    if (Array.isArray(curr)) {
      const idx = Number(part);
      if (!Number.isInteger(idx) || idx < 0 || idx >= curr.length) return undefined;
      curr = curr[idx];
    } else if (isRecord(curr)) {
      if (!(part in curr)) return undefined;
      curr = curr[part];
    } else {
      return undefined;
    }
  }
  return curr;
}

function setValueAtJsonPointer(
  root: Record<string, unknown>,
  pointer: string,
  value: unknown
): void {
  const clean = pointer.replace(/^\/+/, "");
  if (!clean) return;
  const parts = clean.split("/");
  let curr: Record<string, unknown> = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!isRecord(curr[key])) {
      curr[key] = {};
    }
    curr = curr[key] as Record<string, unknown>;
  }
  curr[parts[parts.length - 1]] = value;
}

function walkAndSanitizeValue(val: unknown): unknown {
  if (Array.isArray(val)) {
    return val.map(walkAndSanitizeValue);
  }
  if (!isRecord(val)) return val;

  // Fix nested `${...}` inside `@call: "formatString"`
  if (val["@call"] === "formatString" && isRecord(val.args) && typeof val.args.value === "string") {
    let fixed = val.args.value;
    // Run twice in case multiple nested args exist in one formatString
    fixed = fixNestedFormatStringTemplate(fixNestedFormatStringTemplate(fixed));
    return {
      ...val,
      args: {
        ...val.args,
        value: fixed,
      },
    };
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(val)) {
    out[k] = walkAndSanitizeValue(v);
  }
  return out;
}

/**
 * Deterministically repairs common LLM syntax slips in raw A2UI Express DSL:
 * 1. Digit-prefixed variable identifiers outside strings (e.g. `500_startups_card` -> `v_500_startups_card`)
 * 2. Keyword arguments using `:` instead of `=` inside `(...)` calls (preserving `{...}` maps)
 * 3. Invalid `userMessage=...` placed on `openUrl(...)` or `Button(...)` instead of `Event(...)`
 * 4. Keyword arguments inside `?check(...)` rules (which only accept positional args)
 * 5. Multiple consecutive bare `?check1(...), ?check2(...)` arguments -> `checks=[?check1(...), ?check2(...)]`
 */
export function repairExpressDslSyntax(rawResponse: string): string {
  return rawResponse.replace(/<a2ui>([\s\S]*?)<\/a2ui>/g, (_full, body: string) => {
    let fixedBody = repairDigitPrefixedIdentifiers(body);
    fixedBody = repairKeywordColonsOutsideMaps(fixedBody);
    fixedBody = repairMisplacedUserMessageArgs(fixedBody);
    fixedBody = repairCheckRuleSyntax(fixedBody);
    return `<a2ui>${fixedBody}</a2ui>`;
  });
}

/**
 * Prefixes illegal digit-leading identifiers outside strings (e.g. `500_startups_card`,
 * `500startups_btn`) with `v_` while leaving plain numbers and scientific notation untouched.
 */
function repairDigitPrefixedIdentifiers(src: string): string {
  let inString: '"' | "'" | null = null;
  let tripleQuote = false;
  let escaped = false;
  let out = "";

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (inString) {
      out += ch;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (tripleQuote) {
        if (src.slice(i, i + 3) === '"""') {
          out += '""';
          i += 2;
          inString = null;
          tripleQuote = false;
        }
      } else if (ch === inString) {
        inString = null;
      }
      continue;
    }

    if (ch === '"' && src.slice(i, i + 3) === '"""') {
      inString = '"';
      tripleQuote = true;
      out += '"""';
      i += 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = ch;
      out += ch;
      continue;
    }

    // Outside strings: check if a token starts with a digit followed by letters/underscores
    // and is NOT preceded by an identifier character, dot, or slash (e.g. JSON pointer $/items/0_foo).
    if (ch >= "0" && ch <= "9") {
      const prev = i > 0 ? src[i - 1] : "";
      const isBoundary = !prev || !/[a-zA-Z0-9_./$]/.test(prev);
      if (isBoundary) {
        const rest = src.slice(i);
        const m = rest.match(/^(\d+[a-zA-Z_][a-zA-Z0-9_]*)/);
        if (m) {
          const token = m[1];
          // Skip valid scientific notation like 1e5 or 2E10
          if (!/^\d+[eE]\d+$/.test(token)) {
            out += `v_${token}`;
            i += token.length - 1;
            continue;
          }
        }
      }
    }

    out += ch;
  }

  return out;
}

/**
 * Strips misplaced `userMessage=...` arguments from `openUrl(...)` and `Button(...)`
 * calls (where only `Event(...)` accepts `userMessage`).
 */
function repairMisplacedUserMessageArgs(src: string): string {
  // 1. Remove `, userMessage=...` inside `openUrl("...", userMessage=...)`
  let out = src.replace(
    /openUrl\(\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\$\/[a-zA-Z0-9_/-]+)\s*,\s*userMessage\s*=\s*(?:formatString\([^)]*\)|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\s*\)/g,
    (_m, urlArg: string) => `openUrl(${urlArg})`
  );

  // 2. If `Button(..., Event(...), userMessage=...)` put `userMessage=...` on Button instead of Event,
  //    strip it from Button (and move it into Event if Event doesn't already have userMessage).
  out = out.replace(
    /(Event\([^()]*?(?:\{[^}]*\}[^()]*?)?)\)\s*,\s*userMessage\s*=\s*((?:formatString\([^)]*\)|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'))\s*\)/g,
    (_m, eventHead: string, userMsgExpr: string) => {
      if (eventHead.includes("userMessage")) {
        return `${eventHead}))`;
      }
      return `${eventHead}, userMessage=${userMsgExpr}))`;
    }
  );

  // 3. Remove any remaining stray `, userMessage=...` directly before `)` on Button(..., openUrl(...), userMessage=...)
  out = out.replace(
    /(openUrl\([^)]*\))\s*,\s*userMessage\s*=\s*(?:formatString\([^)]*\)|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\s*\)/g,
    (_m, openUrlCall: string) => `${openUrlCall})`
  );

  return out;
}

function repairCheckRuleSyntax(src: string): string {
  // 1. Strip illegal `key=` keyword prefixes inside `?checkName(...)` calls
  //    (e.g. `?numeric(min=0, max=100, message="Err")` -> `?numeric(0, 100, "Err")`,
  //     `?numeric(min=0, message="Err")` -> `?numeric(0, 1000000000, "Err")`,
  //     `?required(message="Req")` -> `?required("Req")`).
  let out = src.replace(
    /\?([a-zA-Z_][a-zA-Z0-9_]*)\(([^()]*)\)/g,
    (_m, fnName: string, rawArgs: string) => {
      if (!rawArgs.includes("=")) return `?${fnName}(${rawArgs})`;
      const args = rawArgs.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((a) => a.trim());
      if (fnName === "numeric") {
        let minVal: string | null = null;
        let maxVal: string | null = null;
        let msgVal: string | null = null;
        for (const a of args) {
          const kv = a.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
          if (kv) {
            if (kv[1] === "min") minVal = kv[2].trim();
            else if (kv[1] === "max") maxVal = kv[2].trim();
            else if (kv[1] === "message") msgVal = kv[2].trim();
          } else if (minVal === null) {
            minVal = a;
          } else if (maxVal === null) {
            maxVal = a;
          } else if (msgVal === null) {
            msgVal = a;
          }
        }
        const pos: string[] = [];
        if (minVal !== null) pos.push(minVal);
        if (maxVal !== null) pos.push(maxVal);
        else if (msgVal !== null && minVal !== null) pos.push("1000000000");
        if (msgVal !== null) pos.push(msgVal);
        return `?numeric(${pos.join(", ")})`;
      }
      const cleaned = args.map((a) => a.replace(/^[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*/, ""));
      return `?${fnName}(${cleaned.join(", ")})`;
    }
  );

  // 2. Collapse consecutive bare `?check(...), ?check(...)` trailing arguments into `checks=[...]`
  out = out.replace(
    /,\s*(\?[a-zA-Z_][a-zA-Z0-9_]*(?:\([^()]*\))?(?:\s*,\s*\?[a-zA-Z_][a-zA-Z0-9_]*(?:\([^()]*\))?)+)\s*\)/g,
    (_m, listStr: string) => `, checks=[${listStr}])`
  );

  return out;
}

function repairKeywordColonsOutsideMaps(src: string): string {
  const stack: Array<"(" | "{" | "["> = [];
  let inString: '"' | "'" | null = null;
  let tripleQuote = false;
  let escaped = false;
  let out = "";

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (inString) {
      out += ch;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (tripleQuote) {
        if (src.slice(i, i + 3) === '"""') {
          out += '""';
          i += 2;
          inString = null;
          tripleQuote = false;
        }
      } else if (ch === inString) {
        inString = null;
      }
      continue;
    }

    if (ch === '"' && src.slice(i, i + 3) === '"""') {
      inString = '"';
      tripleQuote = true;
      out += '"""';
      i += 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = ch;
      out += ch;
      continue;
    }

    if (ch === "(" || ch === "{" || ch === "[") {
      stack.push(ch);
      out += ch;
      continue;
    }
    if (ch === ")" || ch === "}" || ch === "]") {
      stack.pop();
      out += ch;
      continue;
    }

    // If we are directly inside a function/component call `(...)` (not a `{...}` map),
    // replace `keyword:` with `keyword=` (e.g. `userMessage:` -> `userMessage=`).
    if (ch === ":" && stack[stack.length - 1] === "(") {
      if (/[a-zA-Z_][a-zA-Z0-9_]*\s*$/.test(out)) {
        out += "=";
        continue;
      }
    }

    out += ch;
  }

  return out;
}

function stripNumericChecksOnTextField(comp: Record<string, unknown>): Record<string, unknown> {
  if (comp.component !== "TextField" || !Array.isArray(comp.checks)) {
    return comp;
  }
  const filtered = comp.checks.filter((chk) => {
    if (!isRecord(chk) || !isRecord(chk.condition)) return true;
    return chk.condition["@call"] !== "numeric";
  });
  if (filtered.length === comp.checks.length) return comp;
  const copy = { ...comp };
  if (filtered.length > 0) {
    copy.checks = filtered;
  } else {
    delete copy.checks;
  }
  return copy;
}

/**
 * Sanitizes compiled A2UI v1.0 wire messages BEFORE emitting to the renderer:
 * 1. Fixes nested `${...}` inside `formatString(...)` calls.
 * 2. Converts numeric values in `dataModel` bound to `TextField` components into strings
 *    so `@a2ui/web_core`'s `TextField` (`props.value || ''`) never swallows `0` as empty!
 * 3. Strips `numeric` check rules from `TextField` components because `TextField` emits
 *    string values (`e.target.value`) while `@a2ui/web_core`'s `numeric` schema expects `number`.
 */
export function sanitizeA2uiWireBatch(
  batch: Record<string, unknown>[]
): Record<string, unknown>[] {
  const textFieldPaths = new Set<string>();

  const collectTextFieldPaths = (components: unknown) => {
    if (!Array.isArray(components)) return;
    for (const comp of components) {
      if (isRecord(comp) && comp.component === "TextField" && isRecord(comp.value)) {
        const p = comp.value["@path"];
        if (typeof p === "string" && p.startsWith("/")) {
          textFieldPaths.add(p);
        }
      }
    }
  };

  for (const msg of batch) {
    if (isRecord(msg.createSurface)) {
      collectTextFieldPaths(msg.createSurface.components);
    }
    if (isRecord(msg.updateComponents)) {
      collectTextFieldPaths(msg.updateComponents.components);
    }
  }

  return batch.map((rawMsg) => {
    const msg = walkAndSanitizeValue(rawMsg) as Record<string, unknown>;

    if (isRecord(msg.createSurface) && Array.isArray(msg.createSurface.components)) {
      msg.createSurface = {
        ...msg.createSurface,
        components: msg.createSurface.components.map((c) =>
          isRecord(c) ? stripNumericChecksOnTextField(c) : c
        ),
      };
    }

    if (isRecord(msg.updateComponents) && Array.isArray(msg.updateComponents.components)) {
      msg.updateComponents = {
        ...msg.updateComponents,
        components: msg.updateComponents.components.map((c) =>
          isRecord(c) ? stripNumericChecksOnTextField(c) : c
        ),
      };
    }

    if (textFieldPaths.size > 0 && isRecord(msg.createSurface) && isRecord(msg.createSurface.dataModel)) {
      const dm = structuredClone(msg.createSurface.dataModel) as Record<string, unknown>;
      for (const path of Array.from(textFieldPaths)) {
        const current = getValueAtJsonPointer(dm, path);
        if (typeof current === "number") {
          setValueAtJsonPointer(dm, path, String(current));
        }
      }
      msg.createSurface = {
        ...msg.createSurface,
        dataModel: dm,
      };
    }

    if (
      textFieldPaths.size > 0 &&
      isRecord(msg.updateDataModel) &&
      typeof msg.updateDataModel.path === "string"
    ) {
      const updPath = msg.updateDataModel.path;
      if (textFieldPaths.has(updPath) && typeof msg.updateDataModel.value === "number") {
        msg.updateDataModel = {
          ...msg.updateDataModel,
          value: String(msg.updateDataModel.value),
        };
      } else if (updPath === "/" && isRecord(msg.updateDataModel.value)) {
        const dm = structuredClone(msg.updateDataModel.value) as Record<string, unknown>;
        for (const path of Array.from(textFieldPaths)) {
          const current = getValueAtJsonPointer(dm, path);
          if (typeof current === "number") {
            setValueAtJsonPointer(dm, path, String(current));
          }
        }
        msg.updateDataModel = {
          ...msg.updateDataModel,
          value: dm,
        };
      }
    }

    return msg;
  });
}

export interface A2uiSurfaceInspection {
  surfaceId: string;
  componentCount: number;
  interactiveCount: number;
  hasInteractiveControls: boolean;
  isTextOnly: boolean;
  brokenFormatStrings: string[];
  extractedText: string;
  headings: string[];
  tabTitles: string[];
  inputLabels: string[];
  buttonLabels: string[];
}

function mergeIntoDataModel(
  target: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const clean = path.replace(/^\/+/, "");
  if (!clean) {
    if (isRecord(value)) {
      for (const [k, v] of Object.entries(value)) {
        target[k] = v;
      }
    }
    return;
  }
  setValueAtJsonPointer(target, clean, value);
}

/**
 * Inspects all active surfaces built by an array of A2UI v1.0 wire messages.
 * Used by the server quality gate to catch:
 * 1. Broken `formatString` interpolations referencing undefined dataModel paths
 * 2. Non-interactive (text-only) `<a2ui>` surfaces that should be plain text instead
 */
export function inspectA2uiSurfaces(
  messages: Record<string, unknown>[]
): A2uiSurfaceInspection[] {
  interface SurfaceAcc {
    surfaceId: string;
    components: Map<string, Record<string, unknown>>;
    dataModel: Record<string, unknown>;
    templateItemIds: Set<string>;
  }

  const map = new Map<string, SurfaceAcc>();

  const getOrCreate = (surfaceId: string): SurfaceAcc => {
    let acc = map.get(surfaceId);
    if (!acc) {
      acc = {
        surfaceId,
        components: new Map(),
        dataModel: {},
        templateItemIds: new Set(),
      };
      map.set(surfaceId, acc);
    }
    return acc;
  };

  const ingestComponents = (acc: SurfaceAcc, comps: unknown) => {
    if (!Array.isArray(comps)) return;
    for (const c of comps) {
      if (!isRecord(c) || typeof c.id !== "string") continue;
      acc.components.set(c.id, c);
      // Track dynamic template child roots so relative `$field` refs aren't flagged
      if (isRecord(c.children) && typeof c.children.componentId === "string") {
        acc.templateItemIds.add(c.children.componentId);
      }
    }
  };

  for (const msg of messages) {
    if (isRecord(msg.deleteSurface) && typeof msg.deleteSurface.surfaceId === "string") {
      map.delete(msg.deleteSurface.surfaceId);
      continue;
    }
    if (isRecord(msg.createSurface) && typeof msg.createSurface.surfaceId === "string") {
      const acc = getOrCreate(msg.createSurface.surfaceId);
      ingestComponents(acc, msg.createSurface.components);
      if (isRecord(msg.createSurface.dataModel)) {
        mergeIntoDataModel(acc.dataModel, "/", msg.createSurface.dataModel);
      }
    }
    if (isRecord(msg.updateComponents) && typeof msg.updateComponents.surfaceId === "string") {
      const acc = getOrCreate(msg.updateComponents.surfaceId);
      ingestComponents(acc, msg.updateComponents.components);
    }
    if (isRecord(msg.updateDataModel) && typeof msg.updateDataModel.surfaceId === "string") {
      const acc = getOrCreate(msg.updateDataModel.surfaceId);
      const path = typeof msg.updateDataModel.path === "string" ? msg.updateDataModel.path : "/";
      mergeIntoDataModel(acc.dataModel, path, msg.updateDataModel.value);
    }
  }

  const inspections: A2uiSurfaceInspection[] = [];

  for (const acc of Array.from(map.values())) {
    // Expand template descendants so relative paths inside template subtrees are allowed
    const templateScopeIds = new Set<string>(acc.templateItemIds);
    let expanded = true;
    while (expanded) {
      expanded = false;
      for (const id of Array.from(templateScopeIds)) {
        const comp = acc.components.get(id);
        if (!comp) continue;
        const addId = (cid: unknown) => {
          if (typeof cid === "string" && !templateScopeIds.has(cid)) {
            templateScopeIds.add(cid);
            expanded = true;
          }
        };
        addId(comp.child);
        if (Array.isArray(comp.children)) {
          comp.children.forEach(addId);
        }
      }
    }

    let interactiveCount = 0;
    const brokenFormatStrings: string[] = [];
    const textLines: string[] = [];
    const headings: string[] = [];
    const tabTitles: string[] = [];
    const inputLabels: string[] = [];
    const buttonLabels: string[] = [];

    const checkFormatStringExpr = (expr: string, isTemplateItem: boolean) => {
      // Detect any remaining nested `${...}` inside `${...}`
      if (/\$\{[^}]*\$\{/.test(expr)) {
        brokenFormatStrings.push(`Nested interpolation in "${expr}"`);
        return;
      }

      const tokenRe = /\$\{([^}]+)\}/g;
      let m: RegExpExecArray | null;
      while ((m = tokenRe.exec(expr)) !== null) {
        const inner = m[1].trim();
        // Case 1: Function call inside formatString, e.g. formatCurrency(value:/path, currency:'USD')
        if (/^[a-zA-Z_][a-zA-Z0-9_]*\s*\(/.test(inner)) {
          const argPathRe = /(?:^|[,(:]\s*)(\/[a-zA-Z0-9_/-]+)/g;
          let pm: RegExpExecArray | null;
          while ((pm = argPathRe.exec(inner)) !== null) {
            const ptr = pm[1];
            if (getValueAtJsonPointer(acc.dataModel, ptr) === undefined) {
              brokenFormatStrings.push(`Undefined data path "${ptr}" in "${expr}"`);
            }
          }
          continue;
        }
        // Case 2: Absolute pointer `${/foo/bar}`
        if (inner.startsWith("/")) {
          if (getValueAtJsonPointer(acc.dataModel, inner) === undefined) {
            brokenFormatStrings.push(`Undefined data path "${inner}" in "${expr}"`);
          }
          continue;
        }
        // Case 3: Relative path `${bar}` outside a dynamic _template item -> likely hallucinated variable
        if (!isTemplateItem && inner !== "" && getValueAtJsonPointer(acc.dataModel, `/${inner}`) === undefined) {
          brokenFormatStrings.push(`Unbound variable "${inner}" in "${expr}"`);
        }
      }
    };

    const scanObjectForFormatStrings = (obj: unknown, isTemplateItem: boolean) => {
      if (Array.isArray(obj)) {
        obj.forEach((v) => scanObjectForFormatStrings(v, isTemplateItem));
        return;
      }
      if (!isRecord(obj)) return;
      if (obj["@call"] === "formatString" && isRecord(obj.args) && typeof obj.args.value === "string") {
        checkFormatStringExpr(obj.args.value, isTemplateItem);
      }
      for (const v of Object.values(obj)) {
        scanObjectForFormatStrings(v, isTemplateItem);
      }
    };

    for (const comp of Array.from(acc.components.values())) {
      const type = String(comp.component || "");
      const isTemplateItem = templateScopeIds.has(String(comp.id));

      if (INTERACTIVE_COMPONENT_TYPES.has(type)) {
        interactiveCount++;
      }

      scanObjectForFormatStrings(comp, isTemplateItem);

      if (type === "Text" && typeof comp.text === "string" && comp.text.trim()) {
        const clean = comp.text.trim();
        textLines.push(clean);
        if (/^#{1,4}\s+/.test(clean)) {
          headings.push(clean.replace(/^#{1,4}\s+/, "").trim());
        }
      }
      if (type === "Tabs" && Array.isArray(comp.tabs)) {
        for (const t of comp.tabs) {
          if (isRecord(t) && typeof t.title === "string" && t.title.trim()) {
            tabTitles.push(t.title.trim());
          }
        }
      }
      if (
        (type === "TextField" ||
          type === "Slider" ||
          type === "ChoicePicker" ||
          type === "CheckBox" ||
          type === "DateTimeInput") &&
        typeof comp.label === "string" &&
        comp.label.trim()
      ) {
        inputLabels.push(comp.label.trim());
      }
      if (type === "Button" && typeof comp.child === "string") {
        const childComp = acc.components.get(comp.child);
        if (childComp && typeof childComp.text === "string" && childComp.text.trim()) {
          buttonLabels.push(childComp.text.trim());
        }
      }
    }

    const extractedText = stripPlainTextStars(
      textLines
        .map((line) => line.replace(/^#{1,4}\s+/, ""))
        .join("\n")
    );

    inspections.push({
      surfaceId: acc.surfaceId,
      componentCount: acc.components.size,
      interactiveCount,
      hasInteractiveControls: interactiveCount > 0,
      isTextOnly: acc.components.size > 0 && interactiveCount === 0,
      brokenFormatStrings,
      extractedText,
      headings,
      tabTitles,
      inputLabels,
      buttonLabels,
    });
  }

  return inspections;
}

/**
 * Produces a concise plain-text summary of rendered A2UI surfaces for multi-turn
 * chat history so the LLM remembers what interactive controls/options it presented.
 */
export function summarizeA2uiForHistory(
  messages: Record<string, unknown>[] | undefined
): string {
  if (!messages || messages.length === 0) return "";
  const surfaces = inspectA2uiSurfaces(messages);
  if (surfaces.length === 0) {
    return "[Displayed interactive A2UI controls]";
  }
  const summaries = surfaces.map((s) => {
    const bits: string[] = [];
    if (s.headings.length > 0) bits.push(s.headings[0]);
    if (s.tabTitles.length > 0) bits.push(`tabs: ${s.tabTitles.join(", ")}`);
    if (s.inputLabels.length > 0) bits.push(`inputs: ${s.inputLabels.join(", ")}`);
    if (s.buttonLabels.length > 0) bits.push(`actions: ${s.buttonLabels.join(", ")}`);
    return `[Interactive A2UI "${s.surfaceId}": ${bits.join(" | ") || "interactive controls"}]`;
  });
  return summaries.join(" ");
}
