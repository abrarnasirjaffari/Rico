import { randomUUID } from "node:crypto";
import { chromium, type Browser, type BrowserContext, type CDPSession, type Page } from "playwright";
import { screencastManager } from "./screencaster";
import { installPageGuards, verifyGroundedPriceInDom, type PageGuardTelemetry } from "./page-guards";
import {
  captureSemanticSnapshot,
  executeSemanticAction,
} from "./semantic-snapshot";
import { detectHelpWall, DEFAULT_WALL_PAUSE_MS } from "./wall-detector";
import { dispatchCdpKeyEvent, dispatchCdpMouseMove } from "./keyboard-cdp";
import { redactSecretsInText } from "./redaction";
import type {
  BrowserTabDiagnostics,
  GroundedPriceMatch,
  HelpTheAgentWallState,
  KeyDispatchPayload,
  LiveBrowserTabInfo,
  SemanticActionRequest,
  SemanticActionResult,
  SemanticElementNode,
  SemanticSnapshotResult,
} from "./types";

export const MAX_LIVE_TABS = 4;

interface ManagedLiveTab {
  id: string;
  page: Page;
  cdp: CDPSession | null;
  url: string;
  title: string;
  service: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  generation: number;
  nextRefCounter: { value: number };
  openedWithUrl: boolean;
  isPopup: boolean;
  createdAt: number;
  guards: PageGuardTelemetry;
  wall: HelpTheAgentWallState | null;
  lastSnapshot: SemanticSnapshotResult | null;
  screencastAttached: boolean;
  screencastListenerBound: boolean;
}

function shortHostLabel(url: string, fallback: string = "New Tab"): string {
  if (!url || url === "about:blank") return fallback;
  try {
    return new URL(url).hostname.replace(/^www\./, "") || fallback;
  } catch {
    return fallback;
  }
}

export class BrowserTabPool {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private tabs: Map<string, ManagedLiveTab> = new Map();
  private focusedTabId: string | null = null;
  private programmaticOpenDepth = 0;

  private async ensureContext(): Promise<BrowserContext> {
    if (this.context && this.browser && this.browser.isConnected()) {
      return this.context;
    }

    const launchOptions = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    };

    try {
      this.browser = await chromium.launch({ ...launchOptions, channel: "chrome" });
    } catch {
      try {
        this.browser = await chromium.launch({ ...launchOptions, channel: "msedge" });
      } catch {
        this.browser = await chromium.launch(launchOptions);
      }
    }

