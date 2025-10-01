/**
 * Collection browser component (placeholder)
 */

import React from 'react';
import { Container, Paper, Typography } from '@mui/material';

export const CollectionBrowser: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">Collections</Typography>
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Collections feature coming soon.
        </Typography>
      </Paper>
    </Container>
  );
};
