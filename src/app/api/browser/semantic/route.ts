import { NextResponse } from "next/server";
import {
  browserTabPool,
  StaleElementRefError,
  type SemanticBrowserActionType,
} from "@/lib/browser";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tabId = searchParams.get("tabId") || undefined;
    const refresh = searchParams.get("refresh") === "1";

    const pool = browserTabPool.listTabs();
    const snapshot = refresh
      ? await browserTabPool.snapshot(tabId)
      : browserTabPool.getLastSnapshot(tabId);
    const diagnostics = browserTabPool.getDiagnostics(tabId);

    return NextResponse.json({
      success: true,
      pool,
      snapshot,
      diagnostics,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to inspect semantic browser state",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { op } = body;

    if (op === "tabs.list") {
      return NextResponse.json({
        success: true,
        ...browserTabPool.listTabs(),
      });
    }

    if (op === "tabs.open") {
      const tab = await browserTabPool.openTab({
        url: typeof body.url === "string" ? body.url : undefined,
        title: typeof body.title === "string" ? body.title : undefined,
        service: typeof body.service === "string" ? body.service : undefined,
        focus: body.focus !== false,
      });
      return NextResponse.json({
        success: true,
        tab,
        pool: browserTabPool.listTabs(),
      });
    }

    if (op === "tabs.focus" && typeof body.tabId === "string") {
      const tab = await browserTabPool.focusTab(body.tabId);
      if (!tab) {
        return NextResponse.json(
          { success: false, error: `Tab ${body.tabId} not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        tab,
        pool: browserTabPool.listTabs(),
      });
    }

    if (op === "tabs.close" && typeof body.tabId === "string") {
      const result = await browserTabPool.closeTab(body.tabId);
      return NextResponse.json({
        success: true,
        ...result,
        pool: browserTabPool.listTabs(),
      });
    }

    if (op === "snapshot") {
      const snapshot = await browserTabPool.snapshot(
        typeof body.tabId === "string" ? body.tabId : undefined
      );
      return NextResponse.json({
        success: true,
        snapshot,
        diagnostics: browserTabPool.getDiagnostics(snapshot.tabId),
      });
    }

    if (op === "act") {
      const result = await browserTabPool.act({
        tabId: typeof body.tabId === "string" ? body.tabId : undefined,
        action: body.action as SemanticBrowserActionType,
        ref: typeof body.ref === "string" ? body.ref : undefined,
        generation: typeof body.generation === "number" ? body.generation : undefined,
        value: typeof body.value === "string" ? body.value : undefined,
        checked: typeof body.checked === "boolean" ? body.checked : undefined,
        key: typeof body.key === "string" ? body.key : undefined,
        ms: typeof body.ms === "number" ? body.ms : undefined,
        text: typeof body.text === "string" ? body.text : undefined,
        selector: typeof body.selector === "string" ? body.selector : undefined,
      });
      return NextResponse.json({
        success: true,
        result,
        diagnostics: browserTabPool.getDiagnostics(result.tabId),
      });
    }

    if (
      op === "wall" &&
      (body.decision === "continue" ||
        body.decision === "skip" ||
        body.decision === "extend_90s")
    ) {
      const wall = await browserTabPool.resolveWall(
        body.decision,
        typeof body.tabId === "string" ? body.tabId : undefined
      );
      return NextResponse.json({
        success: true,
        wall,
      });
    }

    if (op === "ground_price" && typeof body.price === "number") {
      const match = await browserTabPool.verifyGroundedPrice(
        body.price,
        typeof body.currency === "string" ? body.currency : "USD",
        typeof body.billingPeriod === "string" ? body.billingPeriod : "monthly",
        typeof body.tabId === "string" ? body.tabId : undefined
      );
      return NextResponse.json({
        success: true,
        match,
      });
    }

    return NextResponse.json(
      { success: false, error: `Unknown semantic browser operation: ${String(op)}` },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof StaleElementRefError) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          error: error.message,
          expectedGeneration: error.expectedGeneration,
          receivedGeneration: error.receivedGeneration,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Semantic browser operation failed",
      },
      { status: 500 }
    );
  }
}
