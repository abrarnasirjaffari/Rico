# Rico Desktop Companion — Windows & macOS (`apps/desktop/`)

> **Target Branch:** Always open Pull Requests against **`track/desktop`** (not `main`).

Lightweight Tauri v2 companion app living in the Windows system tray and macOS menu bar for live monthly burn tracking, global command shortcuts, and one-click payment hold approvals.

## Conflict-Free Folder Map

| Directory | Responsibility | Issue |
| :--- | :--- | :--- |
| `apps/desktop/` (shell & popover) | Tauri v2 shell, menu-bar / system-tray icon & `380x520` spend popover | **#38** |
| [`src/launcher/`](./src/launcher/) | Global shortcut launcher (`Ctrl+Shift+R` / `Cmd+Shift+R`) | **#39** |
| [`src/notifications/`](./src/notifications/) | Native OS notifications & Windows Credential Manager / macOS Keychain storage | **#39** |

## Contributor Rules
1. Keep all desktop code inside `apps/desktop/`. Do **not** modify root `src/`, `package.json`, or `website/`.
2. Never store session tokens in plaintext files — use OS Keychain / Credential Manager.
