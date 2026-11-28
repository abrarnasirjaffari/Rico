"""Constant-time HMAC-SHA256 webhook signature helpers for Rico webhooks."""

from __future__ import annotations

import hashlib
import hmac
import re
import time

from .types import RicoWebhookError

_DEFAULT_TOLERANCE_SECONDS = 300
_HEX_64_RE = re.compile(r"^[0-9a-f]{64}$", re.IGNORECASE)


def _to_bytes(payload: str | bytes) -> bytes:
    if isinstance(payload, bytes):
        return payload
    if isinstance(payload, str):
        return payload.encode("utf-8")
    raise TypeError("payload must be str or bytes")


def _parse_signature_header(raw_signature: str) -> tuple[str, int | None] | None:
    trimmed = raw_signature.strip()
    if not trimmed:
        return None

    # Format 1: timestamped header `t=<unix>,v1=<64-hex>`
    if "," in trimmed:
        embedded_ts: int | None = None
        v1_hex: str | None = None
        for part in trimmed.split(","):
            if "=" not in part:
                continue
            key, val = part.split("=", 1)
            key = key.strip()
            val = val.strip()
            if key == "t":
                try:
                    ts_num = int(val)
                except ValueError:
                    return None
                if ts_num <= 0:
                    return None
                embedded_ts = ts_num
            elif key == "v1":
                v1_hex = val

        if not v1_hex or not _HEX_64_RE.match(v1_hex):
            return None
        return v1_hex.lower(), embedded_ts

    # Format 2: `sha256=<64-hex>` or raw `<64-hex>`
    normalized = (
        trimmed[len("sha256=") :].strip()
        if trimmed.lower().startswith("sha256=")
        else trimmed
    )
    if not _HEX_64_RE.match(normalized):
        return None
    return normalized.lower(), None


def sign_webhook(
    payload: str | bytes,
    secret: str,
    *,
    timestamp: int | None = None,
) -> str:
    """Generates a Rico HMAC-SHA256 signature header (`sha256=<hex>` or `t=<ts>,v1=<hex>`)."""
    if not secret or not isinstance(secret, str):
        raise ValueError("secret must be a non-empty string")

    payload_bytes = _to_bytes(payload)
    mac = hmac.new(secret.encode("utf-8"), digestmod=hashlib.sha256)
    if timestamp is not None:
        mac.update(f"{timestamp}.".encode("utf-8"))
        mac.update(payload_bytes)
        return f"t={timestamp},v1={mac.hexdigest()}"

    mac.update(payload_bytes)
    return f"sha256={mac.hexdigest()}"


def _verify_webhook_detailed(
    payload: str | bytes,
    signature: str | None,
    secret: str | None,
    *,
    timestamp: int | None = None,
    tolerance_seconds: int = _DEFAULT_TOLERANCE_SECONDS,
    now_seconds: int | None = None,
) -> tuple[bool, str, str]:
    if not secret or not isinstance(secret, str):
        return False, "MISSING_SECRET", "Webhook signing secret is missing."

    if not signature or not isinstance(signature, str):
        return False, "MISSING_SIGNATURE", "Webhook signature header is missing."

    try:
        payload_bytes = _to_bytes(payload)
    except TypeError as exc:
        return False, "INVALID_PAYLOAD", str(exc)

    parsed = _parse_signature_header(signature)
    if parsed is None:
        return (
            False,
            "MALFORMED_SIGNATURE",
            "Webhook signature must be <64-hex>, sha256=<64-hex>, or t=<ts>,v1=<64-hex>.",
        )

    received_hex, embedded_ts = parsed
    effective_ts = embedded_ts if embedded_ts is not None else timestamp

    if effective_ts is not None and tolerance_seconds > 0:
        current_ts = int(time.time()) if now_seconds is None else now_seconds
        if abs(current_ts - effective_ts) > tolerance_seconds:
            return (
                False,
                "TIMESTAMP_EXPIRED",
                f"Webhook timestamp ({effective_ts}) exceeds {tolerance_seconds}s tolerance.",
            )

    mac = hmac.new(secret.encode("utf-8"), digestmod=hashlib.sha256)
    if effective_ts is not None:
        mac.update(f"{effective_ts}.".encode("utf-8"))
    mac.update(payload_bytes)
    expected_hex = mac.hexdigest().lower()

    if not hmac.compare_digest(expected_hex, received_hex):
        return (
            False,
            "INVALID_SIGNATURE",
            "Webhook HMAC-SHA256 signature verification failed.",
        )

    return True, "OK", "Verified"


def verify_webhook(
    payload: str | bytes,
    signature: str | None,
    secret: str | None,
    *,
    timestamp: int | None = None,
    tolerance_seconds: int = _DEFAULT_TOLERANCE_SECONDS,
    now_seconds: int | None = None,
) -> bool:
    """Verifies a Rico webhook payload using constant-time HMAC-SHA256 (`hmac.compare_digest`)."""
    valid, _, _ = _verify_webhook_detailed(
        payload,
        signature,
        secret,
        timestamp=timestamp,
        tolerance_seconds=tolerance_seconds,
        now_seconds=now_seconds,
    )
    return valid


def assert_valid_webhook(
    payload: str | bytes,
    signature: str | None,
    secret: str | None,
    *,
    timestamp: int | None = None,
    tolerance_seconds: int = _DEFAULT_TOLERANCE_SECONDS,
    now_seconds: int | None = None,
) -> None:
    """Verifies a Rico webhook payload and raises RicoWebhookError on failure."""
    valid, code, reason = _verify_webhook_detailed(
        payload,
        signature,
        secret,
        timestamp=timestamp,
        tolerance_seconds=tolerance_seconds,
        now_seconds=now_seconds,
    )
    if not valid:
        raise RicoWebhookError(code, reason)
