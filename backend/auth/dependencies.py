"""
Authentication dependencies for FastAPI endpoints.
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database.connection import get_db
from models.database_models import User, UserRole
from models.pydantic_models import TokenData
from auth.security import verify_token, create_credentials_exception

# Security scheme for Bearer token
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from JWT token.
    
    Args:
        credentials: Bearer token credentials
        db: Database session
        
    Returns:
        Current user object
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = create_credentials_exception()
    
    try:
        # Verify and decode token
        payload = verify_token(credentials.credentials)
        if payload is None:
            raise credentials_exception
            
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
            
        token_data = TokenData(username=username)
    except Exception:
        raise credentials_exception
    
    # Get user from database
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
        
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get the current active user (not disabled).
    
    Args:
        current_user: Current user from token
        
    Returns:
        Active user object
        
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

def require_role(required_role: UserRole):
    """
    Create a dependency that requires a specific user role.
    
    Args:
        required_role: The role required to access the endpoint
        
    Returns:
        Dependency function that checks user role
    """
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {required_role.value}"
            )
        return current_user
    
    return role_checker

def require_roles(allowed_roles: list[UserRole]):
    """
    Create a dependency that requires one of several user roles.
    
    Args:
        allowed_roles: List of roles that can access the endpoint
        
    Returns:
        Dependency function that checks user role
    """
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            allowed_role_names = [role.value for role in allowed_roles]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Allowed roles: {', '.join(allowed_role_names)}"
            )
        return current_user
    
    return role_checker

# Common role dependencies
require_teacher = require_role(UserRole.TEACHER)
require_student = require_role(UserRole.STUDENT)
require_parent = require_role(UserRole.PARENT)
require_teacher_or_parent = require_roles([UserRole.TEACHER, UserRole.PARENT])