"""
GraphQL Authentication Context
===============================

Helper functions for GraphQL authentication.
Integrates with FastAPI's dependency injection system.
"""

from __future__ import annotations

from typing import Optional
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_db, get_current_user
from app.db.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_graphql_user(
    token: Optional[str] = None,
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Get current user for GraphQL context.
    Can be used in GraphQL resolvers that need authentication.
    """
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        sub = payload.get("sub")
        if not sub:
            return None
    except JWTError:
        return None

    user = db.query(User).filter(User.email == sub).first()
    if not user or not getattr(user, "is_active", True):
        return None
    
    return user


async def get_graphql_context(request):
    """
    Get GraphQL context with database session and authenticated user.
    This function extracts the Bearer token from the request headers.
    
    Note: Database session lifecycle needs to be managed manually.
    Consider using a dependency or middleware for proper cleanup.
    """
    from app.db.session import SessionLocal
    
    # Create database session
    # IMPORTANT: Session should be closed after request completes
    # Consider using a dependency or middleware for proper cleanup
    db = SessionLocal()
    
    # Extract token from Authorization header
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    
    # Get user if token provided
    user = None
    if token:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            sub = payload.get("sub")
            if sub:
                user = db.query(User).filter(User.email == sub).first()
                if user and not getattr(user, "is_active", True):
                    user = None
        except JWTError:
            pass
    
    # Store cleanup function in context
    async def cleanup():
        db.close()
    
    return {
        "db": db,
        "user": user,
        "request": request,
        "cleanup": cleanup,  # Can be called after request if needed
    }
