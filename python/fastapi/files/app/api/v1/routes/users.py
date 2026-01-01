from __future__ import annotations

from fastapi import APIRouter, Depends
from app.core.deps import get_current_user
from app.db.models.user import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
def me(user: User = Depends(get_current_user)) -> dict:
    return {"id": user.id, "email": user.email, "is_active": bool(getattr(user, "is_active", True))}
