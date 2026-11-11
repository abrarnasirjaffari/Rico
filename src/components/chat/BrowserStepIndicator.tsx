"use client";

import React, { useState } from "react";
import {
  Globe,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Terminal,
} from "lucide-react";
import { StatusPill, ExecutionStep } from "@/lib/chat/use-payagent-chat";

export interface BrowserStepIndicatorProps {
  statusPill?: StatusPill;
  steps?: ExecutionStep[];
  serviceName?: string;
}

export function BrowserStepIndicator({
  statusPill,
  steps = [],
  serviceName,
}: BrowserStepIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasBrowserSteps = steps.some((s) => {
    const text = (s.step + " " + (s.detail || "")).toLowerCase();
    return (
      text.includes("browser") ||
      text.includes("playwright") ||
      text.includes("scrap") ||
      text.includes("price") ||
      text.includes("merchant") ||
      text.includes("navigat")
    );
  });

  if (!statusPill && !hasBrowserSteps) {
    return null;
  }

  const isNavigating = steps.some(
    (s) =>
      (s.step.toLowerCase().includes("brows") ||
        s.step.toLowerCase().includes("navigat")) &&
      s.status === "running"
  );

  const isPriceExtracted = steps.some(
    (s) =>
      (s.step.toLowerCase().includes("price") ||
        s.step.toLowerCase().includes("scrap")) &&
      s.status === "done"
  );

  const isSafetyPassed = steps.some(
    (s) =>
      s.step.toLowerCase().includes("ceiling") ||
      s.step.toLowerCase().includes("safety") ||
      s.step.toLowerCase().includes("guardrail")
  );

  const isPaymentExecuting = steps.some(
    (s) =>
      s.step.toLowerCase().includes("paypal") ||
      s.step.toLowerCase().includes("payment")
  );

  const isCompleted = steps.some(
    (s) =>
      (s.step.toLowerCase().includes("paypal") ||
        s.step.toLowerCase().includes("payment")) &&
      s.status === "done"
  );

  const activeLabel =
    statusPill?.step ||
    (isCompleted
      ? "Payment captured via PayPal MCP"
      : isPaymentExecuting
      ? "Executing PayPal Sandbox payment..."
      : isSafetyPassed
      ? "Safety ceiling verified"
      : isPriceExtracted
      ? "Live price verified from merchant"
      : isNavigating
      ? `Inspecting ${serviceName || "merchant"} page...`
      : "Browser verification");

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`inline-flex items-center gap-2 h-7 px-3 rounded-full text-xs font-medium border transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 ${
          isCompleted
            ? "bg-emerald-50/80 border-emerald-200/80 text-emerald-800 hover:bg-emerald-50"
            : "bg-[#EDF3FA] border-[#DCE7F3] text-[#334155] hover:bg-[#E3ECF7]"
        }`}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        ) : (
          <Globe className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
        )}

        <span className="truncate max-w-[280px] sm:max-w-md">{activeLabel}</span>

        {isExpanded ? (
          <ChevronDown className="w-3 h-3 text-[#7B8BA1]" />
        ) : (
          <ChevronRight className="w-3 h-3 text-[#7B8BA1]" />
        )}
      </button>

      {isExpanded && (
        <div className="rounded-xl border border-[#E2ECF6] bg-[#F8FAFC] p-3 text-xs space-y-1.5 font-mono text-[#334155]">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#E2ECF6] text-[11px] text-[#7B8BA1] font-sans">
            <span className="flex items-center gap-1.5 font-medium text-[#52637A]">
              <Terminal className="w-3.5 h-3.5" />
              <span>Playwright CDP Verification Trace</span>
            </span>
            <span className="font-mono text-[10px]">Headless Chromium</span>
          </div>
          <div className="text-[11px] space-y-1 leading-relaxed">
            <div>[target] {serviceName || "Merchant pricing page"}</div>
            <div>
              [selector] [data-testid=&quot;plan-price&quot;], .pricing-card-amount
            </div>
            <div className="text-emerald-700">
              [status] {isCompleted ? "Verified & captured" : "DOM price extracted"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
