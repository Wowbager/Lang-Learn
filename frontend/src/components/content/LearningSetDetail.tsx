/**
 * Detailed view of a learning set with vocabulary and grammar items
 */

import React, { useState, useEffect } from 'react';
import { contentService, LearningSet, VocabularyItem, GrammarTopic } from '../../services/contentService';
import { VocabularyForm } from './VocabularyForm';
import { GrammarForm } from './GrammarForm';

interface LearningSetDetailProps {
  learningSetId: string;
  onBack: () => void;
}

export const LearningSetDetail: React.FC<LearningSetDetailProps> = ({
  learningSetId,
  onBack
}) => {
  const [learningSet, setLearningSet] = useState<LearningSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'vocabulary' | 'grammar'>('vocabulary');
  const [showVocabForm, setShowVocabForm] = useState(false);
  const [showGrammarForm, setShowGrammarForm] = useState(false);
  const [editingVocab, setEditingVocab] = useState<VocabularyItem | null>(null);
  const [editingGrammar, setEditingGrammar] = useState<GrammarTopic | null>(null);

  useEffect(() => {
    loadLearningSet();
  }, [learningSetId]);

  const loadLearningSet = async () => {
    try {
      setLoading(true);
      const data = await contentService.getLearningSet(learningSetId);
      setLearningSet(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load learning set');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVocabulary = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vocabulary item?')) {
      return;
    }

    try {
      await contentService.deleteVocabulary(id);
      if (learningSet) {
        setLearningSet({
          ...learningSet,
          vocabulary_items: learningSet.vocabulary_items?.filter(v => v.id !== id) || []
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vocabulary item');
    }
  };

  const handleDeleteGrammar = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this grammar topic?')) {
      return;
    }

    try {
      await contentService.deleteGrammar(id);
      if (learningSet) {
        setLearningSet({
          ...learningSet,
          grammar_topics: learningSet.grammar_topics?.filter(g => g.id !== id) || []
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete grammar topic');
    }
  };

  const handleVocabularySaved = (vocabulary: VocabularyItem) => {
    if (learningSet) {
      if (editingVocab) {
        // Update existing
        setLearningSet({
          ...learningSet,
          vocabulary_items: learningSet.vocabulary_items?.map(v => 
            v.id === vocabulary.id ? vocabulary : v
          ) || []
        });
      } else {
        // Add new
        setLearningSet({
          ...learningSet,
          vocabulary_items: [...(learningSet.vocabulary_items || []), vocabulary]
        });
      }
    }
    setShowVocabForm(false);
    setEditingVocab(null);
  };

  const handleGrammarSaved = (grammar: GrammarTopic) => {
    if (learningSet) {
      if (editingGrammar) {
        // Update existing
        setLearningSet({
          ...learningSet,
          grammar_topics: learningSet.grammar_topics?.map(g => 
            g.id === grammar.id ? grammar : g
          ) || []
        });
      } else {
        // Add new
        setLearningSet({
          ...learningSet,
          grammar_topics: [...(learningSet.grammar_topics || []), grammar]
        });
      }
    }
    setShowGrammarForm(false);
    setEditingGrammar(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!learningSet) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Learning set not found</h3>
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{learningSet.name}</h1>
            {learningSet.description && (
              <p className="text-gray-600 mt-1">{learningSet.description}</p>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          {learningSet.grade_level && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Grade {learningSet.grade_level}
            </span>
          )}
          {learningSet.subject && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              {learningSet.subject}
            </span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('vocabulary')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'vocabulary'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Vocabulary ({learningSet.vocabulary_items?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('grammar')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'grammar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Grammar ({learningSet.grammar_topics?.length || 0})
          </button>
        </nav>
      </div>

      {/* Vocabulary Tab */}
      {activeTab === 'vocabulary' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Vocabulary Items</h3>
            <button
              onClick={() => setShowVocabForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Vocabulary
            </button>
          </div>

          {showVocabForm && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <VocabularyForm
                vocabulary={editingVocab || undefined}
                learningSetId={learningSet.id}
                onSave={handleVocabularySaved}
                onCancel={() => {
                  setShowVocabForm(false);
                  setEditingVocab(null);
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {learningSet.vocabulary_items?.map((vocab) => (
              <div key={vocab.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{vocab.word}</h4>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {
                        setEditingVocab(vocab);
                        setShowVocabForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteVocabulary(vocab.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-2">{vocab.definition}</p>
                {vocab.example_sentence && (
                  <p className="text-gray-500 text-sm italic">"{vocab.example_sentence}"</p>
                )}
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  {vocab.part_of_speech && (
                    <span className="bg-gray-100 px-2 py-1 rounded">{vocab.part_of_speech}</span>
                  )}
                  {vocab.difficulty_level && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">{vocab.difficulty_level}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {(!learningSet.vocabulary_items || learningSet.vocabulary_items.length === 0) && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No vocabulary items yet.</p>
              <button
                onClick={() => setShowVocabForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add First Vocabulary Item
              </button>
            </div>
          )}
        </div>
      )}

      {/* Grammar Tab */}
      {activeTab === 'grammar' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Grammar Topics</h3>
            <button
              onClick={() => setShowGrammarForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Grammar Topic
            </button>
          </div>

          {showGrammarForm && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <GrammarForm
                grammar={editingGrammar || undefined}
                learningSetId={learningSet.id}
                onSave={handleGrammarSaved}
                onCancel={() => {
                  setShowGrammarForm(false);
                  setEditingGrammar(null);
                }}
              />
            </div>
          )}

          <div className="space-y-4">
            {learningSet.grammar_topics?.map((grammar) => (
              <div key={grammar.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{grammar.name}</h4>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      grammar.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                      grammar.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {grammar.difficulty}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {
                        setEditingGrammar(grammar);
                        setShowGrammarForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteGrammar(grammar.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-3">{grammar.description}</p>
                
                {grammar.rule_explanation && (
                  <div className="mb-3">
                    <h5 className="font-medium text-gray-900 mb-1">Rule:</h5>
                    <p className="text-gray-700 text-sm">{grammar.rule_explanation}</p>
                  </div>
                )}
                
                {grammar.examples && grammar.examples.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Examples:</h5>
                    <ul className="list-disc list-inside space-y-1">
                      {grammar.examples.map((example, index) => (
                        <li key={index} className="text-gray-700 text-sm">{example}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {(!learningSet.grammar_topics || learningSet.grammar_topics.length === 0) && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No grammar topics yet.</p>
              <button
                onClick={() => setShowGrammarForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add First Grammar Topic
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};