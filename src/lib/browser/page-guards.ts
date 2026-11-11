import type { CDPSession, Page } from "playwright";
import { extractPriceFromText } from "./price-extractor";
import { redactSecretsInText } from "./redaction";
import type {
  BrowserConsoleEntry,
  BrowserDialogEntry,
  BrowserNetworkEntry,
  GroundedPriceMatch,
} from "./types";

/**
 * Fixed-capacity FIFO ring buffer for per-tab console, network, and dialog telemetry.
 */
export class RingBuffer<T> {
  private readonly items: T[] = [];
  public readonly capacity: number;

  constructor(capacity: number = 50) {
    this.capacity = Math.max(1, capacity);
  }

  public push(item: T): void {
    if (this.items.length >= this.capacity) {
      this.items.shift();
    }
    this.items.push(item);
  }

  public toArray(): T[] {
    return [...this.items];
  }

  public clear(): void {
    this.items.length = 0;
  }

  public get size(): number {
    return this.items.length;
  }
}

const TRACKER_HOST_PATTERNS: RegExp[] = [
  /(^|\.)doubleclick\.net$/i,
  /(^|\.)googlesyndication\.com$/i,
  /(^|\.)google-analytics\.com$/i,
  /(^|\.)googletagmanager\.com$/i,
  /(^|\.)googleadservices\.com$/i,
  /(^|\.)connect\.facebook\.net$/i,
  /(^|\.)hotjar\.com$/i,
  /(^|\.)clarity\.ms$/i,
  /(^|\.)onetrust\.com$/i,
  /(^|\.)cookielaw\.org$/i,
  /(^|\.)cookiebot\.com$/i,
  /(^|\.)quantserve\.com$/i,
  /(^|\.)scorecardresearch\.com$/i,
  /(^|\.)taboola\.com$/i,
  /(^|\.)outbrain\.com$/i,
  /(^|\.)criteo\.com$/i,
  /(^|\.)adnxs\.com$/i,
  /(^|\.)ads-twitter\.com$/i,
  /(^|\.)tiktok\.com\/i18n\/pixel/i,
];

const TRACKER_PATH_PATTERNS: RegExp[] = [
  /\/collect\?.*tid=UA-/i,
  /\/gtm\.js/i,
  /\/fbevents\.js/i,
  /\/analytics\.min\.js/i,
  /\/cookie-?consent/i,
];

export function isBlockedTrackerUrl(rawUrl: string): boolean {
  if (!rawUrl || !rawUrl.startsWith("http")) return false;
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    if (TRACKER_HOST_PATTERNS.some((re) => re.test(host))) {
      return true;
    }
    return TRACKER_PATH_PATTERNS.some((re) => re.test(parsed.pathname + parsed.search));
  } catch {
    return false;
  }
}

export const COSMETIC_COOKIE_BLOCKER_CSS = `
  #onetrust-consent-sdk,
  #onetrust-banner-sdk,
  .onetrust-pc-dark-filter,
  #CybotCookiebotDialog,
  #CybotCookiebotDialogBodyUnderlay,
  #usercentrics-root,
  .cc-window,
  .cc-banner,
  .qc-cmp2-container,
  #didomi-host,
  #truste-consent-track,
  [id*="cookie-banner" i],
  [id*="cookie_banner" i],
  [id*="cookie-consent" i],
  [class*="cookie-banner" i],
  [class*="cookie-consent" i],
  [class*="gdpr-banner" i],
  [aria-label*="cookie" i][role="dialog"],
  [aria-label*="consent" i][role="dialog"] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }
`;

export interface PageGuardTelemetry {
  consoleBuffer: RingBuffer<BrowserConsoleEntry>;
  networkBuffer: RingBuffer<BrowserNetworkEntry>;
  dialogBuffer: RingBuffer<BrowserDialogEntry>;
  getBlockedTrackersCount: () => number;
  getInterceptedDialogsCount: () => number;
}

/**
 * Installs Adblock/Cosmetic Cookie Blocker, DialogGate, and Live Console/Network Ring Buffers on a Page.
 */
export async function installPageGuards(
  page: Page,
  cdp?: CDPSession | null,
  capacity: number = 50
): Promise<PageGuardTelemetry> {
  const consoleBuffer = new RingBuffer<BrowserConsoleEntry>(capacity);
  const networkBuffer = new RingBuffer<BrowserNetworkEntry>(capacity);
  const dialogBuffer = new RingBuffer<BrowserDialogEntry>(capacity);
  let blockedTrackersCount = 0;
  let interceptedDialogsCount = 0;
  let recentDialogSig = "";
  let recentDialogAt = 0;

  const recordDialog = (type: string, message: string, defaultPrompt?: string) => {
    const now = Date.now();
    const sig = `${type}:${message}`;
    if (sig === recentDialogSig && now - recentDialogAt < 150) {
      return;
    }
    recentDialogSig = sig;
    recentDialogAt = now;
    interceptedDialogsCount++;
    dialogBuffer.push({
      id: `dlg-${now}-${interceptedDialogsCount}`,
      type,
      message: redactSecretsInText(message).slice(0, 240),
      defaultPrompt: defaultPrompt ? redactSecretsInText(defaultPrompt).slice(0, 120) : undefined,
      url: redactSecretsInText(page.url() || ""),
      handledAction: "dismiss",
      timestamp: now,
    });
  };

  // 1. DialogGate: Playwright native dialog auto-dismiss (prevents JS alert/confirm/prompt/beforeunload hangs)
  page.on("dialog", async (dialog) => {
    recordDialog(dialog.type(), dialog.message(), dialog.defaultValue());
    try {
      await dialog.dismiss();
    } catch {
      // Already handled by CDP DialogGate
    }
  });

  // Also attach CDP Page.javascriptDialogOpening gate when a CDP session is present
  if (cdp) {
    try {
      await cdp.send("Page.enable");
      cdp.on("Page.javascriptDialogOpening", async (params) => {
        recordDialog(params.type, params.message, params.defaultPrompt);
        try {
          await cdp.send("Page.handleJavaScriptDialog", { accept: false });
        } catch {
          // Playwright dialog handler may have already dismissed it
        }
      });
    } catch {
      // Ignore if CDP session detached
    }
  }

  // 2. Cosmetic Cookie-Banner & Overlay Cleaner (runs on future navigations + current document)
  const cosmeticInitScript = `
    (function() {
      var cssText = ${JSON.stringify(COSMETIC_COOKIE_BLOCKER_CSS)};
      function applyCosmeticShield() {
        try {
          if (!document.getElementById("__rico_cosmetic_adblock")) {
            var style = document.createElement("style");
            style.id = "__rico_cosmetic_adblock";
            style.textContent = cssText;
            (document.head || document.documentElement).appendChild(style);
          }
          if (document.body) {
            var bodyOverflow = window.getComputedStyle(document.body).overflow;
            var hasHiddenConsent = Boolean(
              document.querySelector(
                "#onetrust-consent-sdk, #CybotCookiebotDialog, [id*='cookie-banner' i], [class*='cookie-consent' i]"
              )
            );
            if (hasHiddenConsent && bodyOverflow === "hidden") {
              document.body.style.setProperty("overflow", "auto", "important");
              document.documentElement.style.setProperty("overflow", "auto", "important");
            }
          }
        } catch (e) {}
      }
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyCosmeticShield, { once: true });
      } else {
        applyCosmeticShield();
      }
    })();
  `;

  await page.addInitScript({ content: cosmeticInitScript }).catch(() => {});
  await page.evaluate(cosmeticInitScript).catch(() => {});
  page.on("domcontentloaded", () => {
    void page.evaluate(cosmeticInitScript).catch(() => {});
  });

  // 3. Network Tracker & Heavy Media Blocker + Network Ring Buffer
  const requestStartMap = new WeakMap<object, number>();
  page.on("request", (req) => {
    requestStartMap.set(req, Date.now());
  });

  await page.route("**/*", async (route) => {
    const req = route.request();
    const url = req.url();
    const resourceType = req.resourceType();

    if (resourceType === "media") {
      networkBuffer.push({
        id: `net-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        method: req.method(),
        url: redactSecretsInText(url),
        resourceType,
        status: null,
        blocked: true,
        blockReason: "media_stream",
        timestamp: Date.now(),
      });
      await route.abort().catch(() => {});
      return;
    }

    if (isBlockedTrackerUrl(url)) {
      blockedTrackersCount++;
      networkBuffer.push({
        id: `net-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        method: req.method(),
        url: redactSecretsInText(url),
        resourceType,
        status: null,
        blocked: true,
        blockReason: "tracker_adblock",
        timestamp: Date.now(),
      });
      await route.abort().catch(() => {});
      return;
    }

    await route.continue().catch(() => {});
  });

  page.on("requestfinished", async (req) => {
    try {
      const res = await req.response();
      const started = requestStartMap.get(req);
      networkBuffer.push({
        id: `net-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        method: req.method(),
        url: redactSecretsInText(req.url()),
        resourceType: req.resourceType(),
        status: res ? res.status() : 200,
        blocked: false,
        durationMs: started ? Math.max(0, Date.now() - started) : undefined,
        timestamp: Date.now(),
      });
    } catch {
      // Ignore closed request
    }
  });

  page.on("requestfailed", (req) => {
    const url = req.url();
    if (isBlockedTrackerUrl(url) || req.resourceType() === "media") {
      return; // Already recorded as blocked
    }
    const started = requestStartMap.get(req);
    networkBuffer.push({
      id: `net-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      method: req.method(),
      url: redactSecretsInText(url),
      resourceType: req.resourceType(),
      status: 0,
      blocked: false,
      durationMs: started ? Math.max(0, Date.now() - started) : undefined,
      timestamp: Date.now(),
    });
  });

  // 4. Console & PageError Ring Buffer (with secret redaction)
  page.on("console", (msg) => {
    const rawType = msg.type();
    const level: BrowserConsoleEntry["level"] =
      rawType === "error"
        ? "error"
        : rawType === "warning"
        ? "warn"
        : rawType === "info"
        ? "info"
        : "log";

    consoleBuffer.push({
      id: `con-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      level,
      text: redactSecretsInText(msg.text()).slice(0, 400),
      url: redactSecretsInText(page.url() || ""),
      timestamp: Date.now(),
    });
  });

  page.on("pageerror", (err) => {
    consoleBuffer.push({
      id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      level: "pageerror",
      text: redactSecretsInText(err.message || String(err)).slice(0, 400),
      url: redactSecretsInText(page.url() || ""),
      timestamp: Date.now(),
    });
  });

  return {
    consoleBuffer,
    networkBuffer,
    dialogBuffer,
    getBlockedTrackersCount: () => blockedTrackersCount,
    getInterceptedDialogsCount: () => interceptedDialogsCount,
  };
}

/**
 * Verifies that a numeric price actually exists as a visible DOM substring on the live rendered page.
 * Prevents hallucinated or hidden/display:none prices from passing verification.
 */
export async function verifyGroundedPriceInDom(
  page: Page,
  candidatePrice: number,
  currency: string = "USD",
  billingPeriod: string = "monthly"
): Promise<GroundedPriceMatch> {
  if (!Number.isFinite(candidatePrice) || candidatePrice <= 0) {
    return {
      grounded: false,
      price: candidatePrice,
      currency,
      billingPeriod,
      matchedSubstring: null,
      contextSnippet: null,
    };
  }

  const fixedTwo = candidatePrice.toFixed(2);
  const isWhole = Math.abs(candidatePrice - Math.round(candidatePrice)) < 0.001;
  const wholeStr = String(Math.round(candidatePrice));

  const candidateTokens = isWhole
    ? [`$${fixedTwo}`, `$${wholeStr}`, `${fixedTwo} ${currency}`, fixedTwo]
    : [`$${fixedTwo}`, fixedTwo, fixedTwo.replace(".", ",")];

  const match = await page
    .evaluate((tokens: string[]) => {
      const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_ELEMENT);
      let node: Element | null = walker.currentNode as Element | null;

      while (node) {
        const el = node as HTMLElement;
        const tag = el.tagName?.toLowerCase() || "";
        if (tag !== "script" && tag !== "style" && tag !== "noscript" && tag !== "template") {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const isVisible =
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            parseFloat(style.opacity || "1") > 0 &&
            rect.width > 0 &&
            rect.height > 0;

          if (isVisible && el.children.length <= 4) {
            const text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
            if (text.length > 0 && text.length <= 260) {
              for (const tok of tokens) {
                if (text.includes(tok)) {
                  // For bare whole-number fallback, require a currency symbol or word nearby
                  if (!tok.includes("$") && !tok.includes(".") && !/(\$|€|£|USD|EUR|GBP|\/mo|month|year)/i.test(text)) {
                    continue;
                  }
                  const ricoRef = el.getAttribute("data-rico-ref");
                  return {
                    matchedSubstring: tok,
                    contextSnippet: text.slice(0, 160),
                    tagName: tag,
                    ref: ricoRef ? `@${ricoRef}` : undefined,
                  };
                }
              }
            }
          }
        }
        node = walker.nextNode() as Element | null;
      }
      return null;
    }, candidateTokens)
    .catch(() => null);

  if (!match) {
    return {
      grounded: false,
      price: candidatePrice,
      currency,
      billingPeriod,
      matchedSubstring: null,
      contextSnippet: null,
    };
  }

  return {
    grounded: true,
    price: candidatePrice,
    currency,
    billingPeriod,
    matchedSubstring: match.matchedSubstring,
    contextSnippet: match.contextSnippet,
    tagName: match.tagName,
    ref: match.ref,
  };
}

/**
 * Extracts up to `limit` visible, DOM-grounded prices currently rendered on the page.
 */
export async function extractAllGroundedPricesFromDom(
  page: Page,
  limit: number = 6
): Promise<GroundedPriceMatch[]> {
  const candidates = await page
    .evaluate((maxItems: number) => {
      const results: Array<{ text: string; tagName: string; ref?: string }> = [];
      const seen = new Set<string>();
      const nodes = Array.from(
        document.querySelectorAll(
          "[data-testid*='price'], [class*='price'], [class*='plan'], h1, h2, h3, h4, p, span, strong, div, li"
        )
      );

      for (const node of nodes) {
        if (results.length >= maxItems * 3) break;
        const el = node as HTMLElement;
        if (el.children.length > 3) continue;
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          parseFloat(style.opacity || "1") === 0 ||
          rect.width <= 0 ||
          rect.height <= 0
        ) {
          continue;
        }
        const text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
        if (!text || text.length > 180 || !/(\$|€|£|\bUSD\b|\bEUR\b|\bGBP\b)/i.test(text)) {
          continue;
        }
        if (seen.has(text)) continue;
        seen.add(text);
        const attrRef = el.getAttribute("data-rico-ref") || el.closest("[data-rico-ref]")?.getAttribute("data-rico-ref");
        results.push({
          text,
          tagName: el.tagName.toLowerCase(),
          ref: attrRef ? `@${attrRef}` : undefined,
        });
      }
      return results;
    }, limit)
    .catch(() => []);

  const grounded: GroundedPriceMatch[] = [];
  const seenPrices = new Set<string>();

  for (const item of candidates) {
    if (grounded.length >= limit) break;
    const parsed = extractPriceFromText(item.text);
    if (!parsed || parsed.price <= 0) continue;
    const key = `${parsed.currency}:${parsed.price.toFixed(2)}:${parsed.billingPeriod}`;
    if (seenPrices.has(key)) continue;
    if (!item.text.includes(parsed.rawMatched)) continue;
    seenPrices.add(key);
    grounded.push({
      grounded: true,
      price: parsed.price,
      currency: parsed.currency,
      billingPeriod: parsed.billingPeriod,
      matchedSubstring: parsed.rawMatched,
      contextSnippet: item.text.slice(0, 140),
      tagName: item.tagName,
      ref: item.ref,
    });
  }

  return grounded;
}
