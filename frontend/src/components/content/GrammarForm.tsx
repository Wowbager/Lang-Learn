/**
 * Form component for creating and editing grammar topics
 */

import React, { useState } from 'react';
import { contentService, GrammarTopic, CreateGrammarData } from '../../services/contentService';

interface GrammarFormProps {
  grammar?: GrammarTopic;
  learningSetId: string;
  onSave: (grammar: GrammarTopic) => void;
  onCancel: () => void;
}

export const GrammarForm: React.FC<GrammarFormProps> = ({
  grammar,
  learningSetId,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<CreateGrammarData>({
    name: grammar?.name || '',
    description: grammar?.description || '',
    rule_explanation: grammar?.rule_explanation || '',
    examples: grammar?.examples || [],
    difficulty: grammar?.difficulty || 'beginner',
    learning_set_id: learningSetId
  });
  const [newExample, setNewExample] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Grammar topic name is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let savedGrammar: GrammarTopic;
      if (grammar) {
        savedGrammar = await contentService.updateGrammar(grammar.id, formData);
      } else {
        savedGrammar = await contentService.createGrammar(formData);
      }
      
      onSave(savedGrammar);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save grammar topic');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateGrammarData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addExample = () => {
    if (newExample.trim()) {
      setFormData(prev => ({
        ...prev,
        examples: [...(prev.examples || []), newExample.trim()]
      }));
      setNewExample('');
    }
  };

  const removeExample = (index: number) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples?.filter((_, i) => i !== index) || []
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addExample();
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {grammar ? 'Edit Grammar Topic' : 'Add New Grammar Topic'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Topic Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Present Perfect Tense"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Difficulty */}
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty Level *
            </label>
            <select
              id="difficulty"
              value={formData.difficulty}
              onChange={(e) => handleChange('difficulty', e.target.value as 'beginner' | 'intermediate' | 'advanced')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe this grammar topic"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Rule Explanation */}
        <div>
          <label htmlFor="rule_explanation" className="block text-sm font-medium text-gray-700 mb-1">
            Rule Explanation
          </label>
          <textarea
            id="rule_explanation"
            value={formData.rule_explanation}
            onChange={(e) => handleChange('rule_explanation', e.target.value)}
            placeholder="Explain the grammar rule in detail"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Examples */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Examples
          </label>
          
          {/* Add new example */}
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={newExample}
              onChange={(e) => setNewExample(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter an example sentence"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addExample}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Add
            </button>
          </div>

          {/* Existing examples */}
          {formData.examples && formData.examples.length > 0 && (
            <div className="space-y-2">
              {formData.examples.map((example, index) => (
                <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                  <span className="flex-1 text-sm">{example}</span>
                  <button
                    type="button"
                    onClick={() => removeExample(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Remove example"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
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
            {loading ? 'Saving...' : (grammar ? 'Update' : 'Add')}
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