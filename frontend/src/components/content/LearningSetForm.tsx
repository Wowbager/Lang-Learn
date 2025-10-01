/**
 * Form component for creating and editing learning sets
 */

import React, { useState, useEffect } from 'react';
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
  Chip,
  OutlinedInput,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { contentService, LearningSet, Collection, CreateLearningSetData } from '../../services/contentService';

interface LearningSetFormProps {
  learningSet?: LearningSet;
  onSave: (learningSet: LearningSet) => void;
  onCancel: () => void;
}

export const LearningSetForm: React.FC<LearningSetFormProps> = ({
  learningSet,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateLearningSetData>({
    name: learningSet?.name || '',
    description: learningSet?.description || '',
    collection_ids: learningSet?.collection_ids || [],
    grade_level: learningSet?.grade_level || '',
    subject: learningSet?.subject || '',
  });
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoadingCollections(true);
      const data = await contentService.getCollections();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setCollections(data);
      } else {
        console.error('Expected array but received:', data);
        setCollections([]);
        setError('Failed to load collections: invalid data format');
      }
    } catch (err) {
      setError('Failed to load collections');
      setCollections([]); // Reset to empty array on error
    } finally {
      setLoadingCollections(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Learning set name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let savedLearningSet: LearningSet;
      if (learningSet) {
        savedLearningSet = await contentService.updateLearningSet(learningSet.id, formData);
      } else {
        savedLearningSet = await contentService.createLearningSet(formData);
      }

      onSave(savedLearningSet);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save learning set');
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

  const handleCollectionsChange = (e: SelectChangeEvent<string[]>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      collection_ids: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  if (loadingCollections) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        {learningSet ? 'Edit Learning Set' : 'Create New Learning Set'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Name */}
          <TextField
            id="name"
            name="name"
            label="Learning Set Name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter learning set name"
            fullWidth
            required
            variant="outlined"
          />

          {/* Collections (Optional Multi-Select) */}
          <FormControl fullWidth variant="outlined">
            <InputLabel id="collections-label">Collections (Optional)</InputLabel>
            <Select
              labelId="collections-label"
              id="collection_ids"
              multiple
              value={formData.collection_ids || []}
              onChange={handleCollectionsChange}
              input={<OutlinedInput label="Collections (Optional)" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const collection = collections.find(c => c.id === value);
                    return <Chip key={value} label={collection?.name || value} size="small" />;
                  })}
                </Box>
              )}
            >
              {collections.length === 0 ? (
                <MenuItem disabled>
                  <em>No collections available</em>
                </MenuItem>
              ) : (
                collections.map((collection) => (
                  <MenuItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {/* Description */}
          <TextField
            id="description"
            name="description"
            label="Description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe this learning set"
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
              {loading ? <CircularProgress size={24} /> : (learningSet ? 'Update' : 'Create')}
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