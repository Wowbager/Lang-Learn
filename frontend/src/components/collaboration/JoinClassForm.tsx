import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';

interface JoinClassFormProps {
  onSubmit: (inviteCode: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const JoinClassForm: React.FC<JoinClassFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const validateCode = (code: string) => {
    // Invite codes are 8 characters, alphanumeric
    const codeRegex = /^[A-Z0-9]{8}$/;
    return codeRegex.test(code.toUpperCase());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inviteCode.trim().toUpperCase();
    
    if (!code) {
      setError('Please enter an invite code');
      return;
    }
    
    if (!validateCode(code)) {
      setError('Invite code must be 8 characters (letters and numbers only)');
      return;
    }
    
    setError('');
    onSubmit(code);
  };

  const handleCodeChange = (value: string) => {
    // Convert to uppercase and limit to 8 characters
    const formattedCode = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setInviteCode(formattedCode);
    if (error) {
      setError('');
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Join a Class
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter the invite code provided by your teacher to join their class.
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Invite Code"
          value={inviteCode}
          onChange={(e) => handleCodeChange(e.target.value)}
          error={!!error}
          helperText={error || 'Invite codes are 8 characters long and contain only letters and numbers.'}
          placeholder="ABC12345"
          disabled={isLoading}
          inputProps={{
            maxLength: 8,
            style: {
              fontFamily: 'monospace',
              textAlign: 'center',
              fontSize: '1.2rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            },
          }}
          sx={{ mb: 4 }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !inviteCode.trim()}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Joining...' : 'Join Class'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};