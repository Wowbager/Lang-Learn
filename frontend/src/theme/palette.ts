import { PaletteOptions } from '@mui/material/styles';

export const palette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: '#0066CC', // Learning-focused blue for trust and focus
    light: '#3385D6',
    dark: '#004499',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#00BCD4', // Teal accent for engagement and progress
    light: '#33C9DC',
    dark: '#0097A7',
    contrastText: '#FFFFFF',
  },
  success: {
    main: '#4CAF50', // Green for positive feedback and achievements
    light: '#6FBF73',
    dark: '#357A38',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#FF9800', // Orange for attention and warnings
    light: '#FFB74D',
    dark: '#F57C00',
    contrastText: '#000000',
  },
  error: {
    main: '#F44336', // Red for errors and critical feedback
    light: '#E57373',
    dark: '#D32F2F',
    contrastText: '#FFFFFF',
  },
  info: {
    main: '#2196F3', // Blue for informational content
    light: '#64B5F6',
    dark: '#1976D2',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#FAFAFA', // Soft background for reduced eye strain
    paper: '#FFFFFF',
  },
  text: {
    primary: '#212121', // High contrast for readability
    secondary: '#757575', // Medium contrast for secondary text
    disabled: '#BDBDBD',
  },
  divider: '#E0E0E0',
  grey: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
};