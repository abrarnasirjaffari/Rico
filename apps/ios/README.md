# Rico iOS Companion — Swift & SwiftUI (`apps/ios/`)

> **Target Branch:** Always open Pull Requests against **`track/ios`** (not `main`).

Native iOS companion app built with Swift and SwiftUI for Calm Pulse spend monitoring, FaceID `confirmToken` hold approvals, VisionKit receipt tax scanning, and WidgetKit home-screen tracking.

## Conflict-Free Feature Map

| Path | Responsibility | Issue |
| :--- | :--- | :--- |
| `apps/ios/` (shell, Keychain & Home) | SwiftUI project setup, iOS Keychain auth, and Calm Pulse Home screen | **#42** |
| [`Rico/Features/Approvals/`](./Rico/Features/Approvals/) | `LocalAuthentication` (FaceID) hold approval sheet (`quote -> confirmToken -> execute`) | **#43** |
| [`Rico/Features/Scanner/`](./Rico/Features/Scanner/) | VisionKit receipt scanner wired to Rico `/api/ocr` tax deductions | **#43** |
| [`Rico/Features/Widgets/`](./Rico/Features/Widgets/) | WidgetKit spend & pending-holds home-screen widget | **#43** |

## Contributor Rules
1. Keep all iOS files strictly inside `apps/ios/`. Do **not** modify root `src/`, `package.json`, or `apps/android/`.
2. Never commit signing certificates, provisioning profiles, or API secrets.
