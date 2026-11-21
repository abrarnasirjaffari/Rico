"use client";

import React, { useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";
import type { SavingsAdvisoryData } from "@/lib/savings/types";
import { formatFiat } from "@/lib/format-number";

interface SavingsAdvisoryCardProps {
  advisory: SavingsAdvisoryData;
  onApplyPayment?: (advisory: SavingsAdvisoryData) => Promise<void> | void;
  onDismiss?: () => void;
}

export function SavingsAdvisoryCard({
  advisory,
  onApplyPayment,
  onDismiss,
}: SavingsAdvisoryCardProps) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    if (!advisory.couponCode || typeof navigator === "undefined") return;
    navigator.clipboard?.writeText(advisory.couponCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  const handleApply = async () => {
    setApplying(true);
    setErrorMsg(null);
    try {
      if (onApplyPayment) {
        await onApplyPayment(advisory);
        setApplied(true);
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
        } else {
          setErrorMsg("Could not apply rate. Retry or open vendor portal.");
        }
      }
    } catch {
      setErrorMsg("Network error while applying rate. Please retry.");
    } finally {
      setApplying(false);
    }
  };

  const isCreditClaim = advisory.reclaimedCredits > 500;
  const personaLabel =
    advisory.persona === "STARTUP_FOUNDER"
      ? "Startup"
      : advisory.persona === "STUDENT"
      ? "Academic"
      : "Team / SMB";

  return (
    <div className="rounded-xl border border-[var(--rico-border-weak)] bg-[var(--rico-surface-elevated)] p-4 sm:p-5 space-y-4 max-w-xl w-full">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--rico-surface-base)] pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] font-semibold text-[var(--rico-text-strong)]">
              {advisory.service}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[var(--rico-surface-base)] text-[11.5px] font-medium text-[var(--rico-text-base)]">
              {personaLabel}
            </span>
          </div>
          <p className="m-0 mt-0.5 text-[13px] text-[var(--rico-text-base)]">
            {advisory.appliedDealHeadline}
          </p>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss rate check"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)] hover:bg-[var(--rico-bg-base)] shrink-0 transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 divide-x divide-[var(--rico-border-weak)] rounded-lg border border-[var(--rico-border-weak)] bg-[var(--rico-bg-base)]/60">
        <div className="p-3">
          <span className="block text-[11.5px] text-[var(--rico-text-base)]">
            Standard
          </span>
          <span className="mt-0.5 block font-mono tabular-nums text-[13px] text-[var(--rico-text-base)] line-through">
            {formatFiat(advisory.originalPrice)}/mo
          </span>
        </div>

        <div className="p-3">
          <span className="block text-[11.5px] text-[var(--rico-text-base)]">
            {isCreditClaim ? "Credit pool" : "Monthly delta"}
          </span>
          <span className="mt-0.5 block font-mono tabular-nums text-[13px] font-medium text-emerald-700">
            {isCreditClaim
              ? formatFiat(advisory.reclaimedCredits)
              : formatFiat(-advisory.savingsEnforced, { signed: true })}
          </span>
        </div>

        <div className="p-3 text-right">
          <span className="block text-[11.5px] text-[var(--rico-text-base)]">
            Eligible rate
          </span>
          <span className="mt-0.5 block font-mono tabular-nums text-[13.5px] font-semibold text-[var(--rico-text-strong)]">
            {formatFiat(advisory.discountedPrice)}/mo
          </span>
        </div>
      </div>

      {advisory.couponCode && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[var(--rico-bg-base)] border border-[var(--rico-border-weak)] text-[12.5px]">
          <span className="text-[var(--rico-text-base)]">Verified promo code</span>
          <div className="inline-flex items-center gap-2">
            <code className="font-mono font-semibold text-[var(--rico-text-strong)]">
              {advisory.couponCode}
            </code>
            <button
              type="button"
              onClick={handleCopyCode}
              aria-label={copiedCode ? "Promo code copied" : `Copy promo code ${advisory.couponCode}`}
              className="h-7 px-2 rounded-md border border-[var(--rico-border-base)] bg-[var(--rico-surface-elevated)] hover:bg-[var(--rico-bg-base)] text-[12px] font-medium text-[var(--rico-text-strong)] inline-flex items-center gap-1 transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3 h-3 text-emerald-700" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" aria-hidden="true" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="px-3 py-2 rounded-lg border border-red-200 bg-red-50/70 text-[12.5px] text-red-800 flex items-center justify-between gap-2"
        >
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={handleApply}
            className="font-medium underline hover:no-underline shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/40 rounded"
          >
            Retry
          </button>
        </div>
      )}

      {applied ? (
        <div className="px-3 py-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-[12.5px] text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
          <span className="tabular-nums">
            Eligible rate recorded at {formatFiat(advisory.discountedPrice)}/mo.
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2 pt-0.5">
          {advisory.claimUrl && (
            <a
              href={advisory.claimUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] sm:min-h-0 sm:h-9 px-3.5 rounded-lg border border-[var(--rico-border-base)] bg-[var(--rico-surface-elevated)] hover:bg-[var(--rico-bg-base)] text-[12.5px] font-medium text-[var(--rico-text-strong)] inline-flex items-center justify-center gap-1.5 no-underline transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
            >
              <span>{isCreditClaim ? "Program application" : "Verify terms"}</span>
              <ExternalLink
                className="w-3.5 h-3.5 text-[var(--rico-text-base)]"
                aria-hidden="true"
              />
            </a>
          )}

          {advisory.discountedPrice > 0 && (
            <button
              type="button"
              disabled={applying}
              aria-busy={applying}
              onClick={handleApply}
              className="min-h-[40px] sm:min-h-0 sm:h-9 px-4 rounded-lg bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)] hover:opacity-90 active:translate-y-px text-[12.5px] font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-50 transition-opacity duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/40"
            >
              {applying && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              )}
              <span className="tabular-nums">
                Apply {formatFiat(advisory.discountedPrice)}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
