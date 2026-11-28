# `rico-py` — Python Client & Guardrail Decorator (`packages/python-sdk/`)

- **Target PR Base Branch:** `track/sdk`
- **Issue:** [#59 — Python Client & Guardrail Decorator (rico-py)](https://github.com/abrarnasirjaffari/Rico/issues/59)

Zero-dependency Python 3.10+ SDK built purely on the Python standard library (`urllib.request`, `json`, `dataclasses`, `hmac`, `hashlib`, `unittest`).

## Quickstart

```python
from rico_sdk import RicoBudgetHoldError, RicoClient, rico_guardrail

client = RicoClient(
    base_url="https://rico.example.com",
    session_token="your_rico_auth_session_cookie",
)

@rico_guardrail(client, mandate_id="mnd_openai_monthly", amount_arg="amount")
def buy_credits(amount: float, service: str = "OpenAI") -> dict:
    # Only runs if Rico's quote + budget ceiling check succeeds
    return {"service": service, "amount": amount}

try:
    buy_credits(amount=25.0)
except RicoBudgetHoldError as exc:
    print("Blocked by Rico guardrail:", exc.code, exc.message)
```

## Two-Step Payment Flow & Webhook Verification

```python
quote = client.quote_payment(mandate_id="mnd_123", amount=20.0, currency="USD")
receipt = client.execute_payment(
    confirm_token=quote.confirm_token,
    idempotency_key="run-2026-11-28-01",
)

is_valid = client.verify_webhook(
    payload=raw_body_bytes,
    signature=headers.get("x-rico-signature"),
    secret=webhook_secret,
)
```

## Run Tests

```bash
python -m unittest discover -s packages/python-sdk/tests -v
```
