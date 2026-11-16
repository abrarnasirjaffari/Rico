import {
  RicoClient,
  RicoGuardrailError,
  RicoPaymentQuote,
  createGeminiToolDeclaration,
  createMcpToolDefinition,
  createOpenAIToolDefinition,
  handleGeminiFunctionCall,
  handleMcpToolCall,
  handleOpenAIToolCall,
  withRicoGuardrails,
} from "./index";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function makeQuote(overrides: Partial<RicoPaymentQuote> = {}): RicoPaymentQuote {
  return {
    mandateId: "mnd_openai_monthly",
    service: "OpenAI API Credits",
    amount: 20,
    currency: "USD",
    budgetCeiling: 50,
    billingPeriod: "2026-11",
    periodLabel: "Nov 2026",
    priceSource: "live_browser",
    confirmToken: "signed-confirm-token-abc",
    expiresAt: Date.now() + 5 * 60 * 1000,
    ...overrides,
  };
}

function makeMockClient(
  quoteOrError: RicoPaymentQuote | Error | Record<string, unknown>
): RicoClient {
  return {
    payments: {
      async quote() {
        if (quoteOrError instanceof Error) {
          throw quoteOrError;
        }
        if ("code" in quoteOrError && !("confirmToken" in quoteOrError)) {
          throw quoteOrError;
        }
        return { quote: quoteOrError as RicoPaymentQuote };
      },
    },
  };
}

