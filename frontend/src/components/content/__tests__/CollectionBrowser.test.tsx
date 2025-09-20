/**
 * Tests for CollectionBrowser component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollectionBrowser } from '../CollectionBrowser';
import { contentService } from '../../../services/contentService';

// Mock the content service
jest.mock('../../../services/contentService');
const mockContentService = contentService as jest.Mocked<typeof contentService>;

const mockCollections = [
  {
    id: '1',
    name: 'English Basics',
    description: 'Basic English vocabulary and grammar',
    grade_level: '3',
    subject: 'English',
    created_by: 'user1',
    created_at: '2023-01-01T00:00:00Z',
    learning_sets: []
  },
  {
    id: '2',
    name: 'Spanish Fundamentals',
    description: 'Fundamental Spanish concepts',
    grade_level: '4',
    subject: 'Spanish',
    created_by: 'user1',
    created_at: '2023-01-02T00:00:00Z',
    learning_sets: []
  }
];

describe('CollectionBrowser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContentService.getCollections.mockResolvedValue(mockCollections);
  });

  it('renders collections list', async () => {
    render(<CollectionBrowser />);

    await waitFor(() => {
      expect(screen.getByText('English Basics')).toBeInTheDocument();
      expect(screen.getByText('Spanish Fundamentals')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    render(<CollectionBrowser />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    render(<CollectionBrowser />);

    await waitFor(() => {
      expect(screen.getByText('English Basics')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search collections...');
    fireEvent.change(searchInput, { target: { value: 'English' } });

    await waitFor(() => {
      expect(mockContentService.getCollections).toHaveBeenCalledWith({
        search: 'English'
      });
    });
  });

  it('handles grade level filter', async () => {
    render(<CollectionBrowser />);

    await waitFor(() => {
      expect(screen.getByText('English Basics')).toBeInTheDocument();
    });

    const gradeSelect = screen.getByLabelText('Grade Level');
    fireEvent.change(gradeSelect, { target: { value: '3' } });

    await waitFor(() => {
      expect(mockContentService.getCollections).toHaveBeenCalledWith({
        grade_level: '3'
      });
    });
  });

  it('handles subject filter', async () => {
    render(<CollectionBrowser />);

    await waitFor(() => {
      expect(screen.getByText('English Basics')).toBeInTheDocument();
    });

    const subjectSelect = screen.getByLabelText('Subject');
    fireEvent.change(subjectSelect, { target: { value: 'Spanish' } });

    await waitFor(() => {
      expect(mockContentService.getCollections).toHaveBeenCalledWith({
        subject: 'Spanish'
      });
    });
  });

  it('calls onSelectCollection when collection is clicked', async () => {
    const mockOnSelect = jest.fn();
    render(<CollectionBrowser onSelectCollection={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText('English Basics')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('English Basics'));
    expect(mockOnSelect).toHaveBeenCalledWith(mockCollections[0]);
  });

  it('calls onCreateCollection when create button is clicked', async () => {
    const mockOnCreate = jest.fn();
    render(<CollectionBrowser onCreateCollection={mockOnCreate} />);

    await waitFor(() => {
      expect(screen.getByText('Create Collection')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create Collection'));
    expect(mockOnCreate).toHaveBeenCalled();
  });

  it('handles delete collection', async () => {
    mockContentService.deleteCollection.mockResolvedValue();
    window.confirm = jest.fn().mockReturnValue(true);

    render(<CollectionBrowser />);

    await waitFor(() => {
      expect(screen.getByText('English Basics')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete collection');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockContentService.deleteCollection).toHaveBeenCalledWith('1');
    });
  });

  it('shows empty state when no collections', async () => {
    mockContentService.getCollections.mockResolvedValue([]);

    render(<CollectionBrowser />);

    await waitFor(() => {
      expect(screen.getByText('No collections found')).toBeInTheDocument();
    });
  });

  it('displays error message on API failure', async () => {
    mockContentService.getCollections.mockRejectedValue(new Error('API Error'));

    render(<CollectionBrowser />);

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('displays collection metadata correctly', async () => {
    render(<CollectionBrowser />);

    await waitFor(() => {
      expect(screen.getByText('Grade 3')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('0 sets')).toBeInTheDocument();
    });
  });
});