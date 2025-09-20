"""
Unit tests for Pydantic model validation.
"""

import pytest
from pydantic import ValidationError
from models.pydantic_models import (
    UserCreate, UserUpdate, UserResponse,
    VocabularyItemCreate, VocabularyItemUpdate,
    GrammarTopicCreate, GrammarTopicUpdate,
    CollectionCreate, CollectionUpdate,
    LearningSetCreate, LearningSetUpdate,
    ClassCreate, ClassUpdate,
    PermissionCreate,
    ChatMessageCreate, ChatSessionCreate,
    UserRole, PermissionRole, SenderType, GrammarDifficulty
)
from datetime import datetime

class TestUserModels:
    """Test User Pydantic models validation."""
    
    def test_user_create_valid(self):
        """Test creating a user with valid data."""
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "password": "password123",
            "role": UserRole.STUDENT,
            "grade_level": "10",
            "curriculum_type": "Standard"
        }
        user = UserCreate(**user_data)
        
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.full_name == "Test User"
        assert user.password == "password123"
        assert user.role == UserRole.STUDENT
    
    def test_user_create_invalid_email(self):
        """Test user creation with invalid email."""
        user_data = {
            "username": "testuser",
            "email": "invalid-email",
            "full_name": "Test User",
            "password": "password123"
        }
        with pytest.raises(ValidationError):
            UserCreate(**user_data)
    
    def test_user_create_short_username(self):
        """Test user creation with username too short."""
        user_data = {
            "username": "ab",  # Too short
            "email": "test@example.com",
            "full_name": "Test User",
            "password": "password123"
        }
        with pytest.raises(ValidationError):
            UserCreate(**user_data)
    
    def test_user_create_short_password(self):
        """Test user creation with password too short."""
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "password": "short"  # Too short
        }
        with pytest.raises(ValidationError):
            UserCreate(**user_data)
    
    def test_user_update_partial(self):
        """Test user update with partial data."""
        update_data = {
            "username": "newusername",
            "grade_level": "11"
        }
        user_update = UserUpdate(**update_data)
        
        assert user_update.username == "newusername"
        assert user_update.grade_level == "11"
        assert user_update.email is None

class TestVocabularyItemModels:
    """Test VocabularyItem Pydantic models validation."""
    
    def test_vocabulary_item_create_valid(self):
        """Test creating a vocabulary item with valid data."""
        vocab_data = {
            "word": "hello",
            "definition": "A greeting",
            "example_sentence": "Hello, how are you?",
            "part_of_speech": "interjection",
            "difficulty_level": "beginner",
            "learning_set_id": "test-learning-set-id"
        }
        vocab_item = VocabularyItemCreate(**vocab_data)
        
        assert vocab_item.word == "hello"
        assert vocab_item.definition == "A greeting"
        assert vocab_item.learning_set_id == "test-learning-set-id"
    
    def test_vocabulary_item_create_empty_word(self):
        """Test vocabulary item creation with empty word."""
        vocab_data = {
            "word": "",  # Empty word
            "definition": "A greeting",
            "learning_set_id": "test-learning-set-id"
        }
        with pytest.raises(ValidationError):
            VocabularyItemCreate(**vocab_data)
    
    def test_vocabulary_item_update_partial(self):
        """Test vocabulary item update with partial data."""
        update_data = {
            "word": "hi",
            "difficulty_level": "intermediate"
        }
        vocab_update = VocabularyItemUpdate(**update_data)
        
        assert vocab_update.word == "hi"
        assert vocab_update.difficulty_level == "intermediate"
        assert vocab_update.definition is None

class TestGrammarTopicModels:
    """Test GrammarTopic Pydantic models validation."""
    
    def test_grammar_topic_create_valid(self):
        """Test creating a grammar topic with valid data."""
        grammar_data = {
            "name": "Present Tense",
            "description": "Basic present tense usage",
            "rule_explanation": "Use present tense for current actions",
            "examples": ["I walk", "She runs", "They play"],
            "difficulty": GrammarDifficulty.BEGINNER,
            "learning_set_id": "test-learning-set-id"
        }
        grammar_topic = GrammarTopicCreate(**grammar_data)
        
        assert grammar_topic.name == "Present Tense"
        assert grammar_topic.difficulty == GrammarDifficulty.BEGINNER
        assert grammar_topic.learning_set_id == "test-learning-set-id"
        assert len(grammar_topic.examples) == 3
    
    def test_grammar_topic_create_invalid_difficulty(self):
        """Test grammar topic creation with invalid difficulty."""
        grammar_data = {
            "name": "Present Tense",
            "description": "Basic present tense usage",
            "difficulty": "invalid_difficulty",  # Invalid enum value
            "learning_set_id": "test-learning-set-id"
        }
        with pytest.raises(ValidationError):
            GrammarTopicCreate(**grammar_data)

