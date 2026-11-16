"use client";

import React, { useCallback } from "react";
import {
  APPEARANCE_MODES,
  DENSITY_MODES,
  type AppearanceMode,
  type DensityMode,
} from "./tokens";
import { useThemeAndDensity } from "./ThemeAndDensityProvider";

export interface AppearanceOptionMeta {
  value: AppearanceMode;
  label: string;
  shortLabel: string;
}

export interface DensityOptionMeta {
  value: DensityMode;
  label: string;
  shortLabel: string;
}

export const APPEARANCE_OPTIONS: readonly AppearanceOptionMeta[] = [
  { value: "system", label: "System", shortLabel: "Auto" },
  { value: "light", label: "Light", shortLabel: "Light" },
  { value: "dark", label: "Dark", shortLabel: "Dark" },
] as const;

export const DENSITY_OPTIONS: readonly DensityOptionMeta[] = [
  { value: "comfortable", label: "Comfortable", shortLabel: "Comfy" },
  { value: "compact", label: "Compact", shortLabel: "Compact" },
] as const;

export function getNextSegmentedOption<T extends string>(
  options: readonly T[],
  current: T,
  key: string
): T | null {
  const currentIndex = options.indexOf(current);
  if (currentIndex === -1 || options.length === 0) {
    return null;
  }

  if (key === "ArrowRight" || key === "ArrowDown") {
    return options[(currentIndex + 1) % options.length];
  }
  if (key === "ArrowLeft" || key === "ArrowUp") {
    return options[(currentIndex - 1 + options.length) % options.length];
  }
  if (key === "Home") {
    return options[0];
  }
  if (key === "End") {
    return options[options.length - 1];
  }
  return null;
}

export interface AppearanceSegmentedControlProps {
  appearance?: AppearanceMode;
  density?: DensityMode;
  onAppearanceChange?: (mode: AppearanceMode) => void;
  onDensityChange?: (density: DensityMode) => void;
  showDensityToggle?: boolean;
  compactLabels?: boolean;
  className?: string;
}

export function AppearanceSegmentedControl({
  appearance: appearanceProp,
  density: densityProp,
  onAppearanceChange,
  onDensityChange,
  showDensityToggle = true,
  compactLabels = false,
  className = "",
}: AppearanceSegmentedControlProps) {
  const context = useThemeAndDensity();

  const activeAppearance = appearanceProp ?? context.appearance;
  const activeDensity = densityProp ?? context.density;

  const handleAppearanceSelect = useCallback(
    (mode: AppearanceMode) => {
      if (onAppearanceChange) {
        onAppearanceChange(mode);
      } else {
        context.setAppearance(mode);
      }
    },
    [onAppearanceChange, context]
  );

  const handleDensitySelect = useCallback(
    (nextDensity: DensityMode) => {
      if (onDensityChange) {
        onDensityChange(nextDensity);
      } else {
        context.setDensity(nextDensity);
      }
    },
    [onDensityChange, context]
  );

  const handleAppearanceKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const next = getNextSegmentedOption(
        APPEARANCE_MODES,
        activeAppearance,
        event.key
      );
      if (next) {
        event.preventDefault();
        handleAppearanceSelect(next);
      }
    },
    [activeAppearance, handleAppearanceSelect]
  );

  const handleDensityKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const next = getNextSegmentedOption(
        DENSITY_MODES,
        activeDensity,
        event.key
      );
      if (next) {
        event.preventDefault();
        handleDensitySelect(next);
      }
    },
    [activeDensity, handleDensitySelect]
  );

  const trackStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "2px",
    padding: "2px",
    backgroundColor: "var(--rico-bg-subtle)",
    border: "1px solid var(--rico-border-subtle)",
    borderRadius: "var(--rico-radius-control)",
    height: "var(--rico-size-control-height)",
    boxSizing: "border-box",
  };

  const getSegmentButtonStyle = (isSelected: boolean): React.CSSProperties => ({
    height: "100%",
    padding: "0 8px",
    border: isSelected
      ? "1px solid var(--rico-border-strong)"
      : "1px solid transparent",
    borderRadius: "calc(var(--rico-radius-control) - 2px)",
    backgroundColor: isSelected ? "var(--rico-bg-elevated)" : "transparent",
    color: isSelected ? "var(--rico-text-strong)" : "var(--rico-text-base)",
    boxShadow: isSelected ? "var(--rico-shadow-thumb)" : "none",
    fontSize: "var(--rico-font-size-caption)",
    fontWeight: isSelected ? 600 : 500,
    lineHeight: 1,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 120ms ease, color 120ms ease",
    whiteSpace: "nowrap",
  });

  return (
    <div
      className={className}
      data-testid="appearance-segmented-control"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--rico-space-row-gap)",
        width: "100%",
      }}
    >
      <div
        role="radiogroup"
        aria-label="Appearance theme"
        data-testid="appearance-radiogroup"
        style={trackStyle}
      >
        {APPEARANCE_OPTIONS.map((option) => {
          const isSelected = activeAppearance === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Appearance: ${option.label}`}
              data-testid={`appearance-option-${option.value}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => handleAppearanceSelect(option.value)}
              onKeyDown={handleAppearanceKeyDown}
              style={getSegmentButtonStyle(isSelected)}
            >
              {compactLabels ? option.shortLabel : option.label}
            </button>
          );
        })}
      </div>

      {showDensityToggle && (
        <div
          role="radiogroup"
          aria-label="Layout density"
          data-testid="density-radiogroup"
          style={trackStyle}
        >
          {DENSITY_OPTIONS.map((option) => {
            const isSelected = activeDensity === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`Density: ${option.label}`}
                data-testid={`density-option-${option.value}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => handleDensitySelect(option.value)}
                onKeyDown={handleDensityKeyDown}
                style={getSegmentButtonStyle(isSelected)}
              >
                {compactLabels ? option.shortLabel : option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
