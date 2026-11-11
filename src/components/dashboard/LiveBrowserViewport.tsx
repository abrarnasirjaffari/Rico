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
  Sparkles,
  TrendingDown,
  Check,
  User,
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
      className={`h-full flex flex-col bg-white text-[#0F172A] rounded-xl border border-[#DCE7F3] shadow-[0_1px_4px_rgba(15,23,42,0.04)] overflow-hidden select-none ${className}`}
    >
      {/* Clean Single Browser Bar */}
      <div className="h-11 px-3 bg-white border-b border-[#EDF3FA] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="h-7 w-7 rounded-md flex items-center justify-center text-[#7B8BA1] hover:text-[#0F172A] hover:bg-[#F2F6FC] transition-colors duration-150"
            title="Back"
            aria-label="Back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="h-7 w-7 rounded-md flex items-center justify-center text-[#7B8BA1] hover:text-[#0F172A] hover:bg-[#F2F6FC] transition-colors duration-150"
            title="Forward"
            aria-label="Forward"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleNavigate(activeUrl)}
            disabled={isNavigating}
            className="h-7 w-7 rounded-md flex items-center justify-center text-[#7B8BA1] hover:text-[#0F172A] hover:bg-[#F2F6FC] transition-colors duration-150"
            title="Reload"
            aria-label="Reload"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isNavigating ? "animate-spin text-[#2563EB]" : ""}`}
            />
          </button>
        </div>

        <form
          onSubmit={handleUrlSubmit}
          className="flex-1 max-w-xl mx-2 flex items-center"
        >
          <div className="w-full h-8 px-3 rounded-lg bg-[#F8FAFC] border border-[#DCE7F3] focus-within:border-[#2563EB] flex items-center gap-2 transition-colors duration-150">
            <Lock className="w-3 h-3 text-[#7B8BA1] shrink-0" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              aria-label="Merchant URL"
              placeholder="https://netflix.com/pricing"
              className="w-full bg-transparent text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none font-mono truncate"
            />
          </div>
        </form>

        <div className="flex items-center gap-1.5">
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
                  ? "[Calm Lens] Normalized pricing view enabled"
                  : "[CDP] Live browser stream restored"
              );
            }}
            className={`h-7 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors duration-150 ${
              isCalmLensActive
                ? "bg-[#0F172A] text-white border-[#0F172A]"
                : "bg-white hover:bg-[#F5F8FC] text-[#334155] border-[#DCE7F3]"
            }`}
            title="Normalize pricing plans and strip fine print"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Calm lens</span>
          </button>

          <button
            type="button"
            onClick={toggleTakeoverMode}
            className={`h-7 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors duration-150 ${
              isTakeoverActive
                ? "bg-amber-500 text-neutral-950 border-amber-500"
                : "bg-white hover:bg-[#F5F8FC] text-[#334155] border-[#DCE7F3]"
            }`}
            title="Manual takeover for CAPTCHA or 2FA"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">
              {isTakeoverActive ? "Takeover on" : "Takeover"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowConsole((prev) => !prev)}
            className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors duration-150 ${
              showConsole
                ? "bg-[#EDF3FA] text-[#0F172A]"
                : "text-[#7B8BA1] hover:text-[#0F172A] hover:bg-[#F5F8FC]"
            }`}
            title="Toggle CDP trace"
            aria-label="Toggle CDP trace"
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-[#7B8BA1] hover:text-[#0F172A] hover:bg-[#F5F8FC] transition-colors duration-150"
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
      </div>

      {/* Quiet Secondary Strip: Active Workers & Merchant Presets */}
      <div className="px-3 py-1.5 bg-[#FAFBFD] border-b border-[#EDF3FA] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs">
        <div className="flex items-center gap-1.5 shrink-0">
          {bots.map((bot, idx) => {
            const isSelected = activeBotId === bot.id;
            return (
              <button
                key={bot.id}
                type="button"
                onClick={() => handleSelectBot(bot.id)}
                className={`h-7 px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 shrink-0 border transition-colors duration-150 ${
                  isSelected
                    ? "bg-white text-[#0F172A] border-[#C8D9EE] shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                    : "bg-transparent hover:bg-white/70 border-transparent text-[#52637A]"
                }`}
                title={`Worker #${idx + 1} (${bot.service})`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    bot.status === "navigating"
                      ? "bg-amber-400"
                      : "bg-emerald-500"
                  }`}
                />
                <span>{bot.service.split(" ")[0]}</span>
                {bot.extractedResult && (
                  <span className="text-[11px] font-mono tabular-nums text-[#7B8BA1]">
                    ${bot.extractedResult.price.toFixed(2)}
                  </span>
                )}
              </button>
            );
          })}

          <span className="text-[#DCE7F3] mx-1">|</span>

          {PRESET_MERCHANTS.slice(0, 5).map((m) => (
            <button
              key={m.name}
              type="button"
              onClick={() => handleNavigate(m.url, m.name)}
              disabled={isNavigating}
              className="h-6 px-2 rounded text-[11px] text-[#52637A] hover:text-[#0F172A] hover:bg-[#EDF3FA] transition-colors duration-150"
            >
              {m.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleRunComparison("streaming")}
            disabled={isComparing}
            className="h-6 px-2.5 rounded-md text-[11px] font-medium bg-white hover:bg-[#EDF3FA] text-[#334155] border border-[#DCE7F3] transition-colors duration-150 disabled:opacity-50"
          >
            Compare plans
          </button>

          <button
            type="button"
            onClick={handleSimulateSpike}
            className="h-6 px-2.5 rounded-md text-[11px] font-medium bg-white hover:bg-amber-50 text-[#52637A] hover:text-amber-800 border border-[#DCE7F3] transition-colors duration-150"
          >
            Test spike
          </button>
        </div>
      </div>

      {bestDeal && (
        <div className="px-4 py-2 bg-emerald-50/80 border-b border-emerald-200 flex items-center justify-between text-xs text-emerald-900 shrink-0">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-medium">
              Lowest verified rate: {bestDeal.service} ({bestDeal.planName})
            </span>
            <span className="font-mono font-semibold tabular-nums">
              ${bestDeal.price.toFixed(2)}/mo
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onPlanSelected) {
                onPlanSelected(bestDeal.service, bestDeal.price, bestDeal.planName);
              }
            }}
            className="h-7 px-2.5 rounded-md bg-[#0F172A] hover:bg-[#1E293B] text-white font-medium text-[11px] flex items-center gap-1 transition-colors duration-150"
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

      {/* Main Viewport Stage */}
      <div
        onClick={handleCanvasClick}
        className={`relative flex-1 bg-[#0F172A] flex items-center justify-center overflow-hidden min-h-[320px] ${
          isTakeoverActive ? "cursor-crosshair ring-2 ring-amber-400" : ""
        }`}
      >
        {isTakeoverActive && (
          <div className="absolute top-3 left-3 right-3 z-40 px-3.5 py-2 rounded-lg bg-white/95 border border-amber-300 backdrop-blur-xs flex items-center justify-between shadow-md text-xs text-[#0F172A]">
            <span className="font-medium">
              Manual takeover active — clicks forward directly to Chromium
            </span>

            <button
              type="button"
              onClick={toggleTakeoverMode}
              className="h-7 px-3 rounded-md bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium transition-colors duration-150"
            >
              Return control to Rico
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
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 text-slate-300">
              <Sparkles className="w-5 h-5 animate-spin text-slate-400" />
              <p className="text-xs m-0">Normalizing plan tiers...</p>
            </div>
          )
        ) : currentFrame ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentFrame}
              alt="Live browser verification viewport"
              className="max-w-full max-h-full object-contain pointer-events-none"
            />

            {cursor && (
              <div
                className="absolute pointer-events-none transition-transform duration-150 ease-out z-30"
                style={{
                  left: `${(cursor.x / 1280) * 100}%`,
                  top: `${(cursor.y / 720) * 100}%`,
                  transform: "translate(-2px, -2px)",
                }}
              >
                {clickRipple && (
                  <div className="absolute -left-4 -top-4 w-9 h-9 rounded-full border-2 border-blue-400 bg-blue-500/30 animate-ping" />
                )}

                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
                >
                  <path
                    d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                    fill="#2563EB"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>

                {cursor.label && (
                  <div className="absolute left-4 top-2 px-2.5 py-0.5 rounded-full bg-white/95 border border-[#DCE7F3] text-[10.5px] font-medium text-[#0F172A] whitespace-nowrap shadow-md">
                    {cursor.label}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
            <Zap className="w-5 h-5 text-slate-400 animate-pulse" />
            <p className="text-xs text-slate-300 m-0">
              Connecting to headless Chromium stream...
            </p>
          </div>
        )}

        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/15 text-[10.5px] font-mono text-slate-200 tabular-nums">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          <span>
            {status === "navigating"
              ? "Navigating"
              : status === "evaluating"
              ? "Inspecting"
              : `${fps} FPS`}
          </span>
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
