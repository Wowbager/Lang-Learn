/**
 * Form component for creating and editing learning sets
 */

import React, { useState, useEffect } from 'react';
import { contentService, LearningSet, Collection, CreateLearningSetData } from '../../services/contentService';

interface LearningSetFormProps {
  learningSet?: LearningSet;
  defaultCollectionId?: string;
  onSave: (learningSet: LearningSet) => void;
  onCancel: () => void;
}

export const LearningSetForm: React.FC<LearningSetFormProps> = ({
  learningSet,
  defaultCollectionId,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<CreateLearningSetData>({
    name: learningSet?.name || '',
    description: learningSet?.description || '',
    collection_id: learningSet?.collection_id || defaultCollectionId || '',
    grade_level: learningSet?.grade_level || '',
    subject: learningSet?.subject || ''
  });
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoadingCollections(true);
      const data = await contentService.getCollections();
      setCollections(data);
    } catch (err) {
      setError('Failed to load collections');
    } finally {
      setLoadingCollections(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Learning set name is required');
      return;
    }

    if (!formData.collection_id) {
      setError('Please select a collection');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let savedLearningSet: LearningSet;
      if (learningSet) {
        savedLearningSet = await contentService.updateLearningSet(learningSet.id, formData);
      } else {
        savedLearningSet = await contentService.createLearningSet(formData);
      }
      
      onSave(savedLearningSet);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save learning set');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateLearningSetData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loadingCollections) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {learningSet ? 'Edit Learning Set' : 'Create New Learning Set'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Learning Set Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Enter learning set name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Collection */}
        <div>
          <label htmlFor="collection_id" className="block text-sm font-medium text-gray-700 mb-1">
            Collection *
          </label>
          <select
            id="collection_id"
            value={formData.collection_id}
            onChange={(e) => handleChange('collection_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a collection</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe this learning set"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Grade Level */}
        <div>
          <label htmlFor="grade_level" className="block text-sm font-medium text-gray-700 mb-1">
            Grade Level
          </label>
          <select
            id="grade_level"
            value={formData.grade_level}
            onChange={(e) => handleChange('grade_level', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select grade level</option>
            <option value="K">Kindergarten</option>
            <option value="1">1st Grade</option>
            <option value="2">2nd Grade</option>
            <option value="3">3rd Grade</option>
            <option value="4">4th Grade</option>
            <option value="5">5th Grade</option>
            <option value="6">6th Grade</option>
            <option value="7">7th Grade</option>
            <option value="8">8th Grade</option>
            <option value="9">9th Grade</option>
            <option value="10">10th Grade</option>
            <option value="11">11th Grade</option>
            <option value="12">12th Grade</option>
          </select>
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <select
            id="subject"
            value={formData.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select subject</option>
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Italian">Italian</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (learningSet ? 'Update' : 'Create')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};