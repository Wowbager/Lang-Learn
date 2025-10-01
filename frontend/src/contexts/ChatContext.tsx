/**
 * Chat context for managing chat state and WebSocket connections.
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { ChatContextType, ChatSession, ChatMessage, WebSocketMessage, SenderType, AIAnalysisResult } from '../types/chat';
import { chatService } from '../services/chatService';

// Chat state interface
interface ChatState {
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  typingUsers: Set<string>;
  aiTyping: boolean;
  aiHealthy: boolean;
  streamingMessages: Map<string, string>;
  isLoading: boolean;
  error: string | null;
}

// Chat actions
type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SESSION'; payload: ChatSession | null }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<ChatMessage> } }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_CONNECTION_ERROR'; payload: string | null }
  | { type: 'SET_TYPING_USERS'; payload: Set<string> }
  | { type: 'ADD_TYPING_USER'; payload: string }
  | { type: 'REMOVE_TYPING_USER'; payload: string }
  | { type: 'CLEAR_TYPING_USERS' }
  | { type: 'SET_AI_TYPING'; payload: boolean }
  | { type: 'SET_AI_HEALTHY'; payload: boolean }
  | { type: 'UPDATE_STREAMING_MESSAGE'; payload: { id: string; chunk: string } }
  | { type: 'COMPLETE_STREAMING_MESSAGE'; payload: { id: string; content: string } };

// Initial state
const initialState: ChatState = {
  currentSession: null,
  messages: [],
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  typingUsers: new Set(),
  aiTyping: false,
  aiHealthy: true,
  streamingMessages: new Map(),
  isLoading: false,
  error: null,
};

// Chat reducer
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_SESSION':
      return { ...state, currentSession: action.payload };
    
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    
    case 'ADD_MESSAGE':
      return { 
        ...state, 
        messages: [...state.messages, action.payload] 
      };
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg => 
          msg.id === action.payload.id 
            ? { ...msg, ...action.payload.updates }
            : msg
        )
      };
    
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    
    case 'SET_CONNECTING':
      return { ...state, isConnecting: action.payload };
    
    case 'SET_CONNECTION_ERROR':
      return { ...state, connectionError: action.payload };
    
    case 'SET_TYPING_USERS':
      return { ...state, typingUsers: action.payload };
    
    case 'ADD_TYPING_USER':
      return { 
        ...state, 
        typingUsers: new Set([...Array.from(state.typingUsers), action.payload]) 
      };
    
    case 'REMOVE_TYPING_USER':
      const newTypingUsers = new Set(state.typingUsers);
      newTypingUsers.delete(action.payload);
      return { ...state, typingUsers: newTypingUsers };
    
    case 'CLEAR_TYPING_USERS':
      return { ...state, typingUsers: new Set() };
    
    case 'SET_AI_TYPING':
      return { ...state, aiTyping: action.payload };
    
    case 'SET_AI_HEALTHY':
      return { ...state, aiHealthy: action.payload };
    
    case 'UPDATE_STREAMING_MESSAGE':
      const updatedStreaming = new Map(state.streamingMessages);
      const currentContent = updatedStreaming.get(action.payload.id) || '';
      updatedStreaming.set(action.payload.id, currentContent + action.payload.chunk);
      
      // Update or add streaming message in messages array
      const existingMessageIndex = state.messages.findIndex(msg => msg.id === action.payload.id);
      let updatedMessages = [...state.messages];
      
      if (existingMessageIndex >= 0) {
        updatedMessages[existingMessageIndex] = {
          ...updatedMessages[existingMessageIndex],
          content: updatedStreaming.get(action.payload.id) || '',
          isStreaming: true
        };
      } else {
        updatedMessages.push({
          id: action.payload.id,
          content: action.payload.chunk,
          sender: SenderType.AI,
          timestamp: new Date().toISOString(),
          isStreaming: true
        });
      }
      
      return {
        ...state,
        streamingMessages: updatedStreaming,
        messages: updatedMessages
      };
    
    case 'COMPLETE_STREAMING_MESSAGE':
      const completedStreaming = new Map(state.streamingMessages);
      completedStreaming.delete(action.payload.id);
      
      return {
        ...state,
        streamingMessages: completedStreaming,
        messages: state.messages.map(msg => 
          msg.id === action.payload.id 
            ? { ...msg, content: action.payload.content, isStreaming: false }
            : msg
        )
      };
    
    default:
      return state;
  }
}

// Create context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Chat provider component
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'typing_indicator') {
      if (message.sender === 'ai') {
        dispatch({ type: 'SET_AI_TYPING', payload: message.is_typing || false });
      } else if (message.user_id && message.is_typing !== undefined) {
        if (message.is_typing) {
          dispatch({ type: 'ADD_TYPING_USER', payload: message.user_id });
        } else {
          dispatch({ type: 'REMOVE_TYPING_USER', payload: message.user_id });
        }
      }
    } else if (message.type === 'streaming_response') {
      if (message.id && message.chunk) {
        dispatch({ 
          type: 'UPDATE_STREAMING_MESSAGE', 
          payload: { id: message.id, chunk: message.chunk } 
        });
      }
    } else if (message.type === 'complete_message') {
      if (message.id && message.content) {
        dispatch({ 
          type: 'COMPLETE_STREAMING_MESSAGE', 
          payload: { id: message.id, content: message.content } 
        });
      }
    } else if (message.type === 'error') {
      dispatch({ type: 'SET_CONNECTION_ERROR', payload: message.error || 'Unknown error' });
    } else {
      // Regular chat message
      if (message.id && message.content && message.sender && message.timestamp) {
        const chatMessage: ChatMessage = {
          id: message.id,
          content: message.content,
          sender: message.sender as SenderType,
          timestamp: message.timestamp,
          corrections: message.corrections,
          vocabulary_used: message.vocabulary_used,
        };
        dispatch({ type: 'ADD_MESSAGE', payload: chatMessage });
      }
    }
  }, []);

  // Handle connection changes
  const handleConnectionChange = useCallback((connected: boolean) => {
    dispatch({ type: 'SET_CONNECTED', payload: connected });
    if (connected) {
      dispatch({ type: 'SET_CONNECTION_ERROR', payload: null });
    }
  }, []);

  // Set up WebSocket event listeners
  useEffect(() => {
    const unsubscribeMessage = chatService.onMessage(handleWebSocketMessage);
    const unsubscribeConnection = chatService.onConnectionChange(handleConnectionChange);

    return () => {
      unsubscribeMessage();
      unsubscribeConnection();
    };
  }, [handleWebSocketMessage, handleConnectionChange]);

  // Start a new chat session
  const startSession = useCallback(async (learningSetId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Create new session
      const session = await chatService.createSession({ learning_set_id: learningSetId });
      dispatch({ type: 'SET_SESSION', payload: session });
      dispatch({ type: 'SET_MESSAGES', payload: [] });

      // Connect to WebSocket
      dispatch({ type: 'SET_CONNECTING', payload: true });
      await chatService.connect(session.id);
      dispatch({ type: 'SET_CONNECTING', payload: false });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start chat session';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_CONNECTING', payload: false });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // End current chat session
  const endSession = useCallback(async () => {
    if (!state.currentSession) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await chatService.endSession(state.currentSession.id);
      
      dispatch({ type: 'SET_SESSION', payload: null });
      dispatch({ type: 'SET_MESSAGES', payload: [] });
      dispatch({ type: 'CLEAR_TYPING_USERS' });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to end chat session';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentSession]);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!state.currentSession || !content.trim()) return;

    try {
      await chatService.sendMessage(content.trim());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.currentSession]);

  // Set typing indicator
  const setTyping = useCallback((isTyping: boolean) => {
    if (!state.isConnected) return;
    
    chatService.sendTypingIndicator(isTyping);
  }, [state.isConnected]);

  // Load existing session
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Load session data
      const session = await chatService.getSession(sessionId);
      dispatch({ type: 'SET_SESSION', payload: session });

      // Load messages
      const messages = await chatService.getMessages(sessionId);
      dispatch({ type: 'SET_MESSAGES', payload: messages });

      // Connect to WebSocket if session is active
      if (!session.end_time) {
        dispatch({ type: 'SET_CONNECTING', payload: true });
        await chatService.connect(sessionId);
        dispatch({ type: 'SET_CONNECTING', payload: false });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load chat session';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_CONNECTING', payload: false });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Load messages for a session
  const loadMessages = useCallback(async (sessionId: string, skip = 0, limit = 50) => {
    try {
      const messages = await chatService.getMessages(sessionId, skip, limit);
      return messages;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load messages';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return [];
    }
  }, []);

  // Get user's chat sessions
  const getUserSessions = useCallback(async (skip = 0, limit = 20) => {
    try {
      const sessions = await chatService.getUserSessions(skip, limit);
      return sessions;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load chat sessions';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return [];
    }
  }, []);

  // Get conversation starter
  const getConversationStarter = useCallback(async (): Promise<string> => {
    if (!state.currentSession) {
      throw new Error('No active chat session');
    }

    try {
      const result = await chatService.getConversationStarter(state.currentSession.id);
      return result.starter;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get conversation starter';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.currentSession]);

  // Analyze message
  const analyzeMessage = useCallback(async (content: string): Promise<AIAnalysisResult> => {
    if (!state.currentSession) {
      throw new Error('No active chat session');
    }

    try {
      const result = await chatService.analyzeMessage(state.currentSession.id, content);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze message';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.currentSession]);

  // Check AI health
  const checkAIHealth = useCallback(async (): Promise<boolean> => {
    try {
      const health = await chatService.getAIHealth();
      const isHealthy = health.status === 'healthy';
      dispatch({ type: 'SET_AI_HEALTHY', payload: isHealthy });
      return isHealthy;
    } catch (error) {
      dispatch({ type: 'SET_AI_HEALTHY', payload: false });
      return false;
    }
  }, []);

  // Check AI health on mount and periodically
  useEffect(() => {
    checkAIHealth();
    
    // Check AI health every 5 minutes
    const healthCheckInterval = setInterval(checkAIHealth, 5 * 60 * 1000);
    
    return () => clearInterval(healthCheckInterval);
  }, [checkAIHealth]);

  // Context value
  const contextValue: ChatContextType = {
    currentSession: state.currentSession,
    messages: state.messages,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    connectionError: state.connectionError,
    typingUsers: state.typingUsers,
    aiTyping: state.aiTyping,
    aiHealthy: state.aiHealthy,
    startSession,
    endSession,
    sendMessage,
    setTyping,
    loadSession,
    loadMessages,
    getUserSessions,
    getConversationStarter,
    analyzeMessage,
    checkAIHealth,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Hook to use chat context
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;