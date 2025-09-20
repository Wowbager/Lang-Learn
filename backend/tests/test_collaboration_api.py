"""
Tests for collaboration API endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from uuid import uuid4

from main import app
from models.database_models import User, Class, LearningSet, Collection, Permission, UserRole, PermissionRole
from services.auth_service import create_access_token

# Remove global client - use fixture instead

@pytest.fixture
def teacher_user(db_session: Session):
    """Create a teacher user for testing."""
    user = User(
        id=str(uuid4()),
        username="teacher1",
        email="teacher@example.com",
        hashed_password="hashed_password",
        full_name="Test Teacher",
        role=UserRole.TEACHER
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def student_user(db_session: Session):
    """Create a student user for testing."""
    user = User(
        id=str(uuid4()),
        username="student1",
        email="student@example.com",
        hashed_password="hashed_password",
        full_name="Test Student",
        role=UserRole.STUDENT
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def another_student_user(db_session: Session):
    """Create another student user for testing."""
    user = User(
        id=str(uuid4()),
        username="student2",
        email="student2@example.com",
        hashed_password="hashed_password",
        full_name="Another Student",
        role=UserRole.STUDENT
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_class(db_session: Session, teacher_user: User):
    """Create a test class."""
    test_class = Class(
        id=str(uuid4()),
        name="Test Class",
        description="A test class",
        teacher_id=teacher_user.id,
        invite_code="TEST1234"
    )
    db_session.add(test_class)
    db_session.commit()
    db_session.refresh(test_class)
    return test_class

@pytest.fixture
def test_learning_set(db_session: Session, teacher_user: User):
    """Create a test learning set."""
    collection = Collection(
        id=str(uuid4()),
        name="Test Collection",
        created_by=teacher_user.id
    )
    db_session.add(collection)
    db_session.commit()
    
    learning_set = LearningSet(
        id=str(uuid4()),
        name="Test Learning Set",
        description="A test learning set",
        collection_id=collection.id,
        created_by=teacher_user.id
    )
    db_session.add(learning_set)
    db_session.commit()
    db_session.refresh(learning_set)
    return learning_set

def get_auth_headers(user: User):
    """Get authorization headers for a user."""
    token = create_access_token(data={"sub": user.username})
    return {"Authorization": f"Bearer {token}"}

class TestClassManagement:
    """Test class creation and management endpoints."""
    
    def test_create_class_as_teacher(self, client, teacher_user: User):
        """Test creating a class as a teacher."""
        # Store user ID before making the request (to avoid DetachedInstanceError)
        teacher_id = teacher_user.id
        headers = get_auth_headers(teacher_user)
        class_data = {
            "name": "New Test Class",
            "description": "A new test class"
        }
        
        response = client.post("/api/collaboration/classes", json=class_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == class_data["name"]
        assert data["description"] == class_data["description"]
        assert data["teacher_id"] == teacher_id
        assert len(data["invite_code"]) == 8
        assert data["is_active"] is True
    
    def test_create_class_as_student_forbidden(self, client, student_user: User):
        """Test that students cannot create classes."""
        headers = get_auth_headers(student_user)
        class_data = {
            "name": "Student Class",
            "description": "Should not be allowed"
        }
        
        response = client.post("/api/collaboration/classes", json=class_data, headers=headers)
        assert response.status_code == 403
    
    def test_get_user_classes_as_teacher(self, client, teacher_user: User, test_class: Class):
        """Test getting classes as a teacher."""
        headers = get_auth_headers(teacher_user)
        
        response = client.get("/api/collaboration/classes", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == test_class.id
        assert data[0]["name"] == test_class.name
    
    def test_get_user_classes_as_student(self, client, student_user: User, test_class: Class, db_session: Session):
        """Test getting classes as an enrolled student."""
        # Enroll student in class
        test_class.students.append(student_user)
        db_session.commit()
        
        headers = get_auth_headers(student_user)
        
        response = client.get("/api/collaboration/classes", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == test_class.id
    
    def test_get_class_detail(self, client, teacher_user: User, test_class: Class):
        """Test getting detailed class information."""
        headers = get_auth_headers(teacher_user)
        
        response = client.get(f"/api/collaboration/classes/{test_class.id}", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == test_class.id
        assert data["name"] == test_class.name
        assert "students" in data
    
    def test_get_class_detail_unauthorized(self, client, student_user: User, test_class: Class):
        """Test that unauthorized users cannot access class details."""
        headers = get_auth_headers(student_user)
        
        response = client.get(f"/api/collaboration/classes/{test_class.id}", headers=headers)
        assert response.status_code == 403
    
    def test_update_class_as_teacher(self, client, teacher_user: User, test_class: Class):
        """Test updating a class as the teacher."""
        headers = get_auth_headers(teacher_user)
        update_data = {
            "name": "Updated Class Name",
            "description": "Updated description"
        }
        
        response = client.put(f"/api/collaboration/classes/{test_class.id}", json=update_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["description"] == update_data["description"]
    
    def test_update_class_unauthorized(self, client, student_user: User, test_class: Class):
        """Test that non-teachers cannot update classes."""
        headers = get_auth_headers(student_user)
        update_data = {"name": "Hacked Class"}
        
        response = client.put(f"/api/collaboration/classes/{test_class.id}", json=update_data, headers=headers)
        assert response.status_code == 403
    
    def test_delete_class_as_teacher(self, client, teacher_user: User, test_class: Class):
        """Test deleting a class as the teacher."""
        headers = get_auth_headers(teacher_user)
        
        response = client.delete(f"/api/collaboration/classes/{test_class.id}", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data

class TestStudentEnrollment:
    """Test student enrollment functionality."""
    
    def test_join_class_with_valid_code(self, client, student_user: User, test_class: Class):
        """Test joining a class with a valid invite code."""
        headers = get_auth_headers(student_user)
        
        response = client.post(f"/api/collaboration/classes/{test_class.id}/join?invite_code={test_class.invite_code}", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
    
    def test_join_class_with_invalid_code(self, client, student_user: User):
        """Test joining a class with an invalid invite code."""
        headers = get_auth_headers(student_user)
        
        response = client.post("/api/collaboration/classes/nonexistent/join?invite_code=INVALID1", headers=headers)
        assert response.status_code == 404
    
    def test_join_class_already_enrolled(self, client, student_user: User, test_class: Class, db_session: Session):
        """Test joining a class when already enrolled."""
        # Enroll student first
        test_class.students.append(student_user)
        db_session.commit()
        
        headers = get_auth_headers(student_user)
        
        response = client.post(f"/api/collaboration/classes/{test_class.id}/join?invite_code={test_class.invite_code}", headers=headers)
        assert response.status_code == 400
    
    def test_teacher_cannot_join_own_class(self, client, teacher_user: User, test_class: Class):
        """Test that teachers cannot join their own class as students."""
        headers = get_auth_headers(teacher_user)
        
        response = client.post(f"/api/collaboration/classes/{test_class.id}/join?invite_code={test_class.invite_code}", headers=headers)
        assert response.status_code == 400
    
    def test_remove_student_as_teacher(self, client, teacher_user: User, student_user: User, test_class: Class, db_session: Session):
        """Test removing a student from a class as the teacher."""
        # Enroll student first
        test_class.students.append(student_user)
        db_session.commit()
        
        headers = get_auth_headers(teacher_user)
        
        response = client.delete(f"/api/collaboration/classes/{test_class.id}/students/{student_user.id}", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
    
    def test_remove_student_unauthorized(self, client, student_user: User, another_student_user: User, test_class: Class):
        """Test that students cannot remove other students."""
        headers = get_auth_headers(student_user)
        
        response = client.delete(f"/api/collaboration/classes/{test_class.id}/students/{another_student_user.id}", headers=headers)
        assert response.status_code == 403

class TestContentSharing:
    """Test content sharing functionality."""
    
    def test_share_content_with_class_as_teacher(self, client, teacher_user: User, test_class: Class, test_learning_set: LearningSet):
        """Test sharing content with a class as the teacher."""
        headers = get_auth_headers(teacher_user)
        
        response = client.post(f"/api/collaboration/classes/{test_class.id}/share/{test_learning_set.id}", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
    
    def test_share_content_unauthorized(self, client, student_user: User, test_class: Class, test_learning_set: LearningSet):
        """Test that unauthorized users cannot share content."""
        headers = get_auth_headers(student_user)
        
        response = client.post(f"/api/collaboration/classes/{test_class.id}/share/{test_learning_set.id}", headers=headers)
        assert response.status_code == 403
    
    def test_unshare_content_as_teacher(self, client, teacher_user: User, test_class: Class, test_learning_set: LearningSet, db_session: Session):
        """Test unsharing content from a class as the teacher."""
        # Share content first
        test_class.shared_content.append(test_learning_set)
        db_session.commit()
        
        headers = get_auth_headers(teacher_user)
        
        response = client.delete(f"/api/collaboration/classes/{test_class.id}/share/{test_learning_set.id}", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data

class TestPermissionManagement:
    """Test permission management functionality."""
    
    def test_grant_permission_as_owner(self, client, teacher_user: User, student_user: User, test_learning_set: LearningSet):
        """Test granting permission as the content owner."""
        # Store IDs before making the request (to avoid DetachedInstanceError)
        student_id = student_user.id
        learning_set_id = test_learning_set.id
        headers = get_auth_headers(teacher_user)
        permission_data = {
            "user_id": student_id,
            "learning_set_id": learning_set_id,
            "role": "VIEWER"
        }
        
        response = client.post("/api/collaboration/permissions", json=permission_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["user_id"] == student_id
        assert data["learning_set_id"] == learning_set_id
        assert data["role"] == "VIEWER"
    
    def test_grant_permission_unauthorized(self, client, student_user: User, another_student_user: User, test_learning_set: LearningSet):
        """Test that unauthorized users cannot grant permissions."""
        headers = get_auth_headers(student_user)
        permission_data = {
            "user_id": another_student_user.id,
            "learning_set_id": test_learning_set.id,
            "role": "VIEWER"
        }
        
        response = client.post("/api/collaboration/permissions", json=permission_data, headers=headers)
        assert response.status_code == 403
    
    def test_get_learning_set_permissions(self, client, teacher_user: User, test_learning_set: LearningSet):
        """Test getting permissions for a learning set."""
        headers = get_auth_headers(teacher_user)
        
        response = client.get(f"/api/collaboration/permissions/learning-set/{test_learning_set.id}", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_revoke_permission_as_owner(self, client, teacher_user: User, student_user: User, test_learning_set: LearningSet, db_session: Session):
        """Test revoking permission as the content owner."""
        # Create permission first
        permission = Permission(
            id=str(uuid4()),
            user_id=student_user.id,
            learning_set_id=test_learning_set.id,
            role=PermissionRole.VIEWER,
            granted_by=teacher_user.id
        )
        db_session.add(permission)
        db_session.commit()
        
        headers = get_auth_headers(teacher_user)
        
        response = client.delete(f"/api/collaboration/permissions/{permission.id}", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
    
    def test_get_shared_content(self, client, student_user: User, test_class: Class, test_learning_set: LearningSet, db_session: Session):
        """Test getting shared content for a user."""
        # Enroll student and share content
        test_class.students.append(student_user)
        test_class.shared_content.append(test_learning_set)
        db_session.commit()
        
        headers = get_auth_headers(student_user)
        
        response = client.get("/api/collaboration/shared-content", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)

class TestErrorHandling:
    """Test error handling in collaboration endpoints."""
    
    def test_class_not_found(self, client, teacher_user: User):
        """Test handling of non-existent class."""
        headers = get_auth_headers(teacher_user)
        
        response = client.get("/api/collaboration/classes/nonexistent", headers=headers)
        assert response.status_code == 404
    
    def test_learning_set_not_found(self, client, teacher_user: User, test_class: Class):
        """Test handling of non-existent learning set."""
        headers = get_auth_headers(teacher_user)
        
        response = client.post(f"/api/collaboration/classes/{test_class.id}/share/nonexistent", headers=headers)
        assert response.status_code == 404
    
    def test_permission_not_found(self, client, teacher_user: User):
        """Test handling of non-existent permission."""
        headers = get_auth_headers(teacher_user)
        
        response = client.delete("/api/collaboration/permissions/nonexistent", headers=headers)
        assert response.status_code == 404
    
    def test_unauthorized_access(self, client):
        """Test endpoints without authentication."""
        response = client.get("/api/collaboration/classes")
        assert response.status_code == 403