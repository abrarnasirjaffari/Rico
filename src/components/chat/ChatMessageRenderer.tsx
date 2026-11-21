"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { ChatMessage } from "@/lib/chat/use-payagent-chat";
import { ReceiptData } from "@/components/dashboard/ReceiptDialog";
import { BrowserStepIndicator } from "./BrowserStepIndicator";
import { GenerativeReceiptCard } from "./GenerativeReceiptCard";
import { SavingsAdvisoryCard } from "@/components/dashboard/SavingsAdvisoryCard";
import { RicoUIRenderer } from "@/components/ricoui/RicoUIRenderer";
import {
  extractReadableSummaryFromRicoUI,
  stripStarsPreservingRicoUI,
} from "@/lib/ricoui/parser";
import type { RicoUIActionEvent } from "@/lib/ricoui/types";
import type { SplitSurfaceTool } from "@/lib/rico-workspace/types";

interface ChatMessageRendererProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onViewReceipt: (receipt: ReceiptData) => void;
  onOpenInBrowser?: (url?: string) => void;
  onOpenWorkspaceTool?: (tool: SplitSurfaceTool) => void;
  onOpenDashboard?: (dashboardId?: string) => void;
  onSendPrompt?: (prompt: string) => void;
  onStageMandate?: (service: string, price: number, planName: string) => void;
  onStageExactMandate?: (data: {
    service: string;
    budgetCeiling: string;
    recurrence?: string;
    category?: string;
  }) => void;
  onTriggerMandate?: (mandateId: string) => void;
  isExpandedDefault?: boolean;
}

export function formatCleanText(text: string): string {
  return stripStarsPreservingRicoUI(text);
}

export function ChatMessageRenderer({
  message,
  isStreaming = false,
  onViewReceipt,
  onOpenInBrowser,
  onOpenWorkspaceTool,
  onOpenDashboard,
  onSendPrompt,
  onStageMandate,
  onStageExactMandate,
  onTriggerMandate,
  isExpandedDefault = false,
}: ChatMessageRendererProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(isExpandedDefault);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const cleanBody = formatCleanText(message.text);
  const copyableSummary = extractReadableSummaryFromRicoUI(message.text);

  const handleCopyText = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(copyableSummary);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 1800);
    }
  };

  if (message.sender === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[88%] sm:max-w-[78%] rounded-[10px] bg-[#F1EFEF] border border-[#E6E4E3] text-[#1E1B1B] px-3.5 py-2.5 text-[14px] leading-[1.6]">
          <p className="whitespace-pre-wrap m-0">{cleanBody}</p>
        </div>
      </div>
    );
  }

  const hasRunningSteps = message.thoughtProcess?.steps.some(
    (s) => s.status === "running"
  );

  return (
    <div className="flex items-start gap-3 group">
      <div className="w-6 h-6 rounded-md bg-[var(--rico-bg-base)] border border-[var(--rico-border-weak)] flex items-center justify-center shrink-0 mt-1">
        <div className="w-4 h-4 bg-[url('/brand-rico-mark-transparent.png')] bg-no-repeat bg-contain bg-center" />
      </div>

      <div className="flex-1 min-w-0 space-y-2.5 text-[14px] leading-[1.65] text-[#1E1B1B]">
        {/* RICO Reasoning Accordion */}
        {message.thoughtProcess && message.thoughtProcess.steps.length > 0 && (
          <div className="rounded-lg border border-[#E6E4E3] bg-white overflow-hidden text-[13px]">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="w-full px-3 py-1.5 flex items-center justify-between text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F8F7F7] transition-colors duration-100 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
            >
              <span
                className={`font-medium ${
                  hasRunningSteps ? "rico-text-shimmer" : "text-[#5C5858]"
                }`}
              >
                {message.thoughtProcess.summary}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#8A8585] font-mono tabular-nums">
                <span>
                  {message.thoughtProcess.steps.length}{" "}
                  {message.thoughtProcess.steps.length === 1 ? "step" : "steps"}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
            </button>

            {isExpanded && (
              <div className="px-3 py-2.5 space-y-2 border-t border-[#E6E4E3] text-[12px] bg-[#FCFCFC]">
                {message.thoughtProcess.steps.map((st, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {st.status === "running" ? (
                      <Loader2 className="w-3.5 h-3.5 text-[#034CFF] animate-spin mt-0.5 shrink-0" />
                    ) : st.status === "done" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-[#D6D3D1] mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[#1E1B1B] font-medium">{st.step}</span>
                      {st.detail && (
                        <span className="text-[#5C5858] block font-mono text-[11px] mt-0.5 tabular-nums break-all">
                          {st.detail}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <BrowserStepIndicator
          statusPill={message.statusPill}
          steps={message.thoughtProcess?.steps}
          browserActions={message.browserActions}
          serviceName={message.receipt?.service}
          onOpenInBrowser={onOpenInBrowser}
          onOpenWorkspaceTool={onOpenWorkspaceTool}
        />

        {message.text && (
          <RicoUIRenderer
            response={message.text}
            isStreaming={isStreaming}
            onAction={(event: RicoUIActionEvent) => {
              if (event.type === "continue_conversation" || event.type === "create_mandate_direct") {
                onSendPrompt?.(event.humanFriendlyMessage);
              } else if (event.type === "open_workspace") {
                const tool = String(event.params?.tool || "doc") as SplitSurfaceTool;
                const url = event.params?.url ? String(event.params.url) : undefined;
                if (tool === "browser" && url) {
                  onOpenInBrowser?.(url);
                } else {
                  onOpenWorkspaceTool?.(tool);
                }
              } else if (event.type === "open_dashboard") {
                const dashId = event.params?.dashboardId
                  ? String(event.params.dashboardId)
                  : undefined;
                if (onOpenDashboard) {
                  onOpenDashboard(dashId);
                } else {
                  onOpenWorkspaceTool?.("dashboard");
                }
              } else if (event.type === "open_url") {
                const url = String(event.params?.url ?? "");
                if (url) onOpenInBrowser?.(url);
              } else if (event.type === "stage_mandate") {
                const svc = String(event.params?.service ?? "Subscription");
                const cap = Number(event.params?.ceiling ?? 20);
                const rec = event.params?.recurrence
                  ? String(event.params.recurrence)
                  : "Monthly on 1st";
                const cat = event.params?.category
                  ? String(event.params.category)
                  : "Software & Cloud";
                if (onStageExactMandate) {
                  onStageExactMandate({
                    service: svc,
                    budgetCeiling: cap.toFixed(2),
                    recurrence: rec,
                    category: cat,
                  });
                } else {
                  onStageMandate?.(svc, cap / 1.15, "Custom Cap");
                }
              } else if (event.type === "trigger_mandate_quote") {
                const mid = String(event.params?.mandateId ?? "");
                if (mid) onTriggerMandate?.(mid);
              }
            }}
          />
        )}

        {message.receipt && (
          <GenerativeReceiptCard
            receipt={message.receipt}
            onViewReceipt={onViewReceipt}
          />
        )}

        {message.savingsAdvisory && (
          <SavingsAdvisoryCard advisory={message.savingsAdvisory} />
        )}

        <div className="flex items-center gap-2 text-[11px] text-[#8A8585] opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-100">
          <span className="font-mono tabular-nums">{message.timestamp}</span>
          {message.text && (
            <>
              <span>·</span>
              <button
                type="button"
                onClick={handleCopyText}
                className="hover:text-[#1E1B1B] transition-colors duration-100 inline-flex items-center gap-1 rounded px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
