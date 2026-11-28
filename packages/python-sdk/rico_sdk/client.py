"""Zero-dependency Python HTTP client for the Rico API."""

from __future__ import annotations

import base64
import json
import math
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Callable, Literal

from .types import (
    Mandate,
    PaymentExecution,
    PaymentQuote,
    RicoApiError,
    RicoBudgetHoldError,
    RicoNetworkError,
)
from .webhooks import verify_webhook

_SESSION_COOKIE_NAME = "rico_auth_session"
_GUARDRAIL_HOLD_CODES = frozenset(
    {
        "OVER_BUDGET",
        "BLOCKED",
        "ANOMALY_HOLD",
        "PRICE_CHANGED",
        "ALREADY_PAID",
        "NOT_ACTIVE",
        "IN_PROGRESS",
        "PRICE_UNVERIFIED",
        "INVALID_CONFIRMATION",
        "CONFIRMATION_EXPIRED",
        "DUPLICATE_EXECUTION",
    }
)


def _inspect_confirm_token(token: str) -> tuple[bool, bool]:
    """Returns (valid_format, is_expired) for a `<base64url-payload>.<mac>` confirmToken."""
    if not isinstance(token, str):
        return False, False
    trimmed = token.strip()
    if not trimmed or len(trimmed) > 2048:
        return False, False

    parts = trimmed.split(".")
    if len(parts) != 2 or not parts[0] or not parts[1]:
        return False, False

    try:
        padded = parts[0] + "=" * (-len(parts[0]) % 4)
        decoded = base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8")
        payload = json.loads(decoded)
        exp = payload.get("exp")
        if isinstance(exp, (int, float)) and math.isfinite(exp):
            now_ms = int(time.time() * 1000)
            return True, exp <= now_ms
    except Exception:
        # Preserve structural validity for opaque test tokens that are not base64url JSON.
        pass

    return True, False


