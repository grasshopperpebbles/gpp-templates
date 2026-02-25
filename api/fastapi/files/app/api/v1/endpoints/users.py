"""User endpoints (example)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.schemas.user import UserCreate, UserResponse

router = APIRouter()


@router.get("/", response_model=list[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    List users (requires authentication).

    This is an example endpoint - implement based on your User model.
    """
    # TODO: Implement user listing
    # from app.db.models import User
    # users = await db.execute(select(User).offset(skip).limit(limit))
    # return users.scalars().all()
    return []


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new user.

    This is an example endpoint - implement based on your User model.
    """
    # TODO: Implement user creation
    # user = User(**user_data.model_dump())
    # db.add(user)
    # await db.commit()
    # await db.refresh(user)
    # return user
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="User creation not yet implemented",
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
):
    """Get current user information."""
    # TODO: Return actual user data
    return current_user

