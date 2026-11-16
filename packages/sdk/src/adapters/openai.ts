import { GuardedToolHandler, GuardrailToolResult } from "./types";

export interface OpenAIToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<
        string,
        {
          type: string;
          description: string;
          enum?: string[];
        }
      >;
      required: string[];
      additionalProperties?: boolean;
    };
  };
}

export interface OpenAIToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface OpenAIToolMessage {
  role: "tool";
  tool_call_id: string;
  content: string;
}

/**
 * Generates an OpenAI Chat Completions / Responses API tool schema for guarded Rico payments.
 */
export function createOpenAIToolDefinition(options?: {
  name?: string;
  description?: string;
}): OpenAIToolDefinition {
  return {
    type: "function",
    function: {
      name: options?.name ?? "rico_guarded_payment",
      description:
        options?.description ??
        "Quote and execute a bounded SaaS/vendor payment guarded by Rico's hard budget ceiling and >20% price spike protection.",
      parameters: {
        type: "object",
        properties: {
          mandateId: {
            type: "string",
            description: "The authorized Rico financial mandate ID to charge against.",
          },
          service: {
            type: "string",
            description: "Merchant or subscription name (e.g., OpenAI, AWS, Vercel).",
          },
          amount: {
            type: "number",
            description: "Requested payment amount in the mandate currency.",
          },
          currency: {
            type: "string",
            description: "ISO-4217 currency code (e.g., USD).",
          },
          fundingRail: {
            type: "string",
            description: "Payment rail to use after quote confirmation.",
            enum: ["PAYPAL", "VISA"],
          },
        },
        required: ["mandateId", "amount"],
        additionalProperties: false,
      },
    },
  };
}

export const ricoOpenAITools: OpenAIToolDefinition[] = [
  createOpenAIToolDefinition(),
];

/**
 * Dispatches an OpenAI tool_call through a guarded handler and formats the tool role response message.
 */
export async function handleOpenAIToolCall<
  TArgs = Record<string, unknown>,
  TResult = unknown,
>(
  toolCall: OpenAIToolCall,
  handler: GuardedToolHandler<TArgs, TResult>
): Promise<{
  outcome: GuardrailToolResult<TResult>;
  message: OpenAIToolMessage;
}> {
  let parsedArgs: TArgs;
  try {
    parsedArgs = JSON.parse(toolCall.function.arguments || "{}") as TArgs;
  } catch (err) {
    const outcome: GuardrailToolResult<TResult> = {
      ok: false,
      blocked: true,
      code: "QUOTE_REFUSED",
      reason: `Invalid JSON arguments from OpenAI tool call: ${
        err instanceof Error ? err.message : String(err)
      }`,
      mandateId: "",
    };
    return {
      outcome,
      message: {
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(outcome),
      },
    };
  }

  const outcome = await handler(parsedArgs);
  return {
    outcome,
    message: {
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify(outcome),
    },
  };
}
