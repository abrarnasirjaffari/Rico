import type { ReceiptData } from "./ReceiptDialog";

export interface Mandate {
  id: string;
  service: string;
  budgetCeiling: number;
  lastScrapedPrice: number;
  recurrence: string;
  nextRun: string;
  status: "ACTIVE" | "PAUSED" | "ANOMALY_HOLD";
  category: string;
  currency: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  service: string;
  amount: number;
  currency: string;
  status: "COMPLETED" | "PENDING" | "BLOCKED";
  timestamp: string;
  receiptData?: ReceiptData;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  eventType:
    | "PRICE_VERIFIED"
    | "GUARDRAIL_BLOCKED"
    | "PAYMENT_CAPTURED"
    | "MANDATE_CREATED";
  service: string;
  details: string;
  severity: "info" | "warning" | "success" | "danger";
}
