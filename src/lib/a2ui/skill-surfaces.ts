import {
  createA2uiTurnProcessor,
  inspectA2uiSurfaces,
  sanitizeA2uiWireBatch,
} from "./server";

function compileExpress(expressMarkup: string): Record<string, unknown>[] | undefined {
  const processor = createA2uiTurnProcessor();
  const parts = processor.parseResponse(expressMarkup);
  const raw: Record<string, unknown>[] = [];
  for (const part of parts) {
    if (part.type === "a2ui" && part.a2ui.length > 0) {
      raw.push(...(part.a2ui as unknown as Record<string, unknown>[]));
    }
  }
  if (raw.length === 0) return undefined;
  const sanitized = sanitizeA2uiWireBatch(raw);
  const inspections = inspectA2uiSurfaces(sanitized);
  if (
    inspections.length === 0 ||
    inspections.some((s) => s.brokenFormatStrings.length > 0) ||
    !inspections.some((s) => s.hasInteractiveControls)
  ) {
    return undefined;
  }
  return sanitized;
}

const EXPRESS_BY_SKILL: Record<string, string> = {
  "cloud-credit-domino": `<a2ui>
surface("rico_cloud_credit_domino", sendDataModel=true)
$/theme/accent = "#d97706"
$/domino/stack = ["aws", "gcp", "ai_ml", "analytics"]
root = Column([hdr, sub, stack_picker, stage_tabs, footer_row])
hdr = Text("### Cloud Credit Domino Roadmap")
sub = Text("Cold AWS $1,000 applications fail ~90% of the time and direct GCP caps bootstrapped startups at $2,000. Select your actual stack below and follow the high-approval partner chain.", "caption")
stack_picker = ChoicePicker("Your Stack (unneeded perks like Depot are skipped automatically)", "multipleSelection", [{label: "AWS Cloud", value: "aws"}, {label: "Google Cloud (GCP)", value: "gcp"}, {label: "AI / ML / LLM", value: "ai_ml"}, {label: "Product Analytics", value: "analytics"}, {label: "Docker / CI Builds (Depot)", value: "docker_ci"}], $/domino/stack, "chips")
stage_tabs = Tabs([{title: "1. PostHog ($50k)", child: tab1_card}, {title: "2. Retool + Zendesk ($5k AWS)", child: tab2_card}, {title: "3. NVIDIA ($25k AWS+GCP)", child: tab3_card}, {title: "4. $0-Burn Rules", child: tab4_card}])

tab1_card = Card(tab1_col)
tab1_col = Column([tab1_txt, tab1_div, tab1_row])
tab1_txt = Text("""**Step 1 — Fast Anchor (~10 min auto-approval)**

- **Unlocks:** $50,000 in PostHog product & LLM analytics credits (12 months).
- **Eligibility:** Founded < 2 years ago, < $5M raised.
- **Stack Filter:** Only claim the $5,000 Depot perk if you run Docker / CI container builds; otherwise skip Depot completely.""")
tab1_div = Divider("horizontal")
tab1_row = Row([t1_open_btn, t1_draft_btn])
t1_open_lbl = Text("Open PostHog Startups")
t1_open_btn = Button(t1_open_lbl, "default", openUrl("https://posthog.com/startups"))
t1_draft_lbl = Text("Draft PostHog App in Doc")
t1_draft_btn = Button(t1_draft_lbl, "primary", Event("draft_posthog_app", {}, userMessage="Draft my PostHog for Startups application answers in Doc"))

tab2_card = Card(tab2_col)
tab2_col = Column([tab2_txt, tab2_div, tab2_row])
tab2_txt = Text("""**Step 2 — AWS $5,000 Organization Bridge (80-95% approval)**

- **Why Bridge:** Do NOT waste retries on the cold $1,000 AWS Founders tier.
- **Route:** Apply to Retool for Startups -> open Retool Partner Perks -> join Zendesk for Startups (or apply directly to Zendesk).
- **Unlock:** Use Zendesk's official AWS Activate Partner Org ID to claim $5,000 AWS credits.""")
tab2_div = Divider("horizontal")
tab2_row = Row([t2_retool_btn, t2_zendesk_btn, t2_draft_btn])
t2_retool_lbl = Text("Open Retool")
t2_retool_btn = Button(t2_retool_lbl, "default", openUrl("https://retool.com/startups"))
t2_zendesk_lbl = Text("Open Zendesk")
t2_zendesk_btn = Button(t2_zendesk_lbl, "default", openUrl("https://www.zendesk.com/startups/"))
t2_draft_lbl = Text("Draft Bridge Pitch in Doc")
t2_draft_btn = Button(t2_draft_lbl, "primary", Event("draft_aws_bridge", {}, userMessage="Draft my Retool and Zendesk for Startups application answers in Doc"))

tab3_card = Card(tab3_col)
tab3_col = Column([tab3_txt, tab3_div, tab3_row])
tab3_txt = Text("""**Step 3 — Power Upgrade via NVIDIA Inception (90-95% approval)**

- **Cost:** Free for bootstrapped and funded AI, ML, or data startups.
- **AWS Upgrade:** Unlocks $10,000 to $25,000 in AWS Activate partner credits.
- **Bootstrapped GCP Bypass:** Unlocks up to $25,000 in Google Cloud credits (bypassing the $2,000 direct bootstrapped cap).""")
tab3_div = Divider("horizontal")
tab3_row = Row([t3_open_btn, t3_tailor_btn])
t3_open_lbl = Text("Open NVIDIA Inception")
t3_open_btn = Button(t3_open_lbl, "default", openUrl("https://www.nvidia.com/en-us/startups/"))
t3_tailor_lbl = Text("Tailor for Selected Stack")
t3_tailor_btn = Button(t3_tailor_lbl, "primary", Event("tailor_credit_stack", {stack: $/domino/stack}, userMessage=formatString("Filter the cloud credit domino roadmap for my selected stack: \${/domino/stack} and draft a tailored Doc checklist")))

tab4_card = Card(tab4_col)
tab4_col = Column([tab4_txt, tab4_div, tab4_row])
tab4_txt = Text("""**Step 4 — Zero-Burn Mandate Protection**

- Lock recurring AWS / GCP spending rules at **$0.00/mo** while startup credits are active.
- Track credit expiration dates in Excel with 30-day alerts so free credits never become surprise cloud bills.""")
tab4_div = Divider("horizontal")
tab4_row = Row([t4_rule_btn, t4_excel_btn])
t4_rule_lbl = Text("Set $0.00 AWS Rule")
t4_rule_btn = Button(t4_rule_lbl, "primary", Event("create_zero_aws_rule", {}, userMessage="Create a spending rule for AWS Cloud Services, max $0.00 monthly"))
t4_excel_lbl = Text("Build Credit Tracker in Excel")
t4_excel_btn = Button(t4_excel_lbl, "default", Event("build_credit_excel", {}, userMessage="Build a startup cloud credit tracker in Excel"))

footer_row = Row([f_doc_btn, f_excel_btn])
f_doc_lbl = Text("Save Full Pack in Doc")
f_doc_btn = Button(f_doc_lbl, "default", Event("save_domino_doc", {}, userMessage="Draft the full Cloud Credit Domino application pack in Doc"))
f_excel_lbl = Text("Open Credit Sheet in Excel")
f_excel_btn = Button(f_excel_lbl, "default", Event("open_domino_excel", {}, userMessage="Build a startup credits tracker in Excel"))
</a2ui>`,

  "startup-credit-grant": `<a2ui>
surface("rico_startup_credits", sendDataModel=true)
$/theme/accent = "#059669"
$/credits/stage = ["bootstrapped"]
root = Column([hdr, sub, stage_picker, credit_tabs])
hdr = Text("### Startup Credits & Non-Dilutive Grants")
sub = Text("Claim up to $100,000+ in non-dilutive startup credits before paying retail SaaS rates.", "caption")
stage_picker = ChoicePicker("Startup Stage", "mutuallyExclusive", [{label: "Bootstrapped", value: "bootstrapped"}, {label: "Pre-Seed", value: "pre_seed"}, {label: "Seed (<$5M)", value: "seed"}], $/credits/stage, "chips")
credit_tabs = Tabs([{title: "PostHog ($50k)", child: ph_card}, {title: "AWS & GCP ($25k)", child: cloud_card}, {title: "Notion AI ($1k)", child: notion_card}])

ph_card = Card(ph_col)
ph_col = Column([ph_txt, ph_row])
ph_txt = Text("""**PostHog for Startups — $50,000 / 12 mos**

- Covers product analytics, session replay, feature flags, and LLM observability.
- Fast ~10-minute review for companies under 2 years and under $5M raised.""")
ph_row = Row([ph_open, ph_draft])
ph_open_lbl = Text("Open PostHog")
ph_open = Button(ph_open_lbl, "default", openUrl("https://posthog.com/startups"))
ph_draft_lbl = Text("Draft Pitch in Doc")
ph_draft = Button(ph_draft_lbl, "primary", Event("draft_startup_pack", {stage: $/credits/stage}, userMessage=formatString("Draft a startup credit application pack for a \${/credits/stage} startup in Doc")))

cloud_card = Card(cloud_col)
cloud_col = Column([cloud_txt, cloud_row])
cloud_txt = Text("""**AWS Activate & Google Cloud — $5k to $25k**

- Avoid cold $1k AWS applications (~90% rejection).
- Route via PostHog -> Retool/Zendesk ($5k AWS) or NVIDIA Inception ($10k-$25k AWS + $25k GCP).""")
cloud_row = Row([cloud_domino_btn, cloud_excel_btn])
cloud_domino_lbl = Text("Run Credit Domino")
cloud_domino_btn = Button(cloud_domino_lbl, "primary", Event("run_credit_domino", {}, userMessage="Walk me through the Cloud Credit Domino partner chain for AWS and GCP credits"))
cloud_excel_lbl = Text("Track in Excel")
cloud_excel_btn = Button(cloud_excel_lbl, "default", Event("track_credits_excel", {}, userMessage="Build a startup credits tracker in Excel"))

notion_card = Card(notion_col)
notion_col = Column([notion_txt, notion_btn])
notion_txt = Text("""**Notion for Startups — Up to $1,000**

- Covers Plus Plan and Notion AI seats for up to 6 months.
- Pair with a $0.00 Rico spending rule so renewal never auto-charges full price.""")
notion_btn_lbl = Text("Open Notion Startups")
notion_btn = Button(notion_btn_lbl, "default", openUrl("https://www.notion.so/startups"))
</a2ui>`,

  "saas-unit-economics": `<a2ui>
surface("rico_runway_calculator", sendDataModel=true)
$/theme/accent = "#059669"
$/runway/cash = "90000"
$/runway/mrr = "6000"
$/runway/ops = "15000"
$/runway/cloud = "3000"
root = Column([hdr, sub, cash_in, mrr_in, ops_in, cloud_in, action_row])
hdr = Text("### Startup Burn & Runway Estimator")
sub = Text("Enter your current figures to compute net burn, AI/cloud gross margin, and credit-adjusted runway.", "caption")
cash_in = TextField("Cash Balance (USD)", $/runway/cash, "90000", "number")
mrr_in = TextField("Monthly Recurring Revenue (MRR)", $/runway/mrr, "6000", "number")
ops_in = TextField("Monthly Payroll & Ops Spend", $/runway/ops, "15000", "number")
cloud_in = TextField("Monthly Cloud & AI Spend", $/runway/cloud, "3000", "number")
action_row = Row([calc_btn, excel_btn])
calc_lbl = Text("Calculate Runway & Credits")
calc_btn = Button(calc_lbl, "primary", Event("compute_runway", {cash: $/runway/cash, mrr: $/runway/mrr, ops: $/runway/ops, cloud: $/runway/cloud}, userMessage=formatString("Calculate my net burn, AI/cloud gross margin, and raw vs credit-adjusted runway with $\${/runway/cash} cash, $\${/runway/mrr} MRR, $\${/runway/ops} ops burn, and $\${/runway/cloud} cloud/AI spend")))
excel_lbl = Text("Build Live Excel Model")
excel_btn = Button(excel_lbl, "default", Event("build_runway_excel", {}, userMessage="Build a 6-month startup runway and burn model in Excel"))
</a2ui>`,

  "saas-renewal-negotiator": `<a2ui>
surface("rico_saas_renewal_audit", sendDataModel=true)
$/theme/accent = "#4f46e5"
$/renewal/actions = ["remove_zombie", "request_discount"]
root = Column([hdr, sub, action_picker, btn_row])
hdr = Text("### SaaS Renewal & Seat Optimization")
sub = Text("Audit 30/60-day auto-renewal windows, strip inactive seats, and target 15-25% retention discounts.", "caption")
action_picker = ChoicePicker("Select Negotiation Actions", "multipleSelection", [{label: "Remove 30-day inactive zombie seats", value: "remove_zombie"}, {label: "Request 15-25% retention discount", value: "request_discount"}, {label: "Lock annual price cap in Rico", value: "lock_cap"}], $/renewal/actions, "checkbox")
btn_row = Row([draft_btn, excel_btn])
draft_lbl = Text("Draft Vendor Email in Doc")
draft_btn = Button(draft_lbl, "primary", Event("draft_renewal_email", {actions: $/renewal/actions}, userMessage=formatString("Draft a SaaS renewal negotiation counter-offer in Doc including: \${/renewal/actions}")))
excel_lbl = Text("Compare Vendor Rates in Excel")
excel_btn = Button(excel_lbl, "default", Event("build_vendor_excel", {}, userMessage="Build a vendor cost and annual savings comparison table in Excel"))
</a2ui>`,

  "payment-reconciler": `<a2ui>
surface("rico_payment_reconciler", sendDataModel=true)
$/theme/accent = "#0070ba"
$/recon/buckets = ["price_creep", "duplicate"]
root = Column([hdr, sub, bucket_picker, btn_row])
hdr = Text("### Payment & Ledger Break Reconciler")
sub = Text("Isolate discrepancies between PayPal/card captures and active Rico mandates using live Excel variance formulas.", "caption")
bucket_picker = ChoicePicker("Suspected Break Categories", "multipleSelection", [{label: "Unapproved Price Creep / FX Fee", value: "price_creep"}, {label: "Duplicate Capture", value: "duplicate"}, {label: "Timing / Pending Settlement", value: "timing"}, {label: "Missing Receipt / Unmatched Debit", value: "unmatched"}], $/recon/buckets, "chips")
btn_row = Row([excel_btn, doc_btn])
excel_lbl = Text("Build Reconciliation Sheet")
excel_btn = Button(excel_lbl, "primary", Event("build_recon_sheet", {buckets: $/recon/buckets}, userMessage=formatString("Build a payment reconciliation table in Excel checking for: \${/recon/buckets}")))
doc_lbl = Text("Draft Dispute Note in Doc")
doc_btn = Button(doc_lbl, "default", Event("draft_dispute_doc", {}, userMessage="Draft a vendor billing discrepancy note in Doc"))
</a2ui>`,

  "invoice-statement-auditor": `<a2ui>
surface("rico_invoice_auditor", sendDataModel=true)
$/theme/accent = "#d97706"
$/audit/checks = ["line_math", "published_rate", "contract_traps"]
root = Column([hdr, sub, check_picker, btn_row])
hdr = Text("### 4-Point Invoice & Contract Auditor")
sub = Text("Verify line-item math, compare against live published pricing, and flag hidden auto-renewal traps before paying.", "caption")
check_picker = ChoicePicker("Audit Checks to Run", "multipleSelection", [{label: "Line-Item Math (Qty x Price)", value: "line_math"}, {label: "Published Rate Verification", value: "published_rate"}, {label: "Tax & VAT ID Completeness", value: "completeness"}, {label: "Hidden Auto-Renewal Traps", value: "contract_traps"}], $/audit/checks, "checkbox")
btn_row = Row([doc_btn, rule_btn])
doc_lbl = Text("Draft Audit Report in Doc")
doc_btn = Button(doc_lbl, "primary", Event("draft_invoice_audit", {checks: $/audit/checks}, userMessage=formatString("Draft a 4-point invoice audit checklist and correction note in Doc covering: \${/audit/checks}")))
rule_lbl = Text("Review Active Spending Rules")
rule_btn = Button(rule_lbl, "default", Event("show_rules", {}, userMessage="Show my active spending rules and ceilings"))
</a2ui>`,

  "monthly-spend-closer": `<a2ui>
surface("rico_month_end_closer", sendDataModel=true)
$/theme/accent = "#059669"
$/close/options = ["accruals", "variance", "credits"]
root = Column([hdr, sub, opt_picker, btn_row])
hdr = Text("### Month-End Spend Close & Variance Pack")
sub = Text("Normalize annual prepayments, flag >10% or $100 vendor variances, and track expiring $0-burn startup credits.", "caption")
opt_picker = ChoicePicker("Include in Month-End Close", "multipleSelection", [{label: "Annual Prepayment Accruals", value: "accruals"}, {label: "MoM Variance Commentary (>10%)", value: "variance"}, {label: "30-60 Day Credit Expiry Watch", value: "credits"}], $/close/options, "chips")
btn_row = Row([excel_btn, doc_btn])
excel_lbl = Text("Generate Close Sheet in Excel")
excel_btn = Button(excel_lbl, "primary", Event("build_close_excel", {options: $/close/options}, userMessage=formatString("Build a month-end spend close workbook in Excel with: \${/close/options}")))
doc_lbl = Text("Write Executive Memo in Doc")
doc_btn = Button(doc_lbl, "default", Event("build_close_doc", {}, userMessage="Draft a month-end spend variance executive memo in Doc"))
</a2ui>`,

  "top-accelerators": `<a2ui>
surface("rico_top_accelerators", sendDataModel=true)
$/theme/accent = "#4f46e5"
root = Column([hdr, sub, acc_tabs, footer_row])
hdr = Text("### Top 10 Startup Accelerator Programs")
sub = Text("Compare equity terms, capital checks, and non-dilutive perks across top global, zero-equity, and deep-tech accelerators.", "caption")
acc_tabs = Tabs([{title: "1-4. Global Flagships", child: g_col}, {title: "5-7. Equity-Free & Tech", child: z_col}, {title: "8-10. Seed & Deep-Tech", child: d_col}])

g_col = Column([yc_card, ts_card, g500_card, ant_card])
yc_card = Card(yc_in)
yc_in = Column([yc_txt, yc_btn])
yc_txt = Text("**1. Y Combinator (YC)** — $500k standard deal ($125k for 7% + $375k uncapped MFN SAFE) + $50k+ AWS/GCP/PostHog perks.")
yc_lbl = Text("Visit Y Combinator")
yc_btn = Button(yc_lbl, "default", openUrl("https://www.ycombinator.com/apply"))

ts_card = Card(ts_in)
ts_in = Column([ts_txt, ts_btn])
ts_txt = Text("**2. Techstars** — $220k total ($20k for 5% + $200k uncapped SAFE) with global mentor network & $100k+ cloud perks.")
ts_lbl = Text("Visit Techstars")
ts_btn = Button(ts_lbl, "default", openUrl("https://www.techstars.com/accelerators"))

g500_card = Card(g500_in)
g500_in = Column([g500_txt, g500_btn])
g500_txt = Text("**3. 500 Global** — $150k investment (net ~$112.5k after program fee) for 6% equity, strong international GTM focus.")
g500_lbl = Text("Visit 500 Global")
g500_btn = Button(g500_lbl, "default", openUrl("https://500.co/accelerators"))

ant_card = Card(ant_in)
ant_in = Column([ant_txt, ant_btn])
ant_txt = Text("**4. Antler** — Day-zero residency & pre-seed check ($100k-$250k depending on region for ~8-10% equity).")
ant_lbl = Text("Visit Antler")
ant_btn = Button(ant_lbl, "default", openUrl("https://www.antler.co"))

z_col = Column([nv_card, ms_card, mc_card])
nv_card = Card(nv_in)
nv_in = Column([nv_txt, nv_btn])
nv_txt = Text("**5. NVIDIA Inception (0% Equity)** — Free for AI/ML startups; unlocks $10k-$25k AWS Activate & $25k bootstrapped GCP credits.")
nv_lbl = Text("Visit NVIDIA Inception")
nv_btn = Button(nv_lbl, "default", openUrl("https://www.nvidia.com/en-us/startups/"))

ms_card = Card(ms_in)
ms_in = Column([ms_txt, ms_btn])
ms_txt = Text("**6. Microsoft for Startups Founders Hub (0% Equity)** — Up to $150k Azure + OpenAI credits, GitHub Enterprise, and LinkedIn tools.")
ms_lbl = Text("Visit Founders Hub")
ms_btn = Button(ms_lbl, "default", openUrl("https://www.microsoft.com/en-us/startups"))

mc_card = Card(mc_in)
mc_in = Column([mc_txt, mc_btn])
mc_txt = Text("**7. MassChallenge (0% Equity)** — Zero-equity mentorship, corporate partnerships, and up to $1M+ in non-dilutive cash prizes.")
mc_lbl = Text("Visit MassChallenge")
mc_btn = Button(mc_lbl, "default", openUrl("https://masschallenge.org"))

d_col = Column([a16z_card, pear_card, sky_card])
a16z_card = Card(a16z_in)
a16z_in = Column([a16z_txt, a16z_btn])
a16z_txt = Text("**8. a16z Speedrun** — Up to $500k-$750k investment for games, AI, and consumer tech startups with Andreessen Horowitz partners.")
a16z_lbl = Text("Visit a16z Speedrun")
a16z_btn = Button(a16z_lbl, "default", openUrl("https://speedrun.a16z.com"))

pear_card = Card(pear_in)
pear_in = Column([pear_txt, pear_btn])
pear_txt = Text("**9. PearX (Pear VC)** — $250k-$2M flexible pre-seed checks with hands-on GTM & founding engineering recruiting support.")
pear_lbl = Text("Visit PearX")
pear_btn = Button(pear_lbl, "default", openUrl("https://pear.vc/pearx/"))

sky_card = Card(sky_in)
sky_in = Column([sky_txt, sky_btn])
sky_txt = Text("**10. Berkeley SkyDeck** — $200k Berkeley SkyDeck Fund investment (7.5% equity) + UC Berkeley deep-tech lab network.")
sky_lbl = Text("Visit SkyDeck")
sky_btn = Button(sky_lbl, "default", openUrl("https://skydeck.berkeley.edu"))

footer_row = Row([f_domino_btn, f_excel_btn, f_doc_btn])
f_domino_lbl = Text("Unlock Cloud Credits Now")
f_domino_btn = Button(f_domino_lbl, "primary", Event("open_domino", {}, userMessage="I can't get AWS credit, show me the Cloud Credit Domino roadmap"))
f_excel_lbl = Text("Compare in Excel")
f_excel_btn = Button(f_excel_lbl, "default", Event("compare_acc_excel", {}, userMessage="Build a startup credits and accelerator comparison tracker in Excel"))
f_doc_lbl = Text("Draft Application Pack")
f_doc_btn = Button(f_doc_lbl, "default", Event("draft_acc_doc", {}, userMessage="Draft a startup program and accelerator application pack in Doc"))
</a2ui>`,
};

const compiledCache = new Map<string, Record<string, unknown>[]>();

/**
 * Compiles and returns a validated Google A2UI v1.0 interactive surface batch
 * for skill-backed responses when running in fallback / simulated mode.
 */
export function buildSkillA2uiBatch(
  skillId: string
): Record<string, unknown>[] | undefined {
  const normalized = skillId.toLowerCase().trim();
  const cached = compiledCache.get(normalized);
  if (cached) return cached;

  const express = EXPRESS_BY_SKILL[normalized];
  if (!express) return undefined;

  const compiled = compileExpress(express);
  if (compiled) {
    compiledCache.set(normalized, compiled);
  }
  return compiled;
}
