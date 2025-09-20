"""
FastAPI endpoints for class creation, management, and collaboration features.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import secrets
import string
from uuid import uuid4

from database.connection import get_db
from auth.dependencies import get_current_user
from models.database_models import User, Class, Permission, LearningSet, PermissionRole as DBPermissionRole
from models.pydantic_models import (
    ClassCreate, ClassUpdate, ClassResponse, UserResponse,
    PermissionCreate, PermissionGrant, PermissionResponse, PermissionRole
)

router = APIRouter(prefix="/collaboration", tags=["collaboration"])

def generate_invite_code() -> str:
    """Generate a unique 8-character invite code."""
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))

@router.post("/classes", response_model=ClassResponse)
async def create_class(
    class_data: ClassCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new class. Only teachers can create classes."""
    if current_user.role.value != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can create classes"
        )
    
    # Generate unique invite code
    invite_code = generate_invite_code()
    while db.query(Class).filter(Class.invite_code == invite_code).first():
        invite_code = generate_invite_code()
    
    db_class = Class(
        id=str(uuid4()),
        name=class_data.name,
        description=class_data.description,
        teacher_id=current_user.id,
        invite_code=invite_code
    )
    
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    
    return ClassResponse.model_validate(db_class)

@router.get("/classes", response_model=List[ClassResponse])
async def get_user_classes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all classes for the current user (taught or enrolled)."""
    query = db.query(Class).options(joinedload(Class.students))
    
    if current_user.role.value == "teacher":
        # Teachers see classes they teach
        classes = query.filter(Class.teacher_id == current_user.id).all()
    else:
        # Students see classes they're enrolled in
        classes = query.join(Class.students).filter(User.id == current_user.id).all()
    
    return [ClassResponse.model_validate(cls) for cls in classes]

@router.get("/classes/{class_id}", response_model=ClassResponse)
async def get_class(
    class_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific class with members."""
    db_class = db.query(Class).options(
        joinedload(Class.students),
        joinedload(Class.shared_content)
    ).filter(Class.id == class_id).first()
    
    if not db_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Check if user has access to this class
    is_teacher = db_class.teacher_id == current_user.id
    is_student = current_user in db_class.students
    
    if not (is_teacher or is_student):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this class"
        )
    
    return ClassResponse.model_validate(db_class)

@router.put("/classes/{class_id}", response_model=ClassResponse)
async def update_class(
    class_id: str,
    class_update: ClassUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a class. Only the teacher can update their class."""
    db_class = db.query(Class).filter(Class.id == class_id).first()
    
    if not db_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    if db_class.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the class teacher can update this class"
        )
    
    # Update fields
    update_data = class_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_class, field, value)
    
    db.commit()
    db.refresh(db_class)
    
    return ClassResponse.model_validate(db_class)

@router.delete("/classes/{class_id}")
async def delete_class(
    class_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a class. Only the teacher can delete their class."""
    db_class = db.query(Class).filter(Class.id == class_id).first()
    
    if not db_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    if db_class.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the class teacher can delete this class"
        )
    
    db.delete(db_class)
    db.commit()
    
    return {"message": "Class deleted successfully"}

@router.post("/classes/{class_id}/join")
async def join_class_by_code(
    invite_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join a class using an invite code."""
    db_class = db.query(Class).filter(
        Class.invite_code == invite_code,
        Class.is_active == True
    ).first()
    
    if not db_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invite code or class not active"
        )
    
    # Check if user is already enrolled
    if current_user in db_class.students:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already enrolled in this class"
        )
    
    # Check if user is the teacher
    if db_class.teacher_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teachers cannot join their own class as students"
        )
    
    # Add student to class
    db_class.students.append(current_user)
    db.commit()
    
    return {"message": f"Successfully joined class: {db_class.name}"}

@router.delete("/classes/{class_id}/students/{student_id}")
async def remove_student(
    class_id: str,
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a student from a class. Only teachers can remove students."""
    db_class = db.query(Class).options(joinedload(Class.students)).filter(Class.id == class_id).first()
    
    if not db_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    if db_class.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the class teacher can remove students"
        )
    
    # Find student
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    if student not in db_class.students:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student is not enrolled in this class"
        )
    
    # Remove student from class
    db_class.students.remove(student)
    db.commit()
    
    return {"message": f"Student {student.username} removed from class"}

