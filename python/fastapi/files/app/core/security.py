from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def create_access_token(*, subject: str, secret_key: str, expires_minutes: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode: dict[str, Any] = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, secret_key, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(*, subject: str, secret_key: str, expires_days: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=expires_days)
    payload: dict[str, Any] = {"sub": subject, "exp": expire}
    return jwt.encode(payload, secret_key, algorithm=settings.JWT_ALGORITHM)
