"""change_learning_set_collection_to_many_to_many

Revision ID: 4899153d9e6c
Revises: 5b65a932efe6
Create Date: 2025-10-01 15:38:17.551064

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4899153d9e6c'
down_revision: Union[str, None] = '5b65a932efe6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if association table already exists, if not create it
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()
    
    if 'learning_set_collections' not in existing_tables:
        op.create_table(
            'learning_set_collections',
            sa.Column('learning_set_id', sa.String(), nullable=False),
            sa.Column('collection_id', sa.String(), nullable=False),
            sa.ForeignKeyConstraint(['collection_id'], ['collections.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['learning_set_id'], ['learning_sets.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('learning_set_id', 'collection_id')
        )
    
    # Migrate existing data - copy collection_id to the association table
    # Only insert if data doesn't already exist
    op.execute("""
        INSERT INTO learning_set_collections (learning_set_id, collection_id)
        SELECT ls.id, ls.collection_id 
        FROM learning_sets ls
        WHERE ls.collection_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM learning_set_collections lsc 
            WHERE lsc.learning_set_id = ls.id 
            AND lsc.collection_id = ls.collection_id
        )
    """)
    
    # Drop the foreign key constraint and collection_id column from learning_sets
    # Check if column exists first
    columns = [col['name'] for col in inspector.get_columns('learning_sets')]
    if 'collection_id' in columns:
        op.drop_constraint('learning_sets_collection_id_fkey', 'learning_sets', type_='foreignkey')
        op.drop_column('learning_sets', 'collection_id')


def downgrade() -> None:
    # Add back the collection_id column
    op.add_column('learning_sets', sa.Column('collection_id', sa.String(), nullable=True))
    
    # Restore the foreign key constraint
    op.create_foreign_key(
        'learning_sets_collection_id_fkey',
        'learning_sets',
        'collections',
        ['collection_id'],
        ['id'],
        ondelete='SET NULL'
    )
    
    # Migrate data back - take the first collection if multiple exist
    op.execute("""
        UPDATE learning_sets
        SET collection_id = (
            SELECT collection_id 
            FROM learning_set_collections 
            WHERE learning_set_collections.learning_set_id = learning_sets.id 
            LIMIT 1
        )
    """)
    
    # Drop the association table
    op.drop_table('learning_set_collections')
