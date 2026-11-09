/**
 * Test Suite for WhatsApp Cloud & Slack Action Callback Handlers
 * Rico 24/7 Price Sentinel - PayPal AI Hackathon 2026
 */

import { whatsAppCloudHandler } from "./whatsapp-handler";
import { slackActionHandler } from "./slack-handler";
import { db, mandates } from "@/db";

export async function runOmnichannelHandlerTests(): Promise<{
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

  // Ensure test mandate exists in SQLite
  const testMandateId = "test-mandate-omni";
  try {
    const existing = db.select().from(mandates).all().find((m) => m.id === testMandateId);
    if (!existing) {
      db.insert(mandates)
        .values({
          id: testMandateId,
          service: "Adobe Creative Cloud Omni Test",
          budgetCeiling: 40.0,
          lastScrapedPrice: 35.0,
          recurrence: "Monthly on 10th",
          nextRun: new Date().toISOString(),
          status: "ACTIVE",
          category: "Design",
          currency: "USD",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .run();
    }
  } catch (err) {
    console.warn("DB setup notice:", err);
  }

  const testCases: Array<{ name: string; fn: () => void | Promise<void> }> = [
    {
      name: "1. WhatsApp Webhook: Valid challenge verification",
      fn: () => {
        const res = whatsAppCloudHandler.verifyWebhook(
          "subscribe",
          "rico_whatsapp_sentinel_token",
          "11559922"
        );
        assert(res.valid === true, "Verification accepted");
        assert(res.challenge === "11559922", "Challenge echoed back");
      },
    },
    {
      name: "2. WhatsApp Webhook: Rejection on bad token",
      fn: () => {
        const res = whatsAppCloudHandler.verifyWebhook(
          "subscribe",
          "wrong_token",
          "11559922"
        );
        assert(res.valid === false, "Verification rejected");
      },
    },
    {
      name: "3. WhatsApp Webhook: Interactive Quick Reply Approve executes PayPal payment",
      fn: async () => {
        const metaPayload = {
          object: "whatsapp_business_account",
          entry: [
            {
              id: "123456",
              changes: [
                {
                  value: {
                    messaging_product: "whatsapp",
                    metadata: { display_phone_number: "15551234567", phone_number_id: "phone_1" },
                    messages: [
                      {
                        from: "15557654321",
                        id: "wamid.test1",
                        timestamp: String(Date.now()),
                        type: "interactive",
                        interactive: {
                          type: "button_reply",
                          button_reply: {
                            id: `approve:${testMandateId}:alert-wa-1:54.99`,
                            title: "Approve ($54.99)",
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        };

        const res = await whatsAppCloudHandler.processWebhookUpdate(metaPayload);
        assert(res.processed === true, "WhatsApp button reply processed");
        assert(res.type === "button_reply", "Type is button_reply");
        assert(res.actionResult?.mandateStatus === "ACTIVE", "Mandate restored to ACTIVE");
        assert(res.actionResult?.orderId !== undefined, "PayPal order ID created");
      },
    },
    {
      name: "4. WhatsApp Webhook: Text message query returns spending rules",
      fn: async () => {
        const metaPayload = {
          object: "whatsapp_business_account",
          entry: [
            {
              id: "123456",
              changes: [
                {
                  value: {
                    messaging_product: "whatsapp",
                    messages: [
                      {
                        from: "15557654321",
                        id: "wamid.text1",
                        type: "text",
                        text: { body: "status" },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        };

        const res = await whatsAppCloudHandler.processWebhookUpdate(metaPayload);
        assert(res.processed === true, "Text command processed");
        assert(res.type === "text_command", "Type is text_command");
        assert(res.replyText?.includes("Active Spending Rules") === true, "Spending rules in reply");
      },
    },
    {
      name: "5. Slack Block Kit: Button action click executes mandate cancellation",
      fn: async () => {
        const slackPayload = {
          type: "block_actions",
          user: { id: "U_MANAGER", username: "sarah", name: "Sarah Connor" },
          channel: { id: "C_FINANCE", name: "finance-watchdog" },
          actions: [
            {
              action_id: "sentinel_cancel",
              value: `cancel:${testMandateId}:alert-slack-1:0`,
            },
          ],
        };

        const res = await slackActionHandler.processBlockAction(slackPayload);
        assert(res.processed === true, "Slack action processed");
        assert(res.action === "sentinel_cancel", "Action ID matched");
        assert(res.slackUser === "Sarah Connor", "User name captured");
        assert(res.actionResult?.mandateStatus === "PAUSED", "Mandate paused in SQLite");
      },
    },
    {
      name: "6. Slack Slash Command: /rico status returns formatted Block Kit cards",
      fn: async () => {
        const res = await slackActionHandler.processSlashCommand("status", "alex");
        assert(res.response_type === "in_channel", "Posted to channel");
        assert(res.blocks !== undefined && res.blocks.length >= 2, "Block Kit blocks provided");
        assert(res.text.includes("Active Spending Rules"), "Rules text present");
      },
    },
    {
      name: "7. Slack Slash Command: /rico audit runs 24h background cycle",
      fn: async () => {
        const res = await slackActionHandler.processSlashCommand("audit", "alex");
        assert(res.response_type === "in_channel", "Posted to channel");
        assert(res.blocks !== undefined, "Blocks returned");
        assert(res.text.includes("Audit Complete"), "Audit confirmation present");
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

  return { passed, failed, results };
}

// Allow CLI direct execution
if (process.argv[1]?.includes("omnichannel-handlers.test")) {
  runOmnichannelHandlerTests().then((res) => {
    console.log(`\n=== WHATSAPP & SLACK HANDLER TEST RESULTS ===`);
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
