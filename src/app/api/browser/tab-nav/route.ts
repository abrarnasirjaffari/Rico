import { NextResponse } from "next/server";
import { browserTabPool } from "@/lib/browser";

export const dynamic = "force-dynamic";

function resolveSafeTargetUrl(rawInput: string): string | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  const looksLikeDomainOrUrl =
    /^https?:\/\//i.test(trimmed) ||
    (!trimmed.includes(" ") &&
      /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(trimmed));

  if (!looksLikeDomainOrUrl) {
    return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
  }

  try {
    const parsed = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    );
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      mode?: string;
      url?: string;
      tabId?: string;
    };
    const tabId = typeof body.tabId === "string" ? body.tabId : undefined;

    if (body.mode === "reload") {
      const tab = await browserTabPool.reloadTab(tabId);
      return NextResponse.json({
        success: true,
        tab,
        pool: browserTabPool.listTabs(),
      });
    }

    if (typeof body.url === "string") {
      const targetUrl = resolveSafeTargetUrl(body.url);
      if (!targetUrl) {
        return NextResponse.json(
          { success: false, error: "Invalid URL protocol or format" },
          { status: 400 }
        );
      }

      const tab = await browserTabPool.navigateTab(tabId, targetUrl, 15000);
      return NextResponse.json({
        success: true,
        tab,
        pool: browserTabPool.listTabs(),
      });
    }

    return NextResponse.json(
      { success: false, error: "Expected 'url' or 'mode: reload'" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Tab navigation failed",
      },
      { status: 500 }
    );
  }
}
