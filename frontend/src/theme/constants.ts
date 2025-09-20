// Theme constants for consistent usage across the application

// Color constants
export const COLORS = {
  PRIMARY: '#0066CC',
  SECONDARY: '#00BCD4',
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#F44336',
  INFO: '#2196F3',
  LEARNING: '#0066CC',
  
  // Background colors
  BACKGROUND_DEFAULT: '#FAFAFA',
  BACKGROUND_PAPER: '#FFFFFF',
  BACKGROUND_SUBTLE: '#F8F9FA',
  BACKGROUND_ELEVATED: '#FFFFFF',
  
  // Text colors
  TEXT_PRIMARY: '#212121',
  TEXT_SECONDARY: '#757575',
  TEXT_DISABLED: '#BDBDBD',
  
  // Border colors
  DIVIDER: '#E0E0E0',
  BORDER_LIGHT: 'rgba(0, 0, 0, 0.05)',
} as const;

// Spacing constants (in pixels)
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
  XXXL: 64,
  
  // Semantic spacing
  COMPONENT: 16,
  SECTION: 48,
  PAGE: 32,
  CARD: 24,
  FORM: 16,
  BUTTON: 8,
} as const;

// Border radius constants
export const BORDER_RADIUS = {
  SM: 4,
  MD: 8,
  LG: 12,
  XL: 16,
  ROUND: '50%',
  
  // Component-specific
  BUTTON: 8,
  CARD: 12,
  DIALOG: 16,
  CHIP: 16,
} as const;

// Shadow constants
export const SHADOWS = {
  NONE: 'none',
  CARD: '0 2px 8px rgba(0, 0, 0, 0.1)',
  BUTTON: '0 2px 6px rgba(0, 0, 0, 0.1)',
  MODAL: '0 6px 16px rgba(0, 0, 0, 0.15)',
  FLOATING: '0 8px 20px rgba(0, 0, 0, 0.15)',
  DROPDOWN: '0 3px 9px rgba(0, 0, 0, 0.12)',
  TOOLTIP: '0 4px 12px rgba(0, 0, 0, 0.15)',
  ELEVATED: '0 4px 16px rgba(0, 0, 0, 0.15)',
} as const;

// Breakpoint constants
export const BREAKPOINTS = {
  XS: 0,
  SM: 600,
  MD: 900,
  LG: 1200,
  XL: 1536,
} as const;

// Z-index constants for layering
export const Z_INDEX = {
  DRAWER: 1200,
  APP_BAR: 1100,
  MODAL: 1300,
  SNACKBAR: 1400,
  TOOLTIP: 1500,
} as const;

// Animation constants
export const ANIMATION = {
  DURATION: {
    SHORT: 200,
    STANDARD: 300,
    LONG: 500,
  },
  EASING: {
    EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
    EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;