    this.context = await this.browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      viewport: { width: 960, height: 860 },
      deviceScaleFactor: 1,
      locale: "en-US",
      timezoneId: "America/New_York",
    });

    // Capture page-triggered popups (window.open / target="_blank") into the 4-tab pool
    this.context.on("page", (popupPage) => {
      if (this.programmaticOpenDepth > 0) return;
      void this.registerCapturedPopup(popupPage);
    });

    return this.context;
  }

  private async evictOldestIfFull(): Promise<void> {
    while (this.tabs.size >= MAX_LIVE_TABS) {
      let victim: ManagedLiveTab | null = null;
      const allTabs = Array.from(this.tabs.values());
      for (const candidate of allTabs) {
        if (candidate.id !== this.focusedTabId) {
          if (!victim || candidate.createdAt < victim.createdAt) {
            victim = candidate;
          }
        }
      }
      if (!victim) {
        victim = allTabs[0] || null;
      }
      if (!victim) break;
      await this.closeTab(victim.id);
    }
  }

  private async setupManagedTab(
    page: Page,
    opts: {
      id?: string;
      service?: string;
      initialUrl?: string;
      isPopup?: boolean;
      focus?: boolean;
    }
  ): Promise<ManagedLiveTab> {
    const id = opts.id || `tab_${randomUUID()}`;
    let cdp: CDPSession | null = null;
    try {
      cdp = await page.context().newCDPSession(page);
    } catch {
      cdp = null;
    }

    const guards = await installPageGuards(page, cdp, 50);
    const initialUrl = opts.initialUrl || page.url() || "about:blank";
    const serviceLabel = opts.service || shortHostLabel(initialUrl, opts.isPopup ? "Popup Tab" : "New Tab");

    const managed: ManagedLiveTab = {
      id,
      page,
      cdp,
      url: initialUrl,
      title: serviceLabel,
      service: serviceLabel,
      loading: false,
      canGoBack: false,
      canGoForward: false,
      generation: 1,
      nextRefCounter: { value: 1 },
      openedWithUrl: Boolean(opts.initialUrl),
      isPopup: Boolean(opts.isPopup),
      createdAt: Date.now(),
      guards,
      wall: null,
      lastSnapshot: null,
      screencastAttached: false,
      screencastListenerBound: false,
    };

    this.tabs.set(id, managed);

    // Track main-frame navigations: bump generation monotonically and refresh CDP history
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        const nextUrl = frame.url();
        if (nextUrl !== "about:blank" || managed.url !== "about:blank") {
          managed.generation += 1;
        }
        managed.url = redactSecretsInText(nextUrl);
        managed.loading = true;
        void this.syncTabMetadata(managed);
      }
    });

    page.on("load", () => {
      managed.loading = false;
      void this.syncTabMetadata(managed, true);
    });

    page.on("close", () => {
      if (this.tabs.has(id)) {
        this.tabs.delete(id);
        screencastManager.removeBot(id);
        if (this.focusedTabId === id) {
          const remaining = Array.from(this.tabs.keys());
          this.focusedTabId = remaining[remaining.length - 1] || null;
          if (this.focusedTabId) {
            void this.focusTab(this.focusedTabId);
          }
        }
      }
    });

    // Register in ScreencastManager tab bar
    screencastManager.upsertLiveTab({
      id,
      service: managed.service,
      url: managed.url,
      title: managed.title,
      status: "ready",
      focus: opts.focus !== false,
      isLivePoolTab: true,
      isPopup: managed.isPopup,
      generation: managed.generation,
      canGoBack: managed.canGoBack,
      canGoForward: managed.canGoForward,
    });

    if (opts.focus !== false || !this.focusedTabId) {
      await this.attachLiveScreencastToTab(managed);
      this.focusedTabId = id;
    }

    return managed;
  }

  private async registerCapturedPopup(popupPage: Page): Promise<void> {
    try {
      await this.evictOldestIfFull();
      await popupPage.waitForLoadState("domcontentloaded", { timeout: 4000 }).catch(() => {});
      const popupUrl = popupPage.url() || "about:blank";
      const popupTitle = (await popupPage.title().catch(() => "")) || shortHostLabel(popupUrl, "Popup");
      const tab = await this.setupManagedTab(popupPage, {
        service: popupTitle.slice(0, 28),
        initialUrl: popupUrl !== "about:blank" ? popupUrl : undefined,
        isPopup: true,
        focus: true,
      });
      await this.syncTabMetadata(tab, true);
      screencastManager.recordActivity(
        "navigate",
        tab.url,
        tab.title,
        `Captured popup tab: ${tab.title}`,
        tab.id
      );
    } catch {
      // Ignore popup closed immediately
    }
  }

  private async attachLiveScreencastToTab(target: ManagedLiveTab): Promise<void> {
    // Pause screencast on previously focused tab to conserve CPU
    for (const tab of Array.from(this.tabs.values())) {
      if (tab.id !== target.id && tab.screencastAttached && tab.cdp) {
        await tab.cdp.send("Page.stopScreencast").catch(() => {});
        tab.screencastAttached = false;
      }
    }

    screencastManager.setActivePageRef(target.page, target.id);

    if (!target.cdp || process.env.NODE_ENV === "test") {
      return;
    }

    if (!target.screencastAttached) {
      if (!target.screencastListenerBound) {
        target.screencastListenerBound = true;
        target.cdp.on("Page.screencastFrame", async (params) => {
          try {
            if (this.focusedTabId === target.id) {
              const title = (await target.page.title().catch(() => "")) || target.title;
              const url = redactSecretsInText(target.page.url() || target.url);
              target.url = url;
              target.title = title;
              screencastManager.broadcastFrame({
                frame: params.data,
                url,
                title,
                status: target.loading ? "navigating" : "ready",
                metadata: params.metadata,
              });
            }
            await target.cdp?.send("Page.screencastFrameAck", {
              sessionId: params.sessionId,
            });
          } catch {
            // Detached
          }
        });
      }

      await target.cdp
        .send("Page.startScreencast", {
          format: "jpeg",
          quality: 78,
          maxWidth: 960,
          maxHeight: 860,
          everyNthFrame: 1,
        })
        .catch(() => {});
      target.screencastAttached = true;
    }
  }

  public async refreshNavigationHistory(tab: ManagedLiveTab): Promise<{
    canGoBack: boolean;
    canGoForward: boolean;
  }> {
    if (!tab.cdp) {
      return { canGoBack: tab.canGoBack, canGoForward: tab.canGoForward };
    }
    try {
      const hist = (await tab.cdp.send("Page.getNavigationHistory")) as {
        currentIndex: number;
        entries: Array<{ id: number; url: string; title: string }>;
      };
      const minIndex =
        tab.openedWithUrl &&
        hist.entries.length > 1 &&
        hist.entries[0]?.url === "about:blank"
          ? 1
          : 0;
      tab.canGoBack = hist.currentIndex > minIndex;
      tab.canGoForward = hist.currentIndex < hist.entries.length - 1;
    } catch {
      // Ignore detached CDP
    }
    return { canGoBack: tab.canGoBack, canGoForward: tab.canGoForward };
  }

  private async syncTabMetadata(
    tab: ManagedLiveTab,
    captureKeyframe: boolean = false
  ): Promise<void> {
    try {
      const url = redactSecretsInText(tab.page.url() || tab.url);
      const rawTitle = await tab.page.title().catch(() => "");
      const title = rawTitle || tab.title || shortHostLabel(url, tab.service);
      tab.url = url;
      tab.title = title;
      if (url && url !== "about:blank") {
        tab.service = shortHostLabel(url, tab.service);
      }

      await this.refreshNavigationHistory(tab);

      // Refresh Help-the-Agent wall state unless user already skipped/continued on this exact URL
      const detectedWall = await detectHelpWall(tab.page, tab.id);
      if (detectedWall) {
        if (
          tab.wall &&
          tab.wall.url === detectedWall.url &&
          (tab.wall.resolution === "continued" || tab.wall.resolution === "skipped")
        ) {
          // Keep user's explicit resolution for this URL
        } else if (
          tab.wall &&
          tab.wall.detected &&
          tab.wall.kind === detectedWall.kind &&
          tab.wall.expiresAt > detectedWall.expiresAt
        ) {
          // Preserve +90s extended timer
          tab.wall = { ...detectedWall, expiresAt: tab.wall.expiresAt };
        } else {
          tab.wall = detectedWall;
        }
      } else {
        tab.wall = null;
      }

      screencastManager.updateBot(tab.id, {
        service: tab.service,
        url: tab.url,
        title: tab.title,
        status: tab.loading ? "navigating" : "ready",
        canGoBack: tab.canGoBack,
        canGoForward: tab.canGoForward,
        generation: tab.generation,
        isPopup: tab.isPopup,
        isLivePoolTab: true,
        blockedTrackers: tab.guards.getBlockedTrackersCount(),
        wall: tab.wall,
      });

      if (this.focusedTabId === tab.id) {
        screencastManager.setNavigationCapabilities({
          canGoBack: tab.canGoBack,
          canGoForward: tab.canGoForward,
          generation: tab.generation,
          wall: tab.wall,
        });
        if (captureKeyframe && process.env.NODE_ENV !== "test") {
          await screencastManager.captureAndBroadcastPage(tab.page, {
            status: tab.loading ? "navigating" : "ready",
            tabId: tab.id,
          });
        }
      }
    } catch {
      // Ignore closed page
    }
  }

  private toTabInfo(tab: ManagedLiveTab): LiveBrowserTabInfo {
    return {
      id: tab.id,
      url: tab.url,
      title: tab.title,
      service: tab.service,
      loading: tab.loading,
      canGoBack: tab.canGoBack,
      canGoForward: tab.canGoForward,
      generation: tab.generation,
      isPopup: tab.isPopup || undefined,
      wall: tab.wall,
      blockedTrackersCount: tab.guards.getBlockedTrackersCount(),
      interceptedDialogsCount: tab.guards.getInterceptedDialogsCount(),
    };
  }

  public listTabs(): {
    tabs: LiveBrowserTabInfo[];
    focusedTabId: string | null;
    maxTabs: number;
  } {
    return {
      tabs: Array.from(this.tabs.values()).map((t) => this.toTabInfo(t)),
      focusedTabId: this.focusedTabId,
      maxTabs: MAX_LIVE_TABS,
    };
  }

  public getFocusedTabId(): string | null {
    return this.focusedTabId;
  }

  public hasTab(tabId: string): boolean {
    return this.tabs.has(tabId);
  }

  public getPage(tabId?: string): Page | null {
    const id = tabId || this.focusedTabId;
    if (!id) return null;
    return this.tabs.get(id)?.page || null;
  }

  public async openTab(opts?: {
    url?: string;
    title?: string;
    service?: string;
    focus?: boolean;
    timeoutMs?: number;
  }): Promise<LiveBrowserTabInfo> {
    const context = await this.ensureContext();
    await this.evictOldestIfFull();

    this.programmaticOpenDepth++;
    let page: Page;
    try {
      page = await context.newPage();
    } finally {
      this.programmaticOpenDepth--;
    }

    const rawUrl = opts?.url?.trim();
    const normalizedUrl =
      rawUrl && rawUrl !== "about:blank"
        ? /^https?:\/\//i.test(rawUrl) || rawUrl.startsWith("data:")
          ? rawUrl
          : `https://${rawUrl}`
        : undefined;

    const tab = await this.setupManagedTab(page, {
      service: opts?.service || opts?.title || shortHostLabel(normalizedUrl || "", "New Tab"),
      initialUrl: normalizedUrl,
      focus: opts?.focus !== false,
    });

    if (normalizedUrl) {
      tab.loading = true;
      await page
        .goto(normalizedUrl, {
          waitUntil: "domcontentloaded",
          timeout: opts?.timeoutMs ?? 10000,
        })
        .catch(() => {});
      tab.loading = false;
      // Reset initial generation to 1 on initial tab load so first snapshot starts cleanly at gen=1
      tab.generation = 1;
      tab.nextRefCounter.value = 1;
      await this.syncTabMetadata(tab, true);
    }

    return this.toTabInfo(tab);
  }

  /**
   * Sets HTML content on a managed tab (useful for deterministic semantic/pair-browsing tests)
   * and advances generation if already loaded.
   */
  public async setTabHtml(
    tabId: string,
    html: string,
    opts?: { bumpGeneration?: boolean }
  ): Promise<LiveBrowserTabInfo> {
    const tab = this.tabs.get(tabId);
    if (!tab) throw new Error(`Tab ${tabId} not found`);
    const prevGen = tab.generation;
    await tab.page.setContent(html, { waitUntil: "domcontentloaded" });
    if (opts?.bumpGeneration && tab.generation === prevGen) {
      tab.generation = prevGen + 1;
    }
    await this.syncTabMetadata(tab, false);
    return this.toTabInfo(tab);
  }

  public async navigateTab(
    tabId: string | undefined,
    url: string,
    timeoutMs: number = 10000
  ): Promise<LiveBrowserTabInfo> {
    const tab = tabId ? this.tabs.get(tabId) : this.focusedTabId ? this.tabs.get(this.focusedTabId) : undefined;
    if (!tab) {
      return await this.openTab({ url, focus: true, timeoutMs });
    }
    const prevGen = tab.generation;
    tab.loading = true;
    const normalized =
      /^https?:\/\//i.test(url) || url.startsWith("data:") || url === "about:blank"
        ? url
        : `https://${url}`;
    await tab.page
      .goto(normalized, { waitUntil: "domcontentloaded", timeout: timeoutMs })
      .catch(() => {});
    tab.loading = false;
    if (tab.generation <= prevGen) {
      tab.generation = prevGen + 1;
    }
    await this.syncTabMetadata(tab, true);
    return this.toTabInfo(tab);
  }

  public async focusTab(tabId: string): Promise<LiveBrowserTabInfo | null> {
    const tab = this.tabs.get(tabId);
    if (!tab) return null;
    this.focusedTabId = tabId;
    await this.attachLiveScreencastToTab(tab);
    screencastManager.setActiveBot(tabId);
    await this.syncTabMetadata(tab, true);
    return this.toTabInfo(tab);
  }

  public async closeTab(tabId: string): Promise<{ closed: boolean; focusedTabId: string | null }> {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      return { closed: false, focusedTabId: this.focusedTabId };
    }
    this.tabs.delete(tabId);
    screencastManager.removeBot(tabId);

    if (tab.cdp) {
      await tab.cdp.send("Page.stopScreencast").catch(() => {});
      await tab.cdp.detach().catch(() => {});
      tab.cdp = null;
    }
    await tab.page.close().catch(() => {});

    if (this.focusedTabId === tabId) {
      const remaining = Array.from(this.tabs.keys());
      const nextFocus = remaining[remaining.length - 1] || null;
      this.focusedTabId = nextFocus;
      if (nextFocus) {
        await this.focusTab(nextFocus);
      } else {
        screencastManager.setActivePageRef(null, null);
      }
    }

    return { closed: true, focusedTabId: this.focusedTabId };
  }

  public async goBack(tabId?: string): Promise<LiveBrowserTabInfo | null> {
    const tab = this.resolveTargetTab(tabId);
    if (!tab) return null;

    await this.refreshNavigationHistory(tab);
    if (tab.canGoBack) {
      await tab.page
        .goBack({ waitUntil: "domcontentloaded", timeout: 5000 })
        .catch(() => {});
    }

    await this.syncTabMetadata(tab, true);
    return this.toTabInfo(tab);
  }

  public async goForward(tabId?: string): Promise<LiveBrowserTabInfo | null> {
    const tab = this.resolveTargetTab(tabId);
    if (!tab) return null;

    await this.refreshNavigationHistory(tab);
    if (tab.canGoForward) {
      await tab.page
        .goForward({ waitUntil: "domcontentloaded", timeout: 5000 })
        .catch(() => {});
    }

    await this.syncTabMetadata(tab, true);
    return this.toTabInfo(tab);
  }

  private resolveTargetTab(tabId?: string): ManagedLiveTab | null {
    if (tabId && this.tabs.has(tabId)) {
      return this.tabs.get(tabId)!;
    }
    if (this.focusedTabId && this.tabs.has(this.focusedTabId)) {
      return this.tabs.get(this.focusedTabId)!;
    }
    const first = Array.from(this.tabs.values())[0];
    return first || null;
  }

  /**
   * Ensures at least one live tab exists in the pool (opening the current screencast URL if empty).
   */
  public async ensureActiveTab(fallbackUrl?: string): Promise<ManagedLiveTab> {
    const existing = this.resolveTargetTab();
    if (existing) return existing;
    const statusUrl = fallbackUrl || screencastManager.getStatus().currentUrl || "https://example.com";
    const info = await this.openTab({ url: statusUrl, focus: true });
    return this.tabs.get(info.id)!;
  }

  public async snapshot(tabId?: string): Promise<SemanticSnapshotResult> {
    let tab = this.resolveTargetTab(tabId);
    if (!tab) {
      tab = await this.ensureActiveTab();
    }
    const snap = await captureSemanticSnapshot(tab.page, {
      tabId: tab.id,
      generation: tab.generation,
      nextRefCounter: tab.nextRefCounter,
    });
    tab.lastSnapshot = snap;
    if (snap.wall) {
      tab.wall =
        tab.wall && tab.wall.expiresAt > snap.wall.expiresAt
          ? { ...snap.wall, expiresAt: tab.wall.expiresAt }
          : snap.wall;
    }
    await this.syncTabMetadata(tab, false);
    return snap;
  }

  public getLastSnapshot(tabId?: string): SemanticSnapshotResult | null {
    const tab = this.resolveTargetTab(tabId);
    return tab?.lastSnapshot || null;
  }

  public async act(req: SemanticActionRequest): Promise<SemanticActionResult> {
    let tab = this.resolveTargetTab(req.tabId);
    if (!tab) {
      tab = await this.ensureActiveTab();
    }

    const result = await executeSemanticAction(tab.page, req, {
      tabId: tab.id,
      getGeneration: () => tab!.generation,
      nextRefCounter: tab.nextRefCounter,
      onCursorMove:
        process.env.NODE_ENV === "test"
          ? undefined
          : async (x, y, action, label) => {
              await screencastManager.simulateCursorAction(x, y, action, label, 4);
            },
    });

    await this.syncTabMetadata(tab, true);
    screencastManager.recordActivity(
      req.action === "snapshot" ? "snapshot" : "act",
      result.url,
      result.title || tab.title,
      result.summary,
      tab.id
    );

    return {
      ...result,
      generation: tab.generation,
      wall: tab.wall,
    };
  }

  public async dispatchKeyEvent(
    payload: KeyDispatchPayload,
    tabId?: string
  ): Promise<void> {
    const tab = this.resolveTargetTab(tabId);
    if (!tab) return;
    await dispatchCdpKeyEvent(tab.page, tab.cdp, payload);
    if (payload.eventType === "keyUp" || payload.key === "Enter") {
      await this.syncTabMetadata(tab, true);
    }
  }

  public async dispatchMouseMove(
    x: number,
    y: number,
    modifiers: number = 0,
    tabId?: string
  ): Promise<SemanticElementNode | null> {
    const tab = this.resolveTargetTab(tabId);
    if (!tab) return null;
    await dispatchCdpMouseMove(tab.page, tab.cdp, x, y, modifiers);

    if (tab.lastSnapshot && tab.lastSnapshot.generation === tab.generation) {
      // Find smallest matching element box containing (x, y)
      const hits = tab.lastSnapshot.elements.filter(
        (el) =>
          x >= el.rect.x &&
          x <= el.rect.x + el.rect.width &&
          y >= el.rect.y &&
          y <= el.rect.y + el.rect.height
      );
      if (hits.length > 0) {
        hits.sort((a, b) => a.rect.width * a.rect.height - b.rect.width * b.rect.height);
        return hits[0];
      }
    }
    return null;
  }

  public async resolveWall(
    decision: "continue" | "skip" | "extend_90s",
    tabId?: string
  ): Promise<HelpTheAgentWallState | null> {
    const tab = this.resolveTargetTab(tabId);
    if (!tab) return null;

    if (decision === "extend_90s") {
      const now = Date.now();
      const currentExpiry = tab.wall?.expiresAt && tab.wall.expiresAt > now ? tab.wall.expiresAt : now;
      tab.wall = tab.wall
        ? {
            ...tab.wall,
            detected: true,
            expiresAt: currentExpiry + DEFAULT_WALL_PAUSE_MS,
            resolution: "pending",
          }
        : {
            detected: true,
            kind: "LOGIN_WALL",
            title: "Pair browsing pause extended",
            message: "Added +90s for manual login or verification.",
            tabId: tab.id,
            url: tab.url,
            detectedAt: now,
            expiresAt: now + DEFAULT_WALL_PAUSE_MS,
            resolution: "pending",
          };
    } else if (decision === "continue") {
      if (tab.wall) {
        tab.wall = {
          ...tab.wall,
          detected: false,
          resolution: "continued",
        };
      }
      screencastManager.setTakeoverState({ isActive: false, isSolved: true });
    } else if (decision === "skip") {
      if (tab.wall) {
        tab.wall = {
          ...tab.wall,
          detected: false,
          resolution: "skipped",
        };
      }
      screencastManager.setTakeoverState({ isActive: false });
    }

    screencastManager.updateBot(tab.id, { wall: tab.wall });
    if (this.focusedTabId === tab.id) {
      screencastManager.setNavigationCapabilities({
        canGoBack: tab.canGoBack,
        canGoForward: tab.canGoForward,
        generation: tab.generation,
        wall: tab.wall,
      });
    }

    return tab.wall;
  }

  public async verifyGroundedPrice(
    candidatePrice: number,
    currency: string = "USD",
    billingPeriod: string = "monthly",
    tabId?: string
  ): Promise<GroundedPriceMatch> {
    const tab = this.resolveTargetTab(tabId);
    if (!tab) {
      return {
        grounded: false,
        price: candidatePrice,
        currency,
        billingPeriod,
        matchedSubstring: null,
        contextSnippet: null,
      };
    }
    return await verifyGroundedPriceInDom(tab.page, candidatePrice, currency, billingPeriod);
  }

  public getDiagnostics(tabId?: string): BrowserTabDiagnostics | null {
    const tab = this.resolveTargetTab(tabId);
    if (!tab) return null;
    return {
      tabId: tab.id,
      url: tab.url,
      title: tab.title,
      generation: tab.generation,
      canGoBack: tab.canGoBack,
      canGoForward: tab.canGoForward,
      blockedTrackersCount: tab.guards.getBlockedTrackersCount(),
      interceptedDialogsCount: tab.guards.getInterceptedDialogsCount(),
      console: tab.guards.consoleBuffer.toArray(),
      network: tab.guards.networkBuffer.toArray(),
      dialogs: tab.guards.dialogBuffer.toArray(),
      wall: tab.wall,
    };
  }

  public async closeAll(): Promise<void> {
    for (const id of Array.from(this.tabs.keys())) {
      await this.closeTab(id);
    }
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __rico_browser_tab_pool: BrowserTabPool | undefined;
}

if (!global.__rico_browser_tab_pool) {
  global.__rico_browser_tab_pool = new BrowserTabPool();
}

export const browserTabPool = global.__rico_browser_tab_pool;
