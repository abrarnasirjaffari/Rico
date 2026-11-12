export interface ScrapedPriceResult {
  service: string;
  url?: string;
  planName: string;
  price: number;
  currency: string;
  billingPeriod: string;
  extractedAt: string;
  source: "live_browser" | "cache_fallback";
  confidence: number;
  rawText?: string;
  grounded?: boolean;
  groundedDomSubstring?: string;
}

export interface BrowserScrapeOptions {
  headless?: boolean;
  timeoutMs?: number;
  serviceUrl?: string;
  keepAlive?: boolean;
  tabId?: string;
}

export interface MerchantPricingProfile {
  name: string;
  defaultUrl: string;
  planName: string;
  baselinePrice: number;
  currency: string;
  billingPeriod: string;
  priceSelectors: string[];
}


export interface CursorEvent {
  x: number;
  y: number;
  action: "move" | "click" | "scroll" | "type";
  label?: string;
  timestamp: number;
}

export interface ScreencastFrame {
  frame: string; // base64 JPEG
  timestamp: number;
  url: string;
  title: string;
  status: "idle" | "navigating" | "evaluating" | "extracting" | "ready" | "error";
  fps: number;
  cursor?: CursorEvent;
  actionLabel?: string;
  metadata?: {
    offsetTop?: number;
    pageScaleFactor?: number;
    deviceWidth?: number;
    deviceHeight?: number;
    scrollOffsetX?: number;
    scrollOffsetY?: number;
  };
}

export interface BrowserActivityLog {
  id: string;
  timestamp: number;
  phase:
    | "search"
    | "navigate"
    | "scroll"
    | "inspect"
    | "extract"
    | "snapshot"
    | "act"
    | "complete"
    | "error";
  url: string;
  title: string;
  detail: string;
  tabId?: string;
}

export interface SemanticElementBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SemanticElementNode {
  ref: string; // "@e1", "@e2", ...
  generation: number;
  role: string;
  name: string;
  tagName: string;
  inputType?: string;
  value?: string;
  placeholder?: string;
  checked?: boolean;
  disabled?: boolean;
  href?: string;
  isCursorPointer?: boolean;
  isSensitive?: boolean;
  rect: SemanticElementBoundingBox;
}

export interface GroundedPriceMatch {
  grounded: boolean;
  price: number;
  currency: string;
  billingPeriod: string;
  matchedSubstring: string | null;
  contextSnippet: string | null;
  tagName?: string;
  ref?: string;
}

export interface HelpTheAgentWallState {
  detected: boolean;
  kind: "LOGIN_WALL" | "TWO_FACTOR_AUTH" | "CAPTCHA_CHALLENGE" | "BOT_VERIFICATION";
  title: string;
  message: string;
  tabId: string;
  url: string;
  detectedAt: number;
  expiresAt: number;
  resolution?: "pending" | "continued" | "skipped";
}

export interface SemanticSnapshotResult {
  tabId: string;
  url: string;
  title: string;
  generation: number;
  capturedAt: string;
  elements: SemanticElementNode[];
  treeText: string;
  wall: HelpTheAgentWallState | null;
  groundedPrices: GroundedPriceMatch[];
}

export type SemanticBrowserActionType =
  | "snapshot"
  | "click"
  | "fill"
  | "select"
  | "check"
  | "press"
  | "wait";

export interface SemanticActionRequest {
  tabId?: string;
  action: SemanticBrowserActionType;
  ref?: string;
  generation?: number;
  value?: string;
  checked?: boolean;
  key?: string;
  ms?: number;
  text?: string;
  selector?: string;
}

export interface SemanticActionResult {
  ok: boolean;
  tabId: string;
  action: SemanticBrowserActionType;
  ref?: string;
  generation: number;
  url: string;
  title: string;
  summary: string;
  redacted?: boolean;
  snapshot?: SemanticSnapshotResult;
  wall?: HelpTheAgentWallState | null;
}

export interface BrowserConsoleEntry {
  id: string;
  level: "log" | "info" | "warn" | "error" | "pageerror";
  text: string;
  url: string;
  timestamp: number;
}

export interface BrowserNetworkEntry {
  id: string;
  method: string;
  url: string;
  resourceType: string;
  status: number | null;
  blocked: boolean;
  blockReason?: string;
  durationMs?: number;
  timestamp: number;
}

