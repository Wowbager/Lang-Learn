import apiClient from './apiClient';
import { 
  ClassData, 
  Permission, 
  SharedContent, 
  ClassCreateRequest, 
  ClassUpdateRequest, 
  PermissionCreateRequest 
} from '../types/collaboration';

class CollaborationService {
  // Class management
  async createClass(classData: ClassCreateRequest): Promise<ClassData> {
    const response = await apiClient.post('/collaboration/classes', classData);
    return response.data;
  }

  async getUserClasses(): Promise<ClassData[]> {
    const response = await apiClient.get('/collaboration/classes');
    return response.data;
  }

  async getClass(classId: string): Promise<ClassData> {
    const response = await apiClient.get(`/collaboration/classes/${classId}`);
    return response.data;
  }

  async updateClass(classId: string, updates: ClassUpdateRequest): Promise<ClassData> {
    const response = await apiClient.put(`/collaboration/classes/${classId}`, updates);
    return response.data;
  }

  async deleteClass(classId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/collaboration/classes/${classId}`);
    return response.data;
  }

  // Student enrollment
  async joinClass(inviteCode: string): Promise<{ message: string }> {
    const response = await apiClient.post('/collaboration/classes/join', { invite_code: inviteCode });
    return response.data;
  }

  async removeStudent(classId: string, studentId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/collaboration/classes/${classId}/students/${studentId}`);
    return response.data;
  }

  // Content sharing
  async shareContentWithClass(classId: string, learningSetId: string): Promise<{ message: string }> {
    const response = await apiClient.post(`/collaboration/classes/${classId}/share/${learningSetId}`);
    return response.data;
  }

  async unshareContentFromClass(classId: string, learningSetId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/collaboration/classes/${classId}/share/${learningSetId}`);
    return response.data;
  }

  // Permission management
  async grantPermission(userId: string, learningSetId: string, role: 'viewer' | 'editor' | 'owner'): Promise<Permission> {
    const permissionData: PermissionCreateRequest = {
      user_id: userId,
      learning_set_id: learningSetId,
      role
    };
    
    const response = await apiClient.post('/collaboration/permissions', permissionData);
    return response.data;
  }

  async getLearningSetPermissions(learningSetId: string): Promise<Permission[]> {
    const response = await apiClient.get(`/collaboration/permissions/learning-set/${learningSetId}`);
    return response.data;
  }

  async revokePermission(permissionId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/collaboration/permissions/${permissionId}`);
    return response.data;
  }

  // Shared content
  async getSharedContent(): Promise<SharedContent[]> {
    const response = await apiClient.get('/collaboration/shared-content');
    return response.data;
  }
}

export const collaborationService = new CollaborationService();