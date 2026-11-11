"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Lock,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  Terminal,
  Zap,
  Globe,
  Radio,
  CheckCircle2,
  Sparkles,
  Bot,
  TrendingDown,
  Check,
  AlertTriangle,
  User,
  MousePointer,
} from "lucide-react";
import { ScreencastFrame, CursorEvent, HelperBotSession, ParallelVerificationResult, CalmPricingResult } from "@/lib/browser/types";
import { CalmPricingLens } from "./CalmPricingLens";
import { NeedsYouBanner } from "./NeedsYouBanner";
import { ApprovalRequest } from "./ApprovalDialog";
import { TakeoverChallengeModal } from "./TakeoverChallengeModal";

interface LiveBrowserViewportProps {
  onPlanSelected?: (service: string, price: number, planName: string) => void;
  approvalRequest?: ApprovalRequest | null;
  onApproveApproval?: (fundingSource?: "PAYPAL" | "BACKUP_CARD") => void;
  onRejectApproval?: () => void;
  className?: string;
}

const PRESET_MERCHANTS = [
  { name: "Netflix", url: "https://help.netflix.com/en/node/24926" },
  { name: "Spotify", url: "https://www.spotify.com/us/premium/" },
  { name: "GitHub", url: "https://github.com/features/copilot/plans" },
  { name: "Stripe", url: "https://stripe.com/pricing" },
  { name: "AWS", url: "https://aws.amazon.com/pricing/" },
  { name: "ChatGPT", url: "https://openai.com/chatgpt/pricing/" },
  { name: "Twilio", url: "https://www.twilio.com/en-us/pricing" },
  { name: "Snowflake", url: "https://www.snowflake.com/pricing/" },
];

