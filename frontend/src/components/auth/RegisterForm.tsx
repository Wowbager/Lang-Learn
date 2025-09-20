/**
 * Registration form component for new user signup.
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { UserRegistration, UserRole } from '../../types/auth';

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
  onRegistrationSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onRegistrationSuccess,
}) => {
  const { register, isLoading, error } = useAuth();
  const [formData, setFormData] = useState<UserRegistration>({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: UserRole.STUDENT,
    grade_level: '',
    curriculum_type: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState<Partial<UserRegistration & { confirmPassword: string }>>({});

  const handleInputChange = (field: keyof UserRegistration) => (
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

  const handleRoleChange = (event: any) => {
    setFormData(prev => ({
      ...prev,
      role: event.target.value as UserRole,
    }));
  };

  const handleConfirmPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(event.target.value);
    if (formErrors.confirmPassword) {
      setFormErrors(prev => ({
        ...prev,
        confirmPassword: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<UserRegistration & { confirmPassword: string }> = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      // Remove empty optional fields
      const registrationData = {
        ...formData,
        grade_level: formData.grade_level || undefined,
        curriculum_type: formData.curriculum_type || undefined,
      };
      
      await register(registrationData);
      onRegistrationSuccess?.();
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Sign Up
      </Typography>
      
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Create your Language Learning Chat account
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              value={formData.username}
              onChange={handleInputChange('username')}
              error={!!formErrors.username}
              helperText={formErrors.username}
              disabled={isLoading}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={!!formErrors.email}
              helperText={formErrors.email}
              disabled={isLoading}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="full_name"
              label="Full Name"
              name="full_name"
              autoComplete="name"
              value={formData.full_name}
              onChange={handleInputChange('full_name')}
              error={!!formErrors.full_name}
              helperText={formErrors.full_name}
              disabled={isLoading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleInputChange('password')}
              error={!!formErrors.password}
              helperText={formErrors.password}
              disabled={isLoading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
              disabled={isLoading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                value={formData.role}
                label="Role"
                onChange={handleRoleChange}
                disabled={isLoading}
              >
                <MenuItem value={UserRole.STUDENT}>Student</MenuItem>
                <MenuItem value={UserRole.TEACHER}>Teacher</MenuItem>
                <MenuItem value={UserRole.PARENT}>Parent</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="grade_level"
              label="Grade Level (Optional)"
              name="grade_level"
              value={formData.grade_level}
              onChange={handleInputChange('grade_level')}
              error={!!formErrors.grade_level}
              helperText={formErrors.grade_level}
              disabled={isLoading}
              placeholder="e.g., 5th Grade, High School"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              id="curriculum_type"
              label="Curriculum Type (Optional)"
              name="curriculum_type"
              value={formData.curriculum_type}
              onChange={handleInputChange('curriculum_type')}
              error={!!formErrors.curriculum_type}
              helperText={formErrors.curriculum_type}
              disabled={isLoading}
              placeholder="e.g., Common Core, IB, AP"
            />
          </Grid>
        </Grid>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </Button>

        {onSwitchToLogin && (
          <Box textAlign="center">
            <Typography variant="body2">
              Already have an account?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={(e) => {
                  e.preventDefault();
                  onSwitchToLogin();
                }}
                disabled={isLoading}
              >
                Sign in here
              </Link>
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};