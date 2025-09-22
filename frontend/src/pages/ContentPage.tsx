/**
 * Main content management page
 */

import React, { useState } from 'react';
import {
  Box,
  Breadcrumbs,
  Link,
  Typography,
} from '@mui/material';
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { CollectionBrowser } from '../components/content/CollectionBrowser';
import { CollectionForm } from '../components/content/CollectionForm';
import { LearningSetBrowser } from '../components/content/LearningSetBrowser';
import { LearningSetForm } from '../components/content/LearningSetForm';
import { LearningSetDetail } from '../components/content/LearningSetDetail';
import { Collection, LearningSet } from '../services/contentService';

type ViewMode = 'collections' | 'collection-form' | 'learning-sets' | 'learning-set-form' | 'learning-set-detail';

export const ContentPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('collections');
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedLearningSet, setSelectedLearningSet] = useState<LearningSet | null>(null);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [editingLearningSet, setEditingLearningSet] = useState<LearningSet | null>(null);

  const handleSelectCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    setViewMode('learning-sets');
  };

  const handleCreateCollection = () => {
    setEditingCollection(null);
    setViewMode('collection-form');
  };

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection);
    setViewMode('collection-form');
  };

  const handleCollectionSaved = (collection: Collection) => {
    setSelectedCollection(collection);
    setViewMode('learning-sets');
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

  const handleSelectLearningSet = (learningSet: LearningSet) => {
    setSelectedLearningSet(learningSet);
    setViewMode('learning-set-detail');
  };

  const handleBackToCollections = () => {
    setSelectedCollection(null);
    setSelectedLearningSet(null);
    setViewMode('collections');
  };

  const handleBackToLearningSets = () => {
    setSelectedLearningSet(null);
    setViewMode('learning-sets');
  };

  return (
    <>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 4 }}
      >
          <Link
            component="button"
            variant="body2"
            onClick={handleBackToCollections}
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: viewMode === 'collections' ? 'text.disabled' : 'primary.main',
              cursor: viewMode === 'collections' ? 'default' : 'pointer',
              '&:hover': {
                textDecoration: viewMode === 'collections' ? 'none' : 'underline',
              },
            }}
            disabled={viewMode === 'collections'}
          >
            <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />
            Collections
          </Link>
          
          {selectedCollection && (
            <Link
              component="button"
              variant="body2"
              onClick={handleBackToLearningSets}
              sx={{
                textDecoration: 'none',
                color: viewMode === 'learning-sets' ? 'text.disabled' : 'primary.main',
                cursor: viewMode === 'learning-sets' ? 'default' : 'pointer',
                '&:hover': {
                  textDecoration: viewMode === 'learning-sets' ? 'none' : 'underline',
                },
              }}
              disabled={viewMode === 'learning-sets'}
            >
              {selectedCollection.name}
            </Link>
          )}
          
          {selectedLearningSet && (
            <Typography variant="body2" color="text.primary">
              {selectedLearningSet.name}
            </Typography>
          )}
        </Breadcrumbs>

        {/* Main Content */}
        {viewMode === 'collections' && (
          <CollectionBrowser
            onSelectCollection={handleSelectCollection}
            onCreateCollection={handleCreateCollection}
          />
        )}

        {viewMode === 'collection-form' && (
          <CollectionForm
            collection={editingCollection || undefined}
            onSave={handleCollectionSaved}
            onCancel={handleBackToCollections}
          />
        )}

        {viewMode === 'learning-sets' && selectedCollection && (
          <LearningSetBrowser
            collection={selectedCollection}
            onSelectLearningSet={handleSelectLearningSet}
            onCreateLearningSet={handleCreateLearningSet}
            onEditLearningSet={handleEditLearningSet}
          />
        )}

        {viewMode === 'learning-set-form' && (
          <LearningSetForm
            learningSet={editingLearningSet || undefined}
            defaultCollectionId={selectedCollection?.id}
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