"""
Tests for authentication API endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime
from main import app
from models.database_models import User, UserRole
from models.pydantic_models import UserCreate, UserResponse, UserUpdate
from auth.dependencies import get_current_active_user

# Create test client
client = TestClient(app)

class TestAuthAPI:
    """Test cases for authentication API endpoints."""
    
    @patch('api.auth.AuthService')
    def test_register_user_success(self, mock_auth_service_class):
        """Test successful user registration."""
        # Arrange
        mock_auth_service = Mock()
        mock_auth_service_class.return_value = mock_auth_service
        
        # Create a proper UserResponse object
        user_response = UserResponse(
            id="user123",
            username="testuser",
            email="test@example.com",
            full_name="Test User",
            role=UserRole.STUDENT,
            grade_level=None,
            curriculum_type=None,
            is_active=True,
            created_at=datetime(2023, 1, 1, 0, 0, 0),
            updated_at=None
        )
        mock_auth_service.create_user.return_value = user_response
        
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "full_name": "Test User",
            "role": "student"
        }
        
        # Act
        response = client.post("/auth/register", json=user_data)
        
        # Assert
        assert response.status_code == 201
        mock_auth_service.create_user.assert_called_once()
    
    @patch('api.auth.AuthService')
    def test_register_user_duplicate_username(self, mock_auth_service_class):
        """Test registration with duplicate username."""
        # Arrange
        mock_auth_service = Mock()
        mock_auth_service_class.return_value = mock_auth_service
        
        from fastapi import HTTPException
        mock_auth_service.create_user.side_effect = HTTPException(
            status_code=400,
            detail="Username already registered"
        )
        
        user_data = {
            "username": "existinguser",
            "email": "test@example.com",
            "password": "testpassword123",
            "full_name": "Test User",
            "role": "student"
        }
        
        # Act
        response = client.post("/auth/register", json=user_data)
        
        # Assert
        assert response.status_code == 400
        assert "Username already registered" in response.json()["detail"]
    
    @patch('api.auth.AuthService')
    def test_login_user_success(self, mock_auth_service_class):
        """Test successful user login."""
        # Arrange
        mock_auth_service = Mock()
        mock_auth_service_class.return_value = mock_auth_service
        
        mock_user = Mock()
        mock_user.is_active = True
        mock_auth_service.authenticate_user.return_value = mock_user
        
        mock_token_response = {
            "access_token": "fake_token",
            "token_type": "bearer",
            "user": {
                "id": "user123",
                "username": "testuser",
                "email": "test@example.com"
            }
        }
        mock_auth_service.create_login_token.return_value = mock_token_response
        
        login_data = {
            "username": "testuser",
            "password": "testpassword123"
        }
        
        # Act
        response = client.post("/auth/login", data=login_data)
        
        # Assert
        assert response.status_code == 200
        response_data = response.json()
        assert "access_token" in response_data
        assert response_data["token_type"] == "bearer"
        mock_auth_service.authenticate_user.assert_called_once_with("testuser", "testpassword123")
    
    @patch('api.auth.AuthService')
    def test_login_user_invalid_credentials(self, mock_auth_service_class):
        """Test login with invalid credentials."""
        # Arrange
        mock_auth_service = Mock()
        mock_auth_service_class.return_value = mock_auth_service
        
        mock_auth_service.authenticate_user.return_value = None
        
        login_data = {
            "username": "testuser",
            "password": "wrongpassword"
        }
        
        # Act
        response = client.post("/auth/login", data=login_data)
        
        # Assert
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]
    
    @patch('api.auth.AuthService')
    def test_login_user_inactive_account(self, mock_auth_service_class):
        """Test login with inactive user account."""
        # Arrange
        mock_auth_service = Mock()
        mock_auth_service_class.return_value = mock_auth_service
        
        mock_user = Mock()
        mock_user.is_active = False
        mock_auth_service.authenticate_user.return_value = mock_user
        
        login_data = {
            "username": "testuser",
            "password": "testpassword123"
        }
        
        # Act
        response = client.post("/auth/login", data=login_data)
        
        # Assert
        assert response.status_code == 400
        assert "Inactive user account" in response.json()["detail"]
    
    def test_get_current_user_profile(self):
        """Test getting current user profile."""
        # Create a mock user
        mock_user = User(
            id="user123",
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
            full_name="Test User",
            role=UserRole.STUDENT,
            grade_level="10th Grade",
            curriculum_type="Standard",
            is_active=True,
            created_at=datetime(2023, 1, 1, 0, 0, 0),
            updated_at=None
        )
        
        # Override the dependency
        async def mock_get_current_active_user():
            return mock_user
            
        app.dependency_overrides[get_current_active_user] = mock_get_current_active_user
        
        try:
            # Act
            response = client.get("/auth/me", headers={"Authorization": "Bearer fake_token"})
            
            # Assert
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == "user123"
            assert data["username"] == "testuser"
        finally:
            # Clean up override
            app.dependency_overrides.pop(get_current_active_user, None)
    
    @patch('api.auth.AuthService')
    def test_update_current_user_profile(self, mock_auth_service_class):
        """Test updating current user profile."""
        # Create a mock user
        mock_user = User(
            id="user123",
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
            full_name="Test User",
            role=UserRole.STUDENT,
            grade_level="5th Grade",
            curriculum_type=None,
            is_active=True,
            created_at=datetime(2023, 1, 1, 0, 0, 0),
            updated_at=None
        )
        
        # Override the dependency
        async def mock_get_current_active_user():
            return mock_user
            
        app.dependency_overrides[get_current_active_user] = mock_get_current_active_user
        
        # Mock the service
        mock_auth_service = Mock()
        mock_auth_service_class.return_value = mock_auth_service
        
        # Create a proper UserResponse object for the return value
        updated_user_response = UserResponse(
            id="user123",
            username="testuser",
            email="test@example.com",
            full_name="Updated Name",
            role=UserRole.STUDENT,
            grade_level="6th Grade",
            curriculum_type=None,
            is_active=True,
            created_at=datetime(2023, 1, 1, 0, 0, 0),
            updated_at=datetime(2023, 1, 2, 0, 0, 0)
        )
        mock_auth_service.update_user_profile.return_value = updated_user_response
        
        update_data = {
            "full_name": "Updated Name",
            "grade_level": "6th Grade"
        }
        
        try:
            # Act
            response = client.put(
                "/auth/me",
                json=update_data,
                headers={"Authorization": "Bearer fake_token"}
            )
            
            # Assert
            assert response.status_code == 200
            # The service is called with a UserUpdate object, not a dict
            expected_update = UserUpdate(full_name="Updated Name", grade_level="6th Grade")
            mock_auth_service.update_user_profile.assert_called_once_with("user123", expected_update)
        finally:
            # Clean up override
            app.dependency_overrides.pop(get_current_active_user, None)
    
    def test_logout_user(self):
        """Test user logout."""
        # Create a mock user
        mock_user = User(
            id="user123",
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
            full_name="Test User",
            role=UserRole.STUDENT,
            grade_level="10th Grade",
            curriculum_type="Standard",
            is_active=True,
            created_at=datetime(2023, 1, 1, 0, 0, 0),
            updated_at=None
        )
        
        # Override the dependency
        async def mock_get_current_active_user():
            return mock_user
            
        app.dependency_overrides[get_current_active_user] = mock_get_current_active_user
        
        try:
            # Act
            response = client.post("/auth/logout", headers={"Authorization": "Bearer fake_token"})
            
            # Assert
            assert response.status_code == 200
            assert "Successfully logged out" in response.json()["message"]
        finally:
            # Clean up override
            app.dependency_overrides.pop(get_current_active_user, None)
    
    @patch('api.auth.AuthService')
    def test_deactivate_current_user(self, mock_auth_service_class):
        """Test deactivating current user account."""
        # Create a mock user
        mock_user = User(
            id="user123",
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password",
            full_name="Test User",
            role=UserRole.STUDENT,
            grade_level="10th Grade",
            curriculum_type="Standard",
            is_active=True,
            created_at=datetime(2023, 1, 1, 0, 0, 0),
            updated_at=None
        )
        
        # Override the dependency
        async def mock_get_current_active_user():
            return mock_user
            
        app.dependency_overrides[get_current_active_user] = mock_get_current_active_user
        
        # Mock the service
        mock_auth_service = Mock()
        mock_auth_service_class.return_value = mock_auth_service
        mock_auth_service.deactivate_user.return_value = True
        
        try:
            # Act
            response = client.delete("/auth/me", headers={"Authorization": "Bearer fake_token"})
            
            # Assert
            assert response.status_code == 200
            assert "Account deactivated successfully" in response.json()["message"]
            mock_auth_service.deactivate_user.assert_called_once_with("user123")
        finally:
            # Clean up override
            app.dependency_overrides.pop(get_current_active_user, None)
    
    def test_register_user_validation_error(self):
        """Test registration with validation errors."""
        # Arrange
        invalid_user_data = {
            "username": "ab",  # Too short
            "email": "invalid-email",  # Invalid email format
            "password": "123",  # Too short
            "full_name": "",  # Empty
            "role": "invalid_role"  # Invalid role
        }
        
        # Act
        response = client.post("/auth/register", json=invalid_user_data)
        
        # Assert
        assert response.status_code == 422  # Validation error
    
    def test_unauthorized_access_to_protected_endpoint(self):
        """Test accessing protected endpoint without authentication."""
        # Act
        response = client.get("/auth/me")
        
        # Assert
        assert response.status_code == 403  # Forbidden (no auth header)