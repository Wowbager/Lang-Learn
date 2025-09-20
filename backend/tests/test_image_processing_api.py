"""
Tests for the image processing API endpoints.
"""

import pytest
import tempfile
import os
import json
from io import BytesIO
from pathlib import Path
from PIL import Image
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock

from main import app
from models.pydantic_models import ImageProcessingResult, ExtractedContent, SourceType
from services.image_processing_service import image_processing_service


@pytest.fixture
def client(db_session):
    """Create a test client with database session."""
    from database.connection import get_db
    
    def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_image_bytes():
    """Create sample image bytes for testing."""
    img = Image.new('RGB', (100, 100), color='white')
    img_bytes = BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes.getvalue()


@pytest.fixture
def auth_headers(client):
    """Get authentication headers for testing."""
    # Create a test user and get token
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }
    
    # Register user
    client.post("/auth/register", json=user_data)
    
    # Login to get token
    login_data = {
        "username": "testuser",
        "password": "testpassword123"
    }
    response = client.post("/auth/login", data=login_data)
    token = response.json()["access_token"]
    
    return {"Authorization": f"Bearer {token}"}


class TestImageProcessingAPI:
    """Test cases for image processing API endpoints."""

    def test_upload_image_success(self, client, auth_headers, sample_image_bytes):
        """Test successful image upload and processing."""
        # Mock the image processing service
        mock_result = ImageProcessingResult(
            extracted_content=ExtractedContent(
                vocabulary=[],
                grammar_topics=[],
                exercises=[]
            ),
            confidence=0.8,
            source_type=SourceType.PRINTED,
            needs_review=False
        )
        
        with patch.object(image_processing_service, 'process_image', return_value=mock_result):
            with patch.object(image_processing_service, 'save_uploaded_file', return_value="/tmp/test.jpg"):
                files = {"file": ("test.jpg", sample_image_bytes, "image/jpeg")}
                response = client.post(
                    "/api/image-processing/upload",
                    files=files,
                    headers=auth_headers
                )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "file_id" in data
        assert "filename" in data
        assert "processing_result" in data
        assert data["filename"] == "test.jpg"

    def test_upload_image_unauthorized(self, client, sample_image_bytes):
        """Test image upload without authentication."""
        files = {"file": ("test.jpg", sample_image_bytes, "image/jpeg")}
        response = client.post("/api/image-processing/upload", files=files)
        
        assert response.status_code == 403

    def test_upload_invalid_file_type(self, client, auth_headers):
        """Test uploading non-image file."""
        files = {"file": ("test.txt", b"not an image", "text/plain")}
        response = client.post(
            "/api/image-processing/upload",
            files=files,
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "must be an image" in response.json()["detail"]

    def test_upload_file_too_large(self, client, auth_headers):
        """Test uploading file that's too large."""
        # Create a large file (simulate > 10MB)
        large_content = b"x" * (11 * 1024 * 1024)  # 11MB
        
        files = {"file": ("large.jpg", large_content, "image/jpeg")}
        response = client.post(
            "/api/image-processing/upload",
            files=files,
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "too large" in response.json()["detail"]

    def test_upload_processing_error(self, client, auth_headers, sample_image_bytes):
        """Test image upload with processing error."""
        with patch.object(image_processing_service, 'save_uploaded_file', side_effect=Exception("Processing failed")):
            files = {"file": ("test.jpg", sample_image_bytes, "image/jpeg")}
            response = client.post(
                "/api/image-processing/upload",
                files=files,
                headers=auth_headers
            )
        
        assert response.status_code == 500
        assert "Failed to process image" in response.json()["detail"]

    def test_reprocess_image_success(self, client, auth_headers):
        """Test successful image reprocessing."""
        file_id = "test-file-id"
        
        # Mock finding the file
        mock_result = ImageProcessingResult(
            extracted_content=ExtractedContent(),
            confidence=0.7,
            source_type=SourceType.HANDWRITTEN,
            needs_review=True
        )
        
        with patch('pathlib.Path.glob', return_value=[Path(f"/tmp/{file_id}.jpg")]):
            with patch.object(image_processing_service, 'process_image', return_value=mock_result):
                response = client.post(
                    f"/api/image-processing/reprocess/{file_id}",
                    headers=auth_headers
                )
        
        assert response.status_code == 200
        data = response.json()
        assert data["confidence"] == 0.7
        assert data["source_type"] == "handwritten"

    def test_reprocess_image_not_found(self, client, auth_headers):
        """Test reprocessing non-existent image."""
        file_id = "nonexistent-file"
        
        with patch('pathlib.Path.glob', return_value=[]):
            response = client.post(
                f"/api/image-processing/reprocess/{file_id}",
                headers=auth_headers
            )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]

    def test_save_content_to_learning_set_success(self, client, auth_headers):
        """Test saving extracted content to learning set."""
        # First create a learning set
        collection_data = {
            "name": "Test Collection",
            "description": "Test collection"
        }
        collection_response = client.post(
            "/content/collections",
            json=collection_data,
            headers=auth_headers
        )
        assert collection_response.status_code == 200, f"Collection creation failed: {collection_response.json()}"
        collection_id = collection_response.json()["id"]
        
        learning_set_data = {
            "name": "Test Learning Set",
            "description": "Test set",
            "collection_id": collection_id
        }
        set_response = client.post(
            "/content/learning-sets",
            json=learning_set_data,
            headers=auth_headers
        )
        assert set_response.status_code == 200, f"Learning set creation failed: {set_response.json()}"
        learning_set_id = set_response.json()["id"]
        
        # Now save extracted content
        vocabulary_items = [
            {
                "word": "apple",
                "definition": "a fruit",
                "confidence": 0.9
            }
        ]
        grammar_topics = [
            {
                "name": "Present Tense",
                "description": "Simple present tense",
                "confidence": 0.8,
                "difficulty": "beginner"
            }
        ]
        
        form_data = {
            "learning_set_id": learning_set_id,
            "vocabulary_items": json.dumps(vocabulary_items),
            "grammar_topics": json.dumps(grammar_topics)
        }
        
        response = client.post(
            "/api/image-processing/save-to-learning-set",
            data=form_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert "Saved 1 vocabulary items and 1 grammar topics" in data["message"]

    def test_save_content_invalid_json(self, client, auth_headers):
        """Test saving content with invalid JSON."""
        form_data = {
            "learning_set_id": "test-id",
            "vocabulary_items": "invalid json",
            "grammar_topics": "[]"
        }
        
        response = client.post(
            "/api/image-processing/save-to-learning-set",
            data=form_data,
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "Invalid JSON" in response.json()["detail"]

    def test_cleanup_file_success(self, client, auth_headers):
        """Test manual file cleanup."""
        file_id = "test-file-id"
        
        with patch('pathlib.Path.glob', return_value=[Path(f"/tmp/{file_id}.jpg")]):
            with patch.object(image_processing_service, 'cleanup_file') as mock_cleanup:
                response = client.delete(
                    f"/api/image-processing/cleanup/{file_id}",
                    headers=auth_headers
                )
        
        assert response.status_code == 200
        assert "Cleaned up" in response.json()["message"]
        mock_cleanup.assert_called_once()

    def test_cleanup_old_files_success(self, client, auth_headers):
        """Test cleanup of old files."""
        # First create a teacher user
        teacher_data = {
            "username": "teacher",
            "email": "teacher@example.com",
            "password": "teacherpass123",
            "full_name": "Teacher User",
            "role": "teacher"
        }
        client.post("/auth/register", json=teacher_data)
        
        # Login as teacher
        login_data = {
            "username": "teacher",
            "password": "teacherpass123"
        }
        response = client.post("/auth/login", data=login_data)
        teacher_token = response.json()["access_token"]
        teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
        
        with patch.object(image_processing_service, 'cleanup_old_files') as mock_cleanup:
            response = client.post(
                "/api/image-processing/cleanup-old",
                headers=teacher_headers
            )
        
        assert response.status_code == 200
        assert "Cleaned up files" in response.json()["message"]
        mock_cleanup.assert_called_once_with(24)

    def test_cleanup_old_files_forbidden(self, client, auth_headers):
        """Test cleanup of old files by non-teacher user."""
        response = client.post(
            "/api/image-processing/cleanup-old",
            headers=auth_headers
        )
        
        assert response.status_code == 403
        assert "Only teachers" in response.json()["detail"]

    def test_cleanup_old_files_custom_age(self, client):
        """Test cleanup with custom max age."""
        # Create teacher and login
        teacher_data = {
            "username": "teacher2",
            "email": "teacher2@example.com",
            "password": "teacherpass123",
            "full_name": "Teacher User 2",
            "role": "teacher"
        }
        client.post("/auth/register", json=teacher_data)
        
        login_data = {
            "username": "teacher2",
            "password": "teacherpass123"
        }
        response = client.post("/auth/login", data=login_data)
        teacher_token = response.json()["access_token"]
        teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
        
        with patch.object(image_processing_service, 'cleanup_old_files') as mock_cleanup:
            response = client.post(
                "/api/image-processing/cleanup-old?max_age_hours=48",
                headers=teacher_headers
            )
        
        assert response.status_code == 200
        mock_cleanup.assert_called_once_with(48)


if __name__ == "__main__":
    pytest.main([__file__])