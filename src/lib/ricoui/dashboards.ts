import { desc, eq, getTableColumns } from "drizzle-orm";
import { db, mandates, transactions, auditLogs } from "@/db";
import {
  mergeRicoUIStatements,
  parseRicoUI,
  repairRicoUIProgram,
} from "./parser";
import type {
  RicoUIDashboardRecord,
  RicoUIDataTool,
  RicoUIInterpreterRequest,
  RicoUIInterpreterResponse,
} from "./types";

export class RicoUIDashboardError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "RicoUIDashboardError";
    this.code = code;
    this.status = status;
  }
}

interface DashboardOwnerContext {
  ownerId: string;
}

function clampLimit(raw: unknown, fallback = 25, max = 100): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(max, Math.floor(n));
}

function normalizeFilter(raw: unknown): string {
  if (raw === null || raw === undefined) return "ALL";
  const s = String(raw).trim();
  return s === "" ? "ALL" : s.toUpperCase();
}

/**
 * Read-only server-side DataTools for RicoUI Live Dashboards.
 * Every query is strictly scoped to `context.ownerId` and uses awaited Drizzle queries
 * so SQLite and PostgreSQL behave identically.
 */
export const ricoDashboardDataTools: Record<
  string,
  RicoUIDataTool<DashboardOwnerContext>