export interface BrowserDialogEntry {
  id: string;
  type: string;
  message: string;
  defaultPrompt?: string;
  url: string;
  handledAction: "dismiss";
  timestamp: number;
}

export interface BrowserTabDiagnostics {
  tabId: string;
  url: string;
  title: string;
  generation: number;
  canGoBack: boolean;
  canGoForward: boolean;
  blockedTrackersCount: number;
  interceptedDialogsCount: number;
  console: BrowserConsoleEntry[];
  network: BrowserNetworkEntry[];
  dialogs: BrowserDialogEntry[];
  wall: HelpTheAgentWallState | null;
}

export interface LiveBrowserTabInfo {
  id: string;
  url: string;
  title: string;
  service: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  generation: number;
  isPopup?: boolean;
  wall?: HelpTheAgentWallState | null;
  blockedTrackersCount: number;
  interceptedDialogsCount: number;
}

export interface InspectedElementChip {
  ref: string;
  generation: number;
  tabId: string;
  role: string;
  name: string;
  tagName: string;
  url: string;
}

export interface KeyDispatchPayload {
  eventType: "keyDown" | "keyUp";
  key: string;
  code?: string;
  text?: string;
  keyCode?: number;
  modifiers?: {
    alt?: boolean;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
  };
}

export interface WebSearchResultItem {
  title: string;
  url: string;
  snippet: string;
}

export interface VisitedPageSummary {
  url: string;
  title: string;
  excerpt: string;
  detectedPrice?: {
    price: number;
    currency: string;
    billingPeriod: string;
  };
}

export interface LiveWebSearchResult {
  query: string;
  searchUrl: string;
  searchResults: WebSearchResultItem[];
  visitedPages: VisitedPageSummary[];
  primaryUrl: string;
  primaryTitle: string;
  completedAt: string;
}

export interface BrowserSessionStatus {
  isActive: boolean;
  currentUrl: string;
  currentTitle: string;
  activeService?: string;
  status: "idle" | "navigating" | "evaluating" | "extracting" | "ready" | "error";
  fps: number;
  totalFrames: number;
  lastFrameTimestamp: number;
  lastExtractedPrice?: number;
  canGoBack?: boolean;
  canGoForward?: boolean;
  generation?: number;
  wall?: HelpTheAgentWallState | null;
}

export interface HelperBotSession {
  id: string;
  service: string;
  url: string;
  title: string;
  status: "idle" | "navigating" | "evaluating" | "extracting" | "ready" | "error";
  currentFrame?: string;
  cursor?: CursorEvent;
  extractedResult?: ScrapedPriceResult;
  fps: number;
  totalFrames: number;
  startedAt: number;
  finishedAt?: number;
  canGoBack?: boolean;
  canGoForward?: boolean;
  generation?: number;
  isPopup?: boolean;
  isLivePoolTab?: boolean;
  blockedTrackers?: number;
  wall?: HelpTheAgentWallState | null;
}

export interface ParallelVerificationResult {
  batchId: string;
  startedAt: string;
  completedAt: string;
  bots: HelperBotSession[];
  bestDeal?: {
    service: string;
    price: number;
    currency: string;
    planName: string;
    savingsVsHighest: number;
  };
}

export interface CalmPlanTier {
  id: string;
  name: string;
  headline: string;
  price: number;
  currency: string;
  billingPeriod: "monthly" | "annually" | "usage" | "one_time";
  normalizedMonthlyPrice: number;
  transparentLabel: string;
  trapAlerts: string[];
  cleanFeatures: string[];
  recommended?: boolean;
  recommendationReason?: string;
  rawMarketingTrapSnippet?: string;
}

export interface CalmPricingResult {
  service: string;
  url: string;
  pageTitle: string;
  category: "Streaming" | "Developer Tools" | "Cloud & Infrastructure" | "SaaS & AI";
  simplifierSummary: string;
  darkPatternsStrippedCount: number;
  hiddenFeesUncovered: string[];
  rawPageComplexityScore: number; // e.g. 85/100
  calmScore: number; // e.g. 98/100
  plans: CalmPlanTier[];
  analyzedAt: string;
}

export interface HumanTakeoverState {
  isActive: boolean;
  reason?: "CAPTCHA_CHALLENGE" | "CLOUDFLARE_TURNSTILE" | "TWO_FACTOR_SMS" | "MANUAL_TAKEOVER";
  challengeTitle?: string;
  challengeInstructions?: string;
  isSolved?: boolean;
  startedAt?: number;
}


