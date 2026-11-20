"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Globe,
  Loader2,
  Plus,
  RotateCw,
  Search,
  X,
} from "lucide-react";
import type {
  InspectedElementChip,
  LiveBrowserTabInfo,
  ScreencastFrame,
  SemanticElementNode,
} from "@/lib/browser/types";

interface RicoRealBrowserProps {
  externalFocusUrl?: string | null;
  onPickElementChip?: (chip: InspectedElementChip) => void;
}

const VIEWPORT_WIDTH = 960;
const VIEWPORT_HEIGHT = 860;

export function RicoRealBrowser({
  externalFocusUrl,
  onPickElementChip,
}: RicoRealBrowserProps) {
  const [tabs, setTabs] = useState<LiveBrowserTabInfo[]>([]);
  const [focusedTabId, setFocusedTabId] = useState<string | null>(null);
  const [activeUrl, setActiveUrl] = useState<string>("");
  const [urlInput, setUrlInput] = useState<string>("");
  const [newTabQuery, setNewTabQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [canGoForward, setCanGoForward] = useState<boolean>(false);
  const [generation, setGeneration] = useState<number>(1);
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [isInspectMode, setIsInspectMode] = useState<boolean>(false);
  const [hoveredElement, setHoveredElement] =
    useState<SemanticElementNode | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasStageRef = useRef<HTMLDivElement | null>(null);
  const lastExternalUrlRef = useRef<string | null>(null);
  const lastHoverSentRef = useRef<number>(0);

  const syncTabsFromPool = useCallback(async () => {
    try {
      const res = await fetch("/api/browser/semantic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "tabs.list" }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.tabs)) {
        setTabs(data.tabs);
        setFocusedTabId(data.focusedTabId || null);
        const active = data.tabs.find(
          (t: LiveBrowserTabInfo) => t.id === data.focusedTabId
        );
        if (active) {
          const cleanUrl = active.url === "about:blank" ? "" : active.url;
          setActiveUrl(cleanUrl);
          setUrlInput(cleanUrl);
          setCanGoBack(Boolean(active.canGoBack));
          setCanGoForward(Boolean(active.canGoForward));
          setGeneration(active.generation || 1);
          setIsLoading(Boolean(active.loading));
        }
      }
    } catch {
      // Ignore transient network errors
    }
  }, []);

  // Load real tabs on mount
  useEffect(() => {
    void syncTabsFromPool();
  }, [syncTabsFromPool]);

  // Paint real JPEG CDP frames (strictly ignoring any SVG demo frames)
  useEffect(() => {
    if (!currentFrame || !canvasRef.current) return;
    if (currentFrame.startsWith("data:image/svg+xml")) return;

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
      ctx.drawImage(img, 0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    };
    img.src = currentFrame;
    return () => {
      cancelled = true;
    };
  }, [currentFrame]);

  // Subscribe to live CDP screencast SSE stream
  useEffect(() => {
    let es: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      es = new EventSource("/api/browser/screencast");

      es.addEventListener("frame", (ev) => {
        try {
          const payload = JSON.parse(ev.data) as ScreencastFrame;
          // Ignore legacy SVG mock frames — only render real Chromium JPEG captures
          if (payload.frame && !payload.frame.startsWith("data:image/svg+xml")) {
            setCurrentFrame(payload.frame);
            if (payload.url && payload.url !== "about:blank") {
              setActiveUrl(payload.url);
              setUrlInput((prev) =>
                document.activeElement?.id === "rico-browser-omnibox"
                  ? prev
                  : payload.url
              );
            }
            setIsLoading(payload.status === "navigating");
            if (payload.status === "ready") {
              setTabs((prev) => prev.map((t) => ({ ...t, loading: false })));
            }
          }
        } catch {
          // Ignore malformed frame
        }
      });

      es.addEventListener("nav", (ev) => {
        try {
          const nav = JSON.parse(ev.data);
          if (typeof nav.canGoBack === "boolean") setCanGoBack(nav.canGoBack);
          if (typeof nav.canGoForward === "boolean") {
            setCanGoForward(nav.canGoForward);
          }
          if (typeof nav.generation === "number") setGeneration(nav.generation);
          void syncTabsFromPool();
        } catch {
          // Ignore
        }
      });

      es.addEventListener("bots", () => {
        void syncTabsFromPool();
      });

      es.onerror = () => {
        es?.close();
        retryTimer = setTimeout(connect, 2000);
      };
    };

    connect();
    return () => {
      es?.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [syncTabsFromPool]);

  const navigateTo = useCallback(
    async (rawInput: string, targetTabId?: string) => {
      const trimmed = rawInput.trim();
      if (!trimmed) return;
      setIsLoading(true);
      try {
      const res = await fetch("/api/browser/tab-nav", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: trimmed,
          tabId: targetTabId || focusedTabId || undefined,
        }),
      });
        const data = await res.json();
        if (data.success && data.tab) {
          const tab = data.tab as LiveBrowserTabInfo;
          setFocusedTabId(tab.id);
          const clean = tab.url === "about:blank" ? "" : tab.url;
          setActiveUrl(clean);
          setUrlInput(clean);
          setCanGoBack(Boolean(tab.canGoBack));
          setCanGoForward(Boolean(tab.canGoForward));
          setGeneration(tab.generation || 1);
          if (data.pool?.tabs) {
            setTabs(data.pool.tabs);
          }
        }
      } catch (err) {
        console.warn("Browser navigation failed:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [focusedTabId]
  );

  // Follow external URL navigations triggered by Rico in chat
  useEffect(() => {
    if (
      externalFocusUrl &&
      externalFocusUrl.trim() &&
      externalFocusUrl !== lastExternalUrlRef.current
    ) {
      lastExternalUrlRef.current = externalFocusUrl;
      void syncTabsFromPool();
    }
  }, [externalFocusUrl, syncTabsFromPool]);

  const handleOpenNewTab = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/browser/semantic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "tabs.open", focus: true }),
      });
      const data = await res.json();
      if (data.success && data.tab) {
        setFocusedTabId(data.tab.id);
        setActiveUrl("");
        setUrlInput("");
        setCurrentFrame(null);
        setCanGoBack(false);
        setCanGoForward(false);
        if (data.pool?.tabs) setTabs(data.pool.tabs);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFocusTab = async (tabId: string) => {
    if (tabId === focusedTabId) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/browser/semantic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "tabs.focus", tabId }),
      });
      const data = await res.json();
      if (data.success && data.tab) {
        const tab = data.tab as LiveBrowserTabInfo;
        setFocusedTabId(tab.id);
        const clean = tab.url === "about:blank" ? "" : tab.url;
        setActiveUrl(clean);
        setUrlInput(clean);
        if (!clean) setCurrentFrame(null);
        setCanGoBack(Boolean(tab.canGoBack));
        setCanGoForward(Boolean(tab.canGoForward));
        setGeneration(tab.generation || 1);
        if (data.pool?.tabs) setTabs(data.pool.tabs);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseTab = async (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/browser/semantic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "tabs.close", tabId }),
      });
      const data = await res.json();
      if (data.success && data.pool) {
        const nextTabs: LiveBrowserTabInfo[] = data.pool.tabs || [];
        setTabs(nextTabs);
        const nextFocused = data.pool.focusedTabId || null;
        setFocusedTabId(nextFocused);
        if (!nextFocused || nextTabs.length === 0) {
          setActiveUrl("");
          setUrlInput("");
          setCurrentFrame(null);
          setCanGoBack(false);
          setCanGoForward(false);
        } else {
          const active = nextTabs.find((t) => t.id === nextFocused);
          if (active) {
            const clean = active.url === "about:blank" ? "" : active.url;
            setActiveUrl(clean);
            setUrlInput(clean);
            if (!clean) setCurrentFrame(null);
          }
        }
      }
    } catch {
      // Ignore
    }
  };

  const handleHistoryNav = async (dir: "back" | "forward") => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/browser/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: dir,
          tabId: focusedTabId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.tab) {
        const clean = data.tab.url === "about:blank" ? "" : data.tab.url;
        setActiveUrl(clean);
        setUrlInput(clean);
        setCanGoBack(Boolean(data.tab.canGoBack));
        setCanGoForward(Boolean(data.tab.canGoForward));
        setGeneration(data.tab.generation || 1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReload = async () => {
    if (!focusedTabId && !activeUrl) return;
    setIsLoading(true);
    try {
      await fetch("/api/browser/tab-nav", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "reload",
          tabId: focusedTabId || undefined,
        }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const mapPointerToViewport = (
    e: React.MouseEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const x = Math.round(((e.clientX - rect.left) / rect.width) * VIEWPORT_WIDTH);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * VIEWPORT_HEIGHT);
    return {
      x: Math.max(0, Math.min(VIEWPORT_WIDTH, x)),
      y: Math.max(0, Math.min(VIEWPORT_HEIGHT, y)),
    };
  };

  const handleCanvasClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = mapPointerToViewport(e);
    if (!coords) return;

    canvasStageRef.current?.focus();

    if (isInspectMode && hoveredElement && onPickElementChip) {
      onPickElementChip({
        ref: hoveredElement.ref,
        role: hoveredElement.role,
        name: hoveredElement.name,
        tagName: hoveredElement.tagName || "element",
        tabId: focusedTabId || "live",
        url: activeUrl,
        generation,
      });
      setIsInspectMode(false);
      setHoveredElement(null);
      return;
    }

    await fetch("/api/browser/interact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "click",
        x: coords.x,
        y: coords.y,
        tabId: focusedTabId || undefined,
      }),
    }).catch(() => {});
  };

  const handleCanvasMouseMove = async (
    e: React.MouseEvent<HTMLCanvasElement>
  ) => {
    if (!isInspectMode) return;
    const now = Date.now();
    if (now - lastHoverSentRef.current < 90) return;
    lastHoverSentRef.current = now;

    const coords = mapPointerToViewport(e);
    if (!coords) return;

    try {
      const res = await fetch("/api/browser/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mouse_move",
          x: coords.x,
          y: coords.y,
          tabId: focusedTabId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHoveredElement(data.hoveredElement || null);
      }
    } catch {
      // Ignore
    }
  };

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!activeUrl) return;
    void fetch("/api/browser/interact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "scroll",
        deltaX: Math.round(e.deltaX),
        deltaY: Math.round(e.deltaY),
        tabId: focusedTabId || undefined,
      }),
    }).catch(() => {});
  };

  const handleCanvasKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!activeUrl) return;
    if (e.metaKey || e.ctrlKey) {
      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        void handleReload();
      }
      return;
    }
    e.preventDefault();
    void fetch("/api/browser/interact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "key_event",
        eventType: "keyDown",
        key: e.key,
        code: e.code,
        text: e.key.length === 1 ? e.key : undefined,
        keyCode: e.keyCode,
        tabId: focusedTabId || undefined,
      }),
    }).catch(() => {});
  };

  const handleToggleInspect = async () => {
    const next = !isInspectMode;
    setIsInspectMode(next);
    setHoveredElement(null);
    if (next && activeUrl) {
      await fetch("/api/browser/semantic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "snapshot",
          tabId: focusedTabId || undefined,
        }),
      }).catch(() => {});
    }
  };

  const showStartPage = !activeUrl && !currentFrame;

  return (
    <div className="h-full w-full flex flex-col bg-white text-[#1E1B1B] overflow-hidden select-none">
      {/* Real Tab Strip (only shown when 1+ real tabs exist) */}
      {tabs.length > 0 && (
        <div className="h-9 px-2 bg-[#F8F7F7] border-b border-[#E6E4E3] flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
          {tabs.map((tab) => {
            const active = tab.id === focusedTabId;
            const label =
              tab.title && tab.title !== "about:blank"
                ? tab.title
                : tab.service || "New Tab";
            return (
              <div
                key={tab.id}
                className={`group h-7 max-w-[180px] pl-2.5 pr-1 rounded-md text-[12px] inline-flex items-center gap-1.5 border transition-colors ${
                  active
                    ? "bg-white border-[#E6E4E3] text-[#1E1B1B] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                    : "bg-transparent border-transparent text-[#5C5858] hover:bg-[#EFECEB]/70 hover:text-[#1E1B1B]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleFocusTab(tab.id)}
                  className="flex items-center gap-1.5 min-w-0 flex-1 text-left focus-visible:outline-none"
                >
                  {tab.loading ? (
                    <Loader2
                      className="w-3 h-3 animate-spin text-[#034CFF] shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <Globe
                      className="w-3 h-3 text-[#8A8585] shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span className="truncate">{label}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  aria-label={`Close ${label}`}
                  className="w-4 h-4 rounded flex items-center justify-center text-[#8A8585] hover:text-[#1E1B1B] hover:bg-[#EFECEB] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/20 shrink-0"
                >
                  <X className="w-2.5 h-2.5" aria-hidden="true" />
                </button>
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleOpenNewTab}
            aria-label="New tab"
            title="New tab"
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#EFECEB] transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Real Browser Omnibox Bar */}
      <div className="h-10 px-2.5 bg-[#FCFCFC] border-b border-[#E6E4E3] flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => handleHistoryNav("back")}
          disabled={!canGoBack}
          aria-label="Back"
          title="Back"
          className="w-7 h-7 rounded-md flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF] disabled:opacity-35 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => handleHistoryNav("forward")}
          disabled={!canGoForward}
          aria-label="Forward"
          title="Forward"
          className="w-7 h-7 rounded-md flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF] disabled:opacity-35 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={handleReload}
          disabled={!activeUrl && !focusedTabId}
          aria-label="Reload"
          title="Reload"
          className="w-7 h-7 rounded-md flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF] disabled:opacity-35 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          <RotateCw
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void navigateTo(urlInput);
          }}
          className="flex-1 min-w-0"
        >
          <label htmlFor="rico-browser-omnibox" className="sr-only">
            Search or enter website URL
          </label>
          <input
            id="rico-browser-omnibox"
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Search or enter URL"
            autoComplete="off"
            spellCheck={false}
            className="w-full h-7 px-3 rounded-full bg-[#F1EFEF] focus:bg-white border border-transparent focus:border-[#D6D3D1] text-[12px] text-[#1E1B1B] placeholder:text-[#8A8585] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/30 transition-colors"
          />
        </form>

        {onPickElementChip && activeUrl && (
          <button
            type="button"
            onClick={handleToggleInspect}
            aria-pressed={isInspectMode}
            aria-label="Pick element for chat"
            title="Pick element on page to reference in chat"
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
              isInspectMode
                ? "bg-[#034CFF]/12 text-[#034CFF]"
                : "text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF]"
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}

        {tabs.length === 0 && (
          <button
            type="button"
            onClick={handleOpenNewTab}
            aria-label="New tab"
            title="New tab"
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Top Subtle Loading Bar */}
      {isLoading && (
        <div className="h-[2px] w-full bg-[#F1EFEF] overflow-hidden shrink-0">
          <div className="h-full w-1/3 bg-[#034CFF] oc-browser-progress" />
        </div>
      )}

      {/* Viewport Surface */}
      <div
        ref={canvasStageRef}
        tabIndex={0}
        onKeyDown={handleCanvasKeyDown}
        className="flex-1 min-h-0 w-full relative bg-white flex items-center justify-center overflow-hidden focus:outline-none"
      >
        {showStartPage ? (
          <div className="w-full max-w-[380px] px-6 pb-16 flex flex-col items-center gap-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void navigateTo(newTabQuery);
              }}
              className="w-full relative"
            >
              <label htmlFor="rico-newtab-search" className="sr-only">
                Search or enter URL
              </label>
              <Search
                className="w-4 h-4 text-[#8A8585] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="rico-newtab-search"
                type="text"
                value={newTabQuery}
                onChange={(e) => setNewTabQuery(e.target.value)}
                placeholder="Search the web or enter URL..."
                autoComplete="off"
                spellCheck={false}
                className="w-full h-10 pl-10 pr-4 rounded-full bg-[#F8F7F7] hover:bg-[#F1EFEF] focus:bg-white border border-[#E6E4E3] focus:border-[#D6D3D1] text-[13px] text-[#1E1B1B] placeholder:text-[#8A8585] shadow-[0_1px_2px_rgba(0,0,0,0.03)] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/15 transition-colors"
              />
            </form>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-start justify-center bg-white overflow-hidden">
            <canvas
              ref={canvasRef}
              width={VIEWPORT_WIDTH}
              height={VIEWPORT_HEIGHT}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              onWheel={handleCanvasWheel}
              className={`w-full max-h-full aspect-[960/860] bg-white ${
                isInspectMode ? "cursor-crosshair" : "cursor-auto"
              }`}
            />

            {isInspectMode && hoveredElement && (
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-[#1E1B1B]/90 text-white text-[11.5px] font-mono pointer-events-none">
                {hoveredElement.ref} · {hoveredElement.role}
                {hoveredElement.name
                  ? ` "${hoveredElement.name.slice(0, 36)}"`
                  : ""}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
