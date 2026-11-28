"""@rico_guardrail decorator for protecting Python functions and agent tools."""

from __future__ import annotations

import functools
import inspect
from typing import Any, Callable, TypeVar

from .client import RicoClient
from .types import PaymentQuote, RicoBudgetHoldError

F = TypeVar("F", bound=Callable[..., Any])


def _extract_amount(
    func: Callable[..., Any],
    args: tuple[Any, ...],
    kwargs: dict[str, Any],
    amount_arg: str,
) -> float:
    if amount_arg in kwargs:
        raw_amount = kwargs[amount_arg]
    else:
        sig = inspect.signature(func)
        bound = sig.bind_partial(*args, **kwargs)
        if amount_arg not in bound.arguments:
            raise ValueError(
                f"@rico_guardrail: required argument '{amount_arg}' was not provided to {func.__name__}()."
            )
        raw_amount = bound.arguments[amount_arg]

    if not isinstance(raw_amount, (int, float)) or isinstance(raw_amount, bool):
        raise TypeError(
            f"@rico_guardrail: '{amount_arg}' must be numeric, got {type(raw_amount).__name__}."
        )
    return float(raw_amount)


def _quote_before_call(
    client: RicoClient,
    mandate_id: str,
    amount: float,
    currency: str,
) -> PaymentQuote:
    quote = client.quote_payment(mandate_id=mandate_id, amount=amount, currency=currency)
    if not quote.confirm_token:
        raise RicoBudgetHoldError(
            "Guardrail blocked execution: quote did not return a confirm_token.",
            status=400,
            code="INVALID_CONFIRMATION",
        )
    if amount > quote.budget_ceiling:
        raise RicoBudgetHoldError(
            f"Guardrail blocked execution: ${amount:.2f} exceeds ceiling ${quote.budget_ceiling:.2f}.",
            status=422,
            code="OVER_BUDGET",
        )
    return quote


def rico_guardrail(
    client: RicoClient,
    mandate_id: str,
    amount_arg: str = "amount",
    *,
    currency: str = "USD",
    quote_kwarg: str | None = None,
) -> Callable[[F], F]:
    """
    Decorator that requests a Rico quote before running the wrapped function and raises
    RicoBudgetHoldError if the budget ceiling or mandate guardrails block the charge.
    Supports both synchronous and async functions.
    """

    def decorator(func: F) -> F:
        if inspect.iscoroutinefunction(func):

            @functools.wraps(func)
            async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
                amount = _extract_amount(func, args, kwargs, amount_arg)
                quote = _quote_before_call(client, mandate_id, amount, currency)
                call_kwargs = dict(kwargs)
                if quote_kwarg:
                    call_kwargs[quote_kwarg] = quote
                return await func(*args, **call_kwargs)

            return async_wrapper  # type: ignore[return-value]

        @functools.wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            amount = _extract_amount(func, args, kwargs, amount_arg)
            quote = _quote_before_call(client, mandate_id, amount, currency)
            call_kwargs = dict(kwargs)
            if quote_kwarg:
                call_kwargs[quote_kwarg] = quote
            return func(*args, **call_kwargs)

        return sync_wrapper  # type: ignore[return-value]

    return decorator
