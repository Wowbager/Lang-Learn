/**
 * Chat service for WebSocket communication and chat session management.
 */

import apiClient from './apiClient';
import { ChatSession, ChatSessionCreate, ChatMessage, WebSocketMessage } from '../types/chat';

class ChatService {
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private messageHandlers: Set<(message: WebSocketMessage) => void> = new Set();
  private connectionHandlers: Set<(connected: boolean) => void> = new Set();

  /**
   * Create a new chat session
   */
  async createSession(sessionData: ChatSessionCreate): Promise<ChatSession> {
    const response = await apiClient.post<ChatSession>('/chat/sessions', sessionData);
    return response.data;
  }

  /**
   * Get a specific chat session
   */
  async getSession(sessionId: string): Promise<ChatSession> {
    const response = await apiClient.get<ChatSession>(`/chat/sessions/${sessionId}`);
    return response.data;
  }

  /**
   * Get messages for a chat session
   */
  async getMessages(sessionId: string, skip = 0, limit = 50): Promise<ChatMessage[]> {
    const response = await apiClient.get<ChatMessage[]>(
      `/chat/sessions/${sessionId}/messages`,
      { params: { skip, limit } }
    );
    return response.data;
  }

  /**
   * End a chat session
   */
  async endSession(sessionId: string): Promise<void> {
    await apiClient.put(`/chat/sessions/${sessionId}/end`);
    this.disconnect();
  }

  /**
   * Get user's chat sessions
   */
  async getUserSessions(skip = 0, limit = 20): Promise<ChatSession[]> {
    const response = await apiClient.get<ChatSession[]>('/chat/sessions', {
      params: { skip, limit }
    });
    return response.data;
  }

  /**
   * Get AI service health status
   */
  async getAIHealth(): Promise<{ status: string; [key: string]: any }> {
    const response = await apiClient.get('/chat/ai/health');
    return response.data;
  }

  /**
   * Get conversation starter for a session
   */
  async getConversationStarter(sessionId: string): Promise<{ starter: string }> {
    const response = await apiClient.get(`/chat/sessions/${sessionId}/starter`);
    return response.data;
  }

  /**
   * Analyze a message for grammar and vocabulary
   */
  async analyzeMessage(sessionId: string, content: string): Promise<any> {
    const response = await apiClient.post(`/chat/sessions/${sessionId}/analyze`, {
      content
    });
    return response.data;
  }

  /**
   * Connect to WebSocket for real-time chat
   */
  connect(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          reject(new Error('No authentication token found'));
          return;
        }

        // Determine WebSocket URL
        const wsHostConfig = process.env.REACT_APP_WS_URL || window.location.host;
        
        // Check if wsHostConfig already includes protocol
        let wsUrl: string;
        if (wsHostConfig.startsWith('ws://') || wsHostConfig.startsWith('wss://')) {
          // Protocol already included, just append the path (must include /api for Traefik routing)
          wsUrl = `${wsHostConfig}/api/chat/ws/${sessionId}?token=${token}`;
        } else {
          // No protocol, determine it based on current page protocol
          const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          wsUrl = `${wsProtocol}//${wsHostConfig}/api/chat/ws/${sessionId}?token=${token}`;
        }

        console.log('Connecting to WebSocket:', wsUrl); // Debug log

        this.websocket = new WebSocket(wsUrl);

        this.websocket.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.notifyConnectionHandlers(true);
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.notifyMessageHandlers(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.websocket.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.notifyConnectionHandlers(false);
          
          // Attempt to reconnect if not a normal closure
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect(sessionId);
          }
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(new Error('WebSocket connection failed'));
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close(1000, 'Normal closure');
      this.websocket = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  /**
   * Send a message through WebSocket
   */
  sendMessage(content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      try {
        const message = {
          content,
          timestamp: new Date().toISOString()
        };
        
        this.websocket.send(JSON.stringify(message));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(isTyping: boolean): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const message = {
        type: 'typing_indicator',
        is_typing: isTyping,
        timestamp: new Date().toISOString()
      };
      
      this.websocket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }

  /**
   * Add message handler
   */
  onMessage(handler: (message: WebSocketMessage) => void): () => void {
    this.messageHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Add connection handler
   */
  onConnectionChange(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(sessionId: string): void {
    this.reconnectAttempts++;
    
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect(sessionId).catch((error) => {
        console.error('Reconnection failed:', error);
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectDelay *= 2; // Exponential backoff
          this.attemptReconnect(sessionId);
        }
      });
    }, this.reconnectDelay);
  }

  /**
   * Notify all message handlers
   */
  private notifyMessageHandlers(message: WebSocketMessage): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  /**
   * Notify all connection handlers
   */
  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;