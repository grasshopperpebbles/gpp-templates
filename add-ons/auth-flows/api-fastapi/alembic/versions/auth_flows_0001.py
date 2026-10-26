"""auth flows: users.email_verified_at and auth_flow_tokens

Revision ID: auth_flows_0001
Revises: 0001_create_users
Create Date: 2026-10-26

Added by `gpp add auth-flows`. The installer points down_revision at the
project's Alembic head(s); 0001_create_users is the FastAPI pack's first one.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "auth_flows_0001"
down_revision: Union[str, Sequence[str], None] = "0001_create_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        "auth_flow_tokens",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("purpose", sa.String(length=32), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_auth_flow_tokens_user_id_purpose",
        "auth_flow_tokens",
        ["user_id", "purpose"],
    )


def downgrade() -> None:
    op.drop_index("ix_auth_flow_tokens_user_id_purpose", table_name="auth_flow_tokens")
    op.drop_table("auth_flow_tokens")
    op.drop_column("users", "email_verified_at")
