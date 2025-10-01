"""
Tests for chat WebSocket functionality and API endpoints.
"""

import pytest
import json
import uuid
from datetime import datetime
from fastapi.websockets import WebSocket
from unittest.mock import Mock, AsyncMock, patch
from sqlalchemy.orm import Session

from models.database_models import User, ChatSession, ChatMessage, LearningSet, SenderType, UserRole
from services.chat_service import ChatManager
from auth.security import create_access_token

# Fixtures for test user and authentication
@pytest.fixture
def test_user(db_session: Session):
    """Create a test user in the database."""
    user = User(
        id=str(uuid.uuid4()),
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password",
        full_name="Test User",
        role=UserRole.STUDENT
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def auth_headers(test_user: User):
    """Create authentication headers for test user."""
    token = create_access_token(data={"sub": test_user.username})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def test_learning_set(db_session: Session, test_user: User):
    """Create a test learning set in the database."""
    learning_set = LearningSet(
        id=str(uuid.uuid4()),
        name="Test Learning Set",
        description="Test description",
        created_by=test_user.id,
        grade_level="10",
        subject="English"
    )
    db_session.add(learning_set)
    db_session.commit()
    db_session.refresh(learning_set)
    return learning_set

@pytest.fixture
def test_chat_session(db_session: Session, test_user: User, test_learning_set: LearningSet):
    """Create a test chat session in the database."""
    chat_session = ChatSession(
        id=str(uuid.uuid4()),
        user_id=test_user.id,
        learning_set_id=test_learning_set.id,
        start_time=datetime.utcnow(),
        total_messages=0,
        grammar_corrections=0
    )
    db_session.add(chat_session)
    db_session.commit()
    db_session.refresh(chat_session)
    return chat_session


class TestChatAPI:
    """Test chat API endpoints."""
    
    def test_create_chat_session(self, client, auth_headers, test_user, test_learning_set):
        """Test creating a new chat session."""
        # Store IDs to avoid detached instance errors
        learning_set_id = test_learning_set.id
        user_id = test_user.id
        
        response = client.post(
            "/api/chat/sessions",
            json={"learning_set_id": learning_set_id},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["learning_set_id"] == learning_set_id
        assert data["user_id"] == user_id
    
    def test_create_chat_session_invalid_learning_set(self, client, auth_headers):
        """Test creating chat session with invalid learning set."""
        response = client.post(
            "/api/chat/sessions",
            json={"learning_set_id": "invalid-id"},
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "Learning set not found" in response.json()["detail"]
    
    def test_get_chat_session(self, client, auth_headers, test_chat_session):
        """Test retrieving a chat session."""
        response = client.get(
            f"/api/chat/sessions/{test_chat_session.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_chat_session.id
        assert data["user_id"] == test_chat_session.user_id
    
    def test_get_chat_session_not_found(self, client, auth_headers):
        """Test retrieving non-existent chat session."""
        response = client.get(
            "/api/chat/sessions/invalid-id",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "Chat session not found" in response.json()["detail"]
    
    def test_get_chat_messages(self, client, auth_headers, db_session, test_chat_session):
        """Test retrieving chat messages."""
        # Create test messages
        messages = [
            ChatMessage(
                id=str(uuid.uuid4()),
                session_id=test_chat_session.id,
                content="Hello",
                sender=SenderType.USER,
                timestamp=datetime.utcnow()
            ),
            ChatMessage(
                id=str(uuid.uuid4()),
                session_id=test_chat_session.id,
                content="Hi there!",
                sender=SenderType.AI,
                timestamp=datetime.utcnow()
            )
        ]
        for msg in messages:
            db_session.add(msg)
        db_session.commit()
        
        response = client.get(
            f"/api/chat/sessions/{test_chat_session.id}/messages",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["content"] == "Hello"
        assert data[1]["content"] == "Hi there!"
    
    def test_end_chat_session(self, client, auth_headers, test_chat_session):
        """Test ending a chat session."""
        response = client.put(
            f"/api/chat/sessions/{test_chat_session.id}/end",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        assert "Chat session ended successfully" in response.json()["message"]
    
    def test_get_user_chat_sessions(self, client, auth_headers, db_session, test_user, test_learning_set):
        """Test retrieving user's chat sessions."""
        # Create multiple chat sessions
        sessions = []
        for i in range(2):
            session = ChatSession(
                id=str(uuid.uuid4()),
                user_id=test_user.id,
                learning_set_id=test_learning_set.id,
                start_time=datetime.utcnow(),
                total_messages=5 * (i + 1),
                grammar_corrections=i + 1
            )
            db_session.add(session)
            sessions.append(session)
        db_session.commit()
        
        response = client.get("/api/chat/sessions", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2  # At least our 2 sessions
    
    @patch('services.ai_tutor_service.ai_tutor_service.health_check')
    def test_ai_health_check_healthy(self, mock_health_check, client):
        """Test AI health check endpoint when healthy."""
        mock_health_check.return_value = {
            "status": "healthy",
            "model": "gpt-4-turbo-preview",
            "api_key_configured": True
        }
        
        response = client.get("/api/chat/ai/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["model"] == "gpt-4-turbo-preview"
    
    @patch('services.ai_tutor_service.ai_tutor_service.health_check')
    def test_ai_health_check_unhealthy(self, mock_health_check, client):
        """Test AI health check endpoint when unhealthy."""
        mock_health_check.return_value = {
            "status": "unhealthy",
            "error": "API key not configured",
            "api_key_configured": False
        }
        
        response = client.get("/api/chat/ai/health")
        
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unhealthy"
        assert "API key not configured" in data["error"]
    
    @patch('services.ai_tutor_service.ai_tutor_service.get_conversation_starter')
    def test_get_conversation_starter(self, mock_get_starter, client, auth_headers, test_chat_session):
        """Test getting conversation starter."""
        mock_get_starter.return_value = "Hello! Let's practice English together."
        
        response = client.get(
            f"/api/chat/sessions/{test_chat_session.id}/starter",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["starter"] == "Hello! Let's practice English together."
    
    def test_get_conversation_starter_invalid_session(self, client, auth_headers):
        """Test getting conversation starter for invalid session."""
        response = client.get(
            "/api/chat/sessions/invalid-id/starter",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "Chat session not found" in response.json()["detail"]
    
    @patch('services.ai_tutor_service.ai_tutor_service.analyze_message')
    def test_analyze_message(self, mock_analyze, client, auth_headers, test_chat_session):
        """Test message analysis endpoint."""
        mock_analyze.return_value = {
            "corrections": [
                {
                    "original": "I goed",
                    "corrected": "I went",
                    "explanation": "Past tense of 'go' is 'went'",
                    "grammar_rule": "Irregular verbs"
                }
            ],
            "vocabulary_used": [
                {
                    "word": "practice",
                    "used_correctly": True,
                    "context": "Used correctly in sentence"
                }
            ],
            "encouragement": "Great job!"
        }
        
        response = client.post(
            f"/api/chat/sessions/{test_chat_session.id}/analyze",
            json={"content": "I goed to practice English"},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["corrections"]) == 1
        assert data["corrections"][0]["original"] == "I goed"
        assert len(data["vocabulary_used"]) == 1
        assert data["vocabulary_used"][0]["word"] == "practice"
        assert data["encouragement"] == "Great job!"
    
    def test_analyze_message_invalid_session(self, client, auth_headers):
        """Test message analysis for invalid session."""
        response = client.post(
            "/api/chat/sessions/invalid-id/analyze",
            json={"content": "Test message"},
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "Chat session not found" in response.json()["detail"]


class TestChatManager:
    """Test ChatManager WebSocket functionality."""
    
    @pytest.fixture
    def chat_manager(self):
        return ChatManager()
    
    @pytest.fixture
    def mock_websocket(self):
        websocket = Mock(spec=WebSocket)
        websocket.accept = AsyncMock()
        websocket.send_text = AsyncMock()
        websocket.close = AsyncMock()
        return websocket
    
    @pytest.mark.asyncio
    async def test_connect_websocket(self, chat_manager, mock_websocket):
        """Test WebSocket connection."""
        session_id = "test-session"
        user_id = "test-user"
        
        await chat_manager.connect(mock_websocket, session_id, user_id)
        
        mock_websocket.accept.assert_called_once()
        assert session_id in chat_manager.active_connections
        assert user_id in chat_manager.active_connections[session_id]
        assert chat_manager.active_connections[session_id][user_id] == mock_websocket
    
    def test_disconnect_websocket(self, chat_manager, mock_websocket):
        """Test WebSocket disconnection."""
        session_id = "test-session"
        user_id = "test-user"
        
        # Manually add connection
        chat_manager.active_connections[session_id] = {user_id: mock_websocket}
        
        chat_manager.disconnect(mock_websocket, session_id)
        
        assert session_id not in chat_manager.active_connections
    
    @pytest.mark.asyncio
    async def test_send_message_to_session(self, chat_manager, mock_websocket):
        """Test sending message to all users in a session."""
        session_id = "test-session"
        user_id = "test-user"
        message = {"content": "Hello", "sender": "user"}
        
        # Add connection
        chat_manager.active_connections[session_id] = {user_id: mock_websocket}
        
        await chat_manager.send_message_to_session(session_id, message)
        
        mock_websocket.send_text.assert_called_once_with(json.dumps(message))
    
    @pytest.mark.asyncio
    async def test_send_message_to_user(self, chat_manager, mock_websocket):
        """Test sending message to specific user."""
        session_id = "test-session"
        user_id = "test-user"
        message = {"content": "Hello", "sender": "ai"}
        
        # Add connection
        chat_manager.active_connections[session_id] = {user_id: mock_websocket}
        
        await chat_manager.send_message_to_user(session_id, user_id, message)
        
        mock_websocket.send_text.assert_called_once_with(json.dumps(message))
    
    def test_get_session_users(self, chat_manager, mock_websocket):
        """Test getting users in a session."""
        session_id = "test-session"
        user_id = "test-user"
        
        # Add connection
        chat_manager.active_connections[session_id] = {user_id: mock_websocket}
        
        users = chat_manager.get_session_users(session_id)
        
        assert users == [user_id]
    
    def test_get_active_sessions(self, chat_manager, mock_websocket):
        """Test getting active sessions."""
        session_id = "test-session"
        user_id = "test-user"
        
        # Add connection
        chat_manager.active_connections[session_id] = {user_id: mock_websocket}
        
        sessions = chat_manager.get_active_sessions()
        
        assert sessions == [session_id]
    
    @pytest.mark.asyncio
    async def test_broadcast_typing_indicator(self, chat_manager):
        """Test broadcasting typing indicator."""
        session_id = "test-session"
        user1_id = "user1"
        user2_id = "user2"
        
        mock_ws1 = Mock(spec=WebSocket)
        mock_ws1.send_text = AsyncMock()
        mock_ws2 = Mock(spec=WebSocket)
        mock_ws2.send_text = AsyncMock()
        
        # Add connections
        chat_manager.active_connections[session_id] = {
            user1_id: mock_ws1,
            user2_id: mock_ws2
        }
        
        await chat_manager.broadcast_typing_indicator(session_id, user1_id, True)
        
        # user1 should not receive their own typing indicator
        mock_ws1.send_text.assert_not_called()
        # user2 should receive the typing indicator
        mock_ws2.send_text.assert_called_once()
    
    def test_get_connection_stats(self, chat_manager, mock_websocket):
        """Test getting connection statistics."""
        session_id = "test-session"
        user_id = "test-user"
        
        # Add connection
        chat_manager.active_connections[session_id] = {user_id: mock_websocket}
        
        stats = chat_manager.get_connection_stats()
        
        assert stats["total_sessions"] == 1
        assert stats["total_connections"] == 1
        assert session_id in stats["sessions"]
        assert stats["sessions"][session_id]["user_count"] == 1
        assert stats["sessions"][session_id]["users"] == [user_id]

class TestWebSocketIntegration:
    """Test WebSocket integration with FastAPI."""
    
    @pytest.mark.asyncio
    async def test_websocket_endpoint_authentication_failure(self, client):
        """Test WebSocket endpoint with invalid authentication."""
        with pytest.raises(Exception):
            with client.websocket_connect("/api/chat/ws/test-session?token=invalid") as websocket:
                # Should close connection due to invalid token
                websocket.receive_text()
    
    @pytest.mark.asyncio
    async def test_websocket_message_flow(self, client, test_user, test_chat_session):
        """Test complete WebSocket message flow."""
        # Create a valid token for the user
        token = create_access_token(data={"sub": test_user.username})
        
        # Note: Full WebSocket testing with database operations would require
        # more sophisticated async WebSocket testing tools. This is a placeholder
        # for more comprehensive integration tests.
        pass

if __name__ == "__main__":
    pytest.main([__file__])