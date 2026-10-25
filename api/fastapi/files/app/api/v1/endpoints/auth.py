"""Auth endpoints (register, login, refresh, me)."""
from __future__ import annotations

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_user
from app.core.security import (
    DUMMY_PASSWORD_HASH,
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
)
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import TokenResponse, LoginRequest, RefreshRequest

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user."""
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )

    user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=get_password_hash(user_data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse(id=user.id, email=user.email, name=user.name),
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Login with email and password."""
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    # Always run bcrypt, even for an unknown email, so timing doesn't reveal accounts.
    hashed = user.hashed_password if user else DUMMY_PASSWORD_HASH
    if not verify_password(credentials.password, hashed) or not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """Refresh an access token using a refresh token."""
    try:
        # Tokens without exp, sub or type are rejected (see app.core.deps).
        payload = jwt.decode(
            body.refresh_token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "sub", "type"]},
        )
        user_id: str | None = payload.get("sub")
        token_type: str | None = payload.get("type")

        if user_id is None or token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled",
            )

        access_token = create_access_token(data={"sub": user.id, "email": user.email})

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
    )
