"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  APPEARANCE_MODES,
  DEFAULT_APPEARANCE_MODE,
  DEFAULT_DENSITY_MODE,
  DEFAULT_RESOLVED_THEME,
  DENSITY_MODES,
  buildCssVariableMap,
  type AppearanceMode,
  type DensityMode,
  type ResolvedTheme,
  type ThemeCssVariableMap,
} from "./tokens";

export const APPEARANCE_STORAGE_KEY = "rico.desktop.appearance";
export const DENSITY_STORAGE_KEY = "rico.desktop.density";
export const DARK_COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface MediaQueryChangeEventLike {
  matches: boolean;
}

export type MediaQueryListener = (event: MediaQueryChangeEventLike) => void;

export interface MediaQueryListLike {
  matches: boolean;
  media?: string;
  addEventListener?: (type: "change", listener: MediaQueryListener) => void;
  removeEventListener?: (type: "change", listener: MediaQueryListener) => void;
  addListener?: (listener: MediaQueryListener) => void;
  removeListener?: (listener: MediaQueryListener) => void;
}

export type MatchMediaLike = (query: string) => MediaQueryListLike;

export interface StyleTargetElement {
  setAttribute(name: string, value: string): void;
  getAttribute?(name: string): string | null;
  style?: {
    colorScheme?: string;
    setProperty(property: string, value: string): void;
    getPropertyValue?(property: string): string;
  };
}

export interface ThemeAndDensityState {
  appearance: AppearanceMode;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  density: DensityMode;
  isDark: boolean;
  isCompact: boolean;
  cssVariables: ThemeCssVariableMap;
}

export interface ThemeAndDensityContextValue extends ThemeAndDensityState {
  setAppearance: (mode: AppearanceMode) => void;
  setDensity: (density: DensityMode) => void;
  toggleDensity: () => void;
}

export function isAppearanceMode(value: unknown): value is AppearanceMode {
  return (
    typeof value === "string" &&
    (APPEARANCE_MODES as readonly string[]).includes(value)
  );
}

export function isDensityMode(value: unknown): value is DensityMode {
  return (
    typeof value === "string" &&
    (DENSITY_MODES as readonly string[]).includes(value)
  );
}

export function parseAppearanceMode(
  value: unknown,
  fallback: AppearanceMode = DEFAULT_APPEARANCE_MODE
): AppearanceMode {
  return isAppearanceMode(value) ? value : fallback;
}

export function parseDensityMode(
  value: unknown,
  fallback: DensityMode = DEFAULT_DENSITY_MODE
): DensityMode {
  return isDensityMode(value) ? value : fallback;
}

function getDefaultStorage(): StorageLike | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Graceful fallback when localStorage is blocked or unavailable in SSR/Node
  }
  return null;
}

function getDefaultMatchMedia(): MatchMediaLike | null {
  try {
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function"
    ) {
      return window.matchMedia.bind(window);
    }
  } catch {
    // Graceful fallback when matchMedia is unavailable
  }
  return null;
}

function getDefaultTargetElement(): StyleTargetElement | null {
  try {
    if (typeof document !== "undefined" && document.documentElement) {
      return document.documentElement;
    }
  } catch {
    // Graceful fallback in non-DOM environments
  }
  return null;
}

export function readStoredPreferences(
  storage?: StorageLike | null,
  defaults: {
    appearance?: AppearanceMode;
    density?: DensityMode;
  } = {}
): {
  appearance: AppearanceMode;
  density: DensityMode;
} {
  const fallbackAppearance = defaults.appearance ?? DEFAULT_APPEARANCE_MODE;
  const fallbackDensity = defaults.density ?? DEFAULT_DENSITY_MODE;
  const resolvedStorage = storage === undefined ? getDefaultStorage() : storage;

  if (!resolvedStorage) {
    return {
      appearance: fallbackAppearance,
      density: fallbackDensity,
    };
  }

  let rawAppearance: unknown = null;
  let rawDensity: unknown = null;

  try {
    rawAppearance = resolvedStorage.getItem(APPEARANCE_STORAGE_KEY);
  } catch {
    rawAppearance = null;
  }

  try {
    rawDensity = resolvedStorage.getItem(DENSITY_STORAGE_KEY);
  } catch {
    rawDensity = null;
  }

  return {
    appearance: parseAppearanceMode(rawAppearance, fallbackAppearance),
    density: parseDensityMode(rawDensity, fallbackDensity),
  };
}

