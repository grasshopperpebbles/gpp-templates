"""Schemas for the auth flows endpoints (gpp add auth-flows)."""
from __future__ import annotations

from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, EmailStr, Field


def _max_72_bytes(value: str) -> str:
    # bcrypt only uses the first 72 bytes; non-ASCII characters take several.
    if len(value.encode("utf-8")) > 72:
        raise ValueError("password must be at most 72 bytes (UTF-8)")
    return value


# Same rules as the pack's registration: 8..72 characters, at most 72 UTF-8 bytes.
NewPassword = Annotated[str, Field(min_length=8, max_length=72), AfterValidator(_max_72_bytes)]
Token = Annotated[str, Field(min_length=1, max_length=200)]


class TokenRequest(BaseModel):
    token: Token


class EmailRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: Token
    password: NewPassword


class MessageResponse(BaseModel):
    message: str


class VerificationStatusResponse(BaseModel):
    email: str
    email_verified: bool
    email_verified_at: datetime | None = None
