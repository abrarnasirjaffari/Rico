"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Gift,
  ExternalLink,
  CreditCard,
  CheckCircle2,
  Rocket,
  GraduationCap,
  Code2,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import {
  UserPersona,
  SavingsAdvisoryData,
} from "@/lib/savings/types";
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
  const [activePersona, setActivePersona] = useState<UserPersona>("STARTUP_FOUNDER");
  const [probingService, setProbingService] = useState<string | null>(null);
  const [activeAdvisory, setActiveAdvisory] = useState<SavingsAdvisoryData | null>(null);
  const [appliedSuccessMsg, setAppliedSuccessMsg] = useState<string | null>(null);

  const filteredDeals = PERSONA_DEALS_MATRIX.filter((d) => d.persona === activePersona);

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
          `Payment authorized! Captured $${advisory.discountedPrice.toFixed(
            2
          )} via PayPal Sandbox Orders API. Reclaimed $${advisory.savingsEnforced.toFixed(2)} in savings.`
        );
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#F6FAFF] text-[#0F172A] overflow-y-auto p-4 space-y-4 font-[Inter,system-ui,sans-serif]">
      {/* Header Banner */}
      <div className="p-4 rounded-xl border border-[#C8DDF8] bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E2EEFD] border border-[#BFD7F7] flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#0F172A]">
                Persona-Based Savings &amp; Startup Credits
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-semibold font-mono">
                Pre-Payment Probe Active
              </span>
            </div>
            <p className="text-xs text-[#52637A] mt-0.5">
              Automatically intercepts checkout flows to apply verified startup credits, student discounts, and annual billing arbitrage.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <PersonaSelector
            activePersona={activePersona}
            onSelectPersona={(p) => {
              setActivePersona(p);
              setActiveAdvisory(null);
            }}
            variant="compact"
          />
        </div>
      </div>

      {appliedSuccessMsg && (
        <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{appliedSuccessMsg}</span>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs">
          <div className="flex items-center justify-between text-[#52637A] text-[11px] mb-1">
            <span>Reclaimed Credit Value</span>
            <Gift className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-700 font-mono">
            ${totalCreditsPotential.toLocaleString()}
          </div>
          <span className="text-[10px] text-[#52637A]">Startup &amp; education credits</span>
        </div>

        <div className="p-3 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs">
          <div className="flex items-center justify-between text-[#52637A] text-[11px] mb-1">
            <span>Active Persona Programs</span>
            <Rocket className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-[#0F172A]">{filteredDeals.length} Programs</div>
          <span className="text-[10px] text-[#52637A]">Tailored to profile</span>
        </div>

        <div className="p-3 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs">
          <div className="flex items-center justify-between text-[#52637A] text-[11px] mb-1">
            <span>Average Discount</span>
            <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-amber-700">50% – 100% Off</div>
          <span className="text-[10px] text-[#52637A]">Zero-dollar tiers included</span>
        </div>

        <div className="p-3 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs">
          <div className="flex items-center justify-between text-[#52637A] text-[11px] mb-1">
            <span>Pre-Payment Probe</span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-sm font-bold text-blue-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Always-On Intercept</span>
          </div>
          <span className="text-[10px] text-[#52637A]">Checks before PayPal charge</span>
        </div>
      </div>

      {/* Interactive Probe Test Bar */}
      <div className="p-4 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-blue-600" />
            <span>Test Pre-Payment Deal Probe:</span>
          </span>
          <span className="text-[10px] text-[#52637A] font-mono">
            Active: <strong className="text-blue-700">{activePersona}</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activePersona === "STARTUP_FOUNDER" && (
            <>
              <button
                type="button"
                disabled={probingService !== null}
                onClick={() => handleProbe("PostHog", 120.0)}
                className="px-3 py-1.5 rounded-lg bg-[#E2EEFD] hover:bg-[#D4E6FC] text-blue-800 border border-[#C8DDF8] text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                {probingService === "PostHog" ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Rocket className="w-3 h-3 text-blue-600" />
                )}
                <span>Probe PostHog ($50k Credits)</span>
              </button>

              <button
                type="button"
                disabled={probingService !== null}
                onClick={() => handleProbe("Notion", 10.0)}
                className="px-3 py-1.5 rounded-lg bg-[#E2EEFD] hover:bg-[#D4E6FC] text-blue-800 border border-[#C8DDF8] text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                {probingService === "Notion" ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Rocket className="w-3 h-3 text-blue-600" />
                )}
                <span>Probe Notion ($1k Credits)</span>
              </button>
            </>
          )}

          {activePersona === "STUDENT" && (
            <>
              <button
                type="button"
                disabled={probingService !== null}
                onClick={() => handleProbe("Spotify", 11.99)}
                className="px-3 py-1.5 rounded-lg bg-[#E2EEFD] hover:bg-[#D4E6FC] text-blue-800 border border-[#C8DDF8] text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                {probingService === "Spotify" ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <GraduationCap className="w-3 h-3 text-blue-600" />
                )}
                <span>Probe Spotify (50% Off Student)</span>
              </button>
            </>
          )}

          {activePersona === "DEVELOPER_SMB" && (
            <>
              <button
                type="button"
                disabled={probingService !== null}
                onClick={() => handleProbe("ChatGPT", 20.0)}
                className="px-3 py-1.5 rounded-lg bg-[#E2EEFD] hover:bg-[#D4E6FC] text-blue-800 border border-[#C8DDF8] text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                {probingService === "ChatGPT" ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Code2 className="w-3 h-3 text-blue-600" />
                )}
                <span>Probe ChatGPT Plus (SAVE20)</span>
              </button>
            </>
          )}
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

      {/* Deals Catalog Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[#0F172A]">
            Catalog Programs ({filteredDeals.length})
          </span>
          <span className="text-[10px] text-[#52637A] font-mono">
            Zero-Knowledge Verification • PayPal MCP Integrated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredDeals.map((deal) => (
            <div
              key={deal.id}
              className="p-4 rounded-xl border border-[#C8DDF8] bg-white flex flex-col justify-between space-y-3 hover:border-[#93C5FD] transition-all shadow-2xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#0F172A]">{deal.service}</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                      {deal.badge}
                    </span>
                  </div>
                  {deal.couponCode && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-mono font-bold">
                      {deal.couponCode}
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-blue-700 leading-snug">
                  {deal.headline}
                </h4>

                <p className="text-[11px] text-[#52637A] leading-relaxed">
                  {deal.description}
                </p>

                <div className="text-[10px] text-[#52637A] pt-1.5 border-t border-[#DCE9FA] flex items-center justify-between font-mono">
                  <span>Regular: ${deal.regularPrice.toFixed(2)}/mo</span>
                  <span className="text-emerald-700 font-bold">
                    {deal.discountedPrice === 0 ? "100% Free / $0" : `Discounted: $${deal.discountedPrice.toFixed(2)}/mo`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <a
                  href={deal.claimUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-3 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#C8DDF8] transition-colors text-center"
                >
                  <ExternalLink className="w-3 h-3 text-blue-600" />
                  <span>Claim Portal</span>
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
                  className="flex-1 py-1.5 px-3 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <CreditCard className="w-3 h-3" />
                  <span>Deploy Rule</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
