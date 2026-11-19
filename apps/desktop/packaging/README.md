# Cross-Platform Packaging — Windows, macOS & Linux (`apps/desktop/packaging/`)

- **Target PR Base Branch:** `track/desktop`
- **Issue:** [#46 — Cross-Platform Installers & Linux Desktop Packaging (`.msi`, `.dmg`, `.AppImage`, `.deb` & `.rpm`)](https://github.com/abrarnasirjaffari/Rico/issues/46)

---

## 📦 Bundle Matrix

| OS | Targets | Config & Scripts | Key Native Integrations |
| :--- | :--- | :--- | :--- |
| **Windows 10/11** | NSIS `.exe` + WiX `.msi` | `windows/build-windows.ps1`, `npm run package:windows` | WebView2 silent bootstrapper, Start Menu shortcut, `Launch Rico on Login` (`--minimized`), Windows Credential Manager |
| **macOS 11+** | Universal `.dmg` + `.app` (`arm64` + `x86_64`) | `macos/build-macos.sh`, `macos/Info.plist`, `macos/entitlements.plist`, `npm run package:macos` | Menu-bar agent mode (`LSUIElement` + `ActivationPolicy::Accessory`), LaunchAgent autostart, macOS Keychain |
| **Linux (Ubuntu, Debian, Fedora)** | `.AppImage`, `.deb`, `.rpm` | `linux/install-deps.sh`, `linux/build-linux.sh`, `linux/rico.desktop`, `npm run package:linux` | Freedesktop `.desktop` launcher, `libayatana-appindicator` tray icon, `libsecret` keyring, X11/Wayland global shortcuts |

---

## 🪟 1. Windows Packaging (`.exe` & `.msi`)

### Prerequisites
- Visual Studio C++ Build Tools + Windows 10/11 SDK
- Rust stable (`x86_64-pc-windows-msvc`)

### Build Installers
```powershell
cd apps/desktop
npm run package:windows
# Or via helper script:
powershell -ExecutionPolicy Bypass -File .\packaging\windows\build-windows.ps1 -Target all
```
Artifacts are emitted to:
- `apps/desktop/src-tauri/target/release/bundle/nsis/Rico_0.1.0_x64-setup.exe`
- `apps/desktop/src-tauri/target/release/bundle/msi/Rico_0.1.0_x64_en-US.msi`

### Auto-Start on Login
Right-click the Rico tray icon and toggle **Launch Rico on Login** (backed by `tauri-plugin-autostart`, passing `--minimized` so Rico starts quietly in the system tray).

---

## 🍎 2. macOS Packaging (Universal `.dmg` & `.app`)

### Prerequisites
- Xcode Command Line Tools (`xcode-select --install`)
- Both Apple Silicon and Intel Rust targets:
  ```bash
  rustup target add aarch64-apple-darwin x86_64-apple-darwin
  ```

### Build Universal Bundle
```bash
cd apps/desktop
./packaging/macos/build-macos.sh
```
Artifacts are emitted to:
- `apps/desktop/src-tauri/target/universal-apple-darwin/release/bundle/dmg/Rico_0.1.0_universal.dmg`
- `apps/desktop/src-tauri/target/universal-apple-darwin/release/bundle/macos/Rico.app`

### Menu-Bar Agent Mode (`LSUIElement`)
- `packaging/macos/Info.plist` sets `LSUIElement = true` (merged automatically by Tauri from `src-tauri/Info.plist` or bundle config) and `src-tauri/src/lib.rs` sets `ActivationPolicy::Accessory` so Rico lives cleanly in the top menu bar without cluttering the macOS Dock.

---

## 🐧 3. Linux Packaging (`.AppImage`, `.deb` & `.rpm`)

### Install Build & Runtime Dependencies
Run the automated helper for **Ubuntu / Debian (`apt`)** or **Fedora / RHEL (`dnf`)**:
```bash
./apps/desktop/packaging/linux/install-deps.sh
```

### GNOME & KDE System-Tray Notes (`libayatana-appindicator`)
- **Ubuntu / GNOME:** Ubuntu includes AppIndicator support out of the box (`gnome-shell-extension-appindicator`). On vanilla GNOME (Fedora / Arch), enable the [AppIndicator and KStatusNotifierItem Support](https://extensions.gnome.org/extension/615/appindicator-support/) extension and ensure `libayatana-appindicator3-1` (Debian/Ubuntu) or `libayatana-appindicator-gtk3` (Fedora) is installed (declared automatically in `.deb` and `.rpm` `depends`).
- **KDE Plasma:** Native StatusNotifierItem tray support works out of the box.
- **Desktop Entry:** `packaging/linux/rico.desktop` installs Rico under `Office;Finance;Utility;` with quick actions for opening the Command Launcher and starting minimized (`rico-desktop --minimized`).

### Build All Linux Bundles
```bash
cd apps/desktop
./packaging/linux/build-linux.sh
```
Artifacts are emitted to:
- `src-tauri/target/release/bundle/deb/Rico_0.1.0_amd64.deb`
- `src-tauri/target/release/bundle/rpm/Rico-0.1.0-1.x86_64.rpm`
- `src-tauri/target/release/bundle/appimage/Rico_0.1.0_amd64.AppImage`
