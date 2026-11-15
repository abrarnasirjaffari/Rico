import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RicoApiError,
  RicoClient,
  RicoGuardrailHoldError,
  RicoNetworkError,
  type Mandate,
} from "../src/index.ts";

interface Call {
  url: string;
  init: RequestInit;
}

/** Returns a fetch stub that answers each call with the next queued response and records it. */
function mockFetch(...responses: Array<Response | Error>) {
  const calls: Call[] = [];
  const fetchImpl = (async (input: string | URL | Request, init: RequestInit = {}) => {
    calls.push({ url: String(input), init });
    const next = responses.shift();
    if (!next) throw new Error("mockFetch: no response queued");
    if (next instanceof Error) throw next;
    return next;
  }) as typeof fetch;
  return { fetchImpl, calls };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const mandate: Mandate = {
  id: "mandate-1",
  ownerId: "user-1",
  service: "Netflix",
  budgetCeiling: 20,
  lastScrapedPrice: 15.49,
  recurrence: "Monthly on 1st",
  nextRun: "Pending",
  status: "ACTIVE",
  category: "Subscription",
  currency: "USD",
  strictMode: false,
  merchantUrl: null,
};

function client(fetchImpl: typeof fetch, extra: Partial<ConstructorParameters<typeof RicoClient>[0]> = {}) {
  return new RicoClient({ baseUrl: "https://rico.test/", fetch: fetchImpl, ...extra });
}

const headersOf = (call: Call) => call.init.headers as Record<string, string>;

describe("RicoClient construction", () => {
  it("requires a baseUrl", () => {
    assert.throws(() => new RicoClient({ baseUrl: "" }), TypeError);
  });

  it("sends the session token as the Rico session cookie, URL-encoded", async () => {
    const { fetchImpl, calls } = mockFetch(json({ mandates: [] }));
    await client(fetchImpl, { sessionToken: "a.b=c" }).mandates.list();
    assert.equal(headersOf(calls[0]!).cookie, "rico_auth_session=a.b%3Dc");
  });

  it("merges custom headers and omits the cookie when no token is given", async () => {
    const { fetchImpl, calls } = mockFetch(json({ mandates: [] }));
    await client(fetchImpl, { headers: { "x-client": "desktop" } }).mandates.list();
    const headers = headersOf(calls[0]!);
    assert.equal(headers["x-client"], "desktop");
    assert.equal(headers.cookie, undefined);
  });
});

describe("mandates", () => {
  it("list() GETs /api/mandates and unwraps the array", async () => {
    const { fetchImpl, calls } = mockFetch(json({ mandates: [mandate] }));
    const result = await client(fetchImpl).mandates.list();
    assert.deepEqual(result, [mandate]);
    assert.equal(calls[0]!.url, "https://rico.test/api/mandates");
    assert.equal(calls[0]!.init.method, "GET");
    assert.equal(calls[0]!.init.body, undefined);
    assert.equal(headersOf(calls[0]!)["content-type"], undefined);
  });

  it("create() POSTs the input as JSON and returns the mandate", async () => {
    const { fetchImpl, calls } = mockFetch(json({ mandate }, 201));
    const input = { service: "Netflix", budgetCeiling: 20 };
    const result = await client(fetchImpl).mandates.create(input);
    assert.deepEqual(result, mandate);
    assert.equal(calls[0]!.init.method, "POST");
    assert.equal(calls[0]!.init.body, JSON.stringify(input));
    assert.equal(headersOf(calls[0]!)["content-type"], "application/json");
  });

  it("pause() PATCHes the mandate status with an encoded id", async () => {
    const paused = { ...mandate, status: "PAUSED" as const };
    const { fetchImpl, calls } = mockFetch(json({ mandate: paused }));
    const result = await client(fetchImpl).mandates.pause("a/b c");
    assert.equal(result.status, "PAUSED");
    assert.equal(calls[0]!.url, "https://rico.test/api/mandates/a%2Fb%20c");
    assert.equal(calls[0]!.init.method, "PATCH");
    assert.equal(calls[0]!.init.body, JSON.stringify({ status: "PAUSED" }));
  });

  it("pause() rejects an empty id without calling the API", async () => {
    const { fetchImpl, calls } = mockFetch();
    await assert.rejects(client(fetchImpl).mandates.pause("  "), TypeError);
    assert.equal(calls.length, 0);
  });
});

describe("transactions", () => {
  it("list() GETs /api/transactions and unwraps the array", async () => {
    const tx = { id: "tx-1", amount: 15.49, status: "COMPLETED" };
    const { fetchImpl, calls } = mockFetch(json({ transactions: [tx] }));
    assert.deepEqual(await client(fetchImpl).transactions.list(), [tx]);
    assert.equal(calls[0]!.url, "https://rico.test/api/transactions");
  });
});

describe("sentinel", () => {
  it("checkPrice() POSTs to /api/sentinel/run and returns summary and message", async () => {
    const summary = { cycleId: "c1", totalAudited: 1, anomaliesDetected: 0, audits: [] };
    const { fetchImpl, calls } = mockFetch(json({ success: true, summary, message: "Audit finished" }));
    const result = await client(fetchImpl).sentinel.checkPrice({ mandateId: "mandate-1" });
    assert.deepEqual(result, { summary, message: "Audit finished" });
    assert.equal(calls[0]!.url, "https://rico.test/api/sentinel/run");
    assert.equal(calls[0]!.init.body, JSON.stringify({ mandateId: "mandate-1" }));
  });

  it("checkPrice() with no input audits every mandate", async () => {
    const { fetchImpl, calls } = mockFetch(json({ summary: {}, message: "" }));
    await client(fetchImpl).sentinel.checkPrice();
    assert.equal(calls[0]!.init.body, "{}");
  });
});

describe("ocr", () => {
  it("parseInvoice() POSTs to /api/invoices/parse and unwraps the invoice", async () => {
    const invoice = { id: "inv-1", totalAmount: 42 };
    const { fetchImpl, calls } = mockFetch(json({ success: true, mode: "SINGLE", invoice }));
    const input = { content: "Invoice #1 total $42", sourceType: "TEXT_SNIPPET" as const };
    assert.deepEqual(await client(fetchImpl).ocr.parseInvoice(input), invoice);
    assert.equal(calls[0]!.url, "https://rico.test/api/invoices/parse");
    assert.equal(calls[0]!.init.body, JSON.stringify(input));
  });

  it("parseInvoice() rejects empty content without calling the API", async () => {
    const { fetchImpl, calls } = mockFetch();
    await assert.rejects(client(fetchImpl).ocr.parseInvoice({ content: "" }), TypeError);
    assert.equal(calls.length, 0);
  });
});

describe("errors", () => {
  it("throws RicoApiError carrying the server message, status and body", async () => {
    const { fetchImpl } = mockFetch(json({ error: "Authentication required." }, 401));
    await assert.rejects(client(fetchImpl).mandates.list(), (err: unknown) => {
      assert.ok(err instanceof RicoApiError);
      assert.ok(!(err instanceof RicoGuardrailHoldError));
      assert.equal(err.message, "Authentication required.");
      assert.equal(err.status, 401);
      assert.equal(err.method, "GET");
      assert.equal(err.path, "/api/mandates");
      assert.deepEqual(err.body, { error: "Authentication required." });
      assert.equal(err.name, "RicoApiError");
      return true;
    });
  });

  it("falls back to a generic message and raw text for non-JSON bodies", async () => {
    const { fetchImpl } = mockFetch(new Response("Bad Gateway", { status: 502 }));
    await assert.rejects(client(fetchImpl).transactions.list(), (err: unknown) => {
      assert.ok(err instanceof RicoApiError);
      assert.equal(err.message, "GET /api/transactions failed with HTTP 502");
      assert.equal(err.body, "Bad Gateway");
      return true;
    });
  });

  it("throws RicoGuardrailHoldError when a guardrail blocked the request", async () => {
    const body = { error: "This payment was rejected as a duplicate or by a guardrail.", status: "BLOCKED" };
    const { fetchImpl } = mockFetch(json(body, 409));
    await assert.rejects(client(fetchImpl).request("POST", "/api/transactions", {}), (err: unknown) => {
      assert.ok(err instanceof RicoGuardrailHoldError);
      assert.ok(err instanceof RicoApiError);
      assert.equal(err.holdStatus, "BLOCKED");
      assert.equal(err.status, 409);
      assert.equal(err.name, "RicoGuardrailHoldError");
      return true;
    });
  });

  it("treats ANOMALY_HOLD as a guardrail hold", async () => {
    const { fetchImpl } = mockFetch(json({ error: "Held", status: "ANOMALY_HOLD" }, 423));
    await assert.rejects(client(fetchImpl).mandates.pause("m1"), RicoGuardrailHoldError);
  });

  it("does not treat an ordinary 409 as a guardrail hold", async () => {
    const { fetchImpl } = mockFetch(json({ error: "A sentinel audit is already running." }, 409));
    await assert.rejects(client(fetchImpl).sentinel.checkPrice(), (err: unknown) => {
      assert.ok(err instanceof RicoApiError);
      assert.ok(!(err instanceof RicoGuardrailHoldError));
      return true;
    });
  });

  it("wraps fetch failures in RicoNetworkError with the cause", async () => {
    const cause = new TypeError("fetch failed");
    const { fetchImpl } = mockFetch(cause);
    await assert.rejects(client(fetchImpl).mandates.list(), (err: unknown) => {
      assert.ok(err instanceof RicoNetworkError);
      assert.equal(err.cause, cause);
      assert.match(err.message, /GET \/api\/mandates failed: fetch failed/);
      return true;
    });
  });

  it("aborts when the caller's signal fires", async () => {
    const controller = new AbortController();
    const fetchImpl = ((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal!.addEventListener("abort", () => reject(init.signal!.reason));
      })) as unknown as typeof fetch;
    const pending = client(fetchImpl).mandates.list({ signal: controller.signal });
    controller.abort();
    await assert.rejects(pending, RicoNetworkError);
  });

  it("aborts after timeoutMs", async () => {
    const fetchImpl = ((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal!.addEventListener("abort", () => reject(init.signal!.reason));
      })) as unknown as typeof fetch;
    await assert.rejects(client(fetchImpl, { timeoutMs: 10 }).mandates.list(), RicoNetworkError);
  });
});
