import { NextRequest, NextResponse } from "next/server";
import { ensureOwnerRecord, requireSession } from "@/lib/auth/require-session";
import { ricoDashboards, RicoUIDashboardError } from "@/lib/ricoui";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;

  try {
    await ensureOwnerRecord(auth.session);
    const dashboard = ricoDashboards.get(auth.session.user.id, context.params.id);
    return NextResponse.json({ dashboard });
  } catch (error) {
    const status =
      error instanceof RicoUIDashboardError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Failed to load dashboard";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;

  try {
    await ensureOwnerRecord(auth.session);
    const body = await request.json();

    if (typeof body.prompt === "string" && body.prompt.trim()) {
      const { dashboard, summary } = ricoDashboards.edit(auth.session.user.id, {
        id: context.params.id,
        prompt: body.prompt.trim(),
      });
      return NextResponse.json({ dashboard, summary });
    }

    const dashboard = ricoDashboards.updateMeta(
      auth.session.user.id,
      context.params.id,
      {
        title: typeof body.title === "string" ? body.title : undefined,
        pinned: typeof body.pinned === "boolean" ? body.pinned : undefined,
        refreshSeconds:
          body.refreshSeconds === null || typeof body.refreshSeconds === "number"
            ? body.refreshSeconds
            : undefined,
      }
    );

    return NextResponse.json({ dashboard });
  } catch (error) {
    const status =
      error instanceof RicoUIDashboardError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Failed to update dashboard";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;

  try {
    await ensureOwnerRecord(auth.session);
    ricoDashboards.remove(auth.session.user.id, context.params.id);
    return NextResponse.json({ deleted: true, id: context.params.id });
  } catch (error) {
    const status =
      error instanceof RicoUIDashboardError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Failed to delete dashboard";
    return NextResponse.json({ error: message }, { status });
  }
}
