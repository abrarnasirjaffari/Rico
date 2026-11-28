import json
import sys
import unittest
from pathlib import Path

_PKG_ROOT = str(Path(__file__).resolve().parents[1])
if _PKG_ROOT not in sys.path:
    sys.path.insert(0, _PKG_ROOT)

from rico_sdk import RicoClient, RicoWebhookError, assert_valid_webhook, sign_webhook, verify_webhook

SECRET = "whsec_python_sdk_test_secret_32"
PAYLOAD = json.dumps({"id": "evt_1", "type": "sentinel.anomaly_hold", "data": {"amount": 120}})


class TestWebhookVerification(unittest.TestCase):
    def test_valid_sha256_and_raw_hex_signatures(self) -> None:
        sig = sign_webhook(PAYLOAD, SECRET)
        self.assertTrue(sig.startswith("sha256="))
        self.assertTrue(verify_webhook(PAYLOAD, sig, SECRET))
        self.assertTrue(RicoClient.verify_webhook(PAYLOAD.encode("utf-8"), sig.replace("sha256=", ""), SECRET))

    def test_tampered_payload_wrong_secret_and_malformed_signatures(self) -> None:
        sig = sign_webhook(PAYLOAD, SECRET)
        self.assertFalse(verify_webhook(PAYLOAD.replace("120", "10"), sig, SECRET))
        self.assertFalse(verify_webhook(PAYLOAD, sig, "wrong_secret"))
        self.assertFalse(verify_webhook(PAYLOAD, None, SECRET))
        self.assertFalse(verify_webhook(PAYLOAD, "sha256=notvalidhex", SECRET))

    def test_timestamped_signature_and_replay_window(self) -> None:
        ts = 1_764_300_000
        sig = sign_webhook(PAYLOAD, SECRET, timestamp=ts)
        self.assertTrue(sig.startswith(f"t={ts},v1="))
        self.assertTrue(verify_webhook(PAYLOAD, sig, SECRET, tolerance_seconds=300, now_seconds=ts + 60))
        self.assertFalse(verify_webhook(PAYLOAD, sig, SECRET, tolerance_seconds=300, now_seconds=ts + 600))

    def test_assert_valid_webhook_raises_on_invalid(self) -> None:
        sig = sign_webhook(PAYLOAD, SECRET)
        assert_valid_webhook(PAYLOAD, sig, SECRET)
        with self.assertRaises(RicoWebhookError) as ctx:
            assert_valid_webhook(PAYLOAD, "sha256=" + ("0" * 64), SECRET)
        self.assertEqual(ctx.exception.code, "INVALID_SIGNATURE")


if __name__ == "__main__":
    unittest.main()
