/**
 * Detailed view of a learning set with vocabulary and grammar items
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Container,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Stack,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { contentService, LearningSet, VocabularyItem, GrammarTopic } from '../../services/contentService';
import { VocabularyForm } from './VocabularyForm';
import { GrammarForm } from './GrammarForm';

interface LearningSetDetailProps {
  learningSetId: string;
  onBack: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const LearningSetDetail: React.FC<LearningSetDetailProps> = ({
  learningSetId,
  onBack,
}) => {
  const [learningSet, setLearningSet] = useState<LearningSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showVocabForm, setShowVocabForm] = useState(false);
  const [showGrammarForm, setShowGrammarForm] = useState(false);
  const [editingVocab, setEditingVocab] = useState<VocabularyItem | null>(null);
  const [editingGrammar, setEditingGrammar] = useState<GrammarTopic | null>(null);

  useEffect(() => {
    loadLearningSet();
  }, [learningSetId]);

  const loadLearningSet = async () => {
    try {
      setLoading(true);
      const data = await contentService.getLearningSet(learningSetId);
      setLearningSet(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load learning set');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVocabulary = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vocabulary item?')) {
      return;
    }

    try {
      await contentService.deleteVocabulary(id);
      if (learningSet) {
        setLearningSet({
          ...learningSet,
          vocabulary_items: learningSet.vocabulary_items?.filter(v => v.id !== id) || [],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vocabulary item');
    }
  };

  const handleDeleteGrammar = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this grammar topic?')) {
      return;
    }

    try {
      await contentService.deleteGrammar(id);
      if (learningSet) {
        setLearningSet({
          ...learningSet,
          grammar_topics: learningSet.grammar_topics?.filter(g => g.id !== id) || [],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete grammar topic');
    }
  };

  const handleVocabularySaved = (vocabulary: VocabularyItem) => {
    if (learningSet) {
      if (editingVocab) {
        setLearningSet({
          ...learningSet,
          vocabulary_items:
            learningSet.vocabulary_items?.map(v => (v.id === vocabulary.id ? vocabulary : v)) || [],
        });
      } else {
        setLearningSet({
          ...learningSet,
          vocabulary_items: [...(learningSet.vocabulary_items || []), vocabulary],
        });
      }
    }
    setShowVocabForm(false);
    setEditingVocab(null);
  };

  const handleGrammarSaved = (grammar: GrammarTopic) => {
    if (learningSet) {
      if (editingGrammar) {
        setLearningSet({
          ...learningSet,
          grammar_topics:
            learningSet.grammar_topics?.map(g => (g.id === grammar.id ? grammar : g)) || [],
        });
      } else {
        setLearningSet({
          ...learningSet,
          grammar_topics: [...(learningSet.grammar_topics || []), grammar],
        });
      }
    }
    setShowGrammarForm(false);
    setEditingGrammar(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!learningSet) {
    return (
      <Container>
        <Typography>Learning set not found.</Typography>
        <Button onClick={onBack}>Go Back</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton onClick={onBack}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h5" component="h1" fontWeight="bold">
                {learningSet.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {learningSet.description}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            {learningSet.grade_level && (
              <Chip label={`Grade ${learningSet.grade_level}`} color="primary" />
            )}
            {learningSet.subject && (
              <Chip label={learningSet.subject} color="secondary" />
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} aria-label="learning set tabs">
          <Tab label={`Vocabulary (${learningSet.vocabulary_items?.length || 0})`} />
          <Tab label={`Grammar (${learningSet.grammar_topics?.length || 0})`} />
        </Tabs>
      </Box>

      {/* Vocabulary Tab */}
      <TabPanel value={activeTab} index={0}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Vocabulary Items</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingVocab(null);
                setShowVocabForm(true);
              }}
            >
              Add Vocabulary
            </Button>
          </Box>

          {showVocabForm && (
            <VocabularyForm
              vocabulary={editingVocab || undefined}
              learningSetId={learningSet.id}
              onSave={handleVocabularySaved}
              onCancel={() => {
                setShowVocabForm(false);
                setEditingVocab(null);
              }}
            />
          )}

          <Grid container spacing={3}>
            {learningSet.vocabulary_items?.map(vocab => (
              <Grid item xs={12} sm={6} md={4} key={vocab.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" component="h4">{vocab.word}</Typography>
                    <Typography color="text.secondary" sx={{ mb: 1 }}>{vocab.part_of_speech}</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>{vocab.definition}</Typography>
                    {vocab.example_sentence && (
                      <Typography variant="body2" fontStyle="italic">"{vocab.example_sentence}"</Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <IconButton size="small" onClick={() => {
                      setEditingVocab(vocab);
                      setShowVocabForm(true);
                    }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteVocabulary(vocab.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {(!learningSet.vocabulary_items || learningSet.vocabulary_items.length === 0) && !showVocabForm && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">No vocabulary items yet.</Typography>
            </Box>
          )}
        </Stack>
      </TabPanel>

      {/* Grammar Tab */}
      <TabPanel value={activeTab} index={1}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Grammar Topics</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingGrammar(null);
                setShowGrammarForm(true);
              }}
            >
              Add Grammar
            </Button>
          </Box>

          {showGrammarForm && (
            <GrammarForm
              grammar={editingGrammar || undefined}
              learningSetId={learningSet.id}
              onSave={handleGrammarSaved}
              onCancel={() => {
                setShowGrammarForm(false);
                setEditingGrammar(null);
              }}
            />
          )}

          <Grid container spacing={3}>
            {learningSet.grammar_topics?.map(grammar => (
              <Grid item xs={12} md={6} key={grammar.id}>
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="h6" component="h4">{grammar.name}</Typography>
                        <Chip label={grammar.difficulty} size="small" />
                      </Box>
                      <CardActions>
                        <IconButton size="small" onClick={() => {
                          setEditingGrammar(grammar);
                          setShowGrammarForm(true);
                        }}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteGrammar(grammar.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </CardActions>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{grammar.description}</Typography>
                    {grammar.rule_explanation && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">Rule:</Typography>
                        <Typography variant="body2">{grammar.rule_explanation}</Typography>
                      </Box>
                    )}
                    {grammar.examples && grammar.examples.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">Examples:</Typography>
                        <Stack component="ul" sx={{ pl: 2, m: 0 }}>
                          {grammar.examples.map((ex, i) => <Typography key={i} variant="body2" component="li">{ex}</Typography>)}
                        </Stack>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {(!learningSet.grammar_topics || learningSet.grammar_topics.length === 0) && !showGrammarForm && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">No grammar topics yet.</Typography>
            </Box>
          )}
        </Stack>
      </TabPanel>
    </Container>
  );
};