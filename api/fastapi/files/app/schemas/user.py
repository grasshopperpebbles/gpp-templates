"""User schemas."""
from __future__ import annotations

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    name: str | None = None


class UserCreate(UserBase):
    """Schema for creating a user."""
    password: str


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    email: EmailStr | None = None
    name: str | None = None
    password: str | None = None


class UserResponse(UserBase):
    """Schema for user response."""
    id: str

    class Config:
        from_attributes = True

