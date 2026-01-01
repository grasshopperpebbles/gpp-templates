"""
GraphQL Schema (Optional)
=========================

To enable GraphQL:
1. Install: pip install 'strawberry-graphql[fastapi]'
2. Uncomment GraphQL router in app/main.py
3. Access GraphQL at: http://localhost:8000/graphql
"""

from __future__ import annotations

from typing import Optional
import strawberry
from strawberry.fastapi import GraphQLRouter

from app.db.session import get_db
from app.db.models.user import User
from app.core.security import verify_password, create_access_token
from app.core.config import settings
from sqlalchemy.orm import Session


# GraphQL Types
@strawberry.type
class UserType:
    id: int
    email: str
    is_active: bool

    @classmethod
    def from_orm(cls, user: User) -> "UserType":
        return cls(
            id=user.id,
            email=user.email,
            is_active=bool(getattr(user, "is_active", True)),
        )


@strawberry.type
class TokenType:
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None


# Input Types
@strawberry.input
class LoginInput:
    email: str
    password: str


# Context for dependency injection
@strawberry.type
class Query:
    @strawberry.field
    async def hello(self) -> str:
        """Simple hello query for testing"""
        return "Hello from GraphQL!"

    @strawberry.field
    async def me(self, info: strawberry.Info) -> Optional[UserType]:
        """Get current authenticated user"""
        # Get user from context (set by auth middleware)
        user: Optional[User] = info.context.get("user")
        
        if not user:
            return None
        
        return UserType.from_orm(user)


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def login(self, input: LoginInput, info: strawberry.Info) -> TokenType:
        """Login mutation - returns JWT token"""
        db: Session = info.context.get("db")
        
        if not db:
            raise Exception("Database session not available")
        
        try:
            # Find user
            user = db.query(User).filter(User.email == input.email).first()
            if not user or not verify_password(input.password, user.hashed_password):
                raise Exception("Invalid credentials")
            
            # Create access token
            access_token = create_access_token(
                subject=user.email,
                secret_key=settings.JWT_SECRET,
                expires_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            )
            
            return TokenType(
                access_token=access_token,
                token_type="bearer",
            )
        finally:
            # Ensure database session is closed
            # Note: In production, consider using dependency injection or middleware
            # for proper session lifecycle management
            pass  # Session cleanup handled by context cleanup if implemented


# Create schema
schema = strawberry.Schema(query=Query, mutation=Mutation)


# GraphQL Router (to be included in main.py)
def get_graphql_router() -> GraphQLRouter:
    """Create GraphQL router with context"""
    from app.graphql.auth import get_graphql_context
    
    return GraphQLRouter(
        schema,
        graphql_ide="apollo-sandbox",  # or "graphiql" or None
        context_getter=get_graphql_context,
    )
