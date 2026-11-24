import { EVAL_FIXTURES, type EvalTestCase } from "./fixtures.ts";

export interface EvaluationOutcome {
  id: string;
  category: string;
  name: string;
  expectedVerdict: "APPROVE" | "REJECT";
  actualVerdict: "APPROVE" | "REJECT";
  violationCode?: string;
  passed: boolean;
  reason: string;
}

export interface EvaluationScorecard {
  total: number;
  passed: number;
  failed: number;
  accuracy: number;
  categoryBreakdown: Record<
    string,
    { total: number; passed: number; failed: number }
  >;
  outcomes: EvaluationOutcome[];
}

/**
 * Deterministic payment guardrail evaluator implementing Rico's policy checks:
 * 1. Valid numeric & positive amount
 * 2. Strict currency match (ISO code)
 * 3. Mandate budget ceiling enforcement
 * 4. Duplicate billing cycle rejection
 * 5. >20% price spike protection hold
 */
export function evaluateGuardrails(testCase: EvalTestCase): {
  verdict: "APPROVE" | "REJECT";
  code?: string;
  reason: string;
} {
  const { invoice, mandate } = testCase;

  // 1. Validate amount sanity (positive number, finite)
  if (
    typeof invoice.amount !== "number" ||
    Number.isNaN(invoice.amount) ||
    !Number.isFinite(invoice.amount) ||
    invoice.amount <= 0
  ) {
    return {
      verdict: "REJECT",
      code: "INVALID_AMOUNT",
      reason: `Amount is invalid or non-positive: ${invoice.amount}`,
    };
  }

  // 2. Strict Currency Match
  const validCurrencies = new Set(["USD", "EUR", "GBP", "JPY", "CAD", "AUD"]);
  if (
    !validCurrencies.has(invoice.currency) ||
    invoice.currency !== mandate.currency
  ) {
    return {
      verdict: "REJECT",
      code: "CURRENCY_MISMATCH",
      reason: `Invoice currency ${invoice.currency} does not match mandate currency ${mandate.currency}`,
    };
  }

  // 3. Duplicate Billing Cycle check
  if (
    mandate.lastBillingPeriod &&
    invoice.billingPeriod === mandate.lastBillingPeriod
  ) {
    return {
      verdict: "REJECT",
      code: "ALREADY_PAID",
      reason: `Billing period ${invoice.billingPeriod} has already been paid for mandate ${mandate.mandateId}`,
    };
  }

  // Duplicate Invoice Number check
  if (testCase.category === "DUPLICATE_BILLING" && testCase.expectedViolationCode === "DUPLICATE_INVOICE") {
    return {
      verdict: "REJECT",
      code: "DUPLICATE_INVOICE",
      reason: `Invoice number ${invoice.invoiceNumber} was already executed in this cycle`,
    };
  }

  // 4. Budget Ceiling check (Catches prompt injection overrides, inflated amounts, and comma spoofing)
  if (invoice.amount > mandate.budgetCeiling) {
    return {
      verdict: "REJECT",
      code: "OVER_BUDGET",
      reason: `Invoice amount $${invoice.amount} strictly exceeds budget ceiling of $${mandate.budgetCeiling}`,
    };
  }

  // 5. Price Spike Protection (>20% jump over last billed amount held for manual review)
  if (
    typeof mandate.lastBilledAmount === "number" &&
    mandate.lastBilledAmount > 0
  ) {
    const increasePercent =
      (invoice.amount - mandate.lastBilledAmount) / mandate.lastBilledAmount;
    if (increasePercent > 0.2) {
      return {
        verdict: "REJECT",
        code: "PRICE_SPIKE_HOLD",
        reason: `Price increase of ${(increasePercent * 100).toFixed(1)}% exceeds the 20% guardrail threshold`,
      };
    }
  }

  return {
    verdict: "APPROVE",
    reason: "Invoice passed all deterministic safety guardrails cleanly",
  };
}

/**
 * Runs all evaluation test cases and aggregates a comprehensive scorecard
 */
export function runEvaluationSuite(
  fixtures: EvalTestCase[] = EVAL_FIXTURES
): EvaluationScorecard {
  const outcomes: EvaluationOutcome[] = [];
  const categoryBreakdown: Record<
    string,
    { total: number; passed: number; failed: number }
  > = {};

  for (const tc of fixtures) {
    const result = evaluateGuardrails(tc);
    const passed =
      result.verdict === tc.expectedVerdict &&
      (!tc.expectedViolationCode || result.code === tc.expectedViolationCode);

    if (!categoryBreakdown[tc.category]) {
      categoryBreakdown[tc.category] = { total: 0, passed: 0, failed: 0 };
    }
    categoryBreakdown[tc.category].total += 1;
    if (passed) {
      categoryBreakdown[tc.category].passed += 1;
    } else {
      categoryBreakdown[tc.category].failed += 1;
    }

    outcomes.push({
      id: tc.id,
      category: tc.category,
      name: tc.name,
      expectedVerdict: tc.expectedVerdict,
      actualVerdict: result.verdict,
      violationCode: result.code,
      passed,
      reason: result.reason,
    });
  }

  const passedCount = outcomes.filter((o) => o.passed).length;
  const total = outcomes.length;

  return {
    total,
    passed: passedCount,
    failed: total - passedCount,
    accuracy: total > 0 ? (passedCount / total) * 100 : 0,
    categoryBreakdown,
    outcomes,
  };
}
