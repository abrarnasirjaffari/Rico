# Core Client (`packages/sdk/src/client/`)

- **Target PR Base Branch:** `track/sdk`
- **Issue:** [#35 — Scaffold `@rico/sdk` Workspace & Typed Core Client](https://github.com/abrarnasirjaffari/Rico/issues/35)

## Usage

```ts
import { RicoClient, RicoGuardrailHoldError } from "@rico/sdk";

const rico = new RicoClient({
  baseUrl: "https://your-rico-deployment.example",
  sessionToken: process.env.RICO_SESSION, // value of the `rico_auth_session` cookie; omit in same-origin browsers
});

const mandates = await rico.mandates.list();
const created = await rico.mandates.create({ service: "Netflix", budgetCeiling: 20 });
await rico.mandates.pause(created.id);

const transactions = await rico.transactions.list();
const { summary } = await rico.sentinel.checkPrice({ mandateId: created.id });
const invoice = await rico.ocr.parseInvoice({ content: "Invoice #1 ... Total $42", sourceType: "TEXT_SNIPPET" });
```

| Method | HTTP call |
| :--- | :--- |
| `mandates.list()` | `GET /api/mandates` |
| `mandates.create(input)` | `POST /api/mandates` |
| `mandates.pause(id)` | `PATCH /api/mandates/:id` with `{ "status": "PAUSED" }` |
| `transactions.list()` | `GET /api/transactions` |
| `sentinel.checkPrice(input?)` | `POST /api/sentinel/run` |
| `ocr.parseInvoice(input)` | `POST /api/invoices/parse` |
| `request(method, path, body?)` | Any other route |

> `PATCH /api/mandates/:id` does not exist on the server yet. `mandates.pause()` is ready for it
> and will return a `RicoApiError` with status 404/405 until the route is added.

Every method takes an optional `{ signal }` to cancel it. Requests time out after 30 seconds
by default (`timeoutMs`; `0` turns it off).

## Errors

| Class | Thrown when |
| :--- | :--- |
| `RicoApiError` | Rico answered with a non-2xx status. Has `status`, `method`, `path`, `body`. |
| `RicoGuardrailHoldError` | A subclass of `RicoApiError`: a guardrail stopped the action (`holdStatus` is `BLOCKED` or `ANOMALY_HOLD`). Retrying won't help; a person needs to review it. |
| `RicoNetworkError` | No response at all: network failure, timeout or abort. The original error is in `cause`. |

All three extend `RicoError`.

## Development

```sh
npm --prefix packages/sdk install
npm --prefix packages/sdk test     # typecheck + node:test with mocked fetch
npm --prefix packages/sdk run build
```

Tests run TypeScript directly through Node's type stripping (Node ≥ 22.18), so the only dev
dependencies are `typescript` and `@types/node`.