export async function runAdapterTests(): Promise<{
  passed: number;
  failed: number;
  results: Array<{ name: string; success: boolean; error?: string }>;
}> {
  const results: Array<{ name: string; success: boolean; error?: string }> = [];

  const testCases: Array<{ name: string; fn: () => Promise<void> | void }> = [
    {
      name: "1. Allowed charge quotes first and passes confirmToken to toolFn",
      fn: async () => {
        const state = { toolInvoked: false, receivedToken: "" };

        const client = makeMockClient(makeQuote({ amount: 20, budgetCeiling: 50 }));
        const guardedPay = withRicoGuardrails(
          async (args: { amount: number; service: string }, ctx) => {
            state.toolInvoked = true;
            state.receivedToken = ctx.confirmToken;
            return { orderId: "ORD-1001", paid: args.amount };
          },
          { client, mandateId: "mnd_openai_monthly" }
        );

        const outcome = await guardedPay({ amount: 20, service: "OpenAI" });
        assert(outcome.ok === true && outcome.blocked === false, "Allowed charge succeeds");
        assert(state.toolInvoked === true, "Underlying toolFn was called");
        assert(state.receivedToken === "signed-confirm-token-abc", "confirmToken passed to toolFn");
        assert(outcome.result.orderId === "ORD-1001", "Tool result preserved");
      },
    },
    {
      name: "2. Over-budget charge halts cleanly without invoking toolFn",
      fn: async () => {
        const state = { toolInvoked: false };
        const client = makeMockClient(makeQuote({ amount: 20, budgetCeiling: 50 }));

        const guardedPay = withRicoGuardrails(
          async () => {
            state.toolInvoked = true;
            return { orderId: "SHOULD-NOT-RUN" };
          },
          { client, mandateId: "mnd_openai_monthly" }
        );

        const outcome = await guardedPay({ amount: 120, service: "OpenAI" });
        assert(outcome.ok === false && outcome.blocked === true, "Over-budget charge blocked");
        assert(outcome.code === "BUDGET_EXCEEDED", "Block code is BUDGET_EXCEEDED");
        assert(state.toolInvoked === false, "toolFn must NOT execute on over-budget charge");
      },
    },
    {
      name: "3. Server-refused quote (OVER_BUDGET) halts cleanly",
      fn: async () => {
        const state = { toolInvoked: false };
        const client = makeMockClient({
          code: "OVER_BUDGET",
          message: "Mandate monthly ceiling ($50.00) exceeded.",
        });

        const guardedPay = withRicoGuardrails(
          async () => {
            state.toolInvoked = true;
            return { ok: true };
          },
          { client, mandateId: "mnd_openai_monthly" }
        );

        const outcome = await guardedPay({ amount: 80 });
        assert(outcome.ok === false && outcome.blocked === true, "Refused quote halts cleanly");
        assert(outcome.code === "BUDGET_EXCEEDED", "Maps OVER_BUDGET to BUDGET_EXCEEDED");
        assert(state.toolInvoked === false, "toolFn never invoked");
      },
    },
    {
      name: "4. >20% price spike anomaly halts execution unless approved",
      fn: async () => {
        const state = { toolInvoked: false };
        // Baseline $20 -> quoted $30 (+50% spike, still under $50 ceiling)
        const client = makeMockClient(makeQuote({ amount: 30, budgetCeiling: 50 }));

        const guardedPay = withRicoGuardrails(
          async () => {
            state.toolInvoked = true;
            return { ok: true };
          },
          {
            client,
            mandateId: "mnd_openai_monthly",
            baselinePrice: 20,
          }
        );

        const outcome = await guardedPay({ amount: 30 });
        assert(outcome.ok === false && outcome.blocked === true, "Price spike blocked");
        assert(outcome.code === "PRICE_SPIKE", "Block code is PRICE_SPIKE");
        assert(state.toolInvoked === false, "toolFn blocked on >20% spike");
      },
    },
    {
      name: "5. onBlock: 'throw' throws RicoGuardrailError on budget violation",
      fn: async () => {
        const client = makeMockClient(makeQuote({ amount: 75, budgetCeiling: 50 }));
        const guardedPay = withRicoGuardrails(
          async () => ({ ok: true }),
          { client, mandateId: "mnd_openai_monthly", onBlock: "throw" }
        );

        let threwCorrectly = false;
        try {
          await guardedPay({ amount: 75 });
        } catch (err) {
          threwCorrectly =
            err instanceof RicoGuardrailError && err.code === "BUDGET_EXCEEDED";
        }
        assert(threwCorrectly, "Throws RicoGuardrailError with BUDGET_EXCEEDED");
      },
    },
    {
      name: "6. OpenAI tool schema & tool_call dispatch (allowed + over-budget)",
      fn: async () => {
        const def = createOpenAIToolDefinition();
        assert(def.type === "function", "OpenAI schema type is function");
        assert(def.function.parameters.required.includes("mandateId"), "Requires mandateId");

        const client = makeMockClient(makeQuote({ amount: 15, budgetCeiling: 40 }));
        const guarded = withRicoGuardrails(
          async (args: { amount: number }, ctx) => ({
            captured: args.amount,
            token: ctx.confirmToken,
          }),
          { client, mandateId: "mnd_openai_monthly" }
        );

        const allowed = await handleOpenAIToolCall(
          {
            id: "call_ok",
            type: "function",
            function: {
              name: def.function.name,
              arguments: JSON.stringify({ mandateId: "mnd_openai_monthly", amount: 15 }),
            },
          },
          guarded
        );
        assert(allowed.outcome.ok === true, "OpenAI allowed call succeeded");
        assert(allowed.message.role === "tool", "Returns OpenAI tool role message");

        const blocked = await handleOpenAIToolCall(
          {
            id: "call_over",
            type: "function",
            function: {
              name: def.function.name,
              arguments: JSON.stringify({ mandateId: "mnd_openai_monthly", amount: 99 }),
            },
          },
          guarded
        );
        assert(blocked.outcome.ok === false, "OpenAI over-budget call blocked");
        assert(blocked.message.content.includes("BUDGET_EXCEEDED"), "Message includes block code");
      },
    },
    {
      name: "7. Google Gemini FunctionDeclaration & dispatch (allowed + over-budget)",
      fn: async () => {
        const decl = createGeminiToolDeclaration();
        assert(decl.parameters.type === "OBJECT", "Gemini schema uses OBJECT type");
        assert(decl.parameters.properties.amount.type === "NUMBER", "Gemini amount uses NUMBER");

        const client = makeMockClient(makeQuote({ amount: 25, budgetCeiling: 40 }));
        const guarded = withRicoGuardrails(
          async (args: { amount: number }) => ({ paid: args.amount }),
          { client, mandateId: "mnd_openai_monthly" }
        );

        const allowed = await handleGeminiFunctionCall(
          { name: decl.name, args: { mandateId: "mnd_openai_monthly", amount: 25 } },
          guarded
        );
        assert(allowed.outcome.ok === true, "Gemini allowed call succeeded");
        assert(allowed.part.functionResponse.name === decl.name, "Returns Gemini functionResponse");

        const blocked = await handleGeminiFunctionCall(
          { name: decl.name, args: { mandateId: "mnd_openai_monthly", amount: 65 } },
          guarded
        );
        assert(blocked.outcome.ok === false, "Gemini over-budget call blocked");
      },
    },
    {
      name: "8. MCP ToolDefinition & dispatch sets isError on guardrail halt",
      fn: async () => {
        const tool = createMcpToolDefinition();
        assert(tool.inputSchema.type === "object", "MCP inputSchema type is object");

        const client = makeMockClient(makeQuote({ amount: 10, budgetCeiling: 30 }));
        const guarded = withRicoGuardrails(
          async (args: { amount: number }) => ({ paid: args.amount }),
          { client, mandateId: "mnd_openai_monthly" }
        );

        const allowed = await handleMcpToolCall(
          { name: tool.name, arguments: { mandateId: "mnd_openai_monthly", amount: 10 } },
          guarded
        );
        assert(allowed.response.isError === false, "MCP allowed call has isError: false");

        const blocked = await handleMcpToolCall(
          { name: tool.name, arguments: { mandateId: "mnd_openai_monthly", amount: 55 } },
          guarded
        );
        assert(blocked.response.isError === true, "MCP over-budget call sets isError: true");
        assert(blocked.response.content[0].text.includes("BUDGET_EXCEEDED"), "MCP text explains block");
      },
    },
  ];

  let passed = 0;
  let failed = 0;
  for (const tc of testCases) {
    try {
      await tc.fn();
      results.push({ name: tc.name, success: true });
      passed++;
    } catch (err) {
      results.push({
        name: tc.name,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
      failed++;
    }
  }

  return { passed, failed, results };
}

if (typeof process !== "undefined" && process.argv[1]?.includes("adapters.test")) {
  runAdapterTests().then((res) => {
    console.log(`\n=== @rico/sdk ADAPTER GUARDRAIL TESTS ===`);
    console.log(`Passed: ${res.passed}/${res.passed + res.failed}`);
    for (const r of res.results) {
      console.log(`${r.success ? "PASS" : "FAIL"} ${r.name}`);
      if (r.error) console.error(`   ${r.error}`);
    }
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
