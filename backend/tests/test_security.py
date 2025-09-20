"""
Tests for authentication security utilities.
"""

import pytest
from datetime import datetime, timedelta
from jose import jwt
from auth.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_token,
    create_credentials_exception,
    SECRET_KEY,
    ALGORITHM
)

class TestSecurityUtilities:
    """Test cases for security utility functions."""
    
    def test_password_hashing_and_verification(self):
        """Test password hashing and verification."""
        # Arrange
        plain_password = "testpassword123"
        
        # Act
        hashed_password = get_password_hash(plain_password)
        
        # Assert
        assert hashed_password != plain_password
        assert verify_password(plain_password, hashed_password) is True
        assert verify_password("wrongpassword", hashed_password) is False
    
    def test_password_hash_uniqueness(self):
        """Test that same password produces different hashes."""
        # Arrange
        password = "testpassword123"
        
        # Act
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        # Assert
        assert hash1 != hash2
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True
    
    def test_create_access_token_default_expiry(self):
        """Test creating access token with default expiry."""
        # Arrange
        data = {"sub": "testuser"}
        
        # Act
        token = create_access_token(data)
        
        # Assert
        assert isinstance(token, str)
        assert len(token) > 0
        
        # Verify token can be decoded
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "testuser"
        assert "exp" in payload
    
    def test_create_access_token_custom_expiry(self):
        """Test creating access token with custom expiry."""
        # Arrange
        data = {"sub": "testuser"}
        expires_delta = timedelta(minutes=60)
        
        # Act
        token = create_access_token(data, expires_delta)
        
        # Assert
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "testuser"
        
        # Check expiry is approximately correct (within 1 minute tolerance)
        exp_timestamp = payload["exp"]
        expected_exp = datetime.utcnow() + expires_delta
        actual_exp = datetime.fromtimestamp(exp_timestamp)
        time_diff = abs((expected_exp - actual_exp).total_seconds())
        assert time_diff < 60  # Within 1 minute
    
    def test_verify_token_valid(self):
        """Test verifying a valid token."""
        # Arrange
        data = {"sub": "testuser", "role": "student"}
        token = create_access_token(data)
        
        # Act
        payload = verify_token(token)
        
        # Assert
        assert payload is not None
        assert payload["sub"] == "testuser"
        assert payload["role"] == "student"
    
    def test_verify_token_invalid(self):
        """Test verifying an invalid token."""
        # Arrange
        invalid_token = "invalid.token.here"
        
        # Act
        payload = verify_token(invalid_token)
        
        # Assert
        assert payload is None
    
    def test_verify_token_expired(self):
        """Test verifying an expired token."""
        # Arrange
        data = {"sub": "testuser"}
        expires_delta = timedelta(seconds=-1)  # Already expired
        token = create_access_token(data, expires_delta)
        
        # Act
        payload = verify_token(token)
        
        # Assert
        assert payload is None
    
    def test_verify_token_malformed(self):
        """Test verifying a malformed token."""
        # Arrange
        malformed_tokens = [
            "",
            "not.a.token",
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9",  # Incomplete JWT
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.invalid",  # Invalid payload
        ]
        
        for token in malformed_tokens:
            # Act
            payload = verify_token(token)
            
            # Assert
            assert payload is None
    
    def test_create_credentials_exception(self):
        """Test creating credentials exception."""
        # Act
        exception = create_credentials_exception()
        
        # Assert
        assert exception.status_code == 401
        assert "Could not validate credentials" in exception.detail
        assert exception.headers == {"WWW-Authenticate": "Bearer"}
    
    def test_token_with_additional_claims(self):
        """Test creating and verifying token with additional claims."""
        # Arrange
        data = {
            "sub": "testuser",
            "role": "teacher",
            "permissions": ["read", "write"],
            "user_id": "user123"
        }
        
        # Act
        token = create_access_token(data)
        payload = verify_token(token)
        
        # Assert
        assert payload is not None
        assert payload["sub"] == "testuser"
        assert payload["role"] == "teacher"
        assert payload["permissions"] == ["read", "write"]
        assert payload["user_id"] == "user123"
    
    def test_empty_password_handling(self):
        """Test handling of empty passwords."""
        # Arrange
        empty_password = ""
        
        # Act
        hashed = get_password_hash(empty_password)
        
        # Assert
        assert verify_password(empty_password, hashed) is True
        assert verify_password("nonempty", hashed) is False
    
    def test_unicode_password_handling(self):
        """Test handling of unicode passwords."""
        # Arrange
        unicode_password = "пароль123🔒"
        
        # Act
        hashed = get_password_hash(unicode_password)
        
        # Assert
        assert verify_password(unicode_password, hashed) is True
        assert verify_password("password123", hashed) is False