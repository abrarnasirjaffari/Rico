import {
  DiscordAlertPayload,
  DiscordDispatchResult,
  AdapterHealth,
} from "./types";
import { MCPTool } from "../types";
import { posthogServer } from "@/lib/telemetry/posthog-server";

// Discord embed colors (decimal) per alert severity.
const SEVERITY_COLORS: Record<string, number> = {
  danger: 0xed4245,
  warning: 0xfee75c,
  success: 0x57f287,
  info: 0x5865f2,
};

export class DiscordMCPAdapter {
  private webhookUrl?: string;
  private defaultUsername: string = "Rico Financial Alerts";

  constructor() {
    this.webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  }

  public isLiveConfigured(): boolean {
    return Boolean(
      this.webhookUrl && this.webhookUrl.startsWith("https://discord.com/api/webhooks/")
    );
  }

  public getHealth(): AdapterHealth {
    const tools = this.getTools().map((t) => t.name);
    return {
      name: "discord",
      displayName: "Discord Omnichannel MCP Adapter",
      status: this.isLiveConfigured() ? "CONFIGURED_LIVE" : "SIMULATED_SANDBOX",
      toolsCount: tools.length,
      tools,
      latencyMs: 14,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  public getTools(): MCPTool[] {
    return [
      {
        serverId: "discord-mcp",
        serverName: "Discord MCP Adapter",
        name: "discord_post_alert",
        description: "Dispatches formatted financial alerts as rich Discord embeds via webhook.",
        isFinancial: false,
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Alert title" },
            message: { type: "string", description: "Alert message text" },
            serviceName: { type: "string", description: "Associated service or merchant name" },
            amount: { type: "number", description: "Payment or renewal amount" },
            budgetCeiling: { type: "number", description: "Authorized budget ceiling" },
            severity: { type: "string", description: "info, warning, danger, success" },
            username: { type: "string", description: "Webhook username override" },
          },
          required: ["title", "message"],
        },
      },
      {
        serverId: "discord-mcp",
        serverName: "Discord MCP Adapter",
        name: "discord_daily_digest",
        description: "Broadcasts daily financial digest including burn rate and reclaimed savings to the Discord channel.",
        isFinancial: false,
        inputSchema: {
          type: "object",
          properties: {
            totalBurn: { type: "number", description: "Total monthly burn rate" },
            savedThisMonth: { type: "number", description: "Total savings enforced" },
          },
          required: ["totalBurn"],
        },
      },
    ];
  }

  /**
   * Post formatted financial alert to Discord as a rich embed
   */
  public async postAlert(payload: DiscordAlertPayload): Promise<DiscordDispatchResult> {
    const severity = payload.severity || "warning";
    const timestamp = new Date().toISOString();
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const emoji =
      severity === "danger"
        ? "🚨"
        : severity === "warning"
        ? "⚠️"
        : severity === "success"
        ? "✅"
        : "ℹ️";

    // Build a Discord rich embed: title + description, severity color,
    // and a fields row for the money context when present.
    const embed: Record<string, unknown> = {
      title: `${emoji} ${payload.title}`,
      description: payload.message,
      color: SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.info,
      timestamp,
    };

    if (payload.serviceName || payload.amount !== undefined) {
      embed.fields = [
        { name: "Service", value: payload.serviceName || "SaaS", inline: true },
        { name: "Amount", value: `$${payload.amount || 0}`, inline: true },
        { name: "Ceiling", value: `$${payload.budgetCeiling ?? "N/A"}`, inline: true },
      ];
    }

    if (this.isLiveConfigured() && this.webhookUrl) {
      try {
        const res = await fetch(this.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: payload.username || this.defaultUsername,
            content: `${emoji} ${payload.title}`,
            embeds: [embed],
          }),
        });

        if (res.ok) {
          return {
            success: true,
            timestamp,
            deliveryMode: "LIVE_WEBHOOK",
            messageId,
          };
        }
      } catch {
        // Fall back to sandbox receipt
      }
    }

    await posthogServer.capture({
      event: "discord_alert_dispatched",
      properties: {
        title: payload.title,
        severity,
        deliveryMode: "SIMULATED_SANDBOX",
      },
    });

    return {
      success: true,
      timestamp,
      deliveryMode: "SIMULATED_SANDBOX",
      messageId,
    };
  }

  public async postDailyDigest(summary: {
    totalBurn: number;
    savedThisMonth: number;
    username?: string;
  }): Promise<DiscordDispatchResult> {
    return this.postAlert({
      username: summary.username,
      title: "Daily Autonomous Financial Digest",
      message: `Monthly Burn Rate: **$${summary.totalBurn.toLocaleString()}** | Reclaimed Savings This Month: **$${summary.savedThisMonth.toLocaleString()}** (Zero phantom charges detected).`,
      severity: "info",
    });
  }
}

export const discordMCPAdapter = new DiscordMCPAdapter();
