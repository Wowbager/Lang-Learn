/**
 * Tests for contentService
 */

import { contentService } from '../contentService';
import { authService } from '../authService';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock authService
jest.mock('../authService');
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('ContentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.getToken.mockReturnValue('mock-token');
  });

  describe('Collections', () => {
    it('gets collections with default parameters', async () => {
      const mockCollections = [
        { id: '1', name: 'Collection 1', created_by: 'user1', created_at: '2023-01-01' },
        { id: '2', name: 'Collection 2', created_by: 'user1', created_at: '2023-01-02' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCollections
      } as Response);

      const result = await contentService.getCollections();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/content/collections?',
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          }
        }
      );
      expect(result).toEqual(mockCollections);
    });

    it('gets collections with search parameters', async () => {
      const mockCollections = [];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCollections
      } as Response);

      await contentService.getCollections({
        skip: 10,
        limit: 20,
        grade_level: '5',
        subject: 'English',
        search: 'test'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/content/collections?skip=10&limit=20&grade_level=5&subject=English&search=test',
        expect.any(Object)
      );
    });

    it('creates a collection', async () => {
      const collectionData = {
        name: 'New Collection',
        description: 'Test description',
        grade_level: '3',
        subject: 'Math'
      };

      const mockResponse = { id: '1', ...collectionData, created_by: 'user1', created_at: '2023-01-01' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await contentService.createCollection(collectionData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/content/collections',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify(collectionData)
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('updates a collection', async () => {
      const updateData = { name: 'Updated Collection' };
      const mockResponse = { id: '1', ...updateData, created_by: 'user1', created_at: '2023-01-01' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await contentService.updateCollection('1', updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/content/collections/1',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify(updateData)
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('deletes a collection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Collection deleted successfully' })
      } as Response);

      await contentService.deleteCollection('1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/content/collections/1',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          }
        }
      );
    });

    it('gets a specific collection', async () => {
      const mockCollection = { id: '1', name: 'Collection 1', created_by: 'user1', created_at: '2023-01-01' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCollection
      } as Response);

      const result = await contentService.getCollection('1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/content/collections/1',
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          }
        }
      );
      expect(result).toEqual(mockCollection);
    });
  });

  describe('Learning Sets', () => {
    it('gets learning sets with filters', async () => {
      const mockLearningSets = [
        { id: '1', name: 'Set 1', collection_id: 'col1', created_by: 'user1', created_at: '2023-01-01' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLearningSets
      } as Response);

      await contentService.getLearningSets({
        collection_id: 'col1',
        grade_level: '5',
        search: 'test'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/content/learning-sets?collection_id=col1&grade_level=5&search=test',
        expect.any(Object)
      );
    });

    it('creates a learning set', async () => {
      const learningSetData = {
        name: 'New Learning Set',
        description: 'Test description',
        collection_id: 'col1',
        grade_level: '3',
        subject: 'Math'
      };

      const mockResponse = { id: '1', ...learningSetData, created_by: 'user1', created_at: '2023-01-01' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await contentService.createLearningSet(learningSetData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/content/learning-sets',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify(learningSetData)
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Vocabulary', () => {
    it('creates vocabulary item', async () => {
      const vocabularyData = {
        word: 'hello',
        definition: 'a greeting',
        example_sentence: 'Hello there!',
        part_of_speech: 'interjection',
        difficulty_level: 'beginner',
        learning_set_id: 'set1'
      };

      const mockResponse = { id: '1', ...vocabularyData, created_at: '2023-01-01' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await contentService.createVocabulary(vocabularyData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/content/vocabulary',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify(vocabularyData)
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('updates vocabulary item', async () => {
      const updateData = { word: 'updated word', definition: 'updated definition' };
      const mockResponse = { id: '1', ...updateData, learning_set_id: 'set1', created_at: '2023-01-01' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await contentService.updateVocabulary('1', updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/content/vocabulary/1',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify(updateData)
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Grammar', () => {
    it('creates grammar topic', async () => {
      const grammarData = {
        name: 'Present Tense',
        description: 'Basic present tense',
        rule_explanation: 'Use for current actions',
        examples: ['I walk', 'She runs'],
        difficulty: 'beginner' as const,
        learning_set_id: 'set1'
      };

      const mockResponse = { id: '1', ...grammarData, created_at: '2023-01-01' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await contentService.createGrammar(grammarData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/content/grammar',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify(grammarData)
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Permissions', () => {
    it('grants permission', async () => {
      const mockResponse = {
        id: '1',
        user_id: 'user2',
        learning_set_id: 'set1',
        role: 'editor' as const,
        granted_by: 'user1',
        granted_at: '2023-01-01'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await contentService.grantPermission('set1', 'user2', 'editor');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/content/learning-sets/set1/permissions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({ user_id: 'user2', role: 'editor' })
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('gets permissions', async () => {
      const mockPermissions = [
        { id: '1', user_id: 'user1', learning_set_id: 'set1', role: 'owner', granted_by: 'user1', granted_at: '2023-01-01' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPermissions
      } as Response);

      const result = await contentService.getPermissions('set1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/content/learning-sets/set1/permissions',
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          }
        }
      );
      expect(result).toEqual(mockPermissions);
    });
  });

  describe('Error Handling', () => {
    it('handles HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Not found' })
      } as Response);

      await expect(contentService.getCollection('nonexistent')).rejects.toThrow('Not found');
    });

    it('handles network errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => { throw new Error('JSON parse error'); }
      } as Response);

      await expect(contentService.getCollection('1')).rejects.toThrow('HTTP 500');
    });

    it('handles missing authentication token', async () => {
      mockAuthService.getToken.mockReturnValue(null);

      const result = await contentService.getCollections();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer null'
          }
        }
      );
    });
  });
});