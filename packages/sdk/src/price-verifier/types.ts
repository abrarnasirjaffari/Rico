export type BillingPeriod =
  | "monthly"
  | "annually"
  | "quarterly"
  | "weekly"
  | "one_time";

export type PriceWarningCode =
  | "INVALID_INPUT"
  | "EMPTY_PAGE_TEXT"
  | "PRICE_NOT_FOUND"
  | "CURRENCY_MISMATCH"
  | "BILLING_PERIOD_MISMATCH"
  | "MINIMUM_SEATS_MULTIPLIER";

export interface VerifyQuotedPriceInput {
  quotedAmount: number;
  currency: string;
  billingPeriod: BillingPeriod;
  rawPageText: string;
}

export interface VerifyQuotedPriceResult {
  verified: boolean;
  warnings: string[];
  warningCodes: PriceWarningCode[];
  matchedSnippet?: string;
  effectiveMonthlyCost?: number;
  minimumSeats?: number;
  effectiveCheckoutTotal?: number;
}
