"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
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
import type { A2UIMessageSurfaceProps } from "@/components/a2ui/A2UIMessageSurface";
import type { SplitSurfaceTool } from "@/lib/rico-workspace/types";

const A2UIMessageSurface = dynamic<A2UIMessageSurfaceProps>(
  () =>
    import("@/components/a2ui/A2UIMessageSurface").then(
      (mod) => mod.A2UIMessageSurface
    ),
  { ssr: false }
);

interface ChatMessageRendererProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onViewReceipt: (receipt: ReceiptData) => void;
  onOpenInBrowser?: (url?: string) => void;
  onOpenWorkspaceTool?: (tool: SplitSurfaceTool) => void;
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
  return text
    .replace(/<a2ui>[\s\S]*?<\/a2ui>/g, "")
    .replace(/^\s*\*\s+/gm, "- ")
    .replace(/\*\*/g, "")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .trim();
}

export function ChatMessageRenderer({
  message,
  isStreaming = false,
  onViewReceipt,
  onOpenInBrowser,
  onOpenWorkspaceTool,
  onSendPrompt,
  isExpandedDefault = false,
}: ChatMessageRendererProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(isExpandedDefault);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const cleanBody = formatCleanText(message.text);

  const handleA2uiAction = (action: {
    name: string;
    userMessage?: string;
    context?: Record<string, unknown>;
  }) => {
    if (!onSendPrompt) return;
    if (typeof action.userMessage === "string" && action.userMessage.trim()) {
      onSendPrompt(action.userMessage.trim());
      return;
    }
    const ctxEntries = Object.entries(action.context ?? {}).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    );
    const rawLabel = action.name.replace(/[_-]+/g, " ").trim();
    const label = rawLabel
      ? rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)
      : "Continue";
    if (ctxEntries.length > 0) {
      const summary = ctxEntries
        .map(([k, v]) => {
          const prettyKey = k.replace(/[_-]+/g, " ");
          const prettyVal = Array.isArray(v)
            ? v.join(", ")
            : typeof v === "object"
            ? JSON.stringify(v)
            : String(v);
          return `${prettyKey}: ${prettyVal}`;
        })
        .join(", ");
      onSendPrompt(`${label} — ${summary}`);
    } else {
      onSendPrompt(label);
    }
  };

  const handleCopyText = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard && cleanBody) {
      navigator.clipboard.writeText(cleanBody);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 1800);
    }
  };

  if (message.sender === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[88%] sm:max-w-[76%] rounded-[18px] bg-[var(--rico-iui-surface)] border border-[var(--rico-iui-border)] text-[var(--rico-iui-ink)] px-4 py-2.5 text-[14.5px] leading-[1.55]">
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
      <div className="w-6 h-6 rounded-[7px] bg-[var(--rico-iui-surface)] border border-[var(--rico-iui-border)] flex items-center justify-center shrink-0 mt-1">
        <div className="w-4 h-4 bg-[url('/brand-rico-mark-transparent.png')] bg-no-repeat bg-contain bg-center" />
      </div>

      <div className="flex-1 min-w-0 space-y-2.5 text-[14.5px] leading-[1.6] text-[var(--rico-iui-ink)]">
        {/* Collapsible Behind-the-Scenes Tool & Skill Timeline */}
        {message.thoughtProcess && message.thoughtProcess.steps.length > 0 && (
          <div className="rounded-[10px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] overflow-hidden text-[12.5px]">
            <button
              type="button"
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded((prev) => !prev)}
              className="w-full px-3 py-1.5 flex items-center justify-between text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)] hover:bg-[var(--rico-iui-hover)] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40"
            >
              <span
                className={`font-medium ${
                  hasRunningSteps ? "rico-text-shimmer" : "text-[var(--rico-iui-muted)]"
                }`}
              >
                {message.thoughtProcess.summary}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[var(--rico-iui-faint)] font-mono tabular-nums">
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
              <div className="px-3 py-2.5 space-y-2 border-t border-[var(--rico-iui-border)] text-[12px] bg-[var(--rico-iui-surface)]">
                {message.thoughtProcess.steps.map((st, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {st.status === "running" ? (
                      <Loader2 className="w-3.5 h-3.5 text-[#0285ff] animate-spin mt-0.5 shrink-0" />
                    ) : st.status === "done" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00a67d] mt-0.5 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-[var(--rico-iui-border-strong)] mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[var(--rico-iui-ink)] font-medium">
                        {st.step}
                      </span>
                      {st.detail && (
                        <span className="text-[var(--rico-iui-muted)] block font-mono text-[11px] mt-0.5 tabular-nums break-all">
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

        {message.parts && message.parts.length > 0 ? (
          message.parts.map((part, idx) => {
            if (part.type === "text") {
              const cleaned = formatCleanText(part.text);
              if (!cleaned) return null;
              return (
                <div
                  key={`part-text-${idx}`}
                  className="text-[var(--rico-iui-ink)] text-[14.5px] leading-[1.65] whitespace-pre-wrap"
                >
                  {cleaned}
                </div>
              );
            }
            if (part.type === "a2ui" && part.messages.length > 0) {
              return (
                <A2UIMessageSurface
                  key={`part-a2ui-${idx}`}
                  messages={part.messages}
                  disabled={isStreaming}
                  onAction={handleA2uiAction}
                />
              );
            }
            return null;
          })
        ) : (
          <>
            {cleanBody && (
              <div className="text-[var(--rico-iui-ink)] text-[14.5px] leading-[1.65] whitespace-pre-wrap">
                {cleanBody}
              </div>
            )}

            {message.a2uiMessages && message.a2uiMessages.length > 0 && (
              <A2UIMessageSurface
                messages={message.a2uiMessages}
                disabled={isStreaming}
                onAction={handleA2uiAction}
              />
            )}
          </>
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

        <div className="flex items-center gap-2 text-[11px] text-[var(--rico-iui-faint)] opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-100">
          <span className="font-mono tabular-nums">{message.timestamp}</span>
          {cleanBody && (
            <>
              <span>·</span>
              <button
                type="button"
                onClick={handleCopyText}
                className="hover:text-[var(--rico-iui-ink)] transition-colors duration-100 inline-flex items-center gap-1 rounded px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3 h-3 text-[#00a67d]" />
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
