import { db, mandates, auditLogs } from "@/db";
import { and, eq } from "drizzle-orm";
import { executeMandatePayment } from "@/lib/paypal";
import { executeAtomicPaymentTransaction } from "@/lib/safety/atomic-transaction";
import { mandatePeriodKey } from "@/lib/safety/billing-period";
import { posthogServer } from "@/lib/telemetry/posthog-server";
import { omnichannelAlertStore } from "./omnichannel";
import { RemoteActionResult } from "./types";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Executes remote omnichannel button actions triggered via Telegram webhook,
 * WhatsApp callback, Slack action, or the interactive simulator UI.
 */
export async function handleRemoteAction(params: {
  action: "approve" | "backup_card" | "cancel";
  mandateId: string;
  alertId?: string;
  /** The verified user acting. Never taken from the request body. */
  ownerId: string;
}): Promise<RemoteActionResult> {
  const { action, mandateId, alertId, ownerId } = params;

  // 1. Fetch mandate from SQLite database
  const [mandate] = await db
    .select()
    .from(mandates)
    .where(and(eq(mandates.id, mandateId), eq(mandates.ownerId, ownerId)))
    .limit(1);

  if (!mandate) {
    throw new Error(`Mandate not found with id: ${mandateId}`);
  }

  const alert = alertId ? omnichannelAlertStore.getAlert(alertId) : undefined;
  // Only server-recorded prices: the alert's, or the price Sentinel stored with the hold.
  const executionPrice = alert?.newPrice ?? mandate.lastScrapedPrice;

  const timestamp = new Date().toISOString();

  // 2. Action: 1-Click Cancel Subscription
  if (action === "cancel") {
    // Update mandate status to PAUSED in SQLite
    await db.update(mandates)
      .set({
        status: "PAUSED",
        updatedAt: timestamp,
      })
      .where(and(eq(mandates.id, mandateId), eq(mandates.ownerId, ownerId)));

    const logId = generateId("log");
    const detailMsg = `Subscription cancelled & mandate paused via Omnichannel Remote Action (Telegram/WhatsApp). No payment was captured.`;

    await db.insert(auditLogs)
      .values({
        id: logId,
        mandateId: mandate.id,
        eventType: "GUARDRAIL_BLOCKED",
        service: mandate.service,
        details: detailMsg,
        severity: "warning",
        metadata: {
          action: "cancel",
          source: "omnichannel_remote_callback",
          alertId,
        },
      });

    if (alertId) {
      omnichannelAlertStore.resolveAlert(alertId, "cancel");
    }

    return {
      success: true,
      action: "cancel",
      mandateId,
      service: mandate.service,
      alertId,
      mandateStatus: "PAUSED",
      message: `🛑 Subscription cancelled. Mandate for ${mandate.service} is now paused.`,
      timestamp,
    };
  }

  // 3. Actions: Approve (primary wallet) or Pay with Backup Card (Visa via PayPal Vault)
  const refuse = (message: string): RemoteActionResult => ({
    success: false,
    action,
    mandateId,
    service: mandate.service,
    alertId,
    mandateStatus: mandate.status,
    message,
    timestamp,
  });

  if (alertId && (!alert || alert.mandateId !== mandateId)) {
    return refuse("This alert could not be verified for this mandate. No payment was made.");
  }
  if (alert && alert.status !== "PENDING") {
    return refuse("This alert has already been resolved. No payment was made.");
  }
  if (!alert && mandate.status !== "ANOMALY_HOLD") {
    return refuse("This mandate has no payment awaiting approval. No payment was made.");
  }
  if (!(executionPrice > 0)) {
    return refuse("No verified price is available. No payment was made.");
  }

  const isBackupCard = action === "backup_card";
  const fundingRail = isBackupCard ? "VISA" : "PAYPAL";
  // Both buttons, every alert and every hold share the mandate's billing-period key, so approvals
  // can never add a second charge for the same period.
  const idempotencyKey = mandatePeriodKey(mandate);

  const atomicResult = await executeAtomicPaymentTransaction({
    mandateId: mandate.id,
    ownerId,
    orderId: `ORD-${Date.now()}`,
    idempotencyKey,
    serviceName: mandate.service,
    amount: executionPrice,
    currency: mandate.currency || "USD",
    budgetCeiling: mandate.budgetCeiling,
    allowedMandateStatuses: alert ? ["ACTIVE", "ANOMALY_HOLD"] : ["ANOMALY_HOLD"],
    mandateStatusOnCommit: "ACTIVE",
    auditDetails: isBackupCard
      ? `Remote Payment Approved: Charged $${executionPrice.toFixed(
          2
        )} to Vaulted Backup Card (Visa •••• 4242) via PayPal Vault on remote button tap. Mandate restored to ACTIVE.`
      : `Remote Payment Approved: Captured $${executionPrice.toFixed(
          2
        )} via PayPal Sandbox Wallet on remote button tap. Mandate restored to ACTIVE.`,
    auditMetadata: { action, fundingRail, source: "omnichannel_remote_callback", alertId },
    executePaymentFn: async () => {
      const payment = await executeMandatePayment({
        serviceName: mandate.service,
        verifiedPrice: executionPrice,
        budgetCeiling: mandate.budgetCeiling,
        currency: mandate.currency || "USD",
        mandateId: mandate.id,
        fundingRail,
        paymentAttemptKey: idempotencyKey,
      });
      return { ...payment, receipt: { ...payment.receipt, fundingRail } };
    },
  });

  if (!atomicResult.success) {
    return refuse(atomicResult.message);
  }

  await posthogServer.trackPaymentCompleted({
    service: mandate.service,
    amount: executionPrice,
    orderId: atomicResult.orderId,
    budgetCeiling: mandate.budgetCeiling,
    savingsEnforced: 0,
    paymentMethod: isBackupCard ? "Vaulted Backup Card (Visa •••• 4242)" : "PayPal Sandbox MCP Wallet",
  });

  if (alertId) {
    omnichannelAlertStore.resolveAlert(alertId, action, {
      orderId: atomicResult.orderId,
      transactionId: atomicResult.transactionId,
    });
  }

  return {
    success: true,
    action,
    mandateId,
    service: mandate.service,
    alertId,
    amount: executionPrice,
    orderId: atomicResult.orderId,
    captureId: atomicResult.captureId,
    fundingRail,
    mandateStatus: "ACTIVE",
    message: isBackupCard
      ? `💳 Charged $${executionPrice.toFixed(2)} to backup Visa (PayPal Vault). Mandate for ${mandate.service} is ACTIVE.`
      : `✅ Approved! PayPal payment of $${executionPrice.toFixed(2)} captured. Mandate for ${mandate.service} is ACTIVE.`,
    timestamp,
  };
}

