"""Add verification_tokens table for auth flows.

Revision ID: auth_flows_001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'auth_flows_001'
down_revision = None  # Will be updated when applied
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create verification_tokens table
    op.create_table(
        'verification_tokens',
        sa.Column('id', sa.String(25), primary_key=True),
        sa.Column('user_id', sa.String(25), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token', sa.String(255), unique=True, nullable=False),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('used_at', sa.DateTime(), nullable=True),
    )

    # Create indexes
    op.create_index('idx_verification_tokens_token', 'verification_tokens', ['token'])
    op.create_index('idx_verification_tokens_user_id', 'verification_tokens', ['user_id'])
    op.create_index('idx_verification_tokens_type', 'verification_tokens', ['type'])

    # Add is_verified column to users table if it doesn't exist
    # This is a safe operation - will skip if column exists
    try:
        op.add_column('users', sa.Column('is_verified', sa.Boolean(), server_default='false', nullable=False))
    except Exception:
        pass  # Column already exists


def downgrade() -> None:
    op.drop_index('idx_verification_tokens_type', 'verification_tokens')
    op.drop_index('idx_verification_tokens_user_id', 'verification_tokens')
    op.drop_index('idx_verification_tokens_token', 'verification_tokens')
    op.drop_table('verification_tokens')

    try:
        op.drop_column('users', 'is_verified')
    except Exception:
        pass
