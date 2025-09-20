/**
 * Collection browser component for viewing and managing collections
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Container,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { contentService, Collection } from '../../services/contentService';

interface CollectionBrowserProps {
  onSelectCollection?: (collection: Collection) => void;
  onCreateCollection?: () => void;
}

export const CollectionBrowser: React.FC<CollectionBrowserProps> = ({
  onSelectCollection,
  onCreateCollection
}) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  useEffect(() => {
    loadCollections();
  }, [searchTerm, gradeFilter, subjectFilter]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (gradeFilter) params.grade_level = gradeFilter;
      if (subjectFilter) params.subject = subjectFilter;
      
      const data = await contentService.getCollections(params);
      setCollections(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this collection?')) {
      return;
    }

    try {
      await contentService.deleteCollection(id);
      setCollections(collections.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete collection');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box display="flex" alignItems="center" gap={2}>
            <HomeIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
            <Typography variant="h4" component="h1" fontWeight="bold">
              Collections
            </Typography>
          </Box>
          {onCreateCollection && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onCreateCollection}
              sx={{ borderRadius: 2 }}
            >
              Create Collection
            </Button>
          )}
        </Box>

        {/* Filters */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search collections..."
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Grade Level</InputLabel>
              <Select
                value={gradeFilter}
                label="Grade Level"
                onChange={(e) => setGradeFilter(e.target.value)}
              >
                <MenuItem value="">All Grades</MenuItem>
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
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={subjectFilter}
                label="Subject"
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                <MenuItem value="">All Subjects</MenuItem>
                <MenuItem value="English">English</MenuItem>
                <MenuItem value="Spanish">Spanish</MenuItem>
                <MenuItem value="French">French</MenuItem>
                <MenuItem value="German">German</MenuItem>
                <MenuItem value="Italian">Italian</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Collections Grid */}
        <Grid container spacing={3}>
          {collections.map((collection) => (
            <Grid item xs={12} sm={6} lg={4} key={collection.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => onSelectCollection?.(collection)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="h3" noWrap sx={{ flexGrow: 1, mr: 1 }}>
                      {collection.name}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCollection(collection.id);
                      }}
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  {collection.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {collection.description}
                    </Typography>
                  )}
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {collection.grade_level && (
                        <Chip
                          label={`Grade ${collection.grade_level}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                      {collection.subject && (
                        <Chip
                          label={collection.subject}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {collection.learning_sets?.length || 0} sets
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Empty State */}
        {collections.length === 0 && !loading && (
          <Box textAlign="center" py={8}>
            <HomeIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="text.primary">
              No collections found
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>
              {searchTerm || gradeFilter || subjectFilter
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by creating your first collection.'}
            </Typography>
            {onCreateCollection && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onCreateCollection}
                size="large"
              >
                Create Collection
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
};