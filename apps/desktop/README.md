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

## Prerequisites

- **Node.js `>= 22.12.0`** and **npm `>= 10.x`**
- **Rust (`rustup` / `cargo` / `rustc`)**
- **Platform WebView / Tray dependencies:**
  - **Windows:** Microsoft Edge WebView2 (pre-installed on Windows 10/11) + Visual Studio C++ Build Tools
  - **macOS:** Xcode Command Line Tools (`xcode-select --install`)
  - **Linux (Ubuntu / Debian):** `libwebkit2gtk-4.1-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`, `patchelf`

## Running Locally

1. Start the core Rico server from the repository root (`http://localhost:3000` by default):
   ```bash
   npm run dev
   ```
2. Install desktop dependencies and launch the Tauri v2 app from `apps/desktop/`:
   ```bash
   cd apps/desktop
   npm install
   npm run tauri dev
   ```
3. To build production frontend assets or verify the Rust shell:
   ```bash
   npm run build
   cd src-tauri && cargo check
   ```

## Implemented in #38

- **Tauri v2 + React/Vite/Tailwind Shell:** `380x520` frameless, always-on-top popover window (`apps/desktop/src-tauri/tauri.conf.json`).
- **System Tray / Menu Bar / Top Bar Icon:** Left-click toggles and anchors the popover near the tray icon; focus loss or `×` hides to tray; right-click menu provides `Show / Hide Rico` and `Quit Rico`.
- **Rico Server Connectivity:** Connects via `@tauri-apps/plugin-http` to any local or hosted Rico server URL (`http://localhost:3000` default) with email or 1-click Demo Evaluator sign-in (session held in memory only; OS keyring persistence belongs to #39).
- **Live Spend Popover:** Displays monthly burn vs. total mandate cap, held payments (`Approve Once` / `Cancel` via `/api/sentinel/webhook`), 24-hour free-trial expiration alerts (`/api/contracts/watchdog/status` & `/remediate`), and active mandates.

## Contributor Rules
1. Keep all desktop code inside `apps/desktop/`. Do **not** modify root `src/`, `package.json`, or `website/`.
2. Never store session tokens in plaintext files — use OS Keychain / Credential Manager / Linux Secret Service (`libsecret`).
