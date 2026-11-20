/**
 * Financial Price & Currency Extractor for Web Pages
 */

export interface ExtractedPriceInfo {
  price: number;
  currency: string;
  billingPeriod: string;
  rawMatched: string;
}

const CURRENCY_MAP: Record<string, string> = {
  "$": "USD",
  "USD": "USD",
  "€": "EUR",
  "EUR": "EUR",
  "£": "GBP",
  "GBP": "GBP",
  "¥": "JPY",
  "JPY": "JPY",
  "CAD": "CAD",
  "AUD": "AUD",
};

/**
 * Recognized currency tokens (symbols + ISO codes). CAD, AUD and the Yen/JPY
 * pair are included so they resolve cleanly through CURRENCY_MAP.
 */
const CURRENCY_TOKEN = "(?:\\$|€|£|¥|USD|EUR|GBP|JPY|CAD|AUD)";

/**
 * Matchable amount. The thousands-separated alternative is listed first so a
 * value like "$1,200.00" is captured in full instead of truncating at the comma.
 */
const AMOUNT = "(?:\\d{1,3}(?:,\\d{3})+(?:\\.\\d{1,2})?|\\d+(?:\\.\\d{1,2})?)";

// Matches $15.49, $1,200.00, $1,200.00/mo, 15.99 USD, CAD 49.99, ¥1500, etc.
const PRICE_REGEX = new RegExp(
  `(?:(${CURRENCY_TOKEN})\\s*(${AMOUNT})|(${AMOUNT})\\s*(${CURRENCY_TOKEN}))`,
  "i"
);

/**
 * Extracts numeric price, currency symbol, and recurrence interval from text
 */
export function extractPriceFromText(text: string): ExtractedPriceInfo | null {
  if (!text || typeof text !== "string") return null;

  const match = text.match(PRICE_REGEX);
  if (!match) return null;

  const currencySymbol = (match[1] || match[4] || "$").toUpperCase();
  const amountStr = match[2] || match[3];
  if (!amountStr) return null;

  // Strip thousands separators (e.g. "1,200.00" -> "1200.00") before parsing.
  const price = parseFloat(amountStr.replace(/,/g, ""));
  if (isNaN(price) || price <= 0) return null;

  const currency = CURRENCY_MAP[currencySymbol] || "USD";

  // Detect billing frequency
  let billingPeriod = "monthly";
  const lower = text.toLowerCase();
  if (lower.includes("year") || lower.includes("/yr") || lower.includes("annual")) {
    billingPeriod = "annually";
  } else if (lower.includes("quarter") || lower.includes("/qtr") || lower.includes("qtr")) {
    billingPeriod = "quarterly";
  } else if (lower.includes("month") || lower.includes("/mo")) {
    billingPeriod = "monthly";
  } else if (lower.includes("week") || lower.includes("/wk")) {
    billingPeriod = "weekly";
  } else if (lower.includes("day") || lower.includes("/day")) {
    billingPeriod = "daily";
  }

  return {
    price,
    currency,
    billingPeriod,
    rawMatched: match[0],
  };
}
