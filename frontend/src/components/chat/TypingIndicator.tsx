/**
 * Typing indicator component to show when users or AI are typing.
 */

import React from 'react';
import './TypingIndicator.css';

interface TypingIndicatorProps {
  typingUsers: Set<string>;
  showAITyping?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  typingUsers, 
  showAITyping = false 
}) => {
  const hasTypingUsers = typingUsers.size > 0;
  const shouldShow = hasTypingUsers || showAITyping;

  if (!shouldShow) return null;

  const getTypingText = () => {
    if (showAITyping) {
      return 'AI Tutor is typing...';
    }
    
    const userCount = typingUsers.size;
    if (userCount === 1) {
      return 'Someone is typing...';
    } else if (userCount === 2) {
      return '2 people are typing...';
    } else {
      return `${userCount} people are typing...`;
    }
  };

  return (
    <div className="typing-indicator">
      <div className="typing-indicator-content">
        <div className="typing-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
        <span className="typing-text">{getTypingText()}</span>
      </div>
    </div>
  );
};

export default TypingIndicator;