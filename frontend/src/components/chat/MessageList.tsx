/**
 * Message list component that displays chat messages with auto-scrolling.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage as ChatMessageType } from '../../types/chat';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import './MessageList.css';

interface MessageListProps {
  messages: ChatMessageType[];
  typingUsers?: Set<string>;
  showAITyping?: boolean;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  typingUsers = new Set(),
  showAITyping = false,
  isLoading = false,
  onLoadMore,
  hasMore = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll && isNearBottom) {
      scrollToBottom();
    }
  }, [messages, showAITyping, shouldAutoScroll, isNearBottom]);

  // Check if user is near bottom of messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const nearBottom = distanceFromBottom < 100;
      
      setIsNearBottom(nearBottom);
      setShouldAutoScroll(nearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLoadMore = () => {
    if (onLoadMore && hasMore && !isLoading) {
      onLoadMore();
    }
  };

  const handleScrollToBottomClick = () => {
    setShouldAutoScroll(true);
    scrollToBottom();
  };

  return (
    <div className="message-list-container">
      <div 
        ref={messagesContainerRef}
        className="message-list"
      >
        {/* Load more button */}
        {hasMore && (
          <div className="load-more-container">
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="load-more-button"
            >
              {isLoading ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <span>Loading messages...</span>
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <h3>Start a conversation</h3>
            <p>Send a message to begin practicing with your AI tutor!</p>
          </div>
        )}

        {/* Messages */}
        <div className="messages-container">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              showTimestamp={true}
            />
          ))}
          
          {/* Typing indicator */}
          <TypingIndicator 
            typingUsers={typingUsers}
            showAITyping={showAITyping}
          />
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {!isNearBottom && (
        <button
          onClick={handleScrollToBottomClick}
          className="scroll-to-bottom-button"
          title="Scroll to bottom"
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <polyline points="6,9 12,15 18,9"></polyline>
          </svg>
        </button>
      )}
    </div>
  );
};

export default MessageList;