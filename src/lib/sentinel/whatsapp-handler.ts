/**
 * WhatsApp Cloud Interactive Callback Handler
 * Rico 24/7 Price Sentinel - PayPal AI Hackathon 2026
 */

import { handleRemoteAction } from "./callback-handler";
import { RemoteActionResult } from "./types";
import { db, mandates } from "@/db";

export interface WhatsAppVerificationResult {
  valid: boolean;
  challenge?: string;
  error?: string;
}

export interface WhatsAppCallbackProcessResult {
  processed: boolean;
  type: "button_reply" | "text_command" | "status_query" | "ignored";
  actionResult?: RemoteActionResult;
  replyText?: string;
  recipientPhone?: string;
  error?: string;
}

export class WhatsAppCloudHandler {
  private verifyToken: string;
  private apiToken?: string;
  private phoneNumberId?: string;

  constructor() {
    this.verifyToken =
      process.env.WHATSAPP_VERIFY_TOKEN || "rico_whatsapp_sentinel_token";
    this.apiToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  }

  /**
   * Validates Meta WhatsApp Webhook Subscription Challenge (GET request)
   */
  public verifyWebhook(
    mode: string | null,
    token: string | null,
    challenge: string | null
  ): WhatsAppVerificationResult {
    if (mode === "subscribe" && token === this.verifyToken && challenge) {
      return {
        valid: true,
        challenge,
      };
    }
    return {
      valid: false,
      error: "Invalid WhatsApp verify token or subscription mode",
    };
  }

  /**
   * Processes incoming WhatsApp Cloud webhook updates (POST request)
   * Supports:
   * 1. Interactive quick reply button clicks (approve, backup_card, cancel)
   * 2. Text inquiries (status, help, spending rules)
   */
  public async processWebhookUpdate(
    body: Record<string, unknown>
  ): Promise<WhatsAppCallbackProcessResult> {
    try {
      // 1. Traverse Meta Cloud API payload envelope
      const entry = (body.entry as Array<Record<string, unknown>>)?.[0];
      const change = (entry?.changes as Array<Record<string, unknown>>)?.[0];
      const val = change?.value as Record<string, unknown> | undefined;

      if (!val) {
        return { processed: false, type: "ignored", error: "No change value found" };
      }

      const messages = val.messages as Array<Record<string, unknown>> | undefined;
      if (!messages || messages.length === 0) {
        return { processed: false, type: "ignored", error: "No messages in update" };
      }

      const msg = messages[0];
      const fromPhone = (msg.from as string) || "unknown";
      const msgType = msg.type as string;

      // 2. Interactive Quick Reply Button Click
      if (msgType === "interactive") {
        const interactive = msg.interactive as Record<string, unknown> | undefined;
        const buttonReply = interactive?.button_reply as Record<string, unknown> | undefined;
        const buttonId = (buttonReply?.id as string) || "";

        // Payload format: "action:mandateId:alertId:price"
        const [rawAction, mandateId, alertId, rawPrice] = buttonId.split(":");
        const action = rawAction as "approve" | "backup_card" | "cancel";
        const overridePrice = rawPrice ? parseFloat(rawPrice) : undefined;

        if (mandateId && ["approve", "backup_card", "cancel"].includes(action)) {
          const actionResult = await handleRemoteAction({
            action,
            mandateId,
            alertId,
            overridePrice,
          });

          // Compose confirmation message
          const confirmationText = [
            `✅ *Rico Sentinel: Action Executed*`,
            ``,
            `*Service:* ${actionResult.service}`,
            `*Status:* ${actionResult.mandateStatus}`,
            actionResult.amount
              ? `*Amount:* $${actionResult.amount.toFixed(2)} USD`
              : "",
            actionResult.orderId
              ? `*PayPal Order:* \`${actionResult.orderId}\``
              : "",
            ``,
            `_${actionResult.message}_`,
          ]
            .filter(Boolean)
            .join("\n");

          await this.sendTextMessage(fromPhone, confirmationText);

          return {
            processed: true,
            type: "button_reply",
            actionResult,
            replyText: confirmationText,
            recipientPhone: fromPhone,
          };
        }
      }

      // 3. Regular Text Message (Commands: status, help, audit)
      if (msgType === "text") {
        const textObj = msg.text as Record<string, unknown> | undefined;
        const bodyText = ((textObj?.body as string) || "").trim().toLowerCase();

        let reply = "";
        if (bodyText.includes("status") || bodyText.includes("mandate")) {
          const allMandates = db.select().from(mandates).all();
          reply = [
            `📊 *Rico Active Spending Rules*`,
            ``,
            ...allMandates.map(
              (m) =>
                `• *${m.service}*: Max $${m.budgetCeiling.toFixed(
                  2
                )} (Last: $${m.lastScrapedPrice.toFixed(2)}) - ${m.status}`
            ),
            ``,
            `🔒 *Payment Rails:* Primary PayPal + Vaulted Visa`,
          ].join("\n");
        } else {
          reply = [
            `🤖 *Rico Sentinel WhatsApp Assistant*`,
            `Your 24/7 background subscription watchdog.`,
            ``,
            `Type *status* to view active spending rules, or wait for automated price spike alerts with one-tap decision buttons.`,
          ].join("\n");
        }

        await this.sendTextMessage(fromPhone, reply);

        return {
          processed: true,
          type: "text_command",
          replyText: reply,
          recipientPhone: fromPhone,
        };
      }

      return { processed: false, type: "ignored" };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { processed: false, type: "ignored", error: errorMsg };
    }
  }

  /**
   * Transmits a text message to a WhatsApp user via Meta Cloud API or simulation
   */
  public async sendTextMessage(to: string, text: string): Promise<boolean> {
    if (this.apiToken && this.phoneNumberId) {
      try {
        const res = await fetch(
          `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.apiToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to,
              type: "text",
              text: { body: text },
            }),
          }
        );
        return res.ok;
      } catch (err) {
        console.warn("[WhatsAppCloudHandler] Delivery error:", err);
        return false;
      }
    }

    // High-fidelity local simulation mode
    console.log(`[WhatsAppCloudHandler] (Simulated WhatsApp sent to ${to}):`, text);
    return true;
  }
}

export const whatsAppCloudHandler = new WhatsAppCloudHandler();
