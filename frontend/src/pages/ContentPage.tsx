/**
 * Main content management page - Prioritizes Learning Sets with optional Collections
 */

import React, { useState } from 'react';
import {
  Box,
  Breadcrumbs,
  Link,
  Typography,
  Tabs,
  Tab,
  Container,
  Paper,
} from '@mui/material';
import {
  School as SchoolIcon,
  Folder as FolderIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { LearningSetBrowser } from '../components/content/LearningSetBrowser';
import { LearningSetForm } from '../components/content/LearningSetForm';
import { LearningSetDetail } from '../components/content/LearningSetDetail';
import { LearningSet } from '../services/contentService';

type ViewMode = 'learning-sets' | 'learning-set-form' | 'learning-set-detail' | 'collections';

export const ContentPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('learning-sets');
  const [selectedLearningSet, setSelectedLearningSet] = useState<LearningSet | null>(null);
  const [editingLearningSet, setEditingLearningSet] = useState<LearningSet | null>(null);

  const handleSelectLearningSet = (learningSet: LearningSet) => {
    setSelectedLearningSet(learningSet);
    setViewMode('learning-set-detail');
  };

  const handleCreateLearningSet = () => {
    setEditingLearningSet(null);
    setViewMode('learning-set-form');
  };

  const handleEditLearningSet = (learningSet: LearningSet) => {
    setEditingLearningSet(learningSet);
    setViewMode('learning-set-form');
  };

  const handleLearningSetSaved = (learningSet: LearningSet) => {
    setSelectedLearningSet(learningSet);
    setViewMode('learning-set-detail');
  };

  const handleBackToLearningSets = () => {
    setSelectedLearningSet(null);
    setEditingLearningSet(null);
    setViewMode('learning-sets');
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: ViewMode) => {
    setViewMode(newValue);
    setSelectedLearningSet(null);
    setEditingLearningSet(null);
  };

  return (
    <>
      {/* Main Navigation Tabs */}
      {viewMode !== 'learning-set-detail' && viewMode !== 'learning-set-form' && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={viewMode} onChange={handleTabChange}>
            <Tab 
              icon={<SchoolIcon />} 
              iconPosition="start" 
              label="Learning Sets" 
              value="learning-sets" 
            />
            <Tab 
              icon={<FolderIcon />} 
              iconPosition="start" 
              label="Collections" 
              value="collections"
              disabled
            />
          </Tabs>
        </Box>
      )}

      {/* Breadcrumb Navigation for detail/form views */}
      {(viewMode === 'learning-set-detail' || viewMode === 'learning-set-form') && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 4 }}
        >
          <Link
            component="button"
            variant="body2"
            onClick={handleBackToLearningSets}
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'primary.main',
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            <SchoolIcon sx={{ mr: 0.5, fontSize: 16 }} />
            Learning Sets
          </Link>
          
          {selectedLearningSet && (
            <Typography variant="body2" color="text.primary">
              {selectedLearningSet.name}
            </Typography>
          )}

          {viewMode === 'learning-set-form' && !editingLearningSet && (
            <Typography variant="body2" color="text.primary">
              New Learning Set
            </Typography>
          )}

          {editingLearningSet && (
            <Typography variant="body2" color="text.primary">
              Edit {editingLearningSet.name}
            </Typography>
          )}
        </Breadcrumbs>
      )}

      {/* Main Content */}
      {viewMode === 'learning-sets' && (
        <LearningSetBrowser
          onSelectLearningSet={handleSelectLearningSet}
          onCreateLearningSet={handleCreateLearningSet}
          onEditLearningSet={handleEditLearningSet}
        />
      )}

      {viewMode === 'collections' && (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6">Collections</Typography>
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Collections feature coming soon. For now, you can organize your learning sets directly.
            </Typography>
          </Paper>
        </Container>
      )}

      {viewMode === 'learning-set-form' && (
        <LearningSetForm
          learningSet={editingLearningSet || undefined}
          onSave={handleLearningSetSaved}
          onCancel={handleBackToLearningSets}
        />
      )}

      {viewMode === 'learning-set-detail' && selectedLearningSet && (
        <LearningSetDetail
          learningSetId={selectedLearningSet.id}
          onBack={handleBackToLearningSets}
        />
      )}
    </>
  );
};