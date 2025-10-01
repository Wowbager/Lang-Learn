/**
 * Main chat interface component that combines all chat functionality.
 */

import React, { useState, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './ChatInterface.css';

interface ChatInterfaceProps {
  learningSetId?: string;
  sessionId?: string;
  onSessionEnd?: () => void;
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  learningSetId,
  sessionId,
  onSessionEnd,
  className = ''
}) => {
  const {
    currentSession,
    messages,
    isConnected,
    isConnecting,
    connectionError,
    typingUsers,
    aiTyping,
    aiHealthy,
    startSession,
    endSession,
    loadSession,
    sendMessage,
    getConversationStarter,
    checkAIHealth
  } = useChat();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationStarter, setConversationStarter] = useState<string | null>(null);

  // Initialize chat session
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (sessionId) {
          // Load existing session
          await loadSession(sessionId);
        } else if (learningSetId) {
          // Start new session
          await startSession(learningSetId);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize chat';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if ((learningSetId || sessionId) && !currentSession) {
      initializeChat();
    }
  }, [learningSetId, sessionId, currentSession, loadSession, startSession]);

  // Load conversation starter when session starts
  useEffect(() => {
    const loadStarter = async () => {
      if (currentSession && messages.length === 0) {
        try {
          const starter = await getConversationStarter();
          setConversationStarter(starter);
        } catch (err) {
          console.warn('Failed to load conversation starter:', err);
        }
      }
    };

    loadStarter();
  }, [currentSession, messages.length, getConversationStarter]);

  // Check AI health periodically
  useEffect(() => {
    if (currentSession) {
      checkAIHealth();
    }
  }, [currentSession, checkAIHealth]);

  const handleSendMessage = async (content: string) => {
    try {
      setError(null);
      await sendMessage(content);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
    }
  };

  const handleEndSession = async () => {
    try {
      await endSession();
      if (onSessionEnd) {
        onSessionEnd();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end session';
      setError(errorMessage);
    }
  };

  const getConnectionStatus = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected) return 'Connected';
    if (connectionError) return `Error: ${connectionError}`;
    return 'Disconnected';
  };

  const getConnectionStatusClass = () => {
    if (isConnecting) return 'connecting';
    if (isConnected) return 'connected';
    if (connectionError) return 'error';
    return 'disconnected';
  };

  if (isLoading) {
    return (
      <div className={`chat-interface loading ${className}`}>
        <div className="chat-loading">
          <div className="loading-spinner"></div>
          <p>Initializing chat...</p>
        </div>
      </div>
    );
  }

  if (error && !currentSession) {
    return (
      <div className={`chat-interface error ${className}`}>
        <div className="chat-error">
          <div className="error-icon">⚠️</div>
          <h3>Failed to start chat</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-interface ${className}`}>
      {/* Chat header */}
      <div className="chat-header">
        <div className="chat-info">
          <h3>AI Language Tutor</h3>
          <div className="status-indicators">
            <div className={`connection-status ${getConnectionStatusClass()}`}>
              <span className="status-indicator"></span>
              {getConnectionStatus()}
            </div>
            {!aiHealthy && (
              <div className="ai-status warning">
                <span className="status-indicator"></span>
                AI Service Issues
              </div>
            )}
          </div>
        </div>
        
        {currentSession && !currentSession.end_time && (
          <button 
            onClick={handleEndSession}
            className="end-session-button"
            title="End chat session"
          >
            End Session
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="error-banner">
          <span className="error-text">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="dismiss-error"
            title="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Conversation starter */}
      {conversationStarter && messages.length === 0 && (
        <div className="conversation-starter">
          <div className="starter-message">
            <div className="starter-avatar">🤖</div>
            <div className="starter-content">
              <p>{conversationStarter}</p>
              <button 
                onClick={() => setConversationStarter(null)}
                className="dismiss-starter"
              >
                Start Chatting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        typingUsers={typingUsers}
        showAITyping={aiTyping}
        isLoading={false}
      />

      {/* Message input */}
      <MessageInput
        disabled={!isConnected || !!currentSession?.end_time}
        onSend={handleSendMessage}
        placeholder={
          currentSession?.end_time 
            ? "This chat session has ended"
            : "Type your message to practice..."
        }
      />
    </div>
  );
};

export default ChatInterface;