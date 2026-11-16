import { GuardedToolHandler, GuardrailToolResult } from "./types";

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
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
  };
}

export interface McpToolCallRequest {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface McpToolCallResponse {
  content: Array<{ type: "text"; text: string }>;
  isError: boolean;
}

/**
 * Generates a Model Context Protocol (MCP) tool definition for guarded Rico payments.
 */
export function createMcpToolDefinition(options?: {
  name?: string;
  description?: string;
}): McpToolDefinition {
  return {
    name: options?.name ?? "rico_guarded_payment",
    description:
      options?.description ??
      "Quote and execute a bounded SaaS/vendor payment guarded by Rico's hard budget ceiling and >20% price spike protection.",
    inputSchema: {
      type: "object",
      properties: {
        mandateId: {
          type: "string",
          description: "The authorized Rico financial mandate ID to charge against.",
        },
        service: {
          type: "string",
          description: "Merchant or subscription name (e.g., OpenAI, AWS, Notion).",
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
    },
  };
}

export const ricoMcpTools: McpToolDefinition[] = [createMcpToolDefinition()];

/**
 * Dispatches an MCP tools/call request through a guarded handler and returns a spec-compliant MCP response.
 */
export async function handleMcpToolCall<
  TArgs = Record<string, unknown>,
  TResult = unknown,
>(
  request: McpToolCallRequest,
  handler: GuardedToolHandler<TArgs, TResult>
): Promise<{
  outcome: GuardrailToolResult<TResult>;
  response: McpToolCallResponse;
}> {
  const args = (request.arguments ?? {}) as TArgs;
  const outcome = await handler(args);

  return {
    outcome,
    response: {
      content: [
        {
          type: "text",
          text: JSON.stringify(outcome),
        },
      ],
      isError: !outcome.ok,
    },
  };
}
