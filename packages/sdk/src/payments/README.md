# Safe Two-Step Payment Helper (`packages/sdk/src/payments/`)

- **Target PR Base Branch:** `track/sdk`
- **Issue:** [#36 — Safe Two-Step Payment Helper & Webhook HMAC Verifier](https://github.com/abrarnasirjaffari/Rico/issues/36)

## Usage

Works with either `#35`'s `RicoClient` (`client.request(...)`) or standalone `{ baseUrl, sessionToken, fetch }` options:

```ts
import { createPaymentsHelper } from "./index.ts";

const payments = createPaymentsHelper({
  baseUrl: "https://rico.example.com",
  sessionToken: process.env.RICO_SESSION_TOKEN,
});

// Step 1: Request a server-verified quote + signed confirmToken
const { quote, confirmToken } = await payments.quote({
  mandateId: "mnd_123",
  amount: 20,
  currency: "USD",
});

// Step 2: Execute only after explicit confirmation
const result = await payments.execute({
  confirmToken,
  idempotencyKey: "run-2026-11-16-01",
});
```

## Run Tests

```bash
node --test packages/sdk/src/payments/payments.test.ts
```
