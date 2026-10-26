"""Email verification and password reset (gpp add auth-flows).

Mounted next to the pack's auth router at /api/v1/auth:
  POST /verify-email          {token}            -> marks the email verified
  POST /resend-verification   {email}            -> emails a new verification link
  POST /forgot-password       {email}            -> emails a password reset link
  POST /reset-password        {token, password}  -> sets a new password
  GET  /verification-status   (Bearer token)     -> {email, email_verified, email_verified_at}

Registration stays on the pack's POST /auth/register. SendVerificationEmailOnRegister
(added to app.main) emails the verification link after a successful register.
Login is not blocked for unverified users; protect routes that need a verified
address with Depends(require_verified_email).
"""
from __future__ import annotations

import json
import logging
from datetime import timedelta
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth_flows import (
    auth_flows_settings,
    consume_token,
    invalidate_tokens,
    issue_token,
    utcnow,
)
from app.core.deps import get_current_user
from app.core.email import send_password_reset_email, send_verification_email
from app.core.security import get_password_hash
from app.db.models.auth_flow_token import EMAIL_VERIFICATION, PASSWORD_RESET
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.auth_flows import (
    EmailRequest,
    MessageResponse,
    ResetPasswordRequest,
    TokenRequest,
    VerificationStatusResponse,
)

logger = logging.getLogger("app.auth_flows")

router = APIRouter()

# The same answer whether or not the email has an account.
RESEND_MESSAGE = "If that account exists and is not verified yet, we sent a new verification link."
FORGOT_MESSAGE = "If an account exists for that email, we sent a password reset link."


def verification_lifetime() -> timedelta:
    return timedelta(hours=auth_flows_settings.EMAIL_VERIFICATION_EXPIRE_HOURS)


def reset_lifetime() -> timedelta:
    return timedelta(minutes=auth_flows_settings.PASSWORD_RESET_EXPIRE_MINUTES)


async def _user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(body: TokenRequest, db: AsyncSession = Depends(get_db)):
    """Confirm an email address with the token from the verification email."""
    token = await consume_token(db, body.token, EMAIL_VERIFICATION)
    user = await db.get(User, token.user_id) if token else None
    if token is None or user is None:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This verification link is invalid or has expired.",
        )
    if user.email_verified_at is None:
        user.email_verified_at = utcnow()
    await invalidate_tokens(db, user.id, EMAIL_VERIFICATION)
    await db.commit()
    return MessageResponse(message="Your email address is verified.")


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    body: EmailRequest,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Email a new verification link. The response never says whether the account exists."""
    user = await _user_by_email(db, body.email)
    if user is not None and user.is_active and user.email_verified_at is None:
        email, name = user.email, user.name
        token = await issue_token(db, user.id, EMAIL_VERIFICATION, verification_lifetime())
        await db.commit()
        background.add_task(send_verification_email, email, name, token)
    return MessageResponse(message=RESEND_MESSAGE)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    body: EmailRequest,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Email a password reset link. The response never says whether the account exists,
    and the email goes out after the response, so timing doesn't tell either."""
    user = await _user_by_email(db, body.email)
    if user is not None and user.is_active:
        email, name = user.email, user.name
        token = await issue_token(db, user.id, PASSWORD_RESET, reset_lifetime())
        await db.commit()
        background.add_task(send_password_reset_email, email, name, token)
    return MessageResponse(message=FORGOT_MESSAGE)


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Set a new password with the token from the reset email. The token works once,
    and every other outstanding reset link for the account stops working."""
    token = await consume_token(db, body.token, PASSWORD_RESET)
    user = await db.get(User, token.user_id) if token else None
    if token is None or user is None or not user.is_active:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link is invalid or has expired.",
        )
    user.hashed_password = get_password_hash(body.password)
    # The link reached the user's inbox, so the address is theirs.
    if user.email_verified_at is None:
        user.email_verified_at = utcnow()
    await invalidate_tokens(db, user.id, PASSWORD_RESET)
    await db.commit()
    return MessageResponse(message="Your password has been reset. You can sign in with it now.")


@router.get("/verification-status", response_model=VerificationStatusResponse)
async def verification_status(current_user: User = Depends(get_current_user)):
    """Whether the signed-in user's email address is verified."""
    return VerificationStatusResponse(
        email=current_user.email,
        email_verified=current_user.email_verified_at is not None,
        email_verified_at=current_user.email_verified_at,
    )


async def require_verified_email(current_user: User = Depends(get_current_user)) -> User:
    """Dependency for routes that need a verified email address (403 otherwise)."""
    if current_user.email_verified_at is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address first.",
        )
    return current_user


REGISTER_PATH = "/api/v1/auth/register"


async def send_verification_after_register(app: Any, user_id: str) -> None:
    """Issue a verification token for a user that just registered and email it.
    Uses get_db (or its test override), so it shares the app's database."""
    factory = app.dependency_overrides.get(get_db, get_db)
    sessions = factory()
    db = await anext(sessions)
    try:
        user = await db.get(User, user_id)
        if user is None or user.email_verified_at is not None:
            return
        email, name = user.email, user.name
        token = await issue_token(db, user.id, EMAIL_VERIFICATION, verification_lifetime())
        await db.commit()
    finally:
        await sessions.aclose()
    await send_verification_email(email, name, token)


class SendVerificationEmailOnRegister:
    """ASGI middleware: after the pack's POST /api/v1/auth/register answers 201,
    email the new user a verification link. The register endpoint itself is untouched;
    this reads the user id from its response ({"user": {"id": ...}})."""

    def __init__(self, app: Any) -> None:
        self.app = app

    async def __call__(self, scope: Any, receive: Any, send: Any) -> None:
        if (
            scope["type"] != "http"
            or scope["method"] != "POST"
            or scope["path"].rstrip("/") != REGISTER_PATH
        ):
            await self.app(scope, receive, send)
            return

        status_code = 0
        body = bytearray()

        async def capture(message: Any) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
            elif message["type"] == "http.response.body" and status_code == 201:
                body.extend(message.get("body", b""))
            await send(message)

        await self.app(scope, receive, capture)

        if status_code != 201:
            return
        try:
            user_id = json.loads(bytes(body))["user"]["id"]
        except (ValueError, KeyError, TypeError):
            logger.warning("Register response had no user id; no verification email sent")
            return
        try:
            await send_verification_after_register(scope["app"], str(user_id))
        except Exception:  # noqa: BLE001 - registration already succeeded
            logger.exception("Could not send the verification email after register")
