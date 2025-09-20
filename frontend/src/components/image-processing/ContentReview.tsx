/**
 * Content review interface for editing extracted items before saving
 */

import React, { useState, useEffect } from 'react';
import {
  ExtractedContent,
  ExtractedVocabularyItem,
  ExtractedGrammarTopic,
  ExtractedExercise
} from '../../services/imageProcessingService';
import './ContentReview.css';

interface ContentReviewProps {
  extractedContent: ExtractedContent;
  onContentChange: (content: ExtractedContent) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export const ContentReview: React.FC<ContentReviewProps> = ({
  extractedContent,
  onContentChange,
  onSave,
  onCancel,
  isSaving = false
}) => {
  const [content, setContent] = useState<ExtractedContent>(extractedContent);
  const [activeTab, setActiveTab] = useState<'vocabulary' | 'grammar' | 'exercises'>('vocabulary');

  useEffect(() => {
    onContentChange(content);
  }, [content, onContentChange]);

  const updateVocabularyItem = (index: number, updates: Partial<ExtractedVocabularyItem>) => {
    const newVocabulary = [...content.vocabulary];
    newVocabulary[index] = { ...newVocabulary[index], ...updates };
    setContent({ ...content, vocabulary: newVocabulary });
  };

  const removeVocabularyItem = (index: number) => {
    const newVocabulary = content.vocabulary.filter((_, i) => i !== index);
    setContent({ ...content, vocabulary: newVocabulary });
  };

  const addVocabularyItem = () => {
    const newItem: ExtractedVocabularyItem = {
      word: '',
      definition: '',
      example_sentence: '',
      part_of_speech: '',
      confidence: 1.0
    };
    setContent({ ...content, vocabulary: [...content.vocabulary, newItem] });
  };

  const updateGrammarTopic = (index: number, updates: Partial<ExtractedGrammarTopic>) => {
    const newGrammar = [...content.grammar_topics];
    newGrammar[index] = { ...newGrammar[index], ...updates };
    setContent({ ...content, grammar_topics: newGrammar });
  };

  const removeGrammarTopic = (index: number) => {
    const newGrammar = content.grammar_topics.filter((_, i) => i !== index);
    setContent({ ...content, grammar_topics: newGrammar });
  };

  const addGrammarTopic = () => {
    const newTopic: ExtractedGrammarTopic = {
      name: '',
      description: '',
      rule_explanation: '',
      examples: [],
      difficulty: 'beginner',
      confidence: 1.0
    };
    setContent({ ...content, grammar_topics: [...content.grammar_topics, newTopic] });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#28a745';
    if (confidence >= 0.6) return '#ffc107';
    return '#dc3545';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="content-review">
      <div className="review-header">
        <h2>Review Extracted Content</h2>
        <p>Review and edit the content extracted from your image before saving.</p>
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'vocabulary' ? 'active' : ''}`}
          onClick={() => setActiveTab('vocabulary')}
        >
          Vocabulary ({content.vocabulary.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'grammar' ? 'active' : ''}`}
          onClick={() => setActiveTab('grammar')}
        >
          Grammar ({content.grammar_topics.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'exercises' ? 'active' : ''}`}
          onClick={() => setActiveTab('exercises')}
        >
          Exercises ({content.exercises.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'vocabulary' && (
          <div className="vocabulary-section">
            <div className="section-header">
              <h3>Vocabulary Items</h3>
              <button className="add-button" onClick={addVocabularyItem}>
                + Add Word
              </button>
            </div>

            {content.vocabulary.length === 0 ? (
              <div className="empty-state">
                <p>No vocabulary items found. Click "Add Word" to add items manually.</p>
              </div>
            ) : (
              <div className="items-list">
                {content.vocabulary.map((item, index) => (
                  <div key={index} className="vocabulary-item">
                    <div className="item-header">
                      <div className="confidence-badge" style={{ backgroundColor: getConfidenceColor(item.confidence) }}>
                        {getConfidenceLabel(item.confidence)}
                      </div>
                      <button
                        className="remove-button"
                        onClick={() => removeVocabularyItem(index)}
                      >
                        ×
                      </button>
                    </div>

                    <div className="item-fields">
                      <div className="field-group">
                        <label>Word *</label>
                        <input
                          type="text"
                          value={item.word}
                          onChange={(e) => updateVocabularyItem(index, { word: e.target.value })}
                          placeholder="Enter word"
                        />
                      </div>

                      <div className="field-group">
                        <label>Definition</label>
                        <textarea
                          value={item.definition || ''}
                          onChange={(e) => updateVocabularyItem(index, { definition: e.target.value })}
                          placeholder="Enter definition"
                          rows={2}
                        />
                      </div>

                      <div className="field-group">
                        <label>Example Sentence</label>
                        <input
                          type="text"
                          value={item.example_sentence || ''}
                          onChange={(e) => updateVocabularyItem(index, { example_sentence: e.target.value })}
                          placeholder="Enter example sentence"
                        />
                      </div>

                      <div className="field-row">
                        <div className="field-group">
                          <label>Part of Speech</label>
                          <select
                            value={item.part_of_speech || ''}
                            onChange={(e) => updateVocabularyItem(index, { part_of_speech: e.target.value })}
                          >
                            <option value="">Select...</option>
                            <option value="noun">Noun</option>
                            <option value="verb">Verb</option>
                            <option value="adjective">Adjective</option>
                            <option value="adverb">Adverb</option>
                            <option value="preposition">Preposition</option>
                            <option value="conjunction">Conjunction</option>
                            <option value="interjection">Interjection</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'grammar' && (
          <div className="grammar-section">
            <div className="section-header">
              <h3>Grammar Topics</h3>
              <button className="add-button" onClick={addGrammarTopic}>
                + Add Topic
              </button>
            </div>

            {content.grammar_topics.length === 0 ? (
              <div className="empty-state">
                <p>No grammar topics found. Click "Add Topic" to add topics manually.</p>
              </div>
            ) : (
              <div className="items-list">
                {content.grammar_topics.map((topic, index) => (
                  <div key={index} className="grammar-item">
                    <div className="item-header">
                      <div className="confidence-badge" style={{ backgroundColor: getConfidenceColor(topic.confidence) }}>
                        {getConfidenceLabel(topic.confidence)}
                      </div>
                      <button
                        className="remove-button"
                        onClick={() => removeGrammarTopic(index)}
                      >
                        ×
                      </button>
                    </div>

                    <div className="item-fields">
                      <div className="field-group">
                        <label>Topic Name *</label>
                        <input
                          type="text"
                          value={topic.name}
                          onChange={(e) => updateGrammarTopic(index, { name: e.target.value })}
                          placeholder="Enter topic name"
                        />
                      </div>

                      <div className="field-group">
                        <label>Description</label>
                        <textarea
                          value={topic.description || ''}
                          onChange={(e) => updateGrammarTopic(index, { description: e.target.value })}
                          placeholder="Enter description"
                          rows={2}
                        />
                      </div>

                      <div className="field-group">
                        <label>Rule Explanation</label>
                        <textarea
                          value={topic.rule_explanation || ''}
                          onChange={(e) => updateGrammarTopic(index, { rule_explanation: e.target.value })}
                          placeholder="Explain the grammar rule"
                          rows={3}
                        />
                      </div>

                      <div className="field-group">
                        <label>Difficulty</label>
                        <select
                          value={topic.difficulty || 'beginner'}
                          onChange={(e) => updateGrammarTopic(index, { difficulty: e.target.value })}
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'exercises' && (
          <div className="exercises-section">
            <div className="section-header">
              <h3>Exercises</h3>
            </div>

            {content.exercises.length === 0 ? (
              <div className="empty-state">
                <p>No exercises found in the image.</p>
              </div>
            ) : (
              <div className="items-list">
                {content.exercises.map((exercise, index) => (
                  <div key={index} className="exercise-item">
                    <div className="item-header">
                      <div className="confidence-badge" style={{ backgroundColor: getConfidenceColor(exercise.confidence) }}>
                        {getConfidenceLabel(exercise.confidence)}
                      </div>
                    </div>

                    <div className="item-fields">
                      <div className="field-group">
                        <label>Question</label>
                        <textarea
                          value={exercise.question}
                          readOnly
                          rows={2}
                        />
                      </div>

                      {exercise.answer && (
                        <div className="field-group">
                          <label>Answer</label>
                          <input
                            type="text"
                            value={exercise.answer}
                            readOnly
                          />
                        </div>
                      )}

                      <div className="field-row">
                        <div className="field-group">
                          <label>Type</label>
                          <input
                            type="text"
                            value={exercise.exercise_type}
                            readOnly
                          />
                        </div>
                        {exercise.difficulty && (
                          <div className="field-group">
                            <label>Difficulty</label>
                            <input
                              type="text"
                              value={exercise.difficulty}
                              readOnly
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="review-actions">
        <button className="cancel-button" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
        <button 
          className="save-button" 
          onClick={onSave} 
          disabled={isSaving || (content.vocabulary.length === 0 && content.grammar_topics.length === 0)}
        >
          {isSaving ? 'Saving...' : 'Save to Learning Set'}
        </button>
      </div>
    </div>
  );
};