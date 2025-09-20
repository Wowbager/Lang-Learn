import { useTheme } from '@mui/material/styles';
import { Theme } from '@mui/material/styles';

// Hook to access custom theme properties
export const useCustomTheme = () => {
  const theme = useTheme();
  return theme.custom;
};

// Utility functions for common theme operations
export const getSpacing = (theme: Theme, factor: number) => theme.spacing(factor);

export const getBreakpoint = (theme: Theme, key: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => 
  theme.breakpoints.values[key];

export const getShadow = (theme: Theme, elevation: number) => 
  theme.shadows[elevation];

// Color utility functions
export const getLearningColor = (theme: Theme) => theme.custom.colors.learning;
export const getSuccessColor = (theme: Theme) => theme.custom.colors.success;
export const getWarningColor = (theme: Theme) => theme.custom.colors.warning;

// Background utility functions
export const getSubtleBackground = (theme: Theme) => theme.custom.colors.background.subtle;
export const getElevatedBackground = (theme: Theme) => theme.custom.colors.background.elevated;

// Spacing utility functions
export const getSectionSpacing = (theme: Theme) => theme.custom.spacing.section;
export const getComponentSpacing = (theme: Theme) => theme.custom.spacing.component;

// Shadow utility functions
export const getCardShadow = (theme: Theme) => theme.custom.shadows.card;
export const getElevatedShadow = (theme: Theme) => theme.custom.shadows.elevated;

// Media query helpers
export const createMediaQuery = (theme: Theme, breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl', direction: 'up' | 'down' = 'up') => 
  theme.breakpoints[direction](breakpoint);

// Common style mixins
export const cardStyles = (theme: Theme) => ({
  borderRadius: 12,
  boxShadow: theme.custom.shadows.card,
  padding: theme.custom.spacing.component,
  backgroundColor: theme.custom.colors.background.elevated,
});

export const sectionStyles = (theme: Theme) => ({
  marginBottom: theme.custom.spacing.section,
});

export const buttonStyles = (theme: Theme) => ({
  borderRadius: 8,
  textTransform: 'none' as const,
  fontWeight: 500,
  padding: theme.spacing(1.25, 2.5),
});