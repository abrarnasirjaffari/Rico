# Rico Android Companion — Kotlin & Jetpack Compose (`apps/android/`)

> **Target Branch:** Always open Pull Requests against **`track/android`** (not `main`).

Native Android companion app built with Kotlin and Jetpack Compose (Material 3) for Calm Pulse spend monitoring, biometric `confirmToken` payment hold approvals, and CameraX receipt tax scanning.

## Conflict-Free Package Map

| Path | Responsibility | Issue |
| :--- | :--- | :--- |
| `apps/android/` (shell, auth & home) | Gradle setup, Android Keystore auth, and Calm Pulse Home screen | **#40** |
| [`app/src/main/java/com/rico/approvals/`](./app/src/main/java/com/rico/approvals/) | `BiometricPrompt` hold approval sheet (`quote -> confirmToken -> execute`) | **#41** |
| [`app/src/main/java/com/rico/scanner/`](./app/src/main/java/com/rico/scanner/) | CameraX receipt scanner wired to Rico `/api/ocr` tax deductions | **#41** |

## Contributor Rules
1. Keep all Android files strictly inside `apps/android/`. Do **not** modify root `src/`, `package.json`, or `apps/ios/`.
2. Never commit `local.properties`, `.keystore` files, or API secrets.
