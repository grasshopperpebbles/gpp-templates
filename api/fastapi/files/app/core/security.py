"""Security utilities (password hashing, JWT tokens)."""
from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.core.config import settings

# bcrypt only uses the first 72 bytes and bcrypt>=5 raises on longer input;
# app.schemas.user.Password already caps new passwords at 72 bytes.
BCRYPT_MAX_BYTES = 72


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a bcrypt hash ($2a$/$2b$/$2y$, e.g. ones
    written earlier by passlib). False for over-long input or a malformed hash."""
    password = plain_password.encode("utf-8")
    if len(password) > BCRYPT_MAX_BYTES:
        return False
    try:
        return bcrypt.checkpw(password, hashed_password.encode("utf-8"))
    except ValueError:
        return False


def get_password_hash(password: str) -> str:
    """Hash a password with bcrypt (a $2b$ hash, 12 rounds)."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("ascii")


# bcrypt hash of a random throwaway password. Login verifies against it when the
# email is unknown, so the response time doesn't reveal which accounts exist.
DUMMY_PASSWORD_HASH = get_password_hash(secrets.token_urlsafe(16))


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Create a JWT. "type" defaults to "access"; only access tokens authenticate
    requests (app.core.deps.get_current_user)."""
    to_encode = data.copy()
    to_encode.setdefault("type", "access")
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(user_id: str) -> str:
    """Create a refresh token ("type": "refresh"), accepted only by /auth/refresh."""
    return create_access_token(
        data={"sub": user_id, "type": "refresh"},
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
