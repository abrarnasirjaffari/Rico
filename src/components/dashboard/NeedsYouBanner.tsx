"use client";

import React from "react";
import { AlertTriangle, Check, CreditCard, X } from "lucide-react";
import { ApprovalRequest } from "./ApprovalDialog";

interface NeedsYouBannerProps {
  request: ApprovalRequest;
  onApprovePayPal: () => void;
  onApproveBackupCard: () => void;
  onReject: () => void;
  className?: string;
}

export function NeedsYouBanner({
  request,
  onApprovePayPal,
  onApproveBackupCard,
  onReject,
  className = "",
}: NeedsYouBannerProps) {
  const baseline = request.baselinePrice || request.budgetCeiling * 0.8;
  const spike =
    request.spikePercentage ||
    Math.round(((request.detectedPrice - baseline) / baseline) * 100);

  return (
    <div
      className={`w-full bg-amber-50/90 border-b border-amber-200 text-[#0F172A] px-4 py-2.5 z-40 ${className}`}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <div className="min-w-0">
            <span className="font-semibold text-[#0F172A]">{request.service}</span>
            <span className="mx-1.5 text-[#7B8BA1]">·</span>
            <span className="font-mono font-semibold text-amber-900 tabular-nums">
              ${request.detectedPrice.toFixed(2)} {request.currency}
            </span>
            {spike > 0 && (
              <span className="ml-2 text-[11px] text-amber-800 font-mono tabular-nums">
                (+{spike}% over baseline)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onApprovePayPal}
            className="h-8 px-3 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium flex items-center gap-1.5 transition-colors duration-150"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Approve</span>
          </button>

          <button
            type="button"
            onClick={onApproveBackupCard}
            className="h-8 px-3 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 text-[#0F172A] text-xs font-medium flex items-center gap-1.5 transition-colors duration-150"
          >
            <CreditCard className="w-3.5 h-3.5 text-[#52637A]" />
            <span>Visa •••• 4242</span>
          </button>

          <button
            type="button"
            onClick={onReject}
            className="h-8 px-2.5 rounded-lg text-[#52637A] hover:text-[#0F172A] text-xs font-medium flex items-center gap-1 transition-colors duration-150"
          >
            <X className="w-3.5 h-3.5" />
            <span>Decline</span>
          </button>
        </div>
      </div>
    </div>
  );
}
