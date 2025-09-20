/**
 * Learning set browser component for viewing and managing learning sets
 */

import React, { useState, useEffect } from 'react';
import { contentService, LearningSet, Collection } from '../../services/contentService';

interface LearningSetBrowserProps {
  collection?: Collection;
  onSelectLearningSet?: (learningSet: LearningSet) => void;
  onCreateLearningSet?: () => void;
  onEditLearningSet?: (learningSet: LearningSet) => void;
}

export const LearningSetBrowser: React.FC<LearningSetBrowserProps> = ({
  collection,
  onSelectLearningSet,
  onCreateLearningSet,
  onEditLearningSet
}) => {
  const [learningSets, setLearningSets] = useState<LearningSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLearningSets();
  }, [collection, searchTerm]);

  const loadLearningSets = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (collection) params.collection_id = collection.id;
      if (searchTerm) params.search = searchTerm;
      
      const data = await contentService.getLearningSets(params);
      setLearningSets(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load learning sets');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLearningSet = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this learning set?')) {
      return;
    }

    try {
      await contentService.deleteLearningSet(id);
      setLearningSets(learningSets.filter(ls => ls.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete learning set');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {collection ? `${collection.name} - Learning Sets` : 'Learning Sets'}
          </h2>
          {collection?.description && (
            <p className="text-gray-600 mt-1">{collection.description}</p>
          )}
        </div>
        {onCreateLearningSet && (
          <button
            onClick={onCreateLearningSet}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Learning Set
          </button>
        )}
      </div>

      {/* Search */}
      <div className="max-w-md">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
          Search Learning Sets
        </label>
        <input
          type="text"
          id="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search learning sets..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Learning Sets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {learningSets.map((learningSet) => (
          <div
            key={learningSet.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 
                className="text-lg font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600"
                onClick={() => onSelectLearningSet?.(learningSet)}
              >
                {learningSet.name}
              </h3>
              <div className="flex space-x-1">
                {onEditLearningSet && (
                  <button
                    onClick={() => onEditLearningSet(learningSet)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Edit learning set"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => handleDeleteLearningSet(learningSet.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Delete learning set"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            {learningSet.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {learningSet.description}
              </p>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Vocabulary:</span>
                <span className="font-medium">{learningSet.vocabulary_items?.length || 0} words</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Grammar:</span>
                <span className="font-medium">{learningSet.grammar_topics?.length || 0} topics</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
              <div className="flex space-x-2">
                {learningSet.grade_level && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Grade {learningSet.grade_level}
                  </span>
                )}
                {learningSet.subject && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    {learningSet.subject}
                  </span>
                )}
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => onSelectLearningSet?.(learningSet)}
              className="w-full mt-4 bg-blue-50 text-blue-700 py-2 px-4 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {learningSets.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No learning sets found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm
              ? 'Try adjusting your search to see more results.'
              : collection
              ? 'This collection doesn\'t have any learning sets yet.'
              : 'Get started by creating your first learning set.'}
          </p>
          {onCreateLearningSet && (
            <button
              onClick={onCreateLearningSet}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create Learning Set
            </button>
          )}
        </div>
      )}
    </div>
  );
};