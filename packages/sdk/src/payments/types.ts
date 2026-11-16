export type FundingRail = "PAYPAL" | "VISA";

export type QuoteRefusalCode =
  | "NOT_FOUND"
  | "NOT_ACTIVE"
  | "ALREADY_PAID"
  | "IN_PROGRESS"
  | "OVER_BUDGET"
  | "PRICE_UNVERIFIED"
  | "CONFIG";

export type ExecuteRefusalCode =
  | QuoteRefusalCode
  | "INVALID_CONFIRMATION"
  | "CONFIRMATION_EXPIRED"
  | "PRICE_CHANGED"
  | "BLOCKED"
  | "FAILED"
  | "NEEDS_RECONCILIATION"
  | "DUPLICATE_EXECUTION";

export type GuardrailStatus = "APPROVED" | "BLOCKED";

export interface PaymentQuote {
  mandateId: string;
  service: string;
  amount: number;
  currency: string;
  budgetCeiling: number;
  billingPeriod: string;
  periodLabel: string;
  priceSource: string;
  confirmToken: string;
  expiresAt: number;
}

export interface QuotePaymentInput {
  mandateId: string;
  amount?: number;
  currency?: string;
}

export interface QuotePaymentResponse {
  quote: PaymentQuote;
  confirmToken: string;
  guardrailStatus: GuardrailStatus;
}

export interface ExecutePaymentInput {
  confirmToken: string;
  idempotencyKey?: string;
  fundingRail?: FundingRail;
}

export interface ExecutePaymentResponse {
  ok: true;
  status: "COMPLETED";
  message: string;
  transactionId?: string;
  orderId: string;
  receipt: Record<string, unknown> | null;
}

export interface PaymentRequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

/**
 * Structural transport compatible with #35's RicoClient.request(...) method.
 */
export interface RicoRequestTransport {
  request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: PaymentRequestOptions
  ): Promise<T>;
}

export interface StandaloneTransportOptions {
  baseUrl: string;
  sessionToken?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

export type PaymentsTransportInput =
  | RicoRequestTransport
  | StandaloneTransportOptions;

export interface QuoteAndConfirmInput extends QuotePaymentInput {
  fundingRail?: FundingRail;
  idempotencyKey?: string;
  confirm: (quote: PaymentQuote) => Promise<boolean> | boolean;
}

export type QuoteAndConfirmResult =
  | {
      executed: true;
      quote: PaymentQuote;
      execution: ExecutePaymentResponse;
    }
  | {
      executed: false;
      quote: PaymentQuote;
      reason: "CANCELLED_BY_CALLER";
    };

export class RicoPaymentError extends Error {
  readonly code: string;
  readonly status: number;
  readonly body?: unknown;

  constructor(init: {
    message: string;
    code: string;
    status?: number;
    body?: unknown;
  }) {
    super(init.message);
    this.name = "RicoPaymentError";
    this.code = init.code;
    this.status = init.status ?? 400;
    this.body = init.body;
  }
}

export class RicoPaymentGuardrailError extends RicoPaymentError {
  readonly guardrailStatus: GuardrailStatus;

  constructor(init: {
    message: string;
    code: QuoteRefusalCode | ExecuteRefusalCode;
    status?: number;
    body?: unknown;
    guardrailStatus?: GuardrailStatus;
  }) {
    super({
      message: init.message,
      code: init.code,
      status: init.status ?? 422,
      body: init.body,
    });
    this.name = "RicoPaymentGuardrailError";
    this.guardrailStatus = init.guardrailStatus ?? "BLOCKED";
  }
}
