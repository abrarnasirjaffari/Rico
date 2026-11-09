import { NextRequest, NextResponse } from "next/server";
import { whatsAppCloudHandler } from "@/lib/sentinel";

export const dynamic = "force-dynamic";

/**
 * GET /api/sentinel/webhook/whatsapp
 * Meta WhatsApp Cloud API Webhook Verification (hub.challenge)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verification = whatsAppCloudHandler.verifyWebhook(mode, token, challenge);

  if (verification.valid && verification.challenge) {
    return new NextResponse(verification.challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json(
    { error: verification.error || "Failed webhook verification" },
    { status: 403 }
  );
}

/**
 * POST /api/sentinel/webhook/whatsapp
 * Processes WhatsApp Cloud Interactive Quick Reply button taps and text messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await whatsAppCloudHandler.processWebhookUpdate(body);

    return NextResponse.json({
      success: true,
      source: "whatsapp_cloud_webhook",
      result,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
