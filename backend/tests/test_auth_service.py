"""
Tests for authentication service functionality.
"""

import pytest
from datetime import datetime
from unittest.mock import Mock
from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.database_models import User, UserRole
from models.pydantic_models import UserCreate, UserUpdate
from services.auth_service import AuthService
from auth.security import get_password_hash, verify_password

class TestAuthService:
    """Test cases for AuthService class."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.mock_db = Mock(spec=Session)
        self.auth_service = AuthService(self.mock_db)
    
    def test_create_user_success(self):
        """Test successful user creation."""
        # Arrange
        user_data = UserCreate(
            username="testuser",
            email="test@example.com",
            password="testpassword123",
            full_name="Test User",
            role=UserRole.STUDENT,
            grade_level="5th Grade"
        )
        
        # Mock database queries
        self.mock_db.query.return_value.filter.return_value.first.return_value = None
        self.mock_db.add = Mock()
        self.mock_db.commit = Mock()
        
        # Mock the refresh to set database-generated fields
        def mock_refresh(db_user):
            db_user.created_at = datetime(2023, 1, 1, 0, 0, 0)
            db_user.updated_at = None
            db_user.is_active = True
        self.mock_db.refresh = mock_refresh
        
        # Act
        result = self.auth_service.create_user(user_data)
        
        # Assert
        assert result.username == user_data.username
        assert result.email == user_data.email
        assert result.full_name == user_data.full_name
        assert result.role == user_data.role
        assert result.grade_level == user_data.grade_level
        assert result.is_active == True
        self.mock_db.add.assert_called_once()
        self.mock_db.commit.assert_called_once()
    
    def test_create_user_duplicate_username(self):
        """Test user creation with duplicate username."""
        # Arrange
        user_data = UserCreate(
            username="existinguser",
            email="test@example.com",
            password="testpassword123",
            full_name="Test User",
            role=UserRole.STUDENT
        )
        
        existing_user = Mock()
        existing_user.username = "existinguser"
        existing_user.email = "other@example.com"
        
        self.mock_db.query.return_value.filter.return_value.first.return_value = existing_user
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            self.auth_service.create_user(user_data)
        
        assert exc_info.value.status_code == 400
        assert "Username already registered" in str(exc_info.value.detail)
    
    def test_create_user_duplicate_email(self):
        """Test user creation with duplicate email."""
        # Arrange
        user_data = UserCreate(
            username="testuser",
            email="existing@example.com",
            password="testpassword123",
            full_name="Test User",
            role=UserRole.STUDENT
        )
        
        existing_user = Mock()
        existing_user.username = "otheruser"
        existing_user.email = "existing@example.com"
        
        self.mock_db.query.return_value.filter.return_value.first.return_value = existing_user
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            self.auth_service.create_user(user_data)
        
        assert exc_info.value.status_code == 400
        assert "Email already registered" in str(exc_info.value.detail)
    
    def test_authenticate_user_success(self):
        """Test successful user authentication."""
        # Arrange
        username = "testuser"
        password = "testpassword123"
        hashed_password = get_password_hash(password)
        
        mock_user = Mock()
        mock_user.username = username
        mock_user.hashed_password = hashed_password
        
        self.mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        # Act
        result = self.auth_service.authenticate_user(username, password)
        
        # Assert
        assert result == mock_user
    
    def test_authenticate_user_wrong_password(self):
        """Test authentication with wrong password."""
        # Arrange
        username = "testuser"
        password = "wrongpassword"
        hashed_password = get_password_hash("correctpassword")
        
        mock_user = Mock()
        mock_user.username = username
        mock_user.hashed_password = hashed_password
        
        self.mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        # Act
        result = self.auth_service.authenticate_user(username, password)
        
        # Assert
        assert result is None
    
    def test_authenticate_user_not_found(self):
        """Test authentication with non-existent user."""
        # Arrange
        username = "nonexistent"
        password = "password"
        
        self.mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        result = self.auth_service.authenticate_user(username, password)
        
        # Assert
        assert result is None
    
    def test_authenticate_user_with_email(self):
        """Test authentication using email instead of username."""
        # Arrange
        email = "test@example.com"
        password = "testpassword123"
        hashed_password = get_password_hash(password)
        
        mock_user = Mock()
        mock_user.email = email
        mock_user.hashed_password = hashed_password
        
        self.mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        # Act
        result = self.auth_service.authenticate_user(email, password)
        
        # Assert
        assert result == mock_user
    
    def test_update_user_profile_success(self):
        """Test successful user profile update."""
        # Arrange
        user_id = "user123"
        update_data = UserUpdate(
            full_name="Updated Name",
            grade_level="6th Grade"
        )
        
        mock_user = Mock()
        mock_user.id = user_id
        mock_user.username = "testuser"
        mock_user.email = "test@example.com"
        mock_user.full_name = "Old Name"
        mock_user.grade_level = "5th Grade"
        mock_user.role = UserRole.STUDENT
        mock_user.curriculum_type = None
        mock_user.is_active = True
        mock_user.created_at = datetime(2023, 1, 1, 0, 0, 0)
        mock_user.updated_at = datetime(2023, 1, 2, 0, 0, 0)
        
        self.mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        self.mock_db.commit = Mock()
        
        # Mock refresh to ensure user has all required attributes
        def mock_refresh(user):
            user.updated_at = datetime(2023, 1, 2, 0, 0, 0)
        self.mock_db.refresh = mock_refresh
        
        # Act
        result = self.auth_service.update_user_profile(user_id, update_data)
        
        # Assert
        assert mock_user.full_name == "Updated Name"
        assert mock_user.grade_level == "6th Grade"
        self.mock_db.commit.assert_called_once()
    
    def test_update_user_profile_not_found(self):
        """Test profile update for non-existent user."""
        # Arrange
        user_id = "nonexistent"
        update_data = UserUpdate(full_name="Updated Name")
        
        self.mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            self.auth_service.update_user_profile(user_id, update_data)
        
        assert exc_info.value.status_code == 404
        assert "User not found" in str(exc_info.value.detail)
    
    def test_deactivate_user_success(self):
        """Test successful user deactivation."""
        # Arrange
        user_id = "user123"
        
        mock_user = Mock()
        mock_user.id = user_id
        mock_user.is_active = True
        
        self.mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        self.mock_db.commit = Mock()
        
        # Act
        result = self.auth_service.deactivate_user(user_id)
        
        # Assert
        assert result is True
        assert mock_user.is_active is False
        self.mock_db.commit.assert_called_once()
    
    def test_deactivate_user_not_found(self):
        """Test deactivation of non-existent user."""
        # Arrange
        user_id = "nonexistent"
        
        self.mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        result = self.auth_service.deactivate_user(user_id)
        
        # Assert
        assert result is False
    
    def test_create_login_token(self):
        """Test login token creation."""
        # Arrange
        mock_user = Mock()
        mock_user.username = "testuser"
        mock_user.id = "user123"
        mock_user.email = "test@example.com"
        mock_user.full_name = "Test User"
        mock_user.role = UserRole.STUDENT
        mock_user.grade_level = "10th Grade"
        mock_user.curriculum_type = None
        mock_user.is_active = True
        mock_user.created_at = datetime(2023, 1, 1, 0, 0, 0)
        mock_user.updated_at = None
        
        # Act
        result = self.auth_service.create_login_token(mock_user)
        
        # Assert
        assert "access_token" in result
        assert result["token_type"] == "bearer"
        assert "user" in result
        assert isinstance(result["access_token"], str)
        assert len(result["access_token"]) > 0