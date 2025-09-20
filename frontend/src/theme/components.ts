import { Components } from '@mui/material/styles';

export const components: Components = {
  // Button component overrides
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8, // Consistent border radius
        textTransform: 'none', // Remove uppercase transformation
        fontWeight: 500,
        padding: '10px 20px',
        boxShadow: 'none', // Remove default shadow
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)', // Subtle hover shadow
        },
      },
      contained: {
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        },
      },
      outlined: {
        borderWidth: 2,
        '&:hover': {
          borderWidth: 2,
        },
      },
    },
  },

  // Card component overrides
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12, // Rounded corners for modern look
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', // Subtle shadow
        border: '1px solid rgba(0, 0, 0, 0.05)', // Subtle border
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)', // Enhanced shadow on hover
        },
      },
    },
  },

  // Paper component overrides
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
      elevation1: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    },
  },

  // TextField component overrides
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0066CC', // Learning blue on hover
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
            borderColor: '#0066CC',
          },
        },
        '& .MuiInputLabel-root': {
          '&.Mui-focused': {
            color: '#0066CC',
          },
        },
      },
    },
  },

  // AppBar component overrides
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', // Subtle shadow
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
      },
    },
  },

  // Chip component overrides
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 16, // Rounded chips
        fontWeight: 500,
      },
    },
  },

  // Dialog component overrides
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 16, // Rounded dialog corners
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', // Enhanced shadow for modals
      },
    },
  },

  // Tab component overrides
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none', // Remove uppercase
        fontWeight: 500,
        minHeight: 48, // Consistent height
        '&.Mui-selected': {
          fontWeight: 600,
        },
      },
    },
  },

  // List item overrides for navigation
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        margin: '2px 8px',
        '&:hover': {
          backgroundColor: 'rgba(0, 102, 204, 0.08)', // Learning blue hover
        },
        '&.Mui-selected': {
          backgroundColor: 'rgba(0, 102, 204, 0.12)',
          '&:hover': {
            backgroundColor: 'rgba(0, 102, 204, 0.16)',
          },
        },
      },
    },
  },

  // Typography overrides
  MuiTypography: {
    styleOverrides: {
      h1: {
        fontWeight: 600,
      },
      h2: {
        fontWeight: 600,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
  },


};