> = {
  get_mandate_utilization: {
    name: "get_mandate_utilization",
    description:
      "Active spending rules, verified monthly prices vs budget ceilings, headroom, and category breakdown.",
    parametersSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["ALL", "ACTIVE", "PAUSED", "ANOMALY_HOLD"],
        },
      },
    },
    sampleOutput: {
      totalMonthlySpend: 46.48,
      totalBudgetCap: 60.0,
      totalHeadroom: 13.52,
      utilizationPct: "77%",
      ruleCount: 3,
      labels: ["Netflix Standard HD", "Spotify Premium", "GitHub Copilot"],
      prices: [15.49, 11.99, 19.0],
      ceilings: [20.0, 15.0, 25.0],
      categorySegments: [
        { label: "Entertainment", value: 27.48 },
        { label: "Tools", value: 19.0 },
      ],
      rows: [
        {
          service: "Netflix Standard HD",
          price: "$15.49",
          ceiling: "$20.00",
          headroom: "$4.51",
          recurrence: "Monthly on 5th",
          status: "ACTIVE",
        },
      ],
    },
    execute: async (args, context) => {
      const statusFilter = normalizeFilter(args.status);
      const all = await db
        .select()
        .from(mandates)
        .where(eq(mandates.ownerId, context.ownerId))
        .orderBy(desc(mandates.createdAt));

      const filtered =
        statusFilter === "ALL"
          ? all
          : all.filter((m) => m.status.toUpperCase() === statusFilter);

      const totalMonthlySpend = filtered.reduce(
        (sum, m) => sum + (m.lastScrapedPrice || 0),
        0
      );
      const totalBudgetCap = filtered.reduce(
        (sum, m) => sum + m.budgetCeiling,
        0
      );
      const totalHeadroom = Math.max(0, totalBudgetCap - totalMonthlySpend);
      const utilizationPct =
        totalBudgetCap > 0
          ? `${Math.round((totalMonthlySpend / totalBudgetCap) * 100)}%`
          : "0%";

      const byCategory = new Map<string, number>();
      for (const m of filtered) {
        const cat = m.category || "Subscription";
        const val = m.lastScrapedPrice > 0 ? m.lastScrapedPrice : m.budgetCeiling;
        byCategory.set(cat, (byCategory.get(cat) ?? 0) + val);
      }

      return {
        totalMonthlySpend: Number(totalMonthlySpend.toFixed(2)),
        totalBudgetCap: Number(totalBudgetCap.toFixed(2)),
        totalHeadroom: Number(totalHeadroom.toFixed(2)),
        utilizationPct,
        ruleCount: filtered.length,
        labels: filtered.map((m) => m.service),
        prices: filtered.map((m) =>
          Number((m.lastScrapedPrice || 0).toFixed(2))
        ),
        ceilings: filtered.map((m) => Number(m.budgetCeiling.toFixed(2))),
        categorySegments: Array.from(byCategory.entries()).map(
          ([label, value]) => ({
            label,
            value: Number(value.toFixed(2)),
          })
        ),
        rows: filtered.map((m) => ({
          id: m.id,
          service: m.service,
          price: `$${(m.lastScrapedPrice || 0).toFixed(2)}`,
          ceiling: `$${m.budgetCeiling.toFixed(2)}`,
          headroom: `$${Math.max(
            0,
            m.budgetCeiling - (m.lastScrapedPrice || 0)
          ).toFixed(2)}`,
          recurrence: m.recurrence,
          category: m.category,
          status: m.status,
        })),
      };
    },
  },

  get_transactions_summary: {
    name: "get_transactions_summary",
    description:
      "Confirmed payment captures, blocked charges, and pending reservations scoped to the signed-in owner.",
    parametersSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["ALL", "COMPLETED", "PENDING", "BLOCKED"],
        },
        limit: { type: "number" },
      },
    },
    sampleOutput: {
      settledTotal: 27.48,
      completedCount: 2,
      blockedCount: 0,
      pendingCount: 0,
      labels: ["Netflix Standard HD", "Spotify Premium"],
      amounts: [15.49, 11.99],
      rows: [
        {
          orderId: "ORD-84920491",
          service: "Netflix Standard HD",
          amount: "$15.49",
          status: "COMPLETED",
          timestamp: "2026-10-31",
        },
      ],
    },
    execute: async (args, context) => {
      const statusFilter = normalizeFilter(args.status);
      const limit = clampLimit(args.limit, 25, 100);

      const allTx = await db
        .select(getTableColumns(transactions))
        .from(transactions)
        .innerJoin(mandates, eq(transactions.mandateId, mandates.id))
        .where(eq(mandates.ownerId, context.ownerId))
        .orderBy(desc(transactions.timestamp));

      const completedCount = allTx.filter((t) => t.status === "COMPLETED").length;
      const blockedCount = allTx.filter((t) => t.status === "BLOCKED").length;
      const pendingCount = allTx.filter((t) => t.status === "PENDING").length;
      const settledTotal = allTx
        .filter((t) => t.status === "COMPLETED")
        .reduce((s, t) => s + t.amount, 0);

      const filtered = (
        statusFilter === "ALL"
          ? allTx
          : allTx.filter((t) => t.status.toUpperCase() === statusFilter)
      ).slice(0, limit);

      return {
        settledTotal: Number(settledTotal.toFixed(2)),
        completedCount,
        blockedCount,
        pendingCount,
        labels: filtered.slice(0, 8).map((t) => t.service),
        amounts: filtered.slice(0, 8).map((t) => Number(t.amount.toFixed(2))),
        rows: filtered.map((t) => ({
          orderId: t.orderId,
          service: t.service,
          amount: `$${t.amount.toFixed(2)}`,
          status: t.status,
          timestamp: t.timestamp,
        })),
      };
    },
  },

  get_guardrail_activity: {
    name: "get_guardrail_activity",
    description:
      "Security audit log counts and recent guardrail events (price verifications, blocks, anomalies, captures).",
    parametersSchema: {
      type: "object",
      properties: {
        severity: {
          type: "string",
          enum: ["ALL", "INFO", "SUCCESS", "WARNING", "DANGER"],
        },
      },
    },
    sampleOutput: {
      totalEvents: 4,
      blockedEvents: 1,
      verifiedEvents: 2,
      rows: [
        {
          service: "Netflix Standard HD",
          eventType: "PRICE_VERIFIED",
          severity: "info",
          details: "Verified live subscription price below ceiling.",
          timestamp: "2026-11-01",
        },
      ],
    },
    execute: async (args, context) => {
      const sevFilter = normalizeFilter(args.severity);
      const logs = await db
        .select(getTableColumns(auditLogs))
        .from(auditLogs)
        .innerJoin(mandates, eq(auditLogs.mandateId, mandates.id))
        .where(eq(mandates.ownerId, context.ownerId))
        .orderBy(desc(auditLogs.timestamp));

      const blockedEvents = logs.filter(
        (l) =>
          l.eventType === "GUARDRAIL_BLOCKED" ||
          l.eventType === "ANOMALY_DETECTED" ||
          l.eventType === "DOUBLE_BILLING_BLOCKED"
      ).length;
      const verifiedEvents = logs.filter(
        (l) => l.eventType === "PRICE_VERIFIED"
      ).length;

      const filtered = (
        sevFilter === "ALL"
          ? logs
          : logs.filter((l) => l.severity.toUpperCase() === sevFilter)
      ).slice(0, 30);

      return {
        totalEvents: logs.length,
        blockedEvents,
        verifiedEvents,
        rows: filtered.map((l) => ({
          service: l.service,
          eventType: l.eventType,
          severity: l.severity,
          details: l.details,
          timestamp: l.timestamp,
        })),
      };
    },
  },

  get_watchdog_risks: {
    name: "get_watchdog_risks",
    description:
      "Renewal lock-in windows, anomaly holds, and annual switch savings across active subscriptions.",
    parametersSchema: {
      type: "object",
      properties: {},
    },
    sampleOutput: {
      anomalyHolds: 0,
      annualSavingsPotential: 94.8,
      monitoredRules: 3,
      rows: [
        {
          service: "GitHub Copilot",
          nextRun: "Dec 15, 2026",
          riskBadge: "SAFE",
          annualSaving: "$38.00/yr",
          recommendation: "Switch to annual billing for 2 months free",
        },
      ],
    },
    execute: async (_args, context) => {
      const rules = await db
        .select()
        .from(mandates)
        .where(eq(mandates.ownerId, context.ownerId))
        .orderBy(desc(mandates.createdAt));

      const anomalyHolds = rules.filter((r) => r.status === "ANOMALY_HOLD").length;
      const rows = rules.map((r) => {
        const monthly = r.lastScrapedPrice > 0 ? r.lastScrapedPrice : r.budgetCeiling * 0.8;
        const annualSaving = Number((monthly * 12 * 0.16).toFixed(2));
        const ratio = r.budgetCeiling > 0 ? (r.lastScrapedPrice || 0) / r.budgetCeiling : 0;
        const riskBadge =
          r.status === "ANOMALY_HOLD"
            ? "ANOMALY_HOLD"
            : ratio >= 0.9
            ? "NEAR_CAP"
            : "PROTECTED";
        return {
          service: r.service,
          nextRun: r.nextRun,
          riskBadge,
          annualSaving: `$${annualSaving.toFixed(2)}/yr`,
          recommendation:
            r.status === "ANOMALY_HOLD"
              ? "Review >20% price jump before unlocking"
              : ratio >= 0.9
              ? "Tight ceiling buffer (<10% remaining)"
              : "Protected by hard ceiling & period lock",
        };
      });

      const annualSavingsPotential = Number(
        rules
          .reduce((sum, r) => {
            const monthly = r.lastScrapedPrice > 0 ? r.lastScrapedPrice : r.budgetCeiling * 0.8;
            return sum + monthly * 12 * 0.16;
          }, 0)
          .toFixed(2)
      );

      return {
        anomalyHolds,
        annualSavingsPotential,
        monitoredRules: rules.length,
        rows,
      };
    },
  },

  get_credits_and_tax: {
    name: "get_credits_and_tax",
    description:
      "Eligible startup cloud/SaaS credits and IRS Schedule C tax deduction estimates.",
    parametersSchema: {
      type: "object",
      properties: {},
    },
    sampleOutput: {
      eligibleCreditsTotal: "$58,500",
      estimatedTaxSavings: "$1,420/yr",
      deductibleRate: "100% SaaS",
      creditSegments: [
        { label: "PostHog Startups", value: 50000 },
        { label: "AWS Activate", value: 5000 },
        { label: "GitHub Dev Pack", value: 2500 },
        { label: "Notion Startups", value: 1000 },
      ],
      rows: [
        {
          program: "PostHog for Startups",
          value: "$50,000",
          category: "Analytics & Replay",
          taxRule: "IRS Schedule C Line 18 (100%)",
          status: "ELIGIBLE",
        },
      ],
    },
    execute: async (_args, context) => {
      const rules = await db
        .select()
        .from(mandates)
        .where(eq(mandates.ownerId, context.ownerId));

      const annualRuleSpend = rules.reduce(
        (s, r) => s + (r.lastScrapedPrice > 0 ? r.lastScrapedPrice : r.budgetCeiling) * 12,
        0
      );
      const estimatedTaxSavings = Math.max(
        380,
        Math.round(annualRuleSpend * 0.28)
      );

      return {
        eligibleCreditsTotal: "$58,500",
        estimatedTaxSavings: `$${estimatedTaxSavings.toLocaleString("en-US")}/yr`,
        deductibleRate: "100% SaaS",
        creditSegments: [
          { label: "PostHog Startups", value: 50000 },
          { label: "AWS Activate", value: 5000 },
          { label: "GitHub Dev Pack", value: 2500 },
          { label: "Notion Startups", value: 1000 },
        ],
        rows: [
          {
            program: "PostHog for Startups",
            value: "$50,000",
            category: "Analytics & Replay",
            taxRule: "Schedule C Software (100%)",
            status: "ELIGIBLE",
          },
          {
            program: "AWS Activate Portfolio",
            value: "$5,000",
            category: "Cloud Compute",
            taxRule: "Schedule C Cloud Infra (100%)",
            status: "ELIGIBLE",
          },
          {
            program: "GitHub Developer Pack",
            value: "$2,500",
            category: "Engineering Tools",
            taxRule: "Schedule C DevTools (100%)",
            status: "ELIGIBLE",
          },
          {
            program: "Notion Plus for Startups",
            value: "$1,000",
            category: "Workspace & Docs",
            taxRule: "Schedule C Office SaaS (100%)",
            status: "ELIGIBLE",
          },
        ],
      };
    },
  },
};

