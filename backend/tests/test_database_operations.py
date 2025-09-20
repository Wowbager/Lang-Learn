"""
Unit tests for database operations and connection utilities.
"""

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from database.connection import get_db, create_tables
from models.database_models import User, Collection, LearningSet, UserRole
import uuid

class TestDatabaseConnection:
    """Test database connection utilities."""
    
    def test_get_db_session(self, db_session):
        """Test that database session is created properly."""
        assert db_session is not None
        # Test that we can perform basic operations
        user_count = db_session.query(User).count()
        assert user_count >= 0  # Should be 0 or more
    
    def test_database_transaction_rollback(self, db_session):
        """Test that database transactions can be rolled back."""
        # Create a user
        user = User(
            id=str(uuid.uuid4()),
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
            full_name="Test User",
            role=UserRole.STUDENT
        )
        db_session.add(user)
        
        # Rollback the transaction
        db_session.rollback()
        
        # User should not exist in database
        user_count = db_session.query(User).count()
        assert user_count == 0
    
    def test_database_transaction_commit(self, db_session):
        """Test that database transactions can be committed."""
        # Create a user
        user = User(
            id=str(uuid.uuid4()),
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
            full_name="Test User",
            role=UserRole.STUDENT
        )
        db_session.add(user)
        db_session.flush()
        
        # User should exist in database
        user_count = db_session.query(User).count()
        assert user_count == 1

class TestDatabaseConstraints:
    """Test database constraints and validation."""
    
    def test_unique_username_constraint(self, db_session):
        """Test that username must be unique."""
        # Create first user
        user1 = User(
            id=str(uuid.uuid4()),
            username="testuser",
            email="test1@example.com",
            hashed_password="hashed_password",
            full_name="Test User 1",
            role=UserRole.STUDENT
        )
        db_session.add(user1)
        db_session.flush()
        
        # Try to create second user with same username
        user2 = User(
            id=str(uuid.uuid4()),
            username="testuser",  # Same username
            email="test2@example.com",
            hashed_password="hashed_password",
            full_name="Test User 2",
            role=UserRole.STUDENT
        )
        db_session.add(user2)
        
        # Should raise IntegrityError due to unique constraint
        with pytest.raises(IntegrityError):
            db_session.flush()
    
    def test_unique_email_constraint(self, db_session):
        """Test that email must be unique."""
        # Create first user
        user1 = User(
            id=str(uuid.uuid4()),
            username="testuser1",
            email="test@example.com",
            hashed_password="hashed_password",
            full_name="Test User 1",
            role=UserRole.STUDENT
        )
        db_session.add(user1)
        db_session.flush()
        
        # Try to create second user with same email
        user2 = User(
            id=str(uuid.uuid4()),
            username="testuser2",
            email="test@example.com",  # Same email
            hashed_password="hashed_password",
            full_name="Test User 2",
            role=UserRole.STUDENT
        )
        db_session.add(user2)
        
        # Should raise IntegrityError due to unique constraint
        with pytest.raises(IntegrityError):
            db_session.flush()
    
    def test_foreign_key_constraint(self, db_session):
        """Test that foreign key constraints are enforced."""
        # Ensure foreign keys are enabled for this test
        if db_session.bind.dialect.name == 'sqlite':
            db_session.execute(text("PRAGMA foreign_keys=ON"))
        
        # Try to create collection with non-existent user
        collection = Collection(
            id=str(uuid.uuid4()),
            name="Test Collection",
            created_by="non-existent-user-id"  # Non-existent user
        )
        db_session.add(collection)
        
        # Should raise IntegrityError due to foreign key constraint
        with pytest.raises(IntegrityError):
            db_session.commit()

class TestDatabaseQueries:
    """Test database query operations."""
    
    def test_query_user_by_username(self, db_session, sample_user):
        """Test querying user by username."""
        found_user = db_session.query(User).filter(User.username == sample_user.username).first()
        
        assert found_user is not None
        assert found_user.id == sample_user.id
        assert found_user.email == sample_user.email
    
    def test_query_user_by_email(self, db_session, sample_user):
        """Test querying user by email."""
        found_user = db_session.query(User).filter(User.email == sample_user.email).first()
        
        assert found_user is not None
        assert found_user.id == sample_user.id
        assert found_user.username == sample_user.username
    
    def test_query_collections_by_creator(self, db_session, sample_user, sample_collection):
        """Test querying collections by creator."""
        collections = db_session.query(Collection).filter(Collection.created_by == sample_user.id).all()
        
        assert len(collections) == 1
        assert collections[0].id == sample_collection.id
        assert collections[0].name == sample_collection.name
    
    def test_query_learning_sets_by_collection(self, db_session, sample_collection, sample_learning_set):
        """Test querying learning sets by collection."""
        learning_sets = db_session.query(LearningSet).filter(
            LearningSet.collection_id == sample_collection.id
        ).all()
        
        assert len(learning_sets) == 1
        assert learning_sets[0].id == sample_learning_set.id
        assert learning_sets[0].name == sample_learning_set.name
    
    def test_join_query_collection_with_creator(self, db_session, sample_user, sample_collection):
        """Test join query between collection and creator."""
        result = db_session.query(Collection, User).join(
            User, Collection.created_by == User.id
        ).filter(Collection.id == sample_collection.id).first()
        
        assert result is not None
        collection, user = result
        assert collection.id == sample_collection.id
        assert user.id == sample_user.id
        assert user.username == sample_user.username

class TestDatabaseRelationships:
    """Test database relationship loading."""
    
    def test_lazy_loading_collections(self, db_session, sample_user, sample_collection):
        """Test lazy loading of user's created collections."""
        # Query user without explicitly loading collections
        user = db_session.query(User).filter(User.id == sample_user.id).first()
        
        # Access collections (should trigger lazy loading)
        collections = user.created_collections
        
        assert len(collections) == 1
        assert collections[0].id == sample_collection.id
    
    def test_lazy_loading_learning_sets(self, db_session, sample_collection, sample_learning_set):
        """Test lazy loading of collection's learning sets."""
        # Query collection without explicitly loading learning sets
        collection = db_session.query(Collection).filter(Collection.id == sample_collection.id).first()
        
        # Access learning sets (should trigger lazy loading)
        learning_sets = collection.learning_sets
        
        assert len(learning_sets) == 1
        assert learning_sets[0].id == sample_learning_set.id
    
    def test_back_reference_creator(self, db_session, sample_user, sample_collection):
        """Test back reference from collection to creator."""
        # Query collection
        collection = db_session.query(Collection).filter(Collection.id == sample_collection.id).first()
        
        # Access creator through back reference
        creator = collection.creator
        
        assert creator.id == sample_user.id
        assert creator.username == sample_user.username