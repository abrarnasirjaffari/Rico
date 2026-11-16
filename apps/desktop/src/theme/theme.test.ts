/**
 * Unit Tests for Desktop Native OS Dark / Light Theme Sync & Compact Laptop Mode (#74)
 * Run: npx tsx apps/desktop/src/theme/theme.test.ts
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  APPEARANCE_MODES,
  APPEARANCE_OPTIONS,
  APPEARANCE_STORAGE_KEY,
  AppearanceSegmentedControl,
  DARK_COLOR_SCHEME_QUERY,
  DEFAULT_APPEARANCE_MODE,
  DEFAULT_DENSITY_MODE,
  DEFAULT_RESOLVED_THEME,
  DENSITY_MODES,
  DENSITY_OPTIONS,
  DENSITY_STORAGE_KEY,
  DENSITY_TOKENS,
  THEME_COLOR_TOKENS,
  TRAY_VIEWPORT_DIMENSIONS,
  ThemeAndDensityProvider,
  applyThemeAndDensityToElement,
  buildCssVariableMap,
  createThemeAndDensityController,
  detectSystemTheme,
  estimateTrayVerticalBudgetPx,
  generateThemeStylesheet,
  getNextSegmentedOption,
  parseAppearanceMode,
  parseDensityMode,
  readStoredPreferences,
  resolveAppearanceTheme,
  subscribeToSystemThemeChanges,
  useThemeAndDensity,
  type MatchMediaLike,
  type MediaQueryListener,
  type StorageLike,
  type StyleTargetElement,
} from "./index";

function createMockMatchMedia(initialDark: boolean) {
  let matches = initialDark;
  const listeners = new Set<MediaQueryListener>();

  const matchMedia: MatchMediaLike = (query: string) => ({
    matches: query === DARK_COLOR_SCHEME_QUERY ? matches : false,
    media: query,
    addEventListener: (_type, listener) => {
      listeners.add(listener);
    },
    removeEventListener: (_type, listener) => {
      listeners.delete(listener);
    },
  });

  return {
    matchMedia,
    setSystemDark(nextDark: boolean) {
      matches = nextDark;
      for (const listener of listeners) {
        listener({ matches: nextDark });
      }
    },
    getListenerCount() {
      return listeners.size;
    },
  };
}

function createMockStorage(initial: Record<string, string> = {}): StorageLike & {
  dump: () => Record<string, string>;
} {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    dump() {
      return Object.fromEntries(store.entries());
    },
  };
}

function createMockTargetElement(): StyleTargetElement & {
  attributes: Record<string, string>;
  cssVars: Record<string, string>;
} {
  const attributes: Record<string, string> = {};
  const cssVars: Record<string, string> = {};
  const styleObj = {
    colorScheme: "",
    setProperty(property: string, value: string) {
      cssVars[property] = value;
    },
    getPropertyValue(property: string) {
      return cssVars[property] ?? "";
    },
  };

  return {
    attributes,
    cssVars,
    style: styleObj,
    setAttribute(name: string, value: string) {
      attributes[name] = value;
    },
    getAttribute(name: string) {
      return attributes[name] ?? null;
    },
  };
}

const tests: Array<[string, () => void]> = [
  [
    "1. OS prefers-color-scheme resolution (dark vs light) & live media-query change updates",
    () => {
      const env = createMockMatchMedia(false);
      const storage = createMockStorage();
      const target = createMockTargetElement();

      assert.strictEqual(detectSystemTheme(env.matchMedia), "light");

      const controller = createThemeAndDensityController({
        matchMedia: env.matchMedia,
        storage,
        targetElement: target,
      });

      assert.strictEqual(controller.getState().appearance, "system");
      assert.strictEqual(controller.getState().systemTheme, "light");
      assert.strictEqual(controller.getState().resolvedTheme, "light");
      assert.strictEqual(controller.getState().isDark, false);
      assert.strictEqual(target.attributes["data-theme"], "light");
      assert.strictEqual(target.attributes["data-appearance"], "system");
      assert.strictEqual(
        target.cssVars["--rico-bg-canvas"],
        THEME_COLOR_TOKENS.light["--rico-bg-canvas"]
      );

      // Simulate live OS switch to dark mode
      env.setSystemDark(true);
      assert.strictEqual(controller.getState().systemTheme, "dark");
      assert.strictEqual(controller.getState().resolvedTheme, "dark");
      assert.strictEqual(controller.getState().isDark, true);
      assert.strictEqual(target.attributes["data-theme"], "dark");
      assert.strictEqual(target.style?.colorScheme, "dark");
      assert.strictEqual(
        target.cssVars["--rico-bg-canvas"],
        THEME_COLOR_TOKENS.dark["--rico-bg-canvas"]
      );

      // Simulate live OS switch back to light mode
      env.setSystemDark(false);
      assert.strictEqual(controller.getState().resolvedTheme, "light");
      assert.strictEqual(target.attributes["data-theme"], "light");

      controller.dispose();
      assert.strictEqual(env.getListenerCount(), 0);
    },
  ],
  [
    "2. Manual overrides ('light', 'dark') take precedence over OS preference and revert cleanly to 'system'",
    () => {
      const env = createMockMatchMedia(true); // OS is dark
      const storage = createMockStorage();
      const target = createMockTargetElement();

      const controller = createThemeAndDensityController({
        matchMedia: env.matchMedia,
        storage,
        targetElement: target,
      });

      // Initially follows OS dark
      assert.strictEqual(controller.getState().resolvedTheme, "dark");

      // Manual override to light while OS is dark
      controller.setAppearance("light");
      assert.strictEqual(controller.getState().appearance, "light");
      assert.strictEqual(controller.getState().systemTheme, "dark");
      assert.strictEqual(controller.getState().resolvedTheme, "light");
      assert.strictEqual(target.attributes["data-theme"], "light");
      assert.strictEqual(storage.getItem(APPEARANCE_STORAGE_KEY), "light");

      // OS changes to light and back to dark while manual override is active
      env.setSystemDark(false);
      assert.strictEqual(controller.getState().resolvedTheme, "light");
      env.setSystemDark(true);
      assert.strictEqual(controller.getState().resolvedTheme, "light");

      // Manual override to dark while OS switches to light
      controller.setAppearance("dark");
      env.setSystemDark(false);
      assert.strictEqual(controller.getState().appearance, "dark");
      assert.strictEqual(controller.getState().systemTheme, "light");
      assert.strictEqual(controller.getState().resolvedTheme, "dark");
      assert.strictEqual(target.attributes["data-theme"], "dark");
      assert.strictEqual(storage.getItem(APPEARANCE_STORAGE_KEY), "dark");

      // Revert back to 'system' -> immediately syncs with current OS ('light')
      controller.setAppearance("system");
      assert.strictEqual(controller.getState().appearance, "system");
      assert.strictEqual(controller.getState().resolvedTheme, "light");
      assert.strictEqual(target.attributes["data-theme"], "light");
      assert.strictEqual(storage.getItem(APPEARANCE_STORAGE_KEY), "system");

      // Subsequent OS change to dark is reflected immediately again
      env.setSystemDark(true);
      assert.strictEqual(controller.getState().resolvedTheme, "dark");

      controller.dispose();
    },
  ],
  [
    "3. Density resolution ('comfortable' vs 'compact'), CSS token mapping, and 380x520 laptop tray calibration",
    () => {
      const env = createMockMatchMedia(false);
      const storage = createMockStorage();
      const target = createMockTargetElement();

      const controller = createThemeAndDensityController({
        matchMedia: env.matchMedia,
        storage,
        targetElement: target,
      });

      assert.strictEqual(controller.getState().density, "comfortable");
      assert.strictEqual(controller.getState().isCompact, false);
      assert.strictEqual(target.attributes["data-density"], "comfortable");
      assert.strictEqual(
        target.cssVars["--rico-size-row-height"],
        DENSITY_TOKENS.comfortable["--rico-size-row-height"]
      );

      // Switch to compact mode
      controller.setDensity("compact");
      assert.strictEqual(controller.getState().density, "compact");
      assert.strictEqual(controller.getState().isCompact, true);
      assert.strictEqual(target.attributes["data-density"], "compact");
      assert.strictEqual(storage.getItem(DENSITY_STORAGE_KEY), "compact");
      assert.strictEqual(
        target.cssVars["--rico-size-row-height"],
        DENSITY_TOKENS.compact["--rico-size-row-height"]
      );
      assert.strictEqual(
        target.cssVars["--rico-space-section-gap"],
        DENSITY_TOKENS.compact["--rico-space-section-gap"]
      );

      // Toggle density back and forth
      controller.toggleDensity();
      assert.strictEqual(controller.getState().density, "comfortable");
      controller.toggleDensity();
      assert.strictEqual(controller.getState().density, "compact");

      // Verify 380x520 vertical budget calibration
      const comfortableBudget = estimateTrayVerticalBudgetPx("comfortable", 4);
      const compactBudget = estimateTrayVerticalBudgetPx("compact", 4);
      assert.strictEqual(TRAY_VIEWPORT_DIMENSIONS.width, 380);
      assert.strictEqual(TRAY_VIEWPORT_DIMENSIONS.height, 520);
      assert.ok(
        comfortableBudget.fitsInTrayViewport,
        `Comfortable budget (${comfortableBudget.totalHeightPx}px) must fit within 520px`
      );
      assert.ok(
        compactBudget.fitsInTrayViewport,
        `Compact budget (${compactBudget.totalHeightPx}px) must fit within 520px`
      );
      assert.ok(
        compactBudget.totalHeightPx < comfortableBudget.totalHeightPx,
        "Compact density must consume strictly less vertical height than comfortable density"
      );
      assert.ok(
        compactBudget.headroomPx >= 140,
        `Compact density should leave generous headroom on 13" laptop screens (got ${compactBudget.headroomPx}px)`
      );

      controller.dispose();
    },
  ],
  [
    "4. Safe fallback defaults when matchMedia or localStorage is unavailable, throws, or contains corrupted values",
    () => {
      // Null/unavailable storage & matchMedia
      const prefsWhenNull = readStoredPreferences(null);
      assert.strictEqual(prefsWhenNull.appearance, DEFAULT_APPEARANCE_MODE);
      assert.strictEqual(prefsWhenNull.density, DEFAULT_DENSITY_MODE);
      assert.strictEqual(detectSystemTheme(null), DEFAULT_RESOLVED_THEME);

      // Corrupted values in storage
      const corruptedStorage = createMockStorage({
        [APPEARANCE_STORAGE_KEY]: "neon-cyberpunk-invalid",
        [DENSITY_STORAGE_KEY]: "ultra- microscopic-invalid",
      });
      const prefsFromCorrupted = readStoredPreferences(corruptedStorage);
      assert.strictEqual(
        prefsFromCorrupted.appearance,
        DEFAULT_APPEARANCE_MODE
      );
      assert.strictEqual(prefsFromCorrupted.density, DEFAULT_DENSITY_MODE);

      // Throwing storage and throwing matchMedia
      const throwingStorage: StorageLike = {
        getItem() {
          throw new Error("SecurityError: localStorage disabled");
        },
        setItem() {
          throw new Error("QuotaExceededError");
        },
      };
      const throwingMatchMedia: MatchMediaLike = () => {
        throw new Error("matchMedia not supported");
      };

      const controller = createThemeAndDensityController({
        storage: throwingStorage,
        matchMedia: throwingMatchMedia,
        targetElement: null,
      });

      assert.strictEqual(controller.getState().appearance, "system");
      assert.strictEqual(controller.getState().resolvedTheme, "light");
      assert.strictEqual(controller.getState().density, "comfortable");

      // Updating state when storage throws should still update in-memory state cleanly
      controller.setAppearance("dark");
      controller.setDensity("compact");
      assert.strictEqual(controller.getState().appearance, "dark");
      assert.strictEqual(controller.getState().resolvedTheme, "dark");
      assert.strictEqual(controller.getState().density, "compact");

      // Invalid values passed at runtime fall back safely
      assert.strictEqual(parseAppearanceMode("invalid", "system"), "system");
      assert.strictEqual(parseDensityMode(12345, "comfortable"), "comfortable");
      assert.strictEqual(resolveAppearanceTheme("system", "dark"), "dark");
      assert.strictEqual(resolveAppearanceTheme("light", "dark"), "light");

      controller.dispose();
    },
  ],
  [
    "5. Legacy MediaQueryList addListener/removeListener fallback and DOM attribute application",
    () => {
      const legacyHandlers: MediaQueryListener[] = [];
      const legacyMatchMedia: MatchMediaLike = () => ({
        matches: false,
        addListener(listener) {
          legacyHandlers.push(listener);
        },
        removeListener(listener) {
          const idx = legacyHandlers.indexOf(listener);
          if (idx !== -1) {
            legacyHandlers.splice(idx, 1);
          }
        },
      });

      const observed: string[] = [];
      const unsubscribe = subscribeToSystemThemeChanges((theme) => {
        observed.push(theme);
      }, legacyMatchMedia);

      assert.strictEqual(legacyHandlers.length, 1, "Legacy listener registered");
      legacyHandlers[0]({ matches: true });
      assert.deepStrictEqual(observed, ["dark"]);
      unsubscribe();
      assert.strictEqual(legacyHandlers.length, 0, "Legacy listener cleaned up");

      const target = createMockTargetElement();
      const vars = applyThemeAndDensityToElement(
        target,
        "dark",
        "compact",
        "dark"
      );
      assert.strictEqual(vars["--rico-color-scheme"], "dark");
      assert.strictEqual(target.getAttribute?.("data-theme"), "dark");
      assert.strictEqual(target.getAttribute?.("data-density"), "compact");
      assert.strictEqual(target.getAttribute?.("data-appearance"), "dark");
    },
  ],
  [
    "6. ThemeAndDensityProvider, useThemeAndDensity, and AppearanceSegmentedControl accessibility & keyboard navigation",
    () => {
      // Keyboard roving option helper checks
      assert.strictEqual(
        getNextSegmentedOption(APPEARANCE_MODES, "system", "ArrowRight"),
        "light"
      );
      assert.strictEqual(
        getNextSegmentedOption(APPEARANCE_MODES, "light", "ArrowRight"),
        "dark"
      );
      assert.strictEqual(
        getNextSegmentedOption(APPEARANCE_MODES, "dark", "ArrowRight"),
        "system"
      );
      assert.strictEqual(
        getNextSegmentedOption(APPEARANCE_MODES, "system", "ArrowLeft"),
        "dark"
      );
      assert.strictEqual(
        getNextSegmentedOption(DENSITY_MODES, "comfortable", "ArrowDown"),
        "compact"
      );
      assert.strictEqual(
        getNextSegmentedOption(APPEARANCE_MODES, "light", "Home"),
        "system"
      );
      assert.strictEqual(
        getNextSegmentedOption(APPEARANCE_MODES, "light", "End"),
        "dark"
      );

      // Verify SSR rendering of ThemeAndDensityProvider + AppearanceSegmentedControl
      const storage = createMockStorage({
        [APPEARANCE_STORAGE_KEY]: "dark",
        [DENSITY_STORAGE_KEY]: "compact",
      });
      const env = createMockMatchMedia(false);

      function ReadoutProbe() {
        const ctx = useThemeAndDensity();
        return React.createElement(
          "div",
          {
            "data-state": `${ctx.appearance}:${ctx.resolvedTheme}:${ctx.density}`,
          },
          React.createElement(AppearanceSegmentedControl, {
            compactLabels: true,
          })
        );
      }

      const html = renderToStaticMarkup(
        React.createElement(ThemeAndDensityProvider, {
          storage,
          matchMedia: env.matchMedia,
          children: React.createElement(ReadoutProbe),
        })
      );

      assert.ok(
        html.includes('data-state="dark:dark:compact"'),
        "Provider resolves stored dark + compact state"
      );
      assert.ok(
        html.includes('role="radiogroup"'),
        "Renders accessible radiogroup containers"
      );
      assert.ok(
        html.includes('data-testid="appearance-option-dark"'),
        "Renders appearance radio buttons"
      );
      assert.ok(
        html.includes('data-testid="density-option-compact"'),
        "Renders density radio buttons"
      );
      assert.strictEqual(APPEARANCE_OPTIONS.length, 3);
      assert.strictEqual(DENSITY_OPTIONS.length, 2);

      // Ensure theme.css on disk contains all token keys from buildCssVariableMap
      const cssPath = path.join(
        process.cwd(),
        "apps/desktop/src/theme/theme.css"
      );
      const cssFileContent = readFileSync(cssPath, "utf8");
      const generatedCss = generateThemeStylesheet();
      for (const tokenKey of Object.keys(
        buildCssVariableMap("light", "comfortable")
      )) {
        assert.ok(
          cssFileContent.includes(tokenKey),
          `theme.css includes ${tokenKey}`
        );
        assert.ok(
          generatedCss.includes(tokenKey),
          `generateThemeStylesheet includes ${tokenKey}`
        );
      }
    },
  ],
];

let failed = 0;
for (const [name, run] of tests) {
  try {
    run();
    console.log(`PASS ${name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${name}\n`, error);
  }
}
console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);