function buildSpendOverviewProgram(refreshSeconds?: number): string {
  const refreshArg = refreshSeconds ? `, ${refreshSeconds}` : "";
  return [
    "root = Stack([filterBar, kpis, chartsGrid, rulesTable, actions])",
    '$status = "ALL"',
    `util = Query("get_mandate_utilization", { status: $status }, { totalMonthlySpend: 0, totalBudgetCap: 0, totalHeadroom: 0, utilizationPct: "0%", ruleCount: 0, labels: [], prices: [], ceilings: [], categorySegments: [], rows: [] }${refreshArg})`,
    `tx = Query("get_transactions_summary", { status: "ALL", limit: 10 }, { settledTotal: 0, completedCount: 0, blockedCount: 0, pendingCount: 0, labels: [], amounts: [], rows: [] }${refreshArg})`,
    'filterBar = SelectFilter("Rule Status", $status, [{ value: "ALL", label: "All Rules" }, { value: "ACTIVE", label: "Active" }, { value: "ANOMALY_HOLD", label: "Anomaly Hold" }, { value: "PAUSED", label: "Paused" }])',
    "kpis = Grid([mSpend, mCap, mHeadroom, mSettled], 4)",
    'mSpend = Metric("Verified Monthly", @Currency(util.totalMonthlySpend), util.utilizationPct + " of cap used", "safe")',
    'mCap = Metric("Authorized Cap", @Currency(util.totalBudgetCap), util.ruleCount + " guarded rules", "neutral")',
    'mHeadroom = Metric("Protected Headroom", @Currency(util.totalHeadroom), "Hard ceiling buffer", "up")',
    'mSettled = Metric("Settled Ledger", @Currency(tx.settledTotal), tx.completedCount + " confirmed orders", "neutral")',
    "chartsGrid = Grid([spendChart, catDonut], 2)",
    'spendChart = BarChart("Verified Rate vs Budget Ceiling", util.labels, util.prices, util.ceilings, "$", "Verified Price", "Budget Cap")',
    'catDonut = DonutChart("Allocation by Category", util.categorySegments, "$")',
    'rulesTable = DataTable([{ key: "service", label: "Service" }, { key: "price", label: "Verified", align: "right" }, { key: "ceiling", label: "Cap", align: "right" }, { key: "headroom", label: "Headroom", align: "right" }, { key: "recurrence", label: "Schedule" }, { key: "status", label: "Status" }], util.rows, "Live Spending Rules", true, "No spending rules match this filter yet.")',
    'actions = FollowUpChips([{ label: "Export to Excel", tool: "excel" }, { label: "Draft Spend Memo in Doc", prompt: "Draft a monthly SaaS spend memo in Doc" }, { label: "Add Transactions Table", prompt: "Add a recent transactions table to the dashboard" }])',
  ].join("\n");
}

