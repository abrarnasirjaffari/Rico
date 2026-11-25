import assert from "node:assert/strict";
import {
  createA2uiTurnProcessor,
  getA2uiSystemPromptSection,
  inspectA2uiSurfaces,
  repairExpressDslSyntax,
  sanitizeA2uiWireBatch,
  stripPlainTextStars,
} from "./server";
import { summarizeA2uiWireForHistory } from "./history";
import { buildSkillA2uiBatch } from "./skill-surfaces";
import {
  buildA2uiSurfaceThemeStyle,
  inferAccentFromText,
  resolveA2uiSurfaceAccent,
} from "./theme";

async function runA2UITests() {
  console.log("==================================================");
  console.log("⚡ Testing Google A2UI v1.0 Engine & Theme Resolver");
  console.log("==================================================");

  // 1. Prompt synthesis with Basic Catalog & $/theme/accent guidance
  console.log("\n[Test 1] Verifying Google A2UI v1.0 prompt & Express contract...");
  const processor = createA2uiTurnProcessor();
  const prompt = getA2uiSystemPromptSection(processor);
  assert.ok(prompt.includes("<a2ui>"), "Prompt must include A2UI Express sentinel tags");
  assert.ok(prompt.includes("$/theme/accent"), "Prompt must instruct per-question accent color");
  assert.ok(prompt.includes("Slider("), "Prompt must expose Basic Catalog Slider");
  assert.ok(prompt.includes("Tabs("), "Prompt must expose Basic Catalog Tabs");
  console.log("✅ A2UI v1.0 prompt snippet verified.");

  // 2. Express compilation into validated v1.0 wire messages
  console.log("\n[Test 2] Compiling A2UI Express with $/theme/accent & Tabs...");
  const expressSample = [
    "Here is your comparison:",
    "<a2ui>",
    'surface("compare_plans", sendDataModel=true)',
    '$/theme/accent = "#1db954"',
    'root = Column([tabs, action_btn])',
    'tabs = Tabs([{ title: "Individual", child: ind_txt }, { title: "Duo", child: duo_txt }])',
    'ind_txt = Text("Individual: $12.99/mo")',
    'duo_txt = Text("Duo: $16.99/mo")',
    'btn_lbl = Text("Select Plan")',
    'action_btn = Button(btn_lbl, "primary", Event("select_plan", { plan: "individual" }))',
    "</a2ui>",
  ].join("\n");

  const parts = processor.parseResponse(expressSample);
  const textPart = parts.find((p) => p.type === "text");
  const a2uiPart = parts.find((p) => p.type === "a2ui");
  assert.ok(textPart && textPart.type === "text" && textPart.text.includes("comparison"));
  assert.ok(a2uiPart && a2uiPart.type === "a2ui" && a2uiPart.a2ui.length > 0);
  const createMsg = a2uiPart.a2ui[0] as {
    version?: string;
    createSurface?: { surfaceId?: string; dataModel?: { theme?: { accent?: string } } };
  };
  assert.equal(createMsg.version, "1.0");
  assert.equal(createMsg.createSurface?.surfaceId, "compare_plans");
  assert.equal(createMsg.createSurface?.dataModel?.theme?.accent, "#1db954");
  console.log("✅ Compiled valid A2UI v1.0 wire payload with $/theme/accent.");

  // 3. Streaming incremental parser with afterRejectedBlock: 'continue'
  console.log("\n[Test 3] Streaming A2UI Express chunks...");
  const streamProcessor = createA2uiTurnProcessor();
  const stream = streamProcessor.openStream({ afterRejectedBlock: "continue" });
  const streamedA2ui: unknown[] = [];
  for (const chunk of [
    "Quick summary.\n<a2ui>\n",
    'surface("s1")\n$/theme/accent = "#059669"\n',
    'root = Column([Text("### Runway"), Slider("Burn", 0, 50000, $/burn)])\n',
    "$/burn = 12000\n</a2ui>",
  ]) {
    for (const part of stream.feed(chunk)) {
      if (part.type === "a2ui") streamedA2ui.push(...part.a2ui);
    }
  }
  for (const part of stream.close()) {
    if (part.type === "a2ui") streamedA2ui.push(...part.a2ui);
  }
  assert.ok(streamedA2ui.length > 0, "Streaming must emit compiled A2UI wire messages");
  console.log("✅ Streaming A2UI compilation verified.");

  // 4. Question-matched dynamic color theme resolver
  console.log("\n[Test 4] Verifying per-question accent color resolution...");
  assert.equal(resolveA2uiSurfaceAccent("#1DB954", "anything"), "#1db954");
  assert.equal(inferAccentFromText("Spotify Premium plan comparison"), "#15803d");
  assert.equal(inferAccentFromText("Netflix monthly subscription"), "#dc2626");
  assert.equal(inferAccentFromText("Startup runway and MRR calculator"), "#059669");
  assert.equal(inferAccentFromText("AWS vs Vercel vs Render hosting"), "#d97706");
  const vars = buildA2uiSurfaceThemeStyle("#1db954") as Record<string, string>;
  assert.equal(vars["--a2ui-color-primary"], "#1db954");
  assert.equal(vars["--a2ui-tabs-header-color-active"], "#1db954");
  console.log("✅ Dynamic question-matched accent theming verified.");

  // 5. Star stripping helper
  assert.equal(stripPlainTextStars("**Hello** *world*"), "Hello world");

  // 6. Adaptive prompt does NOT unconditionally force A2UI
  console.log("\n[Test 5] Verifying adaptive prompt & quality gate sanitizers...");
  assert.ok(
    !prompt.includes("You must output the user interface using A2UI Express."),
    "Prompt must not unconditionally force A2UI on plain-text queries"
  );
  assert.ok(
    prompt.includes("WHEN TO USE PLAIN TEXT ONLY"),
    "Prompt must clearly define when to reply in plain text"
  );

  // 7. Wire sanitizer: nested ${...} repair & TextField numeric 0 -> "0"
  const rawBrokenBatch: Record<string, unknown>[] = [
    {
      version: "1.0",
      createSurface: {
        surfaceId: "runway_test",
        catalogId: "https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json",
        components: [
          { id: "root", component: "Column", children: ["f1", "t1", "btn"] },
          {
            id: "f1",
            component: "TextField",
            label: "Cash Balance",
            variant: "number",
            value: { "@path": "/runway/cash" },
          },
          {
            id: "t1",
            component: "Text",
            text: {
              "@call": "formatString",
              args: { value: "Burn: ${formatCurrency(value:${/runway/burn}, currency:'USD')}" },
            },
          },
          { id: "btn_lbl", component: "Text", text: "Calculate" },
          {
            id: "btn",
            component: "Button",
            child: "btn_lbl",
            variant: "primary",
            action: { event: { name: "calc" } },
          },
        ],
        dataModel: {
          runway: { cash: 0, burn: 25000 },
        },
      },
    },
  ];

  const sanitized = sanitizeA2uiWireBatch(rawBrokenBatch);
  const sanitizedSurface = sanitized[0].createSurface as {
    components: Array<Record<string, unknown>>;
    dataModel: { runway: { cash: unknown; burn: number } };
  };
  assert.equal(sanitizedSurface.dataModel.runway.cash, "0", "TextField numeric 0 must become string '0'");
  const t1Text = sanitizedSurface.components[2].text as { args: { value: string } };
  assert.equal(
    t1Text.args.value,
    "Burn: ${formatCurrency(value:/runway/burn, currency:'USD')}",
    "Nested ${...} inside formatCurrency must be repaired"
  );

  // Valid interactive surface passes inspection
  const validInsp = inspectA2uiSurfaces(sanitized);
  assert.equal(validInsp.length, 1);
  assert.equal(validInsp[0].hasInteractiveControls, true);
  assert.equal(validInsp[0].isTextOnly, false);
  assert.equal(validInsp[0].brokenFormatStrings.length, 0);

  // Undefined formatString path is caught by quality gate
  const brokenInsp = inspectA2uiSurfaces([
    {
      version: "1.0",
      createSurface: {
        surfaceId: "broken_calc",
        components: [
          { id: "root", component: "Column", children: ["t1"] },
          {
            id: "t1",
            component: "Text",
            text: {
              "@call": "formatString",
              args: { value: "Monthly Burn: ${formatCurrency(value:/monthly_burn_rate, currency:'USD')}" },
            },
          },
        ],
        dataModel: { theme: { accent: "#059669" } },
      },
    },
  ]);
  assert.ok(brokenInsp[0].brokenFormatStrings.length > 0, "Undefined formatString path must be flagged");

  // Text-only static surface is detected so it can be converted to plain text
  const textOnlyInsp = inspectA2uiSurfaces([
    {
      version: "1.0",
      createSurface: {
        surfaceId: "static_summary",
        components: [
          { id: "root", component: "Column", children: ["t1", "d1", "t2"] },
          { id: "t1", component: "Text", text: "Monthly Burn: $25,000" },
          { id: "d1", component: "Divider", axis: "horizontal" },
          { id: "t2", component: "Text", text: "Estimated Runway: 10 months" },
        ],
        dataModel: {},
      },
    },
  ]);
  assert.equal(textOnlyInsp[0].isTextOnly, true);
  assert.ok(textOnlyInsp[0].extractedText.includes("Monthly Burn: $25,000"));
  assert.ok(textOnlyInsp[0].extractedText.includes("Estimated Runway: 10 months"));

  // Multi-turn history summarizer
  const historySummary = summarizeA2uiWireForHistory(sanitized);
  assert.ok(historySummary.includes("runway_test"));
  assert.ok(historySummary.includes("Cash Balance"));
  assert.ok(historySummary.includes("Calculate"));

  // Deterministic Express DSL syntax repair (keyword colons + ?numeric(min=0, message=...) + multiple checks)
  const brokenColonDsl = [
    "<a2ui>",
    'surface("runway_fix")',
    '$/cash = "250000"',
    'root = Column([TextField("Cash", $/cash, "250000", variant: "number", ?required(message="Req"), ?numeric(min=0, message="Positive")), Button(Text("Go"), "primary", Event("calc", {cash: $/cash}, userMessage: formatString("Cash $${/cash}")))])',
    "</a2ui>",
  ].join("\n");
  const repairedDsl = repairExpressDslSyntax(brokenColonDsl);
  assert.ok(repairedDsl.includes('variant= "number"') || repairedDsl.includes('variant="number"'));
  assert.ok(repairedDsl.includes("userMessage="));
  assert.ok(repairedDsl.includes("checks=["), "Multiple bare checks must be grouped into checks=[...]");
  assert.ok(repairedDsl.includes("{cash: $/cash}"), "Map literal colons must be preserved");
  const repairedParsed = createA2uiTurnProcessor().parseResponse(repairedDsl);
  const repairedA2uiPart = repairedParsed.find((p) => p.type === "a2ui");
  assert.ok(
    repairedA2uiPart && repairedA2uiPart.type === "a2ui" && repairedA2uiPart.a2ui.length > 0,
    "Repaired Express DSL must compile cleanly"
  );
  const sanitizedRepaired = sanitizeA2uiWireBatch(
    repairedA2uiPart.a2ui as unknown as Record<string, unknown>[]
  );
  const tfComp = (
    sanitizedRepaired[0].createSurface as { components: Array<Record<string, unknown>> }
  ).components.find((c) => c.component === "TextField");
  const tfChecks = (tfComp?.checks as Array<{ condition?: { "@call"?: string } }>) ?? [];
  assert.ok(
    !tfChecks.some((c) => c.condition?.["@call"] === "numeric"),
    "numeric check must be stripped from string-valued TextField"
  );

  // Deterministic repair for digit-prefixed identifiers (500_startups_card) + misplaced userMessage on openUrl/Button
  const digitAndUserMsgDsl = [
    "<a2ui>",
    'surface("top_programs")',
    '$/theme/accent = "#4f46e5"',
    "root = Column([500_startups_card])",
    "500_startups_card = Card(500_startups_col)",
    "500_startups_col = Column([500_startups_txt, 500_startups_btn, 500_apply_btn])",
    '500_startups_txt = Text("500 Global — $150k seed funding")',
    '500_startups_lbl = Text("Visit 500 Global")',
    '500_startups_btn = Button(500_startups_lbl, "default", openUrl("https://500.co", userMessage="Open 500 Global"))',
    '500_apply_lbl = Text("Draft Application")',
    '500_apply_btn = Button(500_apply_lbl, "primary", Event("draft_500", {program: "500 Global"}), userMessage="Draft my 500 Global application")',
    "</a2ui>",
  ].join("\n");
  const repairedDigitDsl = repairExpressDslSyntax(digitAndUserMsgDsl);
  assert.ok(repairedDigitDsl.includes("v_500_startups_card"), "Digit-prefixed id must be prefixed with v_");
  assert.ok(repairedDigitDsl.includes('Text("500 Global'), "Strings containing 500 must stay untouched");
  const parsedDigitDsl = createA2uiTurnProcessor().parseResponse(repairedDigitDsl);
  assert.ok(
    parsedDigitDsl.some((p) => p.type === "a2ui" && p.a2ui.length > 0),
    "Repaired digit-id + misplaced userMessage DSL must compile cleanly"
  );
  console.log("✅ Wire sanitizer, syntax repair, quality gate & history summarizer verified.");

  // 6. Verify prebuilt skill A2UI surfaces compile cleanly with interactive controls
  for (const skillId of [
    "cloud-credit-domino",
    "startup-credit-grant",
    "saas-unit-economics",
    "saas-renewal-negotiator",
    "payment-reconciler",
    "invoice-statement-auditor",
    "monthly-spend-closer",
    "top-accelerators",
  ]) {
    const batch = buildSkillA2uiBatch(skillId);
    assert.ok(batch && batch.length > 0, `Skill A2UI batch must compile for ${skillId}`);
    const insp = inspectA2uiSurfaces(batch);
    assert.ok(
      insp.length > 0 &&
        insp.every((s) => s.hasInteractiveControls && s.brokenFormatStrings.length === 0),
      `Skill A2UI batch for ${skillId} must have interactive controls and zero broken formatStrings`
    );
  }
  console.log("✅ All 7 interactive skill A2UI surfaces compiled & validated.");

  console.log("\n==================================================");
  console.log("🎉 All Google A2UI v1.0 Tests PASSED!");
  console.log("==================================================");
}

runA2UITests().catch((err) => {
  console.error("❌ A2UI test failed:", err);
  process.exit(1);
});
