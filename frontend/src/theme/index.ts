import { createTheme, Theme } from '@mui/material/styles';
import { palette } from './palette';
import { typography } from './typography';
import { shadows } from './shadows';
import { breakpoints } from './breakpoints';
import { components } from './components';

// Extend the Theme interface to include custom properties
declare module '@mui/material/styles' {
  interface Theme {
    custom: {
      colors: {
        learning: string;
        success: string;
        warning: string;
        background: {
          subtle: string;
          elevated: string;
        };
      };
      spacing: {
        section: number;
        component: number;
      };
      shadows: {
        card: string;
        elevated: string;
      };
    };
  }

  interface ThemeOptions {
    custom?: {
      colors?: {
        learning?: string;
        success?: string;
        warning?: string;
        background?: {
          subtle?: string;
          elevated?: string;
        };
      };
      spacing?: {
        section?: number;
        component?: number;
      };
      shadows?: {
        card?: string;
        elevated?: string;
      };
    };
  }
}

// Create the enhanced theme
export const theme = createTheme({
  palette,
  typography,
  spacing: 8, // Use the standard 8px spacing unit
  shadows,
  breakpoints,
  components,
  custom: {
    colors: {
      learning: '#0066CC',
      success: '#4CAF50',
      warning: '#FF9800',
      background: {
        subtle: '#F8F9FA',
        elevated: '#FFFFFF',
      },
    },
    spacing: {
      section: 32,
      component: 16,
    },
    shadows: {
      card: '0 2px 8px rgba(0, 0, 0, 0.1)',
      elevated: '0 4px 16px rgba(0, 0, 0, 0.15)',
    },
  },
});

export default theme;