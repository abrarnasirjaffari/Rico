import type {
  BillingPeriod,
  PriceWarningCode,
  VerifyQuotedPriceInput,
  VerifyQuotedPriceResult,
} from "./types.ts";

interface ExtractedOccurrence {
  amount: number;
  currency: string;
  rawMatch: string;
  index: number;
  endIndex: number;
  hasExplicitCurrency: boolean;
}

const SYMBOL_TO_CURRENCY: Record<string, string> = {
  $: "USD",
  "US$": "USD",
  USD: "USD",
  "€": "EUR",
  EUR: "EUR",
  "£": "GBP",
  GBP: "GBP",
  "¥": "JPY",
  JPY: "JPY",
  "C$": "CAD",
  CAD: "CAD",
  "A$": "AUD",
  AUD: "AUD",
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function normalizeCurrency(raw: string): string {
  const upper = raw.trim().toUpperCase();
  return SYMBOL_TO_CURRENCY[upper] ?? upper;
}

function parseNumeric(raw: string): number {
  return Number(raw.replace(/,/g, ""));
}

function amountsMatch(a: number, b: number): boolean {
  return Math.abs(a - b) <= 0.01;
}

function extractPriceOccurrences(rawText: string): ExtractedOccurrence[] {
  const results: ExtractedOccurrence[] = [];

  // Match currency-prefixed prices ($1,200.00, US$19, EUR 29.99) or currency-suffixed (29.99 USD, 20$)
  // Avoid matching plain numbers like "5 seats" or "10%" or partial digits inside "$100".
  const pattern =
    /(?<![\d.,])(?:(US\$|C\$|A\$|\$|€|£|¥|USD|EUR|GBP|JPY|CAD|AUD)\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?|(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?\s*(USD|EUR|GBP|JPY|CAD|AUD|\$|€|£|¥))(?![\d%])/gi;

  for (const match of rawText.matchAll(pattern)) {
    const idx = match.index ?? 0;
    const prefixCur = match[1];
    const prefixInt = match[2];
    const prefixDec = match[3];
    const suffixInt = match[4];
    const suffixDec = match[5];
    const suffixCur = match[6];

    const intPart = prefixInt ?? suffixInt;
    const decPart = prefixDec ?? suffixDec;
    const curToken = prefixCur ?? suffixCur;
    if (!intPart || !curToken) continue;

    const numStr = decPart !== undefined ? `${intPart}.${decPart}` : intPart;
    const amount = parseNumeric(numStr);
    if (!Number.isFinite(amount) || amount < 0) continue;

    results.push({
      amount,
      currency: normalizeCurrency(curToken),
      rawMatch: match[0],
      index: idx,
      endIndex: idx + match[0].length,
      hasExplicitCurrency: true,
    });
  }

  return results;
}

function extractTierScopedSnippet(rawText: string, occ: ExtractedOccurrence): string {
  // Prefer the local paragraph/tier block when multi-line or pipe-separated pricing tiers exist.
  const blocks = rawText.split(/\n{2,}|\s*\|\s*/);
  let offset = 0;
  for (const block of blocks) {
    const start = rawText.indexOf(block, offset);
    if (start === -1) continue;
    const end = start + block.length;
    offset = end;

    if (occ.index >= start && occ.endIndex <= end && block.trim().length <= 260) {
      return block.trim();
    }
  }

  // Fallback to a bounded character window around the matched price.
  const winStart = Math.max(0, occ.index - 60);
  const winEnd = Math.min(rawText.length, occ.endIndex + 160);
  return rawText.slice(winStart, winEnd).replace(/\s+/g, " ").trim();
}

function detectMinimumSeats(text: string): number | undefined {
  const patterns = [
    /\bmin(?:imum)?(?:\s+of)?\s+(\d+)\s*(?:users?|seats?|members?|licenses?|editors?)\b/i,
    /\b(\d+)[\s-]*(?:user|seat|member|license|editor)s?\s+minimum\b/i,
    /\bstarts?\s+at\s+(\d+)\s*(?:users?|seats?|members?|licenses?|editors?)\b/i,
    /\bat\s+least\s+(\d+)\s*(?:users?|seats?|members?|licenses?|editors?)\b/i,
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) {
      const count = Number.parseInt(m[1], 10);
      if (Number.isFinite(count) && count > 1) {
        return count;
      }
    }
  }
  return undefined;
}

function detectPageBillingSignals(context: string): {
  mentionsBilledAnnually: boolean;
  mentionsPerYearPrice: boolean;
  mentionsBilledQuarterly: boolean;
  mentionsBilledMonthly: boolean;
} {
  const lower = context.toLowerCase();
  const mentionsBilledAnnually =
    /\b(?:billed|paid|charged)\s+(?:annually|yearly|per\s+year)\b/i.test(lower) ||
    /\bannual(?:ly)?\s+billing\b/i.test(lower) ||
    /\bannual\s+plan\s+only\b/i.test(lower);

  const mentionsPerYearPrice =
    /\/\s*(?:yr|year)\b/i.test(lower) || /\bper\s+year\b/i.test(lower);

  const mentionsBilledQuarterly =
    /\b(?:billed|paid)\s+quarterly\b/i.test(lower) ||
    /\/\s*(?:qtr|quarter)\b/i.test(lower);

  const mentionsBilledMonthly =
    /\b(?:billed|paid)\s+monthly\b/i.test(lower) ||
    /\bmonthly\s+billing\b/i.test(lower);

  return {
    mentionsBilledAnnually,
    mentionsPerYearPrice,
    mentionsBilledQuarterly,
    mentionsBilledMonthly,
  };
}

function computeEffectiveMonthlyCost(
  totalAmount: number,
  billingPeriod: BillingPeriod
): number | undefined {
  switch (billingPeriod) {
    case "monthly":
      return round2(totalAmount);
    case "annually":
      return round2(totalAmount / 12);
    case "quarterly":
      return round2(totalAmount / 3);
    case "weekly":
      return round2((totalAmount * 52) / 12);
    case "one_time":
      return undefined;
  }
}

/**
 * Deterministic grounding check that verifies an LLM-quoted price against raw SaaS pricing page text.
 * Fail-closed on ungrounded amounts, currency mismatches, "billed annually" vs monthly traps,
 * and unreflected minimum-seat multipliers.
 */
export function verifyQuotedPrice(
  input: VerifyQuotedPriceInput
): VerifyQuotedPriceResult {
  const warnings: string[] = [];
  const warningCodes: PriceWarningCode[] = [];

  if (
    typeof input?.quotedAmount !== "number" ||
    !Number.isFinite(input.quotedAmount) ||
    input.quotedAmount <= 0
  ) {
    return {
      verified: false,
      warnings: ["Quoted amount must be a positive finite number."],
      warningCodes: ["INVALID_INPUT"],
    };
  }

  if (!input.rawPageText || typeof input.rawPageText !== "string" || !input.rawPageText.trim()) {
    return {
      verified: false,
      warnings: ["Raw pricing page text is empty; quoted price cannot be grounded."],
      warningCodes: ["EMPTY_PAGE_TEXT"],
    };
  }

  const targetCurrency = normalizeCurrency(input.currency || "USD");
  const occurrences = extractPriceOccurrences(input.rawPageText);

  // 1. Direct amount match (exact currency preferred, otherwise currency mismatch candidate)
  const exactCurrencyMatches = occurrences.filter(
    (occ) => amountsMatch(occ.amount, input.quotedAmount) && occ.currency === targetCurrency
  );
  const anyCurrencyMatches = occurrences.filter((occ) =>
    amountsMatch(occ.amount, input.quotedAmount)
  );

  let matchedOcc: ExtractedOccurrence | undefined =
    exactCurrencyMatches[0] ?? anyCurrencyMatches[0];
  let matchedPreMultipliedSeats: number | undefined;

  // 2. Check if quotedAmount is already a pre-multiplied seat total (e.g. $12/seat * min 5 seats = $60)
  if (!matchedOcc) {
    for (const occ of occurrences) {
      const snippet = extractTierScopedSnippet(input.rawPageText, occ);
      const minSeats = detectMinimumSeats(snippet) ?? detectMinimumSeats(input.rawPageText);
      if (
        minSeats &&
        minSeats > 1 &&
        amountsMatch(occ.amount * minSeats, input.quotedAmount)
      ) {
        matchedOcc = occ;
        matchedPreMultipliedSeats = minSeats;
        break;
      }
    }
  }

  if (!matchedOcc) {
    return {
      verified: false,
      warnings: [
        `Quoted price (${targetCurrency} ${input.quotedAmount.toFixed(2)}) does not appear anywhere in the captured pricing page text.`,
      ],
      warningCodes: ["PRICE_NOT_FOUND"],
    };
  }

  const matchedSnippet = extractTierScopedSnippet(input.rawPageText, matchedOcc);

  if (matchedOcc.currency !== targetCurrency) {
    warningCodes.push("CURRENCY_MISMATCH");
    warnings.push(
      `Currency mismatch: quoted ${targetCurrency} ${input.quotedAmount.toFixed(2)}, but page snippet shows ${matchedOcc.currency} (${matchedOcc.rawMatch}).`
    );
  }

  // Check billing period traps in the matched snippet context
  const billingSignals = detectPageBillingSignals(matchedSnippet);
  if (input.billingPeriod === "monthly") {
    if (billingSignals.mentionsBilledAnnually) {
      warningCodes.push("BILLING_PERIOD_MISMATCH");
      warnings.push(
        `Billing period mismatch: ${matchedOcc.rawMatch} is marked as billed annually (effective $${round2(input.quotedAmount * 12).toFixed(2)}/yr commitment), not true monthly billing.`
      );
    } else if (billingSignals.mentionsPerYearPrice && !/\/\s*mo/i.test(matchedSnippet)) {
      warningCodes.push("BILLING_PERIOD_MISMATCH");
      warnings.push(
        `Billing period mismatch: ${matchedOcc.rawMatch} is listed as an annual price, but billingPeriod was passed as "monthly".`
      );
    } else if (billingSignals.mentionsBilledQuarterly) {
      warningCodes.push("BILLING_PERIOD_MISMATCH");
      warnings.push(
        `Billing period mismatch: ${matchedOcc.rawMatch} is billed quarterly, not monthly.`
      );
    }
  } else if (input.billingPeriod === "annually") {
    if (
      billingSignals.mentionsBilledMonthly &&
      !billingSignals.mentionsBilledAnnually &&
      !billingSignals.mentionsPerYearPrice
    ) {
      warningCodes.push("BILLING_PERIOD_MISMATCH");
      warnings.push(
        `Billing period mismatch: page states monthly billing (${matchedOcc.rawMatch}), but billingPeriod was passed as "annually".`
      );
    }
  }

  // Check minimum seat multipliers
  const minimumSeats =
    matchedPreMultipliedSeats ??
    detectMinimumSeats(matchedSnippet) ??
    detectMinimumSeats(input.rawPageText);

  let effectiveCheckoutTotal = input.quotedAmount;
  if (minimumSeats && minimumSeats > 1) {
    if (matchedPreMultipliedSeats) {
      effectiveCheckoutTotal = round2(matchedOcc.amount * matchedPreMultipliedSeats);
    } else if (amountsMatch(matchedOcc.amount, input.quotedAmount)) {
      effectiveCheckoutTotal = round2(matchedOcc.amount * minimumSeats);
      warningCodes.push("MINIMUM_SEATS_MULTIPLIER");
      warnings.push(
        `Minimum ${minimumSeats} seats required: per-seat quote (${targetCurrency} ${input.quotedAmount.toFixed(2)}) multiplies to an effective checkout total of ${targetCurrency} ${effectiveCheckoutTotal.toFixed(2)}.`
      );
    }
  }

  const effectiveMonthlyCost = computeEffectiveMonthlyCost(
    effectiveCheckoutTotal,
    input.billingPeriod
  );

  return {
    verified: warningCodes.length === 0,
    warnings,
    warningCodes,
    matchedSnippet,
    ...(effectiveMonthlyCost !== undefined ? { effectiveMonthlyCost } : {}),
    ...(minimumSeats !== undefined ? { minimumSeats } : {}),
    ...(effectiveCheckoutTotal !== input.quotedAmount || minimumSeats !== undefined
      ? { effectiveCheckoutTotal }
      : {}),
  };
}
