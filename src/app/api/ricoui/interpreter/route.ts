import { NextRequest, NextResponse } from "next/server";
import { ensureOwnerRecord, requireSession } from "@/lib/auth/require-session";
import { ricoDashboards, RicoUIDashboardError } from "@/lib/ricoui";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;

  try {
    await ensureOwnerRecord(auth.session);
    const body = await request.json();
    const result = await ricoDashboards.executeInterpreter(
      auth.session.user.id,
      body,
      { signal: request.signal, timeoutMs: 30000 }
    );
    return NextResponse.json({ result });
  } catch (error) {
    const known = error instanceof RicoUIDashboardError;
    return NextResponse.json(
      {
        error: {
          code: known ? error.code : "internal_error",
          message: error instanceof Error ? error.message : String(error),
        },
      },
      { status: known ? error.status : 500 }
    );
  }
}
