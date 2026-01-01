"""Pydantic schemas for Auth Flows endpoints."""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """Request schema for user registration."""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)


class RegisterResponse(BaseModel):
    """Response schema for user registration."""
    message: str
    user_id: Optional[str] = None


class VerifyEmailRequest(BaseModel):
    """Request schema for email verification."""
    token: str


class VerifyEmailResponse(BaseModel):
    """Response schema for email verification."""
    message: str
    verified: bool = False


class ResendVerificationRequest(BaseModel):
    """Request schema for resending verification email."""
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    """Request schema for forgot password."""
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    """Response schema for forgot password."""
    message: str


class ResetPasswordRequest(BaseModel):
    """Request schema for password reset."""
    token: str
    password: str = Field(..., min_length=8, max_length=100)


class ResetPasswordResponse(BaseModel):
    """Response schema for password reset."""
    message: str
    success: bool = False
