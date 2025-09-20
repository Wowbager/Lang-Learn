/**
 * Authentication service for API communication.
 */

import { AxiosResponse } from 'axios';
import apiClient from './apiClient';
import { User, UserRegistration, UserLogin, UserUpdate, LoginResponse } from '../types/auth';

export class AuthService {
  /**
   * Register a new user account.
   */
  static async register(userData: UserRegistration): Promise<User> {
    const response: AxiosResponse<User> = await apiClient.post('/auth/register', userData);
    return response.data;
  }

  /**
   * Login user with credentials.
   */
  static async login(credentials: UserLogin): Promise<LoginResponse> {
    // Convert to form data for OAuth2PasswordRequestForm
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response: AxiosResponse<LoginResponse> = await apiClient.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Store token and user data
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    return response.data;
  }

  /**
   * Get current user profile.
   */
  static async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await apiClient.get('/auth/me');
    return response.data;
  }

  /**
   * Update current user profile.
   */
  static async updateProfile(userData: UserUpdate): Promise<User> {
    const response: AxiosResponse<User> = await apiClient.put('/auth/me', userData);
    
    // Update stored user data
    localStorage.setItem('user', JSON.stringify(response.data));
    
    return response.data;
  }

  /**
   * Logout current user.
   */
  static async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  }

  /**
   * Deactivate current user account.
   */
  static async deactivateAccount(): Promise<void> {
    await apiClient.delete('/auth/me');
    
    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  /**
   * Check if user is authenticated.
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  /**
   * Get stored user data.
   */
  static getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('user');
      }
    }
    return null;
  }

  /**
   * Get stored access token.
   */
  static getStoredToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Get access token (instance method).
   */
  getToken(): string | null {
    return AuthService.getStoredToken();
  }
}

export const authService = new AuthService();