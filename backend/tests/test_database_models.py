"""
Unit tests for SQLAlchemy database models.
"""

import pytest
import uuid
from datetime import datetime
from models.database_models import (
    User, Collection, LearningSet, VocabularyItem, GrammarTopic,
    Class, Permission, ChatSession, ChatMessage,
    UserRole, PermissionRole, SenderType, GrammarDifficulty
)

class TestUserModel:
    """Test User model validation and functionality."""
    
    def test_create_user(self, db_session):
        """Test creating a user with valid data."""
        user = User(
            id=str(uuid.uuid4()),
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
            full_name="Test User",
            role=UserRole.STUDENT
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.id is not None
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.role == UserRole.STUDENT
        assert user.is_active is True
        assert user.created_at is not None
    
    def test_user_relationships(self, db_session, sample_user, sample_collection):
        """Test user relationships work correctly."""
        # Test created collections relationship
        assert len(sample_user.created_collections) == 1
        assert sample_user.created_collections[0].id == sample_collection.id

class TestCollectionModel:
    """Test Collection model validation and functionality."""
    
    def test_create_collection(self, db_session, sample_user):
        """Test creating a collection with valid data."""
        collection = Collection(
            id=str(uuid.uuid4()),
            name="Test Collection",
            description="A test collection",
            grade_level="10",
            subject="Math",
            created_by=sample_user.id
        )
        db_session.add(collection)
        db_session.commit()
        
        assert collection.id is not None
        assert collection.name == "Test Collection"
        assert collection.created_by == sample_user.id
        assert collection.created_at is not None
    
    def test_collection_creator_relationship(self, db_session, sample_collection, sample_user):
        """Test collection creator relationship."""
        assert sample_collection.creator.id == sample_user.id
        assert sample_collection.creator.username == sample_user.username

class TestLearningSetModel:
    """Test LearningSet model validation and functionality."""
    
    def test_create_learning_set(self, db_session, sample_collection, sample_user):
        """Test creating a learning set with valid data."""
        learning_set = LearningSet(
            id=str(uuid.uuid4()),
            name="Test Learning Set",
            description="A test learning set",
            collection_id=sample_collection.id,
            created_by=sample_user.id,
            grade_level="10",
            subject="English"
        )
        db_session.add(learning_set)
        db_session.commit()
        
        assert learning_set.id is not None
        assert learning_set.name == "Test Learning Set"
        assert learning_set.collection_id == sample_collection.id
        assert learning_set.created_by == sample_user.id
    
    def test_learning_set_relationships(self, db_session, sample_learning_set, sample_collection, sample_user):
        """Test learning set relationships."""
        assert sample_learning_set.collection.id == sample_collection.id
        assert sample_learning_set.creator.id == sample_user.id

class TestVocabularyItemModel:
    """Test VocabularyItem model validation and functionality."""
    
    def test_create_vocabulary_item(self, db_session, sample_learning_set):
        """Test creating a vocabulary item with valid data."""
        vocab_item = VocabularyItem(
            id=str(uuid.uuid4()),
            word="hello",
            definition="A greeting",
            example_sentence="Hello, how are you?",
            part_of_speech="interjection",
            difficulty_level="beginner",
            learning_set_id=sample_learning_set.id
        )
        db_session.add(vocab_item)
        db_session.commit()
        
        assert vocab_item.id is not None
        assert vocab_item.word == "hello"
        assert vocab_item.definition == "A greeting"
        assert vocab_item.learning_set_id == sample_learning_set.id
    
    def test_vocabulary_item_relationship(self, db_session, sample_learning_set):
        """Test vocabulary item learning set relationship."""
        vocab_item = VocabularyItem(
            id=str(uuid.uuid4()),
            word="test",
            definition="A test word",
            learning_set_id=sample_learning_set.id
        )
        db_session.add(vocab_item)
        db_session.commit()
        
        assert vocab_item.learning_set.id == sample_learning_set.id
        assert len(sample_learning_set.vocabulary_items) == 1

class TestGrammarTopicModel:
    """Test GrammarTopic model validation and functionality."""
    
    def test_create_grammar_topic(self, db_session, sample_learning_set):
        """Test creating a grammar topic with valid data."""
        grammar_topic = GrammarTopic(
            id=str(uuid.uuid4()),
            name="Present Tense",
            description="Basic present tense usage",
            rule_explanation="Use present tense for current actions",
            examples='["I walk", "She runs", "They play"]',
            difficulty=GrammarDifficulty.BEGINNER,
            learning_set_id=sample_learning_set.id
        )
        db_session.add(grammar_topic)
        db_session.commit()
        
        assert grammar_topic.id is not None
        assert grammar_topic.name == "Present Tense"
        assert grammar_topic.difficulty == GrammarDifficulty.BEGINNER
        assert grammar_topic.learning_set_id == sample_learning_set.id

class TestClassModel:
    """Test Class model validation and functionality."""
    
    def test_create_class(self, db_session, sample_teacher):
        """Test creating a class with valid data."""
        class_obj = Class(
            id=str(uuid.uuid4()),
            name="English 101",
            description="Basic English class",
            teacher_id=sample_teacher.id,
            invite_code="ABC123"
        )
        db_session.add(class_obj)
        db_session.commit()
        
        assert class_obj.id is not None
        assert class_obj.name == "English 101"
        assert class_obj.teacher_id == sample_teacher.id
        assert class_obj.invite_code == "ABC123"
        assert class_obj.is_active is True
    
    def test_class_teacher_relationship(self, db_session, sample_teacher):
        """Test class teacher relationship."""
        class_obj = Class(
            id=str(uuid.uuid4()),
            name="Math 101",
            teacher_id=sample_teacher.id,
            invite_code="XYZ789"
        )
        db_session.add(class_obj)
        db_session.commit()
        
        assert class_obj.teacher.id == sample_teacher.id
        assert len(sample_teacher.taught_classes) == 1

class TestPermissionModel:
    """Test Permission model validation and functionality."""
    
    def test_create_permission(self, db_session, sample_user, sample_learning_set, sample_teacher):
        """Test creating a permission with valid data."""
        permission = Permission(
            id=str(uuid.uuid4()),
            user_id=sample_user.id,
            learning_set_id=sample_learning_set.id,
            role=PermissionRole.VIEWER,
            granted_by=sample_teacher.id
        )
        db_session.add(permission)
        db_session.commit()
        
        assert permission.id is not None
        assert permission.user_id == sample_user.id
        assert permission.learning_set_id == sample_learning_set.id
        assert permission.role == PermissionRole.VIEWER
        assert permission.granted_by == sample_teacher.id

class TestChatSessionModel:
    """Test ChatSession model validation and functionality."""
    
    def test_create_chat_session(self, db_session, sample_user, sample_learning_set):
        """Test creating a chat session with valid data."""
        chat_session = ChatSession(
            id=str(uuid.uuid4()),
            user_id=sample_user.id,
            learning_set_id=sample_learning_set.id,
            total_messages=0,
            vocabulary_practiced='["hello", "goodbye"]',
            grammar_corrections=2
        )
        db_session.add(chat_session)
        db_session.commit()
        
        assert chat_session.id is not None
        assert chat_session.user_id == sample_user.id
        assert chat_session.learning_set_id == sample_learning_set.id
        assert chat_session.total_messages == 0
        assert chat_session.grammar_corrections == 2
    
    def test_chat_session_relationships(self, db_session, sample_user, sample_learning_set):
        """Test chat session relationships."""
        chat_session = ChatSession(
            id=str(uuid.uuid4()),
            user_id=sample_user.id,
            learning_set_id=sample_learning_set.id
        )
        db_session.add(chat_session)
        db_session.commit()
        
        assert chat_session.user.id == sample_user.id
        assert chat_session.learning_set.id == sample_learning_set.id

class TestChatMessageModel:
    """Test ChatMessage model validation and functionality."""
    
    def test_create_chat_message(self, db_session, sample_user, sample_learning_set):
        """Test creating a chat message with valid data."""
        # First create a chat session
        chat_session = ChatSession(
            id=str(uuid.uuid4()),
            user_id=sample_user.id,
            learning_set_id=sample_learning_set.id
        )
        db_session.add(chat_session)
        db_session.commit()
        
        # Then create a message
        message = ChatMessage(
            id=str(uuid.uuid4()),
            session_id=chat_session.id,
            content="Hello, how are you?",
            sender=SenderType.USER,
            corrections='[{"original": "how are you", "corrected": "how are you", "explanation": "correct"}]',
            vocabulary_used='["hello"]'
        )
        db_session.add(message)
        db_session.commit()
        
        assert message.id is not None
        assert message.session_id == chat_session.id
        assert message.content == "Hello, how are you?"
        assert message.sender == SenderType.USER
        assert message.timestamp is not None
    
    def test_chat_message_session_relationship(self, db_session, sample_user, sample_learning_set):
        """Test chat message session relationship."""
        chat_session = ChatSession(
            id=str(uuid.uuid4()),
            user_id=sample_user.id,
            learning_set_id=sample_learning_set.id
        )
        db_session.add(chat_session)
        db_session.commit()
        
        message = ChatMessage(
            id=str(uuid.uuid4()),
            session_id=chat_session.id,
            content="Test message",
            sender=SenderType.AI
        )
        db_session.add(message)
        db_session.commit()
        
        assert message.session.id == chat_session.id
        assert len(chat_session.messages) == 1