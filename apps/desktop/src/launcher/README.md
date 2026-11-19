# Global Shortcut Launcher (`apps/desktop/src/launcher/`)

- **Target PR Base Branch:** `track/desktop`
- **Issue:** [#39 — Global Shortcut Command Launcher & OS Keyring Auth](https://github.com/abrarnasirjaffari/Rico/issues/39)

## Overview

Provides the floating Spotlight-style Rico Command Launcher (`560x340`) toggled from anywhere on the desktop:
- **Windows & Linux (X11 / Wayland GlobalShortcuts portal):** `Ctrl+Shift+R`
- **macOS:** `Cmd+Shift+R`

## Files
- `CommandLauncher.tsx`: Floating input bar with quick command chips, live `/api/chat` response view, `Esc` / blur auto-dismiss, and two-step `confirmToken` payment confirmation card.
- `launcherClient.ts`: Hydrates OS keyring credentials, sends prompts to `POST /api/chat` (SSE), and confirms quoted payments exclusively via `POST /api/payments/execute`.
- `index.ts`: Public exports and `openCommandLauncherWindow()` Tauri command helper.
