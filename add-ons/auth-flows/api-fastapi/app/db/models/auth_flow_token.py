"""One-time tokens for email verification and password reset (gpp add auth-flows).

Only a SHA-256 hash of each token's secret is stored. A token is `<id>.<secret>`:
the id finds the row, the secret is checked against the hash in constant time.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

EMAIL_VERIFICATION = "email_verification"
PASSWORD_RESET = "password_reset"


class AuthFlowToken(Base):
    """A single-use, expiring token sent by email."""

    __tablename__ = "auth_flow_tokens"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    # EMAIL_VERIFICATION or PASSWORD_RESET
    purpose: Mapped[str] = mapped_column(String(32), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_auth_flow_tokens_user_id_purpose", "user_id", "purpose"),
    )
