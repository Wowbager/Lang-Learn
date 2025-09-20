/**
 * Tests for ContentReview component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContentReview } from '../ContentReview';
import { ExtractedContent } from '../../../services/imageProcessingService';

describe('ContentReview', () => {
  const mockOnContentChange = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  const sampleContent: ExtractedContent = {
    vocabulary: [
      {
        word: 'apple',
        definition: 'a fruit',
        example_sentence: 'I eat an apple',
        part_of_speech: 'noun',
        confidence: 0.9
      }
    ],
    grammar_topics: [
      {
        name: 'Present Tense',
        description: 'Simple present tense',
        rule_explanation: 'Used for habitual actions',
        examples: ['I walk', 'She runs'],
        difficulty: 'beginner',
        confidence: 0.8
      }
    ],
    exercises: [
      {
        question: 'What is the past tense of "run"?',
        answer: 'ran',
        exercise_type: 'fill-in-blank',
        difficulty: 'beginner',
        confidence: 0.7
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderContentReview = (props = {}) => {
    return render(
      <ContentReview
        extractedContent={sampleContent}
        onContentChange={mockOnContentChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        {...props}
      />
    );
  };

  it('renders with correct header and tabs', () => {
    renderContentReview();

    expect(screen.getByText('Review Extracted Content')).toBeInTheDocument();
    expect(screen.getByText('Vocabulary (1)')).toBeInTheDocument();
    expect(screen.getByText('Grammar (1)')).toBeInTheDocument();
    expect(screen.getByText('Exercises (1)')).toBeInTheDocument();
  });

  it('shows vocabulary tab by default', () => {
    renderContentReview();

    expect(screen.getByText('Vocabulary Items')).toBeInTheDocument();
    expect(screen.getByDisplayValue('apple')).toBeInTheDocument();
    expect(screen.getByDisplayValue('a fruit')).toBeInTheDocument();
  });

  it('switches between tabs', () => {
    renderContentReview();

    // Click grammar tab
    fireEvent.click(screen.getByText('Grammar (1)'));
    expect(screen.getByText('Grammar Topics')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Present Tense')).toBeInTheDocument();

    // Click exercises tab
    fireEvent.click(screen.getByText('Exercises (1)'));
    expect(screen.getByText('Exercises')).toBeInTheDocument();
    expect(screen.getByDisplayValue('What is the past tense of "run"?')).toBeInTheDocument();
  });

  it('displays confidence badges correctly', () => {
    renderContentReview();

    const confidenceBadges = screen.getAllByText('High');
    expect(confidenceBadges).toHaveLength(1); // For vocabulary item with 0.9 confidence

    // Switch to grammar tab to see medium confidence
    fireEvent.click(screen.getByText('Grammar (1)'));
    expect(screen.getByText('High')).toBeInTheDocument(); // 0.8 confidence
  });

  it('allows editing vocabulary items', async () => {
    renderContentReview();

    const wordInput = screen.getByDisplayValue('apple');
    fireEvent.change(wordInput, { target: { value: 'orange' } });

    await waitFor(() => {
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          vocabulary: expect.arrayContaining([
            expect.objectContaining({
              word: 'orange'
            })
          ])
        })
      );
    });
  });

  it('allows editing grammar topics', async () => {
    renderContentReview();

    // Switch to grammar tab
    fireEvent.click(screen.getByText('Grammar (1)'));

    const nameInput = screen.getByDisplayValue('Present Tense');
    fireEvent.change(nameInput, { target: { value: 'Past Tense' } });

    await waitFor(() => {
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          grammar_topics: expect.arrayContaining([
            expect.objectContaining({
              name: 'Past Tense'
            })
          ])
        })
      );
    });
  });

  it('allows removing vocabulary items', async () => {
    renderContentReview();

    const removeButton = screen.getByText('×');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          vocabulary: []
        })
      );
    });
  });

  it('allows adding new vocabulary items', async () => {
    renderContentReview();

    const addButton = screen.getByText('+ Add Word');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          vocabulary: expect.arrayContaining([
            expect.objectContaining({
              word: 'apple'
            }),
            expect.objectContaining({
              word: '',
              confidence: 1.0
            })
          ])
        })
      );
    });
  });

  it('allows adding new grammar topics', async () => {
    renderContentReview();

    // Switch to grammar tab
    fireEvent.click(screen.getByText('Grammar (1)'));

    const addButton = screen.getByText('+ Add Topic');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          grammar_topics: expect.arrayContaining([
            expect.objectContaining({
              name: 'Present Tense'
            }),
            expect.objectContaining({
              name: '',
              confidence: 1.0
            })
          ])
        })
      );
    });
  });

  it('shows empty state when no content', () => {
    const emptyContent: ExtractedContent = {
      vocabulary: [],
      grammar_topics: [],
      exercises: []
    };

    render(
      <ContentReview
        extractedContent={emptyContent}
        onContentChange={mockOnContentChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('No vocabulary items found. Click "Add Word" to add items manually.')).toBeInTheDocument();
  });

  it('shows exercises as read-only', () => {
    renderContentReview();

    // Switch to exercises tab
    fireEvent.click(screen.getByText('Exercises (1)'));

    const questionTextarea = screen.getByDisplayValue('What is the past tense of "run"?');
    expect(questionTextarea).toHaveAttribute('readonly');

    const answerInput = screen.getByDisplayValue('ran');
    expect(answerInput).toHaveAttribute('readonly');
  });

  it('handles save button click', () => {
    renderContentReview();

    const saveButton = screen.getByText('Save to Learning Set');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalled();
  });

  it('handles cancel button click', () => {
    renderContentReview();

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables save button when no content', () => {
    const emptyContent: ExtractedContent = {
      vocabulary: [],
      grammar_topics: [],
      exercises: []
    };

    render(
      <ContentReview
        extractedContent={emptyContent}
        onContentChange={mockOnContentChange}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const saveButton = screen.getByText('Save to Learning Set');
    expect(saveButton).toBeDisabled();
  });

  it('shows saving state', () => {
    renderContentReview({ isSaving: true });

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    
    const saveButton = screen.getByText('Saving...');
    expect(saveButton).toBeDisabled();
    
    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeDisabled();
  });

  it('updates part of speech dropdown', async () => {
    renderContentReview();

    const partOfSpeechSelect = screen.getByDisplayValue('noun');
    fireEvent.change(partOfSpeechSelect, { target: { value: 'verb' } });

    await waitFor(() => {
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          vocabulary: expect.arrayContaining([
            expect.objectContaining({
              part_of_speech: 'verb'
            })
          ])
        })
      );
    });
  });

  it('updates grammar difficulty dropdown', async () => {
    renderContentReview();

    // Switch to grammar tab
    fireEvent.click(screen.getByText('Grammar (1)'));

    const difficultySelect = screen.getByDisplayValue('beginner');
    fireEvent.change(difficultySelect, { target: { value: 'intermediate' } });

    await waitFor(() => {
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          grammar_topics: expect.arrayContaining([
            expect.objectContaining({
              difficulty: 'intermediate'
            })
          ])
        })
      );
    });
  });
});