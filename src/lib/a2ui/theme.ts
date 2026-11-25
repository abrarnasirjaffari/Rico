import type React from "react";

const HEX_6_RE = /^#([0-9a-fA-F]{6})$/;
const HEX_3_RE = /^#([0-9a-fA-F]{3})$/;

export function normalizeHexColor(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (HEX_6_RE.test(trimmed)) return trimmed.toLowerCase();
  const m3 = trimmed.match(HEX_3_RE);
  if (m3) {
    const [r, g, b] = m3[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Fallback topic/brand accent color resolver when a surface does not
 * explicitly specify `$/theme/accent` in its dataModel.
 */
export function inferAccentFromText(text: string): string {
  const t = text.toLowerCase();

  // Specific well-known brands first
  if (/\bnetflix\b/.test(t)) return "#dc2626";
  if (/\bspotify\b/.test(t)) return "#15803d";
  if (/\b(aws|amazon web services|ec2|lambda)\b/.test(t)) return "#d97706";
  if (/\bstripe\b/.test(t)) return "#635bff";
  if (/\bpaypal\b/.test(t)) return "#0070ba";
  if (/\b(anthropic|claude)\b/.test(t)) return "#c2410c";
  if (/\b(openai|chatgpt)\b/.test(t)) return "#0d9488";
  if (/\b(figma|adobe|canva|dribbble)\b/.test(t)) return "#e11d48";
  if (/\b(vercel|render|netlify|fly\.io|railway|heroku|hosting|deploy)\b/.test(t))
    return "#4f46e5";
  if (/\b(discord|slack|linear|notion)\b/.test(t)) return "#5865f2";

  // Domain / semantic topics
  if (
    /\b(runway|revenue|mrr|arr|profit|savings|credit|tax|cash|investment|margin|equity)\b/.test(
      t
    )
  ) {
    return "#059669"; // Emerald for finance / growth / savings
  }
  if (
    /\b(budget|burn|cost|spend|expense|alert|warning|ceiling|limit|cap|billing|invoice)\b/.test(
      t
    )
  ) {
    return "#d97706"; // Warm amber for budgets & cost controls
  }
  if (
    /\b(ai|llm|api|model|cloud|server|database|code|dev|github|software|saas|stack)\b/.test(
      t
    )
  ) {
    return "#6366f1"; // Indigo for dev / AI / cloud
  }
  if (/\b(travel|flight|hotel|trip|health|fitness|food|recipe|wellness)\b/.test(t)) {
    return "#0d9488"; // Teal for travel / lifestyle / wellness
  }
  if (/\b(design|creative|marketing|music|video|movie|stream|brand|social)\b/.test(t)) {
    return "#e11d48"; // Rose for creative / media / entertainment
  }

  return "#0285ff";
}

/**
 * Extracts `$/theme/accent` from raw A2UI wire messages if set by the agent,
 * otherwise infers an appropriate topic/brand accent from the surface content.
 */
export function resolveA2uiSurfaceAccent(
  explicitAccent: unknown,
  fallbackCorpus: string
): string {
  const valid = normalizeHexColor(explicitAccent);
  if (valid) return valid;
  return inferAccentFromText(fallbackCorpus);
}

/**
 * Builds scoped CSS custom properties for an A2UI surface container so each
 * surface adopts its question-matched palette cleanly in both light and dark modes.
 */
export function buildA2uiSurfaceThemeStyle(accentHex: string): React.CSSProperties {
  const hex = normalizeHexColor(accentHex) ?? "#0285ff";
  const onPrimary = relativeLuminance(hex) > 0.42 ? "#0f172a" : "#ffffff";

  return {
    "--a2ui-color-primary": hex,
    "--a2ui-color-primary-hover": `color-mix(in srgb, ${hex} 85%, #000000)`,
    "--a2ui-color-primary-light": `color-mix(in srgb, ${hex} 85%, #ffffff)`,
    "--a2ui-color-primary-dark": `color-mix(in srgb, ${hex} 80%, #000000)`,
    "--a2ui-color-on-primary": onPrimary,
    "--a2ui-slider-thumb-color": hex,
    "--a2ui-tabs-header-color-active": hex,
    "--a2ui-color-secondary": `color-mix(in srgb, ${hex} 10%, var(--rico-iui-surface))`,
    "--a2ui-color-secondary-hover": `color-mix(in srgb, ${hex} 18%, var(--rico-iui-surface))`,
    "--a2ui-color-border": `color-mix(in srgb, ${hex} 20%, var(--rico-iui-border))`,
    "--a2ui-color-surface": `color-mix(in srgb, ${hex} 4%, var(--rico-iui-canvas))`,
  } as React.CSSProperties;
}
