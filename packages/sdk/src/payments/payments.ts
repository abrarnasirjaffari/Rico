import {
  RicoPaymentError,
  RicoPaymentGuardrailError,
  type ExecutePaymentInput,
  type ExecutePaymentResponse,
  type PaymentQuote,
  type PaymentRequestOptions,
  type PaymentsTransportInput,
  type QuoteAndConfirmInput,
  type QuoteAndConfirmResult,
  type QuotePaymentInput,
  type QuotePaymentResponse,
  type QuoteRefusalCode,
  type RicoRequestTransport,
  type StandaloneTransportOptions,
} from "./types.ts";

const SESSION_COOKIE_NAME = "rico_auth_session";
const DEFAULT_TIMEOUT_MS = 30_000;
const GUARDRAIL_REFUSAL_CODES = new Set<string>([
  "OVER_BUDGET",
  "BLOCKED",
  "PRICE_CHANGED",
  "ALREADY_PAID",
  "NOT_ACTIVE",
  "IN_PROGRESS",
  "PRICE_UNVERIFIED",
]);

function isRequestTransport(
  input: PaymentsTransportInput
): input is RicoRequestTransport {
  return (
    typeof input === "object" &&
    input !== null &&
    "request" in input &&
    typeof input.request === "function"
  );
}

