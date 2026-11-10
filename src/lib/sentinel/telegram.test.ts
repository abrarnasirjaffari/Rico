/**
 * Test Suite for Telegram Two-Way Interactive Webhook
 * Rico Agentic Commerce - PayPal AI Hackathon 2026
 */

import { handleTelegramCommand, handleRemoteAction } from "./callback-handler";
import { omnichannelDispatcher, omnichannelAlertStore } from "./omnichannel";
import { db, mandates, transactions, users } from "@/db";
import { eq } from "drizzle-orm";

export async function runTelegramWebhookTests(): Promise<{
  passed: number;
  failed: number;
  results: Array<{ name: string; success: boolean; error?: string }>;
}> {
  const results: Array<{ name: string; success: boolean; error?: string }> = [];

  function assert(condition: boolean, message: string) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // Ensure test user & mandate exist in SQLite
  const testOwnerId = "usr_telegram_test";
  const testMandateId = `test-mandate-tg-${Date.now()}`;
  try {
    db.insert(users)
      .values({ id: testOwnerId, email: "telegram-test@example.test" })
      .onConflictDoNothing()
      .run();
    db.delete(transactions).where(eq(transactions.mandateId, testMandateId)).run();
    db.delete(mandates).where(eq(mandates.id, testMandateId)).run();
    db.insert(mandates)
      .values({
        id: testMandateId,
        ownerId: testOwnerId,
        service: "Netflix HD Test",
        budgetCeiling: 40.0,
        lastScrapedPrice: 15.49,
        recurrence: "Monthly on 5th",
        nextRun: new Date().toISOString(),
        status: "ANOMALY_HOLD",
        category: "Media",
        currency: "USD",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .run();
  } catch (err) {
    console.warn("DB setup notice:", err);
  }

  const testCases: Array<{ name: string; fn: () => void | Promise<void> }> = [
    {
      name: "1. /start command returns full onboarding menu",
      fn: async () => {
        const res = await handleTelegramCommand("/start", 12345);
        assert(res.command === "/start", "Command parsed as /start");
        assert(res.replyText.includes("Welcome to Rico Sentinel Bot"), "Welcome header present");
        assert(res.replyText.includes("/status"), "Status command listed");
        assert(res.replyText.includes("/audit"), "Audit command listed");
      },
    },
    {
      name: "2. /status command returns active mandates from SQLite",
      fn: async () => {
        const res = await handleTelegramCommand("/status", 12345);
        assert(res.command === "/status", "Command parsed as /status");
        assert(res.replyText.includes("Rico Active Spending Rules"), "Rules header present");
        assert(res.replyText.includes("Total Monthly Allocated Budget"), "Total budget calculated");
      },
    },
    {
      name: "3. /pending command returns clear status when no spikes exist",
      fn: async () => {
        const res = await handleTelegramCommand("/pending", 12345);
        assert(res.command === "/pending", "Command parsed as /pending");
        assert(res.replyText.length > 10, "Reply text provided");
      },
    },
    {
      name: "4. /pending returns interactive 3-button keyboard when alert is pending",
      fn: async () => {
        const alertId = "alert-tg-test-1";
        omnichannelAlertStore.saveAlert({
          id: alertId,
          mandateId: testMandateId,
          ownerId: testOwnerId,
          service: "Netflix HD Test",
          oldPrice: 15.49,
          newPrice: 24.99,
          jumpPercent: 61,
          budgetCeiling: 40.0,
          currency: "USD",
          channel: "telegram",
          timestamp: new Date().toISOString(),
          status: "PENDING",
        });

        const res = await handleTelegramCommand("/pending", 12345);
        assert(res.replyMarkup !== undefined, "Reply markup attached");
        const kb = res.replyMarkup as { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> };
        assert(kb.inline_keyboard.length === 3, "Has 3 action buttons");
        assert(kb.inline_keyboard[0][0].callback_data.startsWith("approve:"), "Approve button exists");
        assert(kb.inline_keyboard[1][0].callback_data.startsWith("backup_card:"), "Backup card button exists");
        assert(kb.inline_keyboard[2][0].callback_data.startsWith("cancel:"), "Cancel button exists");
      },
    },
    {
      name: "5. Remote Callback Action: Approve executes PayPal capture",
      fn: async () => {
        const res = await handleRemoteAction({
          ownerId: testOwnerId,
          action: "approve",
          mandateId: testMandateId,
          alertId: "alert-tg-test-1",
        });

        assert(res.success === true, "Execution succeeded");
        assert(res.action === "approve", "Action is approve");
        assert(res.mandateStatus === "ACTIVE", "Mandate restored to ACTIVE");
        assert(res.orderId !== undefined, "PayPal orderId generated");
      },
    },
    {
      name: "6. Remote Callback Action: Cancel pauses mandate and logs audit",
      fn: async () => {
        const res = await handleRemoteAction({
          ownerId: testOwnerId,
          action: "cancel",
          mandateId: testMandateId,
        });

        assert(res.success === true, "Execution succeeded");
        assert(res.action === "cancel", "Action is cancel");
        assert(res.mandateStatus === "PAUSED", "Mandate paused");
      },
    },
    {
      name: "7. Simulated Telegram message dispatch & editing",
      fn: async () => {
        const editOk = await omnichannelDispatcher.editTelegramMessage(
          12345,
          999,
          "✅ Action Completed: Paid $15.49 via PayPal"
        );
        assert(editOk === true, "Edit message succeeded in simulation");

        const sendOk = await omnichannelDispatcher.sendTelegramTextMessage(
          12345,
          "Test notification"
        );
        assert(sendOk === true, "Send message succeeded in simulation");
      },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    try {
      await tc.fn();
      results.push({ name: tc.name, success: true });
      passed++;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      results.push({ name: tc.name, success: false, error: errorMsg });
      failed++;
    }
  }

  try {
    db.delete(transactions).where(eq(transactions.mandateId, testMandateId)).run();
    db.delete(mandates).where(eq(mandates.id, testMandateId)).run();
  } catch {}

  return { passed, failed, results };
}

// Allow CLI direct execution
if (process.argv[1]?.includes("telegram.test")) {
  runTelegramWebhookTests().then((res) => {
    console.log(`\n=== TELEGRAM TWO-WAY WEBHOOK TEST RESULTS ===`);
    console.log(`Passed: ${res.passed}/${res.passed + res.failed}`);
    for (const r of res.results) {
      console.log(`${r.success ? "✅" : "❌"} ${r.name}`);
      if (r.error) {
        console.error(`   Error: ${r.error}`);
      }
    }
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
