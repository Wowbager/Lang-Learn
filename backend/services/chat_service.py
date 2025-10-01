"""
Chat service for managing WebSocket connections and Redis integration.
"""

from fastapi import WebSocket
from typing import Dict, List, Set
import json
import redis
import asyncio
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ChatManager:
    """Manages WebSocket connections and chat sessions."""
    
    def __init__(self):
        # In-memory storage for active connections
        # Format: {session_id: {user_id: websocket}}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        
        # Redis client for scaling across multiple instances
        try:
            self.redis_client = redis.Redis(
                host='redis',  # Docker service name
                port=6379,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Test Redis connection
            self.redis_client.ping()
            self.redis_enabled = True
            logger.info("Redis connection established")
        except (redis.ConnectionError, redis.TimeoutError) as e:
            logger.warning(f"Redis connection failed: {e}. Running without Redis.")
            self.redis_client = None
            self.redis_enabled = False
    
    async def connect(self, websocket: WebSocket, session_id: str, user_id: str):
        """Accept a WebSocket connection and add to active connections."""
        await websocket.accept()
        
        # Add to active connections
        if session_id not in self.active_connections:
            self.active_connections[session_id] = {}
        
        self.active_connections[session_id][user_id] = websocket
        
        # Store connection info in Redis for scaling
        if self.redis_enabled:
            try:
                connection_key = f"chat:session:{session_id}:user:{user_id}"
                self.redis_client.setex(
                    connection_key,
                    3600,  # 1 hour TTL
                    json.dumps({
                        "user_id": user_id,
                        "connected_at": datetime.utcnow().isoformat(),
                        "status": "connected"
                    })
                )
                
                # Add to session members set
                session_members_key = f"chat:session:{session_id}:members"
                self.redis_client.sadd(session_members_key, user_id)
                self.redis_client.expire(session_members_key, 3600)
                
            except redis.RedisError as e:
                logger.error(f"Redis error during connection: {e}")
        
        logger.info(f"User {user_id} connected to session {session_id}")
    
    def disconnect(self, websocket: WebSocket, session_id: str):
        """Remove a WebSocket connection."""
        user_id = None
        
        # Find and remove the connection
        if session_id in self.active_connections:
            for uid, ws in self.active_connections[session_id].items():
                if ws == websocket:
                    user_id = uid
                    break
            
            if user_id:
                del self.active_connections[session_id][user_id]
                
                # Clean up empty session
                if not self.active_connections[session_id]:
                    del self.active_connections[session_id]
                
                # Update Redis
                if self.redis_enabled:
                    try:
                        connection_key = f"chat:session:{session_id}:user:{user_id}"
                        self.redis_client.delete(connection_key)
                        
                        session_members_key = f"chat:session:{session_id}:members"
                        self.redis_client.srem(session_members_key, user_id)
                        
                    except redis.RedisError as e:
                        logger.error(f"Redis error during disconnection: {e}")
                
                logger.info(f"User {user_id} disconnected from session {session_id}")
    
    async def disconnect_session(self, session_id: str):
        """Disconnect all users from a session."""
        if session_id in self.active_connections:
            connections = list(self.active_connections[session_id].values())
            for websocket in connections:
                try:
                    await websocket.close()
                except Exception as e:
                    logger.error(f"Error closing WebSocket: {e}")
            
            del self.active_connections[session_id]
            
            # Clean up Redis
            if self.redis_enabled:
                try:
                    session_members_key = f"chat:session:{session_id}:members"
                    members = self.redis_client.smembers(session_members_key)
                    
                    # Delete individual connection keys
                    for user_id in members:
                        connection_key = f"chat:session:{session_id}:user:{user_id}"
                        self.redis_client.delete(connection_key)
                    
                    # Delete session members set
                    self.redis_client.delete(session_members_key)
                    
                except redis.RedisError as e:
                    logger.error(f"Redis error during session cleanup: {e}")
    
    async def send_message_to_session(self, session_id: str, message: dict):
        """Send a message to all connected users in a session."""
        message_json = json.dumps(message)
        
        # Send to local connections
        if session_id in self.active_connections:
            disconnected_websockets = []
            
            for user_id, websocket in self.active_connections[session_id].items():
                try:
                    await websocket.send_text(message_json)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    disconnected_websockets.append(websocket)
            
            # Clean up disconnected websockets
            for websocket in disconnected_websockets:
                self.disconnect(websocket, session_id)
        
        # Publish to Redis for other instances (if enabled)
        if self.redis_enabled:
            try:
                channel = f"chat:session:{session_id}"
                self.redis_client.publish(channel, message_json)
            except redis.RedisError as e:
                logger.error(f"Redis publish error: {e}")
    
    async def send_message_to_user(self, session_id: str, user_id: str, message: dict):
        """Send a message to a specific user in a session."""
        message_json = json.dumps(message)
        
        # Send to local connection
        if (session_id in self.active_connections and 
            user_id in self.active_connections[session_id]):
            
            websocket = self.active_connections[session_id][user_id]
            try:
                await websocket.send_text(message_json)
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")
                self.disconnect(websocket, session_id)
    
    def get_session_users(self, session_id: str) -> List[str]:
        """Get list of connected users for a session."""
        local_users = []
        if session_id in self.active_connections:
            local_users = list(self.active_connections[session_id].keys())
        
        # Get users from Redis for complete picture
        if self.redis_enabled:
            try:
                session_members_key = f"chat:session:{session_id}:members"
                redis_users = list(self.redis_client.smembers(session_members_key))
                # Combine and deduplicate
                all_users = list(set(local_users + redis_users))
                return all_users
            except redis.RedisError as e:
                logger.error(f"Redis error getting session users: {e}")
        
        return local_users
    
    def get_active_sessions(self) -> List[str]:
        """Get list of active session IDs."""
        local_sessions = list(self.active_connections.keys())
        
        if self.redis_enabled:
            try:
                # Get all session keys from Redis
                pattern = "chat:session:*:members"
                keys = self.redis_client.keys(pattern)
                redis_sessions = [
                    key.split(':')[2] for key in keys
                ]
                # Combine and deduplicate
                all_sessions = list(set(local_sessions + redis_sessions))
                return all_sessions
            except redis.RedisError as e:
                logger.error(f"Redis error getting active sessions: {e}")
        
        return local_sessions
    
    async def broadcast_typing_indicator(self, session_id: str, user_id: str, is_typing: bool):
        """Broadcast typing indicator to other users in the session."""
        message = {
            "type": "typing_indicator",
            "user_id": user_id,
            "is_typing": is_typing,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Send to all users except the sender
        if session_id in self.active_connections:
            for uid, websocket in self.active_connections[session_id].items():
                if uid != user_id:  # Don't send to sender
                    try:
                        await websocket.send_text(json.dumps(message))
                    except Exception as e:
                        logger.error(f"Error sending typing indicator: {e}")
    
    def get_connection_stats(self) -> dict:
        """Get statistics about active connections."""
        total_sessions = len(self.active_connections)
        total_connections = sum(
            len(users) for users in self.active_connections.values()
        )
        
        stats = {
            "total_sessions": total_sessions,
            "total_connections": total_connections,
            "redis_enabled": self.redis_enabled,
            "sessions": {}
        }
        
        for session_id, users in self.active_connections.items():
            stats["sessions"][session_id] = {
                "user_count": len(users),
                "users": list(users.keys())
            }
        
        return stats