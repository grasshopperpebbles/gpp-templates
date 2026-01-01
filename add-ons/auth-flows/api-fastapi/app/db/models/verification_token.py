"""VerificationToken model for email verification and password reset tokens."""
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def generate_cuid() -> str:
    """Generate a CUID-like ID."""
    import secrets
    import time
    timestamp = hex(int(time.time() * 1000))[2:]
    random_part = secrets.token_hex(8)
    return f"c{timestamp}{random_part}"[:25]


class VerificationToken(Base):
    """Verification token for email verification and password reset."""

    __tablename__ = "verification_tokens"

    id: Mapped[str] = mapped_column(
        String(25), primary_key=True, default=generate_cuid
    )
    user_id: Mapped[str] = mapped_column(
        String(25), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # 'email_verification' | 'password_reset'
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationship
    user = relationship("User", back_populates="verification_tokens")

    __table_args__ = (
        Index("idx_verification_tokens_token", "token"),
        Index("idx_verification_tokens_user_id", "user_id"),
        Index("idx_verification_tokens_type", "type"),
    )
