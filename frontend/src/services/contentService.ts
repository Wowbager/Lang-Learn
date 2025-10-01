/**
 * Content management service for collections and learning sets
 */

import apiClient from './apiClient';
import {
  Collection,
  LearningSet,
  VocabularyItem,
  GrammarTopic,
  Permission,
  CreateCollectionData,
  CreateLearningSetData,
  CreateVocabularyData,
  CreateGrammarData
} from '../types/content';

class ContentService {
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

    const response = await apiClient.get(`/content/collections?${queryParams}`);
    return response.data;
  }

  async getCollection(id: string): Promise<Collection> {
    const response = await apiClient.get(`/content/collections/${id}`);
    return response.data;
  }

  async createCollection(data: CreateCollectionData): Promise<Collection> {
    const response = await apiClient.post('/content/collections', data);
    return response.data;
  }

  async updateCollection(id: string, data: Partial<CreateCollectionData>): Promise<Collection> {
    const response = await apiClient.put(`/content/collections/${id}`, data);
    return response.data;
  }

  async deleteCollection(id: string): Promise<void> {
    await apiClient.delete(`/content/collections/${id}`);
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

    const response = await apiClient.get(`/content/learning-sets?${queryParams}`);
    return response.data;
  }

  async getLearningSet(id: string): Promise<LearningSet> {
    const response = await apiClient.get(`/content/learning-sets/${id}`);
    return response.data;
  }

  async createLearningSet(data: CreateLearningSetData): Promise<LearningSet> {
    const response = await apiClient.post('/content/learning-sets', data);
    return response.data;
  }

  async updateLearningSet(id: string, data: Partial<CreateLearningSetData>): Promise<LearningSet> {
    const response = await apiClient.put(`/content/learning-sets/${id}`, data);
    return response.data;
  }

  async deleteLearningSet(id: string): Promise<void> {
    await apiClient.delete(`/content/learning-sets/${id}`);
  }

  // Vocabulary methods
  async createVocabulary(data: CreateVocabularyData): Promise<VocabularyItem> {
    const response = await apiClient.post('/content/vocabulary', data);
    return response.data;
  }

  async getVocabulary(id: string): Promise<VocabularyItem> {
    const response = await apiClient.get(`/content/vocabulary/${id}`);
    return response.data;
  }

  async updateVocabulary(id: string, data: Partial<CreateVocabularyData>): Promise<VocabularyItem> {
    const response = await apiClient.put(`/content/vocabulary/${id}`, data);
    return response.data;
  }

  async deleteVocabulary(id: string): Promise<void> {
    await apiClient.delete(`/content/vocabulary/${id}`);
  }

  // Grammar methods
  async createGrammar(data: CreateGrammarData): Promise<GrammarTopic> {
    const response = await apiClient.post('/content/grammar', data);
    return response.data;
  }

  async getGrammar(id: string): Promise<GrammarTopic> {
    const response = await apiClient.get(`/content/grammar/${id}`);
    return response.data;
  }

  async updateGrammar(id: string, data: Partial<CreateGrammarData>): Promise<GrammarTopic> {
    const response = await apiClient.put(`/content/grammar/${id}`, data);
    return response.data;
  }

  async deleteGrammar(id: string): Promise<void> {
    await apiClient.delete(`/content/grammar/${id}`);
  }

  // Permission methods
  async getPermissions(learningSetId: string): Promise<Permission[]> {
    const response = await apiClient.get(`/content/learning-sets/${learningSetId}/permissions`);
    return response.data;
  }

  async grantPermission(learningSetId: string, userId: string, role: 'viewer' | 'editor' | 'owner'): Promise<Permission> {
    const response = await apiClient.post(`/content/learning-sets/${learningSetId}/permissions`, { user_id: userId, role });
    return response.data;
  }

  async revokePermission(permissionId: string): Promise<void> {
    await apiClient.delete(`/content/permissions/${permissionId}`);
  }
}

export const contentService = new ContentService();

// Re-export types for convenience
export type {
  Collection,
  LearningSet,
  VocabularyItem,
  GrammarTopic,
  Permission,
  CreateCollectionData,
  CreateLearningSetData,
  CreateVocabularyData,
  CreateGrammarData
};