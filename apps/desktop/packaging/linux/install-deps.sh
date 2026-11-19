#!/usr/bin/env bash
set -euo pipefail

# Install native Tauri v2 + AppIndicator + Secret Service dependencies on Ubuntu/Debian or Fedora/RHEL
if command -v apt-get >/dev/null 2>&1; then
  echo "[Rico Packaging] Detected apt-get (Ubuntu / Debian)..."
  sudo apt-get update
  sudo apt-get install -y \
    libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libsecret-1-dev \
    patchelf \
    rpm
elif command -v dnf >/dev/null 2>&1; then
  echo "[Rico Packaging] Detected dnf (Fedora / RHEL)..."
  sudo dnf install -y \
    webkit2gtk4.1-devel \
    openssl-devel \
    curl \
    wget \
    file \
    libappindicator-gtk3-devel \
    libayatana-appindicator-gtk3-devel \
    librsvg2-devel \
    libsecret-devel \
    patchelf \
    rpm-build
else
  echo "Unsupported package manager. Install WebKit2GTK 4.1, libayatana-appindicator3, and libsecret manually."
  exit 1
fi

echo "[Rico Packaging] Linux build & tray dependencies installed successfully."
