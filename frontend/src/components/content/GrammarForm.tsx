/**
 * Form component for creating and editing grammar topics
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
  IconButton,
  Chip,
  Grid,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';
import { contentService, GrammarTopic, CreateGrammarData } from '../../services/contentService';

interface GrammarFormProps {
  grammar?: GrammarTopic;
  learningSetId: string;
  onSave: (grammar: GrammarTopic) => void;
  onCancel: () => void;
}

export const GrammarForm: React.FC<GrammarFormProps> = ({
  grammar,
  learningSetId,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateGrammarData>({
    name: grammar?.name || '',
    description: grammar?.description || '',
    rule_explanation: grammar?.rule_explanation || '',
    examples: grammar?.examples || [],
    difficulty: grammar?.difficulty || 'BEGINNER',
    learning_set_id: learningSetId,
  });
  const [newExample, setNewExample] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Grammar topic name is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let savedGrammar: GrammarTopic;
      if (grammar) {
        savedGrammar = await contentService.updateGrammar(grammar.id, formData);
      } else {
        savedGrammar = await contentService.createGrammar(formData);
      }

      onSave(savedGrammar);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save grammar topic');
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

  const addExample = () => {
    if (newExample.trim()) {
      setFormData(prev => ({
        ...prev,
        examples: [...(prev.examples || []), newExample.trim()],
      }));
      setNewExample('');
    }
  };

  const removeExample = (index: number) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addExample();
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" component="h3" sx={{ mb: 3 }}>
        {grammar ? 'Edit Grammar Topic' : 'Add New Grammar Topic'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Grid container spacing={2}>
            {/* Name */}
            <Grid item xs={12} md={6}>
              <TextField
                id="name"
                name="name"
                label="Topic Name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Present Perfect Tense"
                fullWidth
                required
                variant="outlined"
              />
            </Grid>

            {/* Difficulty */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" required>
                <InputLabel id="difficulty-label">Difficulty Level</InputLabel>
                <Select
                  labelId="difficulty-label"
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleSelectChange}
                  label="Difficulty Level"
                >
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Description */}
          <TextField
            id="description"
            name="description"
            label="Description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe this grammar topic"
            multiline
            rows={2}
            fullWidth
            required
            variant="outlined"
          />

          {/* Rule Explanation */}
          <TextField
            id="rule_explanation"
            name="rule_explanation"
            label="Rule Explanation"
            value={formData.rule_explanation}
            onChange={handleInputChange}
            placeholder="Explain the grammar rule in detail"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
          />

          {/* Examples */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Examples
            </Typography>
            
            {/* Add new example */}
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <TextField
                value={newExample}
                onChange={(e) => setNewExample(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter an example sentence"
                fullWidth
                variant="outlined"
                size="small"
              />
              <Button
                variant="contained"
                color="success"
                onClick={addExample}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
            </Stack>

            {/* Existing examples */}
            <Stack spacing={1}>
              {formData.examples?.map((example, index) => (
                <Chip
                  key={index}
                  label={example}
                  onDelete={() => removeExample(index)}
                  deleteIcon={<DeleteIcon />}
                  variant="outlined"
                />
              ))}
            </Stack>
          </Box>

          {/* Error Message */}
          {error && <Alert severity="error">{error}</Alert>}

          {/* Buttons */}
          <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : (grammar ? 'Update' : 'Add')}
            </Button>
            <Button
              type="button"
              variant="outlined"
              color="secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </form>
    </Paper>
  );
};