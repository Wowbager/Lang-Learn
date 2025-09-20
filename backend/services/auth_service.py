"""
Authentication service layer for user management and authentication.
"""

import uuid
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from models.database_models import User, UserRole
from models.pydantic_models import UserCreate, UserUpdate, UserResponse
from auth.security import get_password_hash, verify_password, create_access_token

class AuthService:
    """Service class for authentication and user management operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_user(self, user_data: UserCreate) -> UserResponse:
        """
        Create a new user account.
        
        Args:
            user_data: User creation data
            
        Returns:
            Created user response
            
        Raises:
            HTTPException: If username or email already exists
        """
        # Check if username already exists
        existing_user = self.db.query(User).filter(
            (User.username == user_data.username) | (User.email == user_data.email)
        ).first()
        
        if existing_user:
            if existing_user.username == user_data.username:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already registered"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            id=str(uuid.uuid4()),
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            role=UserRole(user_data.role.lower()),
            grade_level=user_data.grade_level,
            curriculum_type=user_data.curriculum_type
        )
        
        try:
            self.db.add(db_user)
            self.db.commit()
            self.db.refresh(db_user)
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User creation failed due to data conflict"
            )
        
        return UserResponse.model_validate(db_user)
    
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """
        Authenticate a user with username and password.
        
        Args:
            username: Username or email
            password: Plain text password
            
        Returns:
            User object if authentication successful, None otherwise
        """
        # Allow login with either username or email
        user = self.db.query(User).filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if not user:
            return None
            
        if not verify_password(password, user.hashed_password):
            return None
            
        return user
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """
        Get user by ID.
        
        Args:
            user_id: User ID
            
        Returns:
            User object or None if not found
        """
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """
        Get user by username.
        
        Args:
            username: Username
            
        Returns:
            User object or None if not found
        """
        return self.db.query(User).filter(User.username == username).first()
    
    def update_user_profile(self, user_id: str, user_data: UserUpdate) -> UserResponse:
        """
        Update user profile information.
        
        Args:
            user_id: User ID to update
            user_data: Updated user data
            
        Returns:
            Updated user response
            
        Raises:
            HTTPException: If user not found or update conflicts
        """
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check for username/email conflicts if being updated
        if user_data.username and user_data.username != user.username:
            existing_user = self.db.query(User).filter(
                User.username == user_data.username,
                User.id != user_id
            ).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
        
        if user_data.email and user_data.email != user.email:
            existing_user = self.db.query(User).filter(
                User.email == user_data.email,
                User.id != user_id
            ).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already taken"
                )
        
        # Update user fields
        update_data = user_data.model_dump(exclude_unset=True)
        if 'role' in update_data:
            update_data['role'] = UserRole(update_data['role'].lower())
            
        for field, value in update_data.items():
            setattr(user, field, value)
        
        try:
            self.db.commit()
            self.db.refresh(user)
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Profile update failed due to data conflict"
            )
        
        return UserResponse.model_validate(user)
    
    def deactivate_user(self, user_id: str) -> bool:
        """
        Deactivate a user account.
        
        Args:
            user_id: User ID to deactivate
            
        Returns:
            True if successful, False if user not found
        """
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        user.is_active = False
        self.db.commit()
        return True
    
    def create_login_token(self, user: User) -> dict:
        """
        Create a login token for authenticated user.
        
        Args:
            user: Authenticated user
            
        Returns:
            Token response with access token and user info
        """
        access_token = create_access_token(data={"sub": user.username})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserResponse.model_validate(user)
        }