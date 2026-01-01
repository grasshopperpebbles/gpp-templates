"""Auth Flows API Routes - Registration, Email Verification, Password Reset."""
from datetime import datetime, timedelta
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.security import get_password_hash, verify_password
from app.core.email import send_verification_email, send_password_reset_email
from app.db.models import User, VerificationToken
from app.schemas.auth_flows import (
    RegisterRequest,
    RegisterResponse,
    VerifyEmailRequest,
    VerifyEmailResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    ResendVerificationRequest,
)

router = APIRouter()

# Token expiry settings (can be overridden via environment)
EMAIL_VERIFICATION_EXPIRY_HOURS = 24
PASSWORD_RESET_EXPIRY_HOURS = 1


def generate_token() -> str:
    """Generate a secure random token."""
    return secrets.token_urlsafe(32)


@router.post("/register", response_model=RegisterResponse)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user and send verification email."""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == request.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    # Create user
    user = User(
        email=request.email,
        username=request.email.split("@")[0],  # Default username from email
        display_name=request.name,
        hashed_password=get_password_hash(request.password),
        is_active=False,  # Not active until email verified
        is_verified=False,
    )
    db.add(user)
    await db.flush()

    # Create verification token
    token = generate_token()
    verification = VerificationToken(
        user_id=user.id,
        token=token,
        type="email_verification",
        expires_at=datetime.utcnow() + timedelta(hours=EMAIL_VERIFICATION_EXPIRY_HOURS),
    )
    db.add(verification)
    await db.commit()

    # Send verification email
    await send_verification_email(user.email, user.display_name or user.email, token)

    return RegisterResponse(
        message="Registration successful. Please check your email to verify your account.",
        user_id=user.id,
    )


@router.post("/verify-email", response_model=VerifyEmailResponse)
async def verify_email(
    request: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verify user's email address with token."""
    # Find token
    result = await db.execute(
        select(VerificationToken).where(
            VerificationToken.token == request.token,
            VerificationToken.type == "email_verification",
            VerificationToken.used_at.is_(None),
        )
    )
    verification = result.scalar_one_or_none()

    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    # Check expiry
    if verification.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired",
        )

    # Get user
    result = await db.execute(select(User).where(User.id == verification.user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found",
        )

    # Update user
    user.is_verified = True
    user.is_active = True

    # Mark token as used
    verification.used_at = datetime.utcnow()

    await db.commit()

    return VerifyEmailResponse(
        message="Email verified successfully. You can now log in.",
        verified=True,
    )


@router.post("/resend-verification", response_model=RegisterResponse)
async def resend_verification(
    request: ResendVerificationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Resend verification email."""
    # Find user
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user:
        # Don't reveal if email exists
        return RegisterResponse(
            message="If an account exists, a verification email has been sent.",
        )

    if user.is_verified:
        return RegisterResponse(
            message="This email is already verified. You can log in.",
        )

    # Invalidate old tokens
    result = await db.execute(
        select(VerificationToken).where(
            VerificationToken.user_id == user.id,
            VerificationToken.type == "email_verification",
            VerificationToken.used_at.is_(None),
        )
    )
    old_tokens = result.scalars().all()
    for old_token in old_tokens:
        old_token.used_at = datetime.utcnow()

    # Create new token
    token = generate_token()
    verification = VerificationToken(
        user_id=user.id,
        token=token,
        type="email_verification",
        expires_at=datetime.utcnow() + timedelta(hours=EMAIL_VERIFICATION_EXPIRY_HOURS),
    )
    db.add(verification)
    await db.commit()

    # Send email
    await send_verification_email(user.email, user.display_name or user.email, token)

    return RegisterResponse(
        message="If an account exists, a verification email has been sent.",
    )


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Request password reset email."""
    # Find user
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    # Always return success to prevent email enumeration
    response = ForgotPasswordResponse(
        message="If an account exists with that email, a password reset link has been sent.",
    )

    if not user:
        return response

    # Invalidate old reset tokens
    result = await db.execute(
        select(VerificationToken).where(
            VerificationToken.user_id == user.id,
            VerificationToken.type == "password_reset",
            VerificationToken.used_at.is_(None),
        )
    )
    old_tokens = result.scalars().all()
    for old_token in old_tokens:
        old_token.used_at = datetime.utcnow()

    # Create new token
    token = generate_token()
    verification = VerificationToken(
        user_id=user.id,
        token=token,
        type="password_reset",
        expires_at=datetime.utcnow() + timedelta(hours=PASSWORD_RESET_EXPIRY_HOURS),
    )
    db.add(verification)
    await db.commit()

    # Send email
    await send_password_reset_email(user.email, user.display_name or user.email, token)

    return response


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Reset password with token."""
    # Find token
    result = await db.execute(
        select(VerificationToken).where(
            VerificationToken.token == request.token,
            VerificationToken.type == "password_reset",
            VerificationToken.used_at.is_(None),
        )
    )
    verification = result.scalar_one_or_none()

    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    # Check expiry
    if verification.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired",
        )

    # Get user
    result = await db.execute(select(User).where(User.id == verification.user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found",
        )

    # Update password
    user.hashed_password = get_password_hash(request.password)

    # Mark token as used
    verification.used_at = datetime.utcnow()

    await db.commit()

    return ResetPasswordResponse(
        message="Password reset successfully. You can now log in with your new password.",
        success=True,
    )
