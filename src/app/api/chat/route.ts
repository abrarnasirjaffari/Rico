import { NextRequest, NextResponse } from "next/server";
import { ensureOwnerRecord, requireSession } from "@/lib/auth/require-session";
import { geminiAgent } from "@/lib/gemini";

export const dynamic = "force-dynamic";

const ALLOWED_PERSONAS: Record<string, string> = {
  founder: "founder",
  startup_founder: "founder",
  student: "student",
  freelancer: "freelancer",
  developer: "developer",
  developer_smb: "developer",
  smb: "smb",
  all: "all",
};

function sanitizePersona(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const key = raw.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(ALLOWED_PERSONAS, key)
    ? ALLOWED_PERSONAS[key]
    : undefined;
}

export async function POST(req: NextRequest) {
  const auth = await requireSession(req);
  if (!auth.ok) return auth.response;

  try {
    await ensureOwnerRecord(auth.session);
    const body = await req.json();
    const { message, model, strictMode, persona, mandates, workspaceSnapshot, history } = body;
    const safePersona = sanitizePersona(persona);

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string." },
        { status: 400 }
      );
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            (h): h is { role: "user" | "assistant"; content: string } =>
              Boolean(
                h &&
                  (h.role === "user" || h.role === "assistant") &&
                  typeof h.content === "string" &&
                  h.content.trim().length > 0
              )
          )
          .slice(-10)
      : undefined;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = geminiAgent.streamResponse(message, {
            ownerId: auth.session.user.id,
            model: typeof model === "string" ? model : undefined,
            strictMode,
            persona: safePersona,
            activeMandates: mandates,
            workspaceSnapshot,
            history: safeHistory,
          });

          for await (const event of generator) {
            const data = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          controller.close();
        } catch (err: unknown) {
          const errorMsg =
            err instanceof Error ? err.message : "Internal streaming error";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: errorMsg })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
