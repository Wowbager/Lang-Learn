/**
 * Unified axios client for all API communication.
 * Provides centralized configuration, authentication, and error handling.
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors and common error patterns
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to auth page
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    
    // Enhanced error handling - extract meaningful error messages
    if (error.response?.data) {
      const errorData = error.response.data as any;
      if (errorData.detail) {
        error.message = errorData.detail;
      } else if (errorData.message) {
        error.message = errorData.message;
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;