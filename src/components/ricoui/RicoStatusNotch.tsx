"use client";

import React, {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  BarChart3,
  FileSpreadsheet,
  FileText,
  Layers,
  LayoutDashboard,
  Target,
  TrendingUp,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

/* ============================================================================
 * 1. Concave-Filleted Live Status Notch (for Live SQLite/Postgres Dashboards)
 * ========================================================================== */

const NOTCH_TINT = "color-mix(in srgb, #38bdf8 16%, var(--background))";

export function RicoStatusNotch({
  show,
  icon,
  label,
}: {
  show: boolean;
  icon?: ReactNode;
  label: string;
}) {
  const [mounted, setMounted] = useState(show);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      setLeaving(false);
      return;
    }
    if (!mounted) return;
    setLeaving(true);
    const timer = window.setTimeout(() => {
      setMounted(false);
      setLeaving(false);
    }, 260);
    return () => window.clearTimeout(timer);
  }, [show, mounted]);

  if (!mounted || !label) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center transition-opacity duration-200 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      style={{ "--rico-notch": NOTCH_TINT } as CSSProperties}
    >
      <div className="h-[3px] w-full bg-[var(--rico-notch)]" />
      <div
        className={`relative flex transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          leaving ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <span
          aria-hidden="true"
          className="absolute top-0 right-full w-2.5 h-2.5"
          style={{
            background:
              "radial-gradient(circle at 0 100%, transparent 10px, var(--rico-notch) 10.5px)",
          }}
        />
        <span className="inline-flex items-center gap-1.5 rounded-b-lg bg-[var(--rico-notch)] px-3 pt-0.5 pb-1 text-[11.5px] font-medium text-[#0284c7] dark:text-[#38bdf8]">
          {icon ?? <Zap className="w-3 h-3" />}
          <span>{label}</span>
        </span>
        <span
          aria-hidden="true"
          className="absolute top-0 left-full w-2.5 h-2.5"
          style={{
            background:
              "radial-gradient(circle at 100% 100%, transparent 10px, var(--rico-notch) 10.5px)",
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================================
 * 2. Peeking Follow-Up Card Fan (expands smoothly on hover/focus)
 * ========================================================================== */

function pickFollowUpIcon(text: string): LucideIcon {
  if (/\b(excel|sheet|tracker|formula|matrix)\b/i.test(text)) return FileSpreadsheet;
  if (/\b(doc|draft|memo|policy|application)\b/i.test(text)) return FileText;
  if (/\b(dashboard|board|kpi)\b/i.test(text)) return LayoutDashboard;
  if (/\b(compare|vs|versus)\b/i.test(text)) return Layers;
  if (/\b(runway|burn|trend|mrr|arr)\b/i.test(text)) return TrendingUp;
  if (/\b(rule|cap|ceiling|guardrail)\b/i.test(text)) return Target;
  if (/\b(startup|program|credit|accelerator|best|top)\b/i.test(text)) return Trophy;
  return BarChart3;
}

export function RicoFollowUpFan({
  items,
  onSelect,
}: {
  items: Array<{
    label: string;
    prompt?: string;
    tool?: string;
    url?: string;
  }>;
  onSelect: (item: {
    label: string;
    prompt?: string;
    tool?: string;
    url?: string;
  }) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  const visible = items.slice(0, 4);
  const count = visible.length;
  if (count === 0) return null;

  if (count === 1) {
    const single = visible[0];
    const IconComp = pickFollowUpIcon(`${single.label} ${single.prompt ?? ""}`);
    return (
      <div className="pt-1">
        <button
          type="button"
          onClick={() => onSelect(single)}
          className="group flex w-full max-w-md h-9 items-center gap-2.5 rounded-[10px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] px-3 text-[13px] font-medium text-[var(--rico-iui-ink)] shadow-[var(--rico-iui-shadow-sm)] hover:border-[var(--rico-iui-border-strong)] hover:bg-[var(--rico-iui-hover)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40"
        >
          <IconComp className="w-3.5 h-3.5 shrink-0 text-[var(--rico-iui-muted)]" />
          <span className="min-w-0 flex-1 truncate text-left">{single.label}</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0 text-[var(--rico-iui-muted)] transition-transform duration-150 group-hover:translate-x-0.5" />
        </button>
      </div>
    );
  }

  const ROW_H = 36;
  const GAP = 6;
  const PEEK = 7;
  const restHeight = ROW_H + (count - 1) * PEEK;
  const openHeight = count * (ROW_H + GAP) - GAP;

  return (
    <div
      className="pt-2 max-w-md"
      onMouseEnter={() => {
        if (closeTimer.current) window.clearTimeout(closeTimer.current);
        if (openTimer.current) window.clearTimeout(openTimer.current);
        openTimer.current = window.setTimeout(() => setExpanded(true), 90);
      }}
      onMouseLeave={() => {
        if (openTimer.current) window.clearTimeout(openTimer.current);
        if (closeTimer.current) window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => setExpanded(false), 140);
      }}
      onFocus={() => setExpanded(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setExpanded(false);
        }
      }}
    >
      <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-[var(--rico-iui-muted)] px-0.5">
        <span>Suggested next steps</span>
        {!expanded && count > 1 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-[11px] text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)]"
          >
            +{count - 1} more
          </button>
        )}
      </div>

      <div
        className="relative transition-[height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ height: expanded ? openHeight : restHeight }}
      >
        {visible.map((item, idx) => {
          const lift = expanded ? (count - 1 - idx) * (ROW_H + GAP) : idx * PEEK;
          const scale = expanded ? 1 : 1 - idx * 0.035;
          const IconComp = pickFollowUpIcon(
            `${item.label} ${item.prompt ?? ""} ${item.tool ?? ""}`
          );
          return (
            <button
              key={`${item.label}-${idx}`}
              type="button"
              onClick={() => onSelect(item)}
              style={
                {
                  transform: `translateY(-${lift}px) scale(${scale})`,
                  transformOrigin: "bottom center",
                  zIndex: count - idx,
                  transitionDelay: `${idx * 20}ms`,
                } as CSSProperties
              }
              className="group absolute inset-x-0 bottom-0 flex h-9 items-center gap-2.5 overflow-hidden rounded-[10px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] px-3 text-[13px] font-medium text-[var(--rico-iui-ink)] shadow-[var(--rico-iui-shadow-sm)] transition-[transform,border-color,background-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[var(--rico-iui-border-strong)] hover:bg-[var(--rico-iui-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40"
            >
              <IconComp className="w-3.5 h-3.5 shrink-0 text-[#0285ff]" />
              <span className="min-w-0 flex-1 truncate text-left">
                {item.label}
              </span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0 text-[var(--rico-iui-muted)] opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-0.5 group-hover:opacity-100" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
