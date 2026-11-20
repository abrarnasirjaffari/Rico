import { NextRequest, NextResponse } from "next/server";
import { ensureOwnerRecord, requireSession } from "@/lib/auth/require-session";
import { ricoDashboards, RicoUIDashboardError } from "@/lib/ricoui";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;

  try {
    await ensureOwnerRecord(auth.session);
    const { searchParams } = new URL(request.url);
    const pinnedOnly = searchParams.get("pinned") === "true";
    const search = searchParams.get("search") || undefined;

    const dashboards = ricoDashboards.list(auth.session.user.id, {
      pinnedOnly,
      search,
    });
    return NextResponse.json({ dashboards });
  } catch (error) {
    const status =
      error instanceof RicoUIDashboardError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Failed to list dashboards";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;

  try {
    await ensureOwnerRecord(auth.session);
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!title && !prompt) {
      return NextResponse.json(
        { error: "Title or prompt is required to create a dashboard." },
        { status: 400 }
      );
    }

    const dashboard = ricoDashboards.create(auth.session.user.id, {
      title: title || "Live Financial Dashboard",
      prompt: prompt || title,
    });

    return NextResponse.json({ dashboard }, { status: 201 });
  } catch (error) {
    const status =
      error instanceof RicoUIDashboardError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Failed to create dashboard";
    return NextResponse.json({ error: message }, { status });
  }
}
