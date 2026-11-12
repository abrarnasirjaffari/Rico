# `@rico/sdk` — Rico Developer & AI Agent Guardrail SDK (`packages/sdk/`)

> **Target Branch:** Always open Pull Requests against **`track/sdk`** (not `main`).

Zero-dependency TypeScript SDK for enforcing Rico financial mandates, two-step `confirmToken` payments, Price Sentinel checks, Invoice OCR, and AI agent tool guardrails.

## Conflict-Free Module Layout

Each issue owns a separate directory so multiple contributors can work simultaneously without conflicts:

| Directory | Responsibility | Issue |
| :--- | :--- | :--- |
| [`src/client/`](./src/client/) | `RicoClient`, typed REST/streaming transport, Mandates, Transactions, Sentinel & OCR | **#35** |
| [`src/payments/`](./src/payments/) | Two-step `/api/payments/quote` -> `confirmToken` -> `/api/payments/execute` helper | **#36** |
| [`src/webhooks/`](./src/webhooks/) | Constant-time HMAC-SHA256 `verifyRicoWebhook()` verifier | **#36** |
| [`src/adapters/`](./src/adapters/) | `withRicoGuardrails()` wrappers for Google Gemini, OpenAI, and MCP tools | **#37** |

## Contributor Rules
1. Keep all SDK files inside `packages/sdk/`. Do **not** modify root `src/`, `package.json`, or `website/`.
2. Never add a single-step charge bypass — every payment helper must require a server-issued `confirmToken`.
