"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Globe,
  RotateCcw,
  Search,
} from "lucide-react";
import type { RicoUIActionEvent } from "@/lib/ricoui/types";
import {
  normalizeCardActionLabel,
  resolveOfficialUrl,
} from "@/lib/ricoui/url-resolver";

function fmtUsd(n: number): string {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function MandateBuilderWidget({
  service,
  suggestedCeiling,
  currentPrice,
  defaultRecurrence,
  category,
  onAction,
}: {
  service: string;
  suggestedCeiling: number;
  currentPrice?: number;
  defaultRecurrence: string;
  category: string;
  onAction?: (ev: RicoUIActionEvent) => void;
}) {
  const [ceiling, setCeiling] = useState<number>(
    Math.max(1, Number(suggestedCeiling.toFixed(2)))
  );
  const [recurrence, setRecurrence] = useState<string>(defaultRecurrence);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const minSlider = Math.max(1, Math.floor((currentPrice ?? suggestedCeiling) * 0.5));
  const maxSlider = Math.max(50, Math.ceil(suggestedCeiling * 3));
  const headroom = currentPrice !== undefined ? ceiling - currentPrice : null;

  return (
    <div className="rico-card-enter rounded-[14px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] p-4 space-y-3.5 shadow-[var(--rico-iui-shadow-sm)]">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0285ff] shrink-0" />
            <span className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--rico-iui-ink)]">
              {service} · Spending Rule
            </span>
          </div>
          <p className="m-0 mt-0.5 text-[12.5px] text-[var(--rico-iui-muted)]">
            Adjust cap or billing cycle below. Creating a rule never charges funds.
          </p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-[var(--rico-iui-badge-neutral)] text-[11px] font-medium text-[var(--rico-iui-muted)] shrink-0">
          {category}
        </span>
      </div>

      <div className="rounded-[12px] bg-[var(--rico-iui-surface)] p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--rico-iui-ink)]">Hard Budget Cap</span>
            {currentPrice !== undefined && (
              <div className="inline-flex items-center gap-1">
                {[1.1, 1.25, 1.5].map((mult, idx) => {
                  const preset = Math.ceil(currentPrice * mult);
                  const label = idx === 0 ? "+10%" : idx === 1 ? "+25%" : "+50%";
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setCeiling(preset);
                      }}
                      className={`px-1.5 py-0.5 rounded-[6px] text-[11px] font-mono transition-colors ${
                        ceiling === preset
                          ? "bg-[#0285ff] text-white"
                          : "bg-[var(--rico-iui-canvas)] border border-[var(--rico-iui-border)] text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 font-mono tabular-nums">
            <div className="inline-flex items-center h-7 px-2 rounded-[8px] bg-[var(--rico-iui-canvas)] border border-[var(--rico-iui-border-strong)] focus-within:border-[#0285ff]">
              <span className="text-[var(--rico-iui-muted)] text-[12px] mr-0.5">$</span>
              <input
                type="number"
                min={1}
                step={0.5}
                aria-label="Budget ceiling amount"
                value={ceiling}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v) && v >= 0) {
                    setSubmitted(false);
                    setCeiling(v);
                  }
                }}
                className="w-16 bg-transparent text-right font-semibold text-[13px] text-[var(--rico-iui-ink)] focus:outline-none"
              />
            </div>
            {headroom !== null && (
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={
                  headroom >= 0
                    ? {
                        background: "var(--rico-iui-badge-success-soft)",
                        color: "var(--rico-iui-badge-success)",
                      }
                    : {
                        background: "var(--rico-iui-badge-danger-soft)",
                        color: "var(--rico-iui-badge-danger)",
                      }
                }
              >
                {headroom >= 0
                  ? `+${fmtUsd(headroom)} buffer`
                  : `${fmtUsd(headroom)} under`}
              </span>
            )}
          </div>
        </div>

        <input
          type="range"
          min={minSlider}
          max={maxSlider}
          step={0.5}
          value={Math.min(maxSlider, Math.max(minSlider, ceiling))}
          onChange={(e) => {
            setSubmitted(false);
            setCeiling(Number(e.target.value));
          }}
          className="w-full accent-[#0285ff] cursor-pointer"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-[10px] bg-[var(--rico-iui-surface)]">
          {["Monthly on 1st", "Monthly on 5th", "Monthly on 15th", "Annual"].map(
            (sched) => (
              <button
                key={sched}
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setRecurrence(sched);
                }}
                className={`h-6 px-2.5 rounded-[7px] text-[11.5px] font-medium transition-colors duration-100 ${
                  recurrence === sched
                    ? "bg-[var(--rico-iui-canvas)] text-[var(--rico-iui-ink)] shadow-[var(--rico-iui-shadow-sm)]"
                    : "text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)]"
                }`}
              >
                {sched}
              </button>
            )
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() =>
              onAction?.({
                type: "stage_mandate",
                humanFriendlyMessage: `Edit details for ${service}`,
                params: { service, ceiling, recurrence, category },
              })
            }
            className="h-8 px-3 rounded-[9px] border border-[var(--rico-iui-border-strong)] bg-[var(--rico-iui-canvas)] hover:bg-[var(--rico-iui-hover)] text-[12px] font-medium text-[var(--rico-iui-ink)] flex-1 sm:flex-initial justify-center inline-flex items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40"
          >
            Full form
          </button>
          <button
            type="button"
            onClick={() => {
              setSubmitted(true);
              onAction?.({
                type: "create_mandate_direct",
                humanFriendlyMessage: `Create a rule for ${service}, max $${ceiling.toFixed(
                  2
                )} ${recurrence}`,
                params: { service, ceiling, recurrence, category },
              });
            }}
            className={`h-8 px-3.5 rounded-[9px] text-white text-[12px] font-medium flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40 ${
              submitted
                ? "bg-[#00805d]"
                : "bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)] hover:opacity-90"
            }`}
          >
            {submitted ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{submitted ? "Sent to Rico" : `Create $${ceiling.toFixed(2)} Rule`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function RunwayCalculatorWidget({
  title,
  initialCash,
  initialMrr,
  initialGrossBurn,
  onAction,
}: {
  title: string;
  initialCash: number;
  initialMrr: number;
  initialGrossBurn: number;
  onAction?: (ev: RicoUIActionEvent) => void;
}) {
  const [cash, setCash] = useState<number>(initialCash);
  const [mrr, setMrr] = useState<number>(initialMrr);
  const [grossBurn, setGrossBurn] = useState<number>(initialGrossBurn);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const isModified =
    cash !== initialCash || mrr !== initialMrr || grossBurn !== initialGrossBurn;
  const netBurn = Math.max(0, grossBurn - mrr);
  const netSurplus = Math.max(0, mrr - grossBurn);
  const profitable = mrr >= grossBurn;
  const runwayMonths = profitable ? 36 : netBurn > 0 ? cash / netBurn : 36;
  const arr = mrr * 12;

  const projection = Array.from({ length: 6 }, (_, idx) => {
    const monthNum = idx + 1;
    const projected = profitable
      ? cash + netSurplus * monthNum
      : Math.max(0, cash - netBurn * monthNum);
    return { label: `M${monthNum}`, cash: projected };
  });
  const maxProj = Math.max(1, cash, ...projection.map((p) => p.cash));

  return (
    <div className="rico-card-enter rounded-[14px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] p-4 space-y-3.5 shadow-[var(--rico-iui-shadow-sm)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              profitable || runwayMonths >= 18
                ? "bg-[#00a67d] rico-live-dot"
                : runwayMonths >= 9
                ? "bg-[#f4a340]"
                : "bg-[#c1322c]"
            }`}
          />
          <span className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--rico-iui-ink)]">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isModified && (
            <button
              type="button"
              onClick={() => {
                setCash(initialCash);
                setMrr(initialMrr);
                setGrossBurn(initialGrossBurn);
              }}
              className="h-6 px-2 rounded-full bg-[var(--rico-iui-surface)] hover:bg-[var(--rico-iui-pressed)] text-[11px] font-medium text-[var(--rico-iui-muted)] inline-flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
          <span
            className="px-2.5 py-0.5 rounded-full text-[11.5px] font-mono font-medium"
            style={
              profitable || runwayMonths >= 18
                ? {
                    background: "var(--rico-iui-badge-success-soft)",
                    color: "var(--rico-iui-badge-success)",
                  }
                : runwayMonths >= 9
                ? {
                    background: "var(--rico-iui-warning-soft)",
                    color: "var(--rico-iui-warning)",
                  }
                : {
                    background: "var(--rico-iui-badge-danger-soft)",
                    color: "var(--rico-iui-badge-danger)",
                  }
            }
          >
            {profitable
              ? "Cash-Flow Positive"
              : `${runwayMonths.toFixed(1)} months runway`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="rounded-[10px] bg-[var(--rico-iui-surface)] p-3">
          <div className="text-[11.5px] text-[var(--rico-iui-muted)]">Net Monthly Burn</div>
          <div className="text-[17px] font-semibold font-mono tabular-nums text-[var(--rico-iui-ink)] mt-0.5">
            {profitable
              ? `+$${netSurplus.toLocaleString("en-US")}/mo`
              : `$${netBurn.toLocaleString("en-US")}/mo`}
          </div>
        </div>
        <div className="rounded-[10px] bg-[var(--rico-iui-surface)] p-3">
          <div className="text-[11.5px] text-[var(--rico-iui-muted)]">Implied ARR (12x)</div>
          <div className="text-[17px] font-semibold font-mono tabular-nums text-[#0285ff] mt-0.5">
            ${arr.toLocaleString("en-US")}/yr
          </div>
        </div>
        <div className="rounded-[10px] bg-[var(--rico-iui-surface)] p-3">
          <div className="text-[11.5px] text-[var(--rico-iui-muted)]">
            {hoveredMonth !== null
              ? `Month ${hoveredMonth + 1} Cash`
              : "6-Month Ending Cash"}
          </div>
          <div className="text-[17px] font-semibold font-mono tabular-nums text-[var(--rico-iui-success)] mt-0.5">
            $
            {(hoveredMonth !== null
              ? projection[hoveredMonth].cash
              : projection[5].cash
            ).toLocaleString("en-US")}
          </div>
        </div>
      </div>

      <div className="rounded-[10px] bg-[var(--rico-iui-surface)] px-3.5 py-2.5 space-y-1.5">
        <div className="flex items-center justify-between text-[11.5px] text-[var(--rico-iui-muted)]">
          <span>6-Month Cash Trajectory</span>
          <span className="font-mono tabular-nums">
            {hoveredMonth !== null
              ? `${projection[hoveredMonth].label}: $${projection[hoveredMonth].cash.toLocaleString("en-US")}`
              : "M1 → M6"}
          </span>
        </div>
        <div className="grid grid-cols-6 gap-2 items-end h-12 pt-1">
          {projection.map((pt, idx) => {
            const hPct = Math.max(8, Math.round((pt.cash / maxProj) * 100));
            const depleted = pt.cash <= 0;
            const active = hoveredMonth === idx;
            return (
              <div
                key={pt.label}
                onMouseEnter={() => setHoveredMonth(idx)}
                onMouseLeave={() => setHoveredMonth(null)}
                className="h-full flex flex-col justify-end items-center cursor-pointer"
              >
                <div
                  className={`w-full rounded-[4px] transition-opacity duration-100 ${
                    depleted
                      ? "bg-[#c1322c]"
                      : profitable
                      ? "bg-[#00a67d]"
                      : "bg-[#0285ff]"
                  } ${
                    hoveredMonth !== null && !active ? "opacity-35" : "opacity-100"
                  }`}
                  style={{ height: `${hPct}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-6 gap-2 text-center text-[10.5px] font-mono text-[var(--rico-iui-muted)]">
          {projection.map((pt) => (
            <span key={pt.label}>{pt.label}</span>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <div>
          <div className="flex justify-between text-[12.5px] mb-0.5">
            <span className="text-[var(--rico-iui-muted)]">Cash Balance</span>
            <span className="font-mono tabular-nums font-semibold text-[var(--rico-iui-ink)]">
              ${cash.toLocaleString("en-US")}
            </span>
          </div>
          <input
            type="range"
            min={25000}
            max={2000000}
            step={25000}
            value={cash}
            onChange={(e) => setCash(Number(e.target.value))}
            className="w-full accent-[#0285ff] cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[12.5px] mb-0.5">
            <span className="text-[var(--rico-iui-muted)]">Monthly Revenue (MRR)</span>
            <span className="font-mono tabular-nums font-semibold text-[var(--rico-iui-success)]">
              ${mrr.toLocaleString("en-US")}/mo
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={250000}
            step={2500}
            value={mrr}
            onChange={(e) => setMrr(Number(e.target.value))}
            className="w-full accent-[#00a67d] cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[12.5px] mb-0.5">
            <span className="text-[var(--rico-iui-muted)]">Monthly Gross Burn</span>
            <span className="font-mono tabular-nums font-semibold text-[var(--rico-iui-ink)]">
              ${grossBurn.toLocaleString("en-US")}/mo
            </span>
          </div>
          <input
            type="range"
            min={5000}
            max={250000}
            step={2500}
            value={grossBurn}
            onChange={(e) => setGrossBurn(Number(e.target.value))}
            className="w-full accent-[#0285ff] cursor-pointer"
          />
        </div>
      </div>

      <div className="flex items-center justify-end pt-0.5">
        <button
          type="button"
          onClick={() =>
            onAction?.({
              type: "continue_conversation",
              humanFriendlyMessage: `Build a 6-month startup runway model in Excel with $${cash} starting cash, $${mrr} MRR, and $${grossBurn} burn`,
            })
          }
          className="h-8 px-3.5 rounded-[9px] bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)] hover:opacity-90 text-[12px] font-medium inline-flex items-center gap-1.5 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00a67d]" />
          <span>Open Formula Sheet in Excel</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function VendorComparisonWidget({
  title,
  vendors,
  onAction,
}: {
  title: string;
  vendors: Array<Record<string, unknown>>;
  onAction?: (ev: RicoUIActionEvent) => void;
}) {
  const [billingView, setBillingView] = useState<"monthly" | "annual">("monthly");

  const parsed = vendors.map((v) => {
    const service = String(v.service ?? "Service");
    return {
      service,
      planName: String(v.planName ?? "Standard Plan"),
      monthlyPrice: Number(v.monthlyPrice ?? 0),
      currency: String(v.currency ?? "USD"),
      url: resolveOfficialUrl(service, v.url ?? v.link ?? v.website),
    };
  });

  const validPrices = parsed.filter((v) => v.monthlyPrice > 0).map((v) => v.monthlyPrice);
  const lowest = validPrices.length > 0 ? Math.min(...validPrices) : 0;
  const highest = validPrices.length > 0 ? Math.max(...validPrices) : 0;

  return (
    <div className="rico-card-enter rounded-[14px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] overflow-hidden shadow-[var(--rico-iui-shadow-sm)]">
      <div className="px-4 py-3 border-b border-[var(--rico-iui-border)] bg-[var(--rico-iui-surface)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-semibold text-[var(--rico-iui-ink)]">{title}</span>
          {highest > lowest && lowest > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-mono tabular-nums font-medium"
              style={{
                background: "var(--rico-iui-badge-success-soft)",
                color: "var(--rico-iui-badge-success)",
              }}
            >
              Save {fmtUsd((highest - lowest) * 12)}/yr
            </span>
          )}
        </div>

        <div className="inline-flex items-center p-0.5 rounded-[8px] bg-[var(--rico-iui-pressed)]">
          {(["monthly", "annual"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setBillingView(mode)}
              className={`h-6 px-2.5 rounded-[6px] text-[11.5px] font-medium capitalize transition-colors ${
                billingView === mode
                  ? "bg-[var(--rico-iui-canvas)] text-[var(--rico-iui-ink)] shadow-[var(--rico-iui-shadow-sm)]"
                  : "text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)]"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-[var(--rico-iui-border)]">
        {parsed.map((v, idx) => {
          const isBest = lowest > 0 && v.monthlyPrice === lowest && parsed.length > 1;
          const suggestedCap = Math.ceil(v.monthlyPrice * 1.2);
          const shownPrice =
            billingView === "annual" ? v.monthlyPrice * 12 : v.monthlyPrice;

          return (
            <div
              key={idx}
              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[var(--rico-iui-hover)] transition-colors duration-100"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-semibold text-[var(--rico-iui-ink)]">
                    {v.service}
                  </span>
                  {isBest && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10.5px] font-medium"
                      style={{
                        background: "var(--rico-iui-badge-success-soft)",
                        color: "var(--rico-iui-badge-success)",
                      }}
                    >
                      Best value
                    </span>
                  )}
                </div>
                <div className="text-[12.5px] text-[var(--rico-iui-muted)] mt-0.5">
                  {v.planName}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0">
                <span className="text-[15.5px] font-semibold font-mono tabular-nums text-[var(--rico-iui-ink)] mr-1">
                  {fmtUsd(shownPrice)}
                  <span className="text-[11.5px] font-normal text-[var(--rico-iui-muted)]">
                    /{billingView === "annual" ? "yr" : "mo"}
                  </span>
                </span>
                <div className="flex items-center gap-1.5">
                  {v.url && (
                    <>
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Open ${v.url} in new tab`}
                        className="h-7 px-2.5 rounded-[8px] border border-[var(--rico-iui-border-strong)] bg-[var(--rico-iui-canvas)] hover:bg-[var(--rico-iui-hover)] text-[11.5px] font-medium text-[var(--rico-iui-ink)] inline-flex items-center gap-1 transition-colors"
                      >
                        <span>Website</span>
                        <ExternalLink className="w-3 h-3 text-[#0285ff]" />
                      </a>
                      <button
                        type="button"
                        title={`Inspect ${v.url} in Rico Browser`}
                        onClick={() =>
                          onAction?.({
                            type: "open_workspace",
                            humanFriendlyMessage: `Inspect ${v.service} in Browser`,
                            params: { tool: "browser", url: v.url },
                          })
                        }
                        className="h-7 px-2.5 rounded-[8px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-surface)] hover:bg-[var(--rico-iui-pressed)] text-[11.5px] font-medium text-[var(--rico-iui-ink)] inline-flex items-center gap-1 transition-colors"
                      >
                        <Globe className="w-3 h-3 text-[#0285ff]" />
                        <span>Inspect</span>
                      </button>
                    </>
                  )}
                  {v.monthlyPrice > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        onAction?.({
                          type: "stage_mandate",
                          humanFriendlyMessage: `Set spending cap for ${v.service}`,
                          params: {
                            service: v.service,
                            ceiling: suggestedCap,
                            recurrence: "Monthly on 1st",
                            category: "Subscription",
                          },
                        })
                      }
                      className="h-7 px-2.5 rounded-[8px] bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)] hover:opacity-90 text-[11.5px] font-medium transition-opacity"
                    >
                      Set ${suggestedCap} cap
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PaymentGuardrailWidget({
  mandateId,
  service,
  verifiedPrice,
  budgetCeiling,
  recurrence,
  status,
  onAction,
}: {
  mandateId: string;
  service: string;
  verifiedPrice: number;
  budgetCeiling: number;
  recurrence: string;
  status: string;
  onAction?: (ev: RicoUIActionEvent) => void;
}) {
  const withinCap = budgetCeiling <= 0 || verifiedPrice <= budgetCeiling;
  const pct =
    budgetCeiling > 0
      ? Math.min(100, Math.max(4, (verifiedPrice / budgetCeiling) * 100))
      : 0;
  const headroom = Math.max(0, budgetCeiling - verifiedPrice);

  return (
    <div className="rico-card-enter rounded-[14px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] p-4 space-y-3 shadow-[var(--rico-iui-shadow-sm)]">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-[var(--rico-iui-ink)] truncate">
            {service}
          </div>
          <div className="text-[12.5px] text-[var(--rico-iui-muted)] mt-0.5">{recurrence}</div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium shrink-0"
          style={
            status === "ACTIVE" && withinCap
              ? {
                  background: "var(--rico-iui-badge-success-soft)",
                  color: "var(--rico-iui-badge-success)",
                }
              : {
                  background: "var(--rico-iui-warning-soft)",
                  color: "var(--rico-iui-warning)",
                }
          }
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status === "ACTIVE" && withinCap
                ? "bg-[#00a67d] rico-live-dot"
                : "bg-[#f4a340]"
            }`}
          />
          {status}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[12px] font-mono tabular-nums">
          <span className="text-[var(--rico-iui-muted)]">
            Verified:{" "}
            <strong className="text-[var(--rico-iui-ink)]">
              {verifiedPrice > 0 ? fmtUsd(verifiedPrice) : "Not checked yet"}
            </strong>
          </span>
          <span className="text-[var(--rico-iui-muted)]">
            Ceiling: <strong className="text-[var(--rico-iui-ink)]">{fmtUsd(budgetCeiling)}</strong>
            {verifiedPrice > 0 ? (
              <span className="text-[var(--rico-iui-success)]"> ({fmtUsd(headroom)} headroom)</span>
            ) : (
              ""
            )}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--rico-iui-surface)] overflow-hidden">
          <div
            className={`h-full rounded-full ${
              withinCap ? "bg-[#0285ff]" : "bg-[#c1322c]"
            }`}
            style={{ width: `${verifiedPrice > 0 ? pct : 6}%` }}
          />
        </div>
      </div>

      {status === "ACTIVE" && withinCap && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <span className="text-[11.5px] text-[var(--rico-iui-muted)]">
            {verifiedPrice > 0
              ? "Two-step confirmation required before capture"
              : "Verify live merchant price before running payment"}
          </span>
          {verifiedPrice > 0 && mandateId ? (
            <button
              type="button"
              onClick={() =>
                onAction?.({
                  type: "trigger_mandate_quote",
                  humanFriendlyMessage: `Review payment quote for ${service}`,
                  params: { mandateId },
                })
              }
              className="h-8 px-3.5 rounded-[9px] bg-[#0285ff] hover:opacity-90 text-white text-[12px] font-medium whitespace-nowrap shrink-0 transition-opacity"
            >
              Review &amp; Confirm
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                onAction?.({
                  type: "continue_conversation",
                  humanFriendlyMessage: `How much is ${service}?`,
                })
              }
              className="h-8 px-3.5 rounded-[9px] bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)] hover:opacity-90 text-[12px] font-medium whitespace-nowrap shrink-0 transition-opacity"
            >
              Verify Live Price
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function CreditMatchWidget({
  title,
  totalValueLabel,
  programs,
  onAction,
}: {
  title: string;
  totalValueLabel: string;
  programs: Array<Record<string, unknown>>;
  onAction?: (ev: RicoUIActionEvent) => void;
}) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  return (
    <div className="rico-card-enter rounded-[14px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] overflow-hidden shadow-[var(--rico-iui-shadow-sm)]">
      <div className="px-4 py-3 border-b border-[var(--rico-iui-border)] bg-[var(--rico-iui-surface)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#00a67d] rico-live-dot shrink-0" />
          <span className="text-[13.5px] font-semibold text-[var(--rico-iui-ink)] truncate">
            {title}
          </span>
        </div>
        <span
          className="px-2.5 py-0.5 rounded-full text-[11.5px] font-mono font-semibold tabular-nums shrink-0"
          style={{
            background: "var(--rico-iui-badge-success-soft)",
            color: "var(--rico-iui-badge-success)",
          }}
        >
          {totalValueLabel}
        </span>
      </div>

      <div className="divide-y divide-[var(--rico-iui-border)]">
        {programs.map((prog, idx) => {
          const name = String(prog.name ?? "Program");
          const val = String(prog.value ?? "");
          const detail = String(prog.detail ?? "");
          const category = prog.category ? String(prog.category) : "";
          const eligibility = prog.eligibility ? String(prog.eligibility) : "";
          const url = resolveOfficialUrl(
            name,
            prog.url ?? prog.link ?? prog.website ?? prog.href
          );
          const actionPrompt = prog.actionPrompt ? String(prog.actionPrompt) : "";
          const actionLabel =
            normalizeCardActionLabel(prog.actionLabel) ||
            (actionPrompt ? "Explore" : "");

          return (
            <div
              key={idx}
              className="p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 hover:bg-[var(--rico-iui-hover)] transition-colors duration-100"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13.5px] font-semibold text-[var(--rico-iui-ink)]">
                    {name}
                  </span>
                  {val && (
                    <span
                      className="px-2 py-0.5 rounded-[6px] font-mono tabular-nums text-[11px] font-medium"
                      style={{
                        background: "var(--rico-iui-badge-success-soft)",
                        color: "var(--rico-iui-badge-success)",
                      }}
                    >
                      {val}
                    </span>
                  )}
                  {category && (
                    <span className="px-2 py-0.5 rounded-full bg-[var(--rico-iui-badge-neutral)] text-[11px] text-[var(--rico-iui-muted)]">
                      {category}
                    </span>
                  )}
                </div>
                {detail && (
                  <p className="m-0 mt-1 text-[12.5px] text-[var(--rico-iui-muted)] leading-relaxed">
                    {detail}
                  </p>
                )}
                {eligibility && (
                  <div className="mt-1 text-[11px] text-[var(--rico-iui-faint)]">
                    Fit: {eligibility}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  aria-label={`Copy ${name} details`}
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      void navigator.clipboard.writeText(`${name} (${val}): ${detail}`);
                      setCopiedIdx(idx);
                      setTimeout(() => setCopiedIdx(null), 1500);
                    }
                  }}
                  title="Copy details"
                  className="w-7 h-7 rounded-[8px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-surface)] hover:bg-[var(--rico-iui-pressed)] flex items-center justify-center text-[var(--rico-iui-muted)]"
                >
                  {copiedIdx === idx ? (
                    <Check className="w-3.5 h-3.5 text-[#00a67d]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                {url && (
                  <>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open ${url} in new tab`}
                      className="h-7 px-2.5 rounded-[8px] border border-[var(--rico-iui-border-strong)] bg-[var(--rico-iui-canvas)] hover:bg-[var(--rico-iui-hover)] text-[11.5px] font-medium text-[var(--rico-iui-ink)] inline-flex items-center gap-1"
                    >
                      <span>Website</span>
                      <ExternalLink className="w-3 h-3 text-[#0285ff]" />
                    </a>
                    <button
                      type="button"
                      title={`Inspect ${url} in Rico Browser`}
                      onClick={() =>
                        onAction?.({
                          type: "open_workspace",
                          humanFriendlyMessage: `Inspect ${name} in Browser`,
                          params: { tool: "browser", url },
                        })
                      }
                      className="h-7 px-2.5 rounded-[8px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-surface)] hover:bg-[var(--rico-iui-pressed)] text-[11.5px] font-medium text-[var(--rico-iui-ink)] inline-flex items-center gap-1"
                    >
                      <Globe className="w-3 h-3 text-[#0285ff]" />
                      <span>Inspect</span>
                    </button>
                  </>
                )}
                {actionPrompt && actionLabel && (
                  <button
                    type="button"
                    onClick={() =>
                      onAction?.({
                        type: "continue_conversation",
                        humanFriendlyMessage: actionPrompt,
                      })
                    }
                    className="h-7 px-2.5 rounded-[8px] bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)] hover:opacity-90 text-[11.5px] font-medium transition-opacity"
                  >
                    {actionLabel}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AccordionWidget({
  items,
  allowMultiple,
  onAction,
}: {
  items: Array<Record<string, unknown>>;
  allowMultiple: boolean;
  onAction?: (ev: RicoUIActionEvent) => void;
}) {
  const [openIndices, setOpenIndices] = useState<Record<number, boolean>>({ 0: true });

  const toggleItem = (idx: number) => {
    setOpenIndices((prev) => {
      const nextOpen = !prev[idx];
      if (!allowMultiple) {
        return nextOpen ? { [idx]: true } : {};
      }
      return { ...prev, [idx]: nextOpen };
    });
  };

  return (
    <div className="rico-card-enter rounded-[14px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] divide-y divide-[var(--rico-iui-border)] overflow-hidden shadow-[var(--rico-iui-shadow-sm)]">
      {items.map((item, idx) => {
        const title = String(item.title ?? `Item ${idx + 1}`);
        const subtitle = item.subtitle ? String(item.subtitle) : "";
        const badge = item.badge ? String(item.badge) : "";
        const detail = String(item.detail ?? "");
        const actionPrompt = item.actionPrompt ? String(item.actionPrompt) : "";
        const actionLabel =
          normalizeCardActionLabel(item.actionLabel) ||
          (actionPrompt ? "Explore" : "");
        const url = resolveOfficialUrl(
          title,
          item.url ?? item.link ?? item.website ?? item.href
        );
        const tags = Array.isArray(item.tags) ? item.tags.map(String).filter(Boolean) : [];
        const isOpen = Boolean(openIndices[idx]);

        return (
          <div key={idx}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggleItem(idx)}
              className="w-full px-4 py-3 flex items-center justify-between gap-2.5 text-left hover:bg-[var(--rico-iui-hover)] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0285ff]/40"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13.5px] font-semibold text-[var(--rico-iui-ink)]">
                    {title}
                  </span>
                  {badge && (
                    <span className="px-2 py-0.5 rounded-full bg-[var(--rico-iui-badge-neutral)] text-[11px] font-mono font-medium tabular-nums text-[var(--rico-iui-ink)]">
                      {badge}
                    </span>
                  )}
                </div>
                {subtitle && (
                  <div className="text-[12px] text-[var(--rico-iui-muted)] truncate mt-0.5">
                    {subtitle}
                  </div>
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[var(--rico-iui-muted)] shrink-0 transition-transform duration-150 ${
                  isOpen ? "rotate-180 text-[var(--rico-iui-ink)]" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-4 pb-3.5 pt-1 space-y-2.5 bg-[var(--rico-iui-surface)]">
                {detail && (
                  <p className="m-0 text-[13px] text-[var(--rico-iui-muted)] leading-relaxed">
                    {detail}
                  </p>
                )}
                {tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {tags.map((t, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded-[6px] bg-[var(--rico-iui-canvas)] border border-[var(--rico-iui-border)] text-[11px] text-[var(--rico-iui-muted)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {(actionPrompt || url) && (
                  <div className="flex items-center gap-2 pt-0.5">
                    {url && (
                      <>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Open ${url} in new tab`}
                          className="h-7 px-2.5 rounded-[8px] border border-[var(--rico-iui-border-strong)] bg-[var(--rico-iui-canvas)] hover:bg-[var(--rico-iui-hover)] text-[11.5px] font-medium text-[var(--rico-iui-ink)] inline-flex items-center gap-1"
                        >
                          <span>Website</span>
                          <ExternalLink className="w-3 h-3 text-[#0285ff]" />
                        </a>
                        <button
                          type="button"
                          title={`Inspect ${url} in Rico Browser`}
                          onClick={() =>
                            onAction?.({
                              type: "open_workspace",
                              humanFriendlyMessage: `Inspect ${title} in Browser`,
                              params: { tool: "browser", url },
                            })
                          }
                          className="h-7 px-2.5 rounded-[8px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] hover:bg-[var(--rico-iui-hover)] text-[11.5px] font-medium text-[var(--rico-iui-ink)] inline-flex items-center gap-1"
                        >
                          <Globe className="w-3 h-3 text-[#0285ff]" />
                          <span>Inspect</span>
                        </button>
                      </>
                    )}
                    {actionPrompt && actionLabel && (
                      <button
                        type="button"
                        onClick={() =>
                          onAction?.({
                            type: "continue_conversation",
                            humanFriendlyMessage: actionPrompt,
                          })
                        }
                        className="h-7 px-2.5 rounded-[8px] bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)] hover:opacity-90 text-[11.5px] font-medium inline-flex items-center gap-1"
                      >
                        <span>{actionLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ProgramCatalogWidget({
  title,
  subtitle,
  badge,
  items,
  onAction,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  items: Array<Record<string, unknown>>;
  onAction?: (ev: RicoUIActionEvent) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const normalized = useMemo(
    () =>
      items.map((raw, idx) => {
        const name = String(raw.name ?? raw.title ?? `Program ${idx + 1}`);
        const actionPrompt = raw.actionPrompt ? String(raw.actionPrompt).trim() : "";
        const actionLabel = normalizeCardActionLabel(raw.actionLabel);
        return {
          id: idx,
          name,
          category: String(raw.category ?? "General"),
          value: String(raw.value ?? ""),
          badge: raw.badge ? String(raw.badge) : "",
          summary: String(raw.summary ?? raw.detail ?? ""),
          eligibility: raw.eligibility ? String(raw.eligibility) : "",
          url: resolveOfficialUrl(
            name,
            raw.url ?? raw.link ?? raw.website ?? raw.href
          ),
          actionLabel,
          actionPrompt,
        };
      }),
    [items]
  );

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of normalized) {
      counts.set(it.category, (counts.get(it.category) ?? 0) + 1);
    }
    return Array.from(counts.entries());
  }, [normalized]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return normalized.filter((it) => {
      if (selectedCategory !== "ALL" && it.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q) ||
        it.value.toLowerCase().includes(q) ||
        it.summary.toLowerCase().includes(q) ||
        it.eligibility.toLowerCase().includes(q)
      );
    });
  }, [normalized, selectedCategory, searchQuery]);

  return (
    <div className="rico-card-enter rounded-[14px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] overflow-hidden shadow-[var(--rico-iui-shadow-sm)]">
      {/* Header + Search + Segmented Category Filter */}
      <div className="px-4 py-3.5 border-b border-[var(--rico-iui-border)] bg-[var(--rico-iui-surface)] space-y-2.5">
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="m-0 text-[14px] font-semibold tracking-[-0.015em] text-[var(--rico-iui-ink)]">
                {title}
              </h3>
              {badge && (
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium tabular-nums"
                  style={{
                    background: "var(--rico-iui-badge-success-soft)",
                    color: "var(--rico-iui-badge-success)",
                  }}
                >
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="m-0 mt-0.5 text-[12.5px] text-[var(--rico-iui-muted)]">{subtitle}</p>
            )}
          </div>

          {normalized.length >= 4 && (
            <div className="relative flex items-center w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-[var(--rico-iui-muted)] absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                aria-label="Filter programs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search programs..."
                className="w-full h-7 pl-7 pr-2.5 rounded-[8px] border border-[var(--rico-iui-border-strong)] bg-[var(--rico-iui-canvas)] text-[12px] text-[var(--rico-iui-ink)] placeholder:text-[var(--rico-iui-muted)] focus:outline-none focus:border-[#0285ff]"
              />
            </div>
          )}
        </div>

        {categories.length >= 2 && (
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-[10px] bg-[var(--rico-iui-pressed)]">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`h-6 px-2.5 rounded-[7px] text-[11.5px] font-medium inline-flex items-center gap-1.5 transition-colors duration-100 ${
                selectedCategory === "ALL"
                  ? "bg-[var(--rico-iui-canvas)] text-[var(--rico-iui-ink)] shadow-[var(--rico-iui-shadow-sm)]"
                  : "text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)]"
              }`}
            >
              <span>All</span>
              <span className="font-mono tabular-nums text-[10.5px]">
                {normalized.length}
              </span>
            </button>
            {categories.map(([cat, count]) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-6 px-2.5 rounded-[7px] text-[11.5px] font-medium inline-flex items-center gap-1.5 transition-colors duration-100 ${
                    active
                      ? "bg-[var(--rico-iui-canvas)] text-[var(--rico-iui-ink)] shadow-[var(--rico-iui-shadow-sm)]"
                      : "text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)]"
                  }`}
                >
                  <span>{cat}</span>
                  <span className="font-mono tabular-nums text-[10.5px]">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="px-4 py-6 text-center space-y-2">
          <div className="text-[13px] text-[var(--rico-iui-muted)]">
            No programs match &ldquo;{searchQuery || selectedCategory}&rdquo;.
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("ALL");
              setSearchQuery("");
            }}
            className="h-7 px-3 rounded-[8px] border border-[var(--rico-iui-border-strong)] bg-[var(--rico-iui-surface)] hover:bg-[var(--rico-iui-pressed)] text-[12px] font-medium text-[var(--rico-iui-ink)]"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="p-3 grid grid-cols-1 xl:grid-cols-2 gap-2.5">
          {filtered.map((prog) => {
            const isZeroEquity = /0%\s*equity|no\s*equity|credits?|waiver/i.test(
              `${prog.value} ${prog.badge}`
            );

            return (
              <div
                key={prog.id}
                className="rounded-[12px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] p-3.5 flex flex-col justify-between gap-2.5 hover:border-[var(--rico-iui-border-strong)] transition-colors duration-150"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--rico-iui-ink)] leading-snug">
                        {prog.name}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <span className="px-2 py-0.5 rounded-full bg-[var(--rico-iui-badge-neutral)] text-[10.5px] font-medium text-[var(--rico-iui-muted)]">
                          {prog.category}
                        </span>
                        {prog.badge && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10.5px] font-medium"
                            style={{
                              background: "var(--rico-iui-purple-soft)",
                              color: "var(--rico-iui-purple)",
                            }}
                          >
                            {prog.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    {prog.value && (
                      <span
                        className="shrink-0 px-2.5 py-0.5 rounded-[7px] font-mono tabular-nums text-[11.5px] font-semibold"
                        style={
                          isZeroEquity
                            ? {
                                background: "var(--rico-iui-badge-success-soft)",
                                color: "var(--rico-iui-badge-success)",
                              }
                            : {
                                background: "var(--rico-iui-badge-neutral)",
                                color: "var(--rico-iui-ink)",
                              }
                        }
                      >
                        {prog.value}
                      </span>
                    )}
                  </div>

                  {prog.summary && (
                    <p className="m-0 text-[12.5px] text-[var(--rico-iui-muted)] leading-relaxed">
                      {prog.summary}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--rico-iui-border)] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[var(--rico-iui-faint)] truncate">
                    {prog.eligibility ? `Fit: ${prog.eligibility}` : prog.category}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      aria-label={`Copy ${prog.name} summary`}
                      title="Copy details"
                      onClick={() => {
                        if (typeof navigator !== "undefined" && navigator.clipboard) {
                          void navigator.clipboard.writeText(
                            `${prog.name} (${prog.value}): ${prog.summary}`
                          );
                          setCopiedIdx(prog.id);
                          setTimeout(() => setCopiedIdx(null), 1500);
                        }
                      }}
                      className="w-7 h-7 rounded-[7px] bg-[var(--rico-iui-surface)] hover:bg-[var(--rico-iui-pressed)] flex items-center justify-center text-[var(--rico-iui-muted)] transition-colors"
                    >
                      {copiedIdx === prog.id ? (
                        <Check className="w-3.5 h-3.5 text-[#00a67d]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {prog.url && (
                      <>
                        <a
                          href={prog.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Open ${prog.url} in new tab`}
                          className="h-7 px-2.5 rounded-[7px] border border-[var(--rico-iui-border-strong)] bg-[var(--rico-iui-canvas)] hover:bg-[var(--rico-iui-hover)] text-[11.5px] font-medium text-[var(--rico-iui-ink)] inline-flex items-center gap-1"
                        >
                          <span>Website</span>
                          <ExternalLink className="w-3 h-3 text-[#0285ff]" />
                        </a>
                        <button
                          type="button"
                          title={`Inspect ${prog.url} live in Rico Browser`}
                          onClick={() =>
                            onAction?.({
                              type: "open_workspace",
                              humanFriendlyMessage: `Inspect ${prog.name} in Browser`,
                              params: { tool: "browser", url: prog.url },
                            })
                          }
                          className="h-7 px-2.5 rounded-[7px] bg-[var(--rico-iui-surface)] hover:bg-[var(--rico-iui-pressed)] text-[11.5px] font-medium text-[var(--rico-iui-ink)] inline-flex items-center gap-1 transition-colors"
                        >
                          <Globe className="w-3 h-3 text-[#0285ff]" />
                          <span>Inspect</span>
                        </button>
                      </>
                    )}

                    {prog.actionPrompt && prog.actionLabel && (
                      <button
                        type="button"
                        onClick={() =>
                          onAction?.({
                            type: "continue_conversation",
                            humanFriendlyMessage: prog.actionPrompt,
                          })
                        }
                        className="h-7 px-2.5 rounded-[7px] bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)] hover:opacity-90 text-[11.5px] font-medium inline-flex items-center gap-1 transition-opacity"
                      >
                        <span>{prog.actionLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
