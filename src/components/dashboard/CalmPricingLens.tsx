"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertTriangle,
  Zap,
  TrendingDown,
  Check,
  Building2,
  Server,
  Film,
  Code2,
} from "lucide-react";
import { CalmPricingResult, CalmPlanTier } from "@/lib/browser/types";

interface CalmPricingLensProps {
  data: CalmPricingResult;
  onSelectPlan: (service: string, price: number, planName: string) => void;
  isLoading?: boolean;
}

export function CalmPricingLens({
  data,
  onSelectPlan,
  isLoading = false,
}: CalmPricingLensProps) {
  const [showRawContrast, setShowRawContrast] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showGotchas, setShowGotchas] = useState(true);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Streaming":
        return <Film className="w-3.5 h-3.5 text-red-500" />;
      case "Developer Tools":
        return <Code2 className="w-3.5 h-3.5 text-purple-600" />;
      case "Cloud & Infrastructure":
        return <Server className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  const handlePlanClick = (plan: CalmPlanTier) => {
    setSelectedPlanId(plan.id);
    onSelectPlan(data.service, plan.normalizedMonthlyPrice || plan.price, plan.name);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F6FAFF] text-[#0F172A] overflow-y-auto select-none p-4 space-y-4 font-[Inter,system-ui,sans-serif]">
      {/* 1. Header & Contrast Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#C8DDF8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </span>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-[#0F172A] flex items-center gap-1.5">
                <span>Calm Pricing Lens™</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200 font-semibold">
                  In-Place Restyler
                </span>
              </h3>
            </div>
          </div>
          <p className="text-xs text-[#52637A] mt-1 max-w-xl">
            {data.simplifierSummary}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowRawContrast((prev) => !prev)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors shadow-2xs ${
              showRawContrast
                ? "bg-amber-50 border-amber-300 text-amber-800"
                : "bg-white border-[#C8DDF8] text-[#334155] hover:bg-[#E2EEFD]"
            }`}
          >
            {showRawContrast ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide Raw Traps</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Compare Raw Traps</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Real-Time Telemetry & Metric Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-3 rounded-xl bg-white border border-[#C8DDF8] flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-red-50 text-red-600">
              <ShieldAlert className="w-3.5 h-3.5" />
            </span>
            <span className="text-[#52637A] text-[11px]">Traps Stripped</span>
          </div>
          <span className="font-mono font-bold text-red-600 text-sm">
            {data.darkPatternsStrippedCount} detected
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-[#C8DDF8] flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
            <span className="text-[#52637A] text-[11px]">Calm Score</span>
          </div>
          <span className="font-mono font-bold text-emerald-700 text-sm">
            {data.calmScore}/100
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-[#C8DDF8] flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-50 text-amber-700">
              <TrendingDown className="w-3.5 h-3.5" />
            </span>
            <span className="text-[#52637A] text-[11px]">Original Noise</span>
          </div>
          <span className="font-mono font-bold text-[#64748B] text-sm line-through">
            {data.rawPageComplexityScore}%
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-[#C8DDF8] flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-50 text-blue-700">
              {getCategoryIcon(data.category)}
            </span>
            <span className="text-[#52637A] text-[11px]">Category</span>
          </div>
          <span className="font-semibold text-blue-700 text-xs truncate max-w-[90px]">
            {data.category}
          </span>
        </div>
      </div>

      {/* 3. Hidden Fees Uncovered Banner */}
      {data.hiddenFeesUncovered.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 shadow-2xs">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowGotchas((prev) => !prev)}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {data.hiddenFeesUncovered.length} Fine-Print Traps Neutralized by Rico
              </span>
            </div>
            <span className="text-[10px] text-amber-700 underline font-mono">
              {showGotchas ? "Hide" : "View"}
            </span>
          </div>

          {showGotchas && (
            <ul className="space-y-1 pt-1.5 border-t border-amber-200 text-xs text-amber-900 font-mono">
              {data.hiddenFeesUncovered.map((gotcha, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                  <span className="text-amber-600 shrink-0">•</span>
                  <span>{gotcha}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 4. Plan Cards Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[#52637A] px-1">
          <span className="font-bold text-[#0F172A]">
            Available Verified Plans ({data.plans.length})
          </span>
          <span className="text-[11px] font-mono text-[#52637A] flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-600" />
            1-Click Direct to PayPal Mandate
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {data.plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between shadow-2xs ${
                  isSelected
                    ? "bg-white border-blue-500 ring-2 ring-blue-500/30"
                    : plan.recommended
                    ? "bg-white border-purple-300 hover:border-purple-400"
                    : "bg-white border-[#C8DDF8] hover:border-[#93C5FD]"
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-purple-600 text-[10px] font-bold text-white tracking-wider uppercase flex items-center gap-1 shadow-2xs">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Best Value</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <h4 className="text-base font-bold text-[#0F172A]">
                      {plan.name}
                    </h4>
                    <p className="text-xs text-[#52637A] mt-0.5">
                      {plan.headline}
                    </p>
                  </div>

                  {/* Clean Transparent Price Display */}
                  <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#DCE9FA] space-y-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-[#0F172A] font-mono">
                        ${plan.normalizedMonthlyPrice.toFixed(2)}
                      </span>
                      <span className="text-xs text-[#52637A] font-mono">
                        {plan.billingPeriod === "usage" ? "est. / mo" : "/ month"}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-600" />
                      <span>{plan.transparentLabel}</span>
                    </div>
                  </div>

                  {showRawContrast && plan.rawMarketingTrapSnippet && (
                    <div className="p-2 rounded bg-red-50 border border-red-200 text-[11px] text-red-800 font-mono space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block">
                        Original Raw Trap:
                      </span>
                      <p className="italic text-[#64748B] line-through">
                        &ldquo;{plan.rawMarketingTrapSnippet}&rdquo;
                      </p>
                    </div>
                  )}

                  {plan.trapAlerts.length > 0 && (
                    <div className="space-y-1">
                      {plan.trapAlerts.map((alert, idx) => (
                        <div
                          key={idx}
                          className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-mono flex items-center gap-1.5"
                        >
                          <span className="shrink-0">•</span>
                          <span className="truncate">{alert}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-[#52637A] uppercase tracking-wider font-mono">
                      Honest Features:
                    </span>
                    <ul className="space-y-1 text-xs text-[#334155]">
                      {plan.cleanFeatures.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-[#DCE9FA]">
                  <button
                    type="button"
                    onClick={() => handlePlanClick(plan)}
                    disabled={isLoading}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs ${
                      isSelected
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : plan.recommended
                        ? "bg-purple-600 hover:bg-purple-500 text-white"
                        : "bg-[#0F172A] hover:bg-[#1E293B] text-white"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Plan Selected &amp; Ready to Deploy</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>
                          Deploy Rule with PayPal (${plan.normalizedMonthlyPrice.toFixed(2)}/mo)
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
