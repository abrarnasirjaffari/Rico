"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  CreditCard,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { UserPersona, SavingsAdvisoryData } from "@/lib/savings/types";
import { PERSONA_DEALS_MATRIX } from "@/lib/savings/deal-matrix";
import { PersonaSelector } from "./PersonaSelector";
import { SavingsAdvisoryCard } from "./SavingsAdvisoryCard";

interface PersonaSavingsPanelProps {
  onDeployPlanMandate?: (service: string, price: number, planName: string) => void;
  onRefreshData?: () => void;
}

export function PersonaSavingsPanel({
  onDeployPlanMandate,
  onRefreshData,
}: PersonaSavingsPanelProps) {
  const [activePersona, setActivePersona] =
    useState<UserPersona>("STARTUP_FOUNDER");
  const [probingService, setProbingService] = useState<string | null>(null);
  const [activeAdvisory, setActiveAdvisory] =
    useState<SavingsAdvisoryData | null>(null);
  const [appliedSuccessMsg, setAppliedSuccessMsg] = useState<string | null>(
    null
  );

  const filteredDeals = PERSONA_DEALS_MATRIX.filter(
    (d) => d.persona === activePersona
  );

  const totalCreditsPotential = filteredDeals.reduce(
    (acc, curr) => acc + curr.reclaimedCreditValue,
    0
  );

  const handleProbe = async (serviceName: string, regularPrice: number) => {
    setProbingService(serviceName);
    setAppliedSuccessMsg(null);
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProbingService(null);
    }
  };

  const handleApplyDiscountPayment = async (advisory: SavingsAdvisoryData) => {
    try {
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
      if (res.ok && data.success) {
        setAppliedSuccessMsg(
          `Captured $${advisory.discountedPrice.toFixed(
            2
          )} — saved $${advisory.savingsEnforced.toFixed(2)}.`
        );
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const quickProbes =
    activePersona === "STARTUP_FOUNDER"
      ? [
          { name: "PostHog", price: 120.0, label: "PostHog ($50k credits)" },
          { name: "Notion", price: 10.0, label: "Notion ($1k credits)" },
          { name: "AWS", price: 84.5, label: "AWS ($5k credits)" },
        ]
      : activePersona === "STUDENT"
      ? [
          { name: "Spotify", price: 11.99, label: "Spotify (50% student)" },
          { name: "Adobe", price: 54.99, label: "Adobe (64% student)" },
          { name: "GitHub", price: 19.0, label: "GitHub Copilot ($0)" },
        ]
      : [
          { name: "ChatGPT", price: 20.0, label: "ChatGPT Plus (SAVE20)" },
          { name: "AWS", price: 84.5, label: "AWS annual rate" },
        ];

  return (
    <div className="h-full overflow-y-auto bg-[#F5F8FC] text-[#0F172A]">
      <div className="max-w-4xl mx-auto px-6 py-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#0F172A]">
              Savings &amp; Credits
            </h2>
            <p className="text-xs text-[#52637A] mt-1 tabular-nums">
              Up to ${totalCreditsPotential.toLocaleString()} in eligible{" "}
              {filteredDeals.length} programs before PayPal checkout
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

        {appliedSuccessMsg && (
          <div className="px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="tabular-nums">{appliedSuccessMsg}</span>
          </div>
        )}

        {/* Quick Pre-Payment Probe Bar */}
        <div className="rounded-xl border border-[#DCE7F3] bg-white p-4 space-y-3 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
          <div className="text-xs font-medium text-[#52637A]">
            Simulate pre-payment deal check
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {quickProbes.map((q) => (
              <button
                key={q.name}
                type="button"
                disabled={probingService !== null}
                onClick={() => handleProbe(q.name, q.price)}
                className="h-8 px-3 rounded-lg border border-[#DCE7F3] bg-[#F8FAFC] hover:bg-[#EBF2FB] text-[#0F172A] text-xs font-medium transition-colors duration-150 flex items-center gap-1.5 disabled:opacity-50"
              >
                {probingService === q.name && (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                )}
                <span>{q.label}</span>
              </button>
            ))}
          </div>

          {activeAdvisory && (
            <div className="pt-2">
              <SavingsAdvisoryCard
                advisory={activeAdvisory}
                onApplyPayment={handleApplyDiscountPayment}
                onDismiss={() => setActiveAdvisory(null)}
              />
            </div>
          )}
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDeals.map((deal) => (
            <div
              key={deal.id}
              className="p-5 rounded-xl border border-[#DCE7F3] bg-white flex flex-col justify-between space-y-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)]"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-[#0F172A]">
                    {deal.service}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-medium">
                    {deal.badge}
                  </span>
                </div>

                <p className="text-xs font-medium text-[#334155] m-0">
                  {deal.headline}
                </p>

                <p className="text-xs text-[#52637A] leading-relaxed m-0">
                  {deal.description}
                </p>

                <div className="text-xs text-[#7B8BA1] pt-2.5 border-t border-[#EDF3FA] flex items-center justify-between font-mono tabular-nums">
                  <span>Standard ${deal.regularPrice.toFixed(2)}/mo</span>
                  <span className="text-[#0F172A] font-semibold">
                    {deal.discountedPrice === 0
                      ? "$0 / Credits"
                      : `$${deal.discountedPrice.toFixed(2)}/mo`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={deal.claimUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-8 px-3 rounded-lg bg-white hover:bg-[#FAFBFD] text-[#334155] text-xs font-medium flex items-center justify-center gap-1.5 border border-[#DCE7F3] transition-colors duration-150 no-underline"
                >
                  <ExternalLink className="w-3 h-3 text-[#7B8BA1]" />
                  <span>Program site</span>
                </a>

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
                  className="flex-1 h-8 px-3 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors duration-150"
                >
                  <CreditCard className="w-3 h-3" />
                  <span>Set rule</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
