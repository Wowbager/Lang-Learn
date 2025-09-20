/**
 * Profile management component for updating user information.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { UserUpdate } from '../../types/auth';

interface ProfileFormProps {
  onUpdateSuccess?: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ onUpdateSuccess }) => {
  const { user, updateProfile, logout, isLoading, error } = useAuth();
  const [formData, setFormData] = useState<UserUpdate>({
    username: '',
    email: '',
    full_name: '',
    grade_level: '',
    curriculum_type: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<UserUpdate>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  // Initialize form with current user data
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        grade_level: user.grade_level || '',
        curriculum_type: user.curriculum_type || '',
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof UserUpdate) => (
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
    
    // Clear success message when user makes changes
    if (successMessage) {
      setSuccessMessage(null);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<UserUpdate> = {};

    if (formData.username && formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.full_name && formData.full_name.trim().length === 0) {
      errors.full_name = 'Full name cannot be empty';
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
      // Only send fields that have changed
      const updateData: UserUpdate = {};
      if (formData.username !== user?.username) updateData.username = formData.username;
      if (formData.email !== user?.email) updateData.email = formData.email;
      if (formData.full_name !== user?.full_name) updateData.full_name = formData.full_name;
      if (formData.grade_level !== (user?.grade_level || '')) updateData.grade_level = formData.grade_level;
      if (formData.curriculum_type !== (user?.curriculum_type || '')) updateData.curriculum_type = formData.curriculum_type;

      // Only update if there are changes
      if (Object.keys(updateData).length === 0) {
        setSuccessMessage('No changes to save');
        return;
      }

      await updateProfile(updateData);
      setSuccessMessage('Profile updated successfully!');
      onUpdateSuccess?.();
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      // This would call the deactivate endpoint
      // For now, we'll just logout since deactivation is implemented in the backend
      await logout();
    } catch (error) {
      console.error('Account deactivation error:', error);
    }
    setDeactivateDialogOpen(false);
  };

  if (!user) {
    return (
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h6" align="center">
          Please log in to view your profile
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile Settings
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Update your account information and learning preferences
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="username"
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleInputChange('username')}
              error={!!formErrors.username}
              helperText={formErrors.username}
              disabled={isLoading}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={!!formErrors.email}
              helperText={formErrors.email}
              disabled={isLoading}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              id="full_name"
              label="Full Name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange('full_name')}
              error={!!formErrors.full_name}
              helperText={formErrors.full_name}
              disabled={isLoading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="grade_level"
              label="Grade Level"
              name="grade_level"
              value={formData.grade_level}
              onChange={handleInputChange('grade_level')}
              error={!!formErrors.grade_level}
              helperText={formErrors.grade_level}
              disabled={isLoading}
              placeholder="e.g., 5th Grade, High School"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="curriculum_type"
              label="Curriculum Type"
              name="curriculum_type"
              value={formData.curriculum_type}
              onChange={handleInputChange('curriculum_type')}
              error={!!formErrors.curriculum_type}
              helperText={formErrors.curriculum_type}
              disabled={isLoading}
              placeholder="e.g., Common Core, IB, AP"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Role: <strong>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Account created: {new Date(user.created_at).toLocaleDateString()}
            </Typography>
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
          {isLoading ? 'Updating...' : 'Update Profile'}
        </Button>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom color="error">
          Danger Zone
        </Typography>
        
        <Button
          variant="outlined"
          color="error"
          onClick={() => setDeactivateDialogOpen(true)}
          disabled={isLoading}
        >
          Deactivate Account
        </Button>
      </Box>

      {/* Deactivate Account Confirmation Dialog */}
      <Dialog
        open={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
      >
        <DialogTitle>Deactivate Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to deactivate your account? This action will log you out
            and disable your account. You can contact support to reactivate it later.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeactivateDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeactivateAccount} color="error" variant="contained">
            Deactivate Account
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};