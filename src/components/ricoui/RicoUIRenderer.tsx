"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Loader2,
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
import { RicoFollowUpFan } from "./RicoStatusNotch";
import {
  AccordionWidget,
  CreditMatchWidget,
  MandateBuilderWidget,
  PaymentGuardrailWidget,
  ProgramCatalogWidget,
  RunwayCalculatorWidget,
  VendorComparisonWidget,
} from "./RicoUIDomainCards";

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
 * Intelligent UI Chart Series Palette:
 * Blue, Emerald Teal, Iris Violet, Warm Amber, Coral Rose, Ocean Slate.
 */
const SERIES_PALETTE = [
  "#0285ff",
  "#00a67d",
  "#8b5cf6",
  "#f4a340",
  "#e46d91",
  "#4b9ca6",
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
        const gap = p.gap === "sm" ? "gap-2" : p.gap === "lg" ? "gap-4" : "gap-3";
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

        const badgeStyle =
          tone === "success"
            ? {
                background: "var(--rico-iui-badge-success-soft)",
                color: "var(--rico-iui-badge-success)",
              }
            : tone === "warning"
            ? {
                background: "var(--rico-iui-warning-soft)",
                color: "var(--rico-iui-warning)",
              }
            : tone === "danger"
            ? {
                background: "var(--rico-iui-badge-danger-soft)",
                color: "var(--rico-iui-badge-danger)",
              }
            : tone === "accent"
            ? {
                background: "color-mix(in srgb, #0285ff 12%, transparent)",
                color: "#0285ff",
              }
            : {
                background: "var(--rico-iui-badge-neutral)",
                color: "var(--rico-iui-muted)",
              };

        return (
          <section
            key={nodeKey}
            className="rico-card-enter rounded-[14px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] p-4 space-y-3 shadow-[var(--rico-iui-shadow-sm)]"
          >
            {(title || subtitle || badge) && (
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0">
                  {title && (
                    <h3 className="m-0 text-[14px] font-semibold tracking-[-0.015em] text-[var(--rico-iui-ink)]">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="m-0 mt-0.5 text-[12.5px] text-[var(--rico-iui-muted)] leading-snug">
                      {subtitle}
                    </p>
                  )}
                </div>
                {badge && (
                  <span
                    className="shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-medium tabular-nums inline-flex items-center gap-1.5"
                    style={badgeStyle}
                  >
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
          <div key={nodeKey} className="flex items-center justify-between gap-2 pb-1">
            <div className="min-w-0">
              <h3 className="m-0 text-[15px] font-semibold tracking-[-0.015em] text-[var(--rico-iui-ink)]">
                {String(p.title ?? "")}
              </h3>
              {Boolean(p.subtitle) && (
                <p className="m-0 text-[12.5px] text-[var(--rico-iui-muted)]">
                  {String(p.subtitle)}
                </p>
              )}
            </div>
            {Boolean(p.badge) && (
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--rico-iui-badge-neutral)] text-[11px] font-medium text-[var(--rico-iui-muted)]">
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
            ? "text-[var(--rico-iui-ink)] font-semibold text-[14px]"
            : tone === "muted"
            ? "text-[var(--rico-iui-muted)] text-[12.5px]"
            : tone === "mono"
            ? "text-[var(--rico-iui-ink)] font-mono tabular-nums text-[12px] bg-[var(--rico-iui-surface)] border border-[var(--rico-iui-border)] rounded-[10px] px-3.5 py-2.5"
            : "text-[var(--rico-iui-ink)] text-[14px] leading-[1.6]";
        return (
          <p key={nodeKey} className={`m-0 whitespace-pre-wrap ${cls}`}>
            {String(p.text ?? "")}
          </p>
        );
      }

      case "Callout": {
        const tone = String(p.tone ?? "info");
        const style =
          tone === "success"
            ? {
                background: "var(--rico-iui-success-soft)",
                borderColor: "color-mix(in srgb, var(--rico-iui-success) 24%, transparent)",
                dot: "#00a67d",
              }
            : tone === "warning"
            ? {
                background: "var(--rico-iui-warning-soft)",
                borderColor: "color-mix(in srgb, var(--rico-iui-warning) 24%, transparent)",
                dot: "#f4a340",
              }
            : tone === "danger"
            ? {
                background: "var(--rico-iui-danger-soft)",
                borderColor: "color-mix(in srgb, var(--rico-iui-danger) 24%, transparent)",
                dot: "#c1322c",
              }
            : {
                background: "var(--rico-iui-surface)",
                borderColor: "var(--rico-iui-border)",
                dot: "#0285ff",
              };

        return (
          <div
            key={nodeKey}
            style={{ background: style.background, borderColor: style.borderColor }}
            className="rico-card-enter rounded-[12px] border px-3.5 py-3 flex items-start gap-2.5 text-[13px]"
          >
            <span
              className="w-2 h-2 rounded-full mt-1.5 shrink-0"
              style={{ backgroundColor: style.dot }}
            />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-[var(--rico-iui-ink)] leading-snug">
                {String(p.title ?? "")}
              </div>
              <div className="text-[var(--rico-iui-muted)] mt-0.5 leading-relaxed">
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
            className="rico-card-enter rounded-[14px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] divide-y divide-[var(--rico-iui-border)] shadow-[var(--rico-iui-shadow-sm)]"
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
                  className="px-4 py-3 flex items-start gap-3 text-[13px] hover:bg-[var(--rico-iui-hover)] transition-colors duration-100"
                >
                  <span className="w-5 h-5 rounded-full bg-[var(--rico-iui-badge-neutral)] text-[var(--rico-iui-ink)] font-mono text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[var(--rico-iui-ink)]">{title}</div>
                    {detail && (
                      <div className="text-[var(--rico-iui-muted)] text-[12.5px] mt-0.5 leading-relaxed">
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
            <div
              role="tablist"
              className="inline-flex flex-wrap items-center p-1 rounded-[10px] bg-[var(--rico-iui-surface)] border border-[var(--rico-iui-border)]"
            >
              {tabNodes.map((t, i) => {
                const tid = String(t.props.id ?? i);
                const active = tid === String(activePane.props.id ?? 0);
                return (
                  <button
                    key={tid}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() =>
                      setActiveTabs((prev) => ({ ...prev, [nodeKey]: tid }))
                    }
                    className={`h-7 px-3 rounded-[7px] text-[12.5px] font-medium transition-colors duration-100 ${
                      active
                        ? "bg-[var(--rico-iui-canvas)] text-[var(--rico-iui-ink)] shadow-[var(--rico-iui-shadow-sm)]"
                        : "text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)]"
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
        return <div key={nodeKey}>{renderNodeList(p.children, nodeKey)}</div>;

      case "Accordion": {
        const items = Array.isArray(p.items)
          ? (p.items.filter((x) => x && typeof x === "object") as Array<
              Record<string, unknown>
            >)
          : [];
        if (items.length === 0) return null;
        return (
          <AccordionWidget
            key={nodeKey}
            items={items}
            allowMultiple={Boolean(p.allowMultiple)}
            onAction={onAction}
          />
        );
      }

      case "TagList": {
        const rawTags = Array.isArray(p.tags) ? p.tags : [];
        if (rawTags.length === 0) return null;
        return (
          <div key={nodeKey} className="flex flex-wrap items-center gap-1.5">
            {rawTags.map((tag, idx) => {
              const isObj = tag && typeof tag === "object";
              const label = isObj
                ? String((tag as Record<string, unknown>).label ?? "")
                : String(tag ?? "");
              const tone = isObj
                ? String((tag as Record<string, unknown>).tone ?? "neutral")
                : "neutral";
              if (!label) return null;
              const style =
                tone === "success"
                  ? {
                      background: "var(--rico-iui-badge-success-soft)",
                      color: "var(--rico-iui-badge-success)",
                    }
                  : tone === "warning"
                  ? {
                      background: "var(--rico-iui-warning-soft)",
                      color: "var(--rico-iui-warning)",
                    }
                  : tone === "danger"
                  ? {
                      background: "var(--rico-iui-badge-danger-soft)",
                      color: "var(--rico-iui-badge-danger)",
                    }
                  : tone === "accent"
                  ? {
                      background: "color-mix(in srgb, #0285ff 12%, transparent)",
                      color: "#0285ff",
                    }
                  : {
                      background: "var(--rico-iui-badge-neutral)",
                      color: "var(--rico-iui-muted)",
                    };
              return (
                <span
                  key={`${label}-${idx}`}
                  style={style}
                  className="px-2.5 py-0.5 rounded-full text-[11.5px] font-medium tabular-nums"
                >
                  {label}
                </span>
              );
            })}
          </div>
        );
      }

      case "Metric": {
        const trend = String(p.trend ?? "neutral");
        const dotColor =
          trend === "up" || trend === "safe"
            ? "#00a67d"
            : trend === "down" || trend === "warn"
            ? "#f4a340"
            : trend === "accent"
            ? "#0285ff"
            : "var(--rico-iui-faint)";

        const subColor =
          trend === "up" || trend === "safe"
            ? "text-[var(--rico-iui-badge-success)]"
            : trend === "down" || trend === "warn"
            ? "text-[var(--rico-iui-warning)]"
            : trend === "accent"
            ? "text-[#0285ff]"
            : "text-[var(--rico-iui-muted)]";

        return (
          <div
            key={nodeKey}
            className="rico-card-enter rounded-[14px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] px-4 py-3.5 flex flex-col justify-between gap-1 shadow-[var(--rico-iui-shadow-sm)] hover:border-[var(--rico-iui-border-strong)] transition-colors duration-150"
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[12px] font-medium text-[var(--rico-iui-muted)] truncate">
                {String(p.label ?? "")}
              </span>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: dotColor }}
              />
            </div>
            <div className="text-[20px] sm:text-[22px] font-semibold font-mono tabular-nums tracking-[-0.025em] text-[var(--rico-iui-ink)] truncate">
              {String(p.value ?? "—")}
            </div>
            {Boolean(p.sublabel) && (
              <div className={`text-[11.5px] truncate ${subColor}`}>
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
            className="rico-card-enter rounded-[14px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] p-4 space-y-3 shadow-[var(--rico-iui-shadow-sm)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13.5px] font-semibold tracking-[-0.01em] text-[var(--rico-iui-ink)]">
                {String(p.title ?? "Comparison")}
              </span>
              {secondary && (
                <div className="flex items-center gap-3 text-[11.5px] text-[var(--rico-iui-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0285ff]" />
                    {String(p.primaryLabel ?? "Verified")}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--rico-iui-pressed)]" />
                    {String(p.secondaryLabel ?? "Ceiling")}
                  </span>
                </div>
              )}
            </div>

            {labels.length === 0 ? (
              <div className="py-5 text-center text-[12.5px] text-[var(--rico-iui-muted)]">
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
                      className={`rounded-[8px] px-2 py-1.5 -mx-2 cursor-default transition-opacity duration-150 ${
                        dimmed ? "opacity-45" : "opacity-100 hover:bg-[var(--rico-iui-hover)]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[12.5px] gap-2 mb-1">
                        <span className="text-[var(--rico-iui-ink)] font-medium truncate">
                          {lbl}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0 font-mono tabular-nums text-[12px]">
                          <span className="font-semibold text-[var(--rico-iui-ink)]">
                            {prefix}
                            {val.toLocaleString("en-US", {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          {secondary && cap > 0 && (
                            <span className="text-[var(--rico-iui-muted)]">
                              / {prefix}
                              {cap.toLocaleString("en-US", {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          )}
                          {utilRatio !== null && (
                            <span
                              className="px-1.5 py-0.2 rounded-full text-[10.5px] font-medium"
                              style={
                                overCap
                                  ? {
                                      background: "var(--rico-iui-badge-danger-soft)",
                                      color: "var(--rico-iui-badge-danger)",
                                    }
                                  : utilRatio >= 85
                                  ? {
                                      background: "var(--rico-iui-warning-soft)",
                                      color: "var(--rico-iui-warning)",
                                    }
                                  : {
                                      background: "var(--rico-iui-badge-success-soft)",
                                      color: "var(--rico-iui-badge-success)",
                                    }
                              }
                            >
                              {utilRatio}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="relative h-2 rounded-full bg-[var(--rico-iui-surface)] overflow-hidden">
                        {secondary && cap > 0 && (
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-[var(--rico-iui-pressed)]"
                            style={{ width: `${capPct}%` }}
                          />
                        )}
                        <div
                          className={`relative h-full rounded-full ${
                            overCap ? "bg-[#c1322c]" : "bg-[#0285ff]"
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
            className="rico-card-enter rounded-[14px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] p-4 space-y-2.5 shadow-[var(--rico-iui-shadow-sm)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13.5px] font-semibold tracking-[-0.01em] text-[var(--rico-iui-ink)]">
                {String(p.title ?? "Trend")}
              </span>
              {activePt && (
                <span className="px-2.5 py-0.5 rounded-[7px] bg-[var(--rico-iui-surface)] border border-[var(--rico-iui-border)] text-[11.5px] font-mono font-medium tabular-nums text-[var(--rico-iui-ink)]">
                  {activePt.label}:{" "}
                  <strong className="text-[#0285ff]">
                    {prefix}
                    {activePt.v.toLocaleString("en-US")}
                  </strong>
                </span>
              )}
            </div>
            {pts.length === 0 ? (
              <div className="py-5 text-center text-[12.5px] text-[var(--rico-iui-muted)]">
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
                      <stop offset="0%" stopColor="#0285ff" stopOpacity="0.16" />
                      <stop offset="100%" stopColor="#0285ff" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <line
                    x1={padX}
                    y1={height - padY}
                    x2={width - padX}
                    y2={height - padY}
                    stroke="var(--rico-iui-border)"
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
                      stroke="#0285ff"
                      strokeOpacity="0.3"
                      strokeDasharray="2 2"
                    />
                  )}
                  <polyline
                    fill="none"
                    stroke="#0285ff"
                    strokeWidth="2.4"
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
                        r={hovered ? 5 : 3.4}
                        fill={hovered ? "#0285ff" : "var(--rico-iui-canvas)"}
                        stroke="#0285ff"
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
                <div className="flex items-center justify-between text-[11.5px] font-mono tabular-nums text-[var(--rico-iui-muted)]">
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
            className="rico-card-enter rounded-[14px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] p-4 space-y-3 shadow-[var(--rico-iui-shadow-sm)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13.5px] font-semibold tracking-[-0.01em] text-[var(--rico-iui-ink)]">
                {String(p.title ?? "Allocation")}
              </span>
              {total > 0 && (
                <span className="font-mono tabular-nums text-[12px] text-[var(--rico-iui-muted)]">
                  Total:{" "}
                  <strong className="text-[var(--rico-iui-ink)]">
                    {prefix}
                    {total.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </strong>
                </span>
              )}
            </div>
            {segments.length === 0 ? (
              <div className="py-5 text-center text-[12.5px] text-[var(--rico-iui-muted)]">
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
                      stroke="var(--rico-iui-surface)"
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
                    <span className="text-[12.5px] font-semibold font-mono tabular-nums text-[var(--rico-iui-ink)]">
                      {hoveredIdx !== null && segments[hoveredIdx]
                        ? `${Math.round((segments[hoveredIdx].value / total) * 100)}%`
                        : `${segments.length}`}
                    </span>
                    <span className="text-[9.5px] text-[var(--rico-iui-muted)] uppercase tracking-wider">
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
                        className={`px-2 py-1 rounded-[7px] flex items-center justify-between gap-2 text-[12.5px] cursor-default transition-opacity duration-150 ${
                          dimmed ? "opacity-45" : "opacity-100 hover:bg-[var(--rico-iui-hover)]"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2 truncate text-[var(--rico-iui-ink)]">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: seg.color }}
                          />
                          <span className="truncate">{seg.label}</span>
                        </span>
                        <span className="font-mono tabular-nums text-[12px] text-[var(--rico-iui-ink)] shrink-0">
                          {prefix}
                          {seg.value.toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                          })}{" "}
                          <span className="text-[var(--rico-iui-muted)]">· {share}%</span>
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
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  background: "var(--rico-iui-badge-success-soft)",
                  color: "var(--rico-iui-badge-success)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#00a67d]" />
                {s}
              </span>
            );
          }
          if (
            ["ANOMALY_HOLD", "WARNING", "NEAR_CAP", "PENDING", "PAUSED"].includes(upper)
          ) {
            return (
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  background: "var(--rico-iui-warning-soft)",
                  color: "var(--rico-iui-warning)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#f4a340]" />
                {s}
              </span>
            );
          }
          if (["BLOCKED", "DANGER"].includes(upper)) {
            return (
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  background: "var(--rico-iui-badge-danger-soft)",
                  color: "var(--rico-iui-badge-danger)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#c1322c]" />
                {s}
              </span>
            );
          }
          if (colKey === "service" || colKey === "program") {
            return <span className="font-medium text-[var(--rico-iui-ink)]">{s}</span>;
          }
          return s;
        };

        return (
          <div
            key={nodeKey}
            className="rico-card-enter rounded-[14px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] overflow-hidden shadow-[var(--rico-iui-shadow-sm)]"
          >
            {(Boolean(p.title) || Boolean(p.searchable) || rawRows.length >= 6) && (
              <div className="px-4 py-2.5 border-b border-[var(--rico-iui-border)] bg-[var(--rico-iui-surface)] flex flex-wrap items-center justify-between gap-2">
                {Boolean(p.title) ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[var(--rico-iui-ink)]">
                      {String(p.title)}
                    </span>
                    <span className="px-2 py-0.2 rounded-full bg-[var(--rico-iui-badge-neutral)] text-[var(--rico-iui-muted)] font-mono tabular-nums text-[11px]">
                      {displayRows.length}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11.5px] text-[var(--rico-iui-muted)] font-mono tabular-nums">
                    {displayRows.length} rows
                  </span>
                )}
                {(Boolean(p.searchable) || rawRows.length >= 6) && (
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-[var(--rico-iui-muted)] absolute left-2.5 pointer-events-none" />
                    <input
                      type="text"
                      aria-label="Filter table rows"
                      value={tableSearch[nodeKey] ?? ""}
                      onChange={(e) =>
                        setTableSearch((prev) => ({
                          ...prev,
                          [nodeKey]: e.target.value,
                        }))
                      }
                      placeholder="Filter rows..."
                      className="h-7 pl-7 pr-2.5 rounded-[8px] border border-[var(--rico-iui-border-strong)] bg-[var(--rico-iui-canvas)] text-[12px] text-[var(--rico-iui-ink)] placeholder:text-[var(--rico-iui-muted)] focus:outline-none focus:border-[#0285ff]"
                    />
                  </div>
                )}
              </div>
            )}

            {displayRows.length === 0 ? (
              <div className="px-4 py-6 text-center text-[13px] text-[var(--rico-iui-muted)]">
                {String(p.emptyMessage ?? "No matching records.")}
              </div>
            ) : (
              <div className="overflow-x-auto rico-scroller">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[var(--rico-iui-border)] bg-[var(--rico-iui-surface)]">
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
                            className={`px-3.5 py-2 text-[11.5px] font-medium whitespace-nowrap cursor-pointer select-none transition-colors ${
                              isSorted
                                ? "text-[#0285ff]"
                                : "text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)]"
                            } ${col.align === "right" ? "text-right" : "text-left"}`}
                          >
                            <span className="inline-flex items-center gap-1">
                              <span>{col.label}</span>
                              {isSorted &&
                                (sortCfg.dir === "asc" ? (
                                  <ArrowUp className="w-3 h-3 text-[#0285ff]" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 text-[#0285ff]" />
                                ))}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--rico-iui-border)]">
                    {displayRows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="hover:bg-[var(--rico-iui-hover)] transition-colors duration-100"
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className={`px-3.5 py-2.5 text-[var(--rico-iui-ink)] ${
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
            className="rico-card-enter rounded-[12px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] px-4 py-3 space-y-1.5 shadow-[var(--rico-iui-shadow-sm)]"
          >
            <div className="flex items-center justify-between text-[13px]">
              <label className="font-medium text-[var(--rico-iui-ink)]">
                {String(p.label ?? "Adjust")}
              </label>
              <span className="font-mono font-semibold tabular-nums text-[#0285ff]">
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
              className="w-full accent-[#0285ff] cursor-pointer"
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
            className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] px-3.5 py-2.5"
          >
            <span className="text-[12.5px] font-medium text-[var(--rico-iui-muted)]">
              {String(p.label ?? "Filter")}
            </span>
            <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-[9px] bg-[var(--rico-iui-surface)]">
              {options.map((opt) => {
                const active = opt.value === current;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      if (boundVar) updateBinding(boundVar, opt.value);
                    }}
                    className={`h-6 px-2.5 rounded-[6px] text-[12px] font-medium transition-colors duration-100 ${
                      active
                        ? "bg-[var(--rico-iui-canvas)] text-[var(--rico-iui-ink)] shadow-[var(--rico-iui-shadow-sm)]"
                        : "text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)]"
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
            ? "bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)] hover:opacity-90"
            : variant === "outline"
            ? "bg-[var(--rico-iui-canvas)] border border-[var(--rico-iui-border-strong)] text-[var(--rico-iui-ink)] hover:bg-[var(--rico-iui-hover)]"
            : variant === "ghost"
            ? "bg-transparent text-[var(--rico-iui-muted)] hover:text-[var(--rico-iui-ink)] hover:bg-[var(--rico-iui-hover)]"
            : "bg-[var(--rico-iui-surface)] text-[var(--rico-iui-ink)] hover:bg-[var(--rico-iui-pressed)]";

        return (
          <button
            key={nodeKey}
            type="button"
            onClick={() => executeActionPayload(p.action)}
            className={`h-8 px-3.5 rounded-[9px] text-[12.5px] font-medium inline-flex items-center gap-1.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40 ${cls}`}
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
        const rawItems = Array.isArray(p.items) ? p.items : [];
        const normalized = rawItems
          .filter((raw): raw is Record<string, unknown> => Boolean(raw && typeof raw === "object"))
          .map((rec) => ({
            label: String(rec.label ?? "Continue"),
            tool: rec.tool ? String(rec.tool) : undefined,
            prompt: rec.prompt ? String(rec.prompt) : undefined,
            url: rec.url ? String(rec.url) : undefined,
          }));

        if (normalized.length === 0) return null;

        return (
          <RicoFollowUpFan
            key={nodeKey}
            items={normalized}
            onSelect={(item) => {
              if (item.tool && !item.prompt) {
                onAction?.({
                  type: "open_workspace",
                  humanFriendlyMessage: item.label,
                  params: { tool: item.tool, url: item.url },
                });
              } else if (item.url && !item.prompt) {
                onAction?.({
                  type: "open_url",
                  humanFriendlyMessage: item.label,
                  params: { url: item.url },
                });
              } else {
                onAction?.({
                  type: "continue_conversation",
                  humanFriendlyMessage: item.prompt || item.label,
                });
              }
            }}
          />
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

      case "ProgramCatalogCard":
        return (
          <ProgramCatalogWidget
            key={nodeKey}
            title={String(p.title ?? "Curated Directory")}
            subtitle={p.subtitle ? String(p.subtitle) : undefined}
            badge={p.badge ? String(p.badge) : undefined}
            items={
              Array.isArray(p.items)
                ? (p.items as Array<Record<string, unknown>>)
                : []
            }
            onAction={onAction}
          />
        );

      case "DashboardPreviewCard":
        return (
          <div key={nodeKey} className="group relative my-1 w-full max-w-md">
            <button
              type="button"
              onClick={() =>
                onAction?.({
                  type: "open_dashboard",
                  humanFriendlyMessage: `Open ${String(p.title ?? "Dashboard")}`,
                  params: { dashboardId: String(p.dashboardId ?? "") },
                })
              }
              className="flex w-full items-center gap-3 rounded-[14px] border border-[var(--rico-iui-border)] bg-[var(--rico-iui-canvas)] py-3.5 pl-4 pr-12 text-left shadow-[var(--rico-iui-shadow-sm)] transition-colors duration-150 hover:border-[var(--rico-iui-border-strong)] hover:bg-[var(--rico-iui-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0285ff]/40"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="truncate text-[14px] font-medium text-[var(--rico-iui-ink)]">
                  {String(p.title ?? "Live Dashboard")}
                </span>
                <span className="flex items-center gap-2 text-[11.5px] text-[var(--rico-iui-muted)]">
                  <span className="inline-flex items-center rounded-[6px] bg-[var(--rico-iui-badge-neutral)] px-1.5 py-0.5">
                    Dashboard · v{Number(p.version ?? 1)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-[var(--rico-iui-badge-neutral)] px-1.5 py-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#00a67d] rico-live-dot" />
                    Live
                  </span>
                </span>
              </span>
            </button>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-3.5 flex w-7 h-7 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--rico-iui-surface)] text-[var(--rico-iui-muted)] transition-colors duration-150 group-hover:text-[var(--rico-iui-ink)]"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  if (!parsed.hasRicoUI || !parsed.root) {
    const clean = formatPlainText(response);
    if (!clean) return null;
    return (
      <div className="text-[var(--rico-iui-ink)] text-[14.5px] leading-[1.65] whitespace-pre-wrap">
        {clean}
      </div>
    );
  }

  return (
    <div className="space-y-3.5 w-full min-w-0" data-ricoui-surface="true">
      {parsed.leadText && (
        <div className="text-[var(--rico-iui-ink)] text-[15px] font-medium leading-[1.55] tracking-[-0.01em]">
          {formatPlainText(parsed.leadText)}
        </div>
      )}

      {renderElement(parsed.root, "root")}

      {isStreaming && (
        <div className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--rico-iui-muted)]">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0285ff]" />
          <span>Streaming interactive UI…</span>
        </div>
      )}

      {parsed.trailText && (
        <div className="text-[var(--rico-iui-ink)] text-[14px] leading-[1.6] whitespace-pre-wrap">
          {formatPlainText(parsed.trailText)}
        </div>
      )}
    </div>
  );
}
