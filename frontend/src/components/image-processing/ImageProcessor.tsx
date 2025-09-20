/**
 * Main image processing component that handles the complete workflow
 */

import React, { useState } from 'react';
import { ImageUpload } from './ImageUpload';
import { ContentReview } from './ContentReview';
import {
  imageProcessingService,
  ImageUploadResponse,
  ExtractedContent,
  SaveContentRequest
} from '../../services/imageProcessingService';
import './ImageProcessor.css';

interface ImageProcessorProps {
  learningSetId: string;
  onContentSaved: () => void;
  onCancel: () => void;
}

type ProcessingStep = 'upload' | 'review' | 'saving' | 'complete';

export const ImageProcessor: React.FC<ImageProcessorProps> = ({
  learningSetId,
  onContentSaved,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('upload');
  const [uploadResult, setUploadResult] = useState<ImageUploadResponse | null>(null);
  const [reviewedContent, setReviewedContent] = useState<ExtractedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleUploadSuccess = (result: ImageUploadResponse) => {
    setUploadResult(result);
    setReviewedContent(result.processing_result.extracted_content);
    setError(null);
    setCurrentStep('review');
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
    setUploadResult(null);
    setReviewedContent(null);
  };

  const handleContentChange = (content: ExtractedContent) => {
    setReviewedContent(content);
  };

  const handleSave = async () => {
    if (!reviewedContent || !uploadResult) return;

    setIsSaving(true);
    setError(null);

    try {
      const saveRequest: SaveContentRequest = {
        learning_set_id: learningSetId,
        vocabulary_items: reviewedContent.vocabulary,
        grammar_topics: reviewedContent.grammar_topics
      };

      await imageProcessingService.saveContentToLearningSet(saveRequest);

      // Clean up the temporary file
      if (uploadResult.file_id) {
        try {
          await imageProcessingService.cleanupFile(uploadResult.file_id);
        } catch (cleanupError) {
          // Ignore cleanup errors
          console.warn('Failed to cleanup temporary file:', cleanupError);
        }
      }

      setCurrentStep('complete');
      onContentSaved();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save content');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    // Clean up temporary file if it exists
    if (uploadResult?.file_id) {
      try {
        await imageProcessingService.cleanupFile(uploadResult.file_id);
      } catch (cleanupError) {
        // Ignore cleanup errors
        console.warn('Failed to cleanup temporary file:', cleanupError);
      }
    }

    onCancel();
  };

  const handleRetry = () => {
    setCurrentStep('upload');
    setUploadResult(null);
    setReviewedContent(null);
    setError(null);
  };

  return (
    <div className="image-processor">
      <div className="processor-header">
        <h1>Extract Content from Image</h1>
        <div className="step-indicator">
          <div className={`step ${currentStep === 'upload' ? 'active' : 'completed'}`}>
            <span className="step-number">1</span>
            <span className="step-label">Upload Image</span>
          </div>
          <div className="step-divider"></div>
          <div className={`step ${currentStep === 'review' ? 'active' : currentStep === 'saving' || currentStep === 'complete' ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Review Content</span>
          </div>
          <div className="step-divider"></div>
          <div className={`step ${currentStep === 'saving' || currentStep === 'complete' ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Save</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <div>
              <strong>Error:</strong> {error}
            </div>
            <button className="retry-button" onClick={handleRetry}>
              Try Again
            </button>
          </div>
        </div>
      )}

      <div className="processor-content">
        {currentStep === 'upload' && (
          <div className="upload-step">
            <ImageUpload
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
            
            <div className="upload-tips">
              <h3>Tips for Best Results</h3>
              <ul>
                <li>Use good lighting and avoid shadows</li>
                <li>Keep the camera steady and focused</li>
                <li>Include the entire page or section you want to extract</li>
                <li>Make sure text is clearly readable</li>
                <li>Both printed and handwritten text are supported</li>
              </ul>
            </div>
          </div>
        )}

        {currentStep === 'review' && uploadResult && reviewedContent && (
          <div className="review-step">
            <div className="processing-info">
              <div className="info-card">
                <h3>Processing Results</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Source Type:</span>
                    <span className="info-value">{uploadResult.processing_result.source_type}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Confidence:</span>
                    <span className="info-value">
                      {Math.round(uploadResult.processing_result.confidence * 100)}%
                    </span>
                  </div>
                  {uploadResult.processing_result.suggested_grade_level && (
                    <div className="info-item">
                      <span className="info-label">Suggested Grade:</span>
                      <span className="info-value">{uploadResult.processing_result.suggested_grade_level}</span>
                    </div>
                  )}
                </div>
                {uploadResult.processing_result.processing_notes && (
                  <div className="processing-notes">
                    <strong>Notes:</strong> {uploadResult.processing_result.processing_notes}
                  </div>
                )}
              </div>
            </div>

            <ContentReview
              extractedContent={reviewedContent}
              onContentChange={handleContentChange}
              onSave={handleSave}
              onCancel={handleCancel}
              isSaving={isSaving}
            />
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="complete-step">
            <div className="success-message">
              <div className="success-icon">✅</div>
              <h2>Content Saved Successfully!</h2>
              <p>
                The extracted vocabulary and grammar topics have been added to your learning set.
                You can now start practicing with this content.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};