import { NextResponse } from "next/server";
import { priceWorker } from "@/lib/browser";

export const dynamic = "force-dynamic";

function looksLikeUrl(input: string): boolean {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (trimmed.includes(" ")) return false;
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(trimmed);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, query, service } = body;

    if (query && typeof query === "string") {
      const searchResult = await priceWorker.searchAndBrowseLiveWeb(query);
      return NextResponse.json({
        success: true,
        mode: "search",
        searchResult,
      });
    }

    if (url && typeof url === "string" && !looksLikeUrl(url)) {
      const searchResult = await priceWorker.searchAndBrowseLiveWeb(url);
      return NextResponse.json({
        success: true,
        mode: "search",
        searchResult,
      });
    }

    const targetService = service || "Live Inspection";
    const normalizedUrl =
      url && typeof url === "string"
        ? /^https?:\/\//i.test(url.trim())
          ? url.trim()
          : `https://${url.trim()}`
        : undefined;

    const result = await priceWorker.scrapeMerchantPrice(
      targetService,
      normalizedUrl,
      { timeoutMs: 12000 }
    );

    return NextResponse.json({
      success: true,
      mode: "navigate",
      result,
    });
  } catch (error) {
    console.error("[API /api/browser/navigate] Navigation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Navigation failed",
      },
      { status: 500 }
    );
  }
}
