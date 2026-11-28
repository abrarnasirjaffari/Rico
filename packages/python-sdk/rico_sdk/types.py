"""Typed dataclasses and exceptions for the Rico Python SDK."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


class RicoError(Exception):
    """Base exception for all rico-py errors."""


class RicoNetworkError(RicoError):
    """Raised when a transport/connection/timeout error occurs."""


class RicoApiError(RicoError):
    """Raised when the Rico API returns a non-2xx HTTP response."""

    def __init__(
        self,
        message: str,
        *,
        status: int = 400,
        code: str = "API_ERROR",
        body: Any = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status = status
        self.code = code
        self.body = body


class RicoBudgetHoldError(RicoApiError):
    """Raised when a Rico financial guardrail blocks or holds execution."""


class RicoWebhookError(RicoError):
    """Raised by assert_valid_webhook when webhook signature verification fails."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass(frozen=True)
class Mandate:
    id: str
    owner_id: str | None
    service: str
    budget_ceiling: float
    last_scraped_price: float
    recurrence: str
    next_run: str
    status: str
    category: str
    currency: str
    strict_mode: bool
    merchant_url: str | None = None
    created_at: str | None = None
    updated_at: str | None = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Mandate:
        return cls(
            id=str(data["id"]),
            owner_id=data.get("ownerId"),
            service=str(data["service"]),
            budget_ceiling=float(data.get("budgetCeiling", 0.0)),
            last_scraped_price=float(data.get("lastScrapedPrice", 0.0)),
            recurrence=str(data.get("recurrence", "Monthly on 1st")),
            next_run=str(data.get("nextRun", "Pending")),
            status=str(data.get("status", "ACTIVE")),
            category=str(data.get("category", "Subscription")),
            currency=str(data.get("currency", "USD")),
            strict_mode=bool(data.get("strictMode", False)),
            merchant_url=data.get("merchantUrl"),
            created_at=data.get("createdAt"),
            updated_at=data.get("updatedAt"),
        )


@dataclass(frozen=True)
class PaymentQuote:
    mandate_id: str
    service: str
    amount: float
    currency: str
    budget_ceiling: float
    billing_period: str
    period_label: str
    price_source: str
    confirm_token: str
    expires_at: int

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> PaymentQuote:
        return cls(
            mandate_id=str(data["mandateId"]),
            service=str(data["service"]),
            amount=float(data["amount"]),
            currency=str(data.get("currency", "USD")),
            budget_ceiling=float(data["budgetCeiling"]),
            billing_period=str(data.get("billingPeriod", "")),
            period_label=str(data.get("periodLabel", "")),
            price_source=str(data.get("priceSource", "")),
            confirm_token=str(data["confirmToken"]),
            expires_at=int(data["expiresAt"]),
        )


@dataclass(frozen=True)
class PaymentExecution:
    ok: bool
    status: str
    message: str
    order_id: str
    transaction_id: str | None = None
    receipt: dict[str, Any] | None = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> PaymentExecution:
        return cls(
            ok=bool(data.get("ok", False)),
            status=str(data.get("status", "COMPLETED")),
            message=str(data.get("message", "")),
            order_id=str(data.get("orderId", "")),
            transaction_id=data.get("transactionId"),
            receipt=data.get("receipt"),
        )
