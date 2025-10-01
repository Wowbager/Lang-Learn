"""
SQLAlchemy ORM models for all entities with proper relationships.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, Table, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.connection import Base
import enum
from datetime import datetime
from typing import List

# Association tables for many-to-many relationships
class_students = Table(
    'class_students',
    Base.metadata,
    Column('class_id', String, ForeignKey('classes.id'), primary_key=True),
    Column('user_id', String, ForeignKey('users.id'), primary_key=True)
)

class_shared_content = Table(
    'class_shared_content',
    Base.metadata,
    Column('class_id', String, ForeignKey('classes.id'), primary_key=True),
    Column('learning_set_id', String, ForeignKey('learning_sets.id'), primary_key=True)
)

learning_set_collections = Table(
    'learning_set_collections',
    Base.metadata,
    Column('learning_set_id', String, ForeignKey('learning_sets.id'), primary_key=True),
    Column('collection_id', String, ForeignKey('collections.id'), primary_key=True)
)

# Enums
class UserRole(enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    PARENT = "parent"

class PermissionRole(enum.Enum):
    VIEWER = "VIEWER"
    EDITOR = "EDITOR"
    OWNER = "OWNER"

class SenderType(enum.Enum):
    USER = "user"
    AI = "ai"

class GrammarDifficulty(enum.Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"

# Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.STUDENT)
    grade_level = Column(String(20))
    curriculum_type = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    created_collections = relationship("Collection", back_populates="creator")
    created_learning_sets = relationship("LearningSet", back_populates="creator")
    chat_sessions = relationship("ChatSession", back_populates="user")
    taught_classes = relationship("Class", back_populates="teacher")
    enrolled_classes = relationship("Class", secondary=class_students, back_populates="students")
    permissions = relationship("Permission", back_populates="user", foreign_keys="Permission.user_id")
    granted_permissions = relationship("Permission", back_populates="granter", foreign_keys="Permission.granted_by")

class Collection(Base):
    __tablename__ = "collections"
    
    id = Column(String, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    grade_level = Column(String(20))
    subject = Column(String(50))
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="created_collections")
    learning_sets = relationship("LearningSet", secondary=learning_set_collections, back_populates="collections")

class LearningSet(Base):
    __tablename__ = "learning_sets"
    
    id = Column(String, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    grade_level = Column(String(20))
    subject = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    collections = relationship("Collection", secondary=learning_set_collections, back_populates="learning_sets")
    creator = relationship("User", back_populates="created_learning_sets")
    vocabulary_items = relationship("VocabularyItem", back_populates="learning_set")
    grammar_topics = relationship("GrammarTopic", back_populates="learning_set")
    chat_sessions = relationship("ChatSession", back_populates="learning_set")
    permissions = relationship("Permission", back_populates="learning_set")
    shared_classes = relationship("Class", secondary=class_shared_content, back_populates="shared_content")

class VocabularyItem(Base):
    __tablename__ = "vocabulary_items"
    
    id = Column(String, primary_key=True)
    word = Column(String(100), nullable=False)
    definition = Column(Text, nullable=False)
    example_sentence = Column(Text)
    part_of_speech = Column(String(20))
    difficulty_level = Column(String(20))
    learning_set_id = Column(String, ForeignKey("learning_sets.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    learning_set = relationship("LearningSet", back_populates="vocabulary_items")

class GrammarTopic(Base):
    __tablename__ = "grammar_topics"
    
    id = Column(String, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    rule_explanation = Column(Text)
    examples = Column(Text)  # JSON string of example sentences
    difficulty = Column(SQLEnum(GrammarDifficulty), nullable=False)
    learning_set_id = Column(String, ForeignKey("learning_sets.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    learning_set = relationship("LearningSet", back_populates="grammar_topics")

class Class(Base):
    __tablename__ = "classes"
    
    id = Column(String, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    teacher_id = Column(String, ForeignKey("users.id"), nullable=False)
    invite_code = Column(String(20), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    teacher = relationship("User", back_populates="taught_classes")
    students = relationship("User", secondary=class_students, back_populates="enrolled_classes")
    shared_content = relationship("LearningSet", secondary=class_shared_content, back_populates="shared_classes")

class Permission(Base):
    __tablename__ = "permissions"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    learning_set_id = Column(String, ForeignKey("learning_sets.id"), nullable=False)
    role = Column(SQLEnum(PermissionRole), nullable=False)
    granted_by = Column(String, ForeignKey("users.id"), nullable=False)
    granted_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="permissions", foreign_keys=[user_id])
    learning_set = relationship("LearningSet", back_populates="permissions")
    granter = relationship("User", back_populates="granted_permissions", foreign_keys=[granted_by])

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    learning_set_id = Column(String, ForeignKey("learning_sets.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True))
    total_messages = Column(Integer, default=0)
    vocabulary_practiced = Column(Text)  # JSON string of vocabulary words used
    grammar_corrections = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    learning_set = relationship("LearningSet", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False)
    content = Column(Text, nullable=False)
    sender = Column(SQLEnum(SenderType), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    corrections = Column(Text)  # JSON string of grammar corrections
    vocabulary_used = Column(Text)  # JSON string of vocabulary words identified
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")