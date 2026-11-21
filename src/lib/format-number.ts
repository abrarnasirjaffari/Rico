/**
 * Display-only financial & numeric formatting utilities (Spec v1.0).
 * Internal calculations always retain raw floating-point / decimal precision.
 */

export type FormatContext = "compact" | "detailed";

function isInvalidNumber(value: number | null | undefined): value is null | undefined {
  return value === null || value === undefined || !Number.isFinite(value);
}

function roundHalfAwayFromZero(value: number, decimals: number): number {
  if (value === 0) return 0;
  const factor = Math.pow(10, decimals);
  const sign = value < 0 ? -1 : 1;
  const rounded = Math.round(Math.abs(value) * factor + Number.EPSILON) / factor;
  return rounded === 0 ? 0 : sign * rounded;
}

function formatAbbreviated(absValue: number, decimals: number): string {
  const tiers: Array<{ threshold: number; suffix: string }> = [
    { threshold: 1e12, suffix: "T" },
    { threshold: 1e9, suffix: "B" },
    { threshold: 1e6, suffix: "M" },
    { threshold: 1e3, suffix: "K" },
  ];

  for (const tier of tiers) {
    if (absValue >= tier.threshold) {
      const scaled = roundHalfAwayFromZero(absValue / tier.threshold, decimals);
      const fixed = scaled.toFixed(decimals).replace(/\.?0+$/, "");
      return `${fixed}${tier.suffix}`;
    }
  }

  return absValue.toFixed(2);
}

export interface FormatFiatOptions {
  context?: FormatContext;
  signed?: boolean;
  currencySymbol?: string;
}

/**
 * Formats a USD / fiat value with strict guards against NaN, Infinity, scientific notation,
 * and signed zero (-$0.00).
 */
export function formatFiat(
  value: number | null | undefined,
  options: FormatFiatOptions = {}
): string {
  if (isInvalidNumber(value)) return "--";

  const { context = "detailed", signed = false, currencySymbol = "$" } = options;

  if (value === 0) return `${currencySymbol}0.00`;

  const abs = Math.abs(value);

  // Tiny non-zero amounts that would round to 0.00
  if (abs > 0 && abs < 0.005) {
    if (signed) {
      return value < 0 ? `-${`<${currencySymbol}0.01`}` : `+${`<${currencySymbol}0.01`}`;
    }
    return value < 0 ? `-${`<${currencySymbol}0.01`}` : `<${currencySymbol}0.01`;
  }

  const rounded = roundHalfAwayFromZero(value, 2);
  if (rounded === 0) return `${currencySymbol}0.00`;

  const signPrefix = rounded < 0 ? "-" : signed && rounded > 0 ? "+" : "";
  const absRounded = Math.abs(rounded);

  if (context === "compact" && absRounded >= 1000) {
    return `${signPrefix}${currencySymbol}${formatAbbreviated(absRounded, 1)}`;
  }

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absRounded);

  return `${signPrefix}${currencySymbol}${formatted}`;
}

/**
 * Formats a percentage value without scientific notation or signed zero.
 */
export function formatPercent(
  value: number | null | undefined,
  options: { signed?: boolean; decimals?: number } = {}
): string {
  if (isInvalidNumber(value)) return "--";
  if (value === 0) return "0.00%";

  const { signed = false, decimals } = options;
  const abs = Math.abs(value);

  if (abs > 0 && abs < 0.005) {
    if (signed) {
      return value < 0 ? "-<0.01%" : "+<0.01%";
    }
    return value < 0 ? "-<0.01%" : "<0.01%";
  }

  const computedDecimals =
    decimals !== undefined ? decimals : abs >= 1000 ? 0 : abs >= 100 ? 1 : 2;
  const rounded = roundHalfAwayFromZero(value, computedDecimals);
  if (rounded === 0) return "0.00%";

  const signPrefix = rounded < 0 ? "-" : signed && rounded > 0 ? "+" : "";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: computedDecimals,
    maximumFractionDigits: computedDecimals,
  }).format(Math.abs(rounded));

  return `${signPrefix}${formatted}%`;
}

/**
 * Produces an unformatted, full-precision decimal string for clipboard copy or CSV export.
 */
export function formatRawDecimal(value: number | null | undefined): string {
  if (isInvalidNumber(value)) return "";
  if (Object.is(value, -0) || value === 0) return "0";
  // Avoid scientific notation for extreme numbers
  const str = String(value);
  if (!str.includes("e") && !str.includes("E")) return str;
  return value.toLocaleString("en-US", {
    useGrouping: false,
    maximumFractionDigits: 18,
  });
}
