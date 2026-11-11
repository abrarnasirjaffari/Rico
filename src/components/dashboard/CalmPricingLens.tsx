"use client";

import React, { useState } from "react";
import { CheckCircle2, Eye, EyeOff, Check, ArrowRight } from "lucide-react";
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

  const handlePlanClick = (plan: CalmPlanTier) => {
    setSelectedPlanId(plan.id);
    onSelectPlan(
      data.service,
      plan.normalizedMonthlyPrice || plan.price,
      plan.name
    );
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#F5F8FC] text-[#0F172A] p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2ECF6]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold tracking-tight text-[#0F172A]">
                {data.service} — Normalized Pricing
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium tabular-nums">
                {data.darkPatternsStrippedCount} traps stripped
              </span>
            </div>
            <p className="text-xs text-[#52637A] mt-1 m-0">
              {data.simplifierSummary}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowRawContrast((prev) => !prev)}
            className="h-8 px-3 rounded-lg text-xs font-medium border border-[#DCE7F3] bg-white hover:bg-[#FAFBFD] text-[#334155] flex items-center gap-1.5 transition-colors duration-150 self-start"
          >
            {showRawContrast ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide fine print</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Show stripped fine print</span>
              </>
            )}
          </button>
        </div>

        {showRawContrast && data.hiddenFeesUncovered.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5 text-xs">
            <div className="font-medium text-amber-900">
              Fine-print clauses uncovered
            </div>
            <ul className="space-y-1 text-amber-900/90 m-0 pl-4">
              {data.hiddenFeesUncovered.map((gotcha, idx) => (
                <li key={idx}>{gotcha}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                className={`rounded-xl border p-5 bg-white flex flex-col justify-between space-y-4 transition-colors duration-150 ${
                  isSelected
                    ? "border-[#2563EB] ring-2 ring-[#2563EB]/20"
                    : "border-[#DCE7F3] hover:border-[#BFD3EA]"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-[#0F172A] m-0">
                        {plan.name}
                      </h4>
                      <p className="text-xs text-[#52637A] mt-0.5 m-0">
                        {plan.headline}
                      </p>
                    </div>
                    {plan.recommended && (
                      <span className="px-2 py-0.5 rounded-full bg-[#EDF3FA] text-[#0F172A] text-[11px] font-medium shrink-0">
                        Recommended
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1.5 pt-1">
                    <span className="text-2xl font-semibold text-[#0F172A] font-mono tabular-nums">
                      ${plan.normalizedMonthlyPrice.toFixed(2)}
                    </span>
                    <span className="text-xs text-[#7B8BA1]">
                      {plan.billingPeriod === "usage" ? "est. / mo" : "/ month"}
                    </span>
                  </div>

                  <div className="text-xs text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{plan.transparentLabel}</span>
                  </div>

                  <ul className="space-y-1.5 pt-2 border-t border-[#EDF3FA] text-xs text-[#334155] m-0 p-0 list-none">
                    {plan.cleanFeatures.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#52637A] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handlePlanClick(plan)}
                  disabled={isLoading}
                  className={`w-full h-9 px-3.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors duration-150 ${
                    isSelected
                      ? "bg-emerald-600 text-white"
                      : "bg-[#0F172A] hover:bg-[#1E293B] text-white"
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Selected</span>
                    </>
                  ) : (
                    <>
                      <span className="tabular-nums">
                        Set rule (${plan.normalizedMonthlyPrice.toFixed(2)}/mo)
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
