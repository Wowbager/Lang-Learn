"""
FastAPI WebSocket endpoints for real-time chat messaging with LangChain AI integration.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Dict, Optional, AsyncGenerator
import json
import uuid
import asyncio
from datetime import datetime

from database.connection import get_db
from models.database_models import ChatSession, ChatMessage, User, LearningSet, SenderType
from models.pydantic_models import ChatSessionCreate, ChatSessionResponse, ChatMessageResponse
from auth.dependencies import get_current_user
from auth.security import verify_token
from services.chat_service import ChatManager
from services.ai_tutor_service import ai_tutor_service

router = APIRouter(prefix="/chat", tags=["chat"])

# WebSocket connection manager
chat_manager = ChatManager()

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    token: str,
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for real-time chat messaging."""
    try:
        print(f"WebSocket connection attempt for session: {session_id}")
        
        # Verify and decode JWT token
        payload = verify_token(token)
        if not payload:
            print(f"Token validation failed")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        print(f"Token validated, payload: {payload}")
        
        # Extract username from token payload
        username: str = payload.get("sub")
        if not username:
            print(f"No username in token")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        print(f"Username from token: {username}")
        
        # Get user from database
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"User not found in database: {username}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        print(f"User found: {user.id}, {user.username}")
        
        # Verify session exists and user has access
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == user.id
        ).first()
        
        if not session:
            print(f"Session not found or user doesn't have access. Session ID: {session_id}, User ID: {user.id}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        print(f"Session validated: {session.id}")
            
        # Accept WebSocket connection
        await chat_manager.connect(websocket, session_id, user.id)
        print(f"WebSocket connection established for user {user.id} in session {session_id}")
        
        try:
            while True:
                # Receive message from client
                data = await websocket.receive_text()
                print(f"Received WebSocket data: {data}")
                
                try:
                    message_data = json.loads(data)
                except json.JSONDecodeError as e:
                    print(f"JSON decode error: {e}")
                    continue
                
                # Check if this is a control message (ping, pong, etc.)
                message_type = message_data.get("type")
                if message_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                    continue
                
                # Validate message has required content field
                if "content" not in message_data:
                    print(f"Message missing 'content' field: {message_data}")
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Message must contain 'content' field"
                    }))
                    continue
                
                # Create and save user message
                user_message = ChatMessage(
                    id=str(uuid.uuid4()),
                    session_id=session_id,
                    content=message_data["content"],
                    sender=SenderType.USER,
                    timestamp=datetime.utcnow()
                )
                
                db.add(user_message)
                db.commit()
                db.refresh(user_message)
                
                # Broadcast user message to all connected clients for this session
                await chat_manager.send_message_to_session(session_id, {
                    "id": user_message.id,
                    "content": user_message.content,
                    "sender": user_message.sender.value,
                    "timestamp": user_message.timestamp.isoformat(),
                    "corrections": None,
                    "vocabulary_used": None
                })
                
                # Get learning set for context-aware AI responses
                learning_set = db.query(LearningSet).filter(
                    LearningSet.id == session.learning_set_id
                ).first()
                
                if not learning_set:
                    await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
                    return
                
                # Get conversation history for context
                conversation_history = db.query(ChatMessage).filter(
                    ChatMessage.session_id == session_id
                ).order_by(ChatMessage.timestamp).all()
                
                # Analyze user message for corrections and vocabulary usage
                try:
                    analysis_result = await ai_tutor_service.analyze_message(
                        message_data["content"], 
                        learning_set
                    )
                    
                    # Update user message with analysis results
                    user_message.corrections = json.dumps(analysis_result.get("corrections", []))
                    user_message.vocabulary_used = json.dumps(analysis_result.get("vocabulary_used", []))
                    db.commit()
                    
                    # Send updated user message with analysis
                    await chat_manager.send_message_to_session(session_id, {
                        "id": user_message.id,
                        "content": user_message.content,
                        "sender": user_message.sender.value,
                        "timestamp": user_message.timestamp.isoformat(),
                        "corrections": analysis_result.get("corrections", []),
                        "vocabulary_used": analysis_result.get("vocabulary_used", [])
                    })
                    
                except Exception as e:
                    # If analysis fails, still send the message without analysis
                    await chat_manager.send_message_to_session(session_id, {
                        "id": user_message.id,
                        "content": user_message.content,
                        "sender": user_message.sender.value,
                        "timestamp": user_message.timestamp.isoformat(),
                        "corrections": None,
                        "vocabulary_used": None
                    })
                
                # Generate AI response using LangChain
                try:
                    # Send typing indicator
                    await chat_manager.send_message_to_session(session_id, {
                        "type": "typing_indicator",
                        "is_typing": True,
                        "sender": "ai"
                    })
                    
                    # Generate streaming AI response
                    ai_message_id = str(uuid.uuid4())
                    ai_response_content = ""
                    
                    async for chunk in ai_tutor_service.stream_response(
                        message_data["content"], 
                        learning_set, 
                        conversation_history
                    ):
                        ai_response_content += chunk
                        
                        # Send streaming chunk to client
                        await chat_manager.send_message_to_session(session_id, {
                            "type": "streaming_response",
                            "id": ai_message_id,
                            "chunk": chunk,
                            "sender": "ai"
                        })
                    
                    # Stop typing indicator
                    await chat_manager.send_message_to_session(session_id, {
                        "type": "typing_indicator",
                        "is_typing": False,
                        "sender": "ai"
                    })
                    
                    # Save complete AI message to database
                    ai_message = ChatMessage(
                        id=ai_message_id,
                        session_id=session_id,
                        content=ai_response_content,
                        sender=SenderType.AI,
                        timestamp=datetime.utcnow()
                    )
                    
                    db.add(ai_message)
                    db.commit()
                    db.refresh(ai_message)
                    
                    # Send final complete AI message
                    await chat_manager.send_message_to_session(session_id, {
                        "id": ai_message.id,
                        "content": ai_message.content,
                        "sender": ai_message.sender.value,
                        "timestamp": ai_message.timestamp.isoformat(),
                        "corrections": None,
                        "vocabulary_used": None,
                        "type": "complete_message"
                    })
                    
                except Exception as e:
                    # Fallback response if AI service fails
                    ai_response = "I'm having trouble responding right now. Could you try asking again?"
                    
                    ai_message = ChatMessage(
                        id=str(uuid.uuid4()),
                        session_id=session_id,
                        content=ai_response,
                        sender=SenderType.AI,
                        timestamp=datetime.utcnow()
                    )
                    
                    db.add(ai_message)
                    db.commit()
                    db.refresh(ai_message)
                    
                    await chat_manager.send_message_to_session(session_id, {
                        "id": ai_message.id,
                        "content": ai_message.content,
                        "sender": ai_message.sender.value,
                        "timestamp": ai_message.timestamp.isoformat(),
                        "corrections": None,
                        "vocabulary_used": None
                    })
                
                # Update session message count
                session.total_messages += 2
                db.commit()
                
        except WebSocketDisconnect:
            chat_manager.disconnect(websocket, session_id)
            
    except Exception as e:
        # Log the error for debugging
        import traceback
        print(f"WebSocket error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except:
            pass  # Connection might already be closed

@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    session_data: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new chat session."""
    # Verify learning set exists and user has access
    learning_set = db.query(LearningSet).filter(
        LearningSet.id == session_data.learning_set_id
    ).first()
    
    if not learning_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning set not found"
        )
    
    # Create new chat session
    session = ChatSession(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        learning_set_id=session_data.learning_set_id,
        start_time=datetime.utcnow()
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return ChatSessionResponse(
        id=session.id,
        user_id=session.user_id,
        learning_set_id=session.learning_set_id,
        start_time=session.start_time,
        end_time=session.end_time,
        total_messages=session.total_messages,
        vocabulary_practiced=session.vocabulary_practiced,
        grammar_corrections=session.grammar_corrections,
        created_at=session.created_at,
        updated_at=None
    )

@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific chat session."""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    return ChatSessionResponse(
        id=session.id,
        user_id=session.user_id,
        learning_set_id=session.learning_set_id,
        start_time=session.start_time,
        end_time=session.end_time,
        total_messages=session.total_messages,
        vocabulary_practiced=session.vocabulary_practiced,
        grammar_corrections=session.grammar_corrections,
        created_at=session.created_at,
        updated_at=None
    )

@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
async def get_chat_messages(
    session_id: str,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get messages for a chat session with pagination."""
    # Verify session exists and user has access
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    # Get messages with pagination (most recent first)
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(desc(ChatMessage.timestamp)).offset(skip).limit(limit).all()
    
    return [
        ChatMessageResponse(
            id=msg.id,
            session_id=msg.session_id,
            content=msg.content,
            sender=msg.sender.value,
            timestamp=msg.timestamp,
            corrections=json.loads(msg.corrections) if msg.corrections else None,
            vocabulary_used=json.loads(msg.vocabulary_used) if msg.vocabulary_used else None
        )
        for msg in reversed(messages)  # Reverse to show chronological order
    ]

@router.put("/sessions/{session_id}/end")
async def end_chat_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """End a chat session."""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    if session.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chat session already ended"
        )
    
    session.end_time = datetime.utcnow()
    db.commit()
    
    # Disconnect any active WebSocket connections for this session
    await chat_manager.disconnect_session(session_id)
    
    return {"message": "Chat session ended successfully"}

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_user_chat_sessions(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all chat sessions for the current user."""
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(desc(ChatSession.start_time)).offset(skip).limit(limit).all()
    
    return [
        ChatSessionResponse(
            id=session.id,
            user_id=session.user_id,
            learning_set_id=session.learning_set_id,
            start_time=session.start_time,
            end_time=session.end_time,
            total_messages=session.total_messages,
            vocabulary_practiced=session.vocabulary_practiced,
            grammar_corrections=session.grammar_corrections,
            created_at=session.created_at,
            updated_at=None
        )
        for session in sessions
    ]

@router.get("/ai/health")
async def check_ai_health():
    """Check the health status of the AI tutor service."""
    health_status = await ai_tutor_service.health_check()
    
    if health_status["status"] == "healthy":
        return JSONResponse(content=health_status, status_code=200)
    else:
        return JSONResponse(content=health_status, status_code=503)

@router.get("/sessions/{session_id}/starter")
async def get_conversation_starter(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get an AI-generated conversation starter for a chat session."""
    # Verify session exists and user has access
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    # Get learning set for context
    learning_set = db.query(LearningSet).filter(
        LearningSet.id == session.learning_set_id
    ).first()
    
    if not learning_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning set not found"
        )
    
    # Generate conversation starter
    starter = ai_tutor_service.get_conversation_starter(learning_set)
    
    return {"starter": starter}

@router.post("/sessions/{session_id}/analyze")
async def analyze_user_message(
    session_id: str,
    message_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze a user message for grammar corrections and vocabulary usage."""
    # Verify session exists and user has access
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    # Get learning set for context
    learning_set = db.query(LearningSet).filter(
        LearningSet.id == session.learning_set_id
    ).first()
    
    if not learning_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning set not found"
        )
    
    # Analyze the message
    analysis_result = await ai_tutor_service.analyze_message(
        message_data.get("content", ""), 
        learning_set
    )
    
    return analysis_result