import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';

interface ClassFormProps {
  onSubmit: (classData: { name: string; description?: string }) => void;
  onCancel: () => void;
  initialData?: { name: string; description?: string };
  isLoading?: boolean;
}

export const ClassForm: React.FC<ClassFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Class name is required';
    } else if (formData.name.length < 1 || formData.name.length > 100) {
      newErrors.name = 'Class name must be between 1 and 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" component="h2" gutterBottom>
        {initialData ? 'Edit Class' : 'Create New Class'}
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <TextField
          fullWidth
          label="Class Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          placeholder="Enter class name"
          disabled={isLoading}
          required
          sx={{ mb: 3 }}
        />

        <TextField
          fullWidth
          label="Description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          multiline
          rows={3}
          placeholder="Enter class description (optional)"
          disabled={isLoading}
          sx={{ mb: 4 }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Saving...' : initialData ? 'Update Class' : 'Create Class'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};