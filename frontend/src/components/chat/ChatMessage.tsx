/**
 * Individual chat message component with grammar corrections and vocabulary highlighting.
 */

import React from 'react';
import { ChatMessage as ChatMessageType, SenderType, VocabularyUsage } from '../../types/chat';
import './ChatMessage.css';

interface ChatMessageProps {
  message: ChatMessageType;
  showTimestamp?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, showTimestamp = true }) => {
  const isUser = message.sender === SenderType.USER;
  const isAI = message.sender === SenderType.AI;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const renderMessageContent = () => {
    let content = message.content;

    // Highlight grammar corrections if present
    if (message.corrections && message.corrections.length > 0) {
      message.corrections.forEach((correction) => {
        const regex = new RegExp(`\\b${correction.original}\\b`, 'gi');
        content = content.replace(regex, 
          `<mark class="grammar-correction" title="${correction.explanation}">${correction.corrected}</mark>`
        );
      });
    }

    // Highlight vocabulary words if present
    if (message.vocabulary_used && message.vocabulary_used.length > 0) {
      message.vocabulary_used.forEach((vocabUsage) => {
        const regex = new RegExp(`\\b${vocabUsage.word}\\b`, 'gi');
        const className = vocabUsage.used_correctly ? 'vocabulary-correct' : 'vocabulary-incorrect';
        content = content.replace(regex, 
          `<span class="${className}" title="${vocabUsage.context}">${vocabUsage.word}</span>`
        );
      });
    }

    return { __html: content };
  };

  return (
    <div className={`chat-message ${isUser ? 'user-message' : 'ai-message'}`}>
      <div className="message-header">
        <span className="sender-label">
          {isUser ? 'You' : 'AI Tutor'}
        </span>
        {showTimestamp && (
          <span className="message-timestamp">
            {formatTimestamp(message.timestamp)}
          </span>
        )}
      </div>
      
      <div className="message-content">
        <div 
          className={`message-text ${message.isStreaming ? 'streaming' : ''}`}
          dangerouslySetInnerHTML={renderMessageContent()}
        />
        
        {/* Streaming indicator */}
        {message.isStreaming && (
          <div className="streaming-indicator">
            <span className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </div>
        )}
        
        {/* Grammar corrections panel */}
        {message.corrections && message.corrections.length > 0 && (
          <div className="corrections-panel">
            <h4>Grammar Corrections:</h4>
            {message.corrections.map((correction, index) => (
              <div key={index} className="correction-item">
                <div className="correction-main">
                  <span className="correction-original">"{correction.original}"</span>
                  <span className="correction-arrow">→</span>
                  <span className="correction-corrected">"{correction.corrected}"</span>
                  {correction.severity && (
                    <span className={`severity-badge ${correction.severity}`}>
                      {correction.severity}
                    </span>
                  )}
                </div>
                <p className="correction-explanation">{correction.explanation}</p>
                {correction.grammar_rule && (
                  <p className="grammar-rule">Rule: {correction.grammar_rule}</p>
                )}
                {correction.gentle_feedback && (
                  <div className="gentle-feedback">
                    <span className="feedback-icon">💡</span>
                    <p>{correction.gentle_feedback}</p>
                  </div>
                )}
                {correction.learning_tip && (
                  <div className="learning-tip">
                    <span className="tip-icon">📝</span>
                    <p><strong>Tip:</strong> {correction.learning_tip}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Vocabulary usage panel */}
        {message.vocabulary_used && message.vocabulary_used.length > 0 && (
          <div className="vocabulary-panel">
            <h4>Vocabulary Practice:</h4>
            <div className="vocabulary-list">
              {message.vocabulary_used.map((vocabUsage, index) => (
                <div key={index} className={`vocabulary-item ${vocabUsage.used_correctly ? 'correct' : 'incorrect'}`}>
                  <div className="vocabulary-header">
                    <span className="vocabulary-word">{vocabUsage.word}</span>
                    <span className={`usage-indicator ${vocabUsage.used_correctly ? 'correct' : 'incorrect'}`}>
                      {vocabUsage.used_correctly ? '✓' : '✗'}
                    </span>
                    {vocabUsage.definition_match !== undefined && (
                      <span className={`definition-indicator ${vocabUsage.definition_match ? 'match' : 'no-match'}`}>
                        {vocabUsage.definition_match ? '📖' : '📚'}
                      </span>
                    )}
                  </div>
                  <p className="vocabulary-context">{vocabUsage.context}</p>
                  {vocabUsage.improvement_suggestion && (
                    <div className="improvement-suggestion">
                      <span className="suggestion-icon">💡</span>
                      <p>{vocabUsage.improvement_suggestion}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Enhanced feedback sections */}
        {(message as any).detailed_vocabulary_feedback && (
          <div className="detailed-feedback vocabulary-feedback">
            <h4>Vocabulary Insights:</h4>
            <p>{(message as any).detailed_vocabulary_feedback}</p>
          </div>
        )}
        
        {(message as any).grammar_pattern_feedback && (
          <div className="detailed-feedback grammar-feedback">
            <h4>Grammar Patterns:</h4>
            <p>{(message as any).grammar_pattern_feedback}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;