function createStandaloneTransport(
  options: StandaloneTransportOptions
): RicoRequestTransport {
  if (!options?.baseUrl || typeof options.baseUrl !== "string") {
    throw new TypeError("createPaymentsHelper: `baseUrl` is required.");
  }

  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = options.fetch ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new TypeError(
      "createPaymentsHelper: no global fetch found; pass `fetch` in options."
    );
  }

  const baseHeaders: Record<string, string> = {
    accept: "application/json",
    ...options.headers,
  };
  if (options.sessionToken) {
    baseHeaders.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(options.sessionToken)}`;
  }

  return {
    async request<T>(
      method: string,
      path: string,
      body?: unknown,
      reqOptions?: PaymentRequestOptions
    ): Promise<T> {
      const headers: Record<string, string> = {
        ...baseHeaders,
        ...reqOptions?.headers,
      };
      if (body !== undefined) {
        headers["content-type"] = "application/json";
      }

      const signals: AbortSignal[] = [];
      if (reqOptions?.signal) signals.push(reqOptions.signal);
      if (timeoutMs > 0) signals.push(AbortSignal.timeout(timeoutMs));

      const response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: signals.length > 0 ? AbortSignal.any(signals) : undefined,
        credentials: "include",
      });

      const text = await response.text();
      let parsed: unknown;
      if (text) {
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }
      }

      if (!response.ok) {
        const record =
          parsed !== null && typeof parsed === "object"
            ? (parsed as Record<string, unknown>)
            : {};
        const message =
          (typeof record.error === "string" && record.error) ||
          (typeof record.message === "string" && record.message) ||
          `${method} ${path} failed with HTTP ${response.status}`;
        const code =
          typeof record.code === "string" ? record.code : `HTTP_${response.status}`;

        if (GUARDRAIL_REFUSAL_CODES.has(code)) {
          throw new RicoPaymentGuardrailError({
            message,
            code: code as QuoteRefusalCode,
            status: response.status,
            body: parsed,
          });
        }

        throw new RicoPaymentError({
          message,
          code,
          status: response.status,
          body: parsed,
        });
      }

      return parsed as T;
    },
  };
}

interface DecodedTokenExpiry {
  hasExp: boolean;
  expired: boolean;
}

function inspectConfirmToken(token: unknown): {
  validFormat: boolean;
  expiry: DecodedTokenExpiry;
} {
  if (typeof token !== "string") {
    return { validFormat: false, expiry: { hasExp: false, expired: false } };
  }
  const trimmed = token.trim();
  if (!trimmed || trimmed.length > 2048) {
    return { validFormat: false, expiry: { hasExp: false, expired: false } };
  }

  const parts = trimmed.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { validFormat: false, expiry: { hasExp: false, expired: false } };
  }

  try {
    const json = Buffer.from(parts[0], "base64url").toString("utf8");
    const payload = JSON.parse(json) as Record<string, unknown>;
    if (typeof payload.exp === "number" && Number.isFinite(payload.exp)) {
      return {
        validFormat: true,
        expiry: { hasExp: true, expired: payload.exp <= Date.now() },
      };
    }
  } catch {
    // Non-JSON payload format is rejected when checking strict structure only if malformed base64;
    // keep format check structural (`body.mac`) so opaque test tokens still work unless malformed.
  }

  return { validFormat: true, expiry: { hasExp: false, expired: false } };
}

function normalizeServerError(err: unknown): never {
  if (err instanceof RicoPaymentError) {
    throw err;
  }
  if (err !== null && typeof err === "object") {
    const rec = err as Record<string, unknown>;
    const body =
      rec.body !== null && typeof rec.body === "object"
        ? (rec.body as Record<string, unknown>)
        : {};
    const code =
      (typeof body.code === "string" && body.code) ||
      (typeof rec.code === "string" && rec.code) ||
      "PAYMENT_ERROR";
    const status = typeof rec.status === "number" ? rec.status : 400;
    const message =
      (typeof body.error === "string" && body.error) ||
      (typeof rec.message === "string" && rec.message) ||
      "Payment request failed.";

    if (GUARDRAIL_REFUSAL_CODES.has(code)) {
      throw new RicoPaymentGuardrailError({
        message,
        code: code as QuoteRefusalCode,
        status,
        body: rec.body ?? err,
      });
    }

    throw new RicoPaymentError({
      message,
      code,
      status,
      body: rec.body ?? err,
    });
  }
  throw err;
}

export interface PaymentsHelper {
  /**
   * Step 1: Requests a server-verified payment quote and short-lived signed confirmToken.
   * Never executes a charge.
   */
  quote(
    input: QuotePaymentInput,
    options?: PaymentRequestOptions
  ): Promise<QuotePaymentResponse>;

  /**
   * Step 2: Executes a payment strictly using a valid server-issued confirmToken.
   * Blocks missing, malformed, expired, or already-executed tokens before hitting the network.
   */
  execute(
    input: ExecutePaymentInput,
    options?: PaymentRequestOptions
  ): Promise<ExecutePaymentResponse>;

  /**
   * Safe orchestrator: quotes first, requires explicit caller confirmation, then executes.
   */
  quoteAndConfirm(
    input: QuoteAndConfirmInput,
    options?: PaymentRequestOptions
  ): Promise<QuoteAndConfirmResult>;
}

/**
 * Creates a foolproof two-step payments helper backed by either a #35 RicoClient
 * (`client.request(...)`) or standalone `{ baseUrl, fetch, sessionToken }` options.
 */
export function createPaymentsHelper(
  transportInput: PaymentsTransportInput
): PaymentsHelper {
  const transport = isRequestTransport(transportInput)
    ? transportInput
    : createStandaloneTransport(transportInput);

  const usedTokens = new Set<string>();
  const usedIdempotencyKeys = new Set<string>();
  const inFlightTokens = new Set<string>();
  const quotedExpiries = new Map<string, number>();

  async function quote(
    input: QuotePaymentInput,
    options?: PaymentRequestOptions
  ): Promise<QuotePaymentResponse> {
    if (!input?.mandateId || typeof input.mandateId !== "string" || !input.mandateId.trim()) {
      throw new TypeError("payments.quote: `mandateId` must be a non-empty string.");
    }
    if (
      input.amount !== undefined &&
      (typeof input.amount !== "number" || !Number.isFinite(input.amount) || input.amount <= 0)
    ) {
      throw new TypeError("payments.quote: `amount` must be a positive number when provided.");
    }

    let res: { quote?: PaymentQuote };
    try {
      res = await transport.request<{ quote?: PaymentQuote }>(
        "POST",
        "/api/payments/quote",
        {
          mandateId: input.mandateId.trim(),
          ...(input.amount !== undefined ? { amount: input.amount } : {}),
          ...(input.currency !== undefined ? { currency: input.currency } : {}),
        },
        options
      );
    } catch (err) {
      normalizeServerError(err);
    }

    const q = res?.quote;
    if (!q || !q.confirmToken) {
      throw new RicoPaymentError({
        message: "Server quote response did not include a signed confirmToken.",
        code: "INVALID_QUOTE_RESPONSE",
        status: 502,
        body: res,
      });
    }

    if (typeof q.expiresAt === "number" && Number.isFinite(q.expiresAt)) {
      quotedExpiries.set(q.confirmToken, q.expiresAt);
    }

    // Defense-in-depth ceiling check on quoted or requested amount.
    const effectiveAmount =
      input.amount !== undefined ? Math.max(q.amount, input.amount) : q.amount;
    if (effectiveAmount > q.budgetCeiling) {
      throw new RicoPaymentGuardrailError({
        message: `Quoted amount ($${effectiveAmount.toFixed(2)} ${q.currency}) exceeds mandate ceiling ($${q.budgetCeiling.toFixed(2)} ${q.currency}).`,
        code: "OVER_BUDGET",
        status: 422,
        body: res,
      });
    }

    return {
      quote: q,
      confirmToken: q.confirmToken,
      guardrailStatus: "APPROVED",
    };
  }

  async function execute(
    input: ExecutePaymentInput,
    options?: PaymentRequestOptions
  ): Promise<ExecutePaymentResponse> {
    const tokenCheck = inspectConfirmToken(input?.confirmToken);
    if (!tokenCheck.validFormat) {
      throw new RicoPaymentGuardrailError({
        message:
          "payments.execute requires a valid server-issued confirmToken from payments.quote(). Direct single-step charges are blocked.",
        code: "INVALID_CONFIRMATION",
        status: 400,
      });
    }

    const confirmToken = input.confirmToken.trim();
    const knownExpiry = quotedExpiries.get(confirmToken);
    if (tokenCheck.expiry.expired || (knownExpiry !== undefined && knownExpiry <= Date.now())) {
      throw new RicoPaymentGuardrailError({
        message: "confirmToken has expired. Request a fresh quote before executing.",
        code: "CONFIRMATION_EXPIRED",
        status: 409,
      });
    }

    if (usedTokens.has(confirmToken) || inFlightTokens.has(confirmToken)) {
      throw new RicoPaymentGuardrailError({
        message: "Duplicate execution blocked: confirmToken has already been used.",
        code: "DUPLICATE_EXECUTION",
        status: 409,
      });
    }

    const idempotencyKey = input.idempotencyKey?.trim();
    if (idempotencyKey && usedIdempotencyKeys.has(idempotencyKey)) {
      throw new RicoPaymentGuardrailError({
        message: `Duplicate execution blocked: idempotencyKey "${idempotencyKey}" was already executed.`,
        code: "DUPLICATE_EXECUTION",
        status: 409,
      });
    }

    inFlightTokens.add(confirmToken);
    try {
      const headers = {
        ...options?.headers,
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      };

      const result = await transport.request<ExecutePaymentResponse>(
        "POST",
        "/api/payments/execute",
        {
          confirmToken,
          fundingRail: input.fundingRail ?? "PAYPAL",
          ...(idempotencyKey ? { idempotencyKey } : {}),
        },
        {
          ...options,
          headers,
        }
      );

      usedTokens.add(confirmToken);
      if (idempotencyKey) {
        usedIdempotencyKeys.add(idempotencyKey);
      }
      return result;
    } catch (err) {
      normalizeServerError(err);
    } finally {
      inFlightTokens.delete(confirmToken);
    }
  }

  async function quoteAndConfirm(
    input: QuoteAndConfirmInput,
    options?: PaymentRequestOptions
  ): Promise<QuoteAndConfirmResult> {
    if (typeof input.confirm !== "function") {
      throw new TypeError(
        "payments.quoteAndConfirm requires an explicit `confirm(quote)` callback."
      );
    }

    const quoted = await quote(
      {
        mandateId: input.mandateId,
        amount: input.amount,
        currency: input.currency,
      },
      options
    );

    const approved = await input.confirm(quoted.quote);
    if (!approved) {
      return {
        executed: false,
        quote: quoted.quote,
        reason: "CANCELLED_BY_CALLER",
      };
    }

    const execution = await execute(
      {
        confirmToken: quoted.confirmToken,
        fundingRail: input.fundingRail,
        idempotencyKey: input.idempotencyKey,
      },
      options
    );

    return {
      executed: true,
      quote: quoted.quote,
      execution,
    };
  }

  return {
    quote,
    execute,
    quoteAndConfirm,
  };
}
