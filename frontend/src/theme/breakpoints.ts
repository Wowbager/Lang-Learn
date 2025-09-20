import { BreakpointsOptions } from '@mui/material/styles';

// Custom breakpoints optimized for language learning application
// Considers common device sizes and optimal content width for reading
export const breakpoints: BreakpointsOptions = {
  values: {
    xs: 0,     // Mobile phones (portrait)
    sm: 600,   // Mobile phones (landscape) and small tablets
    md: 900,   // Tablets and small laptops
    lg: 1200,  // Desktop and large tablets
    xl: 1536,  // Large desktop screens
  },
};

// Semantic breakpoint helpers for component usage
export const breakpointHelpers = {
  mobile: '(max-width: 599px)',
  tablet: '(min-width: 600px) and (max-width: 899px)',
  desktop: '(min-width: 900px)',
  largeDesktop: '(min-width: 1200px)',
  
  // Content-specific breakpoints
  singleColumn: '(max-width: 899px)', // When to use single column layout
  multiColumn: '(min-width: 900px)',  // When to use multi-column layout
  
  // Navigation breakpoints
  mobileNav: '(max-width: 899px)',    // When to show mobile navigation
  desktopNav: '(min-width: 900px)',   // When to show desktop navigation
  
  // Reading optimization
  optimalReading: '(max-width: 768px)', // Optimal line length for reading
};