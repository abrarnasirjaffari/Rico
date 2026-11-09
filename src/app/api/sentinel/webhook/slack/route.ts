import { NextRequest, NextResponse } from "next/server";
import { slackActionHandler } from "@/lib/sentinel";

export const dynamic = "force-dynamic";

/**
 * POST /api/sentinel/webhook/slack
 * Processes Slack Block Kit interactive button actions and /rico slash commands.
 * Handles both application/x-www-form-urlencoded and application/json requests.
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // 1. URL-Encoded Payload (Standard Slack interactive blocks & slash commands)
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();

      // Check if interactive block action
      const payloadRaw = formData.get("payload");
      if (typeof payloadRaw === "string") {
        const payload = JSON.parse(payloadRaw);
        const result = await slackActionHandler.processBlockAction(payload);
        return NextResponse.json({
          success: true,
          source: "slack_block_actions",
          result,
        });
      }

      // Check if Slack Slash Command (e.g. /rico status)
      const command = formData.get("command") as string | null;
      const text = (formData.get("text") as string | null) || "";
      const userName = (formData.get("user_name") as string | null) || "User";

      if (command) {
        const reply = await slackActionHandler.processSlashCommand(text, userName);
        return NextResponse.json(reply);
      }
    }

    // 2. Direct JSON Body (Simulator / API testing)
    const body = await request.json();

    if (body.type === "block_actions") {
      const result = await slackActionHandler.processBlockAction(body);
      return NextResponse.json({
        success: true,
        source: "slack_block_actions",
        result,
      });
    }

    if (body.command || body.text) {
      const reply = await slackActionHandler.processSlashCommand(
        body.text || "",
        body.user_name || "User"
      );
      return NextResponse.json(reply);
    }

    return NextResponse.json(
      { error: "Unrecognized Slack payload format" },
      { status: 400 }
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