export function writeStoredPreference(
  key: string,
  value: string,
  storage?: StorageLike | null
): boolean {
  const resolvedStorage = storage === undefined ? getDefaultStorage() : storage;
  if (!resolvedStorage) return false;

  try {
    resolvedStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function detectSystemTheme(
  matchMediaFn?: MatchMediaLike | null
): ResolvedTheme {
  const resolvedMatchMedia =
    matchMediaFn === undefined ? getDefaultMatchMedia() : matchMediaFn;
  if (!resolvedMatchMedia) {
    return DEFAULT_RESOLVED_THEME;
  }

  try {
    const mql = resolvedMatchMedia(DARK_COLOR_SCHEME_QUERY);
    if (mql && typeof mql.matches === "boolean") {
      return mql.matches ? "dark" : "light";
    }
  } catch {
    // Safe fallback if matchMedia throws
  }
  return DEFAULT_RESOLVED_THEME;
}

export function resolveAppearanceTheme(
  appearance: AppearanceMode,
  systemTheme: ResolvedTheme
): ResolvedTheme {
  if (appearance === "light" || appearance === "dark") {
    return appearance;
  }
  return systemTheme;
}

export function subscribeToSystemThemeChanges(
  onChange: (systemTheme: ResolvedTheme) => void,
  matchMediaFn?: MatchMediaLike | null
): () => void {
  const resolvedMatchMedia =
    matchMediaFn === undefined ? getDefaultMatchMedia() : matchMediaFn;
  if (!resolvedMatchMedia) {
    return () => {};
  }

  let mql: MediaQueryListLike | null = null;
  try {
    mql = resolvedMatchMedia(DARK_COLOR_SCHEME_QUERY);
  } catch {
    return () => {};
  }

  if (!mql) {
    return () => {};
  }

  const listener: MediaQueryListener = (event) => {
    const isDark =
      typeof event?.matches === "boolean"
        ? event.matches
        : Boolean(mql?.matches);
    onChange(isDark ? "dark" : "light");
  };

  try {
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", listener);
      return () => {
        try {
          mql?.removeEventListener?.("change", listener);
        } catch {
          // Ignore cleanup errors
        }
      };
    }

    if (typeof mql.addListener === "function") {
      mql.addListener(listener);
      return () => {
        try {
          mql?.removeListener?.(listener);
        } catch {
          // Ignore cleanup errors
        }
      };
    }
  } catch {
    // Ignore listener registration errors
  }

  return () => {};
}

export function applyThemeAndDensityToElement(
  target: StyleTargetElement | null | undefined,
  resolvedTheme: ResolvedTheme,
  density: DensityMode,
  appearance: AppearanceMode = DEFAULT_APPEARANCE_MODE
): ThemeCssVariableMap {
  const vars = buildCssVariableMap(resolvedTheme, density);
  if (!target) {
    return vars;
  }

  try {
    target.setAttribute("data-theme", resolvedTheme);
    target.setAttribute("data-density", density);
    target.setAttribute("data-appearance", appearance);

    if (target.style) {
      target.style.colorScheme = resolvedTheme;
      for (const [prop, val] of Object.entries(vars)) {
        target.style.setProperty(prop, val);
      }
    }
  } catch {
    // Ignore DOM mutation failures in restricted environments
  }

  return vars;
}

export interface ThemeAndDensityControllerOptions {
  defaultAppearance?: AppearanceMode;
  defaultDensity?: DensityMode;
  storage?: StorageLike | null;
  matchMedia?: MatchMediaLike | null;
  targetElement?: StyleTargetElement | null;
}

export interface ThemeAndDensityController {
  getState: () => ThemeAndDensityState;
  setAppearance: (mode: AppearanceMode) => void;
  setDensity: (density: DensityMode) => void;
  toggleDensity: () => void;
  subscribe: (listener: (state: ThemeAndDensityState) => void) => () => void;
  dispose: () => void;
}

export function createThemeAndDensityController(
  options: ThemeAndDensityControllerOptions = {}
): ThemeAndDensityController {
  const storage =
    options.storage === undefined ? getDefaultStorage() : options.storage;
  const matchMediaFn =
    options.matchMedia === undefined
      ? getDefaultMatchMedia()
      : options.matchMedia;
  const targetElement =
    options.targetElement === undefined
      ? getDefaultTargetElement()
      : options.targetElement;

  const initialPrefs = readStoredPreferences(storage, {
    appearance: options.defaultAppearance ?? DEFAULT_APPEARANCE_MODE,
    density: options.defaultDensity ?? DEFAULT_DENSITY_MODE,
  });

  let appearance: AppearanceMode = initialPrefs.appearance;
  let density: DensityMode = initialPrefs.density;
  let systemTheme: ResolvedTheme = detectSystemTheme(matchMediaFn);

  const listeners = new Set<(state: ThemeAndDensityState) => void>();

  function computeState(): ThemeAndDensityState {
    const resolvedTheme = resolveAppearanceTheme(appearance, systemTheme);
    const cssVariables = applyThemeAndDensityToElement(
      targetElement,
      resolvedTheme,
      density,
      appearance
    );
    return {
      appearance,
      resolvedTheme,
      systemTheme,
      density,
      isDark: resolvedTheme === "dark",
      isCompact: density === "compact",
      cssVariables,
    };
  }

  let currentState = computeState();

  function notify() {
    currentState = computeState();
    for (const listener of listeners) {
      listener(currentState);
    }
  }

  const unsubscribeMedia = subscribeToSystemThemeChanges((nextSystemTheme) => {
    systemTheme = nextSystemTheme;
    notify();
  }, matchMediaFn);

  return {
    getState: () => currentState,
    setAppearance: (nextMode: AppearanceMode) => {
      const validated = parseAppearanceMode(nextMode, appearance);
      appearance = validated;
      writeStoredPreference(APPEARANCE_STORAGE_KEY, validated, storage);
      notify();
    },
    setDensity: (nextDensity: DensityMode) => {
      const validated = parseDensityMode(nextDensity, density);
      density = validated;
      writeStoredPreference(DENSITY_STORAGE_KEY, validated, storage);
      notify();
    },
    toggleDensity: () => {
      const nextDensity: DensityMode =
        density === "comfortable" ? "compact" : "comfortable";
      density = nextDensity;
      writeStoredPreference(DENSITY_STORAGE_KEY, nextDensity, storage);
      notify();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose: () => {
      unsubscribeMedia();
      listeners.clear();
    },
  };
}

const ThemeAndDensityContext =
  createContext<ThemeAndDensityContextValue | null>(null);

export interface ThemeAndDensityProviderProps {
  children: React.ReactNode;
  defaultAppearance?: AppearanceMode;
  defaultDensity?: DensityMode;
  storage?: StorageLike | null;
  matchMedia?: MatchMediaLike | null;
  targetElement?: StyleTargetElement | null;
}

export function ThemeAndDensityProvider({
  children,
  defaultAppearance = DEFAULT_APPEARANCE_MODE,
  defaultDensity = DEFAULT_DENSITY_MODE,
  storage,
  matchMedia: matchMediaProp,
  targetElement,
}: ThemeAndDensityProviderProps) {
  const initialPrefs = useMemo(
    () =>
      readStoredPreferences(storage, {
        appearance: defaultAppearance,
        density: defaultDensity,
      }),
    [storage, defaultAppearance, defaultDensity]
  );

  const [appearance, setAppearanceState] = useState<AppearanceMode>(
    initialPrefs.appearance
  );
  const [density, setDensityState] = useState<DensityMode>(
    initialPrefs.density
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() =>
    detectSystemTheme(matchMediaProp)
  );

  useEffect(() => {
    setSystemTheme(detectSystemTheme(matchMediaProp));
    return subscribeToSystemThemeChanges((nextSystemTheme) => {
      setSystemTheme(nextSystemTheme);
    }, matchMediaProp);
  }, [matchMediaProp]);

  const resolvedTheme = useMemo(
    () => resolveAppearanceTheme(appearance, systemTheme),
    [appearance, systemTheme]
  );

  const cssVariables = useMemo(
    () => buildCssVariableMap(resolvedTheme, density),
    [resolvedTheme, density]
  );

  useEffect(() => {
    const resolvedTarget =
      targetElement === undefined ? getDefaultTargetElement() : targetElement;
    applyThemeAndDensityToElement(
      resolvedTarget,
      resolvedTheme,
      density,
      appearance
    );
  }, [targetElement, resolvedTheme, density, appearance]);

  const setAppearance = useCallback(
    (mode: AppearanceMode) => {
      const next = parseAppearanceMode(mode, DEFAULT_APPEARANCE_MODE);
      setAppearanceState(next);
      writeStoredPreference(APPEARANCE_STORAGE_KEY, next, storage);
    },
    [storage]
  );

  const setDensity = useCallback(
    (nextDensity: DensityMode) => {
      const next = parseDensityMode(nextDensity, DEFAULT_DENSITY_MODE);
      setDensityState(next);
      writeStoredPreference(DENSITY_STORAGE_KEY, next, storage);
    },
    [storage]
  );

  const toggleDensity = useCallback(() => {
    setDensityState((prev) => {
      const next: DensityMode =
        prev === "comfortable" ? "compact" : "comfortable";
      writeStoredPreference(DENSITY_STORAGE_KEY, next, storage);
      return next;
    });
  }, [storage]);

  const contextValue = useMemo<ThemeAndDensityContextValue>(
    () => ({
      appearance,
      resolvedTheme,
      systemTheme,
      density,
      isDark: resolvedTheme === "dark",
      isCompact: density === "compact",
      cssVariables,
      setAppearance,
      setDensity,
      toggleDensity,
    }),
    [
      appearance,
      resolvedTheme,
      systemTheme,
      density,
      cssVariables,
      setAppearance,
      setDensity,
      toggleDensity,
    ]
  );

  return (
    <ThemeAndDensityContext.Provider value={contextValue}>
      {children}
    </ThemeAndDensityContext.Provider>
  );
}

export function useThemeAndDensity(): ThemeAndDensityContextValue {
  const context = useContext(ThemeAndDensityContext);
  if (!context) {
    throw new Error(
      "useThemeAndDensity must be used within a <ThemeAndDensityProvider>"
    );
  }
  return context;
}
