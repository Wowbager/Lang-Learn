/**
 * Chat page component for language learning conversations.
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChatInterface } from '../components/chat';
import { ChatProvider } from '../contexts/ChatContext';
import { contentService } from '../services/contentService';
import { LearningSet } from '../types/content';
import './ChatPage.css';

const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const learningSetId = searchParams.get('learning_set_id');
  const sessionId = searchParams.get('session_id');
  
  const [learningSet, setLearningSet] = useState<LearningSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load learning set information
  useEffect(() => {
    const loadLearningSet = async () => {
      if (!learningSetId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const set = await contentService.getLearningSet(learningSetId);
        setLearningSet(set);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load learning set';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadLearningSet();
  }, [learningSetId]);

  const handleSessionEnd = () => {
    // Navigate back to content page or dashboard
    navigate('/content');
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="chat-page loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-page error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Unable to start chat</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={handleBackClick} className="back-button">
              Go Back
            </button>
            <button onClick={() => window.location.reload()} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!learningSetId && !sessionId) {
    return (
      <div className="chat-page error">
        <div className="error-container">
          <div className="error-icon">❓</div>
          <h2>No learning content selected</h2>
          <p>Please select a learning set to start practicing.</p>
          <button onClick={() => navigate('/content')} className="back-button">
            Browse Content
          </button>
        </div>
      </div>
    );
  }

  return (
    <ChatProvider>
      <div className="chat-page">
        {/* Page header */}
        <div className="chat-page-header">
          <button onClick={handleBackClick} className="back-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
            Back
          </button>
          
          {learningSet && (
            <div className="learning-set-info">
              <h1>{learningSet.name}</h1>
              {learningSet.description && (
                <p className="learning-set-description">{learningSet.description}</p>
              )}
              <div className="learning-set-meta">
                {learningSet.grade_level && (
                  <span className="meta-tag">Grade: {learningSet.grade_level}</span>
                )}
                {learningSet.subject && (
                  <span className="meta-tag">Subject: {learningSet.subject}</span>
                )}
                {learningSet.vocabulary_items && (
                  <span className="meta-tag">
                    {learningSet.vocabulary_items.length} vocabulary words
                  </span>
                )}
                {learningSet.grammar_topics && (
                  <span className="meta-tag">
                    {learningSet.grammar_topics.length} grammar topics
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chat interface */}
        <div className="chat-container">
          <ChatInterface
            learningSetId={learningSetId || undefined}
            sessionId={sessionId || undefined}
            onSessionEnd={handleSessionEnd}
            className="main-chat"
          />
        </div>
      </div>
    </ChatProvider>
  );
};

export default ChatPage;