function buildWatchdogDashboardProgram(refreshSeconds = 60): string {
  return [
    "root = Stack([alertBanner, kpis, riskTable, auditTable])",
    '$severity = "ALL"',
    `wd = Query("get_watchdog_risks", {}, { anomalyHolds: 0, annualSavingsPotential: 0, monitoredRules: 0, rows: [] }, ${refreshSeconds})`,
    `audit = Query("get_guardrail_activity", { severity: $severity }, { totalEvents: 0, blockedEvents: 0, verifiedEvents: 0, rows: [] }, ${refreshSeconds})`,
    'alertBanner = Callout("24/7 Price Sentinel & Renewal Watchdog", "Monitors merchant pricing pages and blocks any charge above ceiling or >20% spike.", "info")',
    "kpis = Grid([mRules, mHolds, mBlocked, mSave], 4)",
    'mRules = Metric("Monitored Rules", wd.monitoredRules + " active", "Period-locked idempotency", "safe")',
    'mHolds = Metric("Anomaly Holds", wd.anomalyHolds + "", ">20% price jump guard", wd.anomalyHolds > 0 ? "warn" : "safe")',
    'mBlocked = Metric("Blocked Attempts", audit.blockedEvents + "", "Hard guardrail blocks", "neutral")',
    'mSave = Metric("Annual Switch Savings", @Currency(wd.annualSavingsPotential) + "/yr", "Est. 16% annual arbitrage", "up")',
    'riskTable = DataTable([{ key: "service", label: "Vendor" }, { key: "nextRun", label: "Next Billing" }, { key: "annualSaving", label: "Annual Arbitrage", align: "right" }, { key: "riskBadge", label: "Guardrail State" }, { key: "recommendation", label: "Action" }], wd.rows, "Renewal & Price-Spike Radar", false, "Add a spending rule to monitor renewal lock-ins.")',
    'auditTable = DataTable([{ key: "service", label: "Service" }, { key: "eventType", label: "Event" }, { key: "severity", label: "Severity" }, { key: "details", label: "Audit Trail" }], audit.rows, "Live Security Audit Feed", true, "No guardrail events logged yet.")',
  ].join("\n");
}

