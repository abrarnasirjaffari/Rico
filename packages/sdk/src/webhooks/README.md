# Webhook Signature Verifier (`packages/sdk/src/webhooks/`)

- **Target PR Base Branch:** `track/sdk`
- **Issue:** [#36 — Safe Two-Step Payment Helper & Webhook HMAC Verifier](https://github.com/abrarnasirjaffari/Rico/issues/36)

## Usage

```ts
import { assertValidRicoWebhook } from "./index.ts";

const verified = assertValidRicoWebhook({
  payload: rawRequestBody,
  signature: req.headers["x-rico-signature"],
  secret: process.env.RICO_WEBHOOK_SECRET,
});

console.log(verified.event?.type);
```

## Run Tests

```bash
node --test packages/sdk/src/webhooks/webhooks.test.ts
```
