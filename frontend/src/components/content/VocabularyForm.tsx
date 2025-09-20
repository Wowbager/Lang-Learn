/**
 * Form component for creating and editing vocabulary items
 */

import React, { useState } from 'react';
import { contentService, VocabularyItem, CreateVocabularyData } from '../../services/contentService';

interface VocabularyFormProps {
  vocabulary?: VocabularyItem;
  learningSetId: string;
  onSave: (vocabulary: VocabularyItem) => void;
  onCancel: () => void;
}

export const VocabularyForm: React.FC<VocabularyFormProps> = ({
  vocabulary,
  learningSetId,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<CreateVocabularyData>({
    word: vocabulary?.word || '',
    definition: vocabulary?.definition || '',
    example_sentence: vocabulary?.example_sentence || '',
    part_of_speech: vocabulary?.part_of_speech || '',
    difficulty_level: vocabulary?.difficulty_level || '',
    learning_set_id: learningSetId
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.word.trim()) {
      setError('Word is required');
      return;
    }

    if (!formData.definition.trim()) {
      setError('Definition is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let savedVocabulary: VocabularyItem;
      if (vocabulary) {
        savedVocabulary = await contentService.updateVocabulary(vocabulary.id, formData);
      } else {
        savedVocabulary = await contentService.createVocabulary(formData);
      }
      
      onSave(savedVocabulary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vocabulary item');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateVocabularyData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {vocabulary ? 'Edit Vocabulary Item' : 'Add New Vocabulary Item'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Word */}
          <div>
            <label htmlFor="word" className="block text-sm font-medium text-gray-700 mb-1">
              Word *
            </label>
            <input
              type="text"
              id="word"
              value={formData.word}
              onChange={(e) => handleChange('word', e.target.value)}
              placeholder="Enter the word"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Part of Speech */}
          <div>
            <label htmlFor="part_of_speech" className="block text-sm font-medium text-gray-700 mb-1">
              Part of Speech
            </label>
            <select
              id="part_of_speech"
              value={formData.part_of_speech}
              onChange={(e) => handleChange('part_of_speech', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select part of speech</option>
              <option value="noun">Noun</option>
              <option value="verb">Verb</option>
              <option value="adjective">Adjective</option>
              <option value="adverb">Adverb</option>
              <option value="pronoun">Pronoun</option>
              <option value="preposition">Preposition</option>
              <option value="conjunction">Conjunction</option>
              <option value="interjection">Interjection</option>
            </select>
          </div>
        </div>

        {/* Definition */}
        <div>
          <label htmlFor="definition" className="block text-sm font-medium text-gray-700 mb-1">
            Definition *
          </label>
          <textarea
            id="definition"
            value={formData.definition}
            onChange={(e) => handleChange('definition', e.target.value)}
            placeholder="Enter the definition"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Example Sentence */}
        <div>
          <label htmlFor="example_sentence" className="block text-sm font-medium text-gray-700 mb-1">
            Example Sentence
          </label>
          <textarea
            id="example_sentence"
            value={formData.example_sentence}
            onChange={(e) => handleChange('example_sentence', e.target.value)}
            placeholder="Enter an example sentence using this word"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Difficulty Level */}
        <div>
          <label htmlFor="difficulty_level" className="block text-sm font-medium text-gray-700 mb-1">
            Difficulty Level
          </label>
          <select
            id="difficulty_level"
            value={formData.difficulty_level}
            onChange={(e) => handleChange('difficulty_level', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select difficulty level</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
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
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (vocabulary ? 'Update' : 'Add')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};