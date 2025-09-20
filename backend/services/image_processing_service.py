"""
LangChain-based image processing service for extracting educational content from images.
"""

import os
import json
import uuid
import tempfile
from typing import Optional, Dict, Any, List
from pathlib import Path
from PIL import Image
import base64
from io import BytesIO

from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from langchain.schema.output_parser import OutputParserException

from models.pydantic_models import (
    ImageProcessingResult, 
    ExtractedContent, 
    ExtractedVocabularyItem,
    ExtractedGrammarTopic,
    ExtractedExercise,
    SourceType
)


class ImageProcessingService:
    """Service for processing educational images using LangChain and vision-capable LLMs."""
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.1,
            max_tokens=4000
        )
        self.upload_dir = Path("uploads/temp")
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        
    def _encode_image(self, image_path: str) -> str:
        """Encode image to base64 for LLM processing."""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    
    def _create_extraction_prompt(self) -> ChatPromptTemplate:
        """Create the prompt template for content extraction."""
        system_message = """You are an expert educational content analyzer. Your task is to extract vocabulary words, grammar topics, and exercises from educational images (textbook pages, worksheets, handwritten notes).

Analyze the image and extract:
1. Vocabulary words with definitions, examples, and parts of speech
2. Grammar topics with rules, explanations, and examples  
3. Exercises or practice questions with answers when visible

For each item, provide a confidence score (0.0-1.0) based on how clearly you can identify it.
Determine if the content is printed text, handwritten, or mixed.
Suggest an appropriate grade level based on complexity.

Be thorough but accurate. If text is unclear, mark confidence as lower.
Focus on educational content - ignore decorative elements, page numbers, etc.

Return your analysis in the specified JSON format."""

        human_message = """Please analyze this educational image and extract vocabulary, grammar topics, and exercises.

Image: {image_data}

Return the extracted content as a structured JSON response."""

        return ChatPromptTemplate.from_messages([
            ("system", system_message),
            ("human", human_message)
        ])
    
    def _parse_llm_response(self, response_text: str) -> ImageProcessingResult:
        """Parse LLM response into structured format."""
        try:
            # Try to extract JSON from the response
            response_text = response_text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            data = json.loads(response_text)
            
            # Extract vocabulary items
            vocabulary = []
            for item in data.get("vocabulary", []):
                vocab_item = ExtractedVocabularyItem(
                    word=item.get("word", ""),
                    definition=item.get("definition"),
                    example_sentence=item.get("example_sentence"),
                    part_of_speech=item.get("part_of_speech"),
                    confidence=float(item.get("confidence", 0.5))
                )
                vocabulary.append(vocab_item)
            
            # Extract grammar topics
            grammar_topics = []
            for item in data.get("grammar_topics", []):
                grammar_topic = ExtractedGrammarTopic(
                    name=item.get("name", ""),
                    description=item.get("description"),
                    rule_explanation=item.get("rule_explanation"),
                    examples=item.get("examples", []),
                    difficulty=item.get("difficulty"),
                    confidence=float(item.get("confidence", 0.5))
                )
                grammar_topics.append(grammar_topic)
            
            # Extract exercises
            exercises = []
            for item in data.get("exercises", []):
                exercise = ExtractedExercise(
                    question=item.get("question", ""),
                    answer=item.get("answer"),
                    exercise_type=item.get("exercise_type", "unknown"),
                    difficulty=item.get("difficulty"),
                    confidence=float(item.get("confidence", 0.5))
                )
                exercises.append(exercise)
            
            extracted_content = ExtractedContent(
                vocabulary=vocabulary,
                grammar_topics=grammar_topics,
                exercises=exercises
            )
            
            # Determine source type
            source_type_str = data.get("source_type", "mixed").lower()
            source_type = SourceType.MIXED
            if source_type_str == "printed":
                source_type = SourceType.PRINTED
            elif source_type_str == "handwritten":
                source_type = SourceType.HANDWRITTEN
            
            # Calculate overall confidence
            all_confidences = []
            for item in vocabulary:
                all_confidences.append(item.confidence)
            for item in grammar_topics:
                all_confidences.append(item.confidence)
            for item in exercises:
                all_confidences.append(item.confidence)
            
            overall_confidence = sum(all_confidences) / len(all_confidences) if all_confidences else 0.5
            
            return ImageProcessingResult(
                extracted_content=extracted_content,
                confidence=overall_confidence,
                source_type=source_type,
                suggested_grade_level=data.get("suggested_grade_level"),
                needs_review=overall_confidence < 0.8 or len(vocabulary) + len(grammar_topics) + len(exercises) == 0,
                processing_notes=data.get("processing_notes")
            )
            
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            # Fallback for parsing errors
            return ImageProcessingResult(
                extracted_content=ExtractedContent(),
                confidence=0.0,
                source_type=SourceType.MIXED,
                needs_review=True,
                processing_notes=f"Failed to parse LLM response: {str(e)}"
            )
    
    async def process_image(self, image_path: str, filename: str) -> ImageProcessingResult:
        """Process an image and extract educational content."""
        try:
            # Validate image
            with Image.open(image_path) as img:
                # Convert to RGB if necessary
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Resize if too large (max 2048x2048 for GPT-4V)
                max_size = 2048
                if img.width > max_size or img.height > max_size:
                    img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                    
                    # Save resized image
                    resized_path = image_path.replace(Path(image_path).suffix, "_resized.jpg")
                    img.save(resized_path, "JPEG", quality=85)
                    image_path = resized_path
            
            # Encode image for LLM
            base64_image = self._encode_image(image_path)
            
            # Create prompt
            prompt = self._create_extraction_prompt()
            
            # Create message with image
            message = HumanMessage(
                content=[
                    {
                        "type": "text",
                        "text": prompt.format_messages(image_data="")[0].content
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}",
                            "detail": "high"
                        }
                    }
                ]
            )
            
            # Get LLM response
            response = await self.llm.ainvoke([message])
            
            # Parse response
            result = self._parse_llm_response(response.content)
            
            return result
            
        except Exception as e:
            return ImageProcessingResult(
                extracted_content=ExtractedContent(),
                confidence=0.0,
                source_type=SourceType.MIXED,
                needs_review=True,
                processing_notes=f"Processing error: {str(e)}"
            )
    
    def save_uploaded_file(self, file_content: bytes, filename: str) -> str:
        """Save uploaded file to temporary storage."""
        file_id = str(uuid.uuid4())
        file_extension = Path(filename).suffix.lower()
        
        # Validate file type
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'}
        if file_extension not in allowed_extensions:
            raise ValueError(f"Unsupported file type: {file_extension}")
        
        file_path = self.upload_dir / f"{file_id}{file_extension}"
        
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        return str(file_path)
    
    def cleanup_file(self, file_path: str) -> None:
        """Remove temporary file after processing."""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                
            # Also remove resized version if it exists
            resized_path = file_path.replace(Path(file_path).suffix, "_resized.jpg")
            if os.path.exists(resized_path):
                os.remove(resized_path)
                
        except OSError:
            pass  # Ignore cleanup errors
    
    def cleanup_old_files(self, max_age_hours: int = 24) -> None:
        """Clean up old temporary files."""
        import time
        current_time = time.time()
        
        for file_path in self.upload_dir.glob("*"):
            if file_path.is_file():
                file_age = current_time - file_path.stat().st_mtime
                if file_age > (max_age_hours * 3600):
                    try:
                        file_path.unlink()
                    except OSError:
                        pass


# Global service instance
image_processing_service = ImageProcessingService()