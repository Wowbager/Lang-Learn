"""
Tests for content management API endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from uuid import uuid4
import json

from main import app
from models.database_models import User, Collection, LearningSet, VocabularyItem, GrammarTopic, Permission, PermissionRole, UserRole, GrammarDifficulty
from auth.security import create_access_token

@pytest.fixture
def test_user(db_session: Session):
    """Create a test user."""
    user = User(
        id=str(uuid4()),
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password",
        full_name="Test User",
        role=UserRole.STUDENT
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def auth_headers(test_user: User):
    """Create authentication headers for test user."""
    token = create_access_token(data={"sub": test_user.username})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def test_collection(db_session: Session, test_user: User):
    """Create a test collection."""
    collection = Collection(
        id=str(uuid4()),
        name="Test Collection",
        description="A test collection",
        grade_level="5",
        subject="English",
        created_by=test_user.id
    )
    db_session.add(collection)
    db_session.commit()
    db_session.refresh(collection)
    return collection

@pytest.fixture
def test_learning_set(db_session: Session, test_user: User, test_collection: Collection):
    """Create a test learning set."""
    learning_set = LearningSet(
        id=str(uuid4()),
        name="Test Learning Set",
        description="A test learning set",
        collection_id=test_collection.id,
        created_by=test_user.id,
        grade_level="5",
        subject="English"
    )
    db_session.add(learning_set)
    
    # Create owner permission
    permission = Permission(
        id=str(uuid4()),
        user_id=test_user.id,
        learning_set_id=learning_set.id,
        role=PermissionRole.OWNER,
        granted_by=test_user.id
    )
    db_session.add(permission)
    
    db_session.commit()
    db_session.refresh(learning_set)
    return learning_set

class TestCollectionAPI:
    """Test collection CRUD operations."""
    
    def test_create_collection(self, client, auth_headers):
        """Test creating a new collection."""
        collection_data = {
            "name": "New Collection",
            "description": "A new collection",
            "grade_level": "3",
            "subject": "Spanish"
        }
        
        response = client.post("/content/collections", json=collection_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == collection_data["name"]
        assert data["description"] == collection_data["description"]
        assert data["grade_level"] == collection_data["grade_level"]
        assert data["subject"] == collection_data["subject"]
        assert "id" in data
        assert "created_at" in data

    def test_create_collection_unauthorized(self, client):
        """Test creating collection without authentication."""
        collection_data = {"name": "Unauthorized Collection"}
        
        response = client.post("/content/collections", json=collection_data)
        assert response.status_code == 403

    def test_get_collections(self, client, auth_headers, test_collection):
        """Test retrieving collections."""
        response = client.get("/content/collections", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Find our test collection
        collection = next((c for c in data if c["id"] == test_collection.id), None)
        assert collection is not None
        assert collection["name"] == test_collection.name

    def test_get_collection_by_id(self, client, auth_headers, test_collection):
        """Test retrieving a specific collection."""
        response = client.get(f"/content/collections/{test_collection.id}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == test_collection.id
        assert data["name"] == test_collection.name

    def test_get_collection_not_found(self, client, auth_headers):
        """Test retrieving non-existent collection."""
        fake_id = str(uuid4())
        response = client.get(f"/content/collections/{fake_id}", headers=auth_headers)
        assert response.status_code == 404

    def test_update_collection(self, client, auth_headers, test_collection):
        """Test updating a collection."""
        update_data = {
            "name": "Updated Collection Name",
            "description": "Updated description"
        }
        
        response = client.put(f"/content/collections/{test_collection.id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["description"] == update_data["description"]

    def test_delete_collection(self, client, auth_headers, test_collection):
        """Test deleting a collection."""
        response = client.delete(f"/content/collections/{test_collection.id}", headers=auth_headers)
        assert response.status_code == 200
        
        # Verify collection is deleted
        response = client.get(f"/content/collections/{test_collection.id}", headers=auth_headers)
        assert response.status_code == 404

    def test_search_collections(self, client, auth_headers, test_collection):
        """Test searching collections."""
        response = client.get("/content/collections?search=Test", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 1
        assert any(c["id"] == test_collection.id for c in data)

    def test_filter_collections_by_grade(self, client, auth_headers, test_collection):
        """Test filtering collections by grade level."""
        response = client.get(f"/content/collections?grade_level={test_collection.grade_level}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert all(c["grade_level"] == test_collection.grade_level for c in data if c["grade_level"])

class TestLearningSetAPI:
    """Test learning set CRUD operations."""
    
    def test_create_learning_set(self, client, auth_headers, test_collection):
        """Test creating a new learning set."""
        learning_set_data = {
            "name": "New Learning Set",
            "description": "A new learning set",
            "collection_id": test_collection.id,
            "grade_level": "5",
            "subject": "English"
        }
        
        response = client.post("/content/learning-sets", json=learning_set_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == learning_set_data["name"]
        assert data["collection_id"] == learning_set_data["collection_id"]

    def test_get_learning_sets(self, client, auth_headers, test_learning_set):
        """Test retrieving learning sets."""
        response = client.get("/content/learning-sets", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_get_learning_set_by_id(self, client, auth_headers, test_learning_set):
        """Test retrieving a specific learning set."""
        response = client.get(f"/content/learning-sets/{test_learning_set.id}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == test_learning_set.id
        assert data["name"] == test_learning_set.name

    def test_update_learning_set(self, client, auth_headers, test_learning_set):
        """Test updating a learning set."""
        update_data = {
            "name": "Updated Learning Set",
            "description": "Updated description"
        }
        
        response = client.put(f"/content/learning-sets/{test_learning_set.id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == update_data["name"]

    def test_delete_learning_set(self, client, auth_headers, test_learning_set):
        """Test deleting a learning set."""
        response = client.delete(f"/content/learning-sets/{test_learning_set.id}", headers=auth_headers)
        assert response.status_code == 200

    def test_filter_learning_sets_by_collection(self, client, auth_headers, test_learning_set, test_collection):
        """Test filtering learning sets by collection."""
        response = client.get(f"/content/learning-sets?collection_id={test_collection.id}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert all(ls["collection_id"] == test_collection.id for ls in data)

class TestVocabularyAPI:
    """Test vocabulary item CRUD operations."""
    
    def test_create_vocabulary(self, client, auth_headers, test_learning_set):
        """Test creating a vocabulary item."""
        vocab_data = {
            "word": "hello",
            "definition": "a greeting",
            "example_sentence": "Hello, how are you?",
            "part_of_speech": "interjection",
            "difficulty_level": "beginner",
            "learning_set_id": test_learning_set.id
        }
        
        response = client.post("/content/vocabulary", json=vocab_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["word"] == vocab_data["word"]
        assert data["definition"] == vocab_data["definition"]

    def test_get_vocabulary(self, client, db_session: Session, auth_headers, test_learning_set):
        """Test retrieving a vocabulary item."""
        # Create vocabulary item
        vocab = VocabularyItem(
            id=str(uuid4()),
            word="test",
            definition="a test word",
            learning_set_id=test_learning_set.id
        )
        db_session.add(vocab)
        db_session.commit()
        
        response = client.get(f"/content/vocabulary/{vocab.id}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["word"] == vocab.word

    def test_update_vocabulary(self, client, db_session: Session, auth_headers, test_learning_set):
        """Test updating a vocabulary item."""
        # Create vocabulary item
        vocab = VocabularyItem(
            id=str(uuid4()),
            word="original",
            definition="original definition",
            learning_set_id=test_learning_set.id
        )
        db_session.add(vocab)
        db_session.commit()
        
        update_data = {
            "word": "updated",
            "definition": "updated definition"
        }
        
        response = client.put(f"/content/vocabulary/{vocab.id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["word"] == update_data["word"]

    def test_delete_vocabulary(self, client, db_session: Session, auth_headers, test_learning_set):
        """Test deleting a vocabulary item."""
        # Create vocabulary item
        vocab = VocabularyItem(
            id=str(uuid4()),
            word="delete_me",
            definition="to be deleted",
            learning_set_id=test_learning_set.id
        )
        db_session.add(vocab)
        db_session.commit()
        
        response = client.delete(f"/content/vocabulary/{vocab.id}", headers=auth_headers)
        assert response.status_code == 200

class TestGrammarAPI:
    """Test grammar topic CRUD operations."""
    
    def test_create_grammar(self, client, auth_headers, test_learning_set):
        """Test creating a grammar topic."""
        grammar_data = {
            "name": "Present Tense",
            "description": "Basic present tense usage",
            "rule_explanation": "Use present tense for current actions",
            "examples": ["I walk", "She runs", "They play"],
            "difficulty": "BEGINNER",
            "learning_set_id": test_learning_set.id
        }
        
        response = client.post("/content/grammar", json=grammar_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == grammar_data["name"]
        assert data["difficulty"] == grammar_data["difficulty"]

    def test_get_grammar(self, client, db_session: Session, auth_headers, test_learning_set):
        """Test retrieving a grammar topic."""
        # Create grammar topic
        grammar = GrammarTopic(
            id=str(uuid4()),
            name="Test Grammar",
            description="A test grammar topic",
            difficulty=GrammarDifficulty.BEGINNER,
            learning_set_id=test_learning_set.id
        )
        db_session.add(grammar)
        db_session.commit()
        
        response = client.get(f"/content/grammar/{grammar.id}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == grammar.name

    def test_update_grammar(self, client, db_session: Session, auth_headers, test_learning_set):
        """Test updating a grammar topic."""
        # Create grammar topic
        grammar = GrammarTopic(
            id=str(uuid4()),
            name="Original Grammar",
            description="Original description",
            difficulty=GrammarDifficulty.BEGINNER,
            learning_set_id=test_learning_set.id
        )
        db_session.add(grammar)
        db_session.commit()
        
        update_data = {
            "name": "Updated Grammar",
            "description": "Updated description",
            "difficulty": "INTERMEDIATE"
        }
        
        response = client.put(f"/content/grammar/{grammar.id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["difficulty"] == update_data["difficulty"]

    def test_delete_grammar(self, client, db_session: Session, auth_headers, test_learning_set):
        """Test deleting a grammar topic."""
        # Create grammar topic
        grammar = GrammarTopic(
            id=str(uuid4()),
            name="Delete Me",
            description="To be deleted",
            difficulty=GrammarDifficulty.BEGINNER,
            learning_set_id=test_learning_set.id
        )
        db_session.add(grammar)
        db_session.commit()
        
        response = client.delete(f"/content/grammar/{grammar.id}", headers=auth_headers)
        assert response.status_code == 200

class TestPermissionAPI:
    """Test permission management operations."""
    
    def test_grant_permission(self, client, db_session: Session, auth_headers, test_learning_set):
        """Test granting permission to a learning set."""
        # Create another user
        other_user = User(
            id=str(uuid4()),
            username="otheruser",
            email="other@example.com",
            hashed_password="hashed_password",
            full_name="Other User",
            role=UserRole.STUDENT
        )
        db_session.add(other_user)
        db_session.commit()
        
        # Store user_id before session issues
        other_user_id = other_user.id
        
        permission_data = {
            "user_id": other_user_id,
            "role": "EDITOR"
        }
        
        response = client.post(
            f"/content/learning-sets/{test_learning_set.id}/permissions",
            json=permission_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["user_id"] == other_user_id
        assert data["role"] == "EDITOR"

    def test_get_permissions(self, client, auth_headers, test_learning_set):
        """Test retrieving permissions for a learning set."""
        response = client.get(
            f"/content/learning-sets/{test_learning_set.id}/permissions",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # Should have at least the owner permission

    def test_revoke_permission(self, client, db_session: Session, auth_headers, test_learning_set, test_user):
        """Test revoking a permission."""
        # Create another user and permission
        other_user = User(
            id=str(uuid4()),
            username="revokeuser",
            email="revoke@example.com",
            hashed_password="hashed_password",
            full_name="Revoke User",
            role=UserRole.STUDENT
        )
        db_session.add(other_user)
        
        permission = Permission(
            id=str(uuid4()),
            user_id=other_user.id,
            learning_set_id=test_learning_set.id,
            role=PermissionRole.VIEWER,
            granted_by=test_user.id
        )
        db_session.add(permission)
        db_session.commit()
        
        response = client.delete(f"/content/permissions/{permission.id}", headers=auth_headers)
        assert response.status_code == 200

class TestContentValidation:
    """Test content validation and error handling."""
    
    def test_create_collection_missing_name(self, client, auth_headers):
        """Test creating collection without required name."""
        collection_data = {"description": "Missing name"}
        
        response = client.post("/content/collections", json=collection_data, headers=auth_headers)
        assert response.status_code == 422

    def test_create_learning_set_invalid_collection(self, client, auth_headers):
        """Test creating learning set with invalid collection ID."""
        learning_set_data = {
            "name": "Test Set",
            "collection_id": str(uuid4())  # Non-existent collection
        }
        
        response = client.post("/content/learning-sets", json=learning_set_data, headers=auth_headers)
        assert response.status_code == 404

    def test_create_vocabulary_missing_fields(self, client, auth_headers, test_learning_set):
        """Test creating vocabulary with missing required fields."""
        vocab_data = {
            "word": "incomplete",
            # Missing definition
            "learning_set_id": test_learning_set.id
        }
        
        response = client.post("/content/vocabulary", json=vocab_data, headers=auth_headers)
        assert response.status_code == 422

    def test_access_denied_other_user_content(self, client, db_session: Session, test_collection):
        """Test access denied when trying to access another user's content."""
        # Create another user
        other_user = User(
            id=str(uuid4()),
            username="otheruser2",
            email="other2@example.com",
            hashed_password="hashed_password",
            full_name="Other User 2",
            role=UserRole.STUDENT
        )
        db_session.add(other_user)
        db_session.commit()
        
        # Create token for other user
        token = create_access_token(data={"sub": other_user.username})
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try to access the test collection
        response = client.get(f"/content/collections/{test_collection.id}", headers=headers)
        assert response.status_code == 403