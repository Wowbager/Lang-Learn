"""empty message

Revision ID: dc42fbf0b034
Revises: 917017a62de7
Create Date: 2025-09-17 18:10:22.404056

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dc42fbf0b034'
down_revision: Union[str, None] = '917017a62de7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
