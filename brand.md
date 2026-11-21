# Brand — Rico (Intelligent Financial UI & Live SQL Dashboards)

_Status: active_

## Design Direction
Calm, executive, developer-grade financial workspace combining **Intelligent Generative UI** (page-composed answers, live reactive `$state` tools, alpha-stacked ink neutrals, soft semantic pills) with **Live SQL CFO Dashboards** (interactive sentence-slot prompt builder, concave-filleted live status notch, peeking follow-up card fan, and split-screen `RICO-Dashboard`, `RICO-DOC`, `RICO-Excel`, and `RICO-Browser`).

## Color Palette (Light & System Dark)
- **Canvas (`--rico-iui-canvas`):** `#FFFFFF` (Light) / `#161618` (Dark) — Active chat thread, live dashboard canvas, elevated cards.
- **Sidebar & Chrome (`--rico-bg-base`):** `#FAFAFA` (`oklch(0.985 0 0)`) / `#121214` (Dark) — Left rail, recessed workspace chrome.
- **Alpha-Stacked Ink Surfaces:**
  - `--rico-iui-ink`: `#0D0D0D` (Light) / `#F3F3F5` (Dark)
  - `--rico-iui-muted`: `rgba(13, 13, 13, 0.60)` / `rgba(243, 243, 245, 0.62)`
  - `--rico-iui-surface`: `color-mix(in srgb, var(--rico-iui-ink) 4%, transparent)`
  - `--rico-iui-hover`: `color-mix(in srgb, var(--rico-iui-ink) 5%, transparent)`
  - `--rico-iui-pressed`: `color-mix(in srgb, var(--rico-iui-ink) 8%, transparent)`
  - `--rico-iui-border`: `color-mix(in srgb, var(--rico-iui-ink) 8%, transparent)`
  - `--rico-iui-border-strong`: `color-mix(in srgb, var(--rico-iui-ink) 11%, transparent)`
- **Semantic & Chart Palette:**
  - **Chart 1 / Interactive Blue:** `#0285FF`
  - **Chart 2 / Verified Emerald:** `#00A67D` (Badge `#1F6B4F` on `#E8F3EC`)
  - **Chart 3 / Iris Violet:** `#8B5CF6` (Badge `#5D4596` on `#EFEBF7`)
  - **Chart 4 / Caution Amber:** `#F4A340` (Badge `#8A5300` on `#FFEFC7`)
  - **Chart 5 / Coral Rose:** `#E46D91`
  - **Danger / Blocked:** `#C1322C` (Badge `#9F3A33` on `#F8E8E5`)
  - **Live Status Notch Tint:** `color-mix(in srgb, #38BDF8 16%, var(--background))` with `#0284C7` text.

## Typography & Radii
- **UI Sans:** `Inter`, `ui-sans-serif`, `system-ui`, `-apple-system`, `sans-serif` (`14px` body, `-0.015em` titles).
- **Technical Mono:** `Geist Mono`, `ui-monospace`, `SFMono-Regular`, `monospace` with `tabular-nums` for all prices, ceilings, deltas, and formulas.
- **Radius Scale (4px system):** `6px` (`sm`), `10px` (`md`), `12px` (`lg`), `14px` (`xl`), `20px` (`2xl`).

## Voice & Copy
- Concise, analytical, direct. Compose every answer like a clean interactive page (KPI cards, segmented tabs, filterable tables, live calculators) rather than walls of bullet prose.