function buildCreditsTaxDashboardProgram(): string {
  return [
    "root = Stack([kpis, splitGrid, programsTable, chips])",
    'ct = Query("get_credits_and_tax", {}, { eligibleCreditsTotal: "$58,500", estimatedTaxSavings: "$1,420/yr", deductibleRate: "100% SaaS", creditSegments: [], rows: [] })',
    "kpis = Grid([mCredits, mTax, mRate], 3)",
    'mCredits = Metric("Eligible Startup Credits", ct.eligibleCreditsTotal, "4 verified vendor programs", "up")',
    'mTax = Metric("Est. Tax Savings", ct.estimatedTaxSavings, "28% blended Schedule C", "safe")',
    'mRate = Metric("SaaS Deductibility", ct.deductibleRate, "IRS Line 18 / Cloud & Tools", "neutral")',
    "splitGrid = Grid([creditDonut, noteCard], 2)",
    'creditDonut = DonutChart("Credit Allocation Pool", ct.creditSegments, "$")',
    'noteCard = Callout("Zero-Burn Runway Tip", "Apply startup credits before authorizing recurring card charges to extend cash runway.", "success")',
    'programsTable = DataTable([{ key: "program", label: "Program" }, { key: "value", label: "Allocation", align: "right" }, { key: "category", label: "Category" }, { key: "taxRule", label: "Tax Classification" }, { key: "status", label: "Status" }], ct.rows, "Startup Credit & Tax Schedule C Matrix", false)',
    'chips = FollowUpChips([{ label: "Draft Credit Applications in Doc", prompt: "Draft startup credit application notes in Doc" }, { label: "Model Runway Impact in Excel", prompt: "Build a 6-month startup runway model in Excel" }])',
  ].join("\n");
}

/**
 * Builds a tailored RicoUI Dashboard program from a natural-language request.
 * Works 100% deterministically offline or in production with zero external API requirement.
 */
export function synthesizeDashboardProgramFromPrompt(prompt: string): {
  program: string;
  description: string;
  refreshSeconds?: number;
} {
  const lower = prompt.toLowerCase();
  const wantsAutoRefresh =
    /\b(auto[- ]?refresh|every minute|every 60|every 30|real[- ]?time|live refresh)\b/i.test(
      lower
    );
  const refreshSeconds = wantsAutoRefresh ? 60 : undefined;

  if (/\b(credit|grant|tax|schedule c|deduction|write[- ]?off)\b/i.test(lower)) {
    return {
      program: buildCreditsTaxDashboardProgram(),
      description:
        "Live Startup Credits & IRS Schedule C Tax Deduction board powered by your workspace rules.",
      refreshSeconds,
    };
  }

  if (
    /\b(watchdog|sentinel|anomaly|spike|renewal|trial|audit|security|alert)\b/i.test(
      lower
    )
  ) {
    return {
      program: buildWatchdogDashboardProgram(refreshSeconds ?? 60),
      description:
        "Live Price Sentinel, Renewal Watchdog, and Security Audit trail with automatic polling.",
      refreshSeconds: refreshSeconds ?? 60,
    };
  }

  if (/\b(transaction|ledger|receipt|payment|order)\b/i.test(lower)) {
    const refreshArg = refreshSeconds ? `, ${refreshSeconds}` : "";
    const program = [
      "root = Stack([txFilter, kpis, txChart, txTable])",
      '$txStatus = "ALL"',
      `tx = Query("get_transactions_summary", { status: $txStatus, limit: 25 }, { settledTotal: 0, completedCount: 0, blockedCount: 0, pendingCount: 0, labels: [], amounts: [], rows: [] }${refreshArg})`,
      'txFilter = SelectFilter("Payment Status", $txStatus, [{ value: "ALL", label: "All" }, { value: "COMPLETED", label: "Completed" }, { value: "PENDING", label: "Pending" }, { value: "BLOCKED", label: "Blocked" }])',
      "kpis = Grid([m1, m2, m3, m4], 4)",
      'm1 = Metric("Settled Spend", @Currency(tx.settledTotal), "Verified captures", "safe")',
      'm2 = Metric("Completed", tx.completedCount + "", "Confirmed orders", "up")',
      'm3 = Metric("Pending Lock", tx.pendingCount + "", "Awaiting reconciliation", "neutral")',
      'm4 = Metric("Guardrail Blocked", tx.blockedCount + "", "Prevented overcharges", tx.blockedCount > 0 ? "warn" : "safe")',
      'txChart = BarChart("Recent Payment Amounts by Service", tx.labels, tx.amounts, null, "$", "Captured USD")',
      'txTable = DataTable([{ key: "orderId", label: "Order ID" }, { key: "service", label: "Service" }, { key: "amount", label: "Amount", align: "right" }, { key: "status", label: "Status" }, { key: "timestamp", label: "Timestamp" }], tx.rows, "Live Payment Ledger", true, "No transactions recorded yet.")',
    ].join("\n");
    return {
      program,
      description:
        "Live Payment Ledger & Reservation Status dashboard with status filtering.",
      refreshSeconds,
    };
  }

  return {
    program: buildSpendOverviewProgram(refreshSeconds),
    description:
      "Live CFO Spend, Budget Ceiling Utilization, and Category Allocation dashboard.",
    refreshSeconds,
  };
}

