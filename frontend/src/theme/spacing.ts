// Custom spacing function that provides consistent spacing values
// Based on 8px grid system for optimal visual rhythm
export const spacing = (factor: number) => `${8 * factor}px`;

// Export spacing values for direct use
export const spacingValues = {
  xs: 4,    // 4px - minimal spacing
  sm: 8,    // 8px - small spacing
  md: 16,   // 16px - medium spacing (base unit)
  lg: 24,   // 24px - large spacing
  xl: 32,   // 32px - extra large spacing
  xxl: 48,  // 48px - section spacing
  xxxl: 64, // 64px - major section spacing
};

// Semantic spacing for specific use cases
export const semanticSpacing = {
  component: spacingValues.md,     // 16px - standard component spacing
  section: spacingValues.xxl,      // 48px - between major sections
  page: spacingValues.xl,          // 32px - page margins
  card: spacingValues.lg,          // 24px - card internal spacing
  form: spacingValues.md,          // 16px - form field spacing
  button: spacingValues.sm,        // 8px - button internal spacing
};