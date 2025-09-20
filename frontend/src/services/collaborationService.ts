import { authService } from './authService';
import { 
  ClassData, 
  Permission, 
  SharedContent, 
  ClassCreateRequest, 
  ClassUpdateRequest, 
  PermissionCreateRequest 
} from '../types/collaboration';

class CollaborationService {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = authService.getToken();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Class management
  async createClass(classData: ClassCreateRequest): Promise<ClassData> {
    return this.request<ClassData>('/api/collaboration/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  }

  async getUserClasses(): Promise<ClassData[]> {
    return this.request<ClassData[]>('/api/collaboration/classes');
  }

  async getClass(classId: string): Promise<ClassData> {
    return this.request<ClassData>(`/api/collaboration/classes/${classId}`);
  }

  async updateClass(classId: string, updates: ClassUpdateRequest): Promise<ClassData> {
    return this.request<ClassData>(`/api/collaboration/classes/${classId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteClass(classId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/collaboration/classes/${classId}`, {
      method: 'DELETE',
    });
  }

  // Student enrollment
  async joinClass(inviteCode: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/collaboration/classes/join', {
      method: 'POST',
      body: JSON.stringify({ invite_code: inviteCode }),
    });
  }

  async removeStudent(classId: string, studentId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/collaboration/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
    });
  }

  // Content sharing
  async shareContentWithClass(classId: string, learningSetId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/collaboration/classes/${classId}/share/${learningSetId}`, {
      method: 'POST',
    });
  }

  async unshareContentFromClass(classId: string, learningSetId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/collaboration/classes/${classId}/share/${learningSetId}`, {
      method: 'DELETE',
    });
  }

  // Permission management
  async grantPermission(userId: string, learningSetId: string, role: 'viewer' | 'editor' | 'owner'): Promise<Permission> {
    const permissionData: PermissionCreateRequest = {
      user_id: userId,
      learning_set_id: learningSetId,
      role
    };
    
    return this.request<Permission>('/api/collaboration/permissions', {
      method: 'POST',
      body: JSON.stringify(permissionData),
    });
  }

  async getLearningSetPermissions(learningSetId: string): Promise<Permission[]> {
    return this.request<Permission[]>(`/api/collaboration/permissions/learning-set/${learningSetId}`);
  }

  async revokePermission(permissionId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/collaboration/permissions/${permissionId}`, {
      method: 'DELETE',
    });
  }

  // Shared content
  async getSharedContent(): Promise<SharedContent[]> {
    return this.request<SharedContent[]>('/api/collaboration/shared-content');
  }
}

export const collaborationService = new CollaborationService();