"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ExternalLink,
  CheckCircle2,
  CreditCard,
  Gift,
  RefreshCw,
} from "lucide-react";
import type { SavingsAdvisoryData } from "@/lib/savings/types";

interface SavingsAdvisoryCardProps {
  advisory: SavingsAdvisoryData;
  onApplyPayment?: (advisory: SavingsAdvisoryData) => void;
  onDismiss?: () => void;
}

export function SavingsAdvisoryCard({
  advisory,
  onApplyPayment,
  onDismiss,
}: SavingsAdvisoryCardProps) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = async () => {
    setApplying(true);
    try {
      if (onApplyPayment) {
        await onApplyPayment(advisory);
      } else {
        const res = await fetch("/api/savings/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceName: advisory.service,
            originalPrice: advisory.originalPrice,
            discountedPrice: advisory.discountedPrice,
            budgetCeiling: advisory.originalPrice,
          }),
        });
        if (res.ok) {
          setApplied(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApplying(false);
    }
  };

  const isCreditClaim = advisory.reclaimedCredits > 500;
  const personaLabel =
    advisory.persona === "STARTUP_FOUNDER"
      ? "Startup"
      : advisory.persona === "STUDENT"
      ? "Student"
      : "Developer";

  return (
    <div className="rounded-xl border border-[#DCE7F3] bg-white p-4 space-y-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] max-w-lg w-full">
      <div className="flex items-center justify-between border-b border-[#EDF3FA] pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
          <span className="text-xs font-semibold text-[#0F172A]">
            Pre-Payment Savings Found
          </span>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#EDF3FA] text-[#334155] font-medium">
          {personaLabel}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-medium tabular-nums">
            <Gift className="w-3 h-3" />
            {isCreditClaim
              ? `+$${advisory.reclaimedCredits.toLocaleString()} credits eligible`
              : `Save $${advisory.savingsEnforced.toFixed(2)}/mo`}
          </span>
          {advisory.couponCode && (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F8FAFC] border border-[#DCE7F3] text-[#334155] font-mono">
              {advisory.couponCode}
            </span>
          )}
        </div>

        <h4 className="text-sm font-semibold text-[#0F172A] leading-snug pt-0.5">
          {advisory.appliedDealHeadline}
        </h4>

        <p className="text-xs text-[#52637A] leading-relaxed">
          {isCreditClaim ? (
            <>
              Before charging <strong className="text-[#0F172A] font-medium">{advisory.service}</strong>, Rico matched an official program offering up to{" "}
              <strong className="text-emerald-700 font-semibold font-mono tabular-nums">
                ${advisory.reclaimedCredits.toLocaleString()}
              </strong>{" "}
              in credits.
            </>
          ) : (
            <>
              Verified eligible rate for <strong className="text-[#0F172A] font-medium">{advisory.service}</strong>: drops from{" "}
              <span className="line-through text-[#7B8BA1] font-mono tabular-nums">
                ${advisory.originalPrice.toFixed(2)}
              </span>{" "}
              to{" "}
              <strong className="text-emerald-700 font-semibold font-mono tabular-nums">
                ${advisory.discountedPrice.toFixed(2)}/mo
              </strong>
              .
            </>
          )}
        </p>
      </div>

      <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6EEF8] flex items-center justify-between text-xs">
        <div>
          <span className="text-[11px] text-[#7B8BA1] block">Standard</span>
          <span className="font-mono tabular-nums text-[#7B8BA1] line-through">
            ${advisory.originalPrice.toFixed(2)}
          </span>
        </div>

        <div className="text-center">
          <span className="text-[11px] text-[#52637A] block">Savings</span>
          <span className="font-semibold text-emerald-700 font-mono tabular-nums">
            {isCreditClaim
              ? `+$${advisory.reclaimedCredits.toLocaleString()}`
              : `-$${advisory.savingsEnforced.toFixed(2)}`}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-[#52637A] block">New Total</span>
          <span className="font-semibold text-[#0F172A] text-sm font-mono tabular-nums">
            ${advisory.discountedPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {applied ? (
        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="tabular-nums">
            Discount applied — captured ${advisory.discountedPrice.toFixed(2)}.
          </span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-0.5">
          {advisory.discountedPrice > 0 && (
            <button
              type="button"
              disabled={applying}
              aria-busy={applying}
              onClick={handleApply}
              className="w-full sm:flex-1 h-9 px-3.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] active:translate-y-px text-white font-medium text-xs transition-colors duration-150 ease-out flex items-center justify-center gap-1.5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            >
              {applying ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CreditCard className="w-3.5 h-3.5" />
              )}
              <span className="tabular-nums">Apply &amp; Pay (${advisory.discountedPrice.toFixed(2)})</span>
            </button>
          )}

          {advisory.claimUrl && (
            <a
              href={advisory.claimUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 h-9 px-3.5 rounded-lg bg-white hover:bg-[#F5F8FC] text-[#0F172A] font-medium text-xs transition-colors duration-150 ease-out flex items-center justify-center gap-1.5 border border-[#DCE7F3] text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#52637A]" />
              <span>{isCreditClaim ? "Open Claim Portal" : "Verify Eligibility"}</span>
            </a>
          )}

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="h-9 px-2.5 text-xs text-[#52637A] hover:text-[#0F172A] transition-colors duration-150"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
}
