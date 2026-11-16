import { createHmac, timingSafeEqual } from "node:crypto";
import {
  RicoWebhookSignatureError,
  type RicoWebhookEvent,
  type SignRicoWebhookInput,
  type VerifyRicoWebhookInput,
  type VerifyRicoWebhookResult,
} from "./types.ts";

const DEFAULT_TOLERANCE_SECONDS = 300;
const HEX_64_REGEX = /^[0-9a-f]{64}$/i;

function toPayloadBuffer(payload: string | Uint8Array): Buffer {
  if (typeof payload === "string") {
    return Buffer.from(payload, "utf8");
  }
  return Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength);
}

interface ParsedSignatureHeader {
  digestHex: string;
  embeddedTimestamp?: number;
}

function parseSignatureHeader(raw: string): ParsedSignatureHeader | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Format 1: timestamped Stripe-style `t=1731740000,v1=<64-hex>`
  if (trimmed.includes(",")) {
    let timestampVal: number | undefined;
    let v1Val: string | undefined;

    for (const part of trimmed.split(",")) {
      const eqIdx = part.indexOf("=");
      if (eqIdx === -1) continue;
      const key = part.slice(0, eqIdx).trim();
      const val = part.slice(eqIdx + 1).trim();
      if (key === "t") {
        const num = Number(val);
        if (!Number.isFinite(num) || num <= 0) return null;
        timestampVal = num;
      } else if (key === "v1") {
        v1Val = val;
      }
    }

    if (!v1Val || !HEX_64_REGEX.test(v1Val)) return null;
    return {
      digestHex: v1Val.toLowerCase(),
      embeddedTimestamp: timestampVal,
    };
  }

  // Format 2: `sha256=<64-hex>`
  const normalized = trimmed.toLowerCase().startsWith("sha256=")
    ? trimmed.slice("sha256=".length).trim()
    : trimmed;

  // Format 3: raw `<64-hex>`
  if (!HEX_64_REGEX.test(normalized)) {
    return null;
  }

  return { digestHex: normalized.toLowerCase() };
}

function resolveTimestamp(
  explicit: number | string | null | undefined,
  embedded: number | undefined
): number | undefined {
  if (embedded !== undefined) return embedded;
  if (explicit === undefined || explicit === null || explicit === "") {
    return undefined;
  }
  const parsed = typeof explicit === "number" ? explicit : Number(explicit);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

/**
 * Generates an HMAC-SHA256 signature for Rico webhook payloads.
 * When `timestamp` (Unix seconds) is included, signs `${timestamp}.${payload}` and returns `t=<ts>,v1=<hex>`.
 */
export function signRicoWebhook(input: SignRicoWebhookInput): string {
  if (!input.secret) {
    throw new TypeError("signRicoWebhook: `secret` must be a non-empty string.");
  }
  const payloadBuf = toPayloadBuffer(input.payload);
  const hmac = createHmac("sha256", input.secret);

  if (input.timestamp !== undefined) {
    hmac.update(`${input.timestamp}.`);
    hmac.update(payloadBuf);
    return `t=${input.timestamp},v1=${hmac.digest("hex")}`;
  }

  hmac.update(payloadBuf);
  return `sha256=${hmac.digest("hex")}`;
}

/**
 * Verifies a Rico webhook payload using constant-time HMAC-SHA256 comparison (`timingSafeEqual`).
 */
export function verifyRicoWebhook<TEvent = RicoWebhookEvent>(
  input: VerifyRicoWebhookInput
): VerifyRicoWebhookResult<TEvent> {
  if (!input.secret || typeof input.secret !== "string") {
    return {
      valid: false,
      code: "MISSING_SECRET",
      reason: "Webhook signing secret is missing.",
    };
  }

  if (!input.signature || typeof input.signature !== "string") {
    return {
      valid: false,
      code: "MISSING_SIGNATURE",
      reason: "Webhook signature header is missing.",
    };
  }

  if (
    typeof input.payload !== "string" &&
    !(input.payload instanceof Uint8Array)
  ) {
    return {
      valid: false,
      code: "INVALID_PAYLOAD",
      reason: "Webhook payload must be a raw string or Uint8Array.",
    };
  }

  const parsedSig = parseSignatureHeader(input.signature);
  if (!parsedSig) {
    return {
      valid: false,
      code: "MALFORMED_SIGNATURE",
      reason: "Webhook signature must be hex, sha256=<hex>, or t=<ts>,v1=<hex>.",
    };
  }

  const timestamp = resolveTimestamp(
    input.timestamp,
    parsedSig.embeddedTimestamp
  );
  if (timestamp !== undefined && Number.isNaN(timestamp)) {
    return {
      valid: false,
      code: "MALFORMED_SIGNATURE",
      reason: "Webhook timestamp is not a valid number.",
    };
  }

  const tolerance = input.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  if (timestamp !== undefined && tolerance > 0) {
    const nowSec = Math.floor((input.nowMs ?? Date.now()) / 1000);
    if (Math.abs(nowSec - timestamp) > tolerance) {
      return {
        valid: false,
        code: "TIMESTAMP_EXPIRED",
        reason: `Webhook timestamp (${timestamp}) is outside the ${tolerance}s tolerance window.`,
      };
    }
  }

  const payloadBuf = toPayloadBuffer(input.payload);
  const hmac = createHmac("sha256", input.secret);
  if (timestamp !== undefined) {
    hmac.update(`${timestamp}.`);
  }
  hmac.update(payloadBuf);

  const expectedBuf = hmac.digest();
  const receivedBuf = Buffer.from(parsedSig.digestHex, "hex");

  if (
    expectedBuf.length !== receivedBuf.length ||
    !timingSafeEqual(expectedBuf, receivedBuf)
  ) {
    return {
      valid: false,
      code: "INVALID_SIGNATURE",
      reason: "Webhook HMAC-SHA256 signature verification failed.",
    };
  }

  let event: TEvent | undefined;
  try {
    event = JSON.parse(payloadBuf.toString("utf8")) as TEvent;
  } catch {
    // Allow non-JSON raw payloads if signature verified cleanly.
  }

  return {
    valid: true,
    algorithm: "sha256",
    ...(timestamp !== undefined ? { timestamp } : {}),
    ...(event !== undefined ? { event } : {}),
  };
}

/**
 * Verifies a Rico webhook and throws `RicoWebhookSignatureError` on failure.
 */
export function assertValidRicoWebhook<TEvent = RicoWebhookEvent>(
  input: VerifyRicoWebhookInput
): { valid: true; algorithm: "sha256"; timestamp?: number; event?: TEvent } {
  const result = verifyRicoWebhook<TEvent>(input);
  if (!result.valid) {
    throw new RicoWebhookSignatureError(result.code, result.reason);
  }
  return result;
}
