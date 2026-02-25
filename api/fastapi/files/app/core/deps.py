"""FastAPI dependencies."""
from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError, jwt

from app.core.config import settings
from app.db.session import get_db

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get current authenticated user from JWT token.

    This is a placeholder - implement based on your User model.
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
        # TODO: Fetch user from database
        # from app.db.models import User
        # user = await db.get(User, user_id)
        # if user is None:
        #     raise HTTPException(...)
        # return user
        return {"id": user_id}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )


# Optional: Admin dependency
async def get_current_admin(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Require admin role."""
    # TODO: Check if user is admin
    # if not current_user.is_admin:
    #     raise HTTPException(...)
    return current_user

