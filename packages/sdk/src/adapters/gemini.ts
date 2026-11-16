import { GuardedToolHandler, GuardrailToolResult } from "./types";

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: "OBJECT";
    properties: Record<
      string,
      {
        type: "STRING" | "NUMBER" | "BOOLEAN";
        description: string;
        enum?: string[];
      }
    >;
    required: string[];
  };
}

export interface GeminiFunctionCall {
  name: string;
  args?: Record<string, unknown>;
}

export interface GeminiFunctionResponse {
  functionResponse: {
    name: string;
    response: Record<string, unknown>;
  };
}

/**
 * Generates a Google Gemini (@google/genai) FunctionDeclaration for guarded Rico payments.
 */
export function createGeminiToolDeclaration(options?: {
  name?: string;
  description?: string;
}): GeminiFunctionDeclaration {
  return {
    name: options?.name ?? "rico_guarded_payment",
    description:
      options?.description ??
      "Quote and execute a bounded SaaS/vendor payment guarded by Rico's hard budget ceiling and >20% price spike protection.",
    parameters: {
      type: "OBJECT",
      properties: {
        mandateId: {
          type: "STRING",
          description: "The authorized Rico financial mandate ID to charge against.",
        },
        service: {
          type: "STRING",
          description: "Merchant or subscription name (e.g., OpenAI, AWS, PostHog).",
        },
        amount: {
          type: "NUMBER",
          description: "Requested payment amount in the mandate currency.",
        },
        currency: {
          type: "STRING",
          description: "ISO-4217 currency code (e.g., USD).",
        },
        fundingRail: {
          type: "STRING",
          description: "Payment rail to use after quote confirmation.",
          enum: ["PAYPAL", "VISA"],
        },
      },
      required: ["mandateId", "amount"],
    },
  };
}

export const ricoGeminiDeclarations: GeminiFunctionDeclaration[] = [
  createGeminiToolDeclaration(),
];

/**
 * Dispatches a Gemini functionCall through a guarded handler and formats a functionResponse part.
 */
export async function handleGeminiFunctionCall<
  TArgs = Record<string, unknown>,
  TResult = unknown,
>(
  functionCall: GeminiFunctionCall,
  handler: GuardedToolHandler<TArgs, TResult>
): Promise<{
  outcome: GuardrailToolResult<TResult>;
  part: GeminiFunctionResponse;
}> {
  const args = (functionCall.args ?? {}) as TArgs;
  const outcome = await handler(args);

  return {
    outcome,
    part: {
      functionResponse: {
        name: functionCall.name,
        response: outcome as unknown as Record<string, unknown>,
      },
    },
  };
}
