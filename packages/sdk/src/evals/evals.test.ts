import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EVAL_FIXTURES } from "./fixtures.ts";
import { runEvaluationSuite, evaluateGuardrails } from "./runner.ts";

describe("SDK Payment Guardrail Evaluation Suite", () => {
  it("contains at least 20 diverse evaluation fixtures covering all threat categories", () => {
    assert.ok(
      EVAL_FIXTURES.length >= 20,
      `Expected at least 20 evaluation fixtures, found ${EVAL_FIXTURES.length}`
    );

    const categories = new Set(EVAL_FIXTURES.map((f) => f.category));
    assert.ok(categories.has("PROMPT_INJECTION"), "Missing PROMPT_INJECTION category");
    assert.ok(categories.has("CURRENCY_SPOOFING"), "Missing CURRENCY_SPOOFING category");
    assert.ok(categories.has("PRICE_SPIKE"), "Missing PRICE_SPIKE category");
    assert.ok(categories.has("DUPLICATE_BILLING"), "Missing DUPLICATE_BILLING category");
    assert.ok(categories.has("BUDGET_CEILING"), "Missing BUDGET_CEILING category");
    assert.ok(categories.has("TOKEN_MANIPULATION"), "Missing TOKEN_MANIPULATION category");
    assert.ok(categories.has("BENIGN_BASELINE"), "Missing BENIGN_BASELINE category");
  });

  it("intercepts all prompt injection attacks attempting ceiling overrides", () => {
    const injections = EVAL_FIXTURES.filter((f) => f.category === "PROMPT_INJECTION");
    for (const testCase of injections) {
      const result = evaluateGuardrails(testCase);
      assert.equal(
        result.verdict,
        "REJECT",
        `Prompt injection fixture ${testCase.id} should have been rejected`
      );
      assert.equal(result.code, "OVER_BUDGET");
    }
  });

  it("catches currency swap and non-ISO symbol spoofing tricks", () => {
    const currencyCases = EVAL_FIXTURES.filter((f) => f.category === "CURRENCY_SPOOFING");
    for (const testCase of currencyCases) {
      const result = evaluateGuardrails(testCase);
      assert.equal(
        result.verdict,
        "REJECT",
        `Currency spoofing fixture ${testCase.id} should have been rejected`
      );
      assert.equal(result.code, "CURRENCY_MISMATCH");
    }
  });

  it("holds sudden renewal price spikes exceeding 20%", () => {
    const spikeCases = EVAL_FIXTURES.filter((f) => f.category === "PRICE_SPIKE");
    for (const testCase of spikeCases) {
      const result = evaluateGuardrails(testCase);
      assert.equal(
        result.verdict,
        "REJECT",
        `Price spike fixture ${testCase.id} should have been held`
      );
      assert.equal(result.code, "PRICE_SPIKE_HOLD");
    }
  });

  it("rejects duplicate billing submissions for already-settled periods", () => {
    const duplicateCases = EVAL_FIXTURES.filter((f) => f.category === "DUPLICATE_BILLING");
    for (const testCase of duplicateCases) {
      const result = evaluateGuardrails(testCase);
      assert.equal(
        result.verdict,
        "REJECT",
        `Duplicate billing fixture ${testCase.id} should have been rejected`
      );
    }
  });

  it("cleanly approves valid benign baseline invoices without false positives", () => {
    const benignCases = EVAL_FIXTURES.filter((f) => f.category === "BENIGN_BASELINE");
    for (const testCase of benignCases) {
      const result = evaluateGuardrails(testCase);
      assert.equal(
        result.verdict,
        "APPROVE",
        `Benign fixture ${testCase.id} should have been approved, got rejection: ${result.reason}`
      );
    }
  });

  it("achieves 100% scorecard pass rate across the full benchmark suite", () => {
    const scorecard = runEvaluationSuite(EVAL_FIXTURES);
    console.log("\n==========================================");
    console.log("   RICO PAYMENT GUARDRAIL EVAL SCORECARD  ");
    console.log("==========================================");
    console.log(`Total Scenarios Tested : ${scorecard.total}`);
    console.log(`Passed                 : ${scorecard.passed}`);
    console.log(`Failed                 : ${scorecard.failed}`);
    console.log(`Benchmark Accuracy     : ${scorecard.accuracy.toFixed(1)}%`);
    console.log("------------------------------------------");
    for (const [cat, stats] of Object.entries(scorecard.categoryBreakdown)) {
      console.log(` - ${cat.padEnd(20)}: ${stats.passed}/${stats.total} passed`);
    }
    console.log("==========================================\n");

    assert.equal(scorecard.failed, 0, `Expected 0 evaluation failures, found ${scorecard.failed}`);
    assert.equal(scorecard.accuracy, 100);
  });
});
