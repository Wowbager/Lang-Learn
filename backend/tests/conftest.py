"""
Test configuration and fixtures.
"""

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from database.connection import Base, get_db
from models.database_models import *
from main import app
from services.image_processing_service import image_processing_service
from unittest.mock import Mock
import uuid


# Enable foreign key support for SQLite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Enable foreign key constraints on SQLite."""
    # Only execute PRAGMA for SQLite databases
    try:
        # Get the engine from the connection record
        engine = connection_record.engine
        if engine.dialect.name == 'sqlite':
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
    except AttributeError:
        # If we can't determine the engine type, skip
        pass

# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def db_engine():
    """Create a database engine and tables for the test session."""
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(db_engine):
    """Create a fresh database session for each test with a transaction."""
    connection = db_engine.connect()
    transaction = connection.begin()
    
    # Use a sessionmaker to create a new session for each test
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()

@pytest.fixture
def sample_user(db_session):
    """Create a sample user for testing."""
    user = User(
        id=str(uuid.uuid4()),
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password_123",
        full_name="Test User",
        role=UserRole.STUDENT,
        grade_level="10",
        curriculum_type="Standard"
    )
    db_session.add(user)
    db_session.flush()
    db_session.refresh(user)
    return user

@pytest.fixture
def sample_teacher(db_session):
    """Create a sample teacher for testing."""
    teacher = User(
        id=str(uuid.uuid4()),
        username="teacher",
        email="teacher@example.com",
        hashed_password="hashed_password_456",
        full_name="Test Teacher",
        role=UserRole.TEACHER,
        grade_level="High School",
        curriculum_type="Advanced"
    )
    db_session.add(teacher)
    db_session.flush()
    db_session.refresh(teacher)
    return teacher

@pytest.fixture
def sample_collection(db_session, sample_user):
    """Create a sample collection for testing."""
    collection = Collection(
        id=str(uuid.uuid4()),
        name="Test Collection",
        description="A test collection",
        grade_level="10",
        subject="English",
        created_by=sample_user.id
    )
    db_session.add(collection)
    db_session.flush()
    db_session.refresh(collection)
    return collection

@pytest.fixture
def sample_learning_set(db_session, sample_collection, sample_user):
    """Create a sample learning set for testing."""
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
    db_session.flush()
    db_session.refresh(learning_set)
    return learning_set

@pytest.fixture(scope="session", autouse=True)
def mock_image_processing_service():
    """Mock the LLM in the global image processing service to avoid API calls during testing."""
    from unittest.mock import AsyncMock
    
    # Store the original LLM
    original_llm = image_processing_service.llm
    
    # Replace with an async mock
    image_processing_service.llm = AsyncMock()
    
    yield
    
    # Restore the original LLM after tests
    image_processing_service.llm = original_llm

@pytest.fixture
def client(db_session):
    """Create a FastAPI test client with database session override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()