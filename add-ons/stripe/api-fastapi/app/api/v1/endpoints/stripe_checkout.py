"""Stripe Checkout Sessions (added by `gpp add stripe`).

POST /stripe/checkout-session (under /api/v1 in the gpp FastAPI pack)
  request body:  {"priceId": "price_...", "successUrl"?: "https://...", "cancelUrl"?: "https://..."}
  response body: {"url": "https://checkout.stripe.com/..."}

Desktop and mobile apps hold no Stripe secret: they call this endpoint and open the
returned URL. Callers choose nothing the server has not allowed:
  - priceId must be listed in STRIPE_PRICE_IDS (comma-separated).
  - successUrl/cancelUrl default to STRIPE_CHECKOUT_SUCCESS_URL/STRIPE_CHECKOUT_CANCEL_URL.
    A caller may pass its own, but only on an origin in STRIPE_CHECKOUT_ALLOWED_ORIGINS
    (comma-separated) or the origin of a configured default URL.

The endpoint is public, like a "Buy" button on a website. Add your auth dependency to
the route if only signed-in users may start a checkout, and fulfil orders from the
Stripe webhook (STRIPE_WEBHOOK_SECRET), never from the success page.
"""
from __future__ import annotations

import logging
from functools import lru_cache
from urllib.parse import urlsplit

import stripe
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

router = APIRouter()

CHECKOUT_MODES = {"payment", "subscription"}
LOOPBACK_HOSTS = {"localhost", "127.0.0.1", "[::1]"}


class StripeSettings(BaseSettings):
    """Stripe settings from the API's environment (and .env). Server side only."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    STRIPE_SECRET_KEY: str = ""
    # Comma-separated price ids callers may buy, e.g. "price_123,price_456"
    STRIPE_PRICE_IDS: str = ""
    # "payment" (one-off) or "subscription" (recurring prices)
    STRIPE_CHECKOUT_MODE: str = "payment"
    # Where Stripe sends the buyer afterwards. {CHECKOUT_SESSION_ID} is filled in by Stripe.
    STRIPE_CHECKOUT_SUCCESS_URL: str = ""
    STRIPE_CHECKOUT_CANCEL_URL: str = ""
    # Extra origins (comma-separated, e.g. "https://app.example.com") a caller's own
    # successUrl/cancelUrl may use. The default URLs' origins are always allowed.
    STRIPE_CHECKOUT_ALLOWED_ORIGINS: str = ""


@lru_cache
def get_stripe_settings() -> StripeSettings:
    return StripeSettings()


class CheckoutSessionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    price_id: str = Field(alias="priceId", min_length=1, max_length=255, pattern=r"^[A-Za-z0-9_]+$")
    success_url: str | None = Field(default=None, alias="successUrl", max_length=2048)
    cancel_url: str | None = Field(default=None, alias="cancelUrl", max_length=2048)


class CheckoutSessionResponse(BaseModel):
    url: str


def _split_list(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def url_origin(url: str) -> str | None:
    """scheme://host[:port] of an absolute http(s) URL, or None if the URL is not one.

    https is required except on this machine (localhost). URLs with credentials,
    backslashes or whitespace are refused: browsers and urllib disagree on where
    their host ends."""
    if not url or any(ch in url for ch in "\\ \t\r\n") or any(ord(ch) < 32 for ch in url):
        return None
    try:
        parts = urlsplit(url)
        port = parts.port
    except ValueError:
        return None
    scheme = parts.scheme.lower()
    host = (parts.hostname or "").lower()
    if scheme not in ("http", "https") or not host or parts.username or parts.password:
        return None
    if ":" in host:
        host = f"[{host}]"
    if scheme == "http" and host not in LOOPBACK_HOSTS:
        return None
    default_port = 443 if scheme == "https" else 80
    return f"{scheme}://{host}" + (f":{port}" if port and port != default_port else "")


def allowed_origins(settings: StripeSettings) -> set[str]:
    origins = {
        origin
        for origin in (url_origin(o.rstrip("/")) for o in _split_list(settings.STRIPE_CHECKOUT_ALLOWED_ORIGINS))
        if origin
    }
    for default in (settings.STRIPE_CHECKOUT_SUCCESS_URL, settings.STRIPE_CHECKOUT_CANCEL_URL):
        origin = url_origin(default.strip())
        if origin:
            origins.add(origin)
    return origins


def _not_configured(what: str) -> HTTPException:
    logger.error("Stripe checkout is not configured: %s", what)
    return HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Checkout is not configured")


def _redirect_url(requested: str | None, default: str, name: str, origins: set[str]) -> str:
    if requested is None:
        if not url_origin(default.strip()):
            raise _not_configured(f"STRIPE_CHECKOUT_{name.upper()}_URL is unset or not an https URL")
        return default.strip()
    if url_origin(requested) not in origins:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"{name}Url is not on an allowed origin")
    return requested


@router.post("/checkout-session", response_model=CheckoutSessionResponse)
def create_checkout_session(
    body: CheckoutSessionRequest,
    settings: StripeSettings = Depends(get_stripe_settings),
) -> CheckoutSessionResponse:
    """Create a Stripe Checkout Session for an allowed price and return its URL."""
    secret_key = settings.STRIPE_SECRET_KEY.strip()
    if not secret_key:
        raise _not_configured("STRIPE_SECRET_KEY is unset")
    mode = settings.STRIPE_CHECKOUT_MODE.strip().lower()
    if mode not in CHECKOUT_MODES:
        raise _not_configured("STRIPE_CHECKOUT_MODE must be payment or subscription")
    price_ids = _split_list(settings.STRIPE_PRICE_IDS)
    if not price_ids:
        raise _not_configured("STRIPE_PRICE_IDS is empty")
    if body.price_id not in price_ids:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown price")

    origins = allowed_origins(settings)
    success_url = _redirect_url(body.success_url, settings.STRIPE_CHECKOUT_SUCCESS_URL, "success", origins)
    cancel_url = _redirect_url(body.cancel_url, settings.STRIPE_CHECKOUT_CANCEL_URL, "cancel", origins)

    try:
        session = stripe.checkout.Session.create(
            api_key=secret_key,
            mode=mode,
            line_items=[{"price": body.price_id, "quantity": 1}],
            success_url=success_url,
            cancel_url=cancel_url,
        )
    except stripe.StripeError:
        logger.exception("Stripe rejected the Checkout Session for %s", body.price_id)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Could not create the Checkout Session") from None

    if not session.url:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Stripe returned no Checkout URL")
    return CheckoutSessionResponse(url=session.url)
