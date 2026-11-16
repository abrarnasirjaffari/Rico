// Response shapes mirror the Rico Next.js API routes in src/app/api/.

export type MandateStatus = "ACTIVE" | "PAUSED" | "ANOMALY_HOLD";

export interface Mandate {
  id: string;
  ownerId: string | null;
  service: string;
  budgetCeiling: number;
  lastScrapedPrice: number;
  recurrence: string;
  nextRun: string;
  status: MandateStatus;
  category: string;
  currency: string;
  strictMode: boolean;
  merchantUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMandateInput {
  service: string;
  budgetCeiling: number;
  id?: string;
  lastScrapedPrice?: number;
  recurrence?: string;
  nextRun?: string;
  status?: MandateStatus;
  category?: string;
  currency?: string;
  strictMode?: boolean;
  merchantUrl?: string | null;
}

export type TransactionStatus = "COMPLETED" | "PENDING" | "BLOCKED";

export interface Transaction {
  id: string;
  mandateId: string | null;
  orderId: string;
  idempotencyKey: string | null;
  service: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  timestamp: string;
  receiptData: Record<string, unknown> | null;
  createdAt: string;
}

export type SentinelAuditResultStatus =
  | "NORMAL"
  | "PRICE_DROP"
  | "PRICE_INCREASE_SAFE"
  | "ANOMALY_SPIKE"
  | "BUDGET_EXCEEDED"
  | "UNVERIFIED";

export interface SentinelAuditRecord {
  id: string;
  ownerId?: string | null;
  mandateId: string;
  service: string;
  oldPrice: number;
  newPrice: number;
  budgetCeiling: number;
  currency: string;
  status: SentinelAuditResultStatus;
  percentageDiff: number;
  details: string;
  alertDispatched: boolean;
  alertId?: string;
  timestamp: string;
}

export interface SentinelCycleSummary {
  cycleId: string;
  startedAt: string;
  completedAt: string;
  totalAudited: number;
  healthyCount: number;
  anomaliesDetected: number;
  savingsCount: number;
  unverifiedCount: number;
  alertsDispatched: number;
  alertsDelivered: number;
  audits: SentinelAuditRecord[];
}

export interface CheckPriceInput {
  /** Audit one mandate. Omit both fields to audit all of the caller's mandates. */
  mandateId?: string;
  service?: string;
}

export interface CheckPriceResult {
  summary: SentinelCycleSummary;
  message: string;
}

export type InvoiceSourceType = "IMAGE_BASE64" | "IMAGE_URL" | "TEXT_SNIPPET" | "PDF_SIMULATION";

export type ExpenseCategory =
  | "SAAS_SUBSCRIPTION"
  | "CLOUD_INFRASTRUCTURE"
  | "OFFICE_EQUIPMENT"
  | "TRAVEL_TRANSPORT"
  | "MEALS_ENTERTAINMENT"
  | "PROFESSIONAL_SERVICES"
  | "MARKETING_ADVERTISING"
  | "UTILITIES_COMMUNICATION"
  | "OTHER";

export interface ParseInvoiceInput {
  content: string;
  sourceType?: InvoiceSourceType;
  vendorHint?: string;
  currencyHint?: string;
}

export interface ParsedLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  category: ExpenseCategory;
  taxDeduction: {
    isDeductible: boolean;
    deductionPercentage: number;
    deductibleAmount: number;
    taxSchedule: string;
    taxCode: string;
    guidelines: string;
  };
}

export interface ParsedInvoice {
  id: string;
  invoiceNumber: string;
  vendor: { name: string; domain?: string; taxId?: string; address?: string };
  date: string;
  dueDate?: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  tipAmount: number;
  totalAmount: number;
  lineItems: ParsedLineItem[];
  paymentDetails?: {
    method?: "PAYPAL" | "CREDIT_CARD" | "BANK_TRANSFER" | "UNKNOWN";
    cardLast4?: string;
    paypalTransactionId?: string;
    status?: "PAID" | "UNPAID" | "PENDING";
  };
  matchedMandate?: {
    mandateId: string;
    service: string;
    budgetCeiling: number;
    exceedsCeiling: boolean;
    discrepancyUsd: number;
    status: "WITHIN_BUDGET" | "EXCEEDS_BUDGET" | "ANOMALY_HOLD";
  };
  taxSummary: {
    totalDeductibleAmount: number;
    effectiveDeductionPercent: number;
    primaryTaxSchedule: string;
  };
  confidenceScore: number;
  anomalies: string[];
  rawOcrText?: string;
  sourceType: InvoiceSourceType;
  parsedAt: string;
}
