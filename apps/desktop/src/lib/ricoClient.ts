import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export const DEFAULT_SERVER_URL = "http://localhost:3000";
const SERVER_URL_STORAGE_KEY = "rico_desktop_server_url";

export interface RicoUser {
  id: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  role?: string;
}

export interface SessionResponse {
  authenticated: boolean;
  user: RicoUser | null;
}

export interface Mandate {
  id: string;
  service: string;
  budgetCeiling: number;
  lastScrapedPrice: number;
  recurrence: string;
  nextRun: string;
  status: "ACTIVE" | "PAUSED" | "ANOMALY_HOLD";
  category: string;
  currency: string;
  strictMode: boolean;
  merchantUrl?: string | null;
}

export interface Transaction {
  id: string;
  orderId: string;
  service: string;
  amount: number;
  currency: string;
  status: "COMPLETED" | "PENDING" | "BLOCKED";
  timestamp: string;
}

export interface PendingAlert {
  id: string;
  mandateId: string;
  service: string;
  oldPrice: number;
  newPrice: number;
  jumpPercent: number;
  budgetCeiling: number;
  currency: string;
  status: "PENDING" | "APPROVED" | "BACKUP_PAID" | "CANCELLED";
  timestamp: string;
  message?: string;
}

export interface WatchdogAuditItem {
  id: string;
  service: string;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "HEALTHY";
  isUrgent: boolean;
  matchedMandateId?: string;
  contract: {
    contractId: string;
    service: string;
    type: string;
    currentPrice: number;
    budgetCeiling: number;
    currency: string;
    renewalDate: string;
    daysUntilRenewal: number;
  };
  recommendedActions: Array<{
    type: string;
    label: string;
    description: string;
    urgency: "IMMEDIATE" | "UPCOMING" | "OPTIONAL";
  }>;
}

export interface PopoverSnapshot {
  mandates: Mandate[];
  transactions: Transaction[];
  pendingAlerts: PendingAlert[];
  watchdogAudits: WatchdogAuditItem[];
  fetchedAt: string;
}

export class UnauthorizedError extends Error {
  constructor(message = "Session expired. Please sign in again.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function getSavedServerUrl(): string {
  try {
    const saved = window.localStorage.getItem(SERVER_URL_STORAGE_KEY);
    return saved ? normalizeServerUrl(saved) : DEFAULT_SERVER_URL;
  } catch {
    return DEFAULT_SERVER_URL;
  }
}

export function saveServerUrl(url: string): string {
  const normalized = normalizeServerUrl(url);
  try {
    window.localStorage.setItem(SERVER_URL_STORAGE_KEY, normalized);
  } catch {
    // Ignore storage failures in restricted webviews
  }
  return normalized;
}

export function normalizeServerUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  return trimmed || DEFAULT_SERVER_URL;
}

export async function ricoFetch(
  serverUrl: string,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const base = normalizeServerUrl(serverUrl);
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const requestInit: RequestInit = {
    ...init,
    headers,
    credentials: "include",
  };

  if (isTauriRuntime()) {
    return tauriFetch(url, requestInit);
  }
  return window.fetch(url, requestInit);
}

export async function checkSession(serverUrl: string): Promise<SessionResponse> {
  const res = await ricoFetch(serverUrl, "/api/auth/session", { method: "GET" });
  if (!res.ok) {
    throw new Error(`Server returned HTTP ${res.status}`);
  }
  const data = (await res.json()) as SessionResponse;
  return {
    authenticated: Boolean(data.authenticated && data.user),
    user: data.user ?? null,
  };
}

export async function loginWithDemo(serverUrl: string): Promise<RicoUser> {
  const res = await ricoFetch(serverUrl, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ isDemo: true }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.user) {
    throw new Error(data.error || `Login failed (HTTP ${res.status})`);
  }
  return data.user as RicoUser;
}

export async function loginWithEmail(
  serverUrl: string,
  email: string,
  password?: string
): Promise<RicoUser> {
  const res = await ricoFetch(serverUrl, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim(),
      ...(password ? { password } : {}),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.user) {
    throw new Error(data.error || `Sign-in failed (HTTP ${res.status})`);
  }
  return data.user as RicoUser;
}

export async function logout(serverUrl: string): Promise<void> {
  await ricoFetch(serverUrl, "/api/auth/logout", { method: "POST" });
}

export async function fetchPopoverSnapshot(
  serverUrl: string
): Promise<PopoverSnapshot> {
  const [dashRes, sentinelRes, watchdogRes] = await Promise.allSettled([
    ricoFetch(serverUrl, "/api/dashboard", { method: "GET" }),
    ricoFetch(serverUrl, "/api/sentinel/status", { method: "GET" }),
    ricoFetch(serverUrl, "/api/contracts/watchdog/status", { method: "GET" }),
  ]);

  if (dashRes.status === "rejected") {
    throw new Error("Could not reach Rico server.");
  }

  if (dashRes.value.status === 401) {
    throw new UnauthorizedError();
  }

  if (!dashRes.value.ok) {
    throw new Error(`Dashboard request failed (HTTP ${dashRes.value.status})`);
  }

  const dashJson = (await dashRes.value.json()) as {
    mandates?: Mandate[];
    transactions?: Transaction[];
  };

  let pendingAlerts: PendingAlert[] = [];
  if (sentinelRes.status === "fulfilled" && sentinelRes.value.ok) {
    const sentinelJson = (await sentinelRes.value.json()) as {
      pendingAlerts?: PendingAlert[];
    };
    pendingAlerts = sentinelJson.pendingAlerts ?? [];
  }

  let watchdogAudits: WatchdogAuditItem[] = [];
  if (watchdogRes.status === "fulfilled" && watchdogRes.value.ok) {
    const watchdogJson = (await watchdogRes.value.json()) as {
      portfolioAudit?: { audits?: WatchdogAuditItem[] } | null;
    };
    watchdogAudits = watchdogJson.portfolioAudit?.audits ?? [];
  }

  return {
    mandates: dashJson.mandates ?? [],
    transactions: dashJson.transactions ?? [],
    pendingAlerts,
    watchdogAudits,
    fetchedAt: new Date().toISOString(),
  };
}

export async function resolveHeldPayment(
  serverUrl: string,
  params: {
    action: "approve" | "cancel";
    mandateId: string;
    alertId?: string;
  }
): Promise<{ success: boolean; message: string }> {
  const res = await ricoFetch(serverUrl, "/api/sentinel/webhook", {
    method: "POST",
    body: JSON.stringify(params),
  });

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
    result?: { message?: string };
  };

  if (!res.ok || !data.success) {
    throw new Error(
      data.error || data.result?.message || `Action failed (HTTP ${res.status})`
    );
  }

  return {
    success: true,
    message:
      data.result?.message ||
      (params.action === "approve"
        ? "Payment approved and processed."
        : "Held payment cancelled and mandate paused."),
  };
}

export async function remediateTrialAlert(
  serverUrl: string,
  params: {
    mandateId?: string;
    service: string;
    action: "CANCEL_TRIAL" | "PAUSE_MANDATE";
    reason: string;
  }
): Promise<void> {
  const res = await ricoFetch(serverUrl, "/api/contracts/watchdog/remediate", {
    method: "POST",
    body: JSON.stringify(params),
  });

  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
  };

  if (!res.ok || !data.success) {
    throw new Error(data.error || `Could not update trial (HTTP ${res.status})`);
  }
}
