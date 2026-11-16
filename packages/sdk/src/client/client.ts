import { RicoApiError, RicoGuardrailHoldError, RicoNetworkError } from "./errors.ts";
import type {
  CheckPriceInput,
  CheckPriceResult,
  CreateMandateInput,
  Mandate,
  ParseInvoiceInput,
  ParsedInvoice,
  Transaction,
} from "./types.ts";

/** Name of the signed session cookie Rico's API routes read. */
const SESSION_COOKIE_NAME = "rico_auth_session";
const DEFAULT_TIMEOUT_MS = 30_000;
/** Statuses Rico reports when a guardrail, not a fault, stopped the request. */
const GUARDRAIL_STATUSES = new Set(["BLOCKED", "ANOMALY_HOLD"]);

export interface RicoClientOptions {
  /** Origin of the Rico deployment, such as "https://rico.example.com". */
  baseUrl: string;
  /**
   * Value of the `rico_auth_session` cookie. Browsers on the same origin send the cookie on
   * their own, so leave this out there; Desktop, mobile bridges and servers must pass it.
   */
  sessionToken?: string;
  /** Extra headers sent with every request. */
  headers?: Record<string, string>;
  /** Abort requests that take longer than this. Defaults to 30 seconds; 0 disables it. */
  timeoutMs?: number;
  /** Replacement for the global `fetch`, for tests or older runtimes. */
  fetch?: typeof fetch;
}

export interface RequestOptions {
  /** Cancels the request. */
  signal?: AbortSignal;
}

export class RicoClient {
  readonly mandates = {
    /** Every mandate owned by the signed-in user, newest first. */
    list: async (options?: RequestOptions): Promise<Mandate[]> => {
      const res = await this.request<{ mandates: Mandate[] }>("GET", "/api/mandates", undefined, options);
      return res.mandates;
    },
    /** Creates a mandate. Rico always assigns it to the signed-in user. */
    create: async (input: CreateMandateInput, options?: RequestOptions): Promise<Mandate> => {
      const res = await this.request<{ mandate: Mandate }>("POST", "/api/mandates", input, options);
      return res.mandate;
    },
    /** Sets a mandate's status to PAUSED so no further payments run for it. */
    pause: async (mandateId: string, options?: RequestOptions): Promise<Mandate> => {
      requireId(mandateId, "mandateId");
      const res = await this.request<{ mandate: Mandate }>(
        "PATCH",
        `/api/mandates/${encodeURIComponent(mandateId)}`,
        { status: "PAUSED" },
        options,
      );
      return res.mandate;
    },
  };

  readonly transactions = {
    /** Every transaction on the signed-in user's mandates, newest first. */
    list: async (options?: RequestOptions): Promise<Transaction[]> => {
      const res = await this.request<{ transactions: Transaction[] }>("GET", "/api/transactions", undefined, options);
      return res.transactions;
    },
  };

  readonly sentinel = {
    /** Runs a Price Sentinel audit for one mandate, or for all of the user's mandates. */
    checkPrice: async (input: CheckPriceInput = {}, options?: RequestOptions): Promise<CheckPriceResult> => {
      const res = await this.request<CheckPriceResult>("POST", "/api/sentinel/run", input, options);
      return { summary: res.summary, message: res.message };
    },
  };

  readonly ocr = {
    /** Extracts vendor, totals, line items and tax data from one invoice. */
    parseInvoice: async (input: ParseInvoiceInput, options?: RequestOptions): Promise<ParsedInvoice> => {
      if (!input?.content) throw new TypeError("parseInvoice: `content` is required.");
      const res = await this.request<{ invoice: ParsedInvoice }>("POST", "/api/invoices/parse", input, options);
      return res.invoice;
    },
  };

  readonly #baseUrl: string;
  readonly #headers: Record<string, string>;
  readonly #timeoutMs: number;
  readonly #fetch: typeof fetch;

  constructor(options: RicoClientOptions) {
    if (!options?.baseUrl) throw new TypeError("RicoClient: `baseUrl` is required.");
    this.#baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.#timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const fetchImpl = options.fetch ?? globalThis.fetch;
    if (typeof fetchImpl !== "function") {
      throw new TypeError("RicoClient: no global fetch found; pass `fetch` in the options.");
    }
    this.#fetch = fetchImpl;
    this.#headers = { accept: "application/json", ...options.headers };
    if (options.sessionToken) {
      this.#headers.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(options.sessionToken)}`;
    }
  }

  /** Sends a request to any Rico API path and returns the parsed JSON body. */
  async request<T>(method: string, path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const headers: Record<string, string> = { ...this.#headers };
    if (body !== undefined) headers["content-type"] = "application/json";

    const signals: AbortSignal[] = [];
    if (options?.signal) signals.push(options.signal);
    if (this.#timeoutMs > 0) signals.push(AbortSignal.timeout(this.#timeoutMs));

    let response: Response;
    try {
      response = await this.#fetch(`${this.#baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: signals.length ? AbortSignal.any(signals) : undefined,
        credentials: "include",
      });
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause);
      throw new RicoNetworkError(`${method} ${path} failed: ${reason}`, { cause });
    }

    const parsed = await readBody(response);
    if (!response.ok) throw toApiError(response, method, path, parsed);
    return parsed as T;
  }
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function toApiError(response: Response, method: string, path: string, body: unknown): RicoApiError {
  const record = body !== null && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const serverMessage = typeof record.error === "string" ? record.error : undefined;
  const message = serverMessage ?? `${method} ${path} failed with HTTP ${response.status}`;
  const init = { message, status: response.status, method, path, body };

  const holdStatus = typeof record.status === "string" ? record.status : undefined;
  if (holdStatus && GUARDRAIL_STATUSES.has(holdStatus)) {
    return new RicoGuardrailHoldError({ ...init, holdStatus });
  }
  return new RicoApiError(init);
}

function requireId(value: string, name: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`\`${name}\` must be a non-empty string.`);
  }
}