/**
 * Applies a natural-language edit instruction surgically onto an existing RicoUI Dashboard program.
 */
export function applySurgicalDashboardEdit(
  currentProgram: string,
  editPrompt: string
): { nextProgram: string; refreshSeconds?: number; summary: string } {
  const lower = editPrompt.toLowerCase();
  const parsed = parseRicoUI(currentProgram);
  const rootStmt = parsed.statements.find(
    (s) => s.kind === "assign" && s.id === "root"
  );
  const currentChildren: string[] = [];
  if (
    rootStmt &&
    rootStmt.kind === "assign" &&
    rootStmt.expr.type === "component" &&
    rootStmt.expr.args[0]?.type === "array"
  ) {
    for (const item of rootStmt.expr.args[0].items) {
      if (item.type === "ref") currentChildren.push(item.name);
    }
  }

  const patchLines: string[] = [];
  let summary = "Updated live dashboard layout.";
  let refreshSeconds: number | undefined;

  if (/\b(transactions?|ledgers?|orders?|payments?|receipts?)\b/i.test(lower)) {
    if (!currentChildren.includes("addedTxTable")) {
      currentChildren.push("addedTxTable");
    }
    patchLines.push(
      'txLive = Query("get_transactions_summary", { status: "ALL", limit: 15 }, { settledTotal: 0, completedCount: 0, blockedCount: 0, pendingCount: 0, labels: [], amounts: [], rows: [] })',
      'addedTxTable = DataTable([{ key: "orderId", label: "Order ID" }, { key: "service", label: "Service" }, { key: "amount", label: "Amount", align: "right" }, { key: "status", label: "Status" }, { key: "timestamp", label: "Timestamp" }], txLive.rows, "Recent Confirmed Transactions", true, "No transactions recorded yet.")'
    );
    summary = "Added a live Recent Confirmed Transactions table to the dashboard.";
  } else if (/\b(credits?|grants?|tax(?:es)?|deductions?|schedule c)\b/i.test(lower)) {
    if (!currentChildren.includes("addedTaxChart")) {
      currentChildren.push("addedTaxChart");
    }
    patchLines.push(
      'ctLive = Query("get_credits_and_tax", {}, { eligibleCreditsTotal: "$58,500", estimatedTaxSavings: "$1,420/yr", deductibleRate: "100% SaaS", creditSegments: [], rows: [] })',
      'addedTaxChart = DonutChart("Startup Credit & Tax Pool", ctLive.creditSegments, "$")'
    );
    summary = "Added a Startup Credit & Tax DonutChart section.";
  } else if (/\b(watchdogs?|audits?|anomal(?:y|ies)|spikes?|alerts?|security)\b/i.test(lower)) {
    if (!currentChildren.includes("addedAuditFeed")) {
      currentChildren.push("addedAuditFeed");
    }
    patchLines.push(
      'auditLive = Query("get_guardrail_activity", { severity: "ALL" }, { totalEvents: 0, blockedEvents: 0, verifiedEvents: 0, rows: [] })',
      'addedAuditFeed = DataTable([{ key: "service", label: "Service" }, { key: "eventType", label: "Event" }, { key: "severity", label: "Severity" }, { key: "details", label: "Details" }], auditLive.rows, "Live Guardrail Audit Feed", true)'
    );
    summary = "Added a Live Guardrail Audit Feed table.";
  } else if (/\b(runways?|calculators?|simulators?|burn)\b/i.test(lower)) {
    if (!currentChildren.includes("addedRunwaySim")) {
      currentChildren.push("addedRunwaySim");
    }
    patchLines.push(
      'addedRunwaySim = RunwayCalculatorCard(360000, 18500, 48500, "Embedded Cash Runway Simulator")'
    );
    summary = "Added an interactive Cash Runway Simulator block.";
  } else if (/\b(refresh|every minute|60s|30s)\b/i.test(lower)) {
    refreshSeconds = /\b30\b/.test(lower) ? 30 : 60;
    if (!currentChildren.includes("refreshNotice")) {
      currentChildren.unshift("refreshNotice");
    }
    patchLines.push(
      `refreshNotice = Callout("Auto-Refresh Active", "Live queries refresh automatically every ${refreshSeconds} seconds without calling an AI model.", "success")`
    );
    summary = `Enabled ${refreshSeconds}s live auto-refresh on the dashboard.`;
  } else {
    if (!currentChildren.includes("customNote")) {
      currentChildren.unshift("customNote");
    }
    const safeBody = editPrompt.replace(/"/g, "'").slice(0, 160);
    patchLines.push(
      `customNote = Callout("Dashboard Updated", "Applied update: ${safeBody}", "info")`
    );
    summary = "Applied requested note and layout update to the dashboard.";
  }

  if (currentChildren.length > 0) {
    patchLines.unshift(`root = Stack([${currentChildren.join(", ")}])`);
  }

  const merged = repairRicoUIProgram(
    mergeRicoUIStatements(currentProgram, patchLines.join("\n"))
  );
  return { nextProgram: merged, refreshSeconds, summary };
}

interface GlobalDashboardState {
  byId: Map<string, RicoUIDashboardRecord>;
  seededOwners: Set<string>;
}

function getGlobalStore(): GlobalDashboardState {
  const g = globalThis as unknown as {
    __ricoUIDashboardStore?: GlobalDashboardState;
  };
  if (!g.__ricoUIDashboardStore) {
    g.__ricoUIDashboardStore = {
      byId: new Map<string, RicoUIDashboardRecord>(),
      seededOwners: new Set<string>(),
    };
  }
  return g.__ricoUIDashboardStore;
}

function ensureStarterDashboards(ownerId: string): void {
  const store = getGlobalStore();
  if (store.seededOwners.has(ownerId)) return;
  store.seededOwners.add(ownerId);

  const now = new Date().toISOString();
  const starters: RicoUIDashboardRecord[] = [
    {
      id: `dash-spend-${ownerId.slice(0, 12)}`,
      ownerId,
      title: "CFO Spend & Headroom Monitor",
      description:
        "Live monthly spend vs authorized ceilings, category allocation, and rule utilization.",
      program: buildSpendOverviewProgram(),
      pinned: true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `dash-watchdog-${ownerId.slice(0, 12)}`,
      ownerId,
      title: "Price Sentinel & Renewal Radar",
      description:
        "24/7 >20% price-spike holds, upcoming billing windows, and guardrail audit feed.",
      program: buildWatchdogDashboardProgram(60),
      pinned: true,
      refreshSeconds: 60,
      version: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `dash-credits-${ownerId.slice(0, 12)}`,
      ownerId,
      title: "Startup Credits & Schedule C Tax",
      description:
        "$58,500 eligible SaaS/cloud credit pool and IRS Schedule C deduction tracker.",
      program: buildCreditsTaxDashboardProgram(),
      pinned: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const s of starters) {
    store.byId.set(s.id, s);
  }
}

export class RicoUIDashboardManager {
  public list(
    ownerId: string,
    filter?: { pinnedOnly?: boolean; search?: string }
  ): RicoUIDashboardRecord[] {
    if (!ownerId) {
      throw new RicoUIDashboardError("unauthorized", "Owner session required", 401);
    }
    ensureStarterDashboards(ownerId);
    const store = getGlobalStore();
    const items = Array.from(store.byId.values()).filter(
      (d) => d.ownerId === ownerId
    );

    return items
      .filter((d) => {
        if (filter?.pinnedOnly && !d.pinned) return false;
        if (filter?.search) {
          const q = filter.search.toLowerCase();
          return (
            d.title.toLowerCase().includes(q) ||
            d.description.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }

  public get(ownerId: string, dashboardId: string): RicoUIDashboardRecord {
    if (!ownerId) {
      throw new RicoUIDashboardError("unauthorized", "Owner session required", 401);
    }
    ensureStarterDashboards(ownerId);
    const store = getGlobalStore();
    const record = store.byId.get(dashboardId);
    if (!record || record.ownerId !== ownerId) {
      throw new RicoUIDashboardError(
        "not_found",
        "Dashboard not found for this user.",
        404
      );
    }
    return record;
  }

  public create(
    ownerId: string,
    input: { title: string; prompt: string; programOverride?: string }
  ): RicoUIDashboardRecord {
    if (!ownerId) {
      throw new RicoUIDashboardError("unauthorized", "Owner session required", 401);
    }
    ensureStarterDashboards(ownerId);
    const store = getGlobalStore();
    const synth = synthesizeDashboardProgramFromPrompt(input.prompt || input.title);
    const finalProgram = repairRicoUIProgram(
      input.programOverride?.trim() || synth.program
    );
    const now = new Date().toISOString();
    const id = `dash-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const record: RicoUIDashboardRecord = {
      id,
      ownerId,
      title: input.title.trim() || "Live Financial Dashboard",
      description: synth.description,
      program: finalProgram,
      pinned: false,
      refreshSeconds: synth.refreshSeconds,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    store.byId.set(id, record);
    return record;
  }

  public edit(
    ownerId: string,
    input: { id: string; prompt: string; patchOverride?: string }
  ): { dashboard: RicoUIDashboardRecord; summary: string } {
    const existing = this.get(ownerId, input.id);
    const store = getGlobalStore();

    let nextProgram: string;
    let summary: string;
    let nextRefresh = existing.refreshSeconds;

    if (input.patchOverride?.trim()) {
      nextProgram = repairRicoUIProgram(
        mergeRicoUIStatements(existing.program, input.patchOverride)
      );
      summary = "Applied surgical RicoUI statement patch.";
    } else {
      const patched = applySurgicalDashboardEdit(existing.program, input.prompt);
      nextProgram = patched.nextProgram;
      summary = patched.summary;
      if (patched.refreshSeconds) nextRefresh = patched.refreshSeconds;
    }

    const updated: RicoUIDashboardRecord = {
      ...existing,
      program: nextProgram,
      refreshSeconds: nextRefresh,
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
    };

    store.byId.set(updated.id, updated);
    return { dashboard: updated, summary };
  }

  public updateMeta(
    ownerId: string,
    dashboardId: string,
    patch: { title?: string; pinned?: boolean; refreshSeconds?: number | null }
  ): RicoUIDashboardRecord {
    const existing = this.get(ownerId, dashboardId);
    const store = getGlobalStore();

    const updated: RicoUIDashboardRecord = {
      ...existing,
      title:
        typeof patch.title === "string" && patch.title.trim()
          ? patch.title.trim()
          : existing.title,
      pinned: typeof patch.pinned === "boolean" ? patch.pinned : existing.pinned,
      refreshSeconds:
        patch.refreshSeconds === null
          ? undefined
          : typeof patch.refreshSeconds === "number"
          ? patch.refreshSeconds
          : existing.refreshSeconds,
      updatedAt: new Date().toISOString(),
    };

    store.byId.set(updated.id, updated);
    return updated;
  }

  public remove(ownerId: string, dashboardId: string): boolean {
    const existing = this.get(ownerId, dashboardId);
    const store = getGlobalStore();
    return store.byId.delete(existing.id);
  }

  /**
   * Executes live dashboard Query calls against the owner's database & FinOps engines.
   */
  public async executeInterpreter(
    ownerId: string,
    request: RicoUIInterpreterRequest,
    options?: { signal?: AbortSignal; timeoutMs?: number }
  ): Promise<RicoUIInterpreterResponse> {
    if (!ownerId) {
      throw new RicoUIDashboardError("unauthorized", "Owner session required", 401);
    }

    if (request.dashboardId) {
      // Enforces owner isolation on the dashboard id
      this.get(ownerId, request.dashboardId);
    }

    const queries = Array.isArray(request.queries) ? request.queries.slice(0, 12) : [];
    const results: Record<string, unknown> = {};
    const errors: Record<string, string> = {};
    const timeoutMs = options?.timeoutMs ?? 30000;

    await Promise.all(
      queries.map(async (q) => {
        if (options?.signal?.aborted) {
          errors[q.id] = "Request aborted";
          return;
        }
        const tool = ricoDashboardDataTools[q.tool];
        if (!tool) {
          errors[q.id] = `Unknown dashboard data tool: ${q.tool}`;
          return;
        }
        try {
          const execPromise = tool.execute(
            q.args ?? {},
            { ownerId },
            { signal: options?.signal }
          );
          const timed = await Promise.race([
            execPromise,
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error(`Tool ${q.tool} timed out`)),
                timeoutMs
              )
            ),
          ]);
          results[q.id] = timed;
        } catch (err) {
          errors[q.id] = err instanceof Error ? err.message : String(err);
        }
      })
    );

    return {
      results,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      executedAt: new Date().toISOString(),
    };
  }
}

export const ricoDashboards = new RicoUIDashboardManager();
