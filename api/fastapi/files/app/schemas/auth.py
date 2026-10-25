"""Auth schemas."""
from __future__ import annotations

from pydantic import BaseModel, EmailStr

from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    """Login credentials."""
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    """Refresh token request."""
    refresh_token: str


class TokenResponse(BaseModel):
    """Token response returned on login/register."""
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    user: UserResponse | None = None
