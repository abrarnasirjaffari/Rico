"use client";

import React, { useState } from "react";
import {
  Globe,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  Terminal,
  Loader2,
} from "lucide-react";
import {
  StatusPill,
  ExecutionStep,
  BrowserActionItem,
} from "@/lib/chat/use-payagent-chat";

export interface BrowserStepIndicatorProps {
  statusPill?: StatusPill;
  steps?: ExecutionStep[];
  browserActions?: BrowserActionItem[];
  serviceName?: string;
  onOpenInBrowser?: (url?: string) => void;
}

function formatShortUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  try {
    const u = new URL(rawUrl);
    if (u.hostname.includes("duckduckgo.com") && u.searchParams.get("q")) {
      return `duckduckgo.com/?q=${u.searchParams.get("q")}`;
    }
    const path = u.pathname === "/" ? "" : u.pathname;
    return `${u.hostname.replace(/^www\./, "")}${path}`.slice(0, 56);
  } catch {
    return rawUrl.slice(0, 56);
  }
}

export function BrowserStepIndicator({
  statusPill,
  steps = [],
  browserActions = [],
  serviceName,
  onOpenInBrowser,
}: BrowserStepIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasBrowserSteps = steps.some((s) => {
    const text = (s.step + " " + (s.detail || "")).toLowerCase();
    return (
      text.includes("browser") ||
      text.includes("playwright") ||
      text.includes("scrap") ||
      text.includes("search") ||
      text.includes("price") ||
      text.includes("merchant") ||
      text.includes("navigat") ||
      text.includes("opening")
    );
  });

  if (!statusPill && !hasBrowserSteps && browserActions.length === 0) {
    return null;
  }

  // If we have structured OpenCode-style browser tool rows, render them cleanly
  if (browserActions.length > 0) {
    return (
      <div className="space-y-1.5">
        {browserActions.map((act, idx) => {
          const isRunning = act.status === "running";
          const isSearch = act.action === "search";
          const title = isSearch
            ? "Web Search"
            : act.action === "scroll"
            ? "Read Page"
            : act.action === "complete"
            ? "Browser Verified"
            : "Navigate Page";
          const subtitle = formatShortUrl(act.url) || act.title || act.detail || "";

          return (
            <div
              key={`${act.action}-${act.url}-${idx}`}
              className="group/tool flex items-center justify-between gap-2.5 min-h-[34px] px-3 py-1.5 rounded-lg border border-[#E6E4E3] bg-[#F8F7F7] hover:bg-[#F1EFEF] transition-colors duration-100 ease-out text-[13px]"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#034CFF] animate-spin shrink-0" />
                ) : isSearch ? (
                  <Search className="w-3.5 h-3.5 text-[#5C5858] shrink-0" />
                ) : act.action === "complete" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-[#5C5858] shrink-0" />
                )}

                <span
                  className={`font-medium shrink-0 ${
                    isRunning ? "oc-text-shimmer" : "text-[#1E1B1B]"
                  }`}
                >
                  {title}
                </span>

                {subtitle && (
                  <button
                    type="button"
                    onClick={() => onOpenInBrowser?.(act.url)}
                    title={act.url || subtitle}
                    className="font-mono text-[12px] text-[#5C5858] hover:text-[#034CFF] hover:underline truncate text-left transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 rounded px-0.5"
                  >
                    {subtitle}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => onOpenInBrowser?.(act.url)}
                aria-label="Focus browser pane"
                title="Show in right split browser"
                className="h-6 px-2 rounded-md text-[11px] font-medium text-[#5C5858] hover:text-[#1E1B1B] hover:bg-white inline-flex items-center gap-1 shrink-0 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
              >
                <span className="hidden sm:inline">Browser</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  const isRunning =
    statusPill?.state === "loading" ||
    steps.some((s) => s.status === "running");

  const activeLabel =
    statusPill?.step ||
    (isRunning
      ? `Inspecting ${serviceName || "live page"}...`
      : `Verified ${serviceName || "live page"}`);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 min-h-[34px] px-3 py-1.5 rounded-lg border border-[#E6E4E3] bg-[#F8F7F7] text-[13px]">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-2 min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 rounded"
        >
          {isRunning ? (
            <Loader2 className="w-3.5 h-3.5 text-[#034CFF] animate-spin shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          )}
          <span
            className={`truncate font-medium ${
              isRunning ? "oc-text-shimmer" : "text-[#1E1B1B]"
            }`}
          >
            {activeLabel}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#8A8585] shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#8A8585] shrink-0" />
          )}
        </button>

        {onOpenInBrowser && (
          <button
            type="button"
            onClick={() => onOpenInBrowser()}
            className="h-6 px-2 rounded-md text-[11px] font-medium text-[#5C5858] hover:text-[#1E1B1B] hover:bg-white inline-flex items-center gap-1 shrink-0 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
          >
            <span>Browser</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="rounded-lg border border-[#E6E4E3] bg-white p-3 text-xs space-y-1.5 font-mono text-[#5C5858]">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#E6E4E3] text-[11px] text-[#8A8585] font-sans">
            <span className="flex items-center gap-1.5 font-medium text-[#1E1B1B]">
              <Terminal className="w-3.5 h-3.5" />
              <span>Playwright CDP Trace</span>
            </span>
            <span className="font-mono text-[10px]">Headless Chromium</span>
          </div>
          <div className="text-[11px] space-y-1 leading-relaxed">
            <div>[target] {serviceName || "Live web target"}</div>
            <div className="text-emerald-700">
              [status] {isRunning ? "Streaming CDP frames..." : "DOM verified"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
