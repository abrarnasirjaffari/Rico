# Quoted-Price Grounding Verifier (`packages/sdk/src/price-verifier/`)

- **Target PR Base Branch:** `track/sdk`
- **Issue:** [#63 — Quoted-Price Grounding Verifier Against Raw Pricing Text](https://github.com/abrarnasirjaffari/Rico/issues/63)

Deterministic zero-dependency grounding check that verifies LLM-extracted SaaS prices against raw pricing page text before quoting a payment.

## Usage

```ts
import { verifyQuotedPrice } from "./index.ts";

const check = verifyQuotedPrice({
  quotedAmount: 15,
  currency: "USD",
  billingPeriod: "monthly",
  rawPageText: "Plus Plan: $15 per month, billed annually (minimum 3 users).",
});

// check.verified === false
// check.warningCodes === ["BILLING_PERIOD_MISMATCH", "MINIMUM_SEATS_MULTIPLIER"]
```

### Fail-Closed Defaults
- **"Per month, billed annually"** when `billingPeriod === "monthly"` returns `verified: false` (`BILLING_PERIOD_MISMATCH`).
- **Unreflected minimum-seat multiplier** (e.g., quoting per-seat `$12` when `"minimum 5 seats"` is required) returns `verified: false` (`MINIMUM_SEATS_MULTIPLIER`) with `effectiveCheckoutTotal: 60` and `effectiveMonthlyCost: 60`. Pre-multiplied totals (`60`) pass as `verified: true`.

## Run Tests

```bash
npx tsx packages/sdk/src/price-verifier/price-verifier.test.ts
```
