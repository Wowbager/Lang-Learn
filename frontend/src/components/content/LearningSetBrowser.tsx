/**
 * Learning set browser component for viewing and managing learning sets
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Container,
  Paper,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Book as BookIcon,
  Search as SearchIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { contentService, LearningSet, Collection } from '../../services/contentService';

interface LearningSetBrowserProps {
  collection?: Collection;
  onSelectLearningSet?: (learningSet: LearningSet) => void;
  onCreateLearningSet?: () => void;
  onEditLearningSet?: (learningSet: LearningSet) => void;
}

export const LearningSetBrowser: React.FC<LearningSetBrowserProps> = ({
  collection,
  onSelectLearningSet,
  onCreateLearningSet,
  onEditLearningSet,
}) => {
  const navigate = useNavigate();
  const [learningSets, setLearningSets] = useState<LearningSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLearningSets();
  }, [collection, searchTerm]);

  const loadLearningSets = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (collection) params.collection_id = collection.id;
      if (searchTerm) params.search = searchTerm;

      const data = await contentService.getLearningSets(params);
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setLearningSets(data);
        setError(null);
      } else {
        console.error('Expected array but received:', data);
        setLearningSets([]);
        setError('Received invalid data format from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load learning sets');
      setLearningSets([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLearningSet = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this learning set?')) {
      return;
    }

    try {
      await contentService.deleteLearningSet(id);
      setLearningSets(learningSets.filter(ls => ls.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete learning set');
    }
  };

  const handleStartChat = (learningSet: LearningSet) => {
    navigate(`/chat?learning_set_id=${learningSet.id}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" component="h2" fontWeight="bold">
              {collection ? `${collection.name} - Learning Sets` : 'All Learning Sets'}
            </Typography>
            {collection?.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {collection.description}
              </Typography>
            )}
          </Box>
          {onCreateLearningSet && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onCreateLearningSet}
            >
              Create Learning Set
            </Button>
          )}
        </Box>
      </Paper>

      {/* Search */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          id="search"
          label="Search Learning Sets"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or description..."
          variant="outlined"
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
          }}
        />
      </Box>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Learning Sets Grid */}
      <Grid container spacing={3}>
        {Array.isArray(learningSets) && learningSets.map((learningSet) => (
          <Grid item xs={12} sm={6} md={4} key={learningSet.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h3" gutterBottom>
                  {learningSet.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  {learningSet.description}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  {learningSet.grade_level && (
                    <Chip label={`Grade ${learningSet.grade_level}`} size="small" color="primary" />
                  )}
                  {learningSet.subject && (
                    <Chip label={learningSet.subject} size="small" color="secondary" />
                  )}
                </Stack>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    Vocabulary: {learningSet.vocabulary_items?.length || 0} words
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Grammar: {learningSet.grammar_topics?.length || 0} topics
                  </Typography>
                </Stack>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => onSelectLearningSet?.(learningSet)}
                >
                  View Details
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<ChatIcon />}
                  onClick={() => handleStartChat(learningSet)}
                  sx={{ ml: 1 }}
                >
                  Start Chat
                </Button>
                {onEditLearningSet && (
                  <IconButton
                    size="small"
                    onClick={() => onEditLearningSet(learningSet)}
                    title="Edit learning set"
                  >
                    <EditIcon />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  onClick={() => handleDeleteLearningSet(learningSet.id)}
                  title="Delete learning set"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {learningSets.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <BookIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No learning sets found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {searchTerm
              ? 'Try adjusting your search to see more results.'
              : collection
              ? "This collection doesn't have any learning sets yet."
              : 'Get started by creating your first learning set.'}
          </Typography>
          {onCreateLearningSet && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onCreateLearningSet}
              size="large"
            >
              Create Learning Set
            </Button>
          )}
        </Box>
      )}
    </Container>
  );
};