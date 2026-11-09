/**
 * Slack Enterprise Block Kit Action & Slash Command Callback Handler
 * Rico 24/7 Price Sentinel - PayPal AI Hackathon 2026
 */

import { handleRemoteAction } from "./callback-handler";
import { RemoteActionResult } from "./types";
import { db, mandates } from "@/db";

export interface SlackBlockActionResult {
  processed: boolean;
  action?: string;
  actionResult?: RemoteActionResult;
  slackUser?: string;
  channelId?: string;
  messageTs?: string;
  error?: string;
}

export interface SlackSlashCommandResult {
  response_type: "in_channel" | "ephemeral";
  text: string;
  blocks?: Array<Record<string, unknown>>;
}

export class SlackActionHandler {
  /**
   * Processes Slack Block Kit interactive action payloads (button clicks)
   */
  public async processBlockAction(
    payload: Record<string, unknown>
  ): Promise<SlackBlockActionResult> {
    try {
      const type = payload.type as string;
      if (type !== "block_actions") {
        return { processed: false, error: "Not a block_actions payload" };
      }

      const actions = payload.actions as Array<Record<string, unknown>> | undefined;
      if (!actions || actions.length === 0) {
        return { processed: false, error: "No actions array found in payload" };
      }

      const firstAction = actions[0];
      const actionValue = (firstAction.value as string) || "";
      const actionId = (firstAction.action_id as string) || "";
      const responseUrl = payload.response_url as string | undefined;

      const user = payload.user as Record<string, unknown> | undefined;
      const userName = (user?.name as string) || (user?.username as string) || "Manager";
      const channel = payload.channel as Record<string, unknown> | undefined;
      const channelId = channel?.id as string | undefined;

      // Parse payload: "action:mandateId:alertId:price"
      const [rawAction, mandateId, alertId, rawPrice] = actionValue.split(":");
      const action = rawAction as "approve" | "backup_card" | "cancel";
      const overridePrice = rawPrice ? parseFloat(rawPrice) : undefined;

      if (!mandateId || !["approve", "backup_card", "cancel"].includes(action)) {
        return { processed: false, error: `Invalid action value: ${actionValue}` };
      }

      // Execute transaction via PayPal Orders or pause mandate
      const actionResult = await handleRemoteAction({
        action,
        mandateId,
        alertId,
        overridePrice,
      });

      // Update original Slack message in-channel via response_url if available
      if (responseUrl) {
        const resolutionBlocks = this.formatResolutionBlockKit(actionResult, userName);
        await this.postSlackResponseUrl(responseUrl, resolutionBlocks);
      }

      return {
        processed: true,
        action: actionId,
        actionResult,
        slackUser: userName,
        channelId,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { processed: false, error: errorMsg };
    }
  }

  /**
   * Handles Slack Slash Commands (/rico status, /rico audit, /rico pending, /rico help)
   */
  public async processSlashCommand(
    commandText: string,
    userName: string = "User"
  ): Promise<SlackSlashCommandResult> {
    const text = (commandText || "").trim().toLowerCase();

    // 1. /rico status
    if (text.includes("status") || text.includes("mandate")) {
      const allMandates = db.select().from(mandates).all();
      const totalCeiling = allMandates.reduce((sum, m) => sum + m.budgetCeiling, 0);

      return {
        response_type: "in_channel",
        text: `📊 Rico Active Spending Rules (${allMandates.length} total)`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "📊 Rico Active Spending Rules & Subscription Health",
              emoji: true,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: allMandates
                .map(
                  (m) =>
                    `• *${m.service}*: Max $${m.budgetCeiling.toFixed(
                      2
                    )} (Last: $${m.lastScrapedPrice.toFixed(2)}) — \`${m.status}\``
                )
                .join("\n"),
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `💰 *Total Monthly Allocated Budget:* $${totalCeiling.toFixed(
                  2
                )} USD | Dual-Rail: PayPal + Vaulted Visa`,
              },
            ],
          },
        ],
      };
    }

    // 2. /rico audit
    if (text.includes("audit") || text.includes("run")) {
      const { priceSentinel } = await import("./price-sentinel");
      const report = await priceSentinel.runAuditCycle({ forceSpike: false });

      return {
        response_type: "in_channel",
        text: `🔍 Live Price Audit Complete for ${userName}`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "🔍 Rico 24h Background Sentinel Audit Results",
              emoji: true,
            },
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Audited Services:*\n${report.totalAudited}` },
              { type: "mrkdwn", text: `*Healthy Renewals:*\n${report.healthyCount}` },
              { type: "mrkdwn", text: `*Price Spikes:*\n${report.anomaliesDetected}` },
              { type: "mrkdwn", text: `*Alerts Dispatched:*\n${report.alertsDispatched}` },
            ],
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text:
                  report.anomaliesDetected > 0
                    ? `⚠️ Price spikes found! Interactive decision buttons have been posted.`
                    : `✅ All subscriptions verified within budget limits.`,
              },
            ],
          },
        ],
      };
    }

    // Default /help
    return {
      response_type: "ephemeral",
      text: "🤖 Rico Sentinel Commands",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🤖 Rico Sentinel Bot Commands",
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `• \`/rico status\` — Inspect all team subscriptions and spending rules\n• \`/rico audit\` — Run immediate 24h background price scraper\n• \`/rico help\` — Show available commands`,
          },
        },
      ],
    };
  }

  /**
   * Formats a resolved Slack Block Kit message to replace original alert buttons
   */
  public formatResolutionBlockKit(
    result: RemoteActionResult,
    decidedBy: string
  ): Record<string, unknown> {
    const isApproved = result.action === "approve" || result.action === "backup_card";
    const statusEmoji = isApproved ? "✅" : "🛑";

    return {
      replace_original: true,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${statusEmoji} Alert Resolved: ${result.service}`,
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Decision:*\n${result.action.toUpperCase()}` },
            { type: "mrkdwn", text: `*Authorized By:*\n@${decidedBy}` },
            {
              type: "mrkdwn",
              text: `*Amount:*\n${result.amount ? `$${result.amount.toFixed(2)} USD` : "N/A"}`,
            },
            {
              type: "mrkdwn",
              text: `*Funding Rail:*\n${result.fundingRail || "N/A (Cancelled)"}`,
            },
            {
              type: "mrkdwn",
              text: `*PayPal Order:*\n\`${result.orderId || "None"}\``,
            },
            {
              type: "mrkdwn",
              text: `*Mandate Status:*\n\`${result.mandateStatus}\``,
            },
          ],
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `*Audit Log:* ${result.message} | Timestamp: ${new Date().toLocaleTimeString()}`,
            },
          ],
        },
      ],
    };
  }

  /**
   * Posts updated Block Kit payload to Slack's response_url
   */
  private async postSlackResponseUrl(
    responseUrl: string,
    payload: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const res = await fetch(responseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (err) {
      console.warn("[SlackActionHandler] Error updating Slack message:", err);
      return false;
    }
  }
}

export const slackActionHandler = new SlackActionHandler();
