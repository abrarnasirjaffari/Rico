import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RicoWebhookSignatureError,
  assertValidRicoWebhook,
  signRicoWebhook,
  verifyRicoWebhook,
} from "./index.ts";

const SECRET = "whsec_rico_test_secret_32_chars_min";
const SAMPLE_PAYLOAD = JSON.stringify({
  id: "evt_hold_01",
  type: "sentinel.anomaly_hold",
  data: { mandateId: "mnd_123", service: "AWS", amount: 140, ceiling: 100 },
});

describe("Rico Webhook HMAC-SHA256 Verifier", () => {
  it("verifies sha256=<hex> and raw <hex> signatures and parses event JSON", () => {
    const sig = signRicoWebhook({ payload: SAMPLE_PAYLOAD, secret: SECRET });
    assert.match(sig, /^sha256=[0-9a-f]{64}$/);

    const res1 = verifyRicoWebhook({
      payload: SAMPLE_PAYLOAD,
      signature: sig,
      secret: SECRET,
    });
    assert.equal(res1.valid, true);
    if (res1.valid) {
      assert.equal(res1.algorithm, "sha256");
      assert.equal(res1.event?.type, "sentinel.anomaly_hold");
    }

    // Raw 64-char hex without sha256= prefix
    const rawHex = sig.replace("sha256=", "");
    const res2 = verifyRicoWebhook({
      payload: Buffer.from(SAMPLE_PAYLOAD, "utf8"),
      signature: rawHex,
      secret: SECRET,
    });
    assert.equal(res2.valid, true);
  });

  it("rejects tampered payload and wrong secret", () => {
    const sig = signRicoWebhook({ payload: SAMPLE_PAYLOAD, secret: SECRET });

    const tampered = verifyRicoWebhook({
      payload: SAMPLE_PAYLOAD.replace("140", "10"),
      signature: sig,
      secret: SECRET,
    });
    assert.equal(tampered.valid, false);
    if (!tampered.valid) {
      assert.equal(tampered.code, "INVALID_SIGNATURE");
    }

    const wrongSecret = verifyRicoWebhook({
      payload: SAMPLE_PAYLOAD,
      signature: sig,
      secret: "wrong_secret",
    });
    assert.equal(wrongSecret.valid, false);
    if (!wrongSecret.valid) {
      assert.equal(wrongSecret.code, "INVALID_SIGNATURE");
    }
  });

  it("handles missing or malformed signatures safely without throwing RangeError", () => {
    const missing = verifyRicoWebhook({
      payload: SAMPLE_PAYLOAD,
      signature: undefined,
      secret: SECRET,
    });
    assert.equal(missing.valid, false);
    if (!missing.valid) assert.equal(missing.code, "MISSING_SIGNATURE");

    const shortSig = verifyRicoWebhook({
      payload: SAMPLE_PAYLOAD,
      signature: "sha256=deadbeef",
      secret: SECRET,
    });
    assert.equal(shortSig.valid, false);
    if (!shortSig.valid) assert.equal(shortSig.code, "MALFORMED_SIGNATURE");
  });

  it("validates timestamped signatures (t=...,v1=...) and enforces replay tolerance", () => {
    const nowSec = 1_763_280_000;
    const sig = signRicoWebhook({
      payload: SAMPLE_PAYLOAD,
      secret: SECRET,
      timestamp: nowSec,
    });
    assert.match(sig, /^t=\d+,v1=[0-9a-f]{64}$/);

    const fresh = verifyRicoWebhook({
      payload: SAMPLE_PAYLOAD,
      signature: sig,
      secret: SECRET,
      nowMs: (nowSec + 60) * 1000,
      toleranceSeconds: 300,
    });
    assert.equal(fresh.valid, true);

    const expired = verifyRicoWebhook({
      payload: SAMPLE_PAYLOAD,
      signature: sig,
      secret: SECRET,
      nowMs: (nowSec + 600) * 1000,
      toleranceSeconds: 300,
    });
    assert.equal(expired.valid, false);
    if (!expired.valid) assert.equal(expired.code, "TIMESTAMP_EXPIRED");
  });

  it("assertValidRicoWebhook throws RicoWebhookSignatureError on invalid signature", () => {
    assert.throws(
      () =>
        assertValidRicoWebhook({
          payload: SAMPLE_PAYLOAD,
          signature: "sha256=" + "0".repeat(64),
          secret: SECRET,
        }),
      (err: unknown) =>
        err instanceof RicoWebhookSignatureError && err.code === "INVALID_SIGNATURE"
    );
  });
});
