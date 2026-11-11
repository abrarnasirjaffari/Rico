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

interface ChatMessageRendererProps {
  message: ChatMessage;
  onViewReceipt: (receipt: ReceiptData) => void;
  isExpandedDefault?: boolean;
}

export function formatCleanText(text: string): string {
  if (!text) return "";
  return text
    .replace(/^(\s*)\*+(\s*)/gm, "$1- $2")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^(\s*)\*+\s*/gm, "$1")
    .replace(/\s*\*+\s*$/gm, "")
    .replace(/^\*+/, "")
    .replace(/\*+$/, "");
}

export function ChatMessageRenderer({
  message,
  onViewReceipt,
  isExpandedDefault = false,
}: ChatMessageRendererProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(isExpandedDefault);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const cleanBody = formatCleanText(message.text);

  const handleCopyText = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(cleanBody);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 1800);
    }
  };

  if (message.sender === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[72%] rounded-2xl bg-[#EBF2FB] border border-[#DCE7F5] text-[#0F172A] px-4 py-2.5 text-[14px] leading-relaxed">
          <p className="whitespace-pre-wrap m-0">{cleanBody}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3.5 group">
      <div className="w-7 h-7 rounded-lg bg-[#EDF3FA] border border-[#DCE7F3] flex items-center justify-center shrink-0 mt-0.5">
        <div className="w-4 h-4 bg-[url('/brand-rico-mark-transparent.png')] bg-no-repeat bg-contain bg-center" />
      </div>

      <div className="flex-1 min-w-0 space-y-3 text-[14px] leading-[1.65] text-[#0F172A]">
        {/* Claude-style quiet collapsible "Thought / Verified" accordion */}
        {message.thoughtProcess && message.thoughtProcess.steps.length > 0 && (
          <div className="rounded-xl border border-[#E2ECF6] bg-white overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="w-full px-3.5 py-2 flex items-center justify-between text-[#52637A] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors duration-150 ease-out"
            >
              <span className="font-medium">{message.thoughtProcess.summary}</span>
              <span className="flex items-center gap-1 text-[11px] text-[#7B8BA1]">
                <span>{message.thoughtProcess.steps.length} steps</span>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
            </button>

            {isExpanded && (
              <div className="px-3.5 py-2.5 space-y-2 border-t border-[#EDF3FA] text-[12px] bg-[#FAFBFD]">
                {message.thoughtProcess.steps.map((st, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    {st.status === "running" ? (
                      <Loader2 className="w-3.5 h-3.5 text-[#2563EB] animate-spin mt-0.5 shrink-0" />
                    ) : st.status === "done" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-[#CBD5E1] mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[#0F172A] font-medium">{st.step}</span>
                      {st.detail && (
                        <span className="text-[#7B8BA1] block font-mono text-[11px] mt-0.5 tabular-nums">
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
          serviceName={message.receipt?.service}
        />

        {message.text && (
          <div className="text-[#0F172A] whitespace-pre-wrap">{cleanBody}</div>
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

        <div className="flex items-center gap-2 text-[11px] text-[#7B8BA1] opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
          <span className="tabular-nums">{message.timestamp}</span>
          {message.text && (
            <>
              <span>·</span>
              <button
                type="button"
                onClick={handleCopyText}
                className="hover:text-[#0F172A] transition-colors duration-150 inline-flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
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
