/**
 * TypeScript types for authentication and user management.
 */

export enum UserRole {
  STUDENT = "student",
  TEACHER = "teacher",
  PARENT = "parent"
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  grade_level?: string;
  curriculum_type?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserRegistration {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  grade_level?: string;
  curriculum_type?: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface UserUpdate {
  username?: string;
  email?: string;
  full_name?: string;
  grade_level?: string;
  curriculum_type?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: UserLogin) => Promise<void>;
  register: (userData: UserRegistration) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: UserUpdate) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}