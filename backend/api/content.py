"""
FastAPI endpoints for content management (collections and learning sets).
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_, or_
from typing import List, Optional
from uuid import uuid4

from database.connection import get_db
from models.database_models import Collection, LearningSet, VocabularyItem, GrammarTopic, Permission, User, PermissionRole, GrammarDifficulty
from models.pydantic_models import (
    CollectionCreate, CollectionUpdate, CollectionResponse,
    LearningSetCreate, LearningSetUpdate, LearningSetResponse,
    VocabularyItemCreate, VocabularyItemUpdate, VocabularyItemResponse,
    GrammarTopicCreate, GrammarTopicUpdate, GrammarTopicResponse,
    PermissionCreate, PermissionGrant, PermissionResponse
)
from auth.dependencies import get_current_user

router = APIRouter(prefix="/content", tags=["content"])

# Collection endpoints
@router.post("/collections", response_model=CollectionResponse)
async def create_collection(
    collection: CollectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new collection."""
    db_collection = Collection(
        id=str(uuid4()),
        name=collection.name,
        description=collection.description,
        grade_level=collection.grade_level,
        subject=collection.subject,
        created_by=current_user.id
    )
    db.add(db_collection)
    db.commit()
    db.refresh(db_collection)
    return db_collection

@router.get("/collections", response_model=List[CollectionResponse])
async def get_collections(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    grade_level: Optional[str] = None,
    subject: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get collections with filtering and pagination."""
    query = db.query(Collection).options(selectinload(Collection.learning_sets))
    
    # Filter by user's own collections or collections they have access to through permissions
    query = query.filter(
        or_(
            Collection.created_by == current_user.id,
            Collection.learning_sets.any(
                LearningSet.permissions.any(Permission.user_id == current_user.id)
            )
        )
    )
    
    # Apply filters
    if grade_level:
        query = query.filter(Collection.grade_level == grade_level)
    if subject:
        query = query.filter(Collection.subject == subject)
    if search:
        query = query.filter(
            or_(
                Collection.name.ilike(f"%{search}%"),
                Collection.description.ilike(f"%{search}%")
            )
        )
    
    collections = query.offset(skip).limit(limit).all()
    return collections

@router.get("/collections/{collection_id}", response_model=CollectionResponse)
async def get_collection(
    collection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific collection by ID."""
    collection = db.query(Collection).options(
        selectinload(Collection.learning_sets).selectinload(LearningSet.vocabulary_items),
        selectinload(Collection.learning_sets).selectinload(LearningSet.grammar_topics)
    ).filter(Collection.id == collection_id).first()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Check if user has access to this collection
    if collection.created_by != current_user.id:
        # Check if user has access through any learning set permissions
        has_access = any(
            any(perm.user_id == current_user.id for perm in ls.permissions)
            for ls in collection.learning_sets
        )
        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return collection

@router.put("/collections/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: str,
    collection_update: CollectionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a collection."""
    db_collection = db.query(Collection).filter(Collection.id == collection_id).first()
    
    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    if db_collection.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can update this collection")
    
    # Update fields
    update_data = collection_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_collection, field, value)
    
    db.commit()
    db.refresh(db_collection)
    return db_collection

@router.delete("/collections/{collection_id}")
async def delete_collection(
    collection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a collection."""
    db_collection = db.query(Collection).filter(Collection.id == collection_id).first()
    
    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    if db_collection.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can delete this collection")
    
    # No need to check for learning sets since they're now in a many-to-many relationship
    # Deleting a collection will just remove the association, not the learning sets
    
    db.delete(db_collection)
    db.commit()
    return {"message": "Collection deleted successfully"}

# Learning Set endpoints
@router.post("/learning-sets", response_model=LearningSetResponse)
async def create_learning_set(
    learning_set: LearningSetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new learning set."""
    # Verify collections exist and user has access (if any specified)
    if learning_set.collection_ids:
        for collection_id in learning_set.collection_ids:
            collection = db.query(Collection).filter(Collection.id == collection_id).first()
            if not collection:
                raise HTTPException(status_code=404, detail=f"Collection {collection_id} not found")
            
            if collection.created_by != current_user.id:
                raise HTTPException(status_code=403, detail=f"Access denied to collection {collection_id}")
    
    db_learning_set = LearningSet(
        id=str(uuid4()),
        name=learning_set.name,
        description=learning_set.description,
        created_by=current_user.id,
        grade_level=learning_set.grade_level,
        subject=learning_set.subject
    )
    db.add(db_learning_set)
    
    # Add collections if specified
    if learning_set.collection_ids:
        collections = db.query(Collection).filter(Collection.id.in_(learning_set.collection_ids)).all()
        db_learning_set.collections = collections
    
    # Create owner permission for the creator
    owner_permission = Permission(
        id=str(uuid4()),
        user_id=current_user.id,
        learning_set_id=db_learning_set.id,
        role=PermissionRole.OWNER,
        granted_by=current_user.id
    )
    db.add(owner_permission)
    
    db.commit()
    db.refresh(db_learning_set)
    return db_learning_set

@router.get("/learning-sets", response_model=List[LearningSetResponse])
async def get_learning_sets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    collection_id: Optional[str] = None,
    grade_level: Optional[str] = None,
    subject: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get learning sets with filtering and pagination."""
    query = db.query(LearningSet).options(
        selectinload(LearningSet.vocabulary_items),
        selectinload(LearningSet.grammar_topics),
        selectinload(LearningSet.collections)
    )
    
    # Filter by user's access (created by user or has permissions)
    query = query.filter(
        or_(
            LearningSet.created_by == current_user.id,
            LearningSet.permissions.any(Permission.user_id == current_user.id)
        )
    )
    
    # Apply filters
    if collection_id:
        query = query.filter(LearningSet.collections.any(Collection.id == collection_id))
    if grade_level:
        query = query.filter(LearningSet.grade_level == grade_level)
    if subject:
        query = query.filter(LearningSet.subject == subject)
    if search:
        query = query.filter(
            or_(
                LearningSet.name.ilike(f"%{search}%"),
                LearningSet.description.ilike(f"%{search}%")
            )
        )
    
    learning_sets = query.offset(skip).limit(limit).all()
    return learning_sets

@router.get("/learning-sets/{learning_set_id}", response_model=LearningSetResponse)
async def get_learning_set(
    learning_set_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific learning set by ID."""
    learning_set = db.query(LearningSet).options(
        selectinload(LearningSet.vocabulary_items),
        selectinload(LearningSet.grammar_topics),
        selectinload(LearningSet.permissions),
        selectinload(LearningSet.collections)
    ).filter(LearningSet.id == learning_set_id).first()
    
    if not learning_set:
        raise HTTPException(status_code=404, detail="Learning set not found")
    
    # Check if user has access
    if learning_set.created_by != current_user.id:
        has_permission = any(perm.user_id == current_user.id for perm in learning_set.permissions)
        if not has_permission:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return learning_set

@router.put("/learning-sets/{learning_set_id}", response_model=LearningSetResponse)
async def update_learning_set(
    learning_set_id: str,
    learning_set_update: LearningSetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a learning set."""
    db_learning_set = db.query(LearningSet).options(
        selectinload(LearningSet.permissions),
        selectinload(LearningSet.collections)
    ).filter(LearningSet.id == learning_set_id).first()
    
    if not db_learning_set:
        raise HTTPException(status_code=404, detail="Learning set not found")
    
    # Check if user has edit permissions
    if db_learning_set.created_by != current_user.id:
        user_permission = next(
            (perm for perm in db_learning_set.permissions if perm.user_id == current_user.id),
            None
        )
        if not user_permission or user_permission.role not in [PermissionRole.OWNER, PermissionRole.EDITOR]:
            raise HTTPException(status_code=403, detail="Insufficient permissions to edit this learning set")
    
    # If changing collections, verify access to new collections
    if learning_set_update.collection_ids is not None:
        if learning_set_update.collection_ids:
            for collection_id in learning_set_update.collection_ids:
                new_collection = db.query(Collection).filter(Collection.id == collection_id).first()
                if not new_collection:
                    raise HTTPException(status_code=404, detail=f"Collection {collection_id} not found")
                if new_collection.created_by != current_user.id:
                    raise HTTPException(status_code=403, detail=f"Access denied to collection {collection_id}")
            
            # Update collections
            collections = db.query(Collection).filter(Collection.id.in_(learning_set_update.collection_ids)).all()
            db_learning_set.collections = collections
        else:
            # Clear all collections
            db_learning_set.collections = []
    
    # Update other fields
    update_data = learning_set_update.model_dump(exclude_unset=True, exclude={'collection_ids'})
    for field, value in update_data.items():
        setattr(db_learning_set, field, value)
    
    db.commit()
    db.refresh(db_learning_set)
    return db_learning_set

@router.delete("/learning-sets/{learning_set_id}")
async def delete_learning_set(
    learning_set_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a learning set."""
    db_learning_set = db.query(LearningSet).options(
        selectinload(LearningSet.permissions)
    ).filter(LearningSet.id == learning_set_id).first()
    
    if not db_learning_set:
        raise HTTPException(status_code=404, detail="Learning set not found")
    
    # Check if user has owner permissions
    if db_learning_set.created_by != current_user.id:
        user_permission = next(
            (perm for perm in db_learning_set.permissions if perm.user_id == current_user.id),
            None
        )
        if not user_permission or user_permission.role != PermissionRole.OWNER:
            raise HTTPException(status_code=403, detail="Only owners can delete learning sets")
    
    # Delete associated permissions first to avoid foreign key constraint violation
    db.query(Permission).filter(Permission.learning_set_id == learning_set_id).delete()
    
    db.delete(db_learning_set)
    db.commit()
    return {"message": "Learning set deleted successfully"}

# Vocabulary Item endpoints
@router.post("/vocabulary", response_model=VocabularyItemResponse)
async def create_vocabulary_item(
    vocabulary: VocabularyItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new vocabulary item."""
    # Verify learning set exists and user has edit access
    learning_set = db.query(LearningSet).options(
        selectinload(LearningSet.permissions)
    ).filter(LearningSet.id == vocabulary.learning_set_id).first()
    
    if not learning_set:
        raise HTTPException(status_code=404, detail="Learning set not found")
    
    # Check edit permissions
    if learning_set.created_by != current_user.id:
        user_permission = next(
            (perm for perm in learning_set.permissions if perm.user_id == current_user.id),
            None
        )
        if not user_permission or user_permission.role not in [PermissionRole.OWNER, PermissionRole.EDITOR]:
            raise HTTPException(status_code=403, detail="Insufficient permissions to add vocabulary")
    
    db_vocabulary = VocabularyItem(
        id=str(uuid4()),
        word=vocabulary.word,
        definition=vocabulary.definition,
        example_sentence=vocabulary.example_sentence,
        part_of_speech=vocabulary.part_of_speech,
        difficulty_level=vocabulary.difficulty_level,
        learning_set_id=vocabulary.learning_set_id
    )
    db.add(db_vocabulary)
    db.commit()
    db.refresh(db_vocabulary)
    return db_vocabulary

@router.get("/vocabulary/{vocabulary_id}", response_model=VocabularyItemResponse)
async def get_vocabulary_item(
    vocabulary_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific vocabulary item by ID."""
    vocabulary = db.query(VocabularyItem).join(LearningSet).options(
        selectinload(VocabularyItem.learning_set).selectinload(LearningSet.permissions)
    ).filter(VocabularyItem.id == vocabulary_id).first()
    
    if not vocabulary:
        raise HTTPException(status_code=404, detail="Vocabulary item not found")
    
    # Check access to the learning set
    learning_set = vocabulary.learning_set
    if learning_set.created_by != current_user.id:
        has_permission = any(perm.user_id == current_user.id for perm in learning_set.permissions)
        if not has_permission:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return vocabulary

@router.put("/vocabulary/{vocabulary_id}", response_model=VocabularyItemResponse)
async def update_vocabulary_item(
    vocabulary_id: str,
    vocabulary_update: VocabularyItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a vocabulary item."""
    db_vocabulary = db.query(VocabularyItem).join(LearningSet).options(
        selectinload(VocabularyItem.learning_set).selectinload(LearningSet.permissions)
    ).filter(VocabularyItem.id == vocabulary_id).first()
    
    if not db_vocabulary:
        raise HTTPException(status_code=404, detail="Vocabulary item not found")
    
    # Check edit permissions
    learning_set = db_vocabulary.learning_set
    if learning_set.created_by != current_user.id:
        user_permission = next(
            (perm for perm in learning_set.permissions if perm.user_id == current_user.id),
            None
        )
        if not user_permission or user_permission.role not in [PermissionRole.OWNER, PermissionRole.EDITOR]:
            raise HTTPException(status_code=403, detail="Insufficient permissions to edit vocabulary")
    
    # Update fields
    update_data = vocabulary_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_vocabulary, field, value)
    
    db.commit()
    db.refresh(db_vocabulary)
    return db_vocabulary

@router.delete("/vocabulary/{vocabulary_id}")
async def delete_vocabulary_item(
    vocabulary_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a vocabulary item."""
    db_vocabulary = db.query(VocabularyItem).join(LearningSet).options(
        selectinload(VocabularyItem.learning_set).selectinload(LearningSet.permissions)
    ).filter(VocabularyItem.id == vocabulary_id).first()
    
    if not db_vocabulary:
        raise HTTPException(status_code=404, detail="Vocabulary item not found")
    
    # Check edit permissions
    learning_set = db_vocabulary.learning_set
    if learning_set.created_by != current_user.id:
        user_permission = next(
            (perm for perm in learning_set.permissions if perm.user_id == current_user.id),
            None
        )
        if not user_permission or user_permission.role not in [PermissionRole.OWNER, PermissionRole.EDITOR]:
            raise HTTPException(status_code=403, detail="Insufficient permissions to delete vocabulary")
    
    db.delete(db_vocabulary)
    db.commit()
    return {"message": "Vocabulary item deleted successfully"}

# Grammar Topic endpoints
@router.post("/grammar", response_model=GrammarTopicResponse)
async def create_grammar_topic(
    grammar: GrammarTopicCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new grammar topic."""
    # Verify learning set exists and user has edit access
    learning_set = db.query(LearningSet).options(
        selectinload(LearningSet.permissions)
    ).filter(LearningSet.id == grammar.learning_set_id).first()
    
    if not learning_set:
        raise HTTPException(status_code=404, detail="Learning set not found")
    
    # Check edit permissions
    if learning_set.created_by != current_user.id:
        user_permission = next(
            (perm for perm in learning_set.permissions if perm.user_id == current_user.id),
            None
        )
        if not user_permission or user_permission.role not in [PermissionRole.OWNER, PermissionRole.EDITOR]:
            raise HTTPException(status_code=403, detail="Insufficient permissions to add grammar topics")
    
    # Convert examples list to JSON string for storage
    examples_json = None
    if grammar.examples:
        import json
        examples_json = json.dumps(grammar.examples)
    
    db_grammar = GrammarTopic(
        id=str(uuid4()),
        name=grammar.name,
        description=grammar.description,
        rule_explanation=grammar.rule_explanation,
        examples=examples_json,
        difficulty=grammar.difficulty,  # No conversion needed, both enums use lowercase
        learning_set_id=grammar.learning_set_id
    )
    db.add(db_grammar)
    db.commit()
    db.refresh(db_grammar)
    
    # Parse examples back to list for response
    if db_grammar.examples:
        import json
        try:
            db_grammar.examples = json.loads(db_grammar.examples)
        except (json.JSONDecodeError, TypeError):
            db_grammar.examples = []
    
    return db_grammar

@router.get("/grammar/{grammar_id}", response_model=GrammarTopicResponse)
async def get_grammar_topic(
    grammar_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific grammar topic by ID."""
    grammar = db.query(GrammarTopic).join(LearningSet).options(
        selectinload(GrammarTopic.learning_set).selectinload(LearningSet.permissions)
    ).filter(GrammarTopic.id == grammar_id).first()
    
    if not grammar:
        raise HTTPException(status_code=404, detail="Grammar topic not found")
    
    # Check access to the learning set
    learning_set = grammar.learning_set
    if learning_set.created_by != current_user.id:
        has_permission = any(perm.user_id == current_user.id for perm in learning_set.permissions)
        if not has_permission:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return grammar

@router.put("/grammar/{grammar_id}", response_model=GrammarTopicResponse)
async def update_grammar_topic(
    grammar_id: str,
    grammar_update: GrammarTopicUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a grammar topic."""
    db_grammar = db.query(GrammarTopic).join(LearningSet).options(
        selectinload(GrammarTopic.learning_set).selectinload(LearningSet.permissions)
    ).filter(GrammarTopic.id == grammar_id).first()
    
    if not db_grammar:
        raise HTTPException(status_code=404, detail="Grammar topic not found")
    
    # Check edit permissions
    learning_set = db_grammar.learning_set
    if learning_set.created_by != current_user.id:
        user_permission = next(
            (perm for perm in learning_set.permissions if perm.user_id == current_user.id),
            None
        )
        if not user_permission or user_permission.role not in [PermissionRole.OWNER, PermissionRole.EDITOR]:
            raise HTTPException(status_code=403, detail="Insufficient permissions to edit grammar topics")
    
    # Update fields
    update_data = grammar_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "examples" and value is not None:
            import json
            value = json.dumps(value)
        elif field == "difficulty" and value is not None:
            # No conversion needed, both enums use lowercase
            pass
        setattr(db_grammar, field, value)
    
    db.commit()
    db.refresh(db_grammar)
    
    # Parse examples back to list for response
    if db_grammar.examples:
        import json
        try:
            db_grammar.examples = json.loads(db_grammar.examples)
        except (json.JSONDecodeError, TypeError):
            db_grammar.examples = []
    
    return db_grammar

@router.delete("/grammar/{grammar_id}")
async def delete_grammar_topic(
    grammar_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a grammar topic."""
    db_grammar = db.query(GrammarTopic).join(LearningSet).options(
        selectinload(GrammarTopic.learning_set).selectinload(LearningSet.permissions)
    ).filter(GrammarTopic.id == grammar_id).first()
    
    if not db_grammar:
        raise HTTPException(status_code=404, detail="Grammar topic not found")
    
    # Check edit permissions
    learning_set = db_grammar.learning_set
    if learning_set.created_by != current_user.id:
        user_permission = next(
            (perm for perm in learning_set.permissions if perm.user_id == current_user.id),
            None
        )
        if not user_permission or user_permission.role not in [PermissionRole.OWNER, PermissionRole.EDITOR]:
            raise HTTPException(status_code=403, detail="Insufficient permissions to delete grammar topics")
    
    db.delete(db_grammar)
    db.commit()
    return {"message": "Grammar topic deleted successfully"}

# Permission management endpoints
@router.post("/learning-sets/{learning_set_id}/permissions", response_model=PermissionResponse)
async def grant_permission(
    learning_set_id: str,
    permission: PermissionGrant,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Grant permission to a user for a learning set."""
    # Verify learning set exists and user is owner
    learning_set = db.query(LearningSet).options(
        selectinload(LearningSet.permissions)
    ).filter(LearningSet.id == learning_set_id).first()
    
    if not learning_set:
        raise HTTPException(status_code=404, detail="Learning set not found")
    
    # Check if current user is owner
    if learning_set.created_by != current_user.id:
        user_permission = next(
            (perm for perm in learning_set.permissions if perm.user_id == current_user.id),
            None
        )
        if not user_permission or user_permission.role != PermissionRole.OWNER:
            raise HTTPException(status_code=403, detail="Only owners can grant permissions")
    
    # Verify target user exists
    target_user = db.query(User).filter(User.id == permission.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")
    
    # Check if permission already exists
    existing_permission = db.query(Permission).filter(
        and_(
            Permission.user_id == permission.user_id,
            Permission.learning_set_id == learning_set_id
        )
    ).first()
    
    if existing_permission:
        # Update existing permission
        existing_permission.role = permission.role
        existing_permission.granted_by = current_user.id
        db.commit()
        db.refresh(existing_permission)
        return existing_permission
    else:
        # Create new permission
        db_permission = Permission(
            id=str(uuid4()),
            user_id=permission.user_id,
            learning_set_id=learning_set_id,
            role=permission.role,
            granted_by=current_user.id
        )
        db.add(db_permission)
        db.commit()
        db.refresh(db_permission)
        return db_permission

@router.get("/learning-sets/{learning_set_id}/permissions", response_model=List[PermissionResponse])
async def get_permissions(
    learning_set_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all permissions for a learning set."""
    # Verify learning set exists and user has access
    learning_set = db.query(LearningSet).options(
        selectinload(LearningSet.permissions)
    ).filter(LearningSet.id == learning_set_id).first()
    
    if not learning_set:
        raise HTTPException(status_code=404, detail="Learning set not found")
    
    # Check if user has access
    if learning_set.created_by != current_user.id:
        has_permission = any(perm.user_id == current_user.id for perm in learning_set.permissions)
        if not has_permission:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return learning_set.permissions

@router.delete("/permissions/{permission_id}")
async def revoke_permission(
    permission_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke a permission."""
    permission = db.query(Permission).join(LearningSet).options(
        selectinload(Permission.learning_set).selectinload(LearningSet.permissions)
    ).filter(Permission.id == permission_id).first()
    
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    # Check if current user is owner of the learning set
    learning_set = permission.learning_set
    if learning_set.created_by != current_user.id:
        user_permission = next(
            (perm for perm in learning_set.permissions if perm.user_id == current_user.id),
            None
        )
        if not user_permission or user_permission.role != PermissionRole.OWNER:
            raise HTTPException(status_code=403, detail="Only owners can revoke permissions")
    
    # Don't allow revoking owner permission of the creator
    if permission.user_id == learning_set.created_by and permission.role == PermissionRole.OWNER:
        raise HTTPException(status_code=400, detail="Cannot revoke owner permission from creator")
    
    db.delete(permission)
    db.commit()
    return {"message": "Permission revoked successfully"}