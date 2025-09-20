/**
 * Authentication context for managing user state across the application.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserLogin, UserRegistration, UserUpdate, AuthContextType } from '../types/auth';
import { AuthService } from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (AuthService.isAuthenticated()) {
          const storedUser = AuthService.getStoredUser();
          if (storedUser) {
            // Verify token is still valid by fetching current user
            try {
              const currentUser = await AuthService.getCurrentUser();
              setUser(currentUser);
            } catch (error) {
              // Token is invalid, clear storage
              await AuthService.logout();
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError('Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: UserLogin): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await AuthService.login(credentials);
      setUser(response.user);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: UserRegistration): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newUser = await AuthService.register(userData);
      
      // Auto-login after registration
      await login({
        username: userData.username,
        password: userData.password,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData: UserUpdate): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedUser = await AuthService.updateProfile(userData);
      setUser(updatedUser);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Profile update failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    updateProfile,
    isLoading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};