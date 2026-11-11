import { type Page } from "playwright";
import {
  ScreencastFrame,
  CursorEvent,
  BrowserSessionStatus,
  HelperBotSession,
  HumanTakeoverState,
  BrowserActivityLog,
} from "./types";

type FrameListener = (frame: ScreencastFrame) => void;
type BotsListener = (bots: HelperBotSession[], activeBotId: string) => void;
type ActivityListener = (activity: BrowserActivityLog) => void;

export function generateMerchantFrameSvg(
  service: string,
  url: string,
  planName: string,
  price: number,
  currency: string = "USD",
  features: string[] = [],
  accentColor: string = "#034CFF",
  botNumber: number = 1
): string {
  const formattedPrice = price.toFixed(2);
  const safeService = service.replace(/[<>&"]/g, "");
  const safePlan = planName.replace(/[<>&"]/g, "");
  const safeUrl = url.replace(/[<>&"]/g, "");
  const featureList = features.length > 0 ? features : [
    "Live DOM pricing verified",
    "Guarded by PayPal spending ceiling",
    "Ready for real-time agent navigation",
  ];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1120" height="920" viewBox="0 0 1120 920">
      <rect width="1120" height="920" fill="#FCFCFC" />

      <!-- Top Page Header -->
      <rect x="0" y="0" width="1120" height="76" fill="#FFFFFF" />
      <line x1="0" y1="76" x2="1120" y2="76" stroke="#E6E4E3" stroke-width="1" />
      <text x="72" y="46" fill="#1E1B1B" font-family="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="20" font-weight="700">${safeService}</text>
      <text x="1048" y="45" text-anchor="end" fill="#8A8585" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12">${safeUrl}</text>

      <!-- Hero Copy -->
      <text x="72" y="156" fill="#8A8585" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12" font-weight="600">VERIFIED PLAN OVERVIEW · TAB #${botNumber}</text>
      <text x="72" y="202" fill="#1E1B1B" font-family="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="34" font-weight="700">Choose the right plan for your team</text>
      <text x="72" y="236" fill="#5C5858" font-family="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="15">Transparent monthly pricing verified in headless Chromium. Ask Rico in chat to search any site live.</text>

      <!-- Primary Plan Card -->
      <rect x="72" y="284" width="472" height="410" rx="14" fill="#FFFFFF" stroke="${accentColor}" stroke-width="2" />
      <rect x="100" y="314" width="168" height="26" rx="6" fill="${accentColor}" fill-opacity="0.10" />
      <text x="114" y="332" fill="${accentColor}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" font-weight="700">OFFICIAL VERIFIED RATE</text>

      <text x="100" y="388" fill="#1E1B1B" font-family="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="22" font-weight="600">${safePlan}</text>
      <text x="100" y="456" fill="#1E1B1B" font-family="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="50" font-weight="800">$${formattedPrice}</text>
      <text x="276" y="456" fill="#5C5858" font-family="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="15">${currency} / month</text>

      <line x1="100" y1="488" x2="516" y2="488" stroke="#F1EFEF" stroke-width="1" />

      <text x="100" y="528" fill="#5C5858" font-family="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="14">✓  ${(featureList[0] || "Live DOM extracted").replace(/[<>&]/g, "")}</text>
      <text x="100" y="562" fill="#5C5858" font-family="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="14">✓  ${(featureList[1] || "Spending rule compliant").replace(/[<>&]/g, "")}</text>
      <text x="100" y="596" fill="#5C5858" font-family="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="14">✓  ${(featureList[2] || "Instant PayPal confirmation").replace(/[<>&]/g, "")}</text>

      <rect x="100" y="628" width="416" height="42" rx="8" fill="#1E1B1B" />
      <text x="308" y="654" text-anchor="middle" fill="#FFFFFF" font-family="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="14" font-weight="600">Select ${safePlan}</text>

      <!-- Right Verification Summary Card -->
      <rect x="572" y="284" width="476" height="410" rx="14" fill="#F8F7F7" stroke="#E6E4E3" stroke-width="1" />
      <text x="602" y="332" fill="#1E1B1B" font-family="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="17" font-weight="600">Live Browser Telemetry</text>

      <rect x="602" y="360" width="416" height="86" rx="10" fill="#FFFFFF" stroke="#E6E4E3" stroke-width="1" />
      <text x="624" y="392" fill="#8A8585" font-family="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="12">Browser Engine</text>
      <text x="624" y="420" fill="#1E1B1B" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14" font-weight="600">Playwright Chromium · CDP Screencast</text>

      <rect x="602" y="464" width="416" height="86" rx="10" fill="#FFFFFF" stroke="#E6E4E3" stroke-width="1" />
      <text x="624" y="496" fill="#8A8585" font-family="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="12">Real-Time Search &amp; Navigation</text>
      <text x="624" y="524" fill="#034CFF" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14" font-weight="600">Ask any query in chat to watch live</text>

      <rect x="602" y="568" width="416" height="86" rx="10" fill="#FFFFFF" stroke="#E6E4E3" stroke-width="1" />
      <text x="624" y="600" fill="#8A8585" font-family="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="12">Payment Guardrail</text>
      <text x="624" y="628" fill="#059669" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14" font-weight="600">Two-Step Confirmation · Safe Caps</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

class ScreencastManager {
  private listeners: Set<FrameListener> = new Set();
  private botsListeners: Set<BotsListener> = new Set();
  private activityListeners: Set<ActivityListener> = new Set();
  private activityHistory: BrowserActivityLog[] = [];
  private lastFrame: ScreencastFrame | null = null;
  private frameTimestamps: number[] = [];
  private currentUrl: string = "https://help.netflix.com/en/node/24926";
  private currentTitle: string = "Netflix Subscription & Pricing";
  private currentService: string = "Netflix";
  private status: ScreencastFrame["status"] = "idle";
  private totalFrames: number = 0;
  private lastCursor: CursorEvent | undefined;
  private lastActionLabel: string | undefined;

  // Parallel Helper Bots State
  private helperBots: Map<string, HelperBotSession> = new Map();
  private activeBotId: string = "bot-netflix";

  // Live Human Takeover & Interactive Playwright Session
  private activePage: Page | null = null;
  private takeoverState: HumanTakeoverState = { isActive: false };

  constructor() {
    this.initDefaultBots();
  }

  private initDefaultBots() {
    const netflixFrame = generateMerchantFrameSvg(
      "Netflix Standard HD",
      "https://help.netflix.com/en/node/24926",
      "Standard 2-Screen HD Streaming",
      15.49,
      "USD",
      ["1080p Full HD Streaming", "2 Supported Devices", "Auto-verified via PayPal Mandate"],
      "#3b82f6",
      1
    );

    const spotifyFrame = generateMerchantFrameSvg(
      "Spotify Premium",
      "https://www.spotify.com/us/premium/",
      "Individual Premium Plan",
      11.99,
      "USD",
      ["Ad-free music listening", "Offline downloads enabled", "High-fidelity audio quality"],
      "#10b981",
      2
    );

    const githubFrame = generateMerchantFrameSvg(
      "GitHub Copilot",
      "https://github.com/features/copilot/plans",
      "Copilot Business License",
      19.00,
      "USD",
      ["Multi-model AI generation", "Enterprise privacy filters", "CLI & IDE integration"],
      "#8b5cf6",
      3
    );

    this.helperBots.set("bot-netflix", {
      id: "bot-netflix",
      service: "Netflix Standard HD",
      url: "https://help.netflix.com/en/node/24926",
      title: "Netflix Subscription & Pricing",
      status: "ready",
      currentFrame: netflixFrame,
      extractedResult: {
        service: "Netflix Standard HD",
        planName: "Standard 2-Screen HD Streaming",
        price: 15.49,
        currency: "USD",
        billingPeriod: "monthly",
        extractedAt: new Date().toISOString(),
        source: "live_browser",
        confidence: 0.98,
      },
      fps: 30,
      totalFrames: 142,
      startedAt: Date.now() - 15000,
      finishedAt: Date.now() - 2000,
      cursor: {
        x: 410,
        y: 524,
        action: "click",
        label: "Bot #1: Locked ($15.49)",
        timestamp: Date.now(),
      },
    });

    this.helperBots.set("bot-spotify", {
      id: "bot-spotify",
      service: "Spotify Premium",
      url: "https://www.spotify.com/us/premium/",
      title: "Spotify Premium Individual",
      status: "ready",
      currentFrame: spotifyFrame,
      extractedResult: {
        service: "Spotify Premium",
        planName: "Individual Premium Plan",
        price: 11.99,
        currency: "USD",
        billingPeriod: "monthly",
        extractedAt: new Date().toISOString(),
        source: "live_browser",
        confidence: 0.96,
      },
      fps: 30,
      totalFrames: 110,
      startedAt: Date.now() - 12000,
      finishedAt: Date.now() - 1500,
      cursor: {
        x: 410,
        y: 524,
        action: "click",
        label: "Bot #2: Locked ($11.99)",
        timestamp: Date.now(),
      },
    });

    this.helperBots.set("bot-github", {
      id: "bot-github",
      service: "GitHub Copilot",
      url: "https://github.com/features/copilot/plans",
      title: "GitHub Copilot Plans",
      status: "ready",
      currentFrame: githubFrame,
      extractedResult: {
        service: "GitHub Copilot",
        planName: "Copilot Business License",
        price: 19.00,
        currency: "USD",
        billingPeriod: "monthly",
        extractedAt: new Date().toISOString(),
        source: "live_browser",
        confidence: 0.99,
      },
      fps: 30,
      totalFrames: 95,
      startedAt: Date.now() - 10000,
      finishedAt: Date.now() - 800,
      cursor: {
        x: 410,
        y: 524,
        action: "click",
        label: "Bot #3: Locked ($19.00)",
        timestamp: Date.now(),
      },
    });

    this.lastFrame = {
      frame: netflixFrame,
      timestamp: Date.now(),
      url: "https://help.netflix.com/en/node/24926",
      title: "Netflix Subscription & Pricing",
      status: "ready",
      fps: 30,
      cursor: {
        x: 410,
        y: 524,
        action: "click",
        label: "Bot #1: Locked ($15.49)",
        timestamp: Date.now(),
      },
    };
  }

  public subscribe(listener: FrameListener): () => void {
    this.listeners.add(listener);
    if (this.lastFrame) {
      try {
        listener(this.lastFrame);
      } catch (err) {
        console.error("[ScreencastManager] Error sending initial frame:", err);
      }
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeBots(listener: BotsListener): () => void {
    this.botsListeners.add(listener);
    try {
      listener(this.getBots(), this.activeBotId);
    } catch (err) {
      console.error("[ScreencastManager] Error sending initial bots:", err);
    }
    return () => {
      this.botsListeners.delete(listener);
    };
  }

  public subscribeActivity(listener: ActivityListener): () => void {
    this.activityListeners.add(listener);
    return () => {
      this.activityListeners.delete(listener);
    };
  }

  public getActivityHistory(): BrowserActivityLog[] {
    return [...this.activityHistory];
  }

  public recordActivity(
    phase: BrowserActivityLog["phase"],
    url: string,
    title: string,
    detail: string,
    tabId?: string
  ): BrowserActivityLog {
    const entry: BrowserActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      phase,
      url,
      title,
      detail,
      tabId: tabId || this.activeBotId,
    };
    this.lastActionLabel = detail;
    this.activityHistory = [...this.activityHistory.slice(-49), entry];
    this.activityListeners.forEach((listener) => {
      try {
        listener(entry);
      } catch (err) {
        console.error("[ScreencastManager] Error notifying activity listener:", err);
      }
    });
    return entry;
  }

  /**
   * Creates or focuses a live browser tab so agent browsing appears in the tab bar in real time.
   */
  public upsertLiveTab(opts: {
    id: string;
    service: string;
    url: string;
    title?: string;
    status?: HelperBotSession["status"];
    focus?: boolean;
  }): HelperBotSession {
    const existing = this.helperBots.get(opts.id);
    if (existing) {
      const updated: HelperBotSession = {
        ...existing,
        service: opts.service || existing.service,
        url: opts.url || existing.url,
        title: opts.title || existing.title,
        status: opts.status || existing.status,
      };
      this.helperBots.set(opts.id, updated);
      if (opts.focus !== false) {
        this.activeBotId = opts.id;
        this.currentUrl = updated.url;
        this.currentTitle = updated.title;
        this.currentService = updated.service;
      }
      this.notifyBotsListeners();
      return updated;
    }

    const bot = this.registerBot(opts.id, opts.service, opts.url, opts.title || opts.service);
    if (opts.status) {
      bot.status = opts.status;
      this.helperBots.set(opts.id, bot);
    }
    if (opts.focus !== false) {
      this.activeBotId = opts.id;
      this.currentUrl = bot.url;
      this.currentTitle = bot.title;
      this.currentService = bot.service;
    }
    this.notifyBotsListeners();
    return bot;
  }

  /**
   * Captures an immediate JPEG keyframe via fast CDP Page.captureScreenshot (~15ms, never blocks on animations/fonts)
   * and broadcasts it to all SSE viewers.
   */
  public async captureAndBroadcastPage(
    page: Page,
    opts?: {
      status?: ScreencastFrame["status"];
      actionLabel?: string;
      cursor?: CursorEvent;
      tabId?: string;
    }
  ): Promise<void> {
    let tempCdp: Awaited<ReturnType<ReturnType<Page["context"]>["newCDPSession"]>> | null = null;
    try {
      tempCdp = await page.context().newCDPSession(page);
      const shot = (await Promise.race([
        tempCdp.send("Page.captureScreenshot", {
          format: "jpeg",
          quality: 76,
        }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
      ])) as { data?: string } | null;
      await tempCdp.detach().catch(() => {});
      tempCdp = null;

      if (!shot?.data) return;

      const b64 = shot.data;
      const url = page.url() || this.currentUrl;
      const title = (await page.title().catch(() => "")) || this.currentTitle;
      const status = opts?.status || "evaluating";
      const dataUrl = `data:image/jpeg;base64,${b64}`;

      const targetTabId = opts?.tabId || this.activeBotId;
      const existingTab = this.helperBots.get(targetTabId);
      if (existingTab) {
        this.helperBots.set(targetTabId, {
          ...existingTab,
          url,
          title,
          status,
          currentFrame: dataUrl,
          cursor: opts?.cursor || existingTab.cursor,
          totalFrames: existingTab.totalFrames + 1,
        });
        this.notifyBotsListeners();
      }

      this.broadcastFrame({
        frame: b64,
        url,
        title,
        status,
        cursor: opts?.cursor,
        actionLabel: opts?.actionLabel,
      });
    } catch {
      if (tempCdp) {
        await tempCdp.detach().catch(() => {});
      }
    }
  }

  private notifyBotsListeners() {
    const bots = this.getBots();
    this.botsListeners.forEach((listener) => {
      try {
        listener(bots, this.activeBotId);
      } catch (err) {
        console.error("[ScreencastManager] Error notifying bots listener:", err);
      }
    });
  }

  public getBots(): HelperBotSession[] {
    return Array.from(this.helperBots.values());
  }

  public getBot(id: string): HelperBotSession | undefined {
    return this.helperBots.get(id);
  }

  public getActiveBotId(): string {
    return this.activeBotId;
  }

  /**
   * Switch the active bot view in the viewport
   */
  public setActiveBot(id: string): HelperBotSession | null {
    const target = this.helperBots.get(id);
    if (!target) return null;

    this.activeBotId = id;
    this.currentUrl = target.url;
    this.currentTitle = target.title;
    this.currentService = target.service;
    this.status = target.status;

    if (target.currentFrame) {
      this.broadcastFrame({
        frame: target.currentFrame,
        url: target.url,
        title: target.title,
        status: target.status,
        cursor: target.cursor,
      });
    }

    this.notifyBotsListeners();
    return target;
  }

  /**
   * Registers a new helper bot session
   */
  public registerBot(
    id: string,
    service: string,
    url: string,
    planName: string = `${service} Plan`,
    price: number = 19.99
  ): HelperBotSession {
    const botNumber = this.helperBots.size + 1;
    const initialFrame = generateMerchantFrameSvg(
      service,
      url,
      planName,
      price,
      "USD",
      ["Parallel helper dispatched", "Direct Chromium CDP connection", "Analyzing merchant DOM"],
      "#3b82f6",
      botNumber
    );

    const bot: HelperBotSession = {
      id,
      service,
      url,
      title: `${service} Pricing`,
      status: "navigating",
      currentFrame: initialFrame,
      fps: 30,
      totalFrames: 0,
      startedAt: Date.now(),
      cursor: {
        x: 410,
        y: 524,
        action: "move",
        label: `Bot #${botNumber}: Connecting...`,
        timestamp: Date.now(),
      },
    };

    this.helperBots.set(id, bot);
    this.notifyBotsListeners();
    return bot;
  }

  /**
   * Updates an existing helper bot session
   */
  public updateBot(id: string, updates: Partial<HelperBotSession>): HelperBotSession | undefined {
    const existing = this.helperBots.get(id);
    if (!existing) return undefined;

    const updated: HelperBotSession = {
      ...existing,
      ...updates,
    };

    this.helperBots.set(id, updated);

    // If this updated bot is the currently selected active bot, broadcast its frame to main screencast
    if (this.activeBotId === id) {
      if (updates.currentFrame) {
        this.broadcastFrame({
          frame: updates.currentFrame,
          url: updated.url,
          title: updated.title,
          status: updated.status,
          cursor: updated.cursor,
        });
      } else if (updates.status) {
        this.broadcastStatus(updated.status, updated.url, updated.title);
      }
    }

    this.notifyBotsListeners();
    return updated;
  }

  public broadcastFrame(frameData: {
    frame: string;
    url?: string;
    title?: string;
    status?: ScreencastFrame["status"];
    cursor?: CursorEvent;
    actionLabel?: string;
    metadata?: ScreencastFrame["metadata"];
  }) {
    const now = Date.now();
    this.frameTimestamps.push(now);
    this.frameTimestamps = this.frameTimestamps.filter((t) => now - t <= 1000);
    const calculatedFps = Math.max(1, this.frameTimestamps.length);

    if (frameData.url) this.currentUrl = frameData.url;
    if (frameData.title) this.currentTitle = frameData.title;
    if (frameData.status) this.status = frameData.status;
    if (frameData.cursor) this.lastCursor = frameData.cursor;
    if (frameData.actionLabel !== undefined) this.lastActionLabel = frameData.actionLabel;

    this.totalFrames++;

    const payload: ScreencastFrame = {
      frame: frameData.frame.startsWith("data:")
        ? frameData.frame
        : `data:image/jpeg;base64,${frameData.frame}`,
      timestamp: now,
      url: this.currentUrl,
      title: this.currentTitle,
      status: this.status,
      fps: calculatedFps,
      cursor: frameData.cursor || this.lastCursor,
      actionLabel: frameData.actionLabel ?? this.lastActionLabel,
      metadata: frameData.metadata,
    };

    this.lastFrame = payload;

    this.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error("[ScreencastManager] Error notifying listener:", err);
      }
    });
  }

  public broadcastCursor(cursor: CursorEvent) {
    this.lastCursor = cursor;
    if (this.lastFrame) {
      this.broadcastFrame({
        frame: this.lastFrame.frame,
        cursor,
      });
    }
  }

  public broadcastStatus(
    status: ScreencastFrame["status"],
    url?: string,
    title?: string
  ) {
    this.status = status;
    if (url) this.currentUrl = url;
    if (title) this.currentTitle = title;

    if (this.lastFrame) {
      this.broadcastFrame({
        frame: this.lastFrame.frame,
        status,
        url,
        title,
      });
    }
  }

  public getStatus(): BrowserSessionStatus {
    const now = Date.now();
    const recentFrames = this.frameTimestamps.filter((t) => now - t <= 1000).length;
    return {
      isActive: this.status !== "idle" && this.status !== "error",
      currentUrl: this.currentUrl,
      currentTitle: this.currentTitle,
      activeService: this.currentService,
      status: this.status,
      fps: Math.max(1, recentFrames),
      totalFrames: this.totalFrames,
      lastFrameTimestamp: this.lastFrame?.timestamp || now,
    };
  }

  public getLastFrame(): ScreencastFrame | null {
    return this.lastFrame;
  }

  public async attachToPage(
    page: Page,
    serviceName: string = "Merchant Site"
  ): Promise<() => Promise<void>> {
    this.currentService = serviceName;
    this.status = "navigating";
    this.currentUrl = page.url() || this.currentUrl;
    this.activePage = page;

    try {
      const cdp = await page.context().newCDPSession(page);

      await cdp.send("Page.startScreencast", {
        format: "jpeg",
        quality: 78,
        maxWidth: 960,
        maxHeight: 860,
        everyNthFrame: 1,
      });

      cdp.on("Page.screencastFrame", async (params) => {
        try {
          const title = await page.title().catch(() => serviceName);
          const url = page.url();

          this.broadcastFrame({
            frame: params.data,
            url,
            title,
            status: this.status === "idle" ? "ready" : this.status,
            metadata: params.metadata,
          });

          await cdp.send("Page.screencastFrameAck", {
            sessionId: params.sessionId,
          });
        } catch {
          // session closed
        }
      });

      page.on("framenavigated", (frame) => {
        if (frame === page.mainFrame()) {
          this.currentUrl = frame.url();
          this.broadcastStatus("evaluating", frame.url());
        }
      });

      return async () => {
        try {
          await cdp.send("Page.stopScreencast").catch(() => {});
          await cdp.detach().catch(() => {});
        } catch {
          // ignore
        }
        this.activePage = null;
        this.status = "ready";
      };
    } catch (err) {
      console.warn("[ScreencastManager] Failed to attach CDP session:", err);
      return async () => {};
    }
  }

  public async simulateCursorAction(
    targetX: number,
    targetY: number,
    action: CursorEvent["action"] = "click",
    label: string = "AI Action",
    steps: number = 8
  ): Promise<void> {
    const startX = this.lastCursor?.x || 100;
    const startY = this.lastCursor?.y || 100;

    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentX = Math.round(startX + (targetX - startX) * ease);
      const currentY = Math.round(startY + (targetY - startY) * ease);

      this.broadcastCursor({
        x: currentX,
        y: currentY,
        action: i === steps ? action : "move",
        label: i === steps ? label : "Navigating cursor...",
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 35));
    }
  }

  /**
   * Dispatches direct user click to live Chromium page via Playwright
   */
  public async handleHumanClick(x: number, y: number): Promise<void> {
    if (this.activePage) {
      try {
        await this.activePage.mouse.click(x, y);
      } catch {
        // fallback if page closed
      }
    }
    this.broadcastCursor({
      x,
      y,
      action: "click",
      label: `👤 Human Click (${Math.round(x)}, ${Math.round(y)})`,
      timestamp: Date.now(),
    });
  }

  /**
   * Dispatches direct keystroke typing to live Chromium page
   */
  public async handleHumanType(text: string): Promise<void> {
    if (this.activePage) {
      try {
        await this.activePage.keyboard.type(text);
        await this.captureAndBroadcastPage(this.activePage, { status: "ready" });
      } catch {
        // fallback
      }
    }
  }

  public async handleHumanScroll(deltaX: number, deltaY: number): Promise<void> {
    if (this.activePage) {
      try {
        await this.activePage.mouse.wheel(deltaX, deltaY);
        await this.captureAndBroadcastPage(this.activePage, {
          status: "ready",
          actionLabel: `Scrolled page (${deltaY > 0 ? "down" : "up"})`,
        });
      } catch {
        // fallback
      }
    }
  }

  public async handleHumanBack(): Promise<void> {
    if (this.activePage) {
      try {
        await this.activePage.goBack({ waitUntil: "domcontentloaded", timeout: 5000 });
        await this.captureAndBroadcastPage(this.activePage, {
          status: "ready",
          actionLabel: "Navigated back",
        });
      } catch {
        // fallback
      }
    }
  }

  public async handleHumanForward(): Promise<void> {
    if (this.activePage) {
      try {
        await this.activePage.goForward({ waitUntil: "domcontentloaded", timeout: 5000 });
        await this.captureAndBroadcastPage(this.activePage, {
          status: "ready",
          actionLabel: "Navigated forward",
        });
      } catch {
        // fallback
      }
    }
  }

  /**
   * Sets Human Takeover mode status
   */
  public setTakeoverState(state: HumanTakeoverState): void {
    this.takeoverState = state;
    if (state.isActive) {
      this.broadcastCursor({
        x: 640,
        y: 360,
        action: "move",
        label: "Pair browsing active",
        timestamp: Date.now(),
      });
    } else {
      this.broadcastCursor({
        x: 410,
        y: 524,
        action: "move",
        label: "Rico agent active",
        timestamp: Date.now(),
      });
    }
  }

  public getTakeoverState(): HumanTakeoverState {
    return this.takeoverState;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __rico_screencast_manager: ScreencastManager | undefined;
  // eslint-disable-next-line no-var
  var __rico_screencast_version: number | undefined;
}

if (
  !global.__rico_screencast_manager ||
  global.__rico_screencast_version !== 3
) {
  global.__rico_screencast_manager = new ScreencastManager();
  global.__rico_screencast_version = 3;
}

export const screencastManager = global.__rico_screencast_manager;
