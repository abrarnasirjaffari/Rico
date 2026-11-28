import asyncio
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

from rico_sdk import PaymentQuote, RicoBudgetHoldError, RicoClient, rico_guardrail


def _make_token() -> str:
    exp = int((time.time() + 300) * 1000)
    body = base64.urlsafe_b64encode(json.dumps({"v": 1, "exp": exp}).encode("utf-8")).decode("ascii").rstrip("=")
    return f"{body}.sig"


class TestRicoGuardrailDecorator(unittest.TestCase):
    def _make_client(self, *, budget_ceiling: float = 50.0, server_block: bool = False) -> RicoClient:
        def fake_request(_m: str, _u: str, _h: dict[str, str], body: Any, _t: float):
            if server_block:
                return 422, {"code": "OVER_BUDGET", "error": "Monthly cap exceeded"}
            return 200, {
                "quote": {
                    "mandateId": body["mandateId"],
                    "service": "OpenAI",
                    "amount": body.get("amount", 10.0),
                    "currency": body.get("currency", "USD"),
                    "budgetCeiling": budget_ceiling,
                    "billingPeriod": "2026-11",
                    "periodLabel": "Nov 2026",
                    "priceSource": "live_browser",
                    "confirmToken": _make_token(),
                    "expiresAt": int((time.time() + 300) * 1000),
                }
            }

        return RicoClient("https://rico.test", request_fn=fake_request)

    def test_allows_charge_under_ceiling_keyword_and_positional(self) -> None:
        client = self._make_client(budget_ceiling=50.0)
        calls: list[float] = []

        @rico_guardrail(client, mandate_id="mnd_1", amount_arg="amount", quote_kwarg="rico_quote")
        def buy(service: str, amount: float, rico_quote: PaymentQuote | None = None) -> dict[str, Any]:
            calls.append(amount)
            return {"service": service, "amount": amount, "token": rico_quote.confirm_token if rico_quote else None}

        res1 = buy("OpenAI", amount=25.0)
        self.assertEqual(res1["amount"], 25.0)
        self.assertIsNotNone(res1["token"])

        res2 = buy("OpenAI", 15.0)
        self.assertEqual(res2["amount"], 15.0)
        self.assertEqual(calls, [25.0, 15.0])

    def test_blocks_over_budget_before_function_runs(self) -> None:
        client = self._make_client(budget_ceiling=50.0)
        executed = False

        @rico_guardrail(client, mandate_id="mnd_1", amount_arg="cost")
        def charge(cost: float) -> str:
            nonlocal executed
            executed = True
            return f"charged {cost}"

        with self.assertRaises(RicoBudgetHoldError) as ctx:
            charge(cost=75.0)
        self.assertEqual(ctx.exception.code, "OVER_BUDGET")
        self.assertFalse(executed, "Wrapped function must not run when guardrail blocks")

    def test_blocks_on_server_refusal(self) -> None:
        client = self._make_client(server_block=True)
        executed = False

        @rico_guardrail(client, mandate_id="mnd_1")
        def charge(amount: float) -> float:
            nonlocal executed
            executed = True
            return amount

        with self.assertRaises(RicoBudgetHoldError):
            charge(amount=10.0)
        self.assertFalse(executed)

    def test_async_function_support(self) -> None:
        client = self._make_client(budget_ceiling=40.0)
        executed = False

        @rico_guardrail(client, mandate_id="mnd_async")
        async def async_pay(amount: float) -> float:
            nonlocal executed
            executed = True
            return amount

        result = asyncio.run(async_pay(amount=20.0))
        self.assertEqual(result, 20.0)
        self.assertTrue(executed)

        executed = False
        with self.assertRaises(RicoBudgetHoldError):
            asyncio.run(async_pay(amount=60.0))
        self.assertFalse(executed)


if __name__ == "__main__":
    unittest.main()
