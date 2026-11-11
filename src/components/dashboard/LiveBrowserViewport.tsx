"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Lock,
  Search,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  Terminal,
  Zap,
  Globe,
  Sparkles,
  TrendingDown,
  Check,
  User,
  Loader2,
  Layers,
  Crosshair,
  Plus,
  X,
  ShieldAlert,
  Clock,
} from "lucide-react";
import {
  ScreencastFrame,
  CursorEvent,
  HelperBotSession,
  ParallelVerificationResult,
  CalmPricingResult,
  BrowserActivityLog,
  SemanticSnapshotResult,
  SemanticElementNode,
  BrowserTabDiagnostics,
  HelpTheAgentWallState,
  InspectedElementChip,
} from "@/lib/browser/types";
import { CalmPricingLens } from "./CalmPricingLens";
import { NeedsYouBanner } from "./NeedsYouBanner";
import { ApprovalRequest } from "./ApprovalDialog";
import { TakeoverChallengeModal } from "./TakeoverChallengeModal";

interface LiveBrowserViewportProps {
  onPlanSelected?: (service: string, price: number, planName: string) => void;
  approvalRequest?: ApprovalRequest | null;
  onApproveApproval?: (fundingSource?: "PAYPAL" | "BACKUP_CARD") => void;
  onRejectApproval?: () => void;
  externalFocusUrl?: string | null;
  onPickElementChip?: (chip: InspectedElementChip) => void;
  className?: string;
}

type DrawerTab = "trace" | "axtree" | "network" | "console" | "guards";

