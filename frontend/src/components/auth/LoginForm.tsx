/**
 * Login form component for user authentication.
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { UserLogin } from '../../types/auth';

interface LoginFormProps {
  onSwitchToRegister?: () => void;
  onLoginSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onLoginSuccess,
}) => {
  const { login, isLoading, error } = useAuth();
  const [formData, setFormData] = useState<UserLogin>({
    username: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<UserLogin>>({});

  const handleInputChange = (field: keyof UserLogin) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<UserLogin> = {};

    if (!formData.username.trim()) {
      errors.username = 'Username or email is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await login(formData);
      onLoginSuccess?.();
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Sign In
      </Typography>
      
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Welcome back to Language Learning Chat App! Please sign in to continue.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="username"
          label="Username or Email"
          name="username"
          autoComplete="username"
          autoFocus
          value={formData.username}
          onChange={handleInputChange('username')}
          error={!!formErrors.username}
          helperText={formErrors.username}
          disabled={isLoading}
        />
        
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          value={formData.password}
          onChange={handleInputChange('password')}
          error={!!formErrors.password}
          helperText={formErrors.password}
          disabled={isLoading}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>

        {onSwitchToRegister && (
          <Box textAlign="center">
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={(e) => {
                  e.preventDefault();
                  onSwitchToRegister();
                }}
                disabled={isLoading}
              >
                Sign up here
              </Link>
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};