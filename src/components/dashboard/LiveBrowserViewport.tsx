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
} from "lucide-react";
import {
  ScreencastFrame,
  CursorEvent,
  HelperBotSession,
  ParallelVerificationResult,
  CalmPricingResult,
  BrowserActivityLog,
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
  className?: string;
}

function isLikelyUrl(val: string): boolean {
  const t = val.trim();
  if (/^https?:\/\//i.test(t)) return true;
  if (t.includes(" ")) return false;
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(t);
}

export function LiveBrowserViewport({
  onPlanSelected,
  approvalRequest,
  onApproveApproval,
  onRejectApproval,
  externalFocusUrl,
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
  const [clickRipple, setClickRipple] = useState<{ x: number; y: number } | null>(
    null
  );

  // Dynamic Browser Tabs (synced via SSE)
  const [bots, setBots] = useState<HelperBotSession[]>([]);
  const [activeBotId, setActiveBotId] = useState<string>("bot-netflix");
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [bestDeal, setBestDeal] =
    useState<ParallelVerificationResult["bestDeal"] | null>(null);

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
    "[CDP] Chromium DevTools screencast initialized (1280x720)",
    "[SSE] Subscribed to /api/browser/screencast live stream",
  ]);

  const containerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastExternalUrlRef = useRef<string | null>(null);

  const addLog = useCallback((msg: string) => {
    setCdpLogs((prev) => [
      ...prev.slice(-45),
      `[${new Date().toLocaleTimeString()}] ${msg}`,
    ]);
  }, []);

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
        addLog(`[Calm Lens Error]: ${err instanceof Error ? err.message : String(err)}`);
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

  // Connect to live SSE endpoint (frames + tabs + real-time agent activity)
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
            } else if (act.phase === "scroll" || act.phase === "inspect") {
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
      } catch (err) {
        addLog(
          `[Navigation Error]: ${err instanceof Error ? err.message : String(err)}`
        );
        setStatus("error");
      } finally {
        setIsNavigating(false);
      }
    },
    [addLog, loadCalmPricing]
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
    setIsCalmLensActive(false);
    const targetBot = bots.find((b) => b.id === botId);
    if (targetBot) {
      if (targetBot.currentFrame) setCurrentFrame(targetBot.currentFrame);
      setActiveUrl(targetBot.url);
      setInputUrl(targetBot.url);
      setPageTitle(targetBot.title);
      if (targetBot.cursor) setCursor(targetBot.cursor);
      setStatus(targetBot.status);
    }

    try {
      await fetch("/api/browser/parallel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "select_bot", botId }),
      });
      addLog(`[Tab] Focused tab: ${targetBot?.service || botId}`);
    } catch {
      // ignore
    }
  };

  const handleHistoryAction = async (direction: "back" | "forward") => {
    addLog(`[History] ${direction.toUpperCase()}`);
    try {
      await fetch("/api/browser/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: direction }),
      });
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
      addLog(`[Parallel Error]: ${err instanceof Error ? err.message : String(err)}`);
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
    addLog(
      next
        ? "[Pair Browsing] Manual control active — clicks & scroll forward to Chromium"
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

  const handleCanvasClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTakeoverActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const scaleX = 960 / rect.width;
    const scaleY = 860 / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

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

  const handleCanvasWheel = async (e: React.WheelEvent<HTMLDivElement>) => {
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
  const isBusy =
    isNavigating ||
    isComparing ||
    status === "navigating" ||
    status === "evaluating" ||
    status === "extracting";

  return (
    <div
      ref={containerRef}
      className={`h-full flex flex-col bg-[#FCFCFC] text-[#1E1B1B] overflow-hidden select-none ${className}`}
    >
      {/* 1. OpenCode Recessed Browser Tab Strip */}
      <div className="h-9 bg-[#F8F7F7] border-b border-[#E6E4E3] flex items-center justify-between px-2 gap-2 shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-end h-full gap-0.5 min-w-0">
          {bots.map((bot) => {
            const isSelected = activeBotId === bot.id;
            const tabBusy =
              bot.status === "navigating" ||
              bot.status === "evaluating" ||
              bot.status === "extracting";
            return (
              <button
                key={bot.id}
                type="button"
                onClick={() => handleSelectBot(bot.id)}
                title={`${bot.title} (${bot.url})`}
                className={`h-[31px] max-w-[190px] px-2.5 rounded-t-md text-[12px] font-medium inline-flex items-center gap-1.5 border border-b-0 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${
                  isSelected
                    ? "bg-white text-[#1E1B1B] border-[#E6E4E3] relative top-[1px]"
                    : "bg-transparent text-[#5C5858] border-transparent hover:bg-[#EFECEB] hover:text-[#1E1B1B]"
                }`}
              >
                {tabBusy ? (
                  <Loader2 className="w-3 h-3 text-[#034CFF] animate-spin shrink-0" />
                ) : (
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      bot.status === "error" ? "bg-red-500" : "bg-emerald-500"
                    }`}
                  />
                )}
                <span className="truncate">
                  {bot.service.replace(/ Standard HD| Individual/g, "")}
                </span>
                {bot.extractedResult && (
                  <span className="text-[10.5px] font-mono tabular-nums text-[#8A8585] shrink-0">
                    ${bot.extractedResult.price.toFixed(2)}
                  </span>
                )}
              </button>
            );
          })}
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
      </div>

      {/* 2. Browser Navigation Bar & Omnibar (URL + Live Web Search) */}
      <div className="relative h-10 px-2.5 bg-white border-b border-[#E6E4E3] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => handleHistoryAction("back")}
            className="h-7 w-7 rounded-md flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
            title="Back"
            aria-label="Back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleHistoryAction("forward")}
            className="h-7 w-7 rounded-md flex items-center justify-center text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
            title="Forward"
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
            <span className="hidden xl:inline">Calm lens</span>
          </button>

          <button
            type="button"
            onClick={toggleTakeoverMode}
            className={`h-7 px-2.5 rounded-md text-[12px] font-medium flex items-center gap-1.5 border transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${
              isTakeoverActive
                ? "bg-amber-500 text-[#1E1B1B] border-amber-500"
                : "bg-white hover:bg-[#F8F7F7] text-[#5C5858] hover:text-[#1E1B1B] border-[#D6D3D1]"
            }`}
            title="Pair browse / human takeover — click & scroll the live page"
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
            title="Toggle CDP trace logs"
            aria-label="Toggle CDP trace logs"
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

      {/* 3. Main Live Chromium Viewport Stage (Full-Bleed, Zero Letterboxing) */}
      <div
        onClick={handleCanvasClick}
        onWheel={handleCanvasWheel}
        className={`relative flex-1 bg-[#FCFCFC] flex items-start justify-center overflow-hidden min-h-[300px] ${
          isTakeoverActive ? "cursor-crosshair ring-2 ring-inset ring-amber-400" : ""
        }`}
      >
        {isTakeoverActive && (
          <div className="absolute top-3 left-3 right-3 z-40 px-3 py-2 rounded-lg bg-white/95 border border-amber-300 flex items-center justify-between shadow-md text-xs text-[#1E1B1B]">
            <span className="font-medium">
              Pair browsing active — click or scroll directly inside the live page
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
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 text-neutral-300">
              <Sparkles className="w-5 h-5 animate-spin text-neutral-400" />
              <p className="text-xs m-0">Normalizing plan tiers...</p>
            </div>
          )
        ) : currentFrame ? (
          <div className="relative w-full h-full overflow-hidden bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentFrame}
              alt={pageTitle || "Live Chromium browser viewport"}
              className="w-full h-auto pointer-events-none block"
            />

            {cursor && (
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
              : `LIVE · ${fps} FPS`}
          </span>
        </div>
      </div>

      {/* 4. Collapsible CDP Console Drawer */}
      {showConsole && (
        <div className="h-32 bg-[#131010] border-t border-[#2B2626] p-2.5 text-neutral-300 font-mono text-[11px] overflow-y-auto space-y-1 shrink-0 select-text oc-scroller">
          <div className="flex items-center justify-between pb-1 border-b border-[#2B2626] text-[10px] text-neutral-400">
            <span>CHROMIUM CDP &amp; AGENT TRACE</span>
            <span>Frames: {totalFrames}</span>
          </div>
          {cdpLogs.map((log, idx) => (
            <div key={idx} className="leading-tight text-neutral-300">
              {log}
            </div>
          ))}
        </div>
      )}

      {/* 5. Quiet Status Footer */}
      <div className="h-7 px-3 bg-[#F8F7F7] border-t border-[#E6E4E3] flex items-center justify-between text-[11px] text-[#5C5858] shrink-0">
        <div className="flex items-center gap-1.5 truncate max-w-[65%]">
          <Globe className="w-3 h-3 text-[#8A8585] shrink-0" />
          <span className="truncate text-[#1E1B1B] font-medium" title={pageTitle}>
            {pageTitle || activeUrl}
          </span>
        </div>

        <div className="flex items-center gap-2.5 font-mono text-[10.5px] tabular-nums shrink-0 text-[#8A8585]">
          <span>{bots.length} tabs</span>
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
