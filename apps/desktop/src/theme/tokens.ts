/**
 * Semantic CSS Variable Token Map & Types for Rico Desktop Companion (`380x520` tray window).
 * Calibrated for OpenCode OC-1 x Zephium light/dark appearances and 13" laptop compact mode.
 */

export type AppearanceMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";
export type DensityMode = "comfortable" | "compact";

export const APPEARANCE_MODES: readonly AppearanceMode[] = ["system", "light", "dark"] as const;
export const RESOLVED_THEMES: readonly ResolvedTheme[] = ["light", "dark"] as const;
export const DENSITY_MODES: readonly DensityMode[] = ["comfortable", "compact"] as const;

export const DEFAULT_APPEARANCE_MODE: AppearanceMode = "system";
export const DEFAULT_RESOLVED_THEME: ResolvedTheme = "light";
export const DEFAULT_DENSITY_MODE: DensityMode = "comfortable";

export const TRAY_VIEWPORT_DIMENSIONS = {
  width: 380,
  height: 520,
} as const;

export interface ThemeColorTokens {
  "--rico-bg-canvas": string;
  "--rico-bg-surface": string;
  "--rico-bg-elevated": string;
  "--rico-bg-subtle": string;
  "--rico-bg-hover": string;
  "--rico-border-subtle": string;
  "--rico-border-strong": string;
  "--rico-border-focus": string;
  "--rico-text-strong": string;
  "--rico-text-base": string;
  "--rico-text-muted": string;
  "--rico-text-on-accent": string;
  "--rico-accent-primary": string;
  "--rico-accent-soft": string;
  "--rico-status-success": string;
  "--rico-status-warning": string;
  "--rico-status-danger": string;
  "--rico-shadow-tray": string;
  "--rico-shadow-card": string;
  "--rico-shadow-thumb": string;
}

export interface DensityTokens {
  "--rico-tray-width": string;
  "--rico-tray-max-height": string;
  "--rico-space-shell-x": string;
  "--rico-space-shell-y": string;
  "--rico-space-section-gap": string;
  "--rico-space-card-pad": string;
  "--rico-space-row-gap": string;
  "--rico-size-header-height": string;
  "--rico-size-row-height": string;
  "--rico-size-control-height": string;
  "--rico-radius-card": string;
  "--rico-radius-control": string;
  "--rico-font-size-title": string;
  "--rico-font-size-body": string;
  "--rico-font-size-caption": string;
  "--rico-font-size-metric": string;
  "--rico-line-height-body": string;
}

export type ThemeCssVariableMap = Record<string, string>;

export const THEME_COLOR_TOKENS: Record<ResolvedTheme, ThemeColorTokens> = {
  light: {
    "--rico-bg-canvas": "#F8F7F7",
    "--rico-bg-surface": "#FFFFFF",
    "--rico-bg-elevated": "#FCFCFC",
    "--rico-bg-subtle": "#F1EFEF",
    "--rico-bg-hover": "#EBE8E8",
    "--rico-border-subtle": "#E6E4E3",
    "--rico-border-strong": "#D6D3D1",
    "--rico-border-focus": "#034CFF",
    "--rico-text-strong": "#1E1B1B",
    "--rico-text-base": "#5C5858",
    "--rico-text-muted": "#8A8585",
    "--rico-text-on-accent": "#FFFFFF",
    "--rico-accent-primary": "#034CFF",
    "--rico-accent-soft": "rgba(3, 76, 255, 0.10)",
    "--rico-status-success": "#10B981",
    "--rico-status-warning": "#F59E0B",
    "--rico-status-danger": "#EF4444",
    "--rico-shadow-tray": "0 12px 32px rgba(30, 27, 27, 0.12)",
    "--rico-shadow-card": "0 1px 2px rgba(30, 27, 27, 0.05)",
    "--rico-shadow-thumb": "0 1px 2px rgba(30, 27, 27, 0.08)",
  },
  dark: {
    "--rico-bg-canvas": "#121111",
    "--rico-bg-surface": "#1A1818",
    "--rico-bg-elevated": "#242121",
    "--rico-bg-subtle": "#201D1D",
    "--rico-bg-hover": "#2A2626",
    "--rico-border-subtle": "#2C2828",
    "--rico-border-strong": "#3D3838",
    "--rico-border-focus": "#4D82FF",
    "--rico-text-strong": "#F5F3F3",
    "--rico-text-base": "#B8B2B2",
    "--rico-text-muted": "#7D7777",
    "--rico-text-on-accent": "#FFFFFF",
    "--rico-accent-primary": "#3B76FF",
    "--rico-accent-soft": "rgba(59, 118, 255, 0.18)",
    "--rico-status-success": "#34D399",
    "--rico-status-warning": "#FBBF24",
    "--rico-status-danger": "#F87171",
    "--rico-shadow-tray": "0 14px 36px rgba(0, 0, 0, 0.52)",
    "--rico-shadow-card": "0 1px 3px rgba(0, 0, 0, 0.35)",
    "--rico-shadow-thumb": "0 1px 2px rgba(0, 0, 0, 0.45)",
  },
};

