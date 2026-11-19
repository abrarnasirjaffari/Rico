#!/usr/bin/env bash
set -euo pipefail

DESKTOP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$DESKTOP_ROOT"

echo "[Rico Packaging] Installing frontend dependencies..."
npm install --no-audit --no-fund

echo "[Rico Packaging] Building Linux (.deb, .rpm, .AppImage) bundles..."
npx tauri build --bundles deb,rpm,appimage

echo "[Rico Packaging] Done! Artifacts are inside src-tauri/target/release/bundle/"
