/**
 * Tests for ImageUpload component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageUpload } from '../ImageUpload';
import { imageProcessingService } from '../../../services/imageProcessingService';

// Mock the image processing service
jest.mock('../../../services/imageProcessingService');

const mockImageProcessingService = imageProcessingService as jest.Mocked<typeof imageProcessingService>;

describe('ImageUpload', () => {
  const mockOnUploadSuccess = jest.fn();
  const mockOnUploadError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderImageUpload = (props = {}) => {
    return render(
      <ImageUpload
        onUploadSuccess={mockOnUploadSuccess}
        onUploadError={mockOnUploadError}
        {...props}
      />
    );
  };

  it('renders upload area with correct content', () => {
    renderImageUpload();

    expect(screen.getByText('Upload Textbook Page or Worksheet')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop an image here, or click to select a file')).toBeInTheDocument();
    expect(screen.getByText('Supports JPG, PNG, GIF, BMP, TIFF, WebP (max 10MB)')).toBeInTheDocument();
  });

  it('shows disabled state when disabled prop is true', () => {
    renderImageUpload({ disabled: true });

    const uploadArea = screen.getByText('Upload Textbook Page or Worksheet').closest('.upload-area');
    expect(uploadArea).toHaveClass('disabled');
  });

  it('handles file selection through input', async () => {
    mockImageProcessingService.validateFile.mockReturnValue({ valid: true });
    mockImageProcessingService.uploadAndProcessImage.mockResolvedValue({
      file_id: 'test-id',
      filename: 'test.jpg',
      processing_result: {
        extracted_content: { vocabulary: [], grammar_topics: [], exercises: [] },
        confidence: 0.8,
        source_type: 'printed' as const,
        needs_review: false
      }
    });

    renderImageUpload();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockImageProcessingService.validateFile).toHaveBeenCalledWith(file);
      expect(mockImageProcessingService.uploadAndProcessImage).toHaveBeenCalledWith(file);
      expect(mockOnUploadSuccess).toHaveBeenCalled();
    });
  });

  it('handles file validation error', async () => {
    mockImageProcessingService.validateFile.mockReturnValue({
      valid: false,
      error: 'Invalid file type'
    });

    renderImageUpload();

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalledWith('Invalid file type');
    });
  });

  it('handles upload error', async () => {
    mockImageProcessingService.validateFile.mockReturnValue({ valid: true });
    mockImageProcessingService.uploadAndProcessImage.mockRejectedValue(new Error('Upload failed'));

    renderImageUpload();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalledWith('Upload failed');
    });
  });

  it('shows uploading state during upload', async () => {
    mockImageProcessingService.validateFile.mockReturnValue({ valid: true });
    
    // Create a promise that we can control
    let resolveUpload: (value: any) => void;
    const uploadPromise = new Promise((resolve) => {
      resolveUpload = resolve;
    });
    mockImageProcessingService.uploadAndProcessImage.mockReturnValue(uploadPromise);

    renderImageUpload();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    // Should show uploading state
    await waitFor(() => {
      expect(screen.getByText('Processing image...')).toBeInTheDocument();
      expect(screen.getByText('This may take a few moments')).toBeInTheDocument();
    });

    // Resolve the upload
    resolveUpload!({
      file_id: 'test-id',
      filename: 'test.jpg',
      processing_result: {
        extracted_content: { vocabulary: [], grammar_topics: [], exercises: [] },
        confidence: 0.8,
        source_type: 'printed' as const,
        needs_review: false
      }
    });

    await waitFor(() => {
      expect(mockOnUploadSuccess).toHaveBeenCalled();
    });
  });

  it('handles drag and drop', async () => {
    mockImageProcessingService.validateFile.mockReturnValue({ valid: true });
    mockImageProcessingService.uploadAndProcessImage.mockResolvedValue({
      file_id: 'test-id',
      filename: 'test.jpg',
      processing_result: {
        extracted_content: { vocabulary: [], grammar_topics: [], exercises: [] },
        confidence: 0.8,
        source_type: 'printed' as const,
        needs_review: false
      }
    });

    renderImageUpload();

    const uploadArea = screen.getByText('Upload Textbook Page or Worksheet').closest('.upload-area')!;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    // Simulate drag over
    fireEvent.dragOver(uploadArea, {
      dataTransfer: {
        files: [file]
      }
    });

    expect(uploadArea).toHaveClass('dragging');

    // Simulate drop
    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file]
      }
    });

    await waitFor(() => {
      expect(mockImageProcessingService.uploadAndProcessImage).toHaveBeenCalledWith(file);
    });
  });

  it('handles drag and drop with non-image file', () => {
    renderImageUpload();

    const uploadArea = screen.getByText('Upload Textbook Page or Worksheet').closest('.upload-area')!;
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file]
      }
    });

    expect(mockOnUploadError).toHaveBeenCalledWith('Please drop an image file');
  });

  it('ignores drag events when disabled', () => {
    renderImageUpload({ disabled: true });

    const uploadArea = screen.getByText('Upload Textbook Page or Worksheet').closest('.upload-area')!;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    fireEvent.dragOver(uploadArea, {
      dataTransfer: {
        files: [file]
      }
    });

    expect(uploadArea).not.toHaveClass('dragging');
  });

  it('ignores clicks when disabled', () => {
    renderImageUpload({ disabled: true });

    const uploadArea = screen.getByText('Upload Textbook Page or Worksheet').closest('.upload-area')!;
    
    fireEvent.click(uploadArea);

    // Should not trigger file input click
    const input = uploadArea.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });
});