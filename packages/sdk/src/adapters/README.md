# AI Agent Guardrail Wrappers (`packages/sdk/src/adapters/`)

- **Target PR Base Branch:** `track/sdk`
- **Issue:** [#37 — AI Agent Guardrail Wrappers for OpenAI, Google Gemini & MCP](https://github.com/abrarnasirjaffari/Rico/issues/37)

## Quickstart (5 Lines)

```ts
import { withRicoGuardrails, ricoOpenAITools } from "./index";

const safeCheckout = withRicoGuardrails(
  async (args, { confirmToken }) => executeOrder(args, confirmToken),
  { client: ricoClient, mandateId: "mnd_saas_01", baselinePrice: 20 }
);
```

Before `toolFn` ever runs, `withRicoGuardrails`:
1. Requests a server-verified quote via `client.payments.quote({ mandateId })` (or `client.quotePayment`).
2. Verifies a signed `confirmToken` is present and passes it to `toolFn` as execution context.
3. Enforces the mandate `budgetCeiling` and blocks `>20%` price spikes above `baselinePrice`.
4. Halts cleanly (`{ ok: false, blocked: true, code, reason }`, or throws `RicoGuardrailError` when `onBlock: "throw"`).

## Included Files

- `types.ts` — Structural `RicoClient` interface (compatible with `#35` when merged), quote types, and `RicoGuardrailError`.
- `guardrails.ts` — `withRicoGuardrails()`, `checkBudgetCeiling()`, and `checkPriceSpike()`.
- `openai.ts` — `createOpenAIToolDefinition()`, `ricoOpenAITools`, and `handleOpenAIToolCall()`.
- `gemini.ts` — `createGeminiToolDeclaration()`, `ricoGeminiDeclarations`, and `handleGeminiFunctionCall()`.
- `mcp.ts` — `createMcpToolDefinition()`, `ricoMcpTools`, and `handleMcpToolCall()`.
- `adapters.test.ts` — Unit tests covering allowed charges, over-budget halts, `>20%` price spikes, and OpenAI/Gemini/MCP dispatch.

## Run Tests Locally

```bash
npx tsx packages/sdk/src/adapters/adapters.test.ts
```