export interface TelegramCommandResult {
  replyText: string;
  replyMarkup?: Record<string, unknown>;
  command: string;
}

/**
 * Handles incoming Telegram Bot chat slash commands:
 * /start, /help, /status, /mandates, /pending, /audit, /run
 */
export async function handleTelegramCommand(
  rawText: string,
  chatId?: string | number
): Promise<TelegramCommandResult> {
  const text = (rawText || "").trim().toLowerCase();
  const command = text.split(" ")[0].replace(/@\w+$/, "");

  // 1. /start or /help
  if (command === "/start" || command === "/help") {
    const replyText = [
      `🤖 *Welcome to Rico Sentinel Bot!* (Chat: ${chatId || "direct"})`,
      `Your 24/7 autonomous financial watchdog for the PayPal AI Hackathon.`,
      ``,
      `*Available Commands:*`,
      `• \`/status\` - View active spending rules & subscription health`,
      `• \`/pending\` - Check alerts requiring your approval`,
      `• \`/audit\` - Run a live 24h price audit scan across all merchants right now`,
      `• \`/help\` - Show this guide`,
      ``,
      `*Dual-Rail Execution:*`,
      `When price changes exceed your budget ceiling, Rico alerts you here with 1-click inline buttons:`,
      `1. ✅ Approve One-Time (Charges PayPal Orders v2)`,
      `2. 💳 Pay with Backup Card (Vaulted Visa •••• 4242)`,
      `3. 🛑 1-Click Cancel (Pauses mandate & prevents billing)`,
    ].join("\n");

    return {
      command,
      replyText,
    };
  }

  // 2. /status or /mandates
  if (command === "/status" || command === "/mandates") {
    const allMandates = db.select().from(mandates).all();

    if (allMandates.length === 0) {
      return {
        command,
        replyText: `📋 *No Spending Rules Found*\nThere are no active mandates configured in SQLite memory yet.`,
      };
    }

    const totalCeiling = allMandates.reduce((sum, m) => sum + m.budgetCeiling, 0);
    const lines = [
      `📊 *Rico Active Spending Rules (${allMandates.length} Total)*`,
      ``,
    ];

    for (const m of allMandates) {
      const statusEmoji = m.status === "ACTIVE" ? "🟢" : "⏸️";
      lines.push(
        `${statusEmoji} *${m.service}*`,
        `   • Cap: $${m.budgetCeiling.toFixed(2)} | Last Scraped: $${m.lastScrapedPrice.toFixed(2)}`,
        `   • Recurrence: ${m.recurrence} | Status: ${m.status}`
      );
    }

    lines.push(
      ``,
      `💰 *Total Monthly Allocated Budget:* $${totalCeiling.toFixed(2)} USD`,
      `🔒 *Payment Rails:* Primary PayPal Balance + Vaulted Visa/Mastercard`
    );

    return {
      command,
      replyText: lines.join("\n"),
    };
  }

  // 3. /pending
  if (command === "/pending") {
    const pendingAlerts = omnichannelAlertStore.getPendingAlerts();

    if (pendingAlerts.length === 0) {
      return {
        command,
        replyText: `✅ *All Subscriptions Within Budget*\nNo price spikes or pending approvals detected right now. Everything is running smoothly!`,
      };
    }

    const latest = pendingAlerts[0];
    const replyText = [
      `🚨 *Pending Alert Requires Attention*`,
      ``,
      `*Service:* ${latest.service}`,
      `• *Previous Price:* $${latest.oldPrice.toFixed(2)}`,
      `• *New Scraped Price:* $${latest.newPrice.toFixed(2)} (+${latest.jumpPercent}%)`,
      `• *Your Budget Limit:* $${latest.budgetCeiling.toFixed(2)}`,
      ``,
      `⚠️ _Choose an action to proceed:_`,
    ].join("\n");

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: `✅ Approve One-Time ($${latest.newPrice.toFixed(2)})`,
            callback_data: `approve:${latest.mandateId}:${latest.id}:${latest.newPrice.toFixed(2)}`,
          },
        ],
        [
          {
            text: `💳 Pay with Backup Card (Visa)`,
            callback_data: `backup_card:${latest.mandateId}:${latest.id}:${latest.newPrice.toFixed(2)}`,
          },
        ],
        [
          {
            text: `🛑 1-Click Cancel Subscription`,
            callback_data: `cancel:${latest.mandateId}:${latest.id}:0`,
          },
        ],
      ],
    };

    return {
      command,
      replyText,
      replyMarkup,
    };
  }

  // 4. /audit or /run
  if (command === "/audit" || command === "/run") {
    const { priceSentinel } = await import("./price-sentinel");
    const report = await priceSentinel.runAuditCycle({ forceSpike: false });

    const replyText = [
      `🔍 *Live Price Audit Complete!*`,
      ``,
      `• *Audited Services:* ${report.totalAudited}`,
      `• *Healthy / Normal:* ${report.healthyCount}`,
      `• *Price Spikes Detected:* ${report.anomaliesDetected}`,
      `• *Alerts Dispatched:* ${report.alertsDispatched}`,
      ``,
      report.anomaliesDetected > 0
        ? `⚠️ *Action Required:* Price spike alerts have been dispatched with interactive buttons.`
        : `✅ *All Clear:* All audited services are within authorized spending limits.`,
    ].join("\n");

    return {
      command,
      replyText,
    };
  }

  // Default unrecognized command
  return {
    command,
    replyText: `❓ *Unrecognized Command: ${command}*\nType \`/help\` to see available commands or \`/status\` to check spending rules.`,
  };
}
