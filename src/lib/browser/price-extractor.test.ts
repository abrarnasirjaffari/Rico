import { extractPriceFromText } from "./price-extractor";

/**
 * Companion regression suite for the price extractor (issue #27).
 *
 * Covers the four requested upgrades plus adversarial edge cases:
 *   1. CAD / AUD codes and the Yen (¥ / JPY) currency.
 *   2. Thousands-separated amounts (e.g. "$1,200.00") without truncating at the comma.
 *   3. Quarterly billing intervals ("/qtr", "per quarter", "quarterly").
 *   4. Boundary, empty and malformed inputs that must never crash.
 *
 * Runs with a plain TypeScript runner (no browser): `node --import tsx src/lib/browser/price-extractor.test.ts`.
 */

interface PriceCase {
  text: string;
  price: number | null;
  currency?: string;
  billingPeriod?: string;
  rawMatched?: string;
}

const cases: PriceCase[] = [
  // --- Existing behaviour must stay intact (regression guard) ---
  { text: "Netflix Standard HD - $15.49 / month", price: 15.49, currency: "USD", billingPeriod: "monthly" },
  { text: "Spotify Premium Individual is $11.99/mo", price: 11.99, currency: "USD", billingPeriod: "monthly" },
  { text: "GitHub Copilot Business: 19.00 USD per user/month", price: 19.0, currency: "USD", billingPeriod: "monthly" },
  { text: "Adobe Creative Cloud All Apps: €59.99/mo", price: 59.99, currency: "EUR", billingPeriod: "monthly" },

  // --- 1. International currencies (CAD / AUD / JPY) ---
  { text: "Basecamp CAD 49.99 per month", price: 49.99, currency: "CAD", billingPeriod: "monthly" },
  { text: "Plan price: 49.99 CAD / month", price: 49.99, currency: "CAD", billingPeriod: "monthly" },
  { text: "AUD 99.00 per month", price: 99.0, currency: "AUD", billingPeriod: "monthly" },
  { text: "Starter tier 89.00 AUD monthly", price: 89.0, currency: "AUD", billingPeriod: "monthly" },
  { text: "¥1500 / month", price: 1500, currency: "JPY", billingPeriod: "monthly" },
  { text: "Pro plan 9,800 JPY per month", price: 9800, currency: "JPY", billingPeriod: "monthly" },
  { text: "¥1,200.00 per month", price: 1200.0, currency: "JPY", billingPeriod: "monthly" },

  // --- 2. Comma / thousands-separated prices (must NOT truncate) ---
  { text: "Enterprise Suite $1,200.00 per month", price: 1200.0, currency: "USD", billingPeriod: "monthly", rawMatched: "$1,200.00" },
  { text: "Annual plan $1,200.00 / year", price: 1200.0, currency: "USD", billingPeriod: "annually" },
  { text: "Site licence €1,299.00 per month", price: 1299.0, currency: "EUR", billingPeriod: "monthly" },
  { text: "Deduct 12,500.00 USD / year", price: 12500.0, currency: "USD", billingPeriod: "annually" },
  { text: "$12,345.67/mo", price: 12345.67, currency: "USD", billingPeriod: "monthly" },

  // --- 3. Quarterly billing intervals ---
  { text: "$29.00 /qtr", price: 29.0, currency: "USD", billingPeriod: "quarterly" },
  { text: "$29.00 per quarter", price: 29.0, currency: "USD", billingPeriod: "quarterly" },
  { text: "Quarterly subscription: $29.00 USD", price: 29.0, currency: "USD", billingPeriod: "quarterly" },
  { text: "CAD 1,200.00 / quarter", price: 1200.0, currency: "CAD", billingPeriod: "quarterly" },

  // --- 4. Boundary / empty / malformed inputs ---
  { text: "$0.99", price: 0.99, currency: "USD", billingPeriod: "monthly" },
  { text: "$0.00", price: null },
  { text: "$0", price: null },
  { text: "", price: null },
  { text: "   ", price: null },
  { text: "No pricing information on this page", price: null },
  { text: "Save 20% on your next order", price: null },
];

let failures = 0;

function fail(c: PriceCase, detail: string): void {
  failures++;
  console.error(`PRICE_EXTRACTOR_FAIL: "${c.text}" -> ${detail}`);
}

for (const c of cases) {
  let res: ReturnType<typeof extractPriceFromText>;
  try {
    res = extractPriceFromText(c.text);
  } catch (err) {
    fail(c, `threw ${(err as Error).message}`);
    continue;
  }

  if (c.price === null) {
    if (res !== null) fail(c, `expected null but got ${JSON.stringify(res)}`);
    continue;
  }

  if (!res) {
    fail(c, `expected price ${c.price} ${c.currency ?? ""} but got null`);
    continue;
  }
  if (res.price !== c.price) {
    fail(c, `expected price ${c.price} but got ${res.price}`);
  }
  if (c.currency && res.currency !== c.currency) {
    fail(c, `expected currency ${c.currency} but got ${res.currency}`);
  }
  if (c.billingPeriod && res.billingPeriod !== c.billingPeriod) {
    fail(c, `expected billingPeriod ${c.billingPeriod} but got ${res.billingPeriod}`);
  }
  if (c.rawMatched && res.rawMatched !== c.rawMatched) {
    fail(c, `expected rawMatched "${c.rawMatched}" but got "${res.rawMatched}"`);
  }
}

// Adversarial: non-string inputs must degrade gracefully rather than crash.
for (const hostile of [null, undefined, 42, {}, []] as unknown as string[]) {
  try {
    const res = extractPriceFromText(hostile);
    if (res !== null) {
      failures++;
      console.error(`PRICE_EXTRACTOR_FAIL: hostile input ${JSON.stringify(hostile)} -> expected null, got ${JSON.stringify(res)}`);
    }
  } catch (err) {
    failures++;
    console.error(`PRICE_EXTRACTOR_FAIL: hostile input ${JSON.stringify(hostile)} -> threw ${(err as Error).message}`);
  }
}

// Adversarial: rapid repeated extraction must be deterministic (no shared mutable state).
const first = extractPriceFromText("Enterprise Suite $1,200.00 per quarter");
for (let i = 0; i < 1000; i++) {
  const again = extractPriceFromText("Enterprise Suite $1,200.00 per quarter");
  if (JSON.stringify(again) !== JSON.stringify(first)) {
    failures++;
    console.error(`PRICE_EXTRACTOR_FAIL: non-deterministic result on iteration ${i}: ${JSON.stringify(again)}`);
    break;
  }
}

if (failures > 0) {
  console.error(`\nPRICE_EXTRACTOR_FAIL: ${failures} price extractor assertion(s) failed.`);
  process.exit(1);
}

console.log(`✅ Price extractor: all ${cases.length} cases + adversarial checks passed.`);
