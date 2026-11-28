import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { verifyQuotedPrice } from "./index.ts";

describe("Quoted-Price Grounding Verifier", () => {
  it("verifies a grounded monthly SaaS price cleanly", () => {
    const res = verifyQuotedPrice({
      quotedAmount: 20,
      currency: "USD",
      billingPeriod: "monthly",
      rawPageText: "Pro Plan: $20/month billed monthly. Cancel anytime. Includes unlimited projects.",
    });

    assert.equal(res.verified, true);
    assert.deepEqual(res.warnings, []);
    assert.equal(res.effectiveMonthlyCost, 20);
    assert.ok(res.matchedSnippet?.includes("$20/month"));
  });

  it("verifies a grounded annual SaaS price and computes effectiveMonthlyCost", () => {
    const res = verifyQuotedPrice({
      quotedAmount: 240,
      currency: "USD",
      billingPeriod: "annually",
      rawPageText: "Team Annual Plan: $240/year per workspace. Priority email support included.",
    });

    assert.equal(res.verified, true);
    assert.deepEqual(res.warnings, []);
    assert.equal(res.effectiveMonthlyCost, 20);
  });

  it("fails when quoted number does not appear anywhere in rawPageText (hallucinated discount)", () => {
    const res = verifyQuotedPrice({
      quotedAmount: 12,
      currency: "USD",
      billingPeriod: "monthly",
      rawPageText: "Plus Plan costs $29/month billed monthly with 100GB storage.",
    });

    assert.equal(res.verified, false);
    assert.ok(res.warningCodes.includes("PRICE_NOT_FOUND"));
  });

  it("avoids false positives on non-price numbers or substring numbers ($10 vs 10 seats / $100)", () => {
    const res = verifyQuotedPrice({
      quotedAmount: 10,
      currency: "USD",
      billingPeriod: "monthly",
      rawPageText: "Enterprise Plan: $100/month. Includes 10 seats and 10% uptime SLA credit.",
    });

    assert.equal(res.verified, false);
    assert.ok(res.warningCodes.includes("PRICE_NOT_FOUND"));
  });

  it("fails closed when page says 'per month, billed annually' while billingPeriod is monthly", () => {
    const res = verifyQuotedPrice({
      quotedAmount: 15,
      currency: "USD",
      billingPeriod: "monthly",
      rawPageText: "Notion Plus: $15 per month, billed annually. Save 20% vs monthly billing.",
    });

    assert.equal(res.verified, false);
    assert.ok(res.warningCodes.includes("BILLING_PERIOD_MISMATCH"));
    assert.equal(res.effectiveMonthlyCost, 15);
  });

  it("isolates pricing tiers so an annual Starter tier does not false-flag a monthly Pro tier", () => {
    const rawPageText = [
      "Starter Plan: $12/month billed annually.",
      "",
      "Pro Plan: $25/month billed monthly. Flexible month-to-month billing.",
    ].join("\n");

    const res = verifyQuotedPrice({
      quotedAmount: 25,
      currency: "USD",
      billingPeriod: "monthly",
      rawPageText,
    });

    assert.equal(res.verified, true);
    assert.deepEqual(res.warnings, []);
    assert.equal(res.effectiveMonthlyCost, 25);
  });

  it("fails closed when a minimum seat requirement multiplies the checkout total", () => {
    const res = verifyQuotedPrice({
      quotedAmount: 12,
      currency: "USD",
      billingPeriod: "monthly",
      rawPageText: "Business Plan: $12/seat/month billed monthly (minimum 5 seats required).",
    });

    assert.equal(res.verified, false);
    assert.ok(res.warningCodes.includes("MINIMUM_SEATS_MULTIPLIER"));
    assert.equal(res.minimumSeats, 5);
    assert.equal(res.effectiveCheckoutTotal, 60);
    assert.equal(res.effectiveMonthlyCost, 60);
  });

  it("verifies pre-multiplied seat total when minimum seats are already accounted for", () => {
    const res = verifyQuotedPrice({
      quotedAmount: 60,
      currency: "USD",
      billingPeriod: "monthly",
      rawPageText: "Business Plan: $12/seat/month billed monthly (min 5 seats).",
    });

    assert.equal(res.verified, true);
    assert.equal(res.minimumSeats, 5);
    assert.equal(res.effectiveCheckoutTotal, 60);
    assert.equal(res.effectiveMonthlyCost, 60);
  });

  it("supports comma-formatted prices and detects currency mismatches", () => {
    const commaOk = verifyQuotedPrice({
      quotedAmount: 1200,
      currency: "USD",
      billingPeriod: "annually",
      rawPageText: "Scale Plan: $1,200.00/year for up to 250k events.",
    });
    assert.equal(commaOk.verified, true);
    assert.equal(commaOk.effectiveMonthlyCost, 100);

    const eurMismatch = verifyQuotedPrice({
      quotedAmount: 29.99,
      currency: "USD",
      billingPeriod: "monthly",
      rawPageText: "Standard Plan: €29.99/month billed monthly.",
    });
    assert.equal(eurMismatch.verified, false);
    assert.ok(eurMismatch.warningCodes.includes("CURRENCY_MISMATCH"));
  });
});
