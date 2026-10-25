"""User schemas."""
from __future__ import annotations

from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field


def _max_72_bytes(value: str) -> str:
    # bcrypt only uses the first 72 bytes; non-ASCII characters take several.
    if len(value.encode("utf-8")) > 72:
        raise ValueError("password must be at most 72 bytes (UTF-8)")
    return value


# 8..72 characters and at most 72 UTF-8 bytes (bcrypt's limit).
Password = Annotated[str, Field(min_length=8, max_length=72), AfterValidator(_max_72_bytes)]


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    name: str | None = None


class UserCreate(UserBase):
    """Schema for creating a user."""
    password: Password


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    email: EmailStr | None = None
    name: str | None = None
    password: Password | None = None


class UserResponse(UserBase):
    """Schema for user response."""
    model_config = ConfigDict(from_attributes=True)

    id: str