@router.post("/classes/{class_id}/share/{learning_set_id}")
async def share_content_with_class(
    class_id: str,
    learning_set_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Share a learning set with a class."""
    # Check if class exists and user has permission
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Check if user is teacher or has permission to share content
    is_teacher = db_class.teacher_id == current_user.id
    is_student = current_user in db_class.students
    
    if not (is_teacher or is_student):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this class"
        )
    
    # Check if learning set exists and user has permission
    learning_set = db.query(LearningSet).filter(LearningSet.id == learning_set_id).first()
    if not learning_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning set not found"
        )
    
    # Check if user owns the learning set or has editor/owner permission
    is_owner = learning_set.created_by == current_user.id
    permission = db.query(Permission).filter(
        Permission.user_id == current_user.id,
        Permission.learning_set_id == learning_set_id,
        Permission.role.in_([DBPermissionRole.EDITOR, DBPermissionRole.OWNER])
    ).first()
    
    if not (is_owner or permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to share this content"
        )
    
    # Check if already shared
    if learning_set in db_class.shared_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content is already shared with this class"
        )
    
    # Share content with class
    db_class.shared_content.append(learning_set)
    db.commit()
    
    return {"message": f"Learning set '{learning_set.name}' shared with class '{db_class.name}'"}

@router.delete("/classes/{class_id}/share/{learning_set_id}")
async def unshare_content_from_class(
    class_id: str,
    learning_set_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a learning set from class sharing."""
    db_class = db.query(Class).options(joinedload(Class.shared_content)).filter(Class.id == class_id).first()
    
    if not db_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Only teacher or content owner can unshare
    learning_set = db.query(LearningSet).filter(LearningSet.id == learning_set_id).first()
    if not learning_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning set not found"
        )
    
    is_teacher = db_class.teacher_id == current_user.id
    is_content_owner = learning_set.created_by == current_user.id
    
    if not (is_teacher or is_content_owner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the class teacher or content owner can unshare content"
        )
    
    if learning_set not in db_class.shared_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content is not shared with this class"
        )
    
    # Remove from shared content
    db_class.shared_content.remove(learning_set)
    db.commit()
    
    return {"message": f"Learning set '{learning_set.name}' unshared from class '{db_class.name}'"}

@router.post("/permissions", response_model=PermissionResponse)
async def grant_permission(
    permission_data: PermissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Grant permission to a user for a learning set."""
    # Check if learning set exists
    learning_set = db.query(LearningSet).filter(LearningSet.id == permission_data.learning_set_id).first()
    if not learning_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning set not found"
        )
    
    # Check if current user has permission to grant access
    is_owner = learning_set.created_by == current_user.id
    existing_permission = db.query(Permission).filter(
        Permission.user_id == current_user.id,
        Permission.learning_set_id == permission_data.learning_set_id,
        Permission.role == DBPermissionRole.OWNER
    ).first()
    
    if not (is_owner or existing_permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can grant permissions"
        )
    
    # Check if user exists
    target_user = db.query(User).filter(User.id == permission_data.user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if permission already exists
    existing = db.query(Permission).filter(
        Permission.user_id == permission_data.user_id,
        Permission.learning_set_id == permission_data.learning_set_id
    ).first()
    
    if existing:
        # Update existing permission
        existing.role = DBPermissionRole(permission_data.role.value)
        db.commit()
        db.refresh(existing)
        return PermissionResponse.model_validate(existing)
    
    # Create new permission
    db_permission = Permission(
        id=str(uuid4()),
        user_id=permission_data.user_id,
        learning_set_id=permission_data.learning_set_id,
        role=DBPermissionRole(permission_data.role.value),
        granted_by=current_user.id
    )
    
    db.add(db_permission)
    db.commit()
    db.refresh(db_permission)
    
    return PermissionResponse.model_validate(db_permission)

@router.get("/permissions/learning-set/{learning_set_id}", response_model=List[PermissionResponse])
async def get_learning_set_permissions(
    learning_set_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all permissions for a learning set."""
    # Check if learning set exists
    learning_set = db.query(LearningSet).filter(LearningSet.id == learning_set_id).first()
    if not learning_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning set not found"
        )
    
    # Check if user has permission to view permissions
    is_owner = learning_set.created_by == current_user.id
    user_permission = db.query(Permission).filter(
        Permission.user_id == current_user.id,
        Permission.learning_set_id == learning_set_id
    ).first()
    
    if not (is_owner or user_permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to view permissions"
        )
    
    permissions = db.query(Permission).filter(Permission.learning_set_id == learning_set_id).all()
    return [PermissionResponse.model_validate(perm) for perm in permissions]

@router.delete("/permissions/{permission_id}")
async def revoke_permission(
    permission_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke a permission."""
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found"
        )
    
    # Check if learning set exists
    learning_set = db.query(LearningSet).filter(LearningSet.id == permission.learning_set_id).first()
    if not learning_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning set not found"
        )
    
    # Check if current user has permission to revoke
    is_owner = learning_set.created_by == current_user.id
    is_granter = permission.granted_by == current_user.id
    
    if not (is_owner or is_granter):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner or granter can revoke permissions"
        )
    
    db.delete(permission)
    db.commit()
    
    return {"message": "Permission revoked successfully"}

@router.get("/shared-content", response_model=List[dict])
async def get_shared_content(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all learning sets shared with the user through classes or direct permissions."""
    from models.pydantic_models import LearningSetResponse
    
    shared_content = []
    
    # Get content shared through classes
    if current_user.role.value == "student":
        for class_obj in current_user.enrolled_classes:
            for learning_set in class_obj.shared_content:
                shared_content.append({
                    "learning_set": LearningSetResponse.model_validate(learning_set),
                    "shared_via": "class",
                    "class_name": class_obj.name,
                    "permission": "viewer"
                })
    
    # Get content shared through direct permissions
    permissions = db.query(Permission).options(joinedload(Permission.learning_set)).filter(
        Permission.user_id == current_user.id
    ).all()
    
    for perm in permissions:
        shared_content.append({
            "learning_set": LearningSetResponse.model_validate(perm.learning_set),
            "shared_via": "permission",
            "permission": perm.role.value,
            "granted_by": perm.granted_by
        })
    
    return shared_content