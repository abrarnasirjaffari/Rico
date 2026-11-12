# Rico Desktop Companion — Windows, macOS & Linux (`apps/desktop/`)

> **Target Branch:** Always open Pull Requests against **`track/desktop`** (not `main`).

Lightweight Tauri v2 companion app living in the Windows system tray, macOS menu bar, and Linux (GNOME / KDE) top bar for live monthly burn tracking, global command shortcuts, and one-click payment hold approvals.

## Conflict-Free Folder Map

| Directory | Responsibility | Issue |
| :--- | :--- | :--- |
| `apps/desktop/` (shell & popover) | Tauri v2 shell, system-tray / menu-bar / AppIndicator icon & `380x520` spend popover | **#38** |
| [`src/launcher/`](./src/launcher/) | Global shortcut launcher (`Ctrl+Shift+R` on Windows/Linux, `Cmd+Shift+R` on macOS) | **#39** |
| [`src/notifications/`](./src/notifications/) | Native OS notifications & Windows Credential Manager / macOS Keychain / Linux `libsecret` storage | **#39** |
| [`packaging/`](./packaging/) | Cross-platform installers (`.msi`, `.exe`, `.dmg`, `.AppImage`, `.deb`, `.rpm` & `.desktop` entry) | **#46** |

## Contributor Rules
1. Keep all desktop code inside `apps/desktop/`. Do **not** modify root `src/`, `package.json`, or `website/`.
2. Never store session tokens in plaintext files — use OS Keychain / Credential Manager / Linux Secret Service (`libsecret`).
