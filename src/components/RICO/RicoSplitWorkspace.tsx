"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { FileText, Globe, LayoutDashboard, Table2, X } from "lucide-react";
import { RicoBrowser } from "@/components/RICO-Browser/RicoBrowser";
import { ApprovalRequest } from "@/components/dashboard/ApprovalDialog";
import type { InspectedElementChip } from "@/lib/browser/types";
import {
  SplitSurfaceTool,
  WorkspaceActionEvent,
  WorkspaceDocSnapshot,
  WorkspaceExcelSnapshot,
} from "@/lib/rico-workspace/types";

const RicoDoc = dynamic(() => import("@/components/RICO-DOC/RicoDoc"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full p-6 space-y-3 bg-white">
      <div className="h-6 w-36 rounded-md bg-[#F1EFEF] animate-pulse motion-reduce:animate-none" />
      <div className="h-4 w-2/3 rounded bg-[#F8F7F7] animate-pulse motion-reduce:animate-none" />
    </div>
  ),
});

const RicoExcel = dynamic(() => import("@/components/RICO-Excel/RicoExcel"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full p-4 space-y-2.5 bg-white">
      <div className="h-7 w-full rounded-md bg-[#F8F7F7] animate-pulse motion-reduce:animate-none" />
      <div className="h-64 w-full rounded-md bg-[#F8F7F7]/60 animate-pulse motion-reduce:animate-none" />
    </div>
  ),
});

const RicoDashboard = dynamic(
  () => import("@/components/RICO-Dashboard/RicoDashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full p-5 space-y-3 bg-[#FCFCFC]">
        <div className="h-8 w-48 rounded-lg bg-[#F1EFEF] animate-pulse motion-reduce:animate-none" />
        <div className="grid grid-cols-3 gap-2.5">
          <div className="h-20 rounded-xl bg-white border border-[#E6E4E3] animate-pulse motion-reduce:animate-none" />
          <div className="h-20 rounded-xl bg-white border border-[#E6E4E3] animate-pulse motion-reduce:animate-none" />
          <div className="h-20 rounded-xl bg-white border border-[#E6E4E3] animate-pulse motion-reduce:animate-none" />
        </div>
      </div>
    ),
  }
);

interface RicoSplitWorkspaceProps {
  activeTool: SplitSurfaceTool | null;
  onSelectTool: (tool: SplitSurfaceTool | null) => void;
  onCloseSplit: () => void;
  isBrowserStreaming?: boolean;
  externalBrowserUrl?: string | null;
  externalBrowserSeq?: number;
  approvalRequest?: ApprovalRequest | null;
  onPickElementChip?: (chip: InspectedElementChip) => void;
  pendingWorkspaceAction?: WorkspaceActionEvent | null;
  onWorkspaceActionHandled?: (id: string) => void;
  onDocSnapshotChange?: (snap: WorkspaceDocSnapshot) => void;
  onExcelSnapshotChange?: (snap: WorkspaceExcelSnapshot) => void;
  onAskAgentContext?: (snippet: string) => void;
  onSendChatPrompt?: (prompt: string) => void;
  onDeployPlanMandate?: (service: string, price: number, planName: string) => void;
  onStageExactMandate?: (data: {
    service: string;
    budgetCeiling: string;
    recurrence?: string;
    category?: string;
  }) => void;
  onTriggerMandate?: (mandateId: string) => void;
  focusedDashboardId?: string | null;
  externalDataTick?: number;
}

const TOOLS: Array<{
  id: SplitSurfaceTool;
  label: string;
  dotColor: string;
}> = [
  { id: "browser", label: "Browser", dotColor: "bg-[#034CFF]" },
  { id: "doc", label: "Doc", dotColor: "bg-[#034CFF]" },
  { id: "excel", label: "Excel", dotColor: "bg-emerald-500" },
  { id: "dashboard", label: "Dashboard", dotColor: "bg-emerald-500 rico-live-dot" },
];

