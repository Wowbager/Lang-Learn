/**
 * Service for handling image processing API calls
 */

import { authService } from './authService';

export interface ExtractedVocabularyItem {
  word: string;
  definition?: string;
  example_sentence?: string;
  part_of_speech?: string;
  confidence: number;
}

export interface ExtractedGrammarTopic {
  name: string;
  description?: string;
  rule_explanation?: string;
  examples?: string[];
  difficulty?: string;
  confidence: number;
}

export interface ExtractedExercise {
  question: string;
  answer?: string;
  exercise_type: string;
  difficulty?: string;
  confidence: number;
}

export interface ExtractedContent {
  vocabulary: ExtractedVocabularyItem[];
  grammar_topics: ExtractedGrammarTopic[];
  exercises: ExtractedExercise[];
}

export interface ImageProcessingResult {
  extracted_content: ExtractedContent;
  confidence: number;
  source_type: 'printed' | 'handwritten' | 'mixed';
  suggested_grade_level?: string;
  needs_review: boolean;
  processing_notes?: string;
}

export interface ImageUploadResponse {
  file_id: string;
  filename: string;
  processing_result: ImageProcessingResult;
}

export interface SaveContentRequest {
  learning_set_id: string;
  vocabulary_items: ExtractedVocabularyItem[];
  grammar_topics: ExtractedGrammarTopic[];
}

class ImageProcessingService {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  /**
   * Upload and process an image
   */
  async uploadAndProcessImage(file: File): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/image-processing/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to process image');
    }

    return response.json();
  }

  /**
   * Reprocess a previously uploaded image
   */
  async reprocessImage(fileId: string): Promise<ImageProcessingResult> {
    const response = await fetch(`${this.baseUrl}/api/image-processing/reprocess/${fileId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to reprocess image');
    }

    return response.json();
  }

  /**
   * Save extracted content to a learning set
   */
  async saveContentToLearningSet(request: SaveContentRequest): Promise<any> {
    const formData = new FormData();
    formData.append('learning_set_id', request.learning_set_id);
    formData.append('vocabulary_items', JSON.stringify(request.vocabulary_items));
    formData.append('grammar_topics', JSON.stringify(request.grammar_topics));

    const response = await fetch(`${this.baseUrl}/api/image-processing/save-to-learning-set`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to save content');
    }

    return response.json();
  }

  /**
   * Clean up a temporary file
   */
  async cleanupFile(fileId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/image-processing/cleanup/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to cleanup file');
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Please select a valid image file (JPG, PNG, GIF, BMP, TIFF, or WebP)'
      };
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size must be less than 10MB'
      };
    }

    return { valid: true };
  }
}

export const imageProcessingService = new ImageProcessingService();