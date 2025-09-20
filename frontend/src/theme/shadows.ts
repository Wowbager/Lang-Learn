import { Shadows } from '@mui/material/styles';

// Custom shadow system for learning-focused interface
// Subtle shadows that don't distract from content
export const shadows: Shadows = [
  'none',
  '0 1px 3px rgba(0, 0, 0, 0.08)', // Subtle shadow for cards
  '0 2px 6px rgba(0, 0, 0, 0.1)',  // Light elevation
  '0 3px 9px rgba(0, 0, 0, 0.12)', // Medium elevation
  '0 4px 12px rgba(0, 0, 0, 0.15)', // Higher elevation
  '0 6px 16px rgba(0, 0, 0, 0.15)', // Modal/dialog shadow
  '0 8px 20px rgba(0, 0, 0, 0.15)', // Floating elements
  '0 10px 24px rgba(0, 0, 0, 0.15)', // High elevation
  '0 12px 28px rgba(0, 0, 0, 0.15)', // Very high elevation
  '0 14px 32px rgba(0, 0, 0, 0.15)', // Maximum elevation
  '0 16px 36px rgba(0, 0, 0, 0.15)', // Extreme elevation
  '0 18px 40px rgba(0, 0, 0, 0.15)', // Extreme elevation
  '0 20px 44px rgba(0, 0, 0, 0.15)', // Extreme elevation
  '0 22px 48px rgba(0, 0, 0, 0.15)', // Extreme elevation
  '0 24px 52px rgba(0, 0, 0, 0.15)', // Extreme elevation
  '0 26px 56px rgba(0, 0, 0, 0.15)', // Extreme elevation
  '0 28px 60px rgba(0, 0, 0, 0.15)', // Extreme elevation
  '0 30px 64px rgba(0, 0, 0, 0.15)', // Extreme elevation
  '0 32px 68px rgba(0, 0, 0, 0.15)', // Extreme elevation
  '0 34px 72px rgba(0, 0, 0, 0.15)', // Extreme elevation
  '0 36px 76px rgba(0, 0, 0, 0.15)', // Extreme elevation
  '0 38px 80px rgba(0, 0, 0, 0.15)', // Extreme elevation
  '0 40px 84px rgba(0, 0, 0, 0.15)', // Extreme elevation
  '0 42px 88px rgba(0, 0, 0, 0.15)', // Extreme elevation
  '0 44px 92px rgba(0, 0, 0, 0.15)', // Maximum shadow
];

// Semantic shadow names for easier use
export const semanticShadows = {
  none: shadows[0],
  card: shadows[1],
  button: shadows[2],
  modal: shadows[5],
  floating: shadows[6],
  dropdown: shadows[3],
  tooltip: shadows[4],
};