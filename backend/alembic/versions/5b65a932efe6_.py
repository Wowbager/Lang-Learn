"""empty message

Revision ID: 5b65a932efe6
Revises: 61a3cdd2f3e2
Create Date: 2025-09-17 20:13:00.148233

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5b65a932efe6'
down_revision: Union[str, None] = '61a3cdd2f3e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
