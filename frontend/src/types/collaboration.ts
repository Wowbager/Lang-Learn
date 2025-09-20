/**
 * Type definitions for collaboration features
 */

export interface ClassData {
  id: string;
  name: string;
  description?: string;
  teacher_id: string;
  invite_code: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  students: UserData[];
  shared_content?: LearningSetData[];
}

export interface UserData {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'parent';
}

export interface LearningSetData {
  id: string;
  name: string;
  description?: string;
  collection_id: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface Permission {
  id: string;
  user_id: string;
  learning_set_id: string;
  role: 'viewer' | 'editor' | 'owner';
  granted_by: string;
  granted_at: string;
}

export interface SharedContent {
  learning_set: LearningSetData;
  shared_via: 'class' | 'permission';
  class_name?: string;
  permission: 'viewer' | 'editor' | 'owner';
  granted_by?: string;
}

export interface ClassCreateRequest {
  name: string;
  description?: string;
}

export interface ClassUpdateRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface PermissionCreateRequest {
  user_id: string;
  learning_set_id: string;
  role: 'viewer' | 'editor' | 'owner';
}