class RicoClient:
    """Synchronous zero-dependency Python 3.10+ client for Rico mandates, payments, and webhooks."""

    def __init__(
        self,
        base_url: str,
        session_token: str | None = None,
        *,
        timeout: float = 30.0,
        headers: dict[str, str] | None = None,
        request_fn: Callable[..., tuple[int, Any]] | None = None,
    ) -> None:
        if not base_url or not isinstance(base_url, str) or not base_url.strip():
            raise ValueError("RicoClient: `base_url` must be a non-empty string.")

        self._base_url = base_url.strip().rstrip("/")
        self._timeout = timeout
        self._request_fn = request_fn

        self._headers: dict[str, str] = {"Accept": "application/json"}
        if headers:
            self._headers.update(headers)
        if session_token:
            encoded = urllib.parse.quote(session_token, safe="")
            self._headers["Cookie"] = f"{_SESSION_COOKIE_NAME}={encoded}"

        self._used_tokens: set[str] = set()
        self._used_idempotency_keys: set[str] = set()

    def _request(
        self,
        method: str,
        path: str,
        body: dict[str, Any] | None = None,
        extra_headers: dict[str, str] | None = None,
    ) -> Any:
        url = f"{self._base_url}{path}"
        headers = dict(self._headers)
        if extra_headers:
            headers.update(extra_headers)
        if body is not None:
            headers["Content-Type"] = "application/json"

        if self._request_fn is not None:
            status, parsed = self._request_fn(method, url, headers, body, self._timeout)
            if status < 200 or status >= 300:
                self._raise_api_error(status, method, path, parsed)
            return parsed

        data_bytes = json.dumps(body).encode("utf-8") if body is not None else None
        req = urllib.request.Request(url=url, data=data_bytes, headers=headers, method=method)

        try:
            with urllib.request.urlopen(req, timeout=self._timeout) as resp:
                raw_text = resp.read().decode("utf-8")
                return self._parse_json_safe(raw_text)
        except urllib.error.HTTPError as exc:
            raw_err = exc.read().decode("utf-8", errors="replace")
            parsed_err = self._parse_json_safe(raw_err)
            self._raise_api_error(exc.code, method, path, parsed_err)
        except urllib.error.URLError as exc:
            raise RicoNetworkError(f"{method} {path} failed: {exc.reason}") from exc

    @staticmethod
    def _parse_json_safe(raw_text: str) -> Any:
        if not raw_text:
            return None
        try:
            return json.loads(raw_text)
        except json.JSONDecodeError:
            return raw_text

    @staticmethod
    def _raise_api_error(status: int, method: str, path: str, body: Any) -> None:
        record = body if isinstance(body, dict) else {}
        message = (
            record.get("error")
            or record.get("message")
            or f"{method} {path} failed with HTTP {status}"
        )
        code = str(record.get("code") or record.get("status") or f"HTTP_{status}")
        if code in _GUARDRAIL_HOLD_CODES:
            raise RicoBudgetHoldError(str(message), status=status, code=code, body=body)
        raise RicoApiError(str(message), status=status, code=code, body=body)

    def list_mandates(self) -> list[Mandate]:
        """Lists all financial mandates owned by the authenticated session."""
        data = self._request("GET", "/api/mandates")
        raw_list = data.get("mandates", []) if isinstance(data, dict) else []
        return [Mandate.from_dict(item) for item in raw_list]

    def create_mandate(
        self,
        service: str,
        budget_ceiling: float,
        *,
        currency: str = "USD",
        recurrence: str = "Monthly on 1st",
        next_run: str = "Pending",
        status: Literal["ACTIVE", "PAUSED", "ANOMALY_HOLD"] = "ACTIVE",
        category: str = "Subscription",
        strict_mode: bool = False,
        merchant_url: str | None = None,
        last_scraped_price: float = 0.0,
        mandate_id: str | None = None,
    ) -> Mandate:
        """Creates a new financial mandate assigned to the authenticated user."""
        if not service or not isinstance(service, str) or not service.strip():
            raise ValueError("create_mandate: `service` must be a non-empty string.")
        if not isinstance(budget_ceiling, (int, float)) or budget_ceiling <= 0:
            raise ValueError("create_mandate: `budget_ceiling` must be greater than 0.")

        payload: dict[str, Any] = {
            "service": service.strip(),
            "budgetCeiling": float(budget_ceiling),
            "lastScrapedPrice": float(last_scraped_price),
            "recurrence": recurrence,
            "nextRun": next_run,
            "status": status,
            "category": category,
            "currency": currency,
            "strictMode": strict_mode,
            "merchantUrl": merchant_url,
        }
        if mandate_id:
            payload["id"] = mandate_id

        data = self._request("POST", "/api/mandates", payload)
        mandate_dict = data.get("mandate") if isinstance(data, dict) else None
        if not isinstance(mandate_dict, dict):
            raise RicoApiError("Invalid response from POST /api/mandates", status=502, body=data)
        return Mandate.from_dict(mandate_dict)

    def quote_payment(
        self,
        mandate_id: str,
        amount: float | None = None,
        currency: str = "USD",
    ) -> PaymentQuote:
        """Step 1: Requests a server-verified payment quote and short-lived confirmToken."""
        if not mandate_id or not isinstance(mandate_id, str) or not mandate_id.strip():
            raise ValueError("quote_payment: `mandate_id` must be a non-empty string.")
        if amount is not None and (
            not isinstance(amount, (int, float)) or not math.isfinite(amount) or amount <= 0
        ):
            raise ValueError("quote_payment: `amount` must be a positive number.")

        payload: dict[str, Any] = {"mandateId": mandate_id.strip(), "currency": currency}
        if amount is not None:
            payload["amount"] = float(amount)

        data = self._request("POST", "/api/payments/quote", payload)
        quote_dict = data.get("quote") if isinstance(data, dict) else None
        if not isinstance(quote_dict, dict) or not quote_dict.get("confirmToken"):
            raise RicoApiError(
                "Server quote response did not include a signed confirmToken.",
                status=502,
                code="INVALID_QUOTE_RESPONSE",
                body=data,
            )

        quote = PaymentQuote.from_dict(quote_dict)

        # Client-side defense-in-depth ceiling check on both requested and quoted amounts.
        effective_amount = max(quote.amount, float(amount)) if amount is not None else quote.amount
        if effective_amount > quote.budget_ceiling:
            raise RicoBudgetHoldError(
                (
                    f"Quoted/requested amount (${effective_amount:.2f} {quote.currency}) "
                    f"exceeds mandate '{quote.service}' ceiling (${quote.budget_ceiling:.2f} {quote.currency})."
                ),
                status=422,
                code="OVER_BUDGET",
                body=data,
            )

        return quote

    def execute_payment(
        self,
        confirm_token: str,
        idempotency_key: str,
        *,
        funding_rail: Literal["PAYPAL", "VISA"] = "PAYPAL",
    ) -> PaymentExecution:
        """Step 2: Executes a payment strictly using a valid server-issued confirmToken."""
        valid_format, expired = _inspect_confirm_token(confirm_token)
        if not valid_format:
            raise RicoBudgetHoldError(
                "execute_payment requires a valid confirm_token from quote_payment().",
                status=400,
                code="INVALID_CONFIRMATION",
            )
        if expired:
            raise RicoBudgetHoldError(
                "confirm_token has expired. Request a fresh quote before executing.",
                status=409,
                code="CONFIRMATION_EXPIRED",
            )

        trimmed_token = confirm_token.strip()
        if trimmed_token in self._used_tokens:
            raise RicoBudgetHoldError(
                "Duplicate execution blocked: confirm_token has already been executed.",
                status=409,
                code="DUPLICATE_EXECUTION",
            )

        if not idempotency_key or not isinstance(idempotency_key, str) or not idempotency_key.strip():
            raise ValueError("execute_payment: `idempotency_key` must be a non-empty string.")
        trimmed_key = idempotency_key.strip()
        if trimmed_key in self._used_idempotency_keys:
            raise RicoBudgetHoldError(
                f"Duplicate execution blocked: idempotency_key '{trimmed_key}' already used.",
                status=409,
                code="DUPLICATE_EXECUTION",
            )

        data = self._request(
            "POST",
            "/api/payments/execute",
            {
                "confirmToken": trimmed_token,
                "fundingRail": funding_rail,
                "idempotencyKey": trimmed_key,
            },
            extra_headers={"Idempotency-Key": trimmed_key},
        )

        self._used_tokens.add(trimmed_token)
        self._used_idempotency_keys.add(trimmed_key)

        if not isinstance(data, dict):
            raise RicoApiError("Invalid response from POST /api/payments/execute", status=502, body=data)
        return PaymentExecution.from_dict(data)

    @staticmethod
    def verify_webhook(
        payload: str | bytes,
        signature: str | None,
        secret: str | None,
        *,
        timestamp: int | None = None,
        tolerance_seconds: int = 300,
    ) -> bool:
        """Verifies a Rico webhook signature using constant-time HMAC-SHA256."""
        return verify_webhook(
            payload,
            signature,
            secret,
            timestamp=timestamp,
            tolerance_seconds=tolerance_seconds,
        )
