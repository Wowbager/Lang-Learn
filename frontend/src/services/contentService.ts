/**
 * Content management service for collections and learning sets
 */

import { authService } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  grade_level?: string;
  subject?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  learning_sets?: LearningSet[];
}

export interface LearningSet {
  id: string;
  name: string;
  description?: string;
  collection_id: string;
  created_by: string;
  grade_level?: string;
  subject?: string;
  created_at: string;
  updated_at?: string;
  vocabulary_items?: VocabularyItem[];
  grammar_topics?: GrammarTopic[];
}

export interface VocabularyItem {
  id: string;
  word: string;
  definition: string;
  example_sentence?: string;
  part_of_speech?: string;
  difficulty_level?: string;
  learning_set_id: string;
  created_at: string;
}

export interface GrammarTopic {
  id: string;
  name: string;
  description: string;
  rule_explanation?: string;
  examples?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learning_set_id: string;
  created_at: string;
}

export interface Permission {
  id: string;
  user_id: string;
  learning_set_id: string;
  role: 'viewer' | 'editor' | 'owner';
  granted_by: string;
  granted_at: string;
}

export interface CreateCollectionData {
  name: string;
  description?: string;
  grade_level?: string;
  subject?: string;
}

export interface CreateLearningSetData {
  name: string;
  description?: string;
  collection_id: string;
  grade_level?: string;
  subject?: string;
}

export interface CreateVocabularyData {
  word: string;
  definition: string;
  example_sentence?: string;
  part_of_speech?: string;
  difficulty_level?: string;
  learning_set_id: string;
}

export interface CreateGrammarData {
  name: string;
  description: string;
  rule_explanation?: string;
  examples?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learning_set_id: string;
}

class ContentService {
  private async getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Network error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // Collection methods
  async getCollections(params?: {
    skip?: number;
    limit?: number;
    grade_level?: string;
    subject?: string;
    search?: string;
  }): Promise<Collection[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.grade_level) queryParams.append('grade_level', params.grade_level);
    if (params?.subject) queryParams.append('subject', params.subject);
    if (params?.search) queryParams.append('search', params.search);

    const response = await fetch(`${API_BASE_URL}/content/collections?${queryParams}`, {
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse<Collection[]>(response);
  }

  async getCollection(id: string): Promise<Collection> {
    const response = await fetch(`${API_BASE_URL}/content/collections/${id}`, {
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse<Collection>(response);
  }

  async createCollection(data: CreateCollectionData): Promise<Collection> {
    const response = await fetch(`${API_BASE_URL}/content/collections`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<Collection>(response);
  }

  async updateCollection(id: string, data: Partial<CreateCollectionData>): Promise<Collection> {
    const response = await fetch(`${API_BASE_URL}/content/collections/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<Collection>(response);
  }

  async deleteCollection(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/content/collections/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    });
    await this.handleResponse<{ message: string }>(response);
  }

  // Learning Set methods
  async getLearningSets(params?: {
    skip?: number;
    limit?: number;
    collection_id?: string;
    grade_level?: string;
    subject?: string;
    search?: string;
  }): Promise<LearningSet[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.collection_id) queryParams.append('collection_id', params.collection_id);
    if (params?.grade_level) queryParams.append('grade_level', params.grade_level);
    if (params?.subject) queryParams.append('subject', params.subject);
    if (params?.search) queryParams.append('search', params.search);

    const response = await fetch(`${API_BASE_URL}/content/learning-sets?${queryParams}`, {
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse<LearningSet[]>(response);
  }

  async getLearningSet(id: string): Promise<LearningSet> {
    const response = await fetch(`${API_BASE_URL}/content/learning-sets/${id}`, {
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse<LearningSet>(response);
  }

  async createLearningSet(data: CreateLearningSetData): Promise<LearningSet> {
    const response = await fetch(`${API_BASE_URL}/content/learning-sets`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<LearningSet>(response);
  }

  async updateLearningSet(id: string, data: Partial<CreateLearningSetData>): Promise<LearningSet> {
    const response = await fetch(`${API_BASE_URL}/content/learning-sets/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<LearningSet>(response);
  }

  async deleteLearningSet(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/content/learning-sets/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    });
    await this.handleResponse<{ message: string }>(response);
  }

  // Vocabulary methods
  async createVocabulary(data: CreateVocabularyData): Promise<VocabularyItem> {
    const response = await fetch(`${API_BASE_URL}/content/vocabulary`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<VocabularyItem>(response);
  }

  async getVocabulary(id: string): Promise<VocabularyItem> {
    const response = await fetch(`${API_BASE_URL}/content/vocabulary/${id}`, {
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse<VocabularyItem>(response);
  }

  async updateVocabulary(id: string, data: Partial<CreateVocabularyData>): Promise<VocabularyItem> {
    const response = await fetch(`${API_BASE_URL}/content/vocabulary/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<VocabularyItem>(response);
  }

  async deleteVocabulary(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/content/vocabulary/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    });
    await this.handleResponse<{ message: string }>(response);
  }

  // Grammar methods
  async createGrammar(data: CreateGrammarData): Promise<GrammarTopic> {
    const response = await fetch(`${API_BASE_URL}/content/grammar`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<GrammarTopic>(response);
  }

  async getGrammar(id: string): Promise<GrammarTopic> {
    const response = await fetch(`${API_BASE_URL}/content/grammar/${id}`, {
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse<GrammarTopic>(response);
  }

  async updateGrammar(id: string, data: Partial<CreateGrammarData>): Promise<GrammarTopic> {
    const response = await fetch(`${API_BASE_URL}/content/grammar/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<GrammarTopic>(response);
  }

  async deleteGrammar(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/content/grammar/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    });
    await this.handleResponse<{ message: string }>(response);
  }

  // Permission methods
  async getPermissions(learningSetId: string): Promise<Permission[]> {
    const response = await fetch(`${API_BASE_URL}/content/learning-sets/${learningSetId}/permissions`, {
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse<Permission[]>(response);
  }

  async grantPermission(learningSetId: string, userId: string, role: 'viewer' | 'editor' | 'owner'): Promise<Permission> {
    const response = await fetch(`${API_BASE_URL}/content/learning-sets/${learningSetId}/permissions`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ user_id: userId, role })
    });
    return this.handleResponse<Permission>(response);
  }

  async revokePermission(permissionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/content/permissions/${permissionId}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    });
    await this.handleResponse<{ message: string }>(response);
  }
}

export const contentService = new ContentService();