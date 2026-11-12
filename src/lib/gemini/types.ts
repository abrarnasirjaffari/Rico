import type { PayPalReceipt } from "@/lib/paypal";

export interface ThoughtStep {
  step: string;
  status: "done" | "running" | "waiting";
  detail?: string;
}

export interface ThoughtProcess {
  summary: string;
  steps: ThoughtStep[];
}

export interface MandateToolParams {
  service: string;
  max_amount: number;
  schedule: string;
  currency?: string;
  category?: string;
  strict_mode?: boolean;
}

export interface VerifyPriceToolParams {
  service_url?: string;
  service_name: string;
  expected_price?: number;
}

export interface ExecutePaymentToolParams {
  mandate_id?: string;
  service_name: string;
  verified_price: number;
  budget_ceiling: number;
  funding_rail?: "PAYPAL" | "VISA" | "MASTERCARD" | "AUTO";
  recipient_email?: string;
  description?: string;
}

export interface BrowserActionEvent {
  action:
    | "search"
    | "navigate"
    | "scroll"
    | "extract"
    | "snapshot"
    | "act"
    | "switch_tab"
    | "open_tab"
    | "complete";
  url: string;
  title?: string;
  detail?: string;
  tabId?: string;
  ref?: string;
  generation?: number;
  status?: "running" | "done";
}

export interface StreamEvent {
  type:
    | "token"
    | "step"
    | "thought"
    | "tool_call"
    | "browser_action"
    | "receipt"
    | "savings_advisory"
    | "payment_confirmation"
    | "done"
    | "error";
  text?: string;
  /** A server-signed payment quote the user must explicitly confirm. Nothing has been charged. */
  quote?: Record<string, unknown>;
  step?: ThoughtStep;
  thought?: ThoughtProcess;
  browserAction?: BrowserActionEvent;
  toolCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  receipt?: PayPalReceipt | Record<string, unknown>;
  advisory?: Record<string, unknown>;
  error?: string;
}

export interface ChatContext {
  /** The verified session user. Tools act only for this user. */
  ownerId?: string;
  strictMode?: boolean;
  persona?: string;
  injectedSkillPrompt?: string;
  activeMandates?: Array<{
    id: string;
    service: string;
    budgetCeiling: number;
    lastScrapedPrice: number;
    recurrence: string;
    status: string;
  }>;
}
