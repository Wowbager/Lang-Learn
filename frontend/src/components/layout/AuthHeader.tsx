import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

export const AuthHeader: React.FC = () => {
  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Language Learning Platform
        </Typography>
      </Toolbar>
    </AppBar>
  );
};
