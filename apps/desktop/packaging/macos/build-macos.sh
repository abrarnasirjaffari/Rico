#!/usr/bin/env bash
set -euo pipefail

DESKTOP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$DESKTOP_ROOT"

echo "[Rico Packaging] Ensuring Apple Silicon & Intel Rust targets are installed..."
rustup target add aarch64-apple-darwin x86_64-apple-darwin

echo "[Rico Packaging] Installing frontend dependencies..."
npm install --no-audit --no-fund

echo "[Rico Packaging] Building Universal macOS (.app & .dmg) bundles..."
npx tauri build --target universal-apple-darwin --bundles app,dmg

echo "[Rico Packaging] Done! Artifacts are inside src-tauri/target/universal-apple-darwin/release/bundle/"
