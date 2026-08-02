"""add_confirmed_status

Revision ID: d3e4f5a6b7c8
Revises: c2d3e4f5a6b7
Create Date: 2026-08-02 11:22:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'd3e4f5a6b7c8'
down_revision: Union[str, Sequence[str], None] = 'c2d3e4f5a6b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add 'confirmed' to the orderstatus enum in PostgreSQL."""
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'confirmed' AFTER 'pending_confirmation'")


def downgrade() -> None:
    """PostgreSQL does not support removing enum values easily.
    To fully downgrade, you would need to recreate the enum type.
    This is left as a no-op for safety.
    """
    pass
