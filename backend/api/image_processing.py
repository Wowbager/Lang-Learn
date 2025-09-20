"""
FastAPI endpoints for image processing and content extraction.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any
import asyncio
from pathlib import Path
from uuid import uuid4
import json

from auth.dependencies import get_current_user
from models.pydantic_models import (
    UserResponse, 
    ImageProcessingResult, 
    ImageUploadResponse,
    ExtractedContent,
    LearningSetCreate,
    VocabularyItemCreate,
    GrammarTopicCreate
)
from models.database_models import UserRole, VocabularyItem, GrammarTopic, LearningSet, Permission, PermissionRole, GrammarDifficulty
from services.image_processing_service import image_processing_service
from database.connection import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/image-processing", tags=["image-processing"])


@router.post("/upload", response_model=ImageUploadResponse)
async def upload_and_process_image(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Upload an image and extract educational content using LangChain vision processing.
    
    - **file**: Image file (JPG, PNG, GIF, BMP, TIFF, WebP)
    - Returns extracted vocabulary, grammar topics, and exercises
    """
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail="File must be an image"
        )
    
    # Check file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=400,
            detail="File size too large. Maximum size is 10MB."
        )
    
    try:
        # Save uploaded file
        file_path = image_processing_service.save_uploaded_file(
            file_content, 
            file.filename or "unknown.jpg"
        )
        
        # Process image
        processing_result = await image_processing_service.process_image(
            file_path, 
            file.filename or "unknown.jpg"
        )
        
        # Generate file ID for client reference
        file_id = Path(file_path).stem
        
        # Schedule cleanup (don't wait for it)
        asyncio.create_task(
            _cleanup_file_after_delay(file_path, delay_seconds=300)  # 5 minutes
        )
        
        return ImageUploadResponse(
            file_id=file_id,
            filename=file.filename or "unknown.jpg",
            processing_result=processing_result
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process image: {str(e)}"
        )


@router.post("/reprocess/{file_id}")
async def reprocess_image(
    file_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Reprocess a previously uploaded image with different parameters.
    
    - **file_id**: ID of previously uploaded file
    """
    
    # Find the file in temp storage
    temp_files = list(image_processing_service.upload_dir.glob(f"{file_id}.*"))
    if not temp_files:
        raise HTTPException(
            status_code=404,
            detail="File not found or has been cleaned up"
        )
    
    file_path = str(temp_files[0])
    
    try:
        # Reprocess the image
        processing_result = await image_processing_service.process_image(
            file_path,
            f"{file_id}{Path(file_path).suffix}"
        )
        
        return processing_result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reprocess image: {str(e)}"
        )


@router.post("/save-to-learning-set")
async def save_extracted_content_to_learning_set(
    learning_set_id: str = Form(...),
    vocabulary_items: str = Form(...),  # JSON string
    grammar_topics: str = Form(...),    # JSON string
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save extracted and reviewed content to an existing learning set.
    
    - **learning_set_id**: Target learning set ID
    - **vocabulary_items**: JSON array of vocabulary items to save
    - **grammar_topics**: JSON array of grammar topics to save
    """
    
    import json
    
    try:
        # Parse JSON data
        vocab_data = json.loads(vocabulary_items)
        grammar_data = json.loads(grammar_topics)
        
        saved_items = {
            "vocabulary_items": [],
            "grammar_topics": []
        }
        
        # Save vocabulary items
        for item in vocab_data:
            vocab_create = VocabularyItemCreate(
                learning_set_id=learning_set_id,
                word=item.get("word", ""),
                definition=item.get("definition", ""),
                example_sentence=item.get("example_sentence"),
                part_of_speech=item.get("part_of_speech"),
                difficulty_level=item.get("difficulty_level")
            )
            
            # Create vocabulary item directly
            db_vocab = VocabularyItem(
                id=str(uuid4()),
                word=vocab_create.word,
                definition=vocab_create.definition,
                example_sentence=vocab_create.example_sentence,
                part_of_speech=vocab_create.part_of_speech,
                difficulty_level=vocab_create.difficulty_level,
                learning_set_id=vocab_create.learning_set_id
            )
            db.add(db_vocab)
            db.commit()
            db.refresh(db_vocab)
            saved_items["vocabulary_items"].append(db_vocab)
        
        # Save grammar topics
        for item in grammar_data:
            grammar_create = GrammarTopicCreate(
                learning_set_id=learning_set_id,
                name=item.get("name", ""),
                description=item.get("description", ""),
                rule_explanation=item.get("rule_explanation"),
                examples=item.get("examples", []),
                difficulty=item.get("difficulty", "beginner")
            )
            
            # Create grammar topic directly
            db_grammar = GrammarTopic(
                id=str(uuid4()),
                name=grammar_create.name,
                description=grammar_create.description,
                rule_explanation=grammar_create.rule_explanation,
                examples=json.dumps(grammar_create.examples),  # Convert list to JSON string
                difficulty=grammar_create.difficulty,
                learning_set_id=grammar_create.learning_set_id
            )
            db.add(db_grammar)
            db.commit()
            db.refresh(db_grammar)
            saved_items["grammar_topics"].append(db_grammar)
        
        return JSONResponse(
            status_code=201,
            content={
                "message": f"Saved {len(saved_items['vocabulary_items'])} vocabulary items and {len(saved_items['grammar_topics'])} grammar topics",
                "saved_items": saved_items
            }
        )
        
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Invalid JSON data in vocabulary_items or grammar_topics"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save content: {str(e)}"
        )


@router.delete("/cleanup/{file_id}")
async def cleanup_temporary_file(
    file_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Manually clean up a temporary file.
    
    - **file_id**: ID of file to clean up
    """
    
    # Find and remove the file
    temp_files = list(image_processing_service.upload_dir.glob(f"{file_id}.*"))
    
    for file_path in temp_files:
        image_processing_service.cleanup_file(str(file_path))
    
    return {"message": f"Cleaned up {len(temp_files)} file(s)"}


@router.post("/cleanup-old")
async def cleanup_old_files(
    max_age_hours: int = 24,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Clean up old temporary files (admin function).
    
    - **max_age_hours**: Maximum age of files to keep (default: 24 hours)
    """
    
    # Only allow teachers to run cleanup
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(
            status_code=403,
            detail="Only teachers can run cleanup operations"
        )
    
    image_processing_service.cleanup_old_files(max_age_hours)
    
    return {"message": f"Cleaned up files older than {max_age_hours} hours"}


async def _cleanup_file_after_delay(file_path: str, delay_seconds: int = 300):
    """Helper function to clean up file after a delay."""
    await asyncio.sleep(delay_seconds)
    image_processing_service.cleanup_file(file_path)