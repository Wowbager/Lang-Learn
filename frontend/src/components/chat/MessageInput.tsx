/**
 * Chat message input component with typing indicators and send functionality.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import './MessageInput.css';

interface MessageInputProps {
  disabled?: boolean;
  placeholder?: string;
  onSend?: (message: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  disabled = false, 
  placeholder = "Type your message...",
  onSend 
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { sendMessage, setTyping, isConnected } = useChat();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Handle typing indicator
  useEffect(() => {
    if (isTyping && isConnected) {
      setTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
        setIsTyping(false);
      }, 2000);
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, isConnected, setTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Start typing indicator if not already typing
    if (value.trim() && !isTyping) {
      setIsTyping(true);
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      setTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || !isConnected) return;

    try {
      // Clear input immediately for better UX
      setMessage('');
      setIsTyping(false);
      setTyping(false);
      
      // Send message
      if (onSend) {
        await onSend(trimmedMessage);
      } else {
        await sendMessage(trimmedMessage);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message on error
      setMessage(trimmedMessage);
    }
  };

  const canSend = message.trim() && !disabled && isConnected;

  return (
    <div className="message-input-container">
      <div className="message-input-wrapper">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={disabled ? "Chat is not connected..." : placeholder}
          disabled={disabled || !isConnected}
          className="message-input"
          rows={1}
          maxLength={1000}
        />
        
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`send-button ${canSend ? 'active' : ''}`}
          title="Send message (Enter)"
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22,2 15,22 11,13 2,9"></polygon>
          </svg>
        </button>
      </div>
      
      {/* Character counter */}
      <div className="message-input-footer">
        <span className={`character-count ${message.length > 900 ? 'warning' : ''}`}>
          {message.length}/1000
        </span>
        
        {!isConnected && (
          <span className="connection-status">
            Not connected
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageInput;