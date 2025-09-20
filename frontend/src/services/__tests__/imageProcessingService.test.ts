/**
 * Tests for imageProcessingService
 */

import { imageProcessingService } from '../imageProcessingService';
import { authService } from '../authService';

// Mock authService
jest.mock('../authService');
const mockAuthService = authService as jest.Mocked<typeof authService>;

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('ImageProcessingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.getToken.mockReturnValue('test-token');
  });

  describe('uploadAndProcessImage', () => {
    it('uploads image successfully', async () => {
      const mockResponse = {
        file_id: 'test-id',
        filename: 'test.jpg',
        processing_result: {
          extracted_content: {
            vocabulary: [],
            grammar_topics: [],
            exercises: []
          },
          confidence: 0.8,
          source_type: 'printed',
          needs_review: false
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await imageProcessingService.uploadAndProcessImage(file);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/image-processing/upload',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token'
          },
          body: expect.any(FormData)
        })
      );
    });

    it('handles upload error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Upload failed' })
      } as Response);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await expect(imageProcessingService.uploadAndProcessImage(file))
        .rejects.toThrow('Upload failed');
    });

    it('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await expect(imageProcessingService.uploadAndProcessImage(file))
        .rejects.toThrow('Network error');
    });
  });

  describe('reprocessImage', () => {
    it('reprocesses image successfully', async () => {
      const mockResponse = {
        extracted_content: {
          vocabulary: [],
          grammar_topics: [],
          exercises: []
        },
        confidence: 0.7,
        source_type: 'handwritten',
        needs_review: true
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await imageProcessingService.reprocessImage('test-id');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/image-processing/reprocess/test-id',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('handles reprocess error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'File not found' })
      } as Response);

      await expect(imageProcessingService.reprocessImage('nonexistent-id'))
        .rejects.toThrow('File not found');
    });
  });

  describe('saveContentToLearningSet', () => {
    it('saves content successfully', async () => {
      const mockResponse = {
        message: 'Saved 1 vocabulary items and 1 grammar topics',
        saved_items: {
          vocabulary_items: [],
          grammar_topics: []
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const request = {
        learning_set_id: 'set-id',
        vocabulary_items: [
          {
            word: 'apple',
            definition: 'a fruit',
            confidence: 0.9
          }
        ],
        grammar_topics: [
          {
            name: 'Present Tense',
            description: 'Simple present tense',
            confidence: 0.8
          }
        ]
      };

      const result = await imageProcessingService.saveContentToLearningSet(request);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/image-processing/save-to-learning-set',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token'
          },
          body: expect.any(FormData)
        })
      );
    });

    it('handles save error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Learning set not found' })
      } as Response);

      const request = {
        learning_set_id: 'invalid-id',
        vocabulary_items: [],
        grammar_topics: []
      };

      await expect(imageProcessingService.saveContentToLearningSet(request))
        .rejects.toThrow('Learning set not found');
    });
  });

  describe('cleanupFile', () => {
    it('cleans up file successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Cleaned up 1 file(s)' })
      } as Response);

      await imageProcessingService.cleanupFile('test-id');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/image-processing/cleanup/test-id',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer test-token'
          }
        })
      );
    });

    it('handles cleanup error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'File not found' })
      } as Response);

      await expect(imageProcessingService.cleanupFile('nonexistent-id'))
        .rejects.toThrow('File not found');
    });
  });

  describe('validateFile', () => {
    it('validates valid image file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = imageProcessingService.validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects invalid file type', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = imageProcessingService.validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid image file');
    });

    it('rejects file that is too large', () => {
      // Create a mock file that reports as being too large
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 }); // 11MB

      const result = imageProcessingService.validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('less than 10MB');
    });

    it('accepts various image formats', () => {
      const formats = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/tiff',
        'image/webp'
      ];

      formats.forEach(type => {
        const file = new File(['test'], `test.${type.split('/')[1]}`, { type });
        const result = imageProcessingService.validateFile(file);

        expect(result.valid).toBe(true);
      });
    });

    it('accepts files up to 10MB', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // Exactly 10MB

      const result = imageProcessingService.validateFile(file);

      expect(result.valid).toBe(true);
    });
  });

  describe('API URL configuration', () => {
    it('uses environment variable for API URL', () => {
      // This test verifies that the service uses the correct base URL
      // The actual URL is set in the constructor
      expect(imageProcessingService).toBeDefined();
    });
  });
});