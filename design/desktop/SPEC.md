# Rico Desktop Companion — Tauri v2 UI/UX & Layout Specification

- **Target Branch:** `track/ui-design`
- **Issue:** [#22 — Design Windows, macOS & Linux Companion App (System-Tray Spend Monitor & Quick Launcher)](https://github.com/abrarnasirjaffari/Rico/issues/22)
- **Supported Operating Systems:** Windows 10/11, macOS 11+ (Apple Silicon & Intel), Linux (GNOME, KDE Plasma, X11 & Wayland)

---

## 1. Visual Design Tokens (Aligned with Rico Calm Financial Surface)

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--surface-canvas` | `#F8FAFC` | Popover & launcher body background |
| `--surface-card` | `#FFFFFF` | Primary financial summary, mandate list, and top/bottom chrome bars |
| `--border-subtle` | `#DCE7F3` / `#E2ECF6` | Crisp 1px card & divider borders |
| `--accent-primary` | `#2563EB` (`hover: #1D4ED8`) | Brand shield badge, `Approve Once` CTA, active utilization bar |
| `--text-primary` | `#0F172A` | Service titles, verified amounts, section headings |
| `--text-secondary` | `#52637A` / `#64748B` | Labels, server URL, recurrence metadata |
| `--status-hold` | Bg `#FFFBEB` / Border `#FDE68A` / Text `#92400E` | Price Sentinel `ANOMALY_HOLD` & `PENDING` spike cards |
| `--status-trial` | Bg `#FFF7ED` / Border `#FED7AA` / Text `#9A3412` | 24-hour free-trial conversion warning cards |
| `--status-healthy` | Bg `#DCFCE7` / Text `#15803D` | `ACTIVE` mandate pill & `Live` connection dot |
| `--status-danger` | Bg `#FEF2F2` / Border `#FECACA` / Text `#B91C1C` | >=90% budget cap utilization & network/auth errors |
| **Typography** | `Inter` / native OS UI font + `tabular-nums` monospace | All currency amounts (`$46.48`), caps (`$60.00`), and timestamps use `font-mono tabular-nums` so digits never jitter during live updates |

---

## 2. Tauri v2 Multi-Window Configuration Matrix

| Window Label | Dimensions | Decorations | Always On Top | Skip Taskbar / Dock | Trigger |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `main` (Spend Popover) | `380 × 520` | `false` | `true` | `true` (`LSUIElement` on macOS) | Left-click tray / menu-bar / AppIndicator icon |
| `launcher` (Command Bar) | `560 × 340` | `false` | `true` | `true` | `Ctrl+Shift+R` (Win/Linux) or `Cmd+Shift+R` (macOS) |
| `browser-pip` (Live Verification) | `420 × 280` | `false` | `true` | `true` | Opens automatically or on demand during `live_browser` Playwright price verification |

### Cross-Platform Tray Positioning Math (`main` Window)
1. **Horizontal (`x`):** Centered horizontally on the tray icon (`tray.x + tray.width / 2 - window.width / 2`), clamped with an `8px * scaleFactor` margin inside the active monitor bounds.
2. **Vertical (`y`):**
   - **macOS Menu Bar & Linux GNOME Top Bar (`tray.y < 200`):** Anchored `8px` **below** the tray icon (`tray.y + tray.height + margin`).
   - **Windows 11 Taskbar & KDE Bottom Panel (`tray.y >= 200`):** Anchored `8px` **above** the taskbar (`tray.y - window.height - margin`).
3. **Dismiss Behavior:** Clicking outside (`WindowEvent::Focused(false)` with a `250ms` debounce guard) or clicking `×` hides the popover cleanly back to the system tray without terminating background monitoring.

---

## 3. Screen-by-Screen Layout Breakdown

### Screen 1: System-Tray Spend Popover (`380 × 520`)
- **Draggable Header (`50px`):** `data-tauri-drag-region`, `28×28` Rico Shield icon, signed-in user email, and `24×24` icon buttons (`Command Launcher`, `Test Toast`, `Refresh`, `Sign Out`, `Hide`).
- **Scrollable Content (`436px`):**
  1. **Live Monthly Burn Card:** Displays `Paid this month` (or `Projected monthly burn` when `$0` settled), active mandate count pill, large `24px` monospace spend vs. ceiling cap, and `6px` progress bar.
  2. **Held Payments Section:** Lists every `ANOMALY_HOLD` mandate and pending Sentinel alert with baseline spike percentage, `Approve Once` primary button, and `Cancel` secondary button (`POST /api/sentinel/webhook`).
  3. **24h Trial Expirations Section:** Surfaces `FREE_TRIAL` contracts renewing in `<= 24h` (`/api/contracts/watchdog/status`) with a 1-click `Cancel Trial` button (`POST /api/contracts/watchdog/remediate`).
  4. **Compact Mandates List:** Up to 5 mandates showing service name, recurrence, verified price, and `ACTIVE` / `HOLD` / `PAUSED` badge.
- **Status Footer (`34px`):** Active Rico server URL (`http://localhost:3000`), `Auto-Start` login toggle pill, `Keyring` indicator, and `Live` / `Offline` status dot.

### Screen 2: Global Keyboard Command Launcher (`560 × 340`)
- **Global Shortcut Registration:**
  - **Windows & Linux:** `Ctrl+Shift+R` (supports X11 `global-hotkey` and Wayland XDG `GlobalShortcuts` portal).
  - **macOS:** `Cmd+Shift+R`.
- **Top Input Bar (`54px`):** Auto-focused text input + `Run ↵` button + `Esc` dismiss.
- **Dynamic Body (`250px`):**
  - **Idle State:** 2×2 grid of quick FinOps prompt chips (*"Check my AWS & SaaS spend"*, *"Set a $20/mo cap on Cursor"*, *"Compare Netflix and Spotify"*, *"Find startup credits for AI founders"*).
  - **Active / Quote State:** Streams `/api/chat` SSE responses; if Rico quotes a payment (`payment_confirmation`), renders a dedicated two-step HMAC `confirmToken` card with a `Confirm Pay` button (`POST /api/payments/execute`). Never captures funds without explicit user confirmation.

### Screen 3: Native OS Notifications (Windows, macOS & Linux)
- Uses `tauri-plugin-notification` (WinRT Toast on Windows, `UNUserNotificationCenter` on macOS, Freedesktop `org.freedesktop.Notifications` via `notify-rust` on Linux).
- Deduplicates alert keys (`hold-alert:<id>`, `hold-mandate:<id>`, `trial-24h:<id>`) across 30-second background polls and strips all sensitive tokens from notification text.

### Screen 4: Compact Live Browser Verification Window (`420 × 280` PiP)
- Displays real-time 30 FPS CDP frames from Rico's headless Chromium worker alongside a `live_browser` verification pill (strictly distinguished from `cache_fallback`), semantic `@eN` DOM highlight badge, extracted price vs. mandate ceiling check, and a **`Take Over Tab`** button when a merchant login/2FA wall is detected.
