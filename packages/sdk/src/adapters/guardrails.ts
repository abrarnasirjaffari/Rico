import {
  GuardrailBlockCode,
  GuardrailExecutionContext,
  GuardrailToolResult,
  GuardedToolHandler,
  RicoClient,
  RicoGuardrailError,
  RicoPaymentQuote,
  RicoQuoteRequest,
  WithRicoGuardrailsOptions,
} from "./types";

function unwrapQuote(
  raw: RicoPaymentQuote | { quote: RicoPaymentQuote }
): RicoPaymentQuote {
  if ("quote" in raw && raw.quote && typeof raw.quote === "object") {
    return raw.quote;
  }
  return raw as RicoPaymentQuote;
}

async function requestQuote(
  client: RicoClient,
  input: RicoQuoteRequest
): Promise<RicoPaymentQuote> {
  if (client.payments && typeof client.payments.quote === "function") {
    const res = await client.payments.quote(input);
    return unwrapQuote(res);
  }
  if (typeof client.quotePayment === "function") {
    const res = await client.quotePayment(input);
    return unwrapQuote(res);
  }
  throw new RicoGuardrailError(
    "QUOTE_REFUSED",
    "RicoClient must implement client.payments.quote() or client.quotePayment().",
    input.mandateId
  );
}

/**
 * Checks whether an amount exceeds the authorized mandate budget ceiling.
 */
export function checkBudgetCeiling(
  amount: number,
  budgetCeiling: number
): { exceeded: boolean; diff: number } {
  const diff = Number((amount - budgetCeiling).toFixed(2));
  return {
    exceeded: diff > 0,
    diff,
  };
}

/**
 * Checks whether a quoted price jumps more than thresholdPercent (default 20%) over baselinePrice.
 */
export function checkPriceSpike(
  quotedAmount: number,
  baselinePrice: number | undefined,
  thresholdPercent = 20
): { isSpike: boolean; percentageJump: number } {
  if (!baselinePrice || baselinePrice <= 0) {
    return { isSpike: false, percentageJump: 0 };
  }
  const percentageJump = Math.round(
    ((quotedAmount - baselinePrice) / baselinePrice) * 100
  );
  return {
    isSpike: percentageJump > thresholdPercent,
    percentageJump,
  };
}

function defaultExtractAmount(args: unknown): number | undefined {
  if (!args || typeof args !== "object") return undefined;
  const candidate = (args as Record<string, unknown>).amount;
  return typeof candidate === "number" && Number.isFinite(candidate)
    ? candidate
    : undefined;
}

function formatErrorReason(err: unknown): { code: GuardrailBlockCode; message: string } {
  if (err instanceof RicoGuardrailError) {
    return { code: err.code, message: err.message };
  }
  if (err && typeof err === "object") {
    const rec = err as Record<string, unknown>;
    const rawCode = typeof rec.code === "string" ? rec.code : "";
    const msg =
      (typeof rec.message === "string" && rec.message) ||
      (typeof rec.error === "string" && rec.error) ||
      "Payment quote refused by Rico guardrail server.";

    if (rawCode === "OVER_BUDGET" || rawCode === "BUDGET_EXCEEDED") {
      return { code: "BUDGET_EXCEEDED", message: msg };
    }
    if (rawCode === "PRICE_SPIKE") {
      return { code: "PRICE_SPIKE", message: msg };
    }
    return { code: "QUOTE_REFUSED", message: msg };
  }
  return {
    code: "QUOTE_REFUSED",
    message: err instanceof Error ? err.message : String(err),
  };
}

/**
 * Higher-order wrapper that guards any AI agent payment/checkout tool with Rico's
 * server-verified quote flow, hard budget ceiling, and >20% price spike anomaly hold.
 */
export function withRicoGuardrails<TArgs = Record<string, unknown>, TResult = unknown>(
  toolFn: (args: TArgs, context: GuardrailExecutionContext) => Promise<TResult> | TResult,
  options: WithRicoGuardrailsOptions<TArgs>
): GuardedToolHandler<TArgs, TResult> {
  const {
    client,
    mandateId,
    baselinePrice,
    priceSpikeThresholdPercent = 20,
    extractAmount = defaultExtractAmount,
    onApprovalRequired,
    onBlock = "return",
  } = options;

  function halt(
    code: GuardrailBlockCode,
    reason: string,
    quote?: RicoPaymentQuote
  ): GuardrailToolResult<TResult> {
    if (onBlock === "throw") {
      throw new RicoGuardrailError(code, reason, mandateId, { quote });
    }
    return {
      ok: false,
      blocked: true,
      code,
      reason,
      mandateId,
      quote,
    };
  }

  return async (args: TArgs): Promise<GuardrailToolResult<TResult>> => {
    const requestedAmount = extractAmount(args);

    let quote: RicoPaymentQuote;
    try {
      quote = await requestQuote(client, {
        mandateId,
        ...(requestedAmount !== undefined ? { amount: requestedAmount } : {}),
      });
    } catch (err) {
      const { code, message } = formatErrorReason(err);
      return halt(code, message);
    }

    if (!quote.confirmToken) {
      return halt(
        "MISSING_CONFIRM_TOKEN",
        "Quote response did not include a signed confirmToken. Execution halted.",
        quote
      );
    }

    // Check both quoted amount and requested tool amount against the mandate ceiling.
    const effectiveAmount =
      requestedAmount !== undefined
        ? Math.max(quote.amount, requestedAmount)
        : quote.amount;
    const budgetCheck = checkBudgetCeiling(effectiveAmount, quote.budgetCeiling);
    if (budgetCheck.exceeded) {
      return halt(
        "BUDGET_EXCEEDED",
        `Charge ($${effectiveAmount.toFixed(2)} ${quote.currency}) exceeds mandate "${quote.service}" ceiling ($${quote.budgetCeiling.toFixed(2)} ${quote.currency}) by $${budgetCheck.diff.toFixed(2)}.`,
        quote
      );
    }

    // Check for >20% price spike anomaly against baseline.
    const baseline = baselinePrice ?? quote.baselinePrice;
    const spikeCheck = checkPriceSpike(
      effectiveAmount,
      baseline,
      priceSpikeThresholdPercent
    );
    if (spikeCheck.isSpike) {
      const reason = `Price spike detected for "${quote.service}": +${spikeCheck.percentageJump}% above baseline ($${baseline?.toFixed(2)} -> $${effectiveAmount.toFixed(2)}).`;
      if (onApprovalRequired) {
        const approved = await onApprovalRequired({ mandateId, quote, reason });
        if (!approved) {
          return halt("APPROVAL_REQUIRED", `${reason} Human approval declined.`, quote);
        }
      } else {
        return halt("PRICE_SPIKE", reason, quote);
      }
    }

    const result = await toolFn(args, {
      mandateId,
      confirmToken: quote.confirmToken,
      quote,
    });

    return {
      ok: true,
      blocked: false,
      result,
      quote,
    };
  };
}