export function LiveBrowserViewport({
  onPlanSelected,
  approvalRequest,
  onApproveApproval,
  onRejectApproval,
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
    label: "Bot #1: Locked ($15.49)",
    timestamp: Date.now(),
  });
  const [fps, setFps] = useState<number>(30);
  const [status, setStatus] = useState<ScreencastFrame["status"]>("ready");
  const [totalFrames, setTotalFrames] = useState<number>(1);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showConsole, setShowConsole] = useState<boolean>(false);
  const [clickRipple, setClickRipple] = useState<{ x: number; y: number } | null>(
    null
  );

  // Parallel Helper Bots State
  const [bots, setBots] = useState<HelperBotSession[]>([]);
  const [activeBotId, setActiveBotId] = useState<string>("bot-netflix");
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [bestDeal, setBestDeal] = useState<ParallelVerificationResult["bestDeal"] | null>(null);

  // Zephium Calm Pricing Lens State
  const [isCalmLensActive, setIsCalmLensActive] = useState<boolean>(false);
  const [calmData, setCalmData] = useState<CalmPricingResult | null>(null);
  const [isSimplifying, setIsSimplifying] = useState<boolean>(false);

  // Zephium "Needs You" Decision Banner State
  const [simulatedApproval, setSimulatedApproval] = useState<ApprovalRequest | null>(null);
  const activeApproval = approvalRequest || simulatedApproval;

  // Feature 6: Zephium Live Human Takeover Mode State
  const [isTakeoverActive, setIsTakeoverActive] = useState<boolean>(false);
  const [activeChallenge, setActiveChallenge] = useState<"CLOUDFLARE_TURNSTILE" | "TWO_FACTOR_SMS" | null>(null);

  const [cdpLogs, setCdpLogs] = useState<string[]>([
    "[CDP Engine] Initialized DevTools protocol session",
    "[Page.startScreencast] Format: JPEG, Max 1280x720 @ 30FPS",
    "[Parallel] 3 Helper Bots standby and ready for concurrent dispatch",
    "[Stream] Connected to /api/browser/screencast SSE",
  ]);

  const containerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Append log entry
  const addLog = useCallback((msg: string) => {
    setCdpLogs((prev) => [
      ...prev.slice(-40),
      `[${new Date().toLocaleTimeString()}] ${msg}`,
    ]);
  }, []);

  // Zephium Calm Pricing Lens: Fetch decluttered plans and stripped traps
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
            `[Zephium Restyler] Decluttered ${data.result.service}: ${data.result.darkPatternsStrippedCount} dark patterns stripped, calm score ${data.result.calmScore}/100.`
          );
        }
      } catch (err) {
        addLog(`[Restyle Error]: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsSimplifying(false);
      }
    },
    [activeUrl, addLog]
  );

  // Fetch initial bots & calm pricing baseline
  useEffect(() => {
    fetch("/api/browser/parallel")
      .then((res) => res.json())
      .then((data) => {
        if (data.bots && data.bots.length > 0) {
          setBots(data.bots);
          if (data.activeBotId) setActiveBotId(data.activeBotId);
        }
      })
      .catch((err) => console.warn("Failed to load initial helper bots:", err));

    loadCalmPricing("netflix");
  }, [loadCalmPricing]);

  // Connect to live SSE endpoint
  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    function connect() {
      try {
        es = new EventSource("/api/browser/screencast");
        eventSourceRef.current = es;

        es.addEventListener("open", () => {
          setIsConnected(true);
          addLog("Connected to /api/browser/screencast SSE stream");
        });

        es.addEventListener("connected", (event) => {
          setIsConnected(true);
          try {
            const data = JSON.parse(event.data);
            if (data.info?.currentUrl) {
              setActiveUrl(data.info.currentUrl);
              setInputUrl(data.info.currentUrl);
            }
          } catch {
            // ignore
          }
        });

        es.addEventListener("frame", (event) => {
          try {
            const data: ScreencastFrame = JSON.parse(event.data);
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
            if (data.cursor) {
              setCursor(data.cursor);
              if (data.cursor.action === "click") {
                setClickRipple({ x: data.cursor.x, y: data.cursor.y });
                setTimeout(() => setClickRipple(null), 800);
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
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (err) {
        console.error("SSE connection error:", err);
        reconnectTimer = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (es) {
        es.close();
      }
    };
  }, [addLog]);

  // Switch active helper bot tab
  const handleSelectBot = async (botId: string) => {
    setActiveBotId(botId);
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
      addLog(`[Tab Switch] Switched Viewport to Helper Bot: ${targetBot?.service || botId}`);
    } catch {
      // ignore
    }
  };

  // Run parallel multi-site comparison
  const handleRunComparison = async (preset: "streaming" | "devtools" | "cloud" = "streaming") => {
    setIsComparing(true);
    addLog(`[Parallel Helper Bots] Dispatched concurrent workers for: ${preset.toUpperCase()}`);

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
          addLog(
            `[Parallel Result] Best deal found: ${data.result.bestDeal.service} at $${data.result.bestDeal.price}/mo (Save $${data.result.bestDeal.savingsVsHighest})`
          );
        }
      }
    } catch (err) {
      addLog(`[Parallel Error]: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsComparing(false);
    }
  };

  // 1-Click Interactive Plan Selection from Calm Pricing Lens
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
    setTimeout(() => setClickRipple(null), 1000);

    addLog(
      `[1-Click Mandate] Plan locked via Calm Lens: ${service} (${planName}) @ $${price.toFixed(2)}/mo`
    );

    if (onPlanSelected) {
      onPlanSelected(service, price, planName);
    }
  };

  // Zephium "Needs You" Decision Banner Handlers
  const handleApproveFromBanner = (
    fundingSource: "PAYPAL" | "BACKUP_CARD" = "PAYPAL"
  ) => {
    setSimulatedApproval(null);
    addLog(
      `[Needs You] Decision confirmed: Approved payment via ${
        fundingSource === "BACKUP_CARD"
          ? "Backup Visa Debit (•••• 4242)"
          : "PayPal Wallet"
      }`
    );
    if (onApproveApproval) {
      onApproveApproval(fundingSource);
    }
  };

  const handleRejectFromBanner = () => {
    setSimulatedApproval(null);
    addLog("[Needs You] Decision confirmed: Payment rejected. Funds withheld.");
    if (onRejectApproval) {
      onRejectApproval();
    }
  };

  const handleSimulateSpike = () => {
    const req: ApprovalRequest = {
      id: `sim-spike-${Date.now()}`,
      service: "Netflix Standard HD",
      detectedPrice: 19.99,
      budgetCeiling: 16.0,
      baselinePrice: 15.49,
      spikePercentage: 29,
      reason:
        "Merchant raised price from $15.49 to $19.99 (+29.1% sudden spike). Exceeds 20% anomaly threshold.",
      currency: "USD",
      anomalyType: "PRICE_SPIKE",
      riskLevel: "danger",
    };
    setSimulatedApproval(req);
    addLog(
      "[Guardrail Alert] Simulated price anomaly spike (+29.1%) triggered for demonstration."
    );
  };

  // Feature 6: Human Takeover Mode Handlers
  const toggleTakeoverMode = async () => {
    const next = !isTakeoverActive;
    setIsTakeoverActive(next);

    addLog(
      next
        ? "[Human Takeover] User engaged live interactive control of Chromium canvas"
        : "[Autonomous Mode] Control handed back to Rico AI agent"
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

    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    setCursor({
      x,
      y,
      action: "click",
      label: `👤 Human Click (${x}, ${y})`,
      timestamp: Date.now(),
    });
    setClickRipple({ x, y });
    setTimeout(() => setClickRipple(null), 800);

    addLog(`[Takeover Input] Dispatched human click to (${x}, ${y}) via Playwright`);

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

  const handleChallengeSolved = async () => {
    setActiveChallenge(null);
    setIsTakeoverActive(false);

    addLog(
      "[Takeover Resolved] Challenge verified by human! Resuming Rico autonomous checkout."
    );

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

  // Navigate to merchant URL using Playwright worker
  const handleNavigate = async (url: string, serviceName?: string) => {
    setIsNavigating(true);
    setStatus("navigating");
    addLog(`Initiating live navigation to: ${url}`);

    // If Calm Lens is active or merchant changed, fetch simplified data
    loadCalmPricing(serviceName || url);

    try {
      const res = await fetch("/api/browser/navigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, service: serviceName || "Merchant" }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        addLog(
          `Extracted verified price: $${data.result.price} for ${data.result.service}`
        );
        setStatus("ready");
        if (onPlanSelected) {
          onPlanSelected(
            data.result.service,
            data.result.price,
            data.result.planName
          );
        }
      } else {
        addLog(`Navigation completed with status: ${data.result?.source || "ready"}`);
        setStatus("ready");
      }
    } catch (err) {
      addLog(`Navigation error: ${err instanceof Error ? err.message : String(err)}`);
      setStatus("error");
    } finally {
      setIsNavigating(false);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    let urlToUse = inputUrl.trim();
    if (!urlToUse.startsWith("http://") && !urlToUse.startsWith("https://")) {
      urlToUse = `https://${urlToUse}`;
    }
    handleNavigate(urlToUse);
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const activeBot = bots.find((b) => b.id === activeBotId);

  return (
    <div
      ref={containerRef}
      className={`h-full flex flex-col bg-[#F6FAFF] text-[#0F172A] rounded-xl border border-[#C8DDF8] shadow-2xs overflow-hidden font-[Inter,system-ui,sans-serif] select-none ${className}`}
    >
      {/* 1. Top Browser Toolbar */}
      <div className="h-11 px-3 bg-white border-b border-[#C8DDF8] flex items-center justify-between gap-2 shrink-0">
        {/* Left: Window Controls & Navigation Buttons */}
        <div className="flex items-center gap-2">
          {/* Mac-style Window Dots */}
          <div className="flex items-center gap-1.5 mr-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1 rounded text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2EEFD] transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="p-1 rounded text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2EEFD] transition-colors"
              title="Forward"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleNavigate(activeUrl)}
              disabled={isNavigating}
              className={`p-1 rounded text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2EEFD] transition-colors ${
                isNavigating ? "animate-spin text-blue-600" : ""
              }`}
              title="Refresh / Re-verify page"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Address Bar with Secure TLS Padlock */}
        <form
          onSubmit={handleUrlSubmit}
          className="flex-1 max-w-xl mx-2 flex items-center"
        >
          <div className="w-full h-7 px-2.5 rounded-lg bg-[#F8FAFC] border border-[#C7DCF6] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-200 flex items-center gap-2 transition-all">
            <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Enter merchant URL (e.g., https://netflix.com/pricing)..."
              className="w-full bg-transparent text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none font-mono truncate"
            />
            {isNavigating && (
              <span className="text-[10px] text-blue-600 animate-pulse font-mono shrink-0">
                LOADING...
              </span>
            )}
          </div>
        </form>

        {/* Right: Live Stream Status Pills & Actions */}
        <div className="flex items-center gap-2">
          {/* Calm Pricing Lens Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !isCalmLensActive;
              setIsCalmLensActive(next);
              if (next && !calmData) {
                loadCalmPricing(activeUrl);
              }
              addLog(
                next
                  ? "[Restyler] Calm Pricing Lens Activated — Decluttering DOM"
                  : "[CDP Engine] Restored Raw Live Screencast View"
              );
            }}
            className={`px-2 py-0.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all border shadow-2xs ${
              isCalmLensActive
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
            }`}
            title="Toggle Calm Pricing Lens (Real-Time In-Place Restyling)"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isCalmLensActive ? "animate-spin text-white" : "text-purple-600"}`} />
            <span className="hidden md:inline font-sans">Calm Lens</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                isCalmLensActive ? "bg-black/20 text-white" : "bg-purple-100 text-purple-800"
              }`}
            >
              {isCalmLensActive ? "ACTIVE" : "RESTYLE"}
            </span>
          </button>

          {/* Feature 6: Live Human Takeover Button */}
          <button
            type="button"
            onClick={toggleTakeoverMode}
            className={`px-2 py-0.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all border shadow-2xs ${
              isTakeoverActive
                ? "bg-amber-500 text-black border-amber-400 font-bold"
                : "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
            }`}
            title="Toggle Live Human Takeover Mode (Interactive fallback for CAPTCHA/2FA)"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden lg:inline font-sans">Takeover</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                isTakeoverActive ? "bg-black/80 text-amber-300" : "bg-amber-100 text-amber-900"
              }`}
            >
              {isTakeoverActive ? "ENGAGED" : "MANUAL"}
            </span>
          </button>

          {/* Live 30FPS Screencast Badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono border ${
              isConnected
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-amber-50 border-amber-200 text-amber-700"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span>{fps} FPS LIVE CDP</span>
          </div>

          {/* Console / Telemetry Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowConsole((prev) => !prev)}
            className={`p-1.5 rounded-md text-xs transition-colors border ${
              showConsole
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2EEFD] border-transparent"
            }`}
            title="Toggle CDP Telemetry Logs"
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2EEFD] transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Parallel Helper Bots Multi-Tab Strip */}
      <div className="px-3 py-1.5 bg-[#F6FAFF] border-b border-[#DCE9FA] flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 text-[10px] uppercase font-mono text-[#52637A] mr-1 shrink-0">
            <Bot className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span className="font-semibold">Parallel Bots:</span>
          </div>

          {bots.map((bot, idx) => {
            const isSelected = activeBotId === bot.id;
            return (
              <button
                key={bot.id}
                type="button"
                onClick={() => handleSelectBot(bot.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 border ${
                  isSelected
                    ? "bg-[#2563EB] text-white border-blue-600 shadow-2xs font-bold"
                    : "bg-white hover:bg-[#E2EEFD] border-[#C8DDF8] text-[#334155]"
                }`}
                title={`Click to switch live viewport to Bot #${idx + 1} (${bot.service})`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    bot.status === "navigating"
                      ? "bg-amber-400 animate-ping"
                      : bot.status === "ready"
                      ? "bg-emerald-400"
                      : "bg-blue-400"
                  }`}
                />
                <span>Bot #{idx + 1}:</span>
                <span className="truncate max-w-[90px]">{bot.service.split(" ")[0]}</span>
                {bot.extractedResult && (
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded font-mono font-bold ${
                      isSelected ? "bg-black/20 text-white" : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    ${bot.extractedResult.price.toFixed(2)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Parallel Comparison Launchers */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleRunComparison("streaming")}
            disabled={isComparing}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 transition-all ${
              isComparing ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <Zap className="w-3 h-3 text-emerald-600" />
            <span>Compare Streaming</span>
          </button>

          <button
            type="button"
            onClick={() => handleRunComparison("devtools")}
            disabled={isComparing}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1 transition-all ${
              isComparing ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>Compare Dev Tools</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateSpike}
            className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 transition-all"
          >
            <AlertTriangle className="w-3 h-3 text-amber-600 animate-pulse" />
            <span>Spike Alert</span>
          </button>
        </div>
      </div>

      {/* Best Deal Banner */}
      {bestDeal && (
        <div className="px-3 py-1.5 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between text-xs text-emerald-900 animate-in fade-in shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-0.5 rounded bg-emerald-200 text-emerald-800">
              <TrendingDown className="w-3.5 h-3.5" />
            </span>
            <span className="font-bold">Best Rate Discovered:</span>
            <span>{bestDeal.service} ({bestDeal.planName})</span>
            <span className="font-mono text-emerald-800 font-bold">${bestDeal.price.toFixed(2)}/mo</span>
            {bestDeal.savingsVsHighest > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">
                Save ${bestDeal.savingsVsHighest.toFixed(2)}/mo
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (onPlanSelected) {
                onPlanSelected(bestDeal.service, bestDeal.price, bestDeal.planName);
              }
            }}
            className="px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors shadow-2xs"
          >
            <Check className="w-3 h-3" />
            <span>Lock Plan</span>
          </button>
        </div>
      )}

      {/* 3. Quick Preset Merchant Selector Bar */}
      <div className="px-3 py-1 bg-white border-b border-[#DCE9FA] flex items-center justify-between text-xs gap-2 shrink-0 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] uppercase font-mono text-[#52637A] font-semibold flex items-center gap-1 mr-1">
            <Radio className="w-3 h-3 text-blue-600 animate-pulse" />
            Presets:
          </span>

          {PRESET_MERCHANTS.map((m) => (
            <button
              key={m.name}
              type="button"
              onClick={() => handleNavigate(m.url, m.name)}
              disabled={isNavigating}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                activeUrl.includes(m.name.toLowerCase())
                  ? "bg-[#0F172A] text-white shadow-2xs"
                  : "bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] border border-slate-200"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2 text-[10px] text-[#52637A] font-mono shrink-0">
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Direct Merchant CDP Stream
          </span>
        </div>
      </div>

      {/* Feature 5: Zephium "Needs You" Human Approval & Takeover Banner */}
      {activeApproval && (
        <NeedsYouBanner
          request={activeApproval}
          onApprovePayPal={() => handleApproveFromBanner("PAYPAL")}
          onApproveBackupCard={() => handleApproveFromBanner("BACKUP_CARD")}
          onReject={handleRejectFromBanner}
        />
      )}

      {/* 4. Main Viewport Stage / Canvas Area */}
      <div
        onClick={handleCanvasClick}
        className={`relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[320px] ${
          isTakeoverActive ? "cursor-crosshair ring-2 ring-amber-500/50" : ""
        }`}
      >
        {/* Live Human Takeover Floating Bar */}
        {isTakeoverActive && (
          <div className="absolute top-2 left-2 right-2 z-40 px-3 py-1.5 rounded-lg bg-amber-950/90 border border-amber-500/70 backdrop-blur-md flex items-center justify-between shadow-xl text-xs font-mono text-amber-200 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="font-bold text-white uppercase tracking-wider">
                Human Takeover Engaged
              </span>
              <span className="hidden sm:inline text-neutral-300">
                • Clicks sent directly to live Chromium
              </span>
            </div>

            <button
              type="button"
              onClick={toggleTakeoverMode}
              className="px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Hand Back to Rico</span>
            </button>
          </div>
        )}

        {/* Interactive CAPTCHA / 2FA Challenge Modal */}
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

        {/* Branch 1: Zephium Calm Pricing Lens Active View */}
        {isCalmLensActive ? (
          calmData ? (
            <CalmPricingLens
              data={calmData}
              onSelectPlan={handlePlanSelectedFromLens}
              isLoading={isSimplifying}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-semibold text-purple-200">
                  Restyling with Zephium Calm Pricing Lens...
                </p>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                  Stripping marketing traps, normalizing tiered usage formulas, and unmasking hidden fees
                </p>
              </div>
            </div>
          )
        ) : currentFrame ? (
          /* Branch 2: Live CDP Screencast Stream */
          <div className="relative w-full h-full flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentFrame}
              alt="Live Browser Screencast Viewport"
              className="max-w-full max-h-full object-contain pointer-events-none"
            />

            {/* AI Clicking Cursor Overlay */}
            {cursor && (
              <div
                className="absolute pointer-events-none transition-all duration-150 ease-out z-30"
                style={{
                  left: `${(cursor.x / 1280) * 100}%`,
                  top: `${(cursor.y / 720) * 100}%`,
                  transform: "translate(-2px, -2px)",
                }}
              >
                {/* Click Ripple Wave */}
                {clickRipple && (
                  <div className="absolute -left-4 -top-4 w-9 h-9 rounded-full border-2 border-blue-400 bg-blue-500/30 animate-ping" />
                )}

                {/* SVG Pointer Arrow */}
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                >
                  <path
                    d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>

                {/* AI Cursor Target Label Pill */}
                {cursor.label && (
                  <div className="absolute left-4 top-2 px-2 py-0.5 rounded-full bg-neutral-900/95 border border-blue-500 text-[10px] font-sans font-medium text-neutral-100 whitespace-nowrap shadow-lg flex items-center gap-1 animate-in fade-in duration-100 backdrop-blur-xs">
                    <Sparkles className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                    <span>{cursor.label}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-200">
                Initializing Playwright CDP Screencaster...
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Connecting to Chromium DevTools Protocol stream
              </p>
            </div>
          </div>
        )}

        {/* Live Status Overlay Pill (Top Right) */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          {isTakeoverActive ? (
            <div className="bg-amber-500 text-black px-2.5 py-1 rounded-full text-[10px] font-mono font-bold shadow-lg flex items-center gap-1.5 animate-pulse">
              <MousePointer className="w-3 h-3" />
              <span>Human Takeover Active</span>
            </div>
          ) : isCalmLensActive ? (
            <div className="bg-purple-950/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-purple-500/50 text-[10px] font-mono text-purple-300 font-bold shadow-lg flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
              <span>Zephium Calm Lens Active</span>
            </div>
          ) : activeBot ? (
            <div className="bg-blue-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-blue-500/40 text-[10px] font-mono text-blue-300 font-semibold shadow-lg">
              Active: {activeBot.service.split(" ")[0]}
            </div>
          ) : null}

          <div className="flex items-center gap-1.5 bg-neutral-950/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-neutral-700/60 shadow-lg text-[10px] font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                status === "navigating"
                  ? "bg-amber-400 animate-ping"
                  : status === "evaluating"
                  ? "bg-blue-400 animate-pulse"
                  : "bg-emerald-400"
              }`}
            />
            <span className="text-neutral-300 uppercase">
              {status === "navigating"
                ? "Navigating..."
                : status === "evaluating"
                ? "Inspecting DOM..."
                : status === "extracting"
                ? "Extracting Price..."
                : "Live Stream Active"}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Bottom Collapsible CDP Console / Telemetry Drawer */}
      {showConsole && (
        <div className="h-32 bg-[#0F172A] border-t border-[#C8DDF8] p-2.5 text-neutral-300 font-mono text-[11px] overflow-y-auto space-y-1 shrink-0 select-text">
          <div className="flex items-center justify-between pb-1 border-b border-neutral-800 text-[10px] text-neutral-400">
            <span>CHROME DEVTOOLS PROTOCOL &amp; PARALLEL WORKER LOGS</span>
            <span>Frames Streamed: {totalFrames}</span>
          </div>
          {cdpLogs.map((log, idx) => (
            <div key={idx} className="leading-tight text-neutral-400">
              {log}
            </div>
          ))}
        </div>
      )}

      {/* 6. Bottom Status Footer */}
      <div className="h-8 px-3 bg-white border-t border-[#C8DDF8] flex items-center justify-between text-[11px] text-[#52637A] shrink-0">
        <div className="flex items-center gap-2 truncate max-w-md">
          <Globe className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
          <span className="truncate text-[#0F172A] font-medium" title={pageTitle}>
            {pageTitle || activeUrl}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px] shrink-0">
          <span className="hidden sm:inline text-[#64748B]">
            Active Bots: {bots.length}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-[#52637A]">Frames: {totalFrames}</span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-700 font-bold">{fps} FPS</span>
        </div>
      </div>
    </div>
  );
}
