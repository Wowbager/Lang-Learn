/**
 * Form component for creating and editing vocabulary items
 */

import React, { useState } from 'react';
import {
  Button,
  TextField,
  CircularProgress,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
  Grid,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { contentService, VocabularyItem, CreateVocabularyData } from '../../services/contentService';

interface VocabularyFormProps {
  vocabulary?: VocabularyItem;
  learningSetId: string;
  onSave: (vocabulary: VocabularyItem) => void;
  onCancel: () => void;
}

export const VocabularyForm: React.FC<VocabularyFormProps> = ({
  vocabulary,
  learningSetId,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateVocabularyData>({
    word: vocabulary?.word || '',
    definition: vocabulary?.definition || '',
    example_sentence: vocabulary?.example_sentence || '',
    part_of_speech: vocabulary?.part_of_speech || '',
    difficulty_level: vocabulary?.difficulty_level || '',
    learning_set_id: learningSetId,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.word.trim()) {
      setError('Word is required');
      return;
    }

    if (!formData.definition.trim()) {
      setError('Definition is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let savedVocabulary: VocabularyItem;
      if (vocabulary) {
        savedVocabulary = await contentService.updateVocabulary(vocabulary.id, formData);
      } else {
        savedVocabulary = await contentService.createVocabulary(formData);
      }

      onSave(savedVocabulary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vocabulary item');
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
    <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" component="h3" sx={{ mb: 3 }}>
        {vocabulary ? 'Edit Vocabulary Item' : 'Add New Vocabulary Item'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Grid container spacing={2}>
            {/* Word */}
            <Grid item xs={12} md={6}>
              <TextField
                id="word"
                name="word"
                label="Word"
                value={formData.word}
                onChange={handleInputChange}
                placeholder="Enter the word"
                fullWidth
                required
                variant="outlined"
              />
            </Grid>

            {/* Part of Speech */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="part_of_speech-label">Part of Speech</InputLabel>
                <Select
                  labelId="part_of_speech-label"
                  id="part_of_speech"
                  name="part_of_speech"
                  value={formData.part_of_speech}
                  onChange={handleSelectChange}
                  label="Part of Speech"
                >
                  <MenuItem value=""><em>Select part of speech</em></MenuItem>
                  <MenuItem value="noun">Noun</MenuItem>
                  <MenuItem value="verb">Verb</MenuItem>
                  <MenuItem value="adjective">Adjective</MenuItem>
                  <MenuItem value="adverb">Adverb</MenuItem>
                  <MenuItem value="pronoun">Pronoun</MenuItem>
                  <MenuItem value="preposition">Preposition</MenuItem>
                  <MenuItem value="conjunction">Conjunction</MenuItem>
                  <MenuItem value="interjection">Interjection</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Definition */}
          <TextField
            id="definition"
            name="definition"
            label="Definition"
            value={formData.definition}
            onChange={handleInputChange}
            placeholder="Enter the definition"
            multiline
            rows={2}
            fullWidth
            required
            variant="outlined"
          />

          {/* Example Sentence */}
          <TextField
            id="example_sentence"
            name="example_sentence"
            label="Example Sentence"
            value={formData.example_sentence}
            onChange={handleInputChange}
            placeholder="Enter an example sentence using this word"
            multiline
            rows={2}
            fullWidth
            variant="outlined"
          />

          {/* Difficulty Level */}
          <FormControl fullWidth variant="outlined">
            <InputLabel id="difficulty_level-label">Difficulty Level</InputLabel>
            <Select
              labelId="difficulty_level-label"
              id="difficulty_level"
              name="difficulty_level"
              value={formData.difficulty_level}
              onChange={handleSelectChange}
              label="Difficulty Level"
            >
              <MenuItem value=""><em>Select difficulty level</em></MenuItem>
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
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
            >
              {loading ? <CircularProgress size={24} /> : (vocabulary ? 'Update' : 'Add')}
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