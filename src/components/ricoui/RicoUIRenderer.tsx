"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  Check,
  Copy,
  Loader2,
  RotateCcw,
  Search,
} from "lucide-react";
import { parseRicoUI } from "@/lib/ricoui/parser";
import type {
  RicoUIActionChain,
  RicoUIActionEvent,
  RicoUIActionStep,
  RicoUIEvaluatedNode,
  RicoUIToolProvider,
} from "@/lib/ricoui/types";

export interface RicoUIRendererProps {
  response: string;
  isStreaming?: boolean;
  initialState?: Record<string, unknown>;
  interpreterUrl?: string;
  dashboardId?: string;
  toolProvider?: RicoUIToolProvider;
  refreshSignal?: number;
  onAction?: (event: RicoUIActionEvent) => void;
  onStateUpdate?: (state: Record<string, unknown>) => void;
  onFetchStateChange?: (fetching: boolean) => void;
  formatPlainText?: (text: string) => string;
}

/**
 * Restrained, high-craft financial data series palette (zero neon/pink/purple AI-slop).
 * Anchored in Rico Cobalt, Deep Ink, Emerald, Slate, and Warm Amber.
 */
const SERIES_PALETTE = [
  "#034CFF", // Rico Cobalt (primary series)
  "#10B981", // Verified Emerald
  "#1E1B1B", // Deep Ink
  "#F59E0B", // Caution Amber
  "#64748B", // Cool Slate
];

function defaultFormatPlain(text: string): string {
  if (!text) return "";
  return text
    .replace(/^(\s*)\*+(\s*)/gm, "$1- $2")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^(\s*)\*+\s*/gm, "$1")
    .replace(/\s*\*+\s*$/gm, "")
    .replace(/^\*+/, "")
    .replace(/\*+$/, "");
}