export const DENSITY_TOKENS: Record<DensityMode, DensityTokens> = {
  comfortable: {
    "--rico-tray-width": "380px",
    "--rico-tray-max-height": "520px",
    "--rico-space-shell-x": "14px",
    "--rico-space-shell-y": "12px",
    "--rico-space-section-gap": "10px",
    "--rico-space-card-pad": "12px",
    "--rico-space-row-gap": "8px",
    "--rico-size-header-height": "40px",
    "--rico-size-row-height": "36px",
    "--rico-size-control-height": "28px",
    "--rico-radius-card": "10px",
    "--rico-radius-control": "7px",
    "--rico-font-size-title": "14px",
    "--rico-font-size-body": "13px",
    "--rico-font-size-caption": "11.5px",
    "--rico-font-size-metric": "20px",
    "--rico-line-height-body": "1.4",
  },
  compact: {
    "--rico-tray-width": "380px",
    "--rico-tray-max-height": "520px",
    "--rico-space-shell-x": "10px",
    "--rico-space-shell-y": "8px",
    "--rico-space-section-gap": "6px",
    "--rico-space-card-pad": "8px",
    "--rico-space-row-gap": "4px",
    "--rico-size-header-height": "32px",
    "--rico-size-row-height": "28px",
    "--rico-size-control-height": "22px",
    "--rico-radius-card": "7px",
    "--rico-radius-control": "5px",
    "--rico-font-size-title": "12.5px",
    "--rico-font-size-body": "11.5px",
    "--rico-font-size-caption": "10.5px",
    "--rico-font-size-metric": "17px",
    "--rico-line-height-body": "1.25",
  },
};

export function getThemeColorTokens(theme: ResolvedTheme): ThemeColorTokens {
  return THEME_COLOR_TOKENS[theme];
}

export function getDensityTokens(density: DensityMode): DensityTokens {
  return DENSITY_TOKENS[density];
}

export function buildCssVariableMap(
  theme: ResolvedTheme,
  density: DensityMode
): ThemeCssVariableMap {
  return {
    "--rico-color-scheme": theme,
    ...THEME_COLOR_TOKENS[theme],
    ...DENSITY_TOKENS[density],
  };
}

function parsePx(pxValue: string): number {
  return Number.parseFloat(pxValue.replace("px", ""));
}

/**
 * Computes the vertical layout height for the standard 5 tray sections
 * (header, monthly burn card, 3 active mandate rows, pending approval hold bar, and footer)
 * to guarantee zero vertical overflow inside the 380x520 tray window.
 */
export function estimateTrayVerticalBudgetPx(
  density: DensityMode,
  mandateRowCount = 3
): {
  totalHeightPx: number;
  fitsInTrayViewport: boolean;
  headroomPx: number;
} {
  const tokens = DENSITY_TOKENS[density];
  const shellPadY = parsePx(tokens["--rico-space-shell-y"]) * 2;
  const sectionGap = parsePx(tokens["--rico-space-section-gap"]);
  const cardPad = parsePx(tokens["--rico-space-card-pad"]) * 2;
  const rowGap = parsePx(tokens["--rico-space-row-gap"]);
  const headerHeight = parsePx(tokens["--rico-size-header-height"]);
  const rowHeight = parsePx(tokens["--rico-size-row-height"]);
  const controlHeight = parsePx(tokens["--rico-size-control-height"]);
  const metricHeight = parsePx(tokens["--rico-font-size-metric"]) * 1.6;

  const burnCardHeight = cardPad + metricHeight + controlHeight;
  const mandatesCardHeight =
    cardPad +
    mandateRowCount * rowHeight +
    Math.max(0, mandateRowCount - 1) * rowGap;
  const holdApprovalBannerHeight = cardPad + rowHeight;
  const footerHeight = controlHeight + 8;

  const totalHeightPx = Math.round(
    shellPadY +
      headerHeight +
      burnCardHeight +
      mandatesCardHeight +
      holdApprovalBannerHeight +
      footerHeight +
      sectionGap * 4
  );

  const headroomPx = TRAY_VIEWPORT_DIMENSIONS.height - totalHeightPx;
  return {
    totalHeightPx,
    fitsInTrayViewport: totalHeightPx <= TRAY_VIEWPORT_DIMENSIONS.height,
    headroomPx,
  };
}

function formatCssDeclarations(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");
}

export function generateThemeStylesheet(): string {
  const lightVars = formatCssDeclarations({
    "--rico-color-scheme": "light",
    ...THEME_COLOR_TOKENS.light,
  });
  const darkVars = formatCssDeclarations({
    "--rico-color-scheme": "dark",
    ...THEME_COLOR_TOKENS.dark,
  });
  const comfortableVars = formatCssDeclarations({
    ...DENSITY_TOKENS.comfortable,
  });
  const compactVars = formatCssDeclarations({
    ...DENSITY_TOKENS.compact,
  });

  return [
    `:root,\n[data-theme="light"] {\n  color-scheme: light;\n${lightVars}\n}`,
    `[data-theme="dark"] {\n  color-scheme: dark;\n${darkVars}\n}`,
    `:root,\n[data-density="comfortable"] {\n${comfortableVars}\n}`,
    `[data-density="compact"] {\n${compactVars}\n}`,
  ].join("\n\n");
}
