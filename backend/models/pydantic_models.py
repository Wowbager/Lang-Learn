"""
Pydantic models for API request/response validation.
"""

from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    PARENT = "parent"

class PermissionRole(str, Enum):
    VIEWER = "VIEWER"
    EDITOR = "EDITOR"
    OWNER = "OWNER"

class SenderType(str, Enum):
    USER = "user"
    AI = "ai"

class GrammarDifficulty(str, Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"

# Base models
class BaseResponse(BaseModel):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

# User models
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole = UserRole.STUDENT
    grade_level: Optional[str] = Field(None, max_length=20)
    curriculum_type: Optional[str] = Field(None, max_length=50)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    grade_level: Optional[str] = Field(None, max_length=20)
    curriculum_type: Optional[str] = Field(None, max_length=50)

class UserResponse(UserBase, BaseResponse):
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

# Vocabulary models
class VocabularyItemBase(BaseModel):
    word: str = Field(..., min_length=1, max_length=100)
    definition: str = Field(..., min_length=1)
    example_sentence: Optional[str] = None
    part_of_speech: Optional[str] = Field(None, max_length=20)
    difficulty_level: Optional[str] = Field(None, max_length=20)

class VocabularyItemCreate(VocabularyItemBase):
    learning_set_id: str

class VocabularyItemUpdate(BaseModel):
    word: Optional[str] = Field(None, min_length=1, max_length=100)
    definition: Optional[str] = Field(None, min_length=1)
    example_sentence: Optional[str] = None
    part_of_speech: Optional[str] = Field(None, max_length=20)
    difficulty_level: Optional[str] = Field(None, max_length=20)

class VocabularyItemResponse(VocabularyItemBase):
    id: str
    learning_set_id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Grammar models
class GrammarTopicBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1)
    rule_explanation: Optional[str] = None
    examples: Optional[List[str]] = None
    difficulty: GrammarDifficulty

class GrammarTopicCreate(GrammarTopicBase):
    learning_set_id: str

class GrammarTopicUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1)
    rule_explanation: Optional[str] = None
    examples: Optional[List[str]] = None
    difficulty: Optional[GrammarDifficulty] = None

class GrammarTopicResponse(GrammarTopicBase):
    id: str
    learning_set_id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
    
    @model_validator(mode='after')
    def parse_examples(self):
        if hasattr(self, 'examples') and self.examples:
            import json
            try:
                if isinstance(self.examples, str):
                    self.examples = json.loads(self.examples)
                elif not isinstance(self.examples, list):
                    self.examples = []
            except (json.JSONDecodeError, TypeError):
                self.examples = []
        return self

# Collection models
class CollectionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    grade_level: Optional[str] = Field(None, max_length=20)
    subject: Optional[str] = Field(None, max_length=50)

class CollectionCreate(CollectionBase):
    pass

class CollectionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    grade_level: Optional[str] = Field(None, max_length=20)
    subject: Optional[str] = Field(None, max_length=50)

class CollectionResponse(CollectionBase, BaseResponse):
    created_by: str
    learning_sets: Optional[List["LearningSetResponse"]] = []
    model_config = ConfigDict(from_attributes=True)

# Learning Set models
class LearningSetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    grade_level: Optional[str] = Field(None, max_length=20)
    subject: Optional[str] = Field(None, max_length=50)

class LearningSetCreate(LearningSetBase):
    collection_ids: Optional[List[str]] = []

class LearningSetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    collection_ids: Optional[List[str]] = None
    grade_level: Optional[str] = Field(None, max_length=20)
    subject: Optional[str] = Field(None, max_length=50)

class LearningSetResponse(LearningSetBase, BaseResponse):
    collection_ids: Optional[List[str]] = []
    created_by: str
    vocabulary_items: Optional[List[VocabularyItemResponse]] = []
    grammar_topics: Optional[List[GrammarTopicResponse]] = []
    model_config = ConfigDict(from_attributes=True)
    
    @model_validator(mode='before')
    @classmethod
    def extract_collection_ids(cls, data: Any) -> Any:
        if hasattr(data, 'collections'):
            data.collection_ids = [c.id for c in data.collections] if data.collections else []
        return data

# Class models
class ClassBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None

class ClassCreate(ClassBase):
    pass

class ClassUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None

class ClassResponse(ClassBase, BaseResponse):
    teacher_id: str
    invite_code: str
    is_active: bool
    students: Optional[List[UserResponse]] = []
    model_config = ConfigDict(from_attributes=True)

# Permission models
class PermissionBase(BaseModel):
    role: PermissionRole

class PermissionCreate(PermissionBase):
    user_id: str
    learning_set_id: str

class PermissionGrant(BaseModel):
    user_id: str
    role: PermissionRole

class PermissionResponse(PermissionBase):
    id: str
    user_id: str
    learning_set_id: str
    granted_by: str
    granted_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Chat Session models
class ChatSessionBase(BaseModel):
    learning_set_id: str
    
class ChatSessionCreate(ChatSessionBase):
    pass

class ChatSessionUpdate(BaseModel):
    end_time: Optional[datetime] = None

class ChatSessionResponse(ChatSessionBase, BaseResponse):
    user_id: str
    total_messages: int
    vocabulary_practiced: Optional[Dict[str, Any]] = None
    grammar_corrections: int
    model_config = ConfigDict(from_attributes=True)

# Chat Message models
class ChatMessageBase(BaseModel):
    content: str = Field(..., min_length=1)
    sender: SenderType

class ChatMessageCreate(ChatMessageBase):
    session_id: str

class ChatMessageResponse(ChatMessageBase):
    id: str
    session_id: str
    timestamp: datetime
    corrections: Optional[Dict[str, Any]] = None
    vocabulary_used: Optional[Dict[str, Any]] = None
    model_config = ConfigDict(from_attributes=True)

# Image Processing models
class SourceType(str, Enum):
    PRINTED = "printed"
    HANDWRITTEN = "handwritten"
    MIXED = "mixed"

class ExtractedVocabularyItem(BaseModel):
    word: str
    definition: Optional[str] = None
    example_sentence: Optional[str] = None
    part_of_speech: Optional[str] = None
    confidence: float = Field(..., ge=0.0, le=1.0)

class ExtractedGrammarTopic(BaseModel):
    name: str
    description: Optional[str] = None
    rule_explanation: Optional[str] = None
    examples: Optional[List[str]] = None
    difficulty: Optional[str] = None
    confidence: float = Field(..., ge=0.0, le=1.0)

class ExtractedExercise(BaseModel):
    question: str
    answer: Optional[str] = None
    exercise_type: str
    difficulty: Optional[str] = None
    confidence: float = Field(..., ge=0.0, le=1.0)

class ExtractedContent(BaseModel):
    vocabulary: List[ExtractedVocabularyItem] = []
    grammar_topics: List[ExtractedGrammarTopic] = []
    exercises: List[ExtractedExercise] = []

class ImageProcessingResult(BaseModel):
    extracted_content: ExtractedContent
    confidence: float = Field(..., ge=0.0, le=1.0)
    source_type: SourceType
    suggested_grade_level: Optional[str] = None
    needs_review: bool = True
    processing_notes: Optional[str] = None

class ImageUploadResponse(BaseModel):
    file_id: str
    filename: str
    processing_result: ImageProcessingResult

# Token models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

CollectionResponse.model_rebuild()
LearningSetResponse.model_rebuild()
ClassResponse.model_rebuild()