export function RicoSplitWorkspace({
  activeTool,
  onSelectTool,
  onCloseSplit,
  isBrowserStreaming = false,
  externalBrowserUrl,
  externalBrowserSeq = 0,
  approvalRequest,
  onPickElementChip,
  pendingWorkspaceAction,
  onWorkspaceActionHandled,
  onDocSnapshotChange,
  onExcelSnapshotChange,
  onAskAgentContext,
  onSendChatPrompt,
  onDeployPlanMandate,
  onStageExactMandate,
  onTriggerMandate,
  focusedDashboardId,
  externalDataTick,
}: RicoSplitWorkspaceProps) {
  const [hasOpenedBrowser, setHasOpenedBrowser] = useState<boolean>(
    activeTool === "browser"
  );
  const [hasOpenedDoc, setHasOpenedDoc] = useState<boolean>(
    activeTool === "doc"
  );
  const [hasOpenedExcel, setHasOpenedExcel] = useState<boolean>(
    activeTool === "excel"
  );
  const [hasOpenedDashboard, setHasOpenedDashboard] = useState<boolean>(
    activeTool === "dashboard"
  );

  useEffect(() => {
    if (activeTool === "browser" || isBrowserStreaming) {
      setHasOpenedBrowser(true);
    }
    if (activeTool === "doc" || pendingWorkspaceAction?.target === "doc") {
      setHasOpenedDoc(true);
    }
    if (activeTool === "excel" || pendingWorkspaceAction?.target === "excel") {
      setHasOpenedExcel(true);
    }
    if (
      activeTool === "dashboard" ||
      pendingWorkspaceAction?.target === "dashboard"
    ) {
      setHasOpenedDashboard(true);
    }
    if (activeTool === "excel" && typeof window !== "undefined") {
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
      });
    }
  }, [activeTool, isBrowserStreaming, pendingWorkspaceAction]);

  const renderIcon = (id: SplitSurfaceTool, sizeClass = "w-4 h-4") => {
    if (id === "browser") {
      return (
        <Globe
          className={`${sizeClass} stroke-[1.8] ${
            isBrowserStreaming ? "text-[#034CFF]" : ""
          }`}
          aria-hidden="true"
        />
      );
    }
    if (id === "doc") {
      return (
        <FileText className={`${sizeClass} stroke-[1.8]`} aria-hidden="true" />
      );
    }
    if (id === "dashboard") {
      return (
        <LayoutDashboard
          className={`${sizeClass} stroke-[1.8]`}
          aria-hidden="true"
        />
      );
    }
    return (
      <Table2 className={`${sizeClass} stroke-[1.8]`} aria-hidden="true" />
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-[oklch(0.994_0_89.876)] text-[oklch(0.097_0_0)] overflow-hidden">
      {/* RICO Split Workspace Header Bar */}
      <header
        className={`h-[44px] px-3 flex items-center shrink-0 select-none ${
          activeTool !== null
            ? "justify-between border-b border-[oklch(0.097_0_0_/_0.06)] pt-0"
            : "justify-end pt-3"
        }`}
      >
        {activeTool !== null && (
          <div
            role="tablist"
            aria-label="Workspace"
            className="inline-flex items-center p-0.5 rounded-full bg-[oklch(0.097_0_0_/_0.04)] max-w-[calc(100%-2.5rem)] overflow-x-auto no-scrollbar"
          >
            {TOOLS.map((t) => {
              const selected = activeTool === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onSelectTool(t.id)}
                  className={`h-7 px-2.5 sm:px-3 rounded-full text-[11.5px] sm:text-[12px] font-medium whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-[background-color,color] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
                    selected
                      ? "bg-white text-[oklch(0.097_0_0)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                      : "text-[#5C5858] hover:text-[#1E1B1B]"
                  }`}
                >
                  {selected ? (
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.dotColor}`} />
                  ) : (
                    renderIcon(t.id, "w-3.5 h-3.5")
                  )}
                  <span>{t.label}</span>
                  {t.id === "browser" && approvalRequest && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-amber-500"
                      aria-label="Approval required"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={onCloseSplit}
          aria-label="Close split view"
          title="Close split view"
          className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[oklch(0.097_0_0_/_0.55)] hover:text-[oklch(0.097_0_0)] hover:bg-[oklch(0.097_0_0_/_0.05)] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          <X className="w-4 h-4 stroke-[2]" aria-hidden="true" />
        </button>
      </header>

      {/* RICO Split Workspace Body */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {/* RICO Minimal Launcher */}
        {activeTool === null && (
          <div className="h-full w-full px-6 pt-3 pb-[116px] flex items-center justify-center select-none">
            <div className="w-full max-w-[440px] space-y-3.5">
              <p className="m-0 text-center text-[13px] font-medium text-[oklch(0.097_0_0_/_0.6)] tracking-[-0.01em]">
                Open in split
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {TOOLS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    data-testid={`split-option-${t.id}`}
                    onClick={() => onSelectTool(t.id)}
                    className="group h-[96px] rounded-2xl bg-[var(--rico-surface-elevated)] hover:bg-[var(--rico-bg-base)] active:translate-y-px border border-[var(--rico-border-weak)] hover:border-[var(--rico-border-base)] shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center gap-2.5 transition-[background-color,border-color,transform] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/40"
                  >
                    <span className="w-9 h-9 rounded-xl bg-[var(--rico-surface-base)] group-hover:bg-[var(--rico-surface-elevated)] border border-transparent group-hover:border-[var(--rico-border-weak)] flex items-center justify-center text-[var(--rico-text-strong)] transition-colors duration-100">
                      {renderIcon(t.id, "w-[18px] h-[18px]")}
                    </span>
                    <span className="text-[13px] font-medium tracking-[-0.01em] text-[var(--rico-text-strong)]">
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RICO-Browser */}
        {hasOpenedBrowser && (
          <div className={activeTool === "browser" ? "h-full w-full" : "hidden"}>
            <RicoBrowser
              externalFocusUrl={externalBrowserUrl}
              externalNavSeq={externalBrowserSeq}
              onPickElementChip={onPickElementChip}
            />
          </div>
        )}

        {/* RICO-DOC */}
        {hasOpenedDoc && (
          <div className={activeTool === "doc" ? "h-full w-full" : "hidden"}>
            <RicoDoc
              pendingAction={
                pendingWorkspaceAction?.target === "doc"
                  ? pendingWorkspaceAction
                  : null
              }
              onActionHandled={onWorkspaceActionHandled}
              onSnapshotChange={onDocSnapshotChange}
              onAskAgentWithSelection={(sel) =>
                onAskAgentContext?.(
                  `Regarding "${sel.slice(0, 180)}" in Doc: `
                )
              }
            />
          </div>
        )}

        {/* RICO-Excel */}
        {hasOpenedExcel && (
          <div className={activeTool === "excel" ? "h-full w-full" : "hidden"}>
            <RicoExcel
              pendingAction={
                pendingWorkspaceAction?.target === "excel"
                  ? pendingWorkspaceAction
                  : null
              }
              onActionHandled={onWorkspaceActionHandled}
              onSnapshotChange={onExcelSnapshotChange}
              onAskAgentWithRange={(range) =>
                onAskAgentContext?.(`Cells ${range}: `)
              }
            />
          </div>
        )}

        {/* RICO-Dashboard */}
        {hasOpenedDashboard && (
          <div
            className={activeTool === "dashboard" ? "h-full w-full" : "hidden"}
          >
            <RicoDashboard
              pendingAction={
                pendingWorkspaceAction?.target === "dashboard"
                  ? pendingWorkspaceAction
                  : null
              }
              focusedDashboardId={focusedDashboardId}
              externalDataTick={externalDataTick}
              onActionHandled={onWorkspaceActionHandled}
              onSelectWorkspaceTool={(tool) => onSelectTool(tool)}
              onSendChatPrompt={onSendChatPrompt}
              onStageMandate={(d) => {
                if (onStageExactMandate) {
                  onStageExactMandate({
                    service: d.service,
                    budgetCeiling: d.ceiling.toFixed(2),
                    recurrence: d.recurrence || "Monthly on 1st",
                    category: d.category || "Software & Cloud",
                  });
                } else {
                  onDeployPlanMandate?.(
                    d.service,
                    d.ceiling / 1.15,
                    d.recurrence || "Monthly"
                  );
                }
              }}
              onTriggerMandateQuote={onTriggerMandate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
