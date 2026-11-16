/**
 * Structural interfaces and guardrail types for @rico/sdk AI agent adapters.
 * Kept self-contained so adapters plug directly into RicoClient (#35) without runtime coupling.
 */

export interface RicoPaymentQuote {
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
  baselinePrice?: number;
}

export interface RicoQuoteRequest {
  mandateId: string;
  amount?: number;
  currency?: string;
}

export interface RicoQuoteClientError {
  code?: string;
  message?: string;
  error?: string;
  status?: number;
}

/**
 * Structural client interface compatible with @rico/sdk's core RicoClient (#35)
 * as well as lightweight test doubles.
 */
export interface RicoClient {
  payments?: {
    quote(input: RicoQuoteRequest): Promise<RicoPaymentQuote | { quote: RicoPaymentQuote }>;
  };
  quotePayment?: (
    input: RicoQuoteRequest
  ) => Promise<RicoPaymentQuote | { quote: RicoPaymentQuote }>;
}

export type GuardrailBlockCode =
  | "BUDGET_EXCEEDED"
  | "PRICE_SPIKE"
  | "QUOTE_REFUSED"
  | "MISSING_CONFIRM_TOKEN"
  | "APPROVAL_REQUIRED";

export class RicoGuardrailError extends Error {
  public readonly code: GuardrailBlockCode;
  public readonly mandateId: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: GuardrailBlockCode,
    message: string,
    mandateId: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "RicoGuardrailError";
    this.code = code;
    this.mandateId = mandateId;
    this.details = details;
  }
}

export interface GuardrailExecutionContext {
  mandateId: string;
  confirmToken: string;
  quote: RicoPaymentQuote;
}

export interface WithRicoGuardrailsOptions<TArgs = Record<string, unknown>> {
  client: RicoClient;
  mandateId: string;
  /** Optional baseline price (USD/unit) used for >20% price spike anomaly detection. */
  baselinePrice?: number;
  /** Percentage threshold above baselinePrice that triggers a price spike hold (default: 20). */
  priceSpikeThresholdPercent?: number;
  /** Extract an expected/requested charge amount from tool arguments for pre-check. */
  extractAmount?: (args: TArgs) => number | undefined;
  /** Optional human-in-the-loop approval callback when a spike or strict mode check needs sign-off. */
  onApprovalRequired?: (info: {
    mandateId: string;
    quote: RicoPaymentQuote;
    reason: string;
  }) => Promise<boolean> | boolean;
  /**
   * "return" (default) returns a structured blocked result so AI tool loops halt cleanly without crashing.
   * "throw" throws a RicoGuardrailError instead.
   */
  onBlock?: "return" | "throw";
}

export type GuardrailToolResult<TResult> =
  | {
      ok: true;
      blocked: false;
      result: TResult;
      quote: RicoPaymentQuote;
    }
  | {
      ok: false;
      blocked: true;
      code: GuardrailBlockCode;
      reason: string;
      mandateId: string;
      quote?: RicoPaymentQuote;
    };

export type GuardedToolHandler<TArgs, TResult> = (
  args: TArgs
) => Promise<GuardrailToolResult<TResult>>;
