/**
 * Detailed view of a learning set with inline vocabulary editing
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
  Stack,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { contentService, LearningSet, VocabularyItem, GrammarTopic } from '../../services/contentService';
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

interface VocabEditState {
  [key: string]: VocabularyItem;
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
  const navigate = useNavigate();
  const [learningSet, setLearningSet] = useState<LearningSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Vocabulary editing state
  const [editingVocab, setEditingVocab] = useState<VocabEditState>({});
  const [newVocab, setNewVocab] = useState<Partial<VocabularyItem> | null>(null);
  const [savingVocab, setSavingVocab] = useState<string | null>(null);
  
  // Grammar editing state
  const [showGrammarForm, setShowGrammarForm] = useState(false);
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

  // Vocabulary handlers
  const handleStartEditVocab = (vocab: VocabularyItem) => {
    setEditingVocab(prev => ({ ...prev, [vocab.id]: { ...vocab } }));
  };

  const handleCancelEditVocab = (id: string) => {
    const { [id]: removed, ...rest } = editingVocab;
    setEditingVocab(rest);
  };

  const handleVocabFieldChange = (id: string, field: keyof VocabularyItem, value: string) => {
    setEditingVocab(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSaveVocab = async (id: string) => {
    const vocabToSave = editingVocab[id];
    if (!vocabToSave) return;

    try {
      setSavingVocab(id);
      const updated = await contentService.updateVocabulary(id, {
        word: vocabToSave.word,
        definition: vocabToSave.definition,
        example_sentence: vocabToSave.example_sentence,
        part_of_speech: vocabToSave.part_of_speech,
        difficulty_level: vocabToSave.difficulty_level,
        learning_set_id: learningSetId,
      });
      
      if (learningSet) {
        setLearningSet({
          ...learningSet,
          vocabulary_items: learningSet.vocabulary_items?.map(v => v.id === id ? updated : v) || [],
        });
      }
      
      handleCancelEditVocab(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vocabulary');
    } finally {
      setSavingVocab(null);
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

  const handleAddNewVocab = () => {
    setNewVocab({
      word: '',
      definition: '',
      example_sentence: '',
      part_of_speech: '',
      difficulty_level: '',
    });
  };

  const handleNewVocabFieldChange = (field: string, value: string) => {
    setNewVocab(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSaveNewVocab = async () => {
    if (!newVocab || !newVocab.word || !newVocab.definition) {
      setError('Word and definition are required');
      return;
    }

    try {
      setSavingVocab('new');
      const created = await contentService.createVocabulary({
        word: newVocab.word,
        definition: newVocab.definition,
        example_sentence: newVocab.example_sentence || '',
        part_of_speech: newVocab.part_of_speech || '',
        difficulty_level: newVocab.difficulty_level || '',
        learning_set_id: learningSetId,
      });
      
      if (learningSet) {
        setLearningSet({
          ...learningSet,
          vocabulary_items: [...(learningSet.vocabulary_items || []), created],
        });
      }
      
      setNewVocab(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add vocabulary');
    } finally {
      setSavingVocab(null);
    }
  };

  const handleCancelNewVocab = () => {
    setNewVocab(null);
  };

  // Grammar handlers
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

  const handleStartChat = () => {
    navigate(`/chat?learning_set_id=${learningSetId}`);
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
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              startIcon={<ChatIcon />}
              onClick={handleStartChat}
              size="large"
            >
              Start Chat
            </Button>
            <Stack direction="row" spacing={1}>
              {learningSet.grade_level && (
                <Chip label={`Grade ${learningSet.grade_level}`} color="primary" />
              )}
              {learningSet.subject && (
                <Chip label={learningSet.subject} color="secondary" />
              )}
            </Stack>
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
              onClick={handleAddNewVocab}
              disabled={newVocab !== null}
            >
              Add Vocabulary
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="15%"><strong>Word</strong></TableCell>
                  <TableCell width="25%"><strong>Definition</strong></TableCell>
                  <TableCell width="25%"><strong>Example</strong></TableCell>
                  <TableCell width="12%"><strong>Part of Speech</strong></TableCell>
                  <TableCell width="10%"><strong>Difficulty</strong></TableCell>
                  <TableCell width="13%"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* New Vocabulary Row */}
                {newVocab && (
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={newVocab.word || ''}
                        onChange={(e) => handleNewVocabFieldChange('word', e.target.value)}
                        placeholder="Word"
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        value={newVocab.definition || ''}
                        onChange={(e) => handleNewVocabFieldChange('definition', e.target.value)}
                        placeholder="Definition"
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        value={newVocab.example_sentence || ''}
                        onChange={(e) => handleNewVocabFieldChange('example_sentence', e.target.value)}
                        placeholder="Example sentence"
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={newVocab.part_of_speech || ''}
                          onChange={(e) => handleNewVocabFieldChange('part_of_speech', e.target.value)}
                        >
                          <MenuItem value="">-</MenuItem>
                          <MenuItem value="noun">Noun</MenuItem>
                          <MenuItem value="verb">Verb</MenuItem>
                          <MenuItem value="adjective">Adjective</MenuItem>
                          <MenuItem value="adverb">Adverb</MenuItem>
                          <MenuItem value="pronoun">Pronoun</MenuItem>
                          <MenuItem value="preposition">Preposition</MenuItem>
                          <MenuItem value="conjunction">Conjunction</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={newVocab.difficulty_level || ''}
                          onChange={(e) => handleNewVocabFieldChange('difficulty_level', e.target.value)}
                        >
                          <MenuItem value="">-</MenuItem>
                          <MenuItem value="easy">Easy</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="hard">Hard</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={handleSaveNewVocab}
                          disabled={savingVocab === 'new'}
                        >
                          <SaveIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={handleCancelNewVocab}
                          disabled={savingVocab === 'new'}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}

                {/* Existing Vocabulary Items */}
                {learningSet.vocabulary_items?.map(vocab => {
                  const isEditing = editingVocab[vocab.id] !== undefined;
                  const editData = editingVocab[vocab.id] || vocab;

                  return (
                    <TableRow key={vocab.id}>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            fullWidth
                            value={editData.word}
                            onChange={(e) => handleVocabFieldChange(vocab.id, 'word', e.target.value)}
                          />
                        ) : (
                          <Typography>{vocab.word}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            fullWidth
                            multiline
                            value={editData.definition}
                            onChange={(e) => handleVocabFieldChange(vocab.id, 'definition', e.target.value)}
                          />
                        ) : (
                          <Typography>{vocab.definition}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            fullWidth
                            multiline
                            value={editData.example_sentence || ''}
                            onChange={(e) => handleVocabFieldChange(vocab.id, 'example_sentence', e.target.value)}
                          />
                        ) : (
                          <Typography fontStyle={vocab.example_sentence ? 'normal' : 'italic'} color={vocab.example_sentence ? 'textPrimary' : 'text.secondary'}>
                            {vocab.example_sentence || '-'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <FormControl size="small" fullWidth>
                            <Select
                              value={editData.part_of_speech || ''}
                              onChange={(e) => handleVocabFieldChange(vocab.id, 'part_of_speech', e.target.value)}
                            >
                              <MenuItem value="">-</MenuItem>
                              <MenuItem value="noun">Noun</MenuItem>
                              <MenuItem value="verb">Verb</MenuItem>
                              <MenuItem value="adjective">Adjective</MenuItem>
                              <MenuItem value="adverb">Adverb</MenuItem>
                              <MenuItem value="pronoun">Pronoun</MenuItem>
                              <MenuItem value="preposition">Preposition</MenuItem>
                              <MenuItem value="conjunction">Conjunction</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Typography>{vocab.part_of_speech || '-'}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <FormControl size="small" fullWidth>
                            <Select
                              value={editData.difficulty_level || ''}
                              onChange={(e) => handleVocabFieldChange(vocab.id, 'difficulty_level', e.target.value)}
                            >
                              <MenuItem value="">-</MenuItem>
                              <MenuItem value="easy">Easy</MenuItem>
                              <MenuItem value="medium">Medium</MenuItem>
                              <MenuItem value="hard">Hard</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Typography>{vocab.difficulty_level || '-'}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleSaveVocab(vocab.id)}
                              disabled={savingVocab === vocab.id}
                            >
                              <SaveIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleCancelEditVocab(vocab.id)}
                              disabled={savingVocab === vocab.id}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Stack>
                        ) : (
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              onClick={() => handleStartEditVocab(vocab)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteVocabulary(vocab.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Stack>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {(!learningSet.vocabulary_items || learningSet.vocabulary_items.length === 0) && !newVocab && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">No vocabulary items yet. Click "Add Vocabulary" to get started.</Typography>
            </Box>
          )}
        </Stack>
      </TabPanel>

      {/* Grammar Tab - Keep existing card-based layout */}
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

          {learningSet.grammar_topics?.map(grammar => (
            <Paper key={grammar.id} sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="h6" component="h4">{grammar.name}</Typography>
                    <Chip label={grammar.difficulty} size="small" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{grammar.description}</Typography>
                  {grammar.rule_explanation && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">Rule:</Typography>
                      <Typography variant="body2">{grammar.rule_explanation}</Typography>
                    </Box>
                  )}
                  {grammar.examples && grammar.examples.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2">Examples:</Typography>
                      <Stack component="ul" sx={{ pl: 2, m: 0 }}>
                        {grammar.examples.map((ex, i) => <Typography key={i} variant="body2" component="li">{ex}</Typography>)}
                      </Stack>
                    </Box>
                  )}
                </Box>
                <Stack direction="row" spacing={1}>
                  <IconButton size="small" onClick={() => {
                    setEditingGrammar(grammar);
                    setShowGrammarForm(true);
                  }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteGrammar(grammar.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          ))}

          {(!learningSet.grammar_topics || learningSet.grammar_topics.length === 0) && !showGrammarForm && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">No grammar topics yet. Click "Add Grammar" to get started.</Typography>
            </Box>
          )}
        </Stack>
      </TabPanel>
    </Container>
  );
};
