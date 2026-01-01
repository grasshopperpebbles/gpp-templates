from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.core.deps import get_current_user
from app.db.session import get_db
from app.db.models.user import User
from app.schemas.auth import Token, LoginRequest, RefreshRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Token:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access = create_access_token(
        subject=user.email,
        secret_key=settings.JWT_SECRET,
        expires_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    )
    refresh = create_refresh_token(
        subject=user.email,
        secret_key=settings.JWT_SECRET,
        expires_days=settings.REFRESH_TOKEN_EXPIRE_DAYS,
    )
    return Token(access_token=access, refresh_token=refresh, token_type="bearer")


@router.post("/refresh", response_model=Token)
def refresh(body: RefreshRequest) -> Token:
    try:
        payload = jwt.decode(body.refresh_token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    access = create_access_token(
        subject=sub,
        secret_key=settings.JWT_SECRET,
        expires_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    )
    return Token(access_token=access, token_type="bearer")


@router.get("/me")
def me(user: User = Depends(get_current_user)) -> dict:
    return {"id": user.id, "email": user.email, "is_active": bool(getattr(user, "is_active", True))}
