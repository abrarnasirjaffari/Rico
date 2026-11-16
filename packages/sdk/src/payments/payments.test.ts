import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RicoPaymentGuardrailError,
  createPaymentsHelper,
  type PaymentQuote,
  type RicoRequestTransport,
} from "./index.ts";

function encodeToken(payload: Record<string, unknown>, sig = "hmacsig123"): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sig}`;
}

function makeQuote(overrides: Partial<PaymentQuote> = {}): PaymentQuote {
  const expiresAt = Date.now() + 5 * 60 * 1000;
  return {
    mandateId: "mnd_123",
    service: "OpenAI API",
    amount: 20,
    currency: "USD",
    budgetCeiling: 50,
    billingPeriod: "2026-11",
    periodLabel: "Nov 2026",
    priceSource: "live_browser",
    confirmToken: encodeToken({ v: 1, m: "mnd_123", a: 2000, exp: expiresAt }),
    expiresAt,
    ...overrides,
  };
}

function mockFetch(...responses: Array<Response | Error>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl = (async (input: string | URL | Request, init: RequestInit = {}) => {
    calls.push({ url: String(input), init });
    const next = responses.shift();
    if (!next) throw new Error("No mock response queued");
    if (next instanceof Error) throw next;
    return next;
  }) as typeof fetch;
  return { fetchImpl, calls };
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("Two-step PaymentsHelper", () => {
  it("quotes first and executes with confirmToken + Idempotency-Key", async () => {
    const quote = makeQuote();
    const { fetchImpl, calls } = mockFetch(
      jsonResponse({ quote }, 200),
      jsonResponse(
        {
          ok: true,
          status: "COMPLETED",
          message: "Payment captured",
          transactionId: "tx_1",
          orderId: "ORD-1",
          receipt: { id: "ORD-1" },
        },
        201
      )
    );

    const payments = createPaymentsHelper({
      baseUrl: "https://rico.test",
      sessionToken: "sess_abc",
      fetch: fetchImpl,
    });

    const q = await payments.quote({ mandateId: "mnd_123", amount: 20, currency: "USD" });
    assert.equal(q.guardrailStatus, "APPROVED");
    assert.equal(q.confirmToken, quote.confirmToken);

    const exec = await payments.execute({
      confirmToken: q.confirmToken,
      idempotencyKey: "idem_1",
      fundingRail: "PAYPAL",
    });

    assert.equal(exec.ok, true);
    assert.equal(exec.orderId, "ORD-1");
    assert.equal(calls.length, 2);
    assert.match(calls[0]?.url ?? "", /\/api\/payments\/quote$/);
    assert.match(calls[1]?.url ?? "", /\/api\/payments\/execute$/);
    const execHeaders = calls[1]?.init.headers as Record<string, string>;
    assert.equal(execHeaders["Idempotency-Key"], "idem_1");
  });

  it("blocks missing or malformed confirmToken before making any HTTP call", async () => {
    const { fetchImpl, calls } = mockFetch();
    const payments = createPaymentsHelper({ baseUrl: "https://rico.test", fetch: fetchImpl });

    await assert.rejects(
      () => payments.execute({ confirmToken: "" }),
      (err: unknown) =>
        err instanceof RicoPaymentGuardrailError && err.code === "INVALID_CONFIRMATION"
    );
    await assert.rejects(
      () => payments.execute({ confirmToken: "no-dot-separator" }),
      (err: unknown) =>
        err instanceof RicoPaymentGuardrailError && err.code === "INVALID_CONFIRMATION"
    );
    assert.equal(calls.length, 0);
  });

  it("rejects expired confirmToken locally before hitting execute", async () => {
    const { fetchImpl, calls } = mockFetch();
    const payments = createPaymentsHelper({ baseUrl: "https://rico.test", fetch: fetchImpl });
    const expiredToken = encodeToken({ v: 1, m: "mnd_123", exp: Date.now() - 10_000 });

    await assert.rejects(
      () => payments.execute({ confirmToken: expiredToken }),
      (err: unknown) =>
        err instanceof RicoPaymentGuardrailError && err.code === "CONFIRMATION_EXPIRED"
    );
    assert.equal(calls.length, 0);
  });

  it("throws RicoPaymentGuardrailError when server returns OVER_BUDGET or amount exceeds ceiling", async () => {
    const { fetchImpl } = mockFetch(
      jsonResponse({ code: "OVER_BUDGET", error: "Budget ceiling exceeded" }, 422),
      jsonResponse({ quote: makeQuote({ amount: 65, budgetCeiling: 50 }) }, 200)
    );
    const payments = createPaymentsHelper({ baseUrl: "https://rico.test", fetch: fetchImpl });

    await assert.rejects(
      () => payments.quote({ mandateId: "mnd_123" }),
      (err: unknown) => err instanceof RicoPaymentGuardrailError && err.code === "OVER_BUDGET"
    );

    await assert.rejects(
      () => payments.quote({ mandateId: "mnd_123" }),
      (err: unknown) => err instanceof RicoPaymentGuardrailError && err.code === "OVER_BUDGET"
    );
  });

  it("prevents accidental double-charges with the same confirmToken or idempotencyKey", async () => {
    const quote = makeQuote();
    const { fetchImpl, calls } = mockFetch(
      jsonResponse({ quote }, 200),
      jsonResponse(
        { ok: true, status: "COMPLETED", message: "Paid", orderId: "ORD-1", receipt: null },
        201
      ),
      jsonResponse({ quote: makeQuote({ confirmToken: encodeToken({ v: 1, m: "mnd_123", exp: Date.now() + 60_000 }, "sig2") }) }, 200)
    );
    const payments = createPaymentsHelper({ baseUrl: "https://rico.test", fetch: fetchImpl });

    const q1 = await payments.quote({ mandateId: "mnd_123" });
    await payments.execute({ confirmToken: q1.confirmToken, idempotencyKey: "key_once" });

    // Same confirmToken blocked locally
    await assert.rejects(
      () => payments.execute({ confirmToken: q1.confirmToken }),
      (err: unknown) =>
        err instanceof RicoPaymentGuardrailError && err.code === "DUPLICATE_EXECUTION"
    );

    // Different confirmToken but reused idempotencyKey blocked locally
    const q2 = await payments.quote({ mandateId: "mnd_123" });
    await assert.rejects(
      () => payments.execute({ confirmToken: q2.confirmToken, idempotencyKey: "key_once" }),
      (err: unknown) =>
        err instanceof RicoPaymentGuardrailError && err.code === "DUPLICATE_EXECUTION"
    );
    assert.equal(calls.length, 3);
  });

  it("integrates directly with a #35 RicoClient.request(...) transport and quoteAndConfirm", async () => {
    const quote = makeQuote();
    const calls: string[] = [];
    const mockClient: RicoRequestTransport = {
      async request<T>(method: string, path: string): Promise<T> {
        calls.push(`${method} ${path}`);
        if (path === "/api/payments/quote") {
          return { quote } as T;
        }
        return {
          ok: true,
          status: "COMPLETED",
          message: "Confirmed",
          orderId: "ORD-CLIENT-1",
          receipt: null,
        } as T;
      },
    };

    const payments = createPaymentsHelper(mockClient);
    const declined = await payments.quoteAndConfirm({
      mandateId: "mnd_123",
      confirm: () => false,
    });
    assert.equal(declined.executed, false);
    assert.equal(calls.length, 1);

    const approved = await payments.quoteAndConfirm({
      mandateId: "mnd_123",
      confirm: (q) => q.amount <= q.budgetCeiling,
    });
    assert.equal(approved.executed, true);
    assert.equal(calls.length, 3);
  });
});
