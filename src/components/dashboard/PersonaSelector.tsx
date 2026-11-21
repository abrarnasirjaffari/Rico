"use client";

import React from "react";
import type { UserPersona } from "@/lib/savings/types";
import { Check } from "lucide-react";

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
    subtitle: string;
    perkHighlight: string;
  }> = [
    {
      id: "STARTUP_FOUNDER",
      label: "Startup",
      subtitle: "Cloud & analytics credits",
      perkHighlight: "Up to $50,000 in vendor credits",
    },
    {
      id: "STUDENT",
      label: "Academic",
      subtitle: "Verified student & faculty plans",
      perkHighlight: "50%–100% off standard tiers",
    },
    {
      id: "DEVELOPER_SMB",
      label: "Team / SMB",
      subtitle: "Annual billing & negotiated rates",
      perkHighlight: "Contract & promo rate matching",
    },
  ];

  if (variant === "compact") {
    return (
      <div
        role="group"
        aria-label="Organization profile"
        className="inline-flex items-center p-0.5 rounded-lg bg-[var(--rico-bg-base)] border border-[var(--rico-border-weak)]"
      >
        {personas.map((p) => {
          const isSelected = activePersona === p.id;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectPersona(p.id)}
              className={`min-h-[38px] sm:min-h-0 sm:h-8 px-3 rounded-md text-[12.5px] font-medium whitespace-nowrap transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35 ${
                isSelected
                  ? "bg-[var(--rico-surface-elevated)] text-[var(--rico-text-strong)] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                  : "text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)]"
              }`}
            >
              {p.label}
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
            aria-pressed={isSelected}
            onClick={() => onSelectPersona(p.id)}
            className={`p-4 rounded-xl border text-left transition-colors duration-100 motion-reduce:transition-none flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35 ${
              isSelected
                ? "border-[var(--rico-text-strong)] bg-[var(--rico-surface-elevated)]"
                : "border-[var(--rico-border-weak)] bg-[var(--rico-surface-elevated)] hover:border-[var(--rico-border-base)]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-[13.5px] text-[var(--rico-text-strong)]">
                  {p.label}
                </span>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-[var(--rico-text-strong)] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" aria-hidden="true" />
                  </span>
                )}
              </div>
              <p className="m-0 text-[12.5px] text-[var(--rico-text-base)] leading-relaxed">
                {p.subtitle}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[var(--rico-surface-base)] flex items-center justify-between text-[12px]">
              <span className="text-[var(--rico-text-base)]">Eligibility</span>
              <span className="font-medium text-[var(--rico-text-strong)]">
                {p.perkHighlight}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
