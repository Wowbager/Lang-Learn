/**
 * Form component for creating and editing collections
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { contentService, Collection, CreateCollectionData } from '../../services/contentService';

interface CollectionFormProps {
  collection?: Collection;
  onSave: (collection: Collection) => void;
  onCancel: () => void;
}

export const CollectionForm: React.FC<CollectionFormProps> = ({
  collection,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateCollectionData>({
    name: collection?.name || '',
    description: collection?.description || '',
    grade_level: collection?.grade_level || '',
    subject: collection?.subject || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Collection name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let savedCollection: Collection;
      if (collection) {
        savedCollection = await contentService.updateCollection(collection.id, formData);
      } else {
        savedCollection = await contentService.createCollection(formData);
      }

      onSave(savedCollection);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save collection');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        {collection ? 'Edit Collection' : 'Create New Collection'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Name */}
          <TextField
            id="name"
            name="name"
            label="Collection Name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter collection name"
            fullWidth
            required
            variant="outlined"
          />

          {/* Description */}
          <TextField
            id="description"
            name="description"
            label="Description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe this collection"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
          />

          {/* Grade Level */}
          <FormControl fullWidth variant="outlined">
            <InputLabel id="grade_level-label">Grade Level</InputLabel>
            <Select
              labelId="grade_level-label"
              id="grade_level"
              name="grade_level"
              value={formData.grade_level}
              onChange={handleSelectChange}
              label="Grade Level"
            >
              <MenuItem value="">
                <em>Select grade level</em>
              </MenuItem>
              <MenuItem value="K">Kindergarten</MenuItem>
              <MenuItem value="1">1st Grade</MenuItem>
              <MenuItem value="2">2nd Grade</MenuItem>
              <MenuItem value="3">3rd Grade</MenuItem>
              <MenuItem value="4">4th Grade</MenuItem>
              <MenuItem value="5">5th Grade</MenuItem>
              <MenuItem value="6">6th Grade</MenuItem>
              <MenuItem value="7">7th Grade</MenuItem>
              <MenuItem value="8">8th Grade</MenuItem>
              <MenuItem value="9">9th Grade</MenuItem>
              <MenuItem value="10">10th Grade</MenuItem>
              <MenuItem value="11">11th Grade</MenuItem>
              <MenuItem value="12">12th Grade</MenuItem>
            </Select>
          </FormControl>

          {/* Subject */}
          <FormControl fullWidth variant="outlined">
            <InputLabel id="subject-label">Subject</InputLabel>
            <Select
              labelId="subject-label"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleSelectChange}
              label="Subject"
            >
              <MenuItem value="">
                <em>Select subject</em>
              </MenuItem>
              <MenuItem value="English">English</MenuItem>
              <MenuItem value="Spanish">Spanish</MenuItem>
              <MenuItem value="French">French</MenuItem>
              <MenuItem value="German">German</MenuItem>
              <MenuItem value="Italian">Italian</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>

          {/* Error Message */}
          {error && <Alert severity="error">{error}</Alert>}

          {/* Buttons */}
          <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ flex: 1 }}
            >
              {loading ? <CircularProgress size={24} /> : (collection ? 'Update' : 'Create')}
            </Button>
            <Button
              type="button"
              variant="outlined"
              color="secondary"
              onClick={onCancel}
              disabled={loading}
              sx={{ flex: 1 }}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </form>
    </Paper>
  );
};