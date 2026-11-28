import base64
import json
import sys
import time
import unittest
from pathlib import Path
from typing import Any

_PKG_ROOT = str(Path(__file__).resolve().parents[1])
if _PKG_ROOT not in sys.path:
    sys.path.insert(0, _PKG_ROOT)

from rico_sdk import RicoApiError, RicoBudgetHoldError, RicoClient


def _encode_token(payload: dict[str, Any], sig: str = "hmacsig123") -> str:
    body = base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("ascii").rstrip("=")
    return f"{body}.{sig}"


def _sample_quote(
    *,
    amount: float = 20.0,
    budget_ceiling: float = 50.0,
    expires_at: int | None = None,
    token: str | None = None,
) -> dict[str, Any]:
    exp = expires_at if expires_at is not None else int((time.time() + 300) * 1000)
    confirm_token = token or _encode_token({"v": 1, "m": "mnd_123", "exp": exp})
    return {
        "mandateId": "mnd_123",
        "service": "OpenAI API",
        "amount": amount,
        "currency": "USD",
        "budgetCeiling": budget_ceiling,
        "billingPeriod": "2026-11",
        "periodLabel": "Nov 2026",
        "priceSource": "live_browser",
        "confirmToken": confirm_token,
        "expiresAt": exp,
    }


class TestRicoClient(unittest.TestCase):
    def test_list_and_create_mandates(self) -> None:
        calls: list[tuple[str, str, dict[str, str], Any]] = []

        def fake_request(method: str, url: str, headers: dict[str, str], body: Any, _timeout: float):
            calls.append((method, url, headers, body))
            if method == "GET" and url.endswith("/api/mandates"):
                return 200, {
                    "mandates": [
                        {
                            "id": "mnd_1",
                            "ownerId": "usr_1",
                            "service": "OpenAI",
                            "budgetCeiling": 50.0,
                            "lastScrapedPrice": 20.0,
                            "recurrence": "Monthly on 1st",
                            "nextRun": "Pending",
                            "status": "ACTIVE",
                            "category": "AI",
                            "currency": "USD",
                            "strictMode": False,
                        }
                    ]
                }
            if method == "POST" and url.endswith("/api/mandates"):
                return 201, {
                    "mandate": {
                        "id": "mnd_new",
                        "ownerId": "usr_1",
                        "service": body["service"],
                        "budgetCeiling": body["budgetCeiling"],
                        "lastScrapedPrice": 0.0,
                        "recurrence": body["recurrence"],
                        "nextRun": body["nextRun"],
                        "status": body["status"],
                        "category": body["category"],
                        "currency": body["currency"],
                        "strictMode": body["strictMode"],
                    }
                }
            raise AssertionError(f"Unexpected call: {method} {url}")

        client = RicoClient("https://rico.test/", session_token="sess_abc", request_fn=fake_request)
        mandates = client.list_mandates()
        self.assertEqual(len(mandates), 1)
        self.assertEqual(mandates[0].service, "OpenAI")
        self.assertEqual(calls[0][2]["Cookie"], "rico_auth_session=sess_abc")

        created = client.create_mandate("PostHog", budget_ceiling=100.0, strict_mode=True)
        self.assertEqual(created.id, "mnd_new")
        self.assertTrue(created.strict_mode)

    def test_two_step_quote_and_execute_with_idempotency(self) -> None:
        calls: list[tuple[str, str, dict[str, str], Any]] = []
        quote_data = _sample_quote(amount=25.0, budget_ceiling=50.0)

        def fake_request(method: str, url: str, headers: dict[str, str], body: Any, _timeout: float):
            calls.append((method, url, headers, body))
            if url.endswith("/api/payments/quote"):
                return 200, {"quote": quote_data}
            if url.endswith("/api/payments/execute"):
                return 201, {
                    "ok": True,
                    "status": "COMPLETED",
                    "message": "Captured",
                    "transactionId": "tx_1",
                    "orderId": "ORD-99",
                    "receipt": {"id": "ORD-99"},
                }
            raise AssertionError(f"Unexpected call: {method} {url}")

        client = RicoClient("https://rico.test", request_fn=fake_request)
        quote = client.quote_payment("mnd_123", amount=25.0, currency="USD")
        self.assertEqual(quote.confirm_token, quote_data["confirmToken"])

        receipt = client.execute_payment(quote.confirm_token, idempotency_key="idem_01")
        self.assertTrue(receipt.ok)
        self.assertEqual(receipt.order_id, "ORD-99")
        self.assertEqual(calls[1][2]["Idempotency-Key"], "idem_01")
        self.assertEqual(calls[1][3]["confirmToken"], quote.confirm_token)

    def test_client_side_and_server_side_over_budget_raise_hold_error(self) -> None:
        def server_over_budget(_m: str, _u: str, _h: dict[str, str], _b: Any, _t: float):
            return 422, {"code": "OVER_BUDGET", "error": "Exceeds ceiling"}

        client1 = RicoClient("https://rico.test", request_fn=server_over_budget)
        with self.assertRaises(RicoBudgetHoldError) as ctx1:
            client1.quote_payment("mnd_123", amount=90.0)
        self.assertEqual(ctx1.exception.code, "OVER_BUDGET")

        # Server returns a $20 quote with $50 ceiling, but caller requested $80 -> blocked client-side
        def server_returns_under(_m: str, _u: str, _h: dict[str, str], _b: Any, _t: float):
            return 200, {"quote": _sample_quote(amount=20.0, budget_ceiling=50.0)}

        client2 = RicoClient("https://rico.test", request_fn=server_returns_under)
        with self.assertRaises(RicoBudgetHoldError) as ctx2:
            client2.quote_payment("mnd_123", amount=80.0)
        self.assertEqual(ctx2.exception.code, "OVER_BUDGET")

    def test_invalid_expired_and_duplicate_confirm_token_blocked_before_http(self) -> None:
        http_calls = 0

        def fake_request(_m: str, _u: str, _h: dict[str, str], _b: Any, _t: float):
            nonlocal http_calls
            http_calls += 1
            return 201, {
                "ok": True,
                "status": "COMPLETED",
                "message": "Captured",
                "orderId": "ORD-1",
            }

        client = RicoClient("https://rico.test", request_fn=fake_request)

        with self.assertRaises(RicoBudgetHoldError):
            client.execute_payment("malformed-token", idempotency_key="k1")

        expired_tok = _encode_token({"v": 1, "m": "mnd_123", "exp": int((time.time() - 60) * 1000)})
        with self.assertRaises(RicoBudgetHoldError) as exp_ctx:
            client.execute_payment(expired_tok, idempotency_key="k2")
        self.assertEqual(exp_ctx.exception.code, "CONFIRMATION_EXPIRED")
        self.assertEqual(http_calls, 0)

        valid_tok = _encode_token({"v": 1, "m": "mnd_123", "exp": int((time.time() + 300) * 1000)})
        client.execute_payment(valid_tok, idempotency_key="k_once")
        self.assertEqual(http_calls, 1)

        with self.assertRaises(RicoBudgetHoldError) as dup_ctx:
            client.execute_payment(valid_tok, idempotency_key="k_other")
        self.assertEqual(dup_ctx.exception.code, "DUPLICATE_EXECUTION")
        self.assertEqual(http_calls, 1)

    def test_non_guardrail_api_error_raises_rico_api_error(self) -> None:
        def not_found(_m: str, _u: str, _h: dict[str, str], _b: Any, _t: float):
            return 404, {"code": "NOT_FOUND", "error": "Mandate not found"}

        client = RicoClient("https://rico.test", request_fn=not_found)
        with self.assertRaises(RicoApiError) as ctx:
            client.quote_payment("missing", amount=10.0)
        self.assertNotIsInstance(ctx.exception, RicoBudgetHoldError)
        self.assertEqual(ctx.exception.status, 404)


if __name__ == "__main__":
    unittest.main()
