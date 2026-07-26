"""add_pending_confirmation_status

Revision ID: b1c2d3e4f5a6
Revises: 195d5713599f
Create Date: 2026-07-26 10:42:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, Sequence[str], None] = '195d5713599f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add 'pending_confirmation' to the orderstatus enum in PostgreSQL."""
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'pending_confirmation' AFTER 'pending'")


def downgrade() -> None:
    """PostgreSQL does not support removing enum values easily.
    To fully downgrade, you would need to recreate the enum type.
    This is left as a no-op for safety.
    """
    pass