function fmtUsd(n: number): string {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function RicoUIRenderer({
  response,
  isStreaming = false,
  initialState,
  interpreterUrl,
  dashboardId,
  toolProvider,
  refreshSignal = 0,
  onAction,
  onStateUpdate,
  onFetchStateChange,
  formatPlainText = defaultFormatPlain,
}: RicoUIRendererProps) {
  const [userState, setUserState] = useState<Record<string, unknown>>(
    initialState ?? {}
  );
  const [queryData, setQueryData] = useState<Record<string, unknown>>({});
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});
  const [tableSearch, setTableSearch] = useState<Record<string, string>>({});
  const [tableSort, setTableSort] = useState<
    Record<string, { key: string; dir: "asc" | "desc" }>
  >({});
  const [hoveredBarIdx, setHoveredBarIdx] = useState<Record<string, number | null>>({});
  const [hoveredDonutIdx, setHoveredDonutIdx] = useState<Record<string, number | null>>({});
  const [hoveredLineIdx, setHoveredLineIdx] = useState<Record<string, number | null>>({});

  const parsed = useMemo(
    () =>
      parseRicoUI(response, {
        isStreaming,
        stateOverrides: userState,
        queryData,
      }),
    [response, isStreaming, userState, queryData]
  );

  const initialStateRef = useRef<Record<string, unknown>>({});
  initialStateRef.current = parsed.initialState;

  const updateBinding = useCallback(
    (varName: string, nextVal: unknown) => {
      setUserState((prev) => {
        const next = { ...prev, [varName]: nextVal };
        onStateUpdate?.(next);
        return next;
      });
    },
    [onStateUpdate]
  );

  const latestQueriesRef = useRef(parsed.queries);
  latestQueriesRef.current = parsed.queries;
  const queryRequestSeqRef = useRef(0);

  const queriesSignature = useMemo(() => {
    if (isStreaming || parsed.queries.length === 0) return "";
    return JSON.stringify(
      parsed.queries.map((q) => ({ id: q.id, tool: q.tool, args: q.args }))
    );
  }, [isStreaming, parsed.queries]);

  const runLiveQueries = useCallback(async () => {
    if (!queriesSignature) return;
    const queries = latestQueriesRef.current;
    if (queries.length === 0) return;
    if (!interpreterUrl && !toolProvider) return;

    const seq = ++queryRequestSeqRef.current;
    onFetchStateChange?.(true);
    try {
      if (interpreterUrl) {
        const res = await fetch(interpreterUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dashboardId,
            queries: queries.map((q) => ({
              id: q.id,
              tool: q.tool,
              args: q.args,
            })),
          }),
        });
        if (seq !== queryRequestSeqRef.current) return;
        if (res.ok) {
          const payload = await res.json();
          if (seq !== queryRequestSeqRef.current) return;
          if (payload?.result?.results) {
            setQueryData((prev) => ({ ...prev, ...payload.result.results }));
          }
        }
      } else if (toolProvider) {
        const entries = await Promise.all(
          queries.map(async (q) => {
            const handler = toolProvider[q.tool];
            if (!handler) return [q.id, q.defaults] as const;
            try {
              const out = await handler(q.args);
              return [q.id, out] as const;
            } catch {
              return [q.id, q.defaults] as const;
            }
          })
        );
        if (seq !== queryRequestSeqRef.current) return;
        setQueryData((prev) => ({
          ...prev,
          ...Object.fromEntries(entries),
        }));
      }
    } catch {
      // Keep fallback defaults on offline/network error
    } finally {
      if (seq === queryRequestSeqRef.current) {
        onFetchStateChange?.(false);
      }
    }
  }, [
    queriesSignature,
    interpreterUrl,
    dashboardId,
    toolProvider,
    onFetchStateChange,
  ]);

  useEffect(() => {
    if (!queriesSignature) return;
    void runLiveQueries();
  }, [queriesSignature, refreshSignal, runLiveQueries]);

  const minRefreshSeconds = useMemo(() => {
    const intervals = parsed.queries
      .map((q) => q.refreshSeconds)
      .filter((s): s is number => typeof s === "number" && s >= 5);
    return intervals.length > 0 ? Math.min(...intervals) : null;
  }, [parsed.queries]);

  useEffect(() => {
    if (!minRefreshSeconds || isStreaming) return;
    const timer = setInterval(() => {
      void runLiveQueries();
    }, minRefreshSeconds * 1000);
    return () => clearInterval(timer);
  }, [minRefreshSeconds, isStreaming, runLiveQueries]);

  const executeActionPayload = useCallback(
    (rawAction: unknown) => {
      if (!rawAction || typeof rawAction !== "object") return;

      const runStep = (step: RicoUIActionStep) => {
        switch (step.name) {
          case "Set": {
            const rawVar = String(step.args[0] ?? "").replace(/^\$/, "");
            if (rawVar) updateBinding(rawVar, step.args[1]);
            break;
          }
          case "Reset": {
            const rawVar = String(step.args[0] ?? "").replace(/^\$/, "");
            if (rawVar) {
              updateBinding(rawVar, initialStateRef.current[rawVar] ?? null);
            }
            break;
          }
          case "Run": {
            void runLiveQueries();
            break;
          }
          case "ToRico": {
            const message = String(step.args[0] ?? "").trim();
            if (message) {
              onAction?.({
                type: "continue_conversation",
                humanFriendlyMessage: message,
                params:
                  step.args[1] && typeof step.args[1] === "object"
                    ? (step.args[1] as Record<string, unknown>)
                    : undefined,
                formState: userState,
              });
            }
            break;
          }
          case "OpenUrl": {
            const url = String(step.args[0] ?? "").trim();
            if (url) {
              onAction?.({
                type: "open_url",
                humanFriendlyMessage: `Open ${url}`,
                params: { url },
              });
            }
            break;
          }
          case "OpenWorkspace": {
            const tool = String(step.args[0] ?? "doc").toLowerCase();
            const url = step.args[1] ? String(step.args[1]) : undefined;
            onAction?.({
              type: "open_workspace",
              humanFriendlyMessage: `Open ${tool}`,
              params: { tool, url },
            });
            break;
          }
          case "StageMandate": {
            const service = String(step.args[0] ?? "");
            const ceiling = Number(step.args[1] ?? 20);
            const recurrence = String(step.args[2] ?? "Monthly on 1st");
            const category = String(step.args[3] ?? "Software & Cloud");
            onAction?.({
              type: "stage_mandate",
              humanFriendlyMessage: `Configure spending rule for ${service}`,
              params: { service, ceiling, recurrence, category },
            });
            break;
          }
          case "CreateMandateDirect": {
            const service = String(step.args[0] ?? "");
            const ceiling = Number(step.args[1] ?? 20);
            const recurrence = String(step.args[2] ?? "Monthly on 1st");
            onAction?.({
              type: "create_mandate_direct",
              humanFriendlyMessage: `Create a rule for ${service}, max $${ceiling.toFixed(2)} ${recurrence}`,
              params: { service, ceiling, recurrence },
            });
            break;
          }
          case "TriggerMandateQuote": {
            const mandateId = String(step.args[0] ?? "");
            if (mandateId) {
              onAction?.({
                type: "trigger_mandate_quote",
                humanFriendlyMessage: "Review payment quote",
                params: { mandateId },
              });
            }
            break;
          }
          case "OpenDashboard": {
            const id = String(step.args[0] ?? "");
            onAction?.({
              type: "open_dashboard",
              humanFriendlyMessage: "Open live dashboard",
              params: { dashboardId: id },
            });
            break;
          }
          case "CopyText": {
            const text = String(step.args[0] ?? "");
            if (text && typeof navigator !== "undefined" && navigator.clipboard) {
              void navigator.clipboard.writeText(text);
            }
            onAction?.({
              type: "copy_text",
              humanFriendlyMessage: "Copied to clipboard",
              params: { text },
            });
            break;
          }
        }
      };

      if ((rawAction as RicoUIActionStep).kind === "action_step") {
        runStep(rawAction as RicoUIActionStep);
      } else if ((rawAction as RicoUIActionChain).kind === "action_chain") {
        for (const st of (rawAction as RicoUIActionChain).steps) {
          runStep(st);
        }
      }
    },
    [onAction, runLiveQueries, updateBinding, userState]
  );

  const renderNodeList = (rawChildren: unknown, keyPrefix: string): React.ReactNode => {
    if (!Array.isArray(rawChildren)) return null;
    return rawChildren.map((child, idx) =>
      child && typeof child === "object" && (child as RicoUIEvaluatedNode).kind === "element"
        ? renderElement(child as RicoUIEvaluatedNode, `${keyPrefix}-${idx}`)
        : null
    );
  };

  const renderElement = (
    node: RicoUIEvaluatedNode,
    reactKey: string
  ): React.ReactNode => {
    const p = node.props;
    const nodeKey = node.id || reactKey;

    switch (node.component) {
      case "Stack": {
        const dir = p.direction === "horizontal" ? "flex-row flex-wrap items-center" : "flex-col";
        const gap =
          p.gap === "sm" ? "gap-2" : p.gap === "lg" ? "gap-4" : "gap-3";
        return (
          <div key={nodeKey} className={`flex ${dir} ${gap} w-full min-w-0`}>
            {renderNodeList(p.children, nodeKey)}
          </div>
        );
      }

      case "Grid": {
        const cols = Number(p.columns ?? 3);
        const gridCols =
          cols <= 1
            ? "grid-cols-1"
            : cols === 2
            ? "grid-cols-1 xl:grid-cols-2"
            : cols === 4
            ? "grid-cols-1 min-[400px]:grid-cols-2 xl:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-3";
        return (
          <div key={nodeKey} className={`grid ${gridCols} gap-2.5 w-full min-w-0`}>
            {renderNodeList(p.children, nodeKey)}
          </div>
        );
      }

      case "Card": {
        const title = p.title ? String(p.title) : "";
        const subtitle = p.subtitle ? String(p.subtitle) : "";
        const badge = p.badge ? String(p.badge) : "";
        const tone = String(p.badgeTone ?? "neutral");

        const badgeClass =
          tone === "success"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : tone === "warning"
            ? "bg-amber-50 text-amber-800 border-amber-200"
            : tone === "danger"
            ? "bg-rose-50 text-rose-700 border-rose-200"
            : tone === "accent"
            ? "bg-[#034CFF]/8 text-[#034CFF] border-[#034CFF]/20"
            : "bg-[#F8F7F7] text-[#5C5858] border-[#E6E4E3]";

        const dotClass =
          tone === "success"
            ? "bg-emerald-500 rico-live-dot"
            : tone === "warning"
            ? "bg-amber-500"
            : tone === "danger"
            ? "bg-rose-500"
            : tone === "accent"
            ? "bg-[#034CFF]"
            : "";

        return (
          <section
            key={nodeKey}
            className="rico-card-enter rounded-xl border border-[#E6E4E3] bg-white p-4 space-y-3 shadow-[0_1px_3px_rgba(30,27,27,0.03)]"
          >
            {(title || subtitle || badge) && (
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0">
                  {title && (
                    <h3 className="m-0 text-[13.5px] font-semibold tracking-[-0.015em] text-[#1E1B1B]">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="m-0 mt-0.5 text-[12px] text-[#5C5858] leading-snug">
                      {subtitle}
                    </p>
                  )}
                </div>
                {badge && (
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full border text-[11px] font-mono font-medium tabular-nums inline-flex items-center gap-1.5 ${badgeClass}`}
                  >
                    {dotClass && <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />}
                    {badge}
                  </span>
                )}
              </div>
            )}
            <div className="space-y-2.5">{renderNodeList(p.children, nodeKey)}</div>
          </section>
        );
      }

      case "Header": {
        return (
          <div
            key={nodeKey}
            className="flex items-center justify-between gap-2 pb-1"
          >
            <div className="min-w-0">
              <h3 className="m-0 text-[14px] font-semibold tracking-[-0.015em] text-[#1E1B1B]">
                {String(p.title ?? "")}
              </h3>
              {Boolean(p.subtitle) && (
                <p className="m-0 text-[12px] text-[#5C5858]">
                  {String(p.subtitle)}
                </p>
              )}
            </div>
            {Boolean(p.badge) && (
              <span className="px-2 py-0.5 rounded-full bg-[#F8F7F7] border border-[#E6E4E3] text-[11px] font-mono text-[#5C5858]">
                {String(p.badge)}
              </span>
            )}
          </div>
        );
      }

      case "TextBlock": {
        const tone = String(p.tone ?? "base");
        const cls =
          tone === "strong"
            ? "text-[#1E1B1B] font-medium text-[13.5px]"
            : tone === "muted"
            ? "text-[#8A8585] text-[12px]"
            : tone === "mono"
            ? "text-[#1E1B1B] font-mono tabular-nums text-[12px] bg-[#F8F7F7] border border-[#E6E4E3] rounded-lg px-3.5 py-2.5"
            : "text-[#1E1B1B] text-[13.5px] leading-[1.6]";
        return (
          <p key={nodeKey} className={`m-0 whitespace-pre-wrap ${cls}`}>
            {String(p.text ?? "")}
          </p>
        );
      }

      case "Callout": {
        const tone = String(p.tone ?? "info");
        const styles =
          tone === "success"
            ? {
                wrap: "bg-white border-[#E6E4E3] border-l-[3px] border-l-emerald-500",
                dot: "bg-emerald-500",
              }
            : tone === "warning"
            ? {
                wrap: "bg-amber-50/40 border-amber-200/80 border-l-[3px] border-l-amber-500",
                dot: "bg-amber-500",
              }
            : tone === "danger"
            ? {
                wrap: "bg-rose-50/40 border-rose-200/80 border-l-[3px] border-l-rose-500",
                dot: "bg-rose-500",
              }
            : {
                wrap: "bg-[#F8F7F7] border-[#E6E4E3] border-l-[3px] border-l-[#034CFF]",
                dot: "bg-[#034CFF]",
              };

        return (
          <div
            key={nodeKey}
            className={`rico-card-enter rounded-xl border px-3.5 py-2.5 flex items-start gap-2.5 text-[12.5px] ${styles.wrap}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${styles.dot}`} />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-[#1E1B1B] leading-snug">
                {String(p.title ?? "")}
              </div>
              <div className="text-[#5C5858] mt-0.5 leading-relaxed">
                {String(p.body ?? "")}
              </div>
            </div>
          </div>
        );
      }

      case "Steps": {
        const items = Array.isArray(p.items) ? p.items : [];
        return (
          <div
            key={nodeKey}
            className="rico-card-enter rounded-xl border border-[#E6E4E3] bg-white divide-y divide-[#F1EFEF]"
          >
            {items.map((item, idx) => {
              const isObj = item && typeof item === "object";
              const title = isObj
                ? String((item as Record<string, unknown>).title ?? `Step ${idx + 1}`)
                : String(item);
              const detail =
                isObj && (item as Record<string, unknown>).detail
                  ? String((item as Record<string, unknown>).detail)
                  : "";
              return (
                <div
                  key={idx}
                  className="px-3.5 py-2.5 flex items-start gap-3 text-[12.5px] hover:bg-[#FCFCFB] transition-colors duration-100"
                >
                  <span className="w-5 h-5 rounded-md bg-[#F8F7F7] border border-[#E6E4E3] text-[#1E1B1B] font-mono text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[#1E1B1B]">{title}</div>
                    {detail && (
                      <div className="text-[#5C5858] text-[12px] mt-0.5">
                        {detail}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case "Tabs": {
        const tabNodes = (Array.isArray(p.items) ? p.items : []).filter(
          (c): c is RicoUIEvaluatedNode =>
            Boolean(c && typeof c === "object" && (c as RicoUIEvaluatedNode).component === "TabItem")
        );
        if (tabNodes.length === 0) return null;
        const defaultId = p.defaultTab
          ? String(p.defaultTab)
          : String(tabNodes[0].props.id ?? "0");
        const selectedId = activeTabs[nodeKey] ?? defaultId;
        const activePane =
          tabNodes.find((t) => String(t.props.id) === selectedId) ?? tabNodes[0];

        return (
          <div key={nodeKey} className="space-y-2.5">
            <div className="inline-flex items-center p-1 rounded-full bg-[#F1EFEF] border border-[#E6E4E3]">
              {tabNodes.map((t, i) => {
                const tid = String(t.props.id ?? i);
                const active = tid === String(activePane.props.id ?? 0);
                return (
                  <button
                    key={tid}
                    type="button"
                    onClick={() =>
                      setActiveTabs((prev) => ({ ...prev, [nodeKey]: tid }))
                    }
                    className={`h-7 px-3 rounded-full text-[12px] font-medium transition-colors duration-100 ${
                      active
                        ? "bg-white text-[#1E1B1B] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                        : "text-[#5C5858] hover:text-[#1E1B1B]"
                    }`}
                  >
                    {String(t.props.label ?? tid)}
                  </button>
                );
              })}
            </div>
            <div>{renderNodeList(activePane.props.children, `${nodeKey}-pane`)}</div>
          </div>
        );
      }

      case "TabItem":
        return (
          <div key={nodeKey}>{renderNodeList(p.children, nodeKey)}</div>
        );

      case "Metric": {
        const trend = String(p.trend ?? "neutral");
        const dotColor =
          trend === "up" || trend === "safe"
            ? "bg-emerald-500"
            : trend === "down" || trend === "warn"
            ? "bg-amber-500"
            : trend === "accent"
            ? "bg-[#034CFF]"
            : "bg-[#D6D3D1]";

        const subColor =
          trend === "up" || trend === "safe"
            ? "text-emerald-700"
            : trend === "down" || trend === "warn"
            ? "text-amber-700"
            : trend === "accent"
            ? "text-[#034CFF]"
            : "text-[#5C5858]";

        return (
          <div
            key={nodeKey}
            className="rico-card-enter rounded-xl border border-[#E6E4E3] bg-white px-3.5 py-3 flex flex-col justify-between gap-1 hover:border-[#D6D3D1] transition-colors duration-100"
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11.5px] font-medium text-[#5C5858] truncate">
                {String(p.label ?? "")}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
            </div>
            <div className="text-[16px] sm:text-[18px] font-semibold font-mono tabular-nums tracking-[-0.02em] text-[#1E1B1B] truncate">
              {String(p.value ?? "—")}
            </div>
            {Boolean(p.sublabel) && (
              <div className={`text-[11px] font-mono tabular-nums truncate ${subColor}`}>
                {String(p.sublabel)}
              </div>
            )}
          </div>
        );
      }

      case "BarChart": {
        const labels = Array.isArray(p.labels) ? p.labels.map(String) : [];
        const values = Array.isArray(p.values)
          ? p.values.map((v) => Number(v) || 0)
          : [];
        const secondary = Array.isArray(p.secondaryValues)
          ? p.secondaryValues.map((v) => Number(v) || 0)
          : null;
        const prefix = String(p.valuePrefix ?? "$");
        const maxVal = Math.max(1, ...values, ...(secondary ?? []));
        const hoveredRow = hoveredBarIdx[nodeKey] ?? null;

        return (
          <div
            key={nodeKey}
            className="rico-card-enter rounded-xl border border-[#E6E4E3] bg-white p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13px] font-semibold tracking-[-0.01em] text-[#1E1B1B]">
                {String(p.title ?? "Comparison")}
              </span>
              {secondary && (
                <div className="flex items-center gap-3 text-[11px] text-[#5C5858]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#034CFF]" />
                    {String(p.primaryLabel ?? "Verified")}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#E6E4E3]" />
                    {String(p.secondaryLabel ?? "Ceiling")}
                  </span>
                </div>
              )}
            </div>

            {labels.length === 0 ? (
              <div className="py-5 text-center text-[12px] text-[#8A8585]">
                No series data yet.
              </div>
            ) : (
              <div className="space-y-2">
                {labels.map((lbl, idx) => {
                  const val = values[idx] ?? 0;
                  const cap = secondary ? secondary[idx] ?? 0 : 0;
                  const pct = Math.min(100, Math.max(val > 0 ? 3 : 0, (val / maxVal) * 100));
                  const capPct = secondary
                    ? Math.min(100, Math.max(cap > 0 ? 3 : 0, (cap / maxVal) * 100))
                    : 0;
                  const overCap = secondary && cap > 0 && val > cap;
                  const utilRatio = secondary && cap > 0 ? Math.round((val / cap) * 100) : null;
                  const dimmed = hoveredRow !== null && hoveredRow !== idx;

                  return (
                    <div
                      key={`${lbl}-${idx}`}
                      onMouseEnter={() =>
                        setHoveredBarIdx((prev) => ({ ...prev, [nodeKey]: idx }))
                      }
                      onMouseLeave={() =>
                        setHoveredBarIdx((prev) => ({ ...prev, [nodeKey]: null }))
                      }
                      className={`rounded-lg px-2 py-1.5 -mx-2 cursor-default transition-opacity duration-150 ${
                        dimmed ? "opacity-45" : "opacity-100 bg-transparent hover:bg-[#F8F7F7]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[12px] gap-2 mb-1">
                        <span className="text-[#1E1B1B] font-medium truncate">
                          {lbl}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0 font-mono tabular-nums text-[11.5px]">
                          <span className="font-semibold text-[#1E1B1B]">
                            {prefix}
                            {val.toLocaleString("en-US", {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          {secondary && cap > 0 && (
                            <span className="text-[#8A8585]">
                              / {prefix}
                              {cap.toLocaleString("en-US", {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          )}
                          {utilRatio !== null && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                                overCap
                                  ? "bg-rose-50 text-rose-700"
                                  : utilRatio >= 85
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {utilRatio}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="relative h-2 rounded-full bg-[#F1EFEF] overflow-hidden">
                        {secondary && cap > 0 && (
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-[#E2E0DF]"
                            style={{ width: `${capPct}%` }}
                          />
                        )}
                        <div
                          className={`relative h-full rounded-full ${
                            overCap ? "bg-rose-500" : "bg-[#034CFF]"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      case "LineChart": {
        const labels = Array.isArray(p.labels) ? p.labels.map(String) : [];
        const values = Array.isArray(p.values)
          ? p.values.map((v) => Number(v) || 0)
          : [];
        const prefix = String(p.valuePrefix ?? "$");
        const maxVal = Math.max(1, ...values);
        const minVal = Math.min(0, ...values);
        const span = Math.max(1, maxVal - minVal);
        const width = 420;
        const height = 116;
        const padX = 18;
        const padY = 16;

        const pts = values.map((v, idx) => {
          const x =
            values.length <= 1
              ? width / 2
              : padX + (idx / (values.length - 1)) * (width - padX * 2);
          const y =
            height - padY - ((v - minVal) / span) * (height - padY * 2);
          return { x, y, v, label: labels[idx] ?? `${idx + 1}` };
        });

        const polyline = pts.map((pt) => `${pt.x},${pt.y}`).join(" ");
        const areaPoints =
          pts.length > 0
            ? `${pts[0].x},${height - padY} ${polyline} ${
                pts[pts.length - 1].x
              },${height - padY}`
            : "";
        const gradId = `rico-area-${nodeKey.replace(/[^a-zA-Z0-9]/g, "")}`;
        const activeIdx = hoveredLineIdx[nodeKey] ?? null;
        const activePt = activeIdx !== null ? pts[activeIdx] : pts[pts.length - 1];

        return (
          <div
            key={nodeKey}
            className="rico-card-enter rounded-xl border border-[#E6E4E3] bg-white p-4 space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold tracking-[-0.01em] text-[#1E1B1B]">
                {String(p.title ?? "Trend")}
              </span>
              {activePt && (
                <span className="px-2 py-0.5 rounded-md bg-[#F8F7F7] border border-[#E6E4E3] text-[11px] font-mono font-medium tabular-nums text-[#1E1B1B]">
                  {activePt.label}:{" "}
                  <strong className="text-[#034CFF]">
                    {prefix}
                    {activePt.v.toLocaleString("en-US")}
                  </strong>
                </span>
              )}
            </div>
            {pts.length === 0 ? (
              <div className="py-5 text-center text-[12px] text-[#8A8585]">
                No trend data available.
              </div>
            ) : (
              <>
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  className="w-full h-28 overflow-visible"
                >
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#034CFF" stopOpacity="0.14" />
                      <stop offset="100%" stopColor="#034CFF" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <line
                    x1={padX}
                    y1={height - padY}
                    x2={width - padX}
                    y2={height - padY}
                    stroke="var(--rico-border-weak)"
                  />
                  {areaPoints && (
                    <polygon points={areaPoints} fill={`url(#${gradId})`} />
                  )}
                  {activeIdx !== null && pts[activeIdx] && (
                    <line
                      x1={pts[activeIdx].x}
                      y1={padY / 2}
                      x2={pts[activeIdx].x}
                      y2={height - padY}
                      stroke="var(--rico-accent)"
                      strokeOpacity="0.25"
                      strokeDasharray="2 2"
                    />
                  )}
                  <polyline
                    fill="none"
                    stroke="var(--rico-accent)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polyline}
                  />
                  {pts.map((pt, i) => {
                    const hovered = activeIdx === i;
                    return (
                      <circle
                        key={i}
                        cx={pt.x}
                        cy={pt.y}
                        r={hovered ? 5 : 3.2}
                        fill={
                          hovered
                            ? "var(--rico-accent)"
                            : "var(--rico-surface-elevated)"
                        }
                        stroke="var(--rico-accent)"
                        strokeWidth="2"
                        className="cursor-pointer"
                        onMouseEnter={() =>
                          setHoveredLineIdx((prev) => ({ ...prev, [nodeKey]: i }))
                        }
                        onMouseLeave={() =>
                          setHoveredLineIdx((prev) => ({ ...prev, [nodeKey]: null }))
                        }
                      />
                    );
                  })}
                </svg>
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-[#8A8585]">
                  <span>
                    {pts[0]?.label}: {prefix}
                    {pts[0]?.v.toLocaleString("en-US")}
                  </span>
                  <span>
                    {pts[pts.length - 1]?.label}: {prefix}
                    {pts[pts.length - 1]?.v.toLocaleString("en-US")}
                  </span>
                </div>
              </>
            )}
          </div>
        );
      }

      case "DonutChart": {
        const rawSegments = Array.isArray(p.segments) ? p.segments : [];
        const segments = rawSegments
          .map((s, idx) => {
            if (!s || typeof s !== "object") return null;
            const rec = s as Record<string, unknown>;
            return {
              label: String(rec.label ?? `Group ${idx + 1}`),
              value: Math.max(0, Number(rec.value) || 0),
              color: SERIES_PALETTE[idx % SERIES_PALETTE.length],
            };
          })
          .filter((x): x is NonNullable<typeof x> => Boolean(x && x.value > 0));

        const total = segments.reduce((sum, s) => sum + s.value, 0);
        const prefix = String(p.valuePrefix ?? "$");
        const radius = 35;
        const circumference = 2 * Math.PI * radius;
        let offsetAcc = 0;
        const hoveredIdx = hoveredDonutIdx[nodeKey] ?? null;

        return (
          <div
            key={nodeKey}
            className="rico-card-enter rounded-xl border border-[#E6E4E3] bg-white p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold tracking-[-0.01em] text-[#1E1B1B]">
                {String(p.title ?? "Allocation")}
              </span>
              {total > 0 && (
                <span className="font-mono tabular-nums text-[11.5px] text-[#5C5858]">
                  Total:{" "}
                  <strong className="text-[#1E1B1B]">
                    {prefix}
                    {total.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </strong>
                </span>
              )}
            </div>
            {segments.length === 0 ? (
              <div className="py-5 text-center text-[12px] text-[#8A8585]">
                No allocation data yet.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 96 96" className="w-24 h-24 -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r={radius}
                      fill="none"
                      stroke="var(--rico-surface-base)"
                      strokeWidth="12"
                    />
                    {segments.map((seg, idx) => {
                      const frac = total > 0 ? seg.value / total : 0;
                      const dash = frac * circumference;
                      const strokeDashoffset = -offsetAcc;
                      offsetAcc += dash;
                      const isHovered = hoveredIdx === idx;
                      const isDimmed = hoveredIdx !== null && !isHovered;
                      return (
                        <circle
                          key={idx}
                          cx="48"
                          cy="48"
                          r={radius}
                          fill="none"
                          stroke={seg.color}
                          strokeOpacity={isDimmed ? 0.3 : 1}
                          strokeWidth={isHovered ? "14.5" : "12"}
                          strokeDasharray={`${dash} ${circumference - dash}`}
                          strokeDashoffset={strokeDashoffset}
                          className="cursor-pointer transition-[stroke-width,stroke-opacity] duration-150"
                          onMouseEnter={() =>
                            setHoveredDonutIdx((prev) => ({
                              ...prev,
                              [nodeKey]: idx,
                            }))
                          }
                          onMouseLeave={() =>
                            setHoveredDonutIdx((prev) => ({
                              ...prev,
                              [nodeKey]: null,
                            }))
                          }
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[12px] font-semibold font-mono tabular-nums text-[#1E1B1B]">
                      {hoveredIdx !== null && segments[hoveredIdx]
                        ? `${Math.round((segments[hoveredIdx].value / total) * 100)}%`
                        : `${segments.length}`}
                    </span>
                    <span className="text-[9.5px] text-[#8A8585] uppercase tracking-wider">
                      {hoveredIdx !== null ? "share" : "groups"}
                    </span>
                  </div>
                </div>
                <div className="flex-1 w-full min-w-0 space-y-1">
                  {segments.map((seg, idx) => {
                    const share = total > 0 ? Math.round((seg.value / total) * 100) : 0;
                    const dimmed = hoveredIdx !== null && hoveredIdx !== idx;
                    return (
                      <div
                        key={idx}
                        onMouseEnter={() =>
                          setHoveredDonutIdx((prev) => ({
                            ...prev,
                            [nodeKey]: idx,
                          }))
                        }
                        onMouseLeave={() =>
                          setHoveredDonutIdx((prev) => ({
                            ...prev,
                            [nodeKey]: null,
                          }))
                        }
                        className={`px-2 py-1 rounded-lg flex items-center justify-between gap-2 text-[12px] cursor-default transition-opacity duration-150 ${
                          dimmed ? "opacity-45" : "opacity-100 hover:bg-[#F8F7F7]"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2 truncate text-[#1E1B1B]">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: seg.color }}
                          />
                          <span className="truncate">{seg.label}</span>
                        </span>
                        <span className="font-mono tabular-nums text-[11.5px] text-[#1E1B1B] shrink-0">
                          {prefix}
                          {seg.value.toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                          })}{" "}
                          <span className="text-[#8A8585]">· {share}%</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      }

      case "DataTable": {
        const columns = (Array.isArray(p.columns) ? p.columns : []).map((c) => {
          if (c && typeof c === "object") {
            const rec = c as Record<string, unknown>;
            return {
              key: String(rec.key ?? ""),
              label: String(rec.label ?? rec.key ?? ""),
              align: String(rec.align ?? "left"),
            };
          }
          return { key: String(c), label: String(c), align: "left" };
        });
        const rawRows = Array.isArray(p.rows)
          ? (p.rows.filter((r) => r && typeof r === "object") as Array<
              Record<string, unknown>
            >)
          : [];

        const query = (tableSearch[nodeKey] ?? "").trim().toLowerCase();
        const sortCfg = tableSort[nodeKey];

        let displayRows = query
          ? rawRows.filter((r) =>
              Object.values(r).some((v) =>
                String(v ?? "")
                  .toLowerCase()
                  .includes(query)
              )
            )
          : rawRows;

        if (sortCfg) {
          const factor = sortCfg.dir === "desc" ? -1 : 1;
          displayRows = [...displayRows].sort((a, b) => {
            const av = a[sortCfg.key];
            const bv = b[sortCfg.key];
            const an = Number(String(av ?? "").replace(/[$,%/a-zA-Z\s]/g, ""));
            const bn = Number(String(bv ?? "").replace(/[$,%/a-zA-Z\s]/g, ""));
            if (Number.isFinite(an) && Number.isFinite(bn) && String(av).match(/\d/)) {
              return (an - bn) * factor;
            }
            return String(av ?? "").localeCompare(String(bv ?? "")) * factor;
          });
        }

        const renderCellValue = (val: unknown, colKey: string) => {
          const s = String(val ?? "—");
          const upper = s.toUpperCase();
          if (
            ["ACTIVE", "COMPLETED", "ELIGIBLE", "PROTECTED", "SAFE", "SUCCESS"].includes(
              upper
            )
          ) {
            return (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-700 text-[10.5px] font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {s}
              </span>
            );
          }
          if (
            ["ANOMALY_HOLD", "WARNING", "NEAR_CAP", "PENDING", "PAUSED"].includes(upper)
          ) {
            return (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/90 text-amber-800 text-[10.5px] font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {s}
              </span>
            );
          }
          if (["BLOCKED", "DANGER"].includes(upper)) {
            return (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200/90 text-rose-700 text-[10.5px] font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {s}
              </span>
            );
          }
          if (colKey === "service" || colKey === "program") {
            return <span className="font-medium text-[#1E1B1B]">{s}</span>;
          }
          return s;
        };

        return (
          <div
            key={nodeKey}
            className="rico-card-enter rounded-xl border border-[#E6E4E3] bg-white overflow-hidden"
          >
            {(Boolean(p.title) || Boolean(p.searchable)) && (
              <div className="px-3.5 py-2.5 border-b border-[#F1EFEF] bg-[#FCFCFC] flex flex-wrap items-center justify-between gap-2">
                {Boolean(p.title) && (
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-semibold text-[#1E1B1B]">
                      {String(p.title)}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-[#F1EFEF] text-[#5C5858] font-mono text-[10.5px]">
                      {displayRows.length}
                    </span>
                  </div>
                )}
                {Boolean(p.searchable) && (
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-[#8A8585] absolute left-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={tableSearch[nodeKey] ?? ""}
                      onChange={(e) =>
                        setTableSearch((prev) => ({
                          ...prev,
                          [nodeKey]: e.target.value,
                        }))
                      }
                      placeholder="Filter rows..."
                      className="h-7 pl-7 pr-2.5 rounded-lg border border-[#E6E4E3] bg-white text-[12px] text-[#1E1B1B] placeholder:text-[#8A8585] focus:outline-none focus:border-[#034CFF]"
                    />
                  </div>
                )}
              </div>
            )}

            {displayRows.length === 0 ? (
              <div className="px-4 py-6 text-center text-[12.5px] text-[#8A8585]">
                {String(p.emptyMessage ?? "No matching records.")}
              </div>
            ) : (
              <div className="overflow-x-auto rico-scroller">
                <table className="w-full text-left border-collapse text-[12.5px]">
                  <thead>
                    <tr className="border-b border-[#E6E4E3] bg-[#F8F7F7]">
                      {columns.map((col) => {
                        const isSorted = sortCfg?.key === col.key;
                        return (
                          <th
                            key={col.key}
                            onClick={() =>
                              setTableSort((prev) => ({
                                ...prev,
                                [nodeKey]: {
                                  key: col.key,
                                  dir:
                                    prev[nodeKey]?.key === col.key &&
                                    prev[nodeKey]?.dir === "asc"
                                      ? "desc"
                                      : "asc",
                                },
                              }))
                            }
                            className={`px-3 sm:px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.03em] whitespace-nowrap cursor-pointer select-none transition-colors ${
                              isSorted
                                ? "text-[#034CFF]"
                                : "text-[#5C5858] hover:text-[#1E1B1B]"
                            } ${col.align === "right" ? "text-right" : "text-left"}`}
                          >
                            <span className="inline-flex items-center gap-1">
                              <span>{col.label}</span>
                              {isSorted &&
                                (sortCfg.dir === "asc" ? (
                                  <ArrowUp className="w-3 h-3 text-[#034CFF]" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 text-[#034CFF]" />
                                ))}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1EFEF]">
                    {displayRows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="hover:bg-[#F8F7F7]/85 transition-colors duration-100"
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className={`px-3 sm:px-3.5 py-2.5 text-[#1E1B1B] ${
                              col.align === "right"
                                ? "text-right font-mono tabular-nums whitespace-nowrap"
                                : ""
                            }`}
                          >
                            {renderCellValue(row[col.key], col.key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      }

      case "SliderInput": {
        const boundVar = node.bindings.value;
        const min = Number(p.min ?? 0);
        const max = Number(p.max ?? 100);
        const step = Number(p.step ?? 1);
        const prefix = String(p.prefix ?? "$");
        const suffix = String(p.suffix ?? "");
        const currentVal = Number(p.value ?? min);

        return (
          <div
            key={nodeKey}
            className="rico-card-enter rounded-xl border border-[#E6E4E3] bg-white px-3.5 py-2.5 space-y-1.5"
          >
            <div className="flex items-center justify-between text-[12.5px]">
              <label className="font-medium text-[#1E1B1B]">
                {String(p.label ?? "Adjust")}
              </label>
              <span className="font-mono font-semibold tabular-nums text-[#034CFF]">
                {prefix}
                {currentVal.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
                {suffix}
              </span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={currentVal}
              onChange={(e) => {
                if (boundVar) updateBinding(boundVar, Number(e.target.value));
              }}
              className="w-full accent-[#034CFF] cursor-pointer"
            />
          </div>
        );
      }

      case "SelectFilter": {
        const boundVar = node.bindings.value;
        const current = String(p.value ?? "ALL");
        const rawOpts = Array.isArray(p.options) ? p.options : [];
        const options = rawOpts.map((o) => {
          if (o && typeof o === "object") {
            const rec = o as Record<string, unknown>;
            return {
              value: String(rec.value ?? ""),
              label: String(rec.label ?? rec.value ?? ""),
            };
          }
          return { value: String(o), label: String(o) };
        });

        return (
          <div
            key={nodeKey}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E6E4E3] bg-white px-3 py-2"
          >
            <span className="text-[12px] font-medium text-[#5C5858]">
              {String(p.label ?? "Filter")}
            </span>
            <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl sm:rounded-full bg-[#F1EFEF]">
              {options.map((opt) => {
                const active = opt.value === current;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      if (boundVar) updateBinding(boundVar, opt.value);
                    }}
                    className={`h-6 px-2.5 rounded-full text-[11.5px] font-medium transition-colors duration-100 ${
                      active
                        ? "bg-white text-[#1E1B1B] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                        : "text-[#5C5858] hover:text-[#1E1B1B]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      case "Button": {
        const variant = String(p.variant ?? "secondary");
        const cls =
          variant === "primary"
            ? "bg-[#1E1B1B] text-white hover:bg-[#332F2F] active:translate-y-px"
            : variant === "outline"
            ? "bg-white border border-[#D6D3D1] text-[#1E1B1B] hover:bg-[#F8F7F7] active:translate-y-px"
            : variant === "ghost"
            ? "bg-transparent text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF]"
            : "bg-[#F8F7F7] border border-[#E6E4E3] text-[#1E1B1B] hover:bg-[#F1EFEF]";

        return (
          <button
            key={nodeKey}
            type="button"
            onClick={() => executeActionPayload(p.action)}
            className={`h-8 px-3.5 rounded-lg text-[12px] font-medium inline-flex items-center gap-1.5 transition-[background-color,transform] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${cls}`}
          >
            <span>{String(p.label ?? "Action")}</span>
          </button>
        );
      }

      case "ButtonGroup":
        return (
          <div key={nodeKey} className="flex flex-wrap items-center gap-2">
            {renderNodeList(p.buttons, nodeKey)}
          </div>
        );

      case "FollowUpChips": {
        const items = Array.isArray(p.items) ? p.items : [];
        if (items.length === 0) return null;
        return (
          <div key={nodeKey} className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {items.map((raw, idx) => {
              if (!raw || typeof raw !== "object") return null;
              const rec = raw as Record<string, unknown>;
              const label = String(rec.label ?? "Continue");
              const tool = rec.tool ? String(rec.tool) : "";
              const prompt = rec.prompt ? String(rec.prompt) : "";
              const url = rec.url ? String(rec.url) : "";
              const lowerLbl = label.toLowerCase();

              const dotColor =
                tool === "excel" || lowerLbl.includes("excel")
                  ? "bg-emerald-500"
                  : tool === "dashboard" || lowerLbl.includes("dashboard")
                  ? "bg-amber-500"
                  : tool === "doc" || lowerLbl.includes("doc") || lowerLbl.includes("memo")
                  ? "bg-[#034CFF]"
                  : tool === "browser" || url
                  ? "bg-[#034CFF]"
                  : "";

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (tool && !prompt) {
                      onAction?.({
                        type: "open_workspace",
                        humanFriendlyMessage: label,
                        params: { tool, url: url || undefined },
                      });
                    } else if (url && !prompt) {
                      onAction?.({
                        type: "open_url",
                        humanFriendlyMessage: label,
                        params: { url },
                      });
                    } else {
                      onAction?.({
                        type: "continue_conversation",
                        humanFriendlyMessage: prompt || label,
                      });
                    }
                  }}
                  className="h-7 px-2.5 rounded-full bg-white hover:bg-[#F8F7F7] border border-[#E6E4E3] hover:border-[#D6D3D1] text-[12px] font-medium text-[#1E1B1B] inline-flex items-center gap-1.5 transition-[background-color,border-color,transform] duration-100 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
                >
                  {dotColor && (
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                  )}
                  <span>{label}</span>
                  <ArrowUpRight className="w-3 h-3 text-[#8A8585]" />
                </button>
              );
            })}
          </div>
        );
      }

      case "MandateBuilderCard":
        return (
          <MandateBuilderWidget
            key={nodeKey}
            service={String(p.service ?? "Subscription")}
            suggestedCeiling={Number(p.suggestedCeiling ?? 20)}
            currentPrice={
              typeof p.currentPrice === "number" && p.currentPrice > 0
                ? p.currentPrice
                : undefined
            }
            defaultRecurrence={String(p.defaultRecurrence ?? "Monthly on 1st")}
            category={String(p.category ?? "Software & Cloud")}
            onAction={onAction}
          />
        );

      case "RunwayCalculatorCard":
        return (
          <RunwayCalculatorWidget
            key={nodeKey}
            title={String(p.title ?? "Interactive Runway & Burn Simulator")}
            initialCash={Number(p.initialCash ?? 360000)}
            initialMrr={Number(p.initialMrr ?? 15000)}
            initialGrossBurn={Number(p.initialGrossBurn ?? 45000)}
            onAction={onAction}
          />
        );

      case "VendorComparisonCard":
        return (
          <VendorComparisonWidget
            key={nodeKey}
            title={String(p.title ?? "Verified Vendor Comparison")}
            vendors={
              Array.isArray(p.vendors)
                ? (p.vendors as Array<Record<string, unknown>>)
                : []
            }
            onAction={onAction}
          />
        );

      case "PaymentGuardrailCard":
        return (
          <PaymentGuardrailWidget
            key={nodeKey}
            mandateId={String(p.mandateId ?? "")}
            service={String(p.service ?? "Service")}
            verifiedPrice={Number(p.verifiedPrice ?? 0)}
            budgetCeiling={Number(p.budgetCeiling ?? 0)}
            recurrence={String(p.recurrence ?? "Monthly")}
            status={String(p.status ?? "ACTIVE")}
            onAction={onAction}
          />
        );

      case "CreditMatchCard":
        return (
          <CreditMatchWidget
            key={nodeKey}
            title={String(p.title ?? "Eligible Credits & Savings")}
            totalValueLabel={String(p.totalValueLabel ?? "$55,000")}
            programs={
              Array.isArray(p.programs)
                ? (p.programs as Array<Record<string, unknown>>)
                : []
            }
            onAction={onAction}
          />
        );

      case "DashboardPreviewCard":
        return (
          <div
            key={nodeKey}
            className="rico-card-enter rounded-xl border border-[#E6E4E3] bg-white p-4 flex flex-wrap items-center justify-between gap-3 shadow-[0_1px_3px_rgba(30,27,27,0.03)]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-emerald-500 rico-live-dot shrink-0" />
                <span className="text-[13.5px] font-semibold text-[#1E1B1B] truncate">
                  {String(p.title ?? "Live Dashboard")}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#F8F7F7] border border-[#E6E4E3] text-[#5C5858] text-[10.5px] font-mono">
                  v{Number(p.version ?? 1)} · Live
                </span>
              </div>
              {Boolean(p.description) && (
                <p className="m-0 mt-1 text-[12px] text-[#5C5858] truncate">
                  {String(p.description)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                onAction?.({
                  type: "open_dashboard",
                  humanFriendlyMessage: `Open ${String(p.title ?? "Dashboard")}`,
                  params: { dashboardId: String(p.dashboardId ?? "") },
                })
              }
              className="h-8 px-3.5 rounded-lg bg-[#034CFF] hover:bg-[#023ECC] text-white text-[12px] font-medium shrink-0 inline-flex items-center gap-1.5 active:translate-y-px transition-[background-color,transform] duration-100"
            >
              <span>Open board</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (!parsed.hasRicoUI || !parsed.root) {
    const clean = formatPlainText(response);
    if (!clean) return null;
    return <div className="text-[#1E1B1B] whitespace-pre-wrap">{clean}</div>;
  }

  return (
    <div className="space-y-3 w-full min-w-0" data-ricoui-surface="true">
      {parsed.leadText && (
        <div className="text-[#1E1B1B] whitespace-pre-wrap">
          {formatPlainText(parsed.leadText)}
        </div>
      )}

      {renderElement(parsed.root, "root")}

      {isStreaming && (
        <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#5C5858]">
          <Loader2 className="w-3 h-3 animate-spin text-[#034CFF]" />
          <span>Building interactive view...</span>
        </div>
      )}

      {parsed.trailText && (
        <div className="text-[#1E1B1B] whitespace-pre-wrap">
          {formatPlainText(parsed.trailText)}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * Domain Interactive Widgets — Clean Surfaces, Purposeful Color, High Craft
 * ========================================================================== */

function MandateBuilderWidget({
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
  const headroom =
    currentPrice !== undefined ? ceiling - currentPrice : null;

  return (
    <div className="rico-card-enter rounded-xl border border-[#E6E4E3] bg-white p-4 space-y-3.5 shadow-[0_1px_3px_rgba(30,27,27,0.03)]">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#034CFF] shrink-0" />
            <span className="text-[13.5px] font-semibold tracking-[-0.01em] text-[#1E1B1B]">
              {service} · Spending Rule
            </span>
          </div>
          <p className="m-0 mt-0.5 text-[12px] text-[#5C5858]">
            Slide or type an exact cap below. Creating a rule never charges funds.
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-[#F8F7F7] border border-[#E6E4E3] text-[11px] font-mono text-[#5C5858] shrink-0">
          {category}
        </span>
      </div>

      <div className="rounded-xl bg-[#F8F7F7] border border-[#E6E4E3] p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#1E1B1B]">Hard Budget Cap</span>
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
                      className={`px-1.5 py-0.5 rounded text-[10.5px] font-mono transition-colors ${
                        ceiling === preset
                          ? "bg-[#034CFF] text-white"
                          : "bg-white border border-[#E6E4E3] text-[#5C5858] hover:text-[#1E1B1B]"
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
            <div className="inline-flex items-center h-7 px-2 rounded-md bg-white border border-[#D6D3D1] focus-within:border-[#034CFF]">
              <span className="text-[#8A8585] text-[12px] mr-0.5">$</span>
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
                className="w-16 bg-transparent text-right font-semibold text-[13px] text-[#1E1B1B] focus:outline-none"
              />
            </div>
            {headroom !== null && (
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                  headroom >= 0
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-rose-700 bg-rose-50 border-rose-200"
                }`}
              >
                {headroom >= 0
                  ? `+${fmtUsd(headroom)} buffer`
                  : `${fmtUsd(headroom)} under rate`}
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
          className="w-full accent-[#034CFF] cursor-pointer"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="inline-flex flex-wrap items-center gap-1 p-0.5 rounded-full bg-[#F1EFEF]">
          {["Monthly on 1st", "Monthly on 5th", "Monthly on 15th", "Annual"].map(
            (sched) => (
              <button
                key={sched}
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setRecurrence(sched);
                }}
                className={`h-6 px-2.5 rounded-full text-[11px] font-medium transition-colors duration-100 ${
                  recurrence === sched
                    ? "bg-white text-[#1E1B1B] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                    : "text-[#5C5858] hover:text-[#1E1B1B]"
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
            className="min-h-[36px] sm:h-8 px-3 rounded-lg border border-[#D6D3D1] bg-white hover:bg-[#F8F7F7] text-[12px] font-medium text-[#1E1B1B] flex-1 sm:flex-initial justify-center inline-flex items-center transition-colors"
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
            className={`min-h-[36px] sm:h-8 px-3.5 rounded-lg text-white text-[12px] font-medium flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 active:translate-y-px transition-[background-color,transform] duration-100 ${
              submitted
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-[#034CFF] hover:bg-[#023ECC]"
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

function RunwayCalculatorWidget({
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

  // Compute live 6-month cash projection bars
  const projection = Array.from({ length: 6 }, (_, idx) => {
    const monthNum = idx + 1;
    const projected = profitable
      ? cash + netSurplus * monthNum
      : Math.max(0, cash - netBurn * monthNum);
    return { label: `M${monthNum}`, cash: projected };
  });
  const maxProj = Math.max(1, cash, ...projection.map((p) => p.cash));

  return (
    <div className="rico-card-enter rounded-xl border border-[#E6E4E3] bg-white p-4 space-y-3.5 shadow-[0_1px_3px_rgba(30,27,27,0.03)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              profitable || runwayMonths >= 18
                ? "bg-emerald-500 rico-live-dot"
                : runwayMonths >= 9
                ? "bg-amber-500"
                : "bg-rose-500"
            }`}
          />
          <span className="text-[13.5px] font-semibold tracking-[-0.01em] text-[#1E1B1B]">
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
              title="Reset sliders"
              className="h-6 px-2 rounded-full border border-[#E6E4E3] bg-[#F8F7F7] hover:bg-[#F1EFEF] text-[11px] font-medium text-[#5C5858] inline-flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${
              profitable || runwayMonths >= 18
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : runwayMonths >= 9
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {profitable
              ? "Cash-Flow Positive"
              : `${runwayMonths.toFixed(1)} months runway`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="rounded-xl bg-[#F8F7F7] border border-[#E6E4E3] p-2.5">
          <div className="text-[11px] text-[#5C5858]">Net Monthly Burn</div>
          <div className="text-[16px] font-semibold font-mono tabular-nums text-[#1E1B1B] mt-0.5">
            {profitable
              ? `+$${netSurplus.toLocaleString("en-US")}/mo`
              : `$${netBurn.toLocaleString("en-US")}/mo`}
          </div>
        </div>
        <div className="rounded-xl bg-[#F8F7F7] border border-[#E6E4E3] p-2.5">
          <div className="text-[11px] text-[#5C5858]">Implied ARR (12x)</div>
          <div className="text-[16px] font-semibold font-mono tabular-nums text-[#034CFF] mt-0.5">
            ${arr.toLocaleString("en-US")}/yr
          </div>
        </div>
        <div className="rounded-xl bg-[#F8F7F7] border border-[#E6E4E3] p-2.5">
          <div className="text-[11px] text-[#5C5858]">
            {hoveredMonth !== null
              ? `Month ${hoveredMonth + 1} Cash`
              : "6-Month Ending Cash"}
          </div>
          <div
            className={`text-[16px] font-semibold font-mono tabular-nums mt-0.5 ${
              (hoveredMonth !== null
                ? projection[hoveredMonth].cash
                : projection[5].cash) > 0
                ? "text-emerald-700"
                : "text-rose-600"
            }`}
          >
            $
            {(hoveredMonth !== null
              ? projection[hoveredMonth].cash
              : projection[5].cash
            ).toLocaleString("en-US")}
          </div>
        </div>
      </div>

      {/* Interactive 6-Month Cash Trajectory Spark-Bars */}
      <div className="rounded-xl border border-[#E6E4E3] bg-[#FCFCFC] px-3 py-2.5 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-[#5C5858]">
          <span>6-Month Cash Trajectory (hover bar to inspect)</span>
          <span className="font-mono tabular-nums">
            {hoveredMonth !== null
              ? `${projection[hoveredMonth].label}: $${projection[hoveredMonth].cash.toLocaleString("en-US")}`
              : "M1 → M6"}
          </span>
        </div>
        <div className="grid grid-cols-6 gap-1.5 items-end h-12 pt-1">
          {projection.map((pt, idx) => {
            const hPct = Math.max(8, Math.round((pt.cash / maxProj) * 100));
            const depleted = pt.cash <= 0;
            const active = hoveredMonth === idx;
            return (
              <div
                key={pt.label}
                onMouseEnter={() => setHoveredMonth(idx)}
                onMouseLeave={() => setHoveredMonth(null)}
                className="h-full flex flex-col justify-end items-center gap-1 cursor-pointer group"
              >
                <div
                  className={`w-full rounded-sm transition-opacity duration-100 ${
                    depleted
                      ? "bg-rose-400"
                      : profitable
                      ? "bg-emerald-500"
                      : "bg-[#034CFF]"
                  } ${
                    hoveredMonth !== null && !active ? "opacity-35" : "opacity-100"
                  }`}
                  style={{ height: `${hPct}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-6 gap-1.5 text-center text-[10px] font-mono text-[#8A8585]">
          {projection.map((pt) => (
            <span key={pt.label}>{pt.label}</span>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <div>
          <div className="flex justify-between text-[12px] mb-0.5">
            <span className="text-[#5C5858]">Cash Balance</span>
            <span className="font-mono tabular-nums font-semibold text-[#1E1B1B]">
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
            className="w-full accent-[#034CFF] cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[12px] mb-0.5">
            <span className="text-[#5C5858]">Monthly Revenue (MRR)</span>
            <span className="font-mono tabular-nums font-semibold text-emerald-700">
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
            className="w-full accent-[#10B981] cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[12px] mb-0.5">
            <span className="text-[#5C5858]">Monthly Gross Burn</span>
            <span className="font-mono tabular-nums font-semibold text-[#1E1B1B]">
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
            className="w-full accent-[#034CFF] cursor-pointer"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-0.5">
        <button
          type="button"
          onClick={() =>
            onAction?.({
              type: "continue_conversation",
              humanFriendlyMessage: `Build a 6-month startup runway model in Excel with $${cash} starting cash, $${mrr} MRR, and $${grossBurn} burn`,
            })
          }
          className="h-8 px-3.5 rounded-lg bg-[#1E1B1B] hover:bg-[#332F2F] text-white text-[12px] font-medium inline-flex items-center gap-1.5 active:translate-y-px transition-[background-color,transform] duration-100"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Open Formula Sheet in Excel</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function VendorComparisonWidget({
  title,
  vendors,
  onAction,
}: {
  title: string;
  vendors: Array<Record<string, unknown>>;
  onAction?: (ev: RicoUIActionEvent) => void;
}) {
  const [billingView, setBillingView] = useState<"monthly" | "annual">("monthly");

  const parsed = vendors.map((v) => ({
    service: String(v.service ?? "Service"),
    planName: String(v.planName ?? "Standard Plan"),
    monthlyPrice: Number(v.monthlyPrice ?? 0),
    currency: String(v.currency ?? "USD"),
    url: v.url ? String(v.url) : "",
  }));

  const validPrices = parsed.filter((v) => v.monthlyPrice > 0).map((v) => v.monthlyPrice);
  const lowest = validPrices.length > 0 ? Math.min(...validPrices) : 0;
  const highest = validPrices.length > 0 ? Math.max(...validPrices) : 0;

  return (
    <div className="rico-card-enter rounded-xl border border-[#E6E4E3] bg-white overflow-hidden shadow-[0_1px_3px_rgba(30,27,27,0.03)]">
      <div className="px-3.5 py-2.5 border-b border-[#F1EFEF] bg-[#FCFCFC] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[#1E1B1B]">{title}</span>
          {highest > lowest && lowest > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-mono tabular-nums">
              Save {fmtUsd((highest - lowest) * 12)}/yr
            </span>
          )}
        </div>

        <div className="inline-flex items-center p-0.5 rounded-full bg-[#F1EFEF]">
          {(["monthly", "annual"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setBillingView(mode)}
              className={`h-6 px-2.5 rounded-full text-[11px] font-medium capitalize transition-colors ${
                billingView === mode
                  ? "bg-white text-[#1E1B1B] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-[#5C5858] hover:text-[#1E1B1B]"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-[#F1EFEF]">
        {parsed.map((v, idx) => {
          const isBest = lowest > 0 && v.monthlyPrice === lowest && parsed.length > 1;
          const suggestedCap = Math.ceil(v.monthlyPrice * 1.2);
          const shownPrice =
            billingView === "annual" ? v.monthlyPrice * 12 : v.monthlyPrice;

          return (
            <div
              key={idx}
              className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors duration-100 ${
                isBest
                  ? "bg-emerald-50/25 border-l-[3px] border-l-emerald-500"
                  : "hover:bg-[#F8F7F7]/80"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13.5px] font-semibold text-[#1E1B1B]">
                    {v.service}
                  </span>
                  {isBest && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-semibold">
                      LOWEST VERIFIED
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-[#5C5858] mt-0.5">{v.planName}</div>
              </div>

              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                <span className="text-[15px] font-semibold font-mono tabular-nums text-[#1E1B1B] mr-1">
                  {fmtUsd(shownPrice)}
                  <span className="text-[11.5px] font-normal text-[#8A8585]">
                    /{billingView === "annual" ? "yr" : "mo"}
                  </span>
                </span>
                <div className="flex items-center gap-1.5">
                  {v.url && (
                    <button
                      type="button"
                      onClick={() =>
                        onAction?.({
                          type: "open_workspace",
                          humanFriendlyMessage: `Inspect ${v.service} in Browser`,
                          params: { tool: "browser", url: v.url },
                        })
                      }
                      className="h-7 px-2.5 rounded-lg border border-[#E6E4E3] bg-[#F8F7F7] hover:bg-[#F1EFEF] text-[11.5px] font-medium text-[#1E1B1B] inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Inspect</span>
                      <ArrowUpRight className="w-3 h-3 text-[#034CFF]" />
                    </button>
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
                      className="h-7 px-2.5 rounded-lg bg-[#034CFF] hover:bg-[#023ECC] text-white text-[11.5px] font-medium transition-colors"
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

function PaymentGuardrailWidget({
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
    <div className="rico-card-enter rounded-xl border border-[#E6E4E3] bg-white p-4 space-y-3 shadow-[0_1px_3px_rgba(30,27,27,0.03)]">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold text-[#1E1B1B] truncate">
            {service}
          </div>
          <div className="text-[12px] text-[#5C5858] mt-0.5">{recurrence}</div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10.5px] font-mono font-medium shrink-0 ${
            status === "ACTIVE" && withinCap
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status === "ACTIVE" && withinCap
                ? "bg-emerald-500 rico-live-dot"
                : "bg-amber-500"
            }`}
          />
          {status}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[12px] font-mono tabular-nums">
          <span className="text-[#5C5858]">
            Verified:{" "}
            <strong className="text-[#1E1B1B]">
              {verifiedPrice > 0 ? fmtUsd(verifiedPrice) : "Not checked yet"}
            </strong>
          </span>
          <span className="text-[#5C5858]">
            Ceiling: <strong className="text-[#1E1B1B]">{fmtUsd(budgetCeiling)}</strong>
            {verifiedPrice > 0 ? (
              <span className="text-emerald-700"> ({fmtUsd(headroom)} headroom)</span>
            ) : (
              ""
            )}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[#F1EFEF] overflow-hidden">
          <div
            className={`h-full rounded-full ${
              withinCap ? "bg-[#034CFF]" : "bg-rose-500"
            }`}
            style={{ width: `${verifiedPrice > 0 ? pct : 6}%` }}
          />
        </div>
      </div>

      {status === "ACTIVE" && withinCap && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <span className="text-[11px] text-[#8A8585] leading-snug">
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
              className="h-8 px-3.5 rounded-lg bg-[#034CFF] hover:bg-[#023ECC] text-white text-[12px] font-medium whitespace-nowrap shrink-0 active:translate-y-px transition-[background-color,transform] duration-100"
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
              className="h-8 px-3.5 rounded-lg bg-[#1E1B1B] hover:bg-[#332F2F] text-white text-[12px] font-medium whitespace-nowrap shrink-0 active:translate-y-px transition-[background-color,transform] duration-100"
            >
              Verify Live Price
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CreditMatchWidget({
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
    <div className="rico-card-enter rounded-xl border border-[#E6E4E3] bg-white overflow-hidden shadow-[0_1px_3px_rgba(30,27,27,0.03)]">
      <div className="px-3.5 py-2.5 border-b border-[#F1EFEF] bg-[#FCFCFC] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 rico-live-dot" />
          <span className="text-[13px] font-semibold text-[#1E1B1B]">{title}</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-mono font-semibold tabular-nums">
          {totalValueLabel}
        </span>
      </div>

      <div className="divide-y divide-[#F1EFEF]">
        {programs.map((prog, idx) => {
          const name = String(prog.name ?? "Program");
          const val = String(prog.value ?? "");
          const detail = String(prog.detail ?? "");
          const actionPrompt = prog.actionPrompt ? String(prog.actionPrompt) : "";

          return (
            <div
              key={idx}
              className="p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 hover:bg-[#F8F7F7]/80 transition-colors duration-100"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold text-[#1E1B1B]">
                    {name}
                  </span>
                  {val && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/80 font-mono tabular-nums text-[11px] font-medium text-emerald-800">
                      {val}
                    </span>
                  )}
                </div>
                {detail && (
                  <p className="m-0 mt-0.5 text-[12px] text-[#5C5858] leading-snug">
                    {detail}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      void navigator.clipboard.writeText(`${name} (${val}): ${detail}`);
                      setCopiedIdx(idx);
                      setTimeout(() => setCopiedIdx(null), 1500);
                    }
                  }}
                  title="Copy details"
                  className="w-7 h-7 rounded-lg border border-[#E6E4E3] bg-[#F8F7F7] hover:bg-[#F1EFEF] flex items-center justify-center text-[#5C5858]"
                >
                  {copiedIdx === idx ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                {actionPrompt && (
                  <button
                    type="button"
                    onClick={() =>
                      onAction?.({
                        type: "continue_conversation",
                        humanFriendlyMessage: actionPrompt,
                      })
                    }
                    className="h-7 px-2.5 rounded-lg bg-[#034CFF] hover:bg-[#023ECC] text-white text-[11.5px] font-medium transition-colors"
                  >
                    Apply
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
