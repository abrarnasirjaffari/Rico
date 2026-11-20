"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  Edit3,
  Loader2,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { RicoUIRenderer } from "@/components/ricoui/RicoUIRenderer";
import { useAuth } from "@/lib/auth/AuthContext";
import type {
  RicoUIActionEvent,
  RicoUIDashboardRecord,
} from "@/lib/ricoui/types";
import type {
  SplitSurfaceTool,
  WorkspaceActionEvent,
} from "@/lib/rico-workspace/types";

export interface RicoDashboardProps {
  pendingAction?: WorkspaceActionEvent | null;
  focusedDashboardId?: string | null;
  externalDataTick?: number;
  onActionHandled?: (id: string) => void;
  onSelectWorkspaceTool?: (tool: SplitSurfaceTool) => void;
  onSendChatPrompt?: (prompt: string) => void;
  onStageMandate?: (data: {
    service: string;
    ceiling: number;
    recurrence?: string;
    category?: string;
  }) => void;
  onTriggerMandateQuote?: (mandateId: string) => void;
}

const OFFLINE_FALLBACK_DASHBOARD: RicoUIDashboardRecord = {
  id: "dash-demo-local",
  ownerId: "demo",
  title: "CFO Spend & Headroom Monitor",
  description:
    "Sign in or start Demo Sandbox in the sidebar to connect live database polling.",
  program: [
    "root = Stack([notice, kpis, chart])",
    'notice = Callout("Live RicoUI Dashboard", "Start Demo Sandbox in the left rail to stream live SQLite / PostgreSQL spending rules into this board.", "info")',
    "kpis = Grid([m1, m2, m3], 3)",
    'm1 = Metric("Sample Spend", "$46.48/mo", "77% of $60.00 cap", "safe")',
    'm2 = Metric("Headroom", "$13.52/mo", "3 active rules", "up")',
    'm3 = Metric("Auto-Refresh", "Zero AI Cost", "Direct DB interpreter", "neutral")',
    'chart = BarChart("Sample Subscriptions vs Ceilings", ["Netflix Standard HD", "Spotify Premium", "GitHub Copilot"], [15.49, 11.99, 19.0], [20.0, 15.0, 25.0], "$", "Verified", "Ceiling")',
  ].join("\n"),
  pinned: true,
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function RicoDashboard({
  pendingAction,
  focusedDashboardId,
  externalDataTick = 0,
  onActionHandled,
  onSelectWorkspaceTool,
  onSendChatPrompt,
  onStageMandate,
  onTriggerMandateQuote,
}: RicoDashboardProps) {
  const { user } = useAuth();
  const authUserId = user?.id ?? null;
  const [dashboards, setDashboards] = useState<RicoUIDashboardRecord[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(false);
  const [refreshTick, setRefreshTick] = useState<number>(0);
  const [isSignedOutFallback, setIsSignedOutFallback] = useState<boolean>(false);

  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [renameValue, setRenameValue] = useState<string>("");
  const [quickPrompt, setQuickPrompt] = useState<string>("");
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [boardMenuOpen, setBoardMenuOpen] = useState<boolean>(false);

  const loadDashboards = useCallback(async (preferredId?: string) => {
    setIsLoadingList(true);
    try {
      const res = await fetch("/api/ricoui/dashboards");
      if (res.status === 401) {
        setIsSignedOutFallback(true);
        setDashboards([OFFLINE_FALLBACK_DASHBOARD]);
        setActiveId(OFFLINE_FALLBACK_DASHBOARD.id);
        return;
      }
      if (!res.ok) throw new Error("Failed to load dashboards");
      const data = await res.json();
      const list: RicoUIDashboardRecord[] = Array.isArray(data.dashboards)
        ? data.dashboards
        : [];
      setIsSignedOutFallback(false);
      setDashboards(list);
      if (preferredId && list.some((d) => d.id === preferredId)) {
        setActiveId(preferredId);
      } else if (list.length > 0) {
        setActiveId((prev) =>
          prev && list.some((d) => d.id === prev) ? prev : list[0].id
        );
      }
    } catch {
      setDashboards([OFFLINE_FALLBACK_DASHBOARD]);
      setActiveId(OFFLINE_FALLBACK_DASHBOARD.id);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboards(focusedDashboardId || undefined);
  }, [loadDashboards, authUserId, focusedDashboardId]);

  useEffect(() => {
    if (externalDataTick > 0) {
      setRefreshTick((n) => n + 1);
    }
  }, [externalDataTick]);

  useEffect(() => {
    if (!pendingAction || pendingAction.target !== "dashboard") return;
    const targetDashId = pendingAction.dashboardId;
    void loadDashboards(targetDashId).then(() => {
      setRefreshTick((n) => n + 1);
      onActionHandled?.(pendingAction.id);
    });
  }, [pendingAction, loadDashboards, onActionHandled]);

  const activeBoard =
    dashboards.find((d) => d.id === activeId) ??
    dashboards[0] ??
    OFFLINE_FALLBACK_DASHBOARD;

  const handleTogglePin = async () => {
    if (isSignedOutFallback || !activeBoard) return;
    const nextPinned = !activeBoard.pinned;
    setDashboards((prev) =>
      prev.map((d) => (d.id === activeBoard.id ? { ...d, pinned: nextPinned } : d))
    );
    await fetch(`/api/ricoui/dashboards/${activeBoard.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: nextPinned }),
    }).catch(() => {});
    void loadDashboards(activeBoard.id);
  };

  const handleSaveRename = async () => {
    if (isSignedOutFallback || !activeBoard || !renameValue.trim()) {
      setIsRenaming(false);
      return;
    }
    const nextTitle = renameValue.trim();
    setIsRenaming(false);
    setDashboards((prev) =>
      prev.map((d) => (d.id === activeBoard.id ? { ...d, title: nextTitle } : d))
    );
    await fetch(`/api/ricoui/dashboards/${activeBoard.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: nextTitle }),
    }).catch(() => {});
  };

  const handleDelete = async () => {
    if (isSignedOutFallback || !activeBoard || dashboards.length <= 1) return;
    setIsMutating(true);
    try {
      const res = await fetch(`/api/ricoui/dashboards/${activeBoard.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const remaining = dashboards.filter((d) => d.id !== activeBoard.id);
        setDashboards(remaining);
        if (remaining[0]) setActiveId(remaining[0].id);
      }
    } finally {
      setIsMutating(false);
    }
  };

  const handleCreateNew = async () => {
    if (isSignedOutFallback) {
      onSendChatPrompt?.("Build a live SaaS spend dashboard");
      return;
    }
    setIsMutating(true);
    try {
      const res = await fetch("/api/ricoui/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Custom Board ${dashboards.length + 1}`,
          prompt: quickPrompt.trim() || "Monthly spend, ceilings, and category breakdown",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.dashboard) {
          setQuickPrompt("");
          await loadDashboards(data.dashboard.id);
        }
      }
    } finally {
      setIsMutating(false);
    }
  };

  const applyInPlaceEdit = useCallback(
    async (promptText: string) => {
      const trimmed = promptText.trim();
      if (!trimmed || !activeBoard) return;
      if (isSignedOutFallback) {
        onSendChatPrompt?.(trimmed);
        return;
      }
      setIsMutating(true);
      try {
        const res = await fetch(`/api/ricoui/dashboards/${activeBoard.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmed }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.dashboard) {
            setDashboards((prev) =>
              prev.map((d) =>
                d.id === data.dashboard.id ? data.dashboard : d
              )
            );
            setRefreshTick((n) => n + 1);
            setQuickPrompt("");
          }
        }
      } finally {
        setIsMutating(false);
      }
    },
    [activeBoard, isSignedOutFallback, onSendChatPrompt]
  );

  const handleQuickEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await applyInPlaceEdit(quickPrompt);
  };

  const handleRendererAction = useCallback(
    (event: RicoUIActionEvent) => {
      if (event.type === "open_workspace") {
        const tool = String(event.params?.tool || "excel") as SplitSurfaceTool;
        onSelectWorkspaceTool?.(tool);
      } else if (event.type === "continue_conversation") {
        const msg = event.humanFriendlyMessage;
        if (/\bto the dashboard\b/i.test(msg)) {
          void applyInPlaceEdit(msg);
        } else {
          onSendChatPrompt?.(msg);
        }
      } else if (event.type === "stage_mandate") {
        onStageMandate?.({
          service: String(event.params?.service ?? "Subscription"),
          ceiling: Number(event.params?.ceiling ?? 20),
          recurrence: event.params?.recurrence
            ? String(event.params.recurrence)
            : undefined,
          category: event.params?.category
            ? String(event.params.category)
            : undefined,
        });
      } else if (event.type === "create_mandate_direct") {
        onSendChatPrompt?.(event.humanFriendlyMessage);
      } else if (event.type === "trigger_mandate_quote") {
        const mid = String(event.params?.mandateId ?? "");
        if (mid) onTriggerMandateQuote?.(mid);
      } else if (event.type === "open_dashboard") {
        const id = String(event.params?.dashboardId ?? "");
        if (id) setActiveId(id);
      } else if (event.type === "open_url") {
        const url = String(event.params?.url ?? "");
        if (url && typeof window !== "undefined") {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      }
    },
    [
      applyInPlaceEdit,
      onSelectWorkspaceTool,
      onSendChatPrompt,
      onStageMandate,
      onTriggerMandateQuote,
    ]
  );

  return (
    <div className="h-full w-full flex flex-col bg-[#FCFCFC] text-[#1E1B1B] overflow-hidden">
      {/* Saved Boards Selector Bar */}
      <div className="px-3.5 py-2 border-b border-[#E6E4E3] bg-[#F8F7F7] flex items-center justify-between gap-2 shrink-0 relative">
        <div className="relative min-w-0 flex-1 max-w-[320px]">
          <button
            type="button"
            aria-label="Switch dashboard"
            aria-expanded={boardMenuOpen}
            onClick={() => setBoardMenuOpen((v) => !v)}
            className="h-8 w-full px-3 rounded-lg bg-white hover:bg-[#FCFCFC] border border-[#E6E4E3] shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-[12.5px] font-medium text-[#1E1B1B] flex items-center justify-between gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  activeBoard.pinned ? "bg-[#034CFF]" : "bg-emerald-500"
                }`}
              />
              <span className="truncate">{activeBoard.title}</span>
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="px-1.5 py-0.5 rounded bg-[#F1EFEF] font-mono text-[10.5px] text-[#5C5858]">
                {dashboards.length} {dashboards.length === 1 ? "board" : "boards"}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#5C5858] transition-transform ${
                  boardMenuOpen ? "rotate-180" : ""
                }`}
              />
            </span>
          </button>

          {boardMenuOpen && (
            <div
              role="listbox"
              aria-label="Saved dashboards"
              className="absolute left-0 top-10 z-50 w-[min(calc(100vw-1.75rem),320px)] rounded-xl border border-[#E6E4E3] bg-white p-1.5 shadow-[0_12px_32px_rgba(30,27,27,0.12)] space-y-0.5"
            >
              {dashboards.map((d) => {
                const selected = d.id === activeBoard?.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      setActiveId(d.id);
                      setBoardMenuOpen(false);
                    }}
                    className={`w-full px-2.5 py-2 rounded-lg text-left flex items-start justify-between gap-2 transition-colors ${
                      selected
                        ? "bg-[#F1EFEF] text-[#1E1B1B]"
                        : "hover:bg-[#F8F7F7] text-[#1E1B1B]"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {d.pinned && (
                          <Pin className="w-3 h-3 text-[#034CFF] shrink-0" />
                        )}
                        <span className="text-[12.5px] font-medium truncate">
                          {d.title}
                        </span>
                      </div>
                      <p className="m-0 mt-0.5 text-[11px] text-[#5C5858] truncate">
                        {d.description}
                      </p>
                    </div>
                    <span className="text-[10.5px] font-mono text-[#8A8585] shrink-0 mt-0.5">
                      v{d.version}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCreateNew}
            disabled={isMutating}
            title="Create new live dashboard"
            className="h-7 px-2 rounded-lg border border-[#D6D3D1] bg-white hover:bg-[#F1EFEF] text-[11.5px] font-medium text-[#1E1B1B] inline-flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
          <button
            type="button"
            onClick={() => setRefreshTick((n) => n + 1)}
            title="Refresh live database queries (zero AI tokens)"
            className="w-7 h-7 rounded-lg border border-[#E6E4E3] bg-white hover:bg-[#F1EFEF] flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B]"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetchingData ? "animate-spin text-[#034CFF]" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Active Board Title & Controls */}
      <div className="px-4 py-2.5 border-b border-[#F1EFEF] bg-white flex items-center justify-between gap-3 shrink-0">
        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSaveRename();
                  if (e.key === "Escape") setIsRenaming(false);
                }}
                autoFocus
                className="h-7 px-2 rounded border border-[#034CFF] text-[13px] font-semibold text-[#1E1B1B] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void handleSaveRename()}
                className="w-7 h-7 rounded bg-[#1E1B1B] text-white flex items-center justify-center"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 rico-live-dot shrink-0" />
              <h2 className="m-0 text-[14px] font-semibold tracking-[-0.015em] text-[#1E1B1B] truncate">
                {activeBoard.title}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10.5px] font-mono font-medium shrink-0">
                v{activeBoard.version}
                {activeBoard.refreshSeconds ? ` · ${activeBoard.refreshSeconds}s` : " · Live"}
              </span>
            </div>
          )}
          <p className="m-0 mt-0.5 text-[11.5px] text-[#5C5858] truncate">
            {activeBoard.description}
          </p>
        </div>

        {!isSignedOutFallback && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setRenameValue(activeBoard.title);
                setIsRenaming(true);
              }}
              title="Rename dashboard"
              className="w-7 h-7 rounded-lg hover:bg-[#F1EFEF] flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B]"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => void handleTogglePin()}
              title={activeBoard.pinned ? "Unpin dashboard" : "Pin dashboard"}
              className="w-7 h-7 rounded-lg hover:bg-[#F1EFEF] flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B]"
            >
              {activeBoard.pinned ? (
                <PinOff className="w-3.5 h-3.5 text-[#034CFF]" />
              ) : (
                <Pin className="w-3.5 h-3.5" />
              )}
            </button>
            {dashboards.length > 1 && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isMutating}
                title="Delete dashboard"
                className="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-[#8A8585] hover:text-rose-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Live Rendered RicoUI Canvas */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 rico-scroller">
        {isLoadingList ? (
          <div className="h-40 flex items-center justify-center gap-2 text-[13px] text-[#5C5858]">
            <Loader2 className="w-4 h-4 animate-spin text-[#034CFF]" />
            <span>Loading RicoUI Dashboard...</span>
          </div>
        ) : (
          <RicoUIRenderer
            key={activeBoard.id}
            response={activeBoard.program}
            interpreterUrl={
              isSignedOutFallback ? undefined : "/api/ricoui/interpreter"
            }
            dashboardId={activeBoard.id}
            refreshSignal={refreshTick}
            onFetchStateChange={setIsFetchingData}
            onAction={handleRendererAction}
          />
        )}
      </div>

      {/* Surgical In-Place Edit Bar */}
      <form
        onSubmit={handleQuickEditSubmit}
        className="px-3 sm:px-3.5 py-2.5 border-t border-[#E6E4E3] bg-white flex items-center gap-2.5 shrink-0"
      >
        <span className="w-2 h-2 rounded-full bg-[#034CFF] shrink-0" />
        <input
          type="text"
          value={quickPrompt}
          onChange={(e) => setQuickPrompt(e.target.value)}
          placeholder='Update board (e.g. "Add transactions table", "Add runway simulator")...'
          className="flex-1 min-w-0 h-8 text-[12.5px] bg-transparent text-[#1E1B1B] placeholder:text-[#8A8585] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!quickPrompt.trim() || isMutating}
          className="h-8 px-3 rounded-lg bg-[#034CFF] hover:bg-[#023ECC] disabled:bg-[#E6E4E3] disabled:text-[#8A8585] text-white text-[11.5px] font-medium shrink-0 transition-colors"
        >
          {isMutating ? "Updating..." : "Update"}
        </button>
      </form>
    </div>
  );
}
