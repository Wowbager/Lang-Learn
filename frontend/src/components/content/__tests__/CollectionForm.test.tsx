/**
 * Tests for CollectionForm component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollectionForm } from '../CollectionForm';
import { contentService } from '../../../services/contentService';

// Mock the content service
jest.mock('../../../services/contentService');
const mockContentService = contentService as jest.Mocked<typeof contentService>;

const mockCollection = {
  id: '1',
  name: 'Test Collection',
  description: 'Test description',
  grade_level: '5',
  subject: 'English',
  created_by: 'user1',
  created_at: '2023-01-01T00:00:00Z'
};

describe('CollectionForm', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form correctly', () => {
    render(
      <CollectionForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Create New Collection')).toBeInTheDocument();
    expect(screen.getByLabelText('Collection Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Grade Level')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders edit form with existing data', () => {
    render(
      <CollectionForm
        collection={mockCollection}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Edit Collection')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Collection')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('English')).toBeInTheDocument();
    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('handles form input changes', () => {
    render(
      <CollectionForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Collection Name *');
    fireEvent.change(nameInput, { target: { value: 'New Collection Name' } });
    expect(nameInput).toHaveValue('New Collection Name');

    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, { target: { value: 'New description' } });
    expect(descriptionInput).toHaveValue('New description');

    const gradeSelect = screen.getByLabelText('Grade Level');
    fireEvent.change(gradeSelect, { target: { value: '3' } });
    expect(gradeSelect).toHaveValue('3');

    const subjectSelect = screen.getByLabelText('Subject');
    fireEvent.change(subjectSelect, { target: { value: 'Spanish' } });
    expect(subjectSelect).toHaveValue('Spanish');
  });

  it('validates required fields', async () => {
    render(
      <CollectionForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Collection name is required')).toBeInTheDocument();
    });

    expect(mockContentService.createCollection).not.toHaveBeenCalled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('creates new collection successfully', async () => {
    const newCollection = { ...mockCollection, id: '2' };
    mockContentService.createCollection.mockResolvedValue(newCollection);

    render(
      <CollectionForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Fill form
    fireEvent.change(screen.getByLabelText('Collection Name *'), {
      target: { value: 'New Collection' }
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'New description' }
    });
    fireEvent.change(screen.getByLabelText('Grade Level'), {
      target: { value: '4' }
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Math' }
    });

    // Submit form
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockContentService.createCollection).toHaveBeenCalledWith({
        name: 'New Collection',
        description: 'New description',
        grade_level: '4',
        subject: 'Math'
      });
      expect(mockOnSave).toHaveBeenCalledWith(newCollection);
    });
  });

  it('updates existing collection successfully', async () => {
    const updatedCollection = { ...mockCollection, name: 'Updated Collection' };
    mockContentService.updateCollection.mockResolvedValue(updatedCollection);

    render(
      <CollectionForm
        collection={mockCollection}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Update name
    const nameInput = screen.getByLabelText('Collection Name *');
    fireEvent.change(nameInput, { target: { value: 'Updated Collection' } });

    // Submit form
    fireEvent.click(screen.getByText('Update'));

    await waitFor(() => {
      expect(mockContentService.updateCollection).toHaveBeenCalledWith('1', {
        name: 'Updated Collection',
        description: 'Test description',
        grade_level: '5',
        subject: 'English'
      });
      expect(mockOnSave).toHaveBeenCalledWith(updatedCollection);
    });
  });

  it('handles API errors', async () => {
    mockContentService.createCollection.mockRejectedValue(new Error('API Error'));

    render(
      <CollectionForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Fill required field
    fireEvent.change(screen.getByLabelText('Collection Name *'), {
      target: { value: 'Test Collection' }
    });

    // Submit form
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <CollectionForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables form during submission', async () => {
    mockContentService.createCollection.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <CollectionForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Fill required field
    fireEvent.change(screen.getByLabelText('Collection Name *'), {
      target: { value: 'Test Collection' }
    });

    // Submit form
    fireEvent.click(screen.getByText('Create'));

    // Check loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByText('Saving...')).toBeDisabled();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('handles empty optional fields correctly', async () => {
    const newCollection = { ...mockCollection, description: '', grade_level: '', subject: '' };
    mockContentService.createCollection.mockResolvedValue(newCollection);

    render(
      <CollectionForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Fill only required field
    fireEvent.change(screen.getByLabelText('Collection Name *'), {
      target: { value: 'Minimal Collection' }
    });

    // Submit form
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockContentService.createCollection).toHaveBeenCalledWith({
        name: 'Minimal Collection',
        description: '',
        grade_level: '',
        subject: ''
      });
    });
  });
});