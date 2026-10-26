"""Auth flows settings and one-time token helpers (gpp add auth-flows)."""
from __future__ import annotations

import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.auth_flow_token import AuthFlowToken


class AuthFlowsSettings(BaseSettings):
    """Read from the environment and .env, like app.core.config.Settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # console | resend | sendgrid | ses. Empty: "console" in development
    # (ENVIRONMENT=development/dev/local/test or DEBUG=true), otherwise the
    # provider chosen at `gpp add auth-flows` time (see app/core/email.py).
    EMAIL_PROVIDER: str = ""
    EMAIL_FROM: str = "noreply@example.com"
    RESEND_API_KEY: str = ""
    SENDGRID_API_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    # Base URL of the web app; emails link to {APP_URL}/verify-email and /reset-password
    APP_URL: str = "http://localhost:3000"
    EMAIL_VERIFICATION_EXPIRE_HOURS: int = 24
    PASSWORD_RESET_EXPIRE_MINUTES: int = 60


auth_flows_settings = AuthFlowsSettings()

# 32 random bytes; tokens longer than this many characters are rejected unread
TOKEN_SECRET_BYTES = 32
MAX_TOKEN_LENGTH = 200


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def as_utc(value: datetime) -> datetime:
    """SQLite hands back naive datetimes; treat them as UTC."""
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


def hash_secret(secret: str) -> str:
    return hashlib.sha256(secret.encode("utf-8")).hexdigest()


async def invalidate_tokens(db: AsyncSession, user_id: str, purpose: str) -> None:
    """Mark every unused token of this purpose for the user as used."""
    await db.execute(
        update(AuthFlowToken)
        .where(
            AuthFlowToken.user_id == user_id,
            AuthFlowToken.purpose == purpose,
            AuthFlowToken.used_at.is_(None),
        )
        .values(used_at=utcnow())
    )


async def issue_token(
    db: AsyncSession, user_id: str, purpose: str, lifetime: timedelta
) -> str:
    """Create a token (earlier unused ones of the same purpose stop working).
    Returns the raw token for the email; the caller commits."""
    await invalidate_tokens(db, user_id, purpose)
    token_id = str(uuid.uuid4())
    secret = secrets.token_urlsafe(TOKEN_SECRET_BYTES)
    db.add(
        AuthFlowToken(
            id=token_id,
            user_id=user_id,
            purpose=purpose,
            token_hash=hash_secret(secret),
            expires_at=utcnow() + lifetime,
        )
    )
    await db.flush()
    return f"{token_id}.{secret}"


async def consume_token(db: AsyncSession, raw: str, purpose: str) -> AuthFlowToken | None:
    """Check a raw token and mark it used. None if it is unknown, for another
    purpose, wrong, expired or already used. The caller commits."""
    if len(raw) > MAX_TOKEN_LENGTH:
        return None
    token_id, _, secret = raw.partition(".")
    if not token_id or not secret:
        return None
    row = await db.get(AuthFlowToken, token_id)
    if row is None or row.purpose != purpose:
        return None
    if not hmac.compare_digest(row.token_hash, hash_secret(secret)):
        return None
    now = utcnow()
    if row.used_at is not None or as_utc(row.expires_at) <= now:
        return None
    # Conditional update: of two concurrent requests with the same token, one wins.
    result = await db.execute(
        update(AuthFlowToken)
        .where(AuthFlowToken.id == row.id, AuthFlowToken.used_at.is_(None))
        .values(used_at=now)
        .execution_options(synchronize_session=False)
    )
    if result.rowcount != 1:
        return None
    return row
