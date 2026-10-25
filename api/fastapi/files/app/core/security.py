"""Security utilities (password hashing, JWT tokens)."""
from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


# bcrypt hash of a random throwaway password. Login verifies against it when the
# email is unknown, so the response time doesn't reveal which accounts exist.
DUMMY_PASSWORD_HASH = pwd_context.hash(secrets.token_urlsafe(16))


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
