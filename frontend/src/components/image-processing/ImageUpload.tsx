/**
 * Image upload component with drag-and-drop support
 */

import React, { useState, useRef, DragEvent } from 'react';
import { imageProcessingService, ImageUploadResponse } from '../../services/imageProcessingService';
import './ImageUpload.css';

interface ImageUploadProps {
  onUploadSuccess: (result: ImageUploadResponse) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file
    const validation = imageProcessingService.validateFile(file);
    if (!validation.valid) {
      onUploadError(validation.error || 'Invalid file');
      return;
    }

    setIsUploading(true);

    try {
      const result = await imageProcessingService.uploadAndProcessImage(file);
      onUploadSuccess(result);
    } catch (error) {
      onUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const files = Array.from(event.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      handleFileSelect(imageFile);
    } else {
      onUploadError('Please drop an image file');
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="image-upload">
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''} ${disabled || isUploading ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          disabled={disabled || isUploading}
        />

        <div className="upload-content">
          {isUploading ? (
            <div className="uploading">
              <div className="spinner"></div>
              <p>Processing image...</p>
              <small>This may take a few moments</small>
            </div>
          ) : (
            <div className="upload-prompt">
              <div className="upload-icon">📷</div>
              <h3>Upload Textbook Page or Worksheet</h3>
              <p>
                Drag and drop an image here, or click to select a file
              </p>
              <small>
                Supports JPG, PNG, GIF, BMP, TIFF, WebP (max 10MB)
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};