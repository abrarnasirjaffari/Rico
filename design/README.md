# Rico Design System & Platform UI Specs (`design/`)

> **Target Branch:** Always open Pull Requests against **`track/ui-design`** (not `main`).

This folder holds shared design tokens, component specs, and platform mockups so Desktop, Android, iOS, and the `@rico/sdk` docs share one consistent look and feel.

## Folder Map (Conflict-Free)

Each track lives in its own directory so multiple designers can work in parallel without merge conflicts:

| Folder | Platform / Scope | Related Issues |
| :--- | :--- | :--- |
| [`design/tokens/`](./tokens/) | Shared colors, typography, spacing, currency rules & reusable financial cards | **#31** |
| [`design/desktop/`](./desktop/) | Windows & macOS menu-bar spend popover, global shortcut bar & split browser window | **#22** |
| [`design/android/`](./android/) | Native Android (Material 3) screens, biometric hold sheet, receipt camera & widgets | **#32**, **#21** |
| [`design/ios/`](./ios/) | Native iOS (SwiftUI) screens, FaceID hold sheet, VisionKit scanner & WidgetKit | **#33**, **#21** |
| [`design/sdk-docs/`](./sdk-docs/) | `@rico/sdk` 5-line quickstart & interactive guardrail playground mockups | **#34** |

## Rules for Contributors
1. Only add or edit files inside the subfolder matching your claimed issue.
2. Do **not** modify `src/`, `website/`, `packages/`, or `apps/` in design PRs.
3. Include SVG/PNG exports or Figma/Penpot links alongside Markdown specs so engineers can implement screens directly.
