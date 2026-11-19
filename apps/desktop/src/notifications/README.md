# Native Notifications & Keyring Storage (`apps/desktop/src/notifications/`)

- **Target PR Base Branch:** `track/desktop`
- **Issue:** [#39 — Global Shortcut Command Launcher & OS Keyring Auth](https://github.com/abrarnasirjaffari/Rico/issues/39)

## Overview

1. **Cross-Platform OS Keyring Auth (`keyring.ts` + `src-tauri/src/keyring_auth.rs`):**
   - Stores active session credentials inside **Windows Credential Manager**, **macOS Keychain**, and **Linux Secret Service (`libsecret` / GNOME Keyring / KDE Wallet)** under service `ai.rico.desktop` — never in plaintext files or `localStorage`.
2. **Native Desktop Notifications (`notifier.ts`):**
   - Dispatches native OS toast notifications (Windows WinRT Toast, macOS UserNotifications, Linux Freedesktop `notify-rust`) whenever a new Price Sentinel hold (`ANOMALY_HOLD` / `PENDING` alert) or 24-hour free-trial expiration is detected, with per-alert deduplication across background polls.
