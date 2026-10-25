"""User endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter()


@router.get("/", response_model=list[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List users (requires authentication)."""
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """Get current user information."""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update current user information."""
    update_fields = user_data.model_dump(exclude_unset=True)

    if "password" in update_fields:
        from app.core.security import get_password_hash
        current_user.hashed_password = get_password_hash(update_fields.pop("password"))

    for field, value in update_fields.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)
    return current_user
