"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { UserPersona, SavingsAdvisoryData } from "@/lib/savings/types";
import { PERSONA_DEALS_MATRIX } from "@/lib/savings/deal-matrix";
import { PersonaSelector } from "./PersonaSelector";
import { SavingsAdvisoryCard } from "./SavingsAdvisoryCard";
import { formatFiat } from "@/lib/format-number";

interface PersonaSavingsPanelProps {
  onDeployPlanMandate?: (service: string, price: number, planName: string) => void;
  onRefreshData?: () => void;
}

export function PersonaSavingsPanel({
  onDeployPlanMandate,
  onRefreshData,
}: PersonaSavingsPanelProps) {
  const [activePersona, setActivePersonaState] =
    useState<UserPersona>("STARTUP_FOUNDER");
  const [probingService, setProbingService] = useState<string | null>(null);
  const [probeError, setProbeError] = useState<string | null>(null);
  const [activeAdvisory, setActiveAdvisory] =
    useState<SavingsAdvisoryData | null>(null);
  const [appliedSuccessMsg, setAppliedSuccessMsg] = useState<string | null>(
    null
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(
        "rico_persona"
      ) as UserPersona | null;
      if (
        saved === "STARTUP_FOUNDER" ||
        saved === "STUDENT" ||
        saved === "DEVELOPER_SMB"
      ) {
        setActivePersonaState(saved);
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const setActivePersona = (next: UserPersona) => {
    setActivePersonaState(next);
    setProbeError(null);
    try {
      window.localStorage.setItem("rico_persona", next);
    } catch {
      // Ignore storage access errors
    }
  };

  const filteredDeals = PERSONA_DEALS_MATRIX.filter(
    (d) => d.persona === activePersona
  );

  const totalCreditsPotential = filteredDeals.reduce(
    (acc, curr) => acc + curr.reclaimedCreditValue,
    0
  );

  const totalMonthlyDiscount = filteredDeals.reduce(
    (acc, curr) => acc + Math.max(0, curr.regularPrice - curr.discountedPrice),
    0
  );

  const handleProbe = async (serviceName: string, regularPrice: number) => {
    setProbingService(serviceName);
    setAppliedSuccessMsg(null);
    setProbeError(null);
    try {
      const res = await fetch("/api/savings/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: serviceName,
          price: regularPrice,
          persona: activePersona,
        }),
      });

      const data = await res.json();
      if (res.ok && data.result?.advisory) {
        setActiveAdvisory(data.result.advisory);
      } else {
        setProbeError(data.error || `Could not verify ${serviceName} eligibility.`);
      }
    } catch {
      setProbeError(`Network error while checking ${serviceName} rate.`);
    } finally {
      setProbingService(null);
    }
  };

  const handleApplyDiscountPayment = async (advisory: SavingsAdvisoryData) => {
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

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to apply discount");
    }

    setAppliedSuccessMsg(
      `Captured ${formatFiat(advisory.discountedPrice)} for ${advisory.service} (${formatFiat(advisory.savingsEnforced)} below standard rate).`
    );
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="w-full max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Header & Organization Profile Selector */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="m-0 text-[16px] font-semibold tracking-[-0.015em] text-[var(--rico-text-strong)]">
            Credits &amp; negotiated rates
          </h2>
          <p className="m-0 mt-1 text-[13px] text-[var(--rico-text-base)]">
            Vendor startup credits, academic pricing, and annual rates verified before checkout.
          </p>
        </div>

        <PersonaSelector
          activePersona={activePersona}
          onSelectPersona={(p) => {
            setActivePersona(p);
            setActiveAdvisory(null);
          }}
          variant="compact"
        />
      </div>

      {/* Quiet Summary Strip */}
      <div className="rounded-xl border border-[var(--rico-border-weak)] bg-[var(--rico-surface-elevated)] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--rico-border-weak)]">
        <div className="px-4 py-3.5">
          <span className="block text-[12px] text-[var(--rico-text-base)]">
            Verified programs
          </span>
          <span className="mt-1 block font-mono tabular-nums text-[18px] font-semibold tracking-[-0.02em] text-[var(--rico-text-strong)]">
            {filteredDeals.length}
          </span>
        </div>

        <div className="px-4 py-3.5">
          <span className="block text-[12px] text-[var(--rico-text-base)]">
            Eligible credit pool
          </span>
          <span className="mt-1 block font-mono tabular-nums text-[18px] font-semibold tracking-[-0.02em] text-[var(--rico-text-strong)]">
            {totalCreditsPotential > 0 ? formatFiat(totalCreditsPotential) : "--"}
          </span>
        </div>

        <div className="px-4 py-3.5">
          <span className="block text-[12px] text-[var(--rico-text-base)]">
            Monthly rate reduction
          </span>
          <span className="mt-1 block font-mono tabular-nums text-[18px] font-semibold tracking-[-0.02em] text-[var(--rico-text-strong)]">
            {formatFiat(totalMonthlyDiscount)}/mo
          </span>
        </div>
      </div>

      {appliedSuccessMsg && (
        <div
          role="status"
          className="px-4 py-3 rounded-xl border border-emerald-200/80 bg-emerald-50/70 text-emerald-800 text-[13px] flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
          <span className="tabular-nums">{appliedSuccessMsg}</span>
        </div>
      )}

      {probeError && (
        <div
          role="alert"
          className="px-4 py-3 rounded-xl border border-red-200 bg-red-50/70 text-red-800 text-[13px] flex items-center justify-between gap-3"
        >
          <span>{probeError}</span>
          <button
            type="button"
            onClick={() => setProbeError(null)}
            className="text-[12.5px] font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/40 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeAdvisory && (
        <SavingsAdvisoryCard
          advisory={activeAdvisory}
          onApplyPayment={handleApplyDiscountPayment}
          onDismiss={() => setActiveAdvisory(null)}
        />
      )}

      {/* Programs Directory Ledger */}
      <div className="rounded-xl border border-[var(--rico-border-weak)] bg-[var(--rico-surface-elevated)] overflow-hidden">
        <div className="overflow-x-auto rico-scroller">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--rico-border-weak)] bg-[var(--rico-bg-base)]/75">
                <th
                  scope="col"
                  className="py-2.5 pl-4 pr-3 text-[12px] font-medium text-[var(--rico-text-base)]"
                >
                  Vendor &amp; program
                </th>
                <th
                  scope="col"
                  className="py-2.5 px-3 text-[12px] font-medium text-[var(--rico-text-base)] hidden md:table-cell"
                >
                  Benefit
                </th>
                <th
                  scope="col"
                  className="py-2.5 px-3 text-[12px] font-medium text-[var(--rico-text-base)] text-right hidden sm:table-cell"
                >
                  Standard
                </th>
                <th
                  scope="col"
                  className="py-2.5 px-3 text-[12px] font-medium text-[var(--rico-text-base)] text-right"
                >
                  Eligible rate
                </th>
                <th
                  scope="col"
                  className="py-2.5 pl-3 pr-4 text-[12px] font-medium text-[var(--rico-text-base)] text-right"
                >
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--rico-surface-base)]">
              {filteredDeals.map((deal) => {
                const isProbing = probingService === deal.service;
                return (
                  <tr
                    key={deal.id}
                    className="hover:bg-[var(--rico-bg-base)]/60 transition-colors duration-100 motion-reduce:transition-none"
                  >
                    <td className="py-4 pl-4 pr-3 align-top max-w-sm">
                      <div className="text-[13.5px] font-medium text-[var(--rico-text-strong)]">
                        {deal.service}
                      </div>
                      <p className="m-0 mt-0.5 text-[12.5px] text-[var(--rico-text-base)] leading-relaxed">
                        {deal.headline}
                      </p>
                    </td>

                    <td className="py-4 px-3 align-top hidden md:table-cell">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-[var(--rico-surface-base)] text-[12px] font-medium text-[var(--rico-text-strong)]">
                        {deal.badge}
                      </span>
                      <p className="m-0 mt-1 text-[12px] text-[var(--rico-text-base)] max-w-xs leading-relaxed">
                        {deal.description}
                      </p>
                    </td>

                    <td className="py-4 px-3 align-top text-right font-mono tabular-nums text-[13px] text-[var(--rico-text-base)] line-through hidden sm:table-cell whitespace-nowrap">
                      {formatFiat(deal.regularPrice)}/mo
                    </td>

                    <td className="py-4 px-3 align-top text-right font-mono tabular-nums whitespace-nowrap">
                      <div className="text-[13.5px] font-semibold text-[var(--rico-text-strong)]">
                        {deal.discountedPrice === 0
                          ? "$0.00/mo"
                          : `${formatFiat(deal.discountedPrice)}/mo`}
                      </div>
                      {deal.reclaimedCreditValue > 0 && (
                        <div className="text-[11.5px] text-emerald-700 font-medium">
                          {formatFiat(deal.reclaimedCreditValue, { context: "compact" })} credits
                        </div>
                      )}
                    </td>

                    <td className="py-4 pl-3 pr-4 align-top text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2 flex-wrap">
                        <button
                          type="button"
                          disabled={probingService !== null}
                          aria-busy={isProbing}
                          onClick={() => handleProbe(deal.service, deal.regularPrice)}
                          className="min-h-[40px] sm:min-h-0 sm:h-8 px-2.5 rounded-lg border border-[var(--rico-border-weak)] hover:border-[var(--rico-border-base)] bg-[var(--rico-surface-elevated)] hover:bg-[var(--rico-bg-base)] active:translate-y-px text-[12.5px] font-medium text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)] inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
                        >
                          {isProbing && (
                            <Loader2
                              className="w-3.5 h-3.5 animate-spin"
                              aria-hidden="true"
                            />
                          )}
                          <span>Check rate</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (onDeployPlanMandate) {
                              onDeployPlanMandate(
                                deal.service,
                                deal.discountedPrice,
                                `${deal.service} (${deal.badge})`
                              );
                            }
                          }}
                          className="min-h-[40px] sm:min-h-0 sm:h-8 px-3 rounded-lg border border-[var(--rico-border-base)] bg-[var(--rico-surface-elevated)] hover:bg-[var(--rico-bg-base)] active:translate-y-px text-[12.5px] font-medium text-[var(--rico-text-strong)] transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
                        >
                          Set rule
                        </button>

                        <a
                          href={deal.claimUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${deal.service} program site`}
                          title="Open vendor program site"
                          className="min-w-[40px] min-h-[40px] sm:min-w-[32px] sm:min-h-0 sm:w-8 sm:h-8 rounded-lg border border-[var(--rico-border-weak)] hover:border-[var(--rico-border-base)] bg-[var(--rico-surface-elevated)] hover:bg-[var(--rico-bg-base)] text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)] inline-flex items-center justify-center no-underline transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
                        >
                          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
