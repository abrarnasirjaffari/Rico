"use client";

import React from "react";
import type { UserPersona } from "@/lib/savings/types";
import { Rocket, GraduationCap, Code2, Check } from "lucide-react";

interface PersonaSelectorProps {
  activePersona: UserPersona;
  onSelectPersona: (persona: UserPersona) => void;
  variant?: "compact" | "full";
}

export function PersonaSelector({
  activePersona,
  onSelectPersona,
  variant = "compact",
}: PersonaSelectorProps) {
  const personas: Array<{
    id: UserPersona;
    label: string;
    icon: React.ReactNode;
    subtitle: string;
    perkHighlight: string;
  }> = [
    {
      id: "STARTUP_FOUNDER",
      label: "Startup",
      icon: <Rocket className="w-3.5 h-3.5" />,
      subtitle: "PostHog, Notion & cloud credits",
      perkHighlight: "Up to $50,000 in SaaS credits",
    },
    {
      id: "STUDENT",
      label: "Student",
      icon: <GraduationCap className="w-3.5 h-3.5" />,
      subtitle: "Spotify, Adobe & GitHub perks",
      perkHighlight: "50%–100% academic discounts",
    },
    {
      id: "DEVELOPER_SMB",
      label: "Developer / SMB",
      icon: <Code2 className="w-3.5 h-3.5" />,
      subtitle: "Verified promo codes & annual rates",
      perkHighlight: "Billing arbitrage & coupons",
    },
  ];

  if (variant === "compact") {
    return (
      <div
        role="tablist"
        aria-label="Savings profile"
        className="inline-flex items-center gap-0.5 bg-[#EDF3FA] border border-[#DCE7F3] rounded-lg p-1 text-xs"
      >
        {personas.map((p) => {
          const isSelected = activePersona === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectPersona(p.id)}
              className={`h-7 px-2.5 rounded-md transition-colors duration-150 ease-out flex items-center gap-1.5 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 ${
                isSelected
                  ? "bg-white text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                  : "text-[#52637A] hover:text-[#0F172A]"
              }`}
              title={`${p.label}: ${p.perkHighlight}`}
            >
              {p.icon}
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {personas.map((p) => {
        const isSelected = activePersona === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelectPersona(p.id)}
            className={`p-4 rounded-xl border text-left transition-colors duration-150 ease-out flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 ${
              isSelected
                ? "border-[#2563EB] bg-[#F4F8FE] shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
                : "border-[#E2ECF6] bg-white hover:border-[#C5D8EE]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-[#0F172A]">
                  <div className="w-7 h-7 rounded-lg bg-[#EDF3FA] flex items-center justify-center text-[#334155] shrink-0">
                    {p.icon}
                  </div>
                  <span className="font-semibold text-xs">{p.label}</span>
                </div>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <p className="text-xs text-[#52637A] leading-relaxed">{p.subtitle}</p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#E8EFF7] flex items-center justify-between text-[11px]">
              <span className="text-[#7B8BA1]">Benefit</span>
              <span className="font-medium text-[#0F172A]">{p.perkHighlight}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