class TestCollectionModels:
    """Test Collection Pydantic models validation."""
    
    def test_collection_create_valid(self):
        """Test creating a collection with valid data."""
        collection_data = {
            "name": "Test Collection",
            "description": "A test collection",
            "grade_level": "10",
            "subject": "English"
        }
        collection = CollectionCreate(**collection_data)
        
        assert collection.name == "Test Collection"
        assert collection.description == "A test collection"
        assert collection.grade_level == "10"
        assert collection.subject == "English"
    
    def test_collection_create_minimal(self):
        """Test creating a collection with minimal required data."""
        collection_data = {
            "name": "Minimal Collection"
        }
        collection = CollectionCreate(**collection_data)
        
        assert collection.name == "Minimal Collection"
        assert collection.description is None
        assert collection.grade_level is None
        assert collection.subject is None

class TestLearningSetModels:
    """Test LearningSet Pydantic models validation."""
    
    def test_learning_set_create_valid(self):
        """Test creating a learning set with valid data."""
        learning_set_data = {
            "name": "Test Learning Set",
            "description": "A test learning set",
            "collection_id": "test-collection-id",
            "grade_level": "10",
            "subject": "English"
        }
        learning_set = LearningSetCreate(**learning_set_data)
        
        assert learning_set.name == "Test Learning Set"
        assert learning_set.collection_id == "test-collection-id"
        assert learning_set.grade_level == "10"

class TestClassModels:
    """Test Class Pydantic models validation."""
    
    def test_class_create_valid(self):
        """Test creating a class with valid data."""
        class_data = {
            "name": "English 101",
            "description": "Basic English class"
        }
        class_obj = ClassCreate(**class_data)
        
        assert class_obj.name == "English 101"
        assert class_obj.description == "Basic English class"
    
    def test_class_update_partial(self):
        """Test class update with partial data."""
        update_data = {
            "name": "Advanced English",
            "is_active": False
        }
        class_update = ClassUpdate(**update_data)
        
        assert class_update.name == "Advanced English"
        assert class_update.is_active is False
        assert class_update.description is None

class TestPermissionModels:
    """Test Permission Pydantic models validation."""
    
    def test_permission_create_valid(self):
        """Test creating a permission with valid data."""
        permission_data = {
            "user_id": "test-user-id",
            "learning_set_id": "test-learning-set-id",
            "role": PermissionRole.VIEWER
        }
        permission = PermissionCreate(**permission_data)
        
        assert permission.user_id == "test-user-id"
        assert permission.learning_set_id == "test-learning-set-id"
        assert permission.role == PermissionRole.VIEWER
    
    def test_permission_create_invalid_role(self):
        """Test permission creation with invalid role."""
        permission_data = {
            "user_id": "test-user-id",
            "learning_set_id": "test-learning-set-id",
            "role": "invalid_role"  # Invalid enum value
        }
        with pytest.raises(ValidationError):
            PermissionCreate(**permission_data)

class TestChatModels:
    """Test Chat Pydantic models validation."""
    
    def test_chat_message_create_valid(self):
        """Test creating a chat message with valid data."""
        message_data = {
            "content": "Hello, how are you?",
            "session_id": "test-session-id",
            "sender": SenderType.USER
        }
        message = ChatMessageCreate(**message_data)
        
        assert message.content == "Hello, how are you?"
        assert message.session_id == "test-session-id"
        assert message.sender == SenderType.USER
    
    def test_chat_message_create_empty_content(self):
        """Test chat message creation with empty content."""
        message_data = {
            "content": "",  # Empty content
            "session_id": "test-session-id",
            "sender": SenderType.USER
        }
        with pytest.raises(ValidationError):
            ChatMessageCreate(**message_data)
    
    def test_chat_session_create_valid(self):
        """Test creating a chat session with valid data."""
        session_data = {
            "learning_set_id": "test-learning-set-id"
        }
        session = ChatSessionCreate(**session_data)
        
        assert session.learning_set_id == "test-learning-set-id"