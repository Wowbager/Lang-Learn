"""
Tests for the image processing service.
"""

import pytest
import tempfile
import os
from pathlib import Path
from PIL import Image
import asyncio
from unittest.mock import Mock, patch, AsyncMock

from services.image_processing_service import ImageProcessingService
from models.pydantic_models import (
    ImageProcessingResult, 
    ExtractedContent, 
    SourceType,
    ExtractedVocabularyItem,
    ExtractedGrammarTopic
)


@pytest.fixture
def image_service():
    """Create an image processing service instance for testing."""
    service = ImageProcessingService()
    # Mock the LLM to avoid API calls during testing
    service.llm = AsyncMock()
    return service


@pytest.fixture
def sample_image():
    """Create a sample image file for testing."""
    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
        # Create a simple test image
        img = Image.new('RGB', (100, 100), color='white')
        img.save(tmp_file.name, 'JPEG')
        yield tmp_file.name
    
    # Cleanup
    if os.path.exists(tmp_file.name):
        os.unlink(tmp_file.name)


@pytest.fixture
def large_image():
    """Create a large image file for testing resize functionality."""
    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
        # Create a large test image
        img = Image.new('RGB', (3000, 3000), color='white')
        img.save(tmp_file.name, 'JPEG')
        yield tmp_file.name
    
    # Cleanup
    if os.path.exists(tmp_file.name):
        os.unlink(tmp_file.name)


class TestImageProcessingService:
    """Test cases for ImageProcessingService."""

    def test_init(self, image_service):
        """Test service initialization."""
        assert image_service.llm is not None
        assert image_service.upload_dir.exists()

    def test_encode_image(self, image_service, sample_image):
        """Test image encoding to base64."""
        encoded = image_service._encode_image(sample_image)
        assert isinstance(encoded, str)
        assert len(encoded) > 0

    def test_create_extraction_prompt(self, image_service):
        """Test prompt template creation."""
        prompt = image_service._create_extraction_prompt()
        assert prompt is not None
        
        # Test that the prompt can be formatted
        messages = prompt.format_messages(image_data="test_data")
        assert len(messages) == 2  # system and human messages

    def test_parse_llm_response_valid_json(self, image_service):
        """Test parsing valid LLM response."""
        response_text = '''```json
        {
            "vocabulary": [
                {
                    "word": "apple",
                    "definition": "a fruit",
                    "confidence": 0.9,
                    "part_of_speech": "noun"
                }
            ],
            "grammar_topics": [
                {
                    "name": "Present Tense",
                    "description": "Simple present tense",
                    "confidence": 0.8,
                    "difficulty": "beginner"
                }
            ],
            "exercises": [],
            "source_type": "printed",
            "suggested_grade_level": "3rd grade",
            "processing_notes": "Clear text detected"
        }
        ```'''
        
        result = image_service._parse_llm_response(response_text)
        
        assert isinstance(result, ImageProcessingResult)
        assert len(result.extracted_content.vocabulary) == 1
        assert len(result.extracted_content.grammar_topics) == 1
        assert result.source_type == SourceType.PRINTED
        assert result.suggested_grade_level == "3rd grade"
        
        vocab_item = result.extracted_content.vocabulary[0]
        assert vocab_item.word == "apple"
        assert vocab_item.definition == "a fruit"
        assert vocab_item.confidence == 0.9

    def test_parse_llm_response_invalid_json(self, image_service):
        """Test parsing invalid LLM response."""
        response_text = "This is not valid JSON"
        
        result = image_service._parse_llm_response(response_text)
        
        assert isinstance(result, ImageProcessingResult)
        assert result.confidence == 0.0
        assert result.needs_review is True
        assert "Failed to parse LLM response" in result.processing_notes

    def test_save_uploaded_file_valid(self, image_service):
        """Test saving valid uploaded file."""
        file_content = b"fake image content"
        filename = "test.jpg"
        
        file_path = image_service.save_uploaded_file(file_content, filename)
        
        assert os.path.exists(file_path)
        assert file_path.endswith('.jpg')
        
        # Verify content
        with open(file_path, 'rb') as f:
            assert f.read() == file_content
        
        # Cleanup
        os.unlink(file_path)

    def test_save_uploaded_file_invalid_extension(self, image_service):
        """Test saving file with invalid extension."""
        file_content = b"fake content"
        filename = "test.txt"
        
        with pytest.raises(ValueError, match="Unsupported file type"):
            image_service.save_uploaded_file(file_content, filename)

    def test_cleanup_file(self, image_service):
        """Test file cleanup."""
        # Create a temporary file
        file_content = b"test content"
        filename = "test.jpg"
        file_path = image_service.save_uploaded_file(file_content, filename)
        
        assert os.path.exists(file_path)
        
        # Clean up the file
        image_service.cleanup_file(file_path)
        
        assert not os.path.exists(file_path)

    def test_cleanup_nonexistent_file(self, image_service):
        """Test cleanup of nonexistent file (should not raise error)."""
        image_service.cleanup_file("/nonexistent/path/file.jpg")
        # Should complete without error

    @patch('time.time')
    def test_cleanup_old_files(self, mock_time, image_service):
        """Test cleanup of old files."""
        current_time = 1000000
        mock_time.return_value = current_time
        
        # Create a test file
        file_content = b"test content"
        filename = "old_test.jpg"
        file_path = image_service.save_uploaded_file(file_content, filename)
        
        # Mock the file as being old
        old_time = current_time - (25 * 3600)  # 25 hours old
        os.utime(file_path, (old_time, old_time))
        
        # Run cleanup
        image_service.cleanup_old_files(max_age_hours=24)
        
        # File should be deleted
        assert not os.path.exists(file_path)

    @pytest.mark.asyncio
    async def test_process_image_success(self, image_service, sample_image):
        """Test successful image processing."""
        # Mock the LLM response
        mock_response = Mock()
        mock_response.content = '''```json
        {
            "vocabulary": [{"word": "test", "confidence": 0.9}],
            "grammar_topics": [],
            "exercises": [],
            "source_type": "printed"
        }
        ```'''
        
        # Configure the async mock to return the mock response
        image_service.llm.ainvoke = AsyncMock(return_value=mock_response)
        
        result = await image_service.process_image(sample_image, "test.jpg")
        
        assert isinstance(result, ImageProcessingResult)
        assert len(result.extracted_content.vocabulary) == 1
        assert result.extracted_content.vocabulary[0].word == "test"

    @pytest.mark.asyncio
    async def test_process_image_resize_large_image(self, image_service, large_image):
        """Test processing large image that needs resizing."""
        # Mock the LLM response
        mock_response = Mock()
        mock_response.content = '''{"vocabulary": [], "grammar_topics": [], "exercises": []}'''
        
        # Configure the async mock to return the mock response
        image_service.llm.ainvoke = AsyncMock(return_value=mock_response)
        
        result = await image_service.process_image(large_image, "large_test.jpg")
        
        assert isinstance(result, ImageProcessingResult)
        # Should complete without error even with large image

    @pytest.mark.asyncio
    async def test_process_image_llm_error(self, image_service, sample_image):
        """Test image processing with LLM error."""
        # Configure the async mock to raise an exception
        image_service.llm.ainvoke = AsyncMock(side_effect=Exception("LLM error"))
        
        result = await image_service.process_image(sample_image, "test.jpg")
        
        assert isinstance(result, ImageProcessingResult)
        assert result.confidence == 0.0
        assert result.needs_review is True
        assert "Processing error" in result.processing_notes

    @pytest.mark.asyncio
    async def test_process_image_invalid_file(self, image_service):
        """Test processing invalid image file."""
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as tmp_file:
            tmp_file.write(b"not an image")
            tmp_file.flush()
            
            result = await image_service.process_image(tmp_file.name, "test.txt")
            
            assert isinstance(result, ImageProcessingResult)
            assert result.confidence == 0.0
            assert result.needs_review is True
            
            # Cleanup
            os.unlink(tmp_file.name)


class TestExtractedContentModels:
    """Test the extracted content Pydantic models."""

    def test_extracted_vocabulary_item_creation(self):
        """Test creating ExtractedVocabularyItem."""
        item = ExtractedVocabularyItem(
            word="test",
            definition="a trial",
            confidence=0.9
        )
        
        assert item.word == "test"
        assert item.definition == "a trial"
        assert item.confidence == 0.9

    def test_extracted_vocabulary_item_validation(self):
        """Test ExtractedVocabularyItem validation."""
        # Test invalid confidence
        with pytest.raises(ValueError):
            ExtractedVocabularyItem(
                word="test",
                confidence=1.5  # Invalid: > 1.0
            )

    def test_extracted_grammar_topic_creation(self):
        """Test creating ExtractedGrammarTopic."""
        topic = ExtractedGrammarTopic(
            name="Present Tense",
            description="Simple present tense",
            confidence=0.8,
            examples=["I walk", "She runs"]
        )
        
        assert topic.name == "Present Tense"
        assert topic.description == "Simple present tense"
        assert topic.confidence == 0.8
        assert len(topic.examples) == 2

    def test_image_processing_result_creation(self):
        """Test creating ImageProcessingResult."""
        content = ExtractedContent(
            vocabulary=[
                ExtractedVocabularyItem(word="test", confidence=0.9)
            ],
            grammar_topics=[],
            exercises=[]
        )
        
        result = ImageProcessingResult(
            extracted_content=content,
            confidence=0.85,
            source_type=SourceType.PRINTED,
            needs_review=False
        )
        
        assert result.confidence == 0.85
        assert result.source_type == SourceType.PRINTED
        assert result.needs_review is False
        assert len(result.extracted_content.vocabulary) == 1


if __name__ == "__main__":
    pytest.main([__file__])