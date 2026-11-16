export type WebhookVerificationFailureCode =
  | "MISSING_SIGNATURE"
  | "MISSING_SECRET"
  | "MALFORMED_SIGNATURE"
  | "TIMESTAMP_EXPIRED"
  | "INVALID_SIGNATURE"
  | "INVALID_PAYLOAD";

export interface RicoWebhookEvent<TData = Record<string, unknown>> {
  id?: string;
  type: string;
  createdAt?: string;
  data: TData;
  [key: string]: unknown;
}

export interface VerifyRicoWebhookInput {
  /** Raw request body string or bytes (do not re-serialize JSON before verifying). */
  payload: string | Uint8Array;
  /** Header value: `<hex>`, `sha256=<hex>`, or `t=<unixSeconds>,v1=<hex>`. */
  signature: string | null | undefined;
  /** Shared webhook signing secret. */
  secret: string | null | undefined;
  /** Optional Unix timestamp (seconds) if passed via a separate header such as `x-rico-timestamp`. */
  timestamp?: number | string | null;
  /** Maximum allowed clock skew/age in seconds when a timestamp is present (default: 300). Set 0 to disable. */
  toleranceSeconds?: number;
  /** Override current time in milliseconds (primarily for deterministic unit tests). */
  nowMs?: number;
}

export type VerifyRicoWebhookResult<TEvent = RicoWebhookEvent> =
  | {
      valid: true;
      algorithm: "sha256";
      timestamp?: number;
      event?: TEvent;
    }
  | {
      valid: false;
      code: WebhookVerificationFailureCode;
      reason: string;
    };

export interface SignRicoWebhookInput {
  payload: string | Uint8Array;
  secret: string;
  timestamp?: number;
}

export class RicoWebhookSignatureError extends Error {
  readonly code: WebhookVerificationFailureCode;

  constructor(code: WebhookVerificationFailureCode, message: string) {
    super(message);
    this.name = "RicoWebhookSignatureError";
    this.code = code;
  }
}
