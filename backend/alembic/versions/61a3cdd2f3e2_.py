"""empty message

Revision ID: 61a3cdd2f3e2
Revises: dc42fbf0b034
Create Date: 2025-09-17 19:53:08.914155

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '61a3cdd2f3e2'
down_revision: Union[str, None] = 'dc42fbf0b034'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