function isLikelyUrl(val: string): boolean {
  const t = val.trim();
  if (/^https?:\/\//i.test(t)) return true;
  if (t.includes(" ")) return false;
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(t);
}

function formatCountdown(expiresAt: number, nowMs: number): string {
  const remainingSec = Math.max(0, Math.ceil((expiresAt - nowMs) / 1000));
  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function LiveBrowserViewport({
  onPlanSelected,
  approvalRequest,
  onApproveApproval,
  onRejectApproval,
  externalFocusUrl,
  onPickElementChip,
  className = "",
}: LiveBrowserViewportProps) {
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [activeUrl, setActiveUrl] = useState<string>(
    "https://help.netflix.com/en/node/24926"
  );
  const [inputUrl, setInputUrl] = useState<string>(
    "https://help.netflix.com/en/node/24926"
  );
  const [pageTitle, setPageTitle] = useState<string>(
    "Netflix Subscription & Pricing"
  );
  const [cursor, setCursor] = useState<CursorEvent | null>({
    x: 410,
    y: 524,
    action: "click",
    label: "Ready ($15.49/mo)",
    timestamp: Date.now(),
  });
  const [fps, setFps] = useState<number>(30);
  const [status, setStatus] = useState<ScreencastFrame["status"]>("ready");
  const [actionLabel, setActionLabel] = useState<string>("Ready");
  const [totalFrames, setTotalFrames] = useState<number>(1);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showConsole, setShowConsole] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("trace");
  const [clickRipple, setClickRipple] = useState<{ x: number; y: number } | null>(
    null
  );

  // V2 Navigation History & Generation State (from CDP Page.getNavigationHistory)
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [canGoForward, setCanGoForward] = useState<boolean>(false);
  const [generation, setGeneration] = useState<number>(1);

  // Dynamic Browser Tabs & Zephium Hover Fan Card State
  const [bots, setBots] = useState<HelperBotSession[]>([]);
  const [activeBotId, setActiveBotId] = useState<string>("bot-netflix");
  const [hoveredFanTabId, setHoveredFanTabId] = useState<string | null>(null);
  const [isOpeningTab, setIsOpeningTab] = useState<boolean>(false);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [bestDeal, setBestDeal] =
    useState<ParallelVerificationResult["bestDeal"] | null>(null);

  // V2 Semantic AXTree & OpenCode Element Picker (@eN -> Chat Prompt)
  const [isInspectMode, setIsInspectMode] = useState<boolean>(false);
  const [isSnapshotting, setIsSnapshotting] = useState<boolean>(false);
  const [semanticSnapshot, setSemanticSnapshot] =
    useState<SemanticSnapshotResult | null>(null);
  const [hoveredElement, setHoveredElement] =
    useState<SemanticElementNode | null>(null);
  const [diagnostics, setDiagnostics] =
    useState<BrowserTabDiagnostics | null>(null);

  // V2 Zephium Help-the-Agent Login / 2FA Wall Detector
  const [activeWall, setActiveWall] =
    useState<HelpTheAgentWallState | null>(null);
  const [wallClockNow, setWallClockNow] = useState<number>(() => Date.now());

  // Zephium Calm Pricing Lens State
  const [isCalmLensActive, setIsCalmLensActive] = useState<boolean>(false);
  const [calmData, setCalmData] = useState<CalmPricingResult | null>(null);
  const [isSimplifying, setIsSimplifying] = useState<boolean>(false);

  // Zephium "Needs You" Decision Banner State
  const [simulatedApproval, setSimulatedApproval] =
    useState<ApprovalRequest | null>(null);
  const activeApproval = approvalRequest || simulatedApproval;

  // Pair Browsing / Human Takeover Mode
  const [isTakeoverActive, setIsTakeoverActive] = useState<boolean>(false);
  const [activeChallenge, setActiveChallenge] = useState<
    "CLOUDFLARE_TURNSTILE" | "TWO_FACTOR_SMS" | null
  >(null);

  const [cdpLogs, setCdpLogs] = useState<string[]>([
    "[CDP] Chromium DevTools HTML5 canvas screencast initialized (960x860)",
    "[SSE] Subscribed to /api/browser/screencast live stream",
  ]);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastExternalUrlRef = useRef<string | null>(null);
  const lastHoverDispatchRef = useRef<number>(0);

  const addLog = useCallback((msg: string) => {
    setCdpLogs((prev) => [
      ...prev.slice(-45),
      `[${new Date().toLocaleTimeString()}] ${msg}`,
    ]);
  }, []);

  // Paint incoming JPEG / SVG base64 frames onto HTML5 <canvas> without flicker or layout shift
  useEffect(() => {
    if (!currentFrame || !canvasRef.current) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, 960, 860);
      ctx.drawImage(img, 0, 0, 960, 860);
    };
    img.src = currentFrame;
    return () => {
      cancelled = true;
    };
  }, [currentFrame]);

  // Tick wall countdown clock every second while a Help-the-Agent wall is visible
  useEffect(() => {
    if (!activeWall?.detected) return;
    const timer = setInterval(() => {
      setWallClockNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [activeWall?.detected]);

  const refreshSemanticState = useCallback(
    async (forceSnapshot: boolean = false) => {
      if (forceSnapshot) setIsSnapshotting(true);
      try {
        const res = await fetch(
          `/api/browser/semantic${forceSnapshot ? "?refresh=1" : ""}`
        );
        const data = await res.json();
        if (data.success) {
          if (data.snapshot) {
            setSemanticSnapshot(data.snapshot);
            setGeneration(data.snapshot.generation);
            if (data.snapshot.wall?.detected) {
              setActiveWall(data.snapshot.wall);
            }
          }
          if (data.diagnostics) {
            setDiagnostics(data.diagnostics);
            setCanGoBack(Boolean(data.diagnostics.canGoBack));
            setCanGoForward(Boolean(data.diagnostics.canGoForward));
            setGeneration(data.diagnostics.generation || 1);
          }
        }
      } catch {
        // ignore offline
      } finally {
        if (forceSnapshot) setIsSnapshotting(false);
      }
    },
    []
  );

  // Refresh diagnostics when Developer Drawer is opened
  useEffect(() => {
    if (showConsole) {
      void refreshSemanticState(drawerTab === "axtree" && !semanticSnapshot);
    }
  }, [showConsole, drawerTab, refreshSemanticState, semanticSnapshot]);

  const loadCalmPricing = useCallback(
    async (serviceNameOrUrl: string) => {
      setIsSimplifying(true);
      try {
        const res = await fetch("/api/browser/simplify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ service: serviceNameOrUrl, url: activeUrl }),
        });
        const data = await res.json();
        if (data.success && data.result) {
          setCalmData(data.result);
          addLog(
            `[Calm Lens] Normalized ${data.result.service}: ${data.result.darkPatternsStrippedCount} dark patterns stripped.`
          );
        }
      } catch (err) {
        addLog(
          `[Calm Lens Error]: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setIsSimplifying(false);
      }
    },
    [activeUrl, addLog]
  );

  useEffect(() => {
    fetch("/api/browser/parallel")
      .then((res) => res.json())
      .then((data) => {
        if (data.bots && data.bots.length > 0) {
          setBots(data.bots);
          if (data.activeBotId) setActiveBotId(data.activeBotId);
        }
      })
      .catch(() => {});

    loadCalmPricing("netflix");
  }, [loadCalmPricing]);

  // Connect to live SSE endpoint (frames + tabs + nav history + walls + real-time agent activity)
  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    function connect() {
      try {
        es = new EventSource("/api/browser/screencast");
        eventSourceRef.current = es;

        es.addEventListener("open", () => {
          setIsConnected(true);
        });

        es.addEventListener("connected", (event) => {
          setIsConnected(true);
          try {
            const data = JSON.parse(event.data);
            if (data.info?.currentUrl) {
              setActiveUrl(data.info.currentUrl);
              setInputUrl(data.info.currentUrl);
            }
            if (typeof data.info?.canGoBack === "boolean") {
              setCanGoBack(data.info.canGoBack);
            }
            if (typeof data.info?.canGoForward === "boolean") {
              setCanGoForward(data.info.canGoForward);
            }
            if (typeof data.info?.generation === "number") {
              setGeneration(data.info.generation);
            }
            if (data.info?.wall !== undefined) {
              setActiveWall(data.info.wall);
            }
            if (Array.isArray(data.bots) && data.bots.length > 0) {
              setBots(data.bots);
            }
            if (data.activeBotId) {
              setActiveBotId(data.activeBotId);
            }
          } catch {
            // ignore
          }
        });

        es.addEventListener("bots", (event) => {
          try {
            const data = JSON.parse(event.data);
            if (Array.isArray(data.bots)) {
              setBots(data.bots);
            }
            if (data.activeBotId) {
              setActiveBotId(data.activeBotId);
            }
          } catch {
            // ignore
          }
        });

        es.addEventListener("nav", (event) => {
          try {
            const nav = JSON.parse(event.data);
            if (typeof nav.canGoBack === "boolean") setCanGoBack(nav.canGoBack);
            if (typeof nav.canGoForward === "boolean")
              setCanGoForward(nav.canGoForward);
            if (typeof nav.generation === "number") setGeneration(nav.generation);
            if (nav.wall !== undefined) {
              setActiveWall(nav.wall);
              setWallClockNow(Date.now());
            }
          } catch {
            // ignore
          }
        });

        es.addEventListener("activity", (event) => {
          try {
            const act: BrowserActivityLog = JSON.parse(event.data);
            setActionLabel(act.detail);
            if (act.url) {
              setActiveUrl(act.url);
              setInputUrl(act.url);
            }
            if (act.title) {
              setPageTitle(act.title);
            }
            if (act.phase === "search" || act.phase === "navigate") {
              setStatus("navigating");
            } else if (
              act.phase === "scroll" ||
              act.phase === "inspect" ||
              act.phase === "snapshot" ||
              act.phase === "act"
            ) {
              setStatus("evaluating");
            } else if (act.phase === "complete") {
              setStatus("ready");
            }
            setCdpLogs((prev) => [
              ...prev.slice(-45),
              `[${new Date(act.timestamp).toLocaleTimeString()}] [${act.phase.toUpperCase()}] ${act.detail}`,
            ]);
          } catch {
            // ignore
          }
        });

        es.addEventListener("frame", (event) => {
          try {
            const data: ScreencastFrame = JSON.parse(event.data);
            setIsCalmLensActive(false);
            if (data.frame) {
              setCurrentFrame(data.frame);
            }
            if (data.url) {
              setActiveUrl(data.url);
              setInputUrl(data.url);
            }
            if (data.title) {
              setPageTitle(data.title);
            }
            if (data.fps) {
              setFps(data.fps);
            }
            if (data.status) {
              setStatus(data.status);
            }
            if (data.actionLabel) {
              setActionLabel(data.actionLabel);
            }
            if (data.cursor) {
              setCursor(data.cursor);
              if (data.cursor.action === "click") {
                setClickRipple({ x: data.cursor.x, y: data.cursor.y });
                setTimeout(() => setClickRipple(null), 700);
              }
            }
            setTotalFrames((prev) => prev + 1);
          } catch (e) {
            console.error("Failed to parse screencast frame:", e);
          }
        });

        es.onerror = () => {
          setIsConnected(false);
          if (es) {
            es.close();
            es = null;
          }
          reconnectTimer = setTimeout(connect, 2500);
        };
      } catch {
        reconnectTimer = setTimeout(connect, 2500);
      }
    }

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (es) {
        es.close();
      }
    };
  }, []);

  const handleNavigateOrSearch = useCallback(
    async (rawInput: string, serviceName?: string) => {
      const trimmed = rawInput.trim();
      if (!trimmed) return;

      setIsCalmLensActive(false);
      setHoveredElement(null);
      setIsNavigating(true);
      setStatus("navigating");

      const asUrl = isLikelyUrl(trimmed);
      const displayTarget = asUrl
        ? /^https?:\/\//i.test(trimmed)
          ? trimmed
          : `https://${trimmed}`
        : `https://html.duckduckgo.com/html/?q=${encodeURIComponent(trimmed)}`;

      setInputUrl(displayTarget);
      setActiveUrl(displayTarget);
      setActionLabel(
        asUrl ? `Opening ${displayTarget}...` : `Searching "${trimmed}"...`
      );
      addLog(
        asUrl
          ? `[Navigate] Opening ${displayTarget}`
          : `[Search] Querying DuckDuckGo & inspecting top result for "${trimmed}"`
      );

      if (serviceName) {
        loadCalmPricing(serviceName);
      }

      try {
        const res = await fetch("/api/browser/navigate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            asUrl
              ? { url: displayTarget, service: serviceName || "Live Page" }
              : { query: trimmed }
          ),
        });

        const data = await res.json();
        if (data.success && data.result) {
          addLog(
            `[Verified] ${data.result.service}: $${data.result.price.toFixed(2)}/${data.result.billingPeriod}`
          );
          setStatus("ready");
        } else if (data.success && data.searchResult) {
          addLog(
            `[Search Complete] Inspected ${data.searchResult.primaryUrl}`
          );
          setStatus("ready");
        } else {
          setStatus("ready");
        }
        void refreshSemanticState(isInspectMode);
      } catch (err) {
        addLog(
          `[Navigation Error]: ${err instanceof Error ? err.message : String(err)}`
        );
        setStatus("error");
      } finally {
        setIsNavigating(false);
      }
    },
    [addLog, loadCalmPricing, refreshSemanticState, isInspectMode]
  );

  // If user clicked a URL in chat that differs from current URL, navigate to it
  useEffect(() => {
    if (
      externalFocusUrl &&
      externalFocusUrl !== lastExternalUrlRef.current &&
      externalFocusUrl !== activeUrl
    ) {
      lastExternalUrlRef.current = externalFocusUrl;
      handleNavigateOrSearch(externalFocusUrl);
    }
  }, [externalFocusUrl, activeUrl, handleNavigateOrSearch]);

  const handleSelectBot = async (botId: string) => {
    setActiveBotId(botId);
    setHoveredFanTabId(null);
    setIsCalmLensActive(false);
    setHoveredElement(null);
    const targetBot = bots.find((b) => b.id === botId);
    if (targetBot) {
      if (targetBot.currentFrame) setCurrentFrame(targetBot.currentFrame);
      setActiveUrl(targetBot.url);
      setInputUrl(targetBot.url);
      setPageTitle(targetBot.title);
      if (targetBot.cursor) setCursor(targetBot.cursor);
      setStatus(targetBot.status);
      setCanGoBack(Boolean(targetBot.canGoBack));
      setCanGoForward(Boolean(targetBot.canGoForward));
      setGeneration(targetBot.generation || 1);
      setActiveWall(targetBot.wall ?? null);
    }

    try {
      await fetch("/api/browser/parallel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "select_bot", botId }),
      });
      addLog(`[Tab] Focused tab: ${targetBot?.service || botId}`);
      if (isInspectMode || showConsole) {
        void refreshSemanticState(isInspectMode);
      }
    } catch {
      // ignore
    }
  };

  const handleOpenNewLiveTab = async () => {
    if (isOpeningTab) return;
    setIsOpeningTab(true);
    setActionLabel("Opening new live tab...");
    try {
      const res = await fetch("/api/browser/semantic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "tabs.open",
          url: "https://html.duckduckgo.com/html/",
          title: "DuckDuckGo Search",
          focus: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.tab) {
        addLog(`[Tab Pool] Opened ${data.tab.id} (${data.tab.url})`);
        setActionLabel(`Opened new tab (${data.pool?.tabs?.length || 1}/4 pool)`);
        if (isInspectMode) {
          void refreshSemanticState(true);
        }
      }
    } catch (err) {
      addLog(`[Tab Pool Error]: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsOpeningTab(false);
    }
  };

  const handleCloseTab = async (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    setHoveredFanTabId(null);
    if (tabId.startsWith("tab_")) {
      try {
        await fetch("/api/browser/semantic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ op: "tabs.close", tabId }),
        });
        addLog(`[Tab Pool] Closed ${tabId}`);
      } catch {
        // ignore
      }
    } else {
      setBots((prev) => prev.filter((b) => b.id !== tabId));
    }
  };

  const handleHistoryAction = async (direction: "back" | "forward") => {
    addLog(`[History] ${direction.toUpperCase()}`);
    try {
      const res = await fetch("/api/browser/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: direction }),
      });
      const data = await res.json();
      if (data.tab) {
        setCanGoBack(Boolean(data.tab.canGoBack));
        setCanGoForward(Boolean(data.tab.canGoForward));
        setGeneration(data.tab.generation || 1);
      }
      if (isInspectMode) {
        void refreshSemanticState(true);
      }
    } catch {
      // ignore
    }
  };

  const handleToggleInspectMode = async () => {
    const next = !isInspectMode;
    setIsInspectMode(next);
    setHoveredElement(null);
    if (next) {
      setIsTakeoverActive(false);
      setActionLabel("Inspect mode — click any @eN element to add to chat");
      addLog("[Inspect] Capturing @e1..@eN semantic AXTree snapshot...");
      await refreshSemanticState(true);
    } else {
      setActionLabel("Ready");
    }
  };

  const emitPickedChip = useCallback(
    (node: SemanticElementNode) => {
      const chip: InspectedElementChip = {
        ref: node.ref,
        generation: node.generation,
        tabId: semanticSnapshot?.tabId || activeBotId,
        role: node.role,
        name: node.name || node.tagName,
        tagName: node.tagName,
        url: activeUrl,
      };
      onPickElementChip?.(chip);
      setActionLabel(`Added ${node.ref} [${node.role}] to chat prompt`);
      addLog(
        `[Inspect] Picked ${node.ref} (${node.role} "${node.name || node.tagName}", gen=${node.generation})`
      );
    },
    [semanticSnapshot?.tabId, activeBotId, activeUrl, onPickElementChip, addLog]
  );

  const handleWallDecision = async (
    decision: "continue" | "skip" | "extend_90s"
  ) => {
    try {
      const res = await fetch("/api/browser/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "wall_decision",
          decision,
        }),
      });
      const data = await res.json();
      if (decision === "extend_90s") {
        if (data.wall) setActiveWall(data.wall);
        setIsTakeoverActive(true);
        canvasRef.current?.focus();
        setActionLabel("Added +90s — Pair browsing enabled to sign in");
        addLog("[Help-the-Agent] Extended pause timer by +90s");
      } else if (decision === "continue") {
        setActiveWall(null);
        setIsTakeoverActive(false);
        setActionLabel("Wall resolved — Rico agent resumed");
        addLog("[Help-the-Agent] Human marked login/2FA complete; agent resumed");
      } else {
        setActiveWall(null);
        setIsTakeoverActive(false);
        setActionLabel("Skipped gated page");
        addLog("[Help-the-Agent] Skipped login/2FA wall");
      }
    } catch {
      // ignore
    }
  };

  const handleRunComparison = async (
    preset: "streaming" | "devtools" | "cloud" = "streaming"
  ) => {
    setIsComparing(true);
    setIsCalmLensActive(false);
    setActionLabel(`Comparing ${preset} plans in parallel...`);
    addLog(`[Parallel Helpers] Dispatched concurrent tabs for: ${preset}`);

    try {
      const res = await fetch("/api/browser/parallel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        setBots(data.result.bots);
        if (data.result.bestDeal) {
          setBestDeal(data.result.bestDeal);
          setActionLabel(
            `Lowest rate: ${data.result.bestDeal.service} ($${data.result.bestDeal.price.toFixed(2)}/mo)`
          );
        }
      }
    } catch (err) {
      addLog(
        `[Parallel Error]: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsComparing(false);
    }
  };

  const handlePlanSelectedFromLens = (
    service: string,
    price: number,
    planName: string
  ) => {
    setCursor({
      x: 640,
      y: 360,
      action: "click",
      label: `Locked: ${planName} ($${price.toFixed(2)})`,
      timestamp: Date.now(),
    });
    setClickRipple({ x: 640, y: 360 });
    setTimeout(() => setClickRipple(null), 900);

    addLog(
      `[Calm Lens] Selected ${service} (${planName}) @ $${price.toFixed(2)}/mo`
    );

    if (onPlanSelected) {
      onPlanSelected(service, price, planName);
    }
  };

  const handleApproveFromBanner = (
    fundingSource: "PAYPAL" | "BACKUP_CARD" = "PAYPAL"
  ) => {
    setSimulatedApproval(null);
    addLog(
      `[Approved] Confirmed payment via ${
        fundingSource === "BACKUP_CARD" ? "Backup Visa (4242)" : "PayPal Wallet"
      }`
    );
    if (onApproveApproval) {
      onApproveApproval(fundingSource);
    }
  };

  const handleRejectFromBanner = () => {
    setSimulatedApproval(null);
    addLog("[Rejected] Payment cancelled by user.");
    if (onRejectApproval) {
      onRejectApproval();
    }
  };

  const toggleTakeoverMode = async () => {
    const next = !isTakeoverActive;
    setIsTakeoverActive(next);
    if (next) {
      setIsInspectMode(false);
      setHoveredElement(null);
      setTimeout(() => canvasRef.current?.focus(), 20);
    }
    addLog(
      next
        ? "[Pair Browsing] Manual control active — keyboard, hover, clicks & scroll forward to Chromium"
        : "[Autonomous] Returned browser control to Rico agent"
    );

    try {
      await fetch("/api/browser/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_takeover",
          isActive: next,
          reason: "MANUAL_TAKEOVER",
        }),
      });
    } catch {
      // ignore
    }
  };

  const getScaledCanvasCoords = (
    clientX: number,
    clientY: number,
    target: HTMLElement
  ): { x: number; y: number } | null => {
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const scaleX = 960 / rect.width;
    const scaleY = 860 / rect.height;
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  };

  const findSnapshotElementAt = useCallback(
    (x: number, y: number): SemanticElementNode | null => {
      if (!semanticSnapshot?.elements?.length) return null;
      const hits = semanticSnapshot.elements.filter(
        (el) =>
          x >= el.rect.x &&
          x <= el.rect.x + el.rect.width &&
          y >= el.rect.y &&
          y <= el.rect.y + el.rect.height
      );
      if (hits.length === 0) return null;
      hits.sort((a, b) => a.rect.width * a.rect.height - b.rect.width * b.rect.height);
      return hits[0];
    },
    [semanticSnapshot]
  );

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isInspectMode && !isTakeoverActive) return;
    const coords = getScaledCanvasCoords(e.clientX, e.clientY, e.currentTarget);
    if (!coords) return;

    if (isInspectMode) {
      const hit = findSnapshotElementAt(coords.x, coords.y);
      setHoveredElement(hit);
      return;
    }

    if (isTakeoverActive) {
      const now = Date.now();
      if (now - lastHoverDispatchRef.current < 55) return;
      lastHoverDispatchRef.current = now;
      void fetch("/api/browser/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mouse_move",
          x: coords.x,
          y: coords.y,
        }),
      }).catch(() => {});
    }
  };

  const handleCanvasClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getScaledCanvasCoords(e.clientX, e.clientY, e.currentTarget);
    if (!coords) return;

    if (isInspectMode) {
      const hit = hoveredElement || findSnapshotElementAt(coords.x, coords.y);
      if (hit) {
        emitPickedChip(hit);
      } else {
        await refreshSemanticState(true);
      }
      return;
    }

    if (!isTakeoverActive) return;
    e.currentTarget.focus();

    const { x, y } = coords;
    setCursor({
      x,
      y,
      action: "click",
      label: `Click (${x}, ${y})`,
      timestamp: Date.now(),
    });
    setClickRipple({ x, y });
    setTimeout(() => setClickRipple(null), 700);

    try {
      await fetch("/api/browser/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "click", x, y }),
      });
    } catch {
      // ignore
    }
  };

  const handleCanvasWheel = async (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!isTakeoverActive) return;
    try {
      await fetch("/api/browser/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "scroll",
          deltaX: Math.round(e.deltaX),
          deltaY: Math.round(e.deltaY),
        }),
      });
    } catch {
      // ignore
    }
  };

  const handleCanvasKey = (
    eventType: "keyDown" | "keyUp",
    e: React.KeyboardEvent<HTMLCanvasElement>
  ) => {
    if (!isTakeoverActive) return;
    if (e.key === "Escape") {
      void toggleTakeoverMode();
      return;
    }
    // Prevent browser page scroll while pair-browsing inside the remote Chromium canvas
    if (
      [
        " ",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Backspace",
        "Tab",
      ].includes(e.key)
    ) {
      e.preventDefault();
    }

    void fetch("/api/browser/interact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "key_event",
        eventType,
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        text: e.key.length === 1 ? e.key : undefined,
        modifiers: {
          alt: e.altKey,
          ctrl: e.ctrlKey,
          meta: e.metaKey,
          shift: e.shiftKey,
        },
      }),
    }).catch(() => {});
  };

  const handleChallengeSolved = async () => {
    setActiveChallenge(null);
    setIsTakeoverActive(false);
    try {
      await fetch("/api/browser/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "solve_challenge" }),
      });
    } catch {
      // ignore
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    handleNavigateOrSearch(inputUrl);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const activeBot = bots.find((b) => b.id === activeBotId);
  const hoveredFanBot = hoveredFanTabId
    ? bots.find((b) => b.id === hoveredFanTabId) || null
    : null;
  const isBusy =
    isNavigating ||
    isComparing ||
    isSnapshotting ||
    status === "navigating" ||
    status === "evaluating" ||
    status === "extracting";

  return (
    <div
      ref={containerRef}
      className={`h-full flex flex-col bg-[#FCFCFC] text-[#1E1B1B] overflow-hidden select-none ${className}`}
    >
      {/* 1. OpenCode Recessed Browser Tab Strip + Multi-Tab Pool Controls */}
      <div className="relative h-9 bg-[#F8F7F7] border-b border-[#E6E4E3] flex items-center justify-between px-2 gap-2 shrink-0">
        <div className="flex items-end h-full gap-0.5 min-w-0 overflow-x-auto no-scrollbar">
          {bots.map((bot) => {
            const isSelected = activeBotId === bot.id;
            const tabBusy =
              bot.status === "navigating" ||
              bot.status === "evaluating" ||
              bot.status === "extracting";
            return (
              <div
                key={bot.id}
                onMouseEnter={() => setHoveredFanTabId(bot.id)}
                onMouseLeave={() =>
                  setHoveredFanTabId((prev) => (prev === bot.id ? null : prev))
                }
                className={`h-[31px] max-w-[196px] px-2 rounded-t-md text-[12px] font-medium inline-flex items-center gap-1 border border-b-0 transition-colors duration-100 ${
                  isSelected
                    ? "bg-white text-[#1E1B1B] border-[#E6E4E3] relative top-[1px]"
                    : "bg-transparent text-[#5C5858] border-transparent hover:bg-[#EFECEB] hover:text-[#1E1B1B]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectBot(bot.id)}
                  title={`${bot.title} (${bot.url})`}
                  className="inline-flex items-center gap-1.5 min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 rounded"
                >
                  {tabBusy ? (
                    <Loader2 className="w-3 h-3 text-[#034CFF] animate-spin shrink-0" />
                  ) : (
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        bot.wall?.detected
                          ? "bg-amber-500"
                          : bot.status === "error"
                          ? "bg-red-500"
                          : "bg-emerald-500"
                      }`}
                    />
                  )}
                  <span className="truncate">
                    {bot.service.replace(/ Standard HD| Individual/g, "")}
                  </span>
                  {bot.isPopup && (
                    <span className="px-1 rounded bg-[#EFECEB] text-[9.5px] font-mono text-[#5C5858] shrink-0">
                      pop
                    </span>
                  )}
                  {bot.extractedResult && (
                    <span className="text-[10.5px] font-mono tabular-nums text-[#8A8585] shrink-0">
                      ${bot.extractedResult.price.toFixed(2)}
                    </span>
                  )}
                </button>

                {bots.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => handleCloseTab(e, bot.id)}
                    aria-label={`Close ${bot.service} tab`}
                    title="Close tab"
                    className="w-4 h-4 rounded flex items-center justify-center text-[#8A8585] hover:text-[#1E1B1B] hover:bg-[#EFECEB] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleOpenNewLiveTab}
            disabled={isOpeningTab}
            aria-label="Open new live browser tab"
            title="Open new live tab (up to 4 pooled pages)"
            className="h-6 w-6 mb-1 ml-0.5 rounded-md flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#EFECEB] transition-colors duration-100 disabled:opacity-50 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
          >
            {isOpeningTab ? (
              <Loader2 className="w-3 h-3 animate-spin text-[#034CFF]" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => handleRunComparison("streaming")}
            disabled={isComparing}
            className="h-6 px-2.5 rounded-md text-[11px] font-medium bg-white hover:bg-[#F1EFEF] text-[#1E1B1B] border border-[#D6D3D1] inline-flex items-center gap-1 transition-colors duration-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
            title="Open parallel helper tabs to compare streaming plans"
          >
            <Layers className="w-3 h-3 text-[#5C5858]" />
            <span>Compare</span>
          </button>
        </div>

        {/* Zephium Hover Fan Card Preview */}
        {hoveredFanBot && hoveredFanBot.id !== activeBotId && (
          <div className="absolute left-3 top-9 z-50 w-64 rounded-xl bg-white border border-[#E6E4E3] shadow-[0_12px_28px_rgba(30,27,27,0.14)] p-2.5 pointer-events-none space-y-2">
            {hoveredFanBot.currentFrame && (
              <div className="w-full h-28 rounded-lg overflow-hidden border border-[#E6E4E3] bg-[#F8F7F7]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hoveredFanBot.currentFrame}
                  alt={hoveredFanBot.title}
                  className="w-full h-full object-cover object-top block"
                />
              </div>
            )}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold text-[#1E1B1B] truncate">
                  {hoveredFanBot.title || hoveredFanBot.service}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#F1EFEF] font-mono text-[10px] tabular-nums text-[#5C5858] shrink-0">
                  gen {hoveredFanBot.generation || 1}
                </span>
              </div>
              <p className="m-0 text-[11px] font-mono text-[#8A8585] truncate">
                {hoveredFanBot.url}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Browser Navigation Bar & Omnibar (Real CDP History + Inspect @eN + Pair Takeover) */}
      <div className="relative h-10 px-2.5 bg-white border-b border-[#E6E4E3] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => handleHistoryAction("back")}
            disabled={!canGoBack}
            className="h-7 w-7 rounded-md flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF] disabled:opacity-35 disabled:pointer-events-none transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
            title={canGoBack ? "Back" : "No earlier page in tab history"}
            aria-label="Back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleHistoryAction("forward")}
            disabled={!canGoForward}
            className="h-7 w-7 rounded-md flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF] disabled:opacity-35 disabled:pointer-events-none transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
            title={canGoForward ? "Forward" : "No forward page in tab history"}
            aria-label="Forward"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleNavigateOrSearch(activeUrl)}
            disabled={isNavigating}
            className="h-7 w-7 rounded-md flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
            title="Reload page"
            aria-label="Reload page"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isBusy ? "animate-spin text-[#034CFF]" : ""
              }`}
            />
          </button>
        </div>

        <form onSubmit={handleUrlSubmit} className="flex-1 min-w-0 flex items-center">
          <label htmlFor="rico-browser-omnibar" className="sr-only">
            Enter URL or search the web
          </label>
          <div className="w-full h-7 px-2.5 rounded-md bg-[#F8F7F7] border border-[#E6E4E3] focus-within:border-[#034CFF] focus-within:bg-white flex items-center gap-2 transition-colors duration-100">
            {isLikelyUrl(inputUrl) ? (
              <Lock className="w-3 h-3 text-[#8A8585] shrink-0" />
            ) : (
              <Search className="w-3 h-3 text-[#034CFF] shrink-0" />
            )}
            <input
              id="rico-browser-omnibar"
              type="text"
              autoComplete="off"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Enter URL or search anything on the web..."
              className="w-full bg-transparent text-[12px] text-[#1E1B1B] placeholder-[#8A8585] focus:outline-none font-mono truncate"
            />
          </div>
        </form>

        <div className="flex items-center gap-1 shrink-0">
          {/* OpenCode Inspect Element Picker (@eN -> Chat Prompt) */}
          <button
            type="button"
            onClick={handleToggleInspectMode}
            className={`h-7 px-2.5 rounded-md text-[12px] font-medium flex items-center gap-1.5 border transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${
              isInspectMode
                ? "bg-[#034CFF] text-white border-[#034CFF]"
                : "bg-white hover:bg-[#F8F7F7] text-[#5C5858] hover:text-[#1E1B1B] border-[#D6D3D1]"
            }`}
            title="Inspect Element — pick an @eN element chip for the chat prompt"
          >
            <Crosshair className="w-3 h-3" />
            <span className="hidden xl:inline">Inspect</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !isCalmLensActive;
              setIsCalmLensActive(next);
              if (next && !calmData) {
                loadCalmPricing(activeUrl);
              }
            }}
            className={`h-7 px-2.5 rounded-md text-[12px] font-medium flex items-center gap-1.5 border transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${
              isCalmLensActive
                ? "bg-[#1E1B1B] text-white border-[#1E1B1B]"
                : "bg-white hover:bg-[#F8F7F7] text-[#5C5858] hover:text-[#1E1B1B] border-[#D6D3D1]"
            }`}
            title="Zephium Calm Lens — normalize plan tiers & strip dark patterns"
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden 2xl:inline">Calm lens</span>
          </button>

          <button
            type="button"
            onClick={toggleTakeoverMode}
            className={`h-7 px-2.5 rounded-md text-[12px] font-medium flex items-center gap-1.5 border transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${
              isTakeoverActive
                ? "bg-amber-500 text-[#1E1B1B] border-amber-500"
                : "bg-white hover:bg-[#F8F7F7] text-[#5C5858] hover:text-[#1E1B1B] border-[#D6D3D1]"
            }`}
            title="Pair browse / human takeover — full keyboard, hover, click & scroll"
          >
            <User className="w-3 h-3" />
            <span className="hidden xl:inline">
              {isTakeoverActive ? "Pair on" : "Takeover"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowConsole((prev) => !prev)}
            className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${
              showConsole
                ? "bg-[#1E1B1B] text-white"
                : "text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF]"
            }`}
            title="Toggle AXTree, Network, Console & Guardrail diagnostics"
            aria-label="Toggle developer diagnostics"
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="h-7 w-7 rounded-md flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Real-time Cobalt Loading Progress Bar */}
        {isBusy && (
          <div className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#E6E4E3] overflow-hidden">
            <div className="h-full w-1/3 bg-[#034CFF] oc-browser-progress" />
          </div>
        )}
      </div>

      {/* Zephium Help-the-Agent Login / 2FA Wall Detector Banner (Continue / Skip / +90s) */}
      {activeWall?.detected && (
        <div className="px-3.5 py-2 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#1E1B1B]">
                  {activeWall.title}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 border border-amber-300 font-mono text-[10.5px] tabular-nums text-amber-900">
                  <Clock className="w-2.5 h-2.5" />
                  {formatCountdown(activeWall.expiresAt, wallClockNow)}
                </span>
              </div>
              <p className="m-0 text-[11.5px] text-amber-900/90 truncate">
                {activeWall.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleWallDecision("extend_90s")}
              className="h-6 px-2.5 rounded-md bg-white hover:bg-amber-100 border border-amber-300 text-[#1E1B1B] font-mono text-[11px] font-medium tabular-nums transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
              title="Extend manual pause by 90 seconds and engage Pair Browsing"
            >
              +90s
            </button>
            <button
              type="button"
              onClick={() => handleWallDecision("skip")}
              className="h-6 px-2.5 rounded-md bg-white hover:bg-[#F1EFEF] border border-[#D6D3D1] text-[#5C5858] hover:text-[#1E1B1B] text-[11px] font-medium transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => handleWallDecision("continue")}
              className="h-6 px-2.5 rounded-md bg-[#1E1B1B] hover:bg-[#332F2F] text-white text-[11px] font-medium transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {bestDeal && (
        <div className="px-3.5 py-1.5 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between text-xs text-emerald-950 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="font-medium truncate">
              Lowest verified: {bestDeal.service} ({bestDeal.planName})
            </span>
            <span className="font-mono font-semibold tabular-nums shrink-0">
              ${bestDeal.price.toFixed(2)}/mo
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              onPlanSelected?.(bestDeal.service, bestDeal.price, bestDeal.planName)
            }
            className="h-6 px-2.5 rounded-md bg-[#1E1B1B] hover:bg-[#332F2F] text-white font-medium text-[11px] flex items-center gap-1 transition-colors duration-100 shrink-0"
          >
            <Check className="w-3 h-3" />
            <span>Set rule</span>
          </button>
        </div>
      )}

      {activeApproval && (
        <NeedsYouBanner
          request={activeApproval}
          onApprovePayPal={() => handleApproveFromBanner("PAYPAL")}
          onApproveBackupCard={() => handleApproveFromBanner("BACKUP_CARD")}
          onReject={handleRejectFromBanner}
        />
      )}

      {/* 3. Main Live Chromium HTML5 Canvas Stage (Full-Bleed, Zero Letterboxing) */}
      <div
        className={`relative flex-1 bg-[#FCFCFC] flex items-start justify-center overflow-hidden min-h-[300px] ${
          isTakeoverActive
            ? "ring-2 ring-inset ring-amber-400"
            : isInspectMode
            ? "ring-2 ring-inset ring-[#034CFF]"
            : ""
        }`}
      >
        {isTakeoverActive && (
          <div className="absolute top-3 left-3 right-3 z-40 px-3 py-2 rounded-lg bg-white/95 border border-amber-300 flex items-center justify-between shadow-md text-xs text-[#1E1B1B]">
            <span className="font-medium">
              Pair browsing active — type on keyboard, hover, click, or scroll inside the canvas
            </span>
            <button
              type="button"
              onClick={toggleTakeoverMode}
              className="h-6 px-2.5 rounded-md bg-[#1E1B1B] hover:bg-[#332F2F] text-white text-[11px] font-medium transition-colors duration-100"
            >
              Done, continue
            </button>
          </div>
        )}

        {isInspectMode && (
          <div className="absolute top-3 left-3 right-3 z-40 px-3 py-2 rounded-lg bg-white/95 border border-[#034CFF]/40 flex items-center justify-between shadow-md text-xs text-[#1E1B1B]">
            <span className="font-medium truncate">
              Inspect element active ({semanticSnapshot?.elements.length ?? 0} @eN nodes · gen {generation}) — click any element to drop its @eN chip into chat
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => void refreshSemanticState(true)}
                className="h-6 px-2 rounded-md bg-[#F8F7F7] hover:bg-[#EFECEB] border border-[#D6D3D1] text-[#1E1B1B] text-[11px] font-medium transition-colors duration-100"
              >
                Rescan
              </button>
              <button
                type="button"
                onClick={handleToggleInspectMode}
                className="h-6 px-2.5 rounded-md bg-[#1E1B1B] hover:bg-[#332F2F] text-white text-[11px] font-medium transition-colors duration-100"
              >
                Exit
              </button>
            </div>
          </div>
        )}

        {activeChallenge && (
          <TakeoverChallengeModal
            challengeType={activeChallenge}
            serviceName={activeBot?.service || "Merchant Site"}
            onSolved={handleChallengeSolved}
            onCancel={() => {
              setActiveChallenge(null);
              setIsTakeoverActive(false);
            }}
          />
        )}

        {isCalmLensActive ? (
          calmData ? (
            <CalmPricingLens
              data={calmData}
              onSelectPlan={handlePlanSelectedFromLens}
              isLoading={isSimplifying}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 text-[#5C5858]">
              <Sparkles className="w-5 h-5 animate-spin text-[#8A8585]" />
              <p className="text-xs m-0">Normalizing plan tiers...</p>
            </div>
          )
        ) : currentFrame ? (
          <div className="relative w-full h-full overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              width={960}
              height={860}
              tabIndex={0}
              aria-label={
                pageTitle
                  ? `Live Chromium canvas: ${pageTitle}`
                  : "Live Chromium browser canvas"
              }
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={() => setHoveredElement(null)}
              onClick={handleCanvasClick}
              onWheel={handleCanvasWheel}
              onKeyDown={(e) => handleCanvasKey("keyDown", e)}
              onKeyUp={(e) => handleCanvasKey("keyUp", e)}
              className={`w-full h-auto block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#034CFF]/50 ${
                isInspectMode || isTakeoverActive
                  ? "cursor-crosshair"
                  : "cursor-default"
              }`}
            />

            {/* OpenCode @eN Element Bounding Box Overlay when Inspecting */}
            {isInspectMode && hoveredElement && (
              <div
                className="absolute pointer-events-none border-2 border-[#034CFF] bg-[#034CFF]/10 rounded-sm z-30 transition-all duration-75"
                style={{
                  left: `${(hoveredElement.rect.x / 960) * 100}%`,
                  top: `${(hoveredElement.rect.y / 860) * 100}%`,
                  width: `${Math.max(1, (hoveredElement.rect.width / 960) * 100)}%`,
                  height: `${Math.max(1, (hoveredElement.rect.height / 860) * 100)}%`,
                }}
              >
                <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-[#034CFF] text-white font-mono text-[10.5px] font-semibold whitespace-nowrap shadow-sm">
                  {hoveredElement.ref} · {hoveredElement.role}
                  {hoveredElement.name
                    ? ` "${hoveredElement.name.slice(0, 32)}"`
                    : ""}
                </div>
              </div>
            )}

            {cursor && !isInspectMode && (
              <div
                className="absolute pointer-events-none transition-transform duration-150 ease-out z-30"
                style={{
                  left: `${Math.min(88, Math.max(3, (cursor.x / 960) * 100))}%`,
                  top: `${Math.min(88, Math.max(3, (cursor.y / 860) * 100))}%`,
                  transform: "translate(-2px, -2px)",
                }}
              >
                {clickRipple && (
                  <div className="absolute -left-4 -top-4 w-9 h-9 rounded-full border-2 border-[#034CFF] bg-[#034CFF]/25 animate-ping" />
                )}

                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
                >
                  <path
                    d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                    fill="#034CFF"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>

                {cursor.label && (
                  <div className="absolute left-4 top-2 px-2.5 py-0.5 rounded-md bg-[#1E1B1B]/95 border border-white/15 text-[10.5px] font-medium text-white whitespace-nowrap shadow-md">
                    {cursor.label}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full p-6 text-center space-y-2">
            <Zap className="w-5 h-5 text-[#8A8585] animate-pulse" />
            <p className="text-xs text-[#5C5858] m-0">
              Connecting to live Chromium session...
            </p>
          </div>
        )}

        {/* Zephium Live Run Island (bottom-left floating status) */}
        <div className="absolute bottom-3 left-3 z-30 max-w-[75%] flex items-center gap-2 bg-[#1E1B1B]/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/15 text-[11.5px] text-white shadow-lg pointer-events-none">
          {isBusy ? (
            <Loader2 className="w-3.5 h-3.5 text-[#70A5FF] animate-spin shrink-0" />
          ) : (
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isConnected ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
          )}
          <span className="truncate font-medium">{actionLabel}</span>
        </div>

        {/* Stream Badge (top-right) */}
        {!isInspectMode && !isTakeoverActive && (
          <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-[#1E1B1B]/90 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/15 text-[10.5px] font-mono text-white tabular-nums shadow-md pointer-events-none">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isBusy
                  ? "bg-[#5990FF] animate-pulse"
                  : isConnected
                  ? "bg-emerald-400"
                  : "bg-amber-400"
              }`}
            />
            <span>
              {status === "navigating"
                ? "Navigating"
                : status === "evaluating"
                ? "Reading DOM"
                : status === "extracting"
                ? "Extracting"
                : `LIVE · ${fps} FPS · gen ${generation}`}
            </span>
          </div>
        )}
      </div>

      {/* 4. Collapsible V2 Developer Diagnostics Drawer (Trace · AXTree @eN · Network · Console · Guards) */}
      {showConsole && (
        <div className="h-44 bg-[#131010] border-t border-[#2B2626] flex flex-col text-neutral-300 font-mono text-[11px] shrink-0 select-text">
          <div className="h-7 px-2.5 border-b border-[#2B2626] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1">
              {(
                [
                  { id: "trace", label: "Trace" },
                  {
                    id: "axtree",
                    label: `AXTree (${semanticSnapshot?.elements.length ?? 0})`,
                  },
                  {
                    id: "network",
                    label: `Network (${diagnostics?.network.length ?? 0})`,
                  },
                  {
                    id: "console",
                    label: `Console (${diagnostics?.console.length ?? 0})`,
                  },
                  {
                    id: "guards",
                    label: `Guards (${diagnostics?.blockedTrackersCount ?? 0})`,
                  },
                ] as Array<{ id: DrawerTab; label: string }>
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDrawerTab(t.id)}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-sans font-medium transition-colors ${
                    drawerTab === t.id
                      ? "bg-[#2B2626] text-white"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void refreshSemanticState(true)}
              className="px-2 py-0.5 rounded text-[10px] text-neutral-300 hover:bg-[#2B2626] transition-colors"
            >
              Refresh @eN
            </button>
          </div>

          <div className="flex-1 p-2.5 overflow-y-auto space-y-1 oc-scroller">
            {drawerTab === "trace" &&
              cdpLogs.map((log, idx) => (
                <div key={idx} className="leading-tight text-neutral-300">
                  {log}
                </div>
              ))}

            {drawerTab === "axtree" &&
              (semanticSnapshot && semanticSnapshot.elements.length > 0 ? (
                semanticSnapshot.elements.map((el) => (
                  <button
                    key={el.ref}
                    type="button"
                    onClick={() => emitPickedChip(el)}
                    className="w-full text-left px-1.5 py-0.5 rounded hover:bg-[#2B2626] flex items-center gap-2 text-[11px]"
                    title="Click to insert @eN chip into chat composer"
                  >
                    <span className="text-[#70A5FF] font-semibold shrink-0">
                      {el.ref}
                    </span>
                    <span className="text-emerald-400 shrink-0">[{el.role}]</span>
                    <span className="truncate text-neutral-200">
                      {el.name || `<${el.tagName}>`}
                    </span>
                    {el.value === "[REDACTED]" && (
                      <span className="text-amber-400 shrink-0">[REDACTED]</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="text-neutral-400">
                  No @eN snapshot yet. Click &ldquo;Refresh @eN&rdquo; or &ldquo;Inspect&rdquo; to walk the live DOM.
                </div>
              ))}

            {drawerTab === "network" &&
              (diagnostics && diagnostics.network.length > 0 ? (
                diagnostics.network.slice(-30).map((net) => (
                  <div
                    key={net.id}
                    className="flex items-center justify-between gap-2 text-[10.5px]"
                  >
                    <span
                      className={
                        net.blocked
                          ? "text-amber-400 shrink-0"
                          : "text-emerald-400 shrink-0"
                      }
                    >
                      {net.blocked
                        ? `[BLOCKED:${net.blockReason}]`
                        : `[${net.status ?? 200}]`}{" "}
                      {net.method}
                    </span>
                    <span className="truncate flex-1 text-neutral-300">
                      {net.url}
                    </span>
                    {net.durationMs !== undefined && (
                      <span className="text-neutral-500 tabular-nums shrink-0">
                        {net.durationMs}ms
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-neutral-400">
                  No network requests recorded on this pooled tab yet.
                </div>
              ))}

            {drawerTab === "console" &&
              (diagnostics && diagnostics.console.length > 0 ? (
                diagnostics.console.map((entry) => (
                  <div key={entry.id} className="text-[10.5px] leading-tight">
                    <span
                      className={
                        entry.level === "error" || entry.level === "pageerror"
                          ? "text-red-400"
                          : entry.level === "warn"
                          ? "text-amber-400"
                          : "text-neutral-400"
                      }
                    >
                      [{entry.level.toUpperCase()}]
                    </span>{" "}
                    <span>{entry.text}</span>
                  </div>
                ))
              ) : (
                <div className="text-neutral-400">
                  Console ring buffer clean (0 messages).
                </div>
              ))}

            {drawerTab === "guards" && (
              <div className="space-y-1 text-[11px]">
                <div className="text-emerald-400">
                  Adblock &amp; Cosmetic Cookie Shield: Active ({diagnostics?.blockedTrackersCount ?? 0} trackers blocked)
                </div>
                <div className="text-sky-400">
                  DialogGate (Page.javascriptDialogOpening): Active ({diagnostics?.interceptedDialogsCount ?? 0} JS dialogs auto-dismissed)
                </div>
                {semanticSnapshot?.groundedPrices &&
                  semanticSnapshot.groundedPrices.length > 0 && (
                    <div className="text-neutral-200">
                      DOM-Grounded Prices:{" "}
                      {semanticSnapshot.groundedPrices
                        .map((p) => `${p.matchedSubstring} (${p.billingPeriod})`)
                        .join(" · ")}
                    </div>
                  )}
                {diagnostics?.dialogs?.map((d) => (
                  <div key={d.id} className="text-amber-300">
                    [DialogGate dismissed {d.type}]: &ldquo;{d.message}&rdquo;
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Quiet Status Footer */}
      <div className="h-7 px-3 bg-[#F8F7F7] border-t border-[#E6E4E3] flex items-center justify-between text-[11px] text-[#5C5858] shrink-0">
        <div className="flex items-center gap-1.5 truncate max-w-[60%]">
          <Globe className="w-3 h-3 text-[#8A8585] shrink-0" />
          <span className="truncate text-[#1E1B1B] font-medium" title={pageTitle}>
            {pageTitle || activeUrl}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10.5px] tabular-nums shrink-0 text-[#8A8585]">
          <span>{bots.length} tabs</span>
          <span>·</span>
          <span>gen {generation}</span>
          <span>·</span>
          <span>#{totalFrames}</span>
          <span>·</span>
          <span className="text-emerald-700 font-medium">
            {isConnected ? "Connected" : "Reconnecting"}
          </span>
        </div>
      </div>
    </div>
  );
}
