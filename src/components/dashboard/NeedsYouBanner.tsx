"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Check,
  CreditCard,
  X,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
  const [showDetails, setShowDetails] = useState(false);

  const baseline = request.baselinePrice || request.budgetCeiling * 0.8;
  const spike =
    request.spikePercentage ||
    Math.round(((request.detectedPrice - baseline) / baseline) * 100);

  return (
    <div
      className={`w-full bg-amber-50 border-b border-amber-300 text-[#0F172A] shadow-md select-none transition-all duration-300 animate-in slide-in-from-top-4 z-40 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Main Banner Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Left: Attention Icon & Anomaly Reason */}
          <div className="flex items-start gap-3">
            <div className="relative mt-0.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-amber-200/60 border border-amber-400 flex items-center justify-center text-amber-800 shadow-2xs">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 animate-ping" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 font-mono shadow-2xs">
                  NEEDS YOU • HUMAN DECISION GATE
                </span>
                <span className="text-xs font-mono text-amber-900 font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  Price Spike Guardrail Halted Execution
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-[#0F172A]">
                <span className="font-bold text-[#0F172A] text-base">
                  {request.service}
                </span>
                <span className="text-neutral-400">•</span>
                <span className="font-mono text-red-600 font-bold text-base">
                  ${request.detectedPrice.toFixed(2)} {request.currency}
                </span>
                {spike > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 border border-red-300 text-red-800 text-[11px] font-mono font-bold">
                    <TrendingUp className="w-3 h-3 text-red-600" />
                    +{spike}% Spike
                  </span>
                )}
                <span className="text-xs text-[#52637A] font-mono hidden sm:inline">
                  (Baseline: ${baseline.toFixed(2)})
                </span>
              </div>
            </div>
          </div>

          {/* Right: 3 1-Click Action Decision Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end flex-wrap">
            <button
              type="button"
              onClick={onApprovePayPal}
              className="h-8 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve (PayPal)</span>
            </button>

            <button
              type="button"
              onClick={onApproveBackupCard}
              className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pay with Visa (•••• 4242)</span>
            </button>

            <button
              type="button"
              onClick={onReject}
              className="h-8 px-2.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-neutral-300" />
              <span>Decline</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="p-1 rounded text-[#52637A] hover:text-[#0F172A] transition-colors ml-1"
            >
              {showDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Explanation Drawer */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-amber-200/80 text-xs space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="p-2.5 rounded-lg bg-white border border-amber-200">
                <span className="text-[#64748B] block text-[10px]">REASON FOR HOLD</span>
                <span className="font-semibold text-red-600">
                  {request.reason}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-amber-200">
                <span className="text-[#64748B] block text-[10px]">AUTHORIZED CEILING</span>
                <span className="font-semibold text-emerald-700">
                  ${request.budgetCeiling.toFixed(2)} {request.currency}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-amber-200">
                <span className="text-[#64748B] block text-[10px]">PAYMENT GATE PROTECTION</span>
                <span className="font-semibold text-blue-700">
                  Zero tokens charged without signature
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
