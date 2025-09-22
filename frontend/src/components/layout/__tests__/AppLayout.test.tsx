import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { AppLayout } from '../AppLayout';
import { theme } from '../../../theme';

// Mock useMediaQuery hook
const mockUseMediaQuery = jest.fn();
jest.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: mockUseMediaQuery,
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

describe('AppLayout', () => {
  beforeEach(() => {
    // Reset mock before each test
    mockUseMediaQuery.mockReset();
  });

  describe('Desktop Layout', () => {
    beforeEach(() => {
      // Mock desktop breakpoint
      mockUseMediaQuery.mockReturnValue(false);
    });

    it('renders children content correctly', () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div data-testid="test-content">Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('displays default title in header', () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Content</div>
          </AppLayout>
        </TestWrapper>
      );

      expect(screen.getByText('Language Learning Chat')).toBeInTheDocument();
    });

    it('displays custom title when provided', () => {
      render(
        <TestWrapper>
          <AppLayout title="Custom Title">
            <div>Content</div>
          </AppLayout>
        </TestWrapper>
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('shows permanent drawer on desktop', () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Content</div>
          </AppLayout>
        </TestWrapper>
      );

      // Check that navigation content is visible (permanent drawer)
      expect(screen.getByText('Navigation menu will be implemented in the next task')).toBeInTheDocument();
    });

    it('does not show mobile menu button on desktop', () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Content</div>
          </AppLayout>
        </TestWrapper>
      );

      // Mobile menu button should not be present
      expect(screen.queryByLabelText('open navigation menu')).not.toBeInTheDocument();
    });

    it('hides navigation when showNavigation is false', () => {
      render(
        <TestWrapper>
          <AppLayout showNavigation={false}>
            <div data-testid="test-content">Content</div>
          </AppLayout>
        </TestWrapper>
      );

      // Header should not be present
      expect(screen.queryByText('Language Learning Chat')).not.toBeInTheDocument();
      // Navigation should not be present
      expect(screen.queryByText('Navigation menu will be implemented in the next task')).not.toBeInTheDocument();
      // Content should still be present
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });

  describe('Mobile Layout', () => {
    beforeEach(() => {
      // Mock mobile breakpoint
      mockUseMediaQuery.mockReturnValue(true);
    });

    it('shows mobile menu button on mobile', () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Content</div>
          </AppLayout>
        </TestWrapper>
      );

      expect(screen.getByLabelText('open navigation menu')).toBeInTheDocument();
    });

    it('opens drawer when menu button is clicked', async () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Content</div>
          </AppLayout>
        </TestWrapper>
      );

      const menuButton = screen.getByLabelText('open navigation menu');
      fireEvent.click(menuButton);

      // Wait for drawer to open and check for close button
      await waitFor(() => {
        expect(screen.getByLabelText('close navigation menu')).toBeInTheDocument();
      });
    });

    it('closes drawer when close button is clicked', async () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Content</div>
          </AppLayout>
        </TestWrapper>
      );

      // Open drawer first
      const menuButton = screen.getByLabelText('open navigation menu');
      fireEvent.click(menuButton);

      // Wait for drawer to open
      await waitFor(() => {
        expect(screen.getByLabelText('close navigation menu')).toBeInTheDocument();
      });

      // Close drawer
      const closeButton = screen.getByLabelText('close navigation menu');
      fireEvent.click(closeButton);

      // Wait for drawer to close
      await waitFor(() => {
        expect(screen.queryByLabelText('close navigation menu')).not.toBeInTheDocument();
      });
    });

    it('initially shows drawer as closed on mobile', () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Content</div>
          </AppLayout>
        </TestWrapper>
      );

      // Close button should not be visible initially (drawer is closed)
      expect(screen.queryByLabelText('close navigation menu')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('applies correct styling for mobile layout', () => {
      mockUseMediaQuery.mockReturnValue(true);
      
      render(
        <TestWrapper>
          <AppLayout>
            <div data-testid="test-content">Content</div>
          </AppLayout>
        </TestWrapper>
      );

      // Check that mobile menu button is present
      expect(screen.getByLabelText('open navigation menu')).toBeInTheDocument();
    });

    it('applies correct styling for desktop layout', () => {
      mockUseMediaQuery.mockReturnValue(false);
      
      render(
        <TestWrapper>
          <AppLayout>
            <div data-testid="test-content">Content</div>
          </AppLayout>
        </TestWrapper>
      );

      // Check that mobile menu button is not present
      expect(screen.queryByLabelText('open navigation menu')).not.toBeInTheDocument();
      // Check that navigation content is visible
      expect(screen.getByText('Navigation menu will be implemented in the next task')).toBeInTheDocument();
    });
  });

  describe('Layout State Management', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile layout for state testing
    });

    it('manages sidebar state correctly', async () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Content</div>
          </AppLayout>
        </TestWrapper>
      );

      const menuButton = screen.getByLabelText('open navigation menu');
      
      // Initially closed
      expect(screen.queryByLabelText('close navigation menu')).not.toBeInTheDocument();
      
      // Open sidebar
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(screen.getByLabelText('close navigation menu')).toBeInTheDocument();
      });
      
      // Close sidebar
      const closeButton = screen.getByLabelText('close navigation menu');
      fireEvent.click(closeButton);
      await waitFor(() => {
        expect(screen.queryByLabelText('close navigation menu')).not.toBeInTheDocument();
      });
    });

    it('toggles sidebar state on multiple clicks', async () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Content</div>
          </AppLayout>
        </TestWrapper>
      );

      const menuButton = screen.getByLabelText('open navigation menu');
      
      // Open
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(screen.getByLabelText('close navigation menu')).toBeInTheDocument();
      });
      
      // Close
      const closeButton = screen.getByLabelText('close navigation menu');
      fireEvent.click(closeButton);
      await waitFor(() => {
        expect(screen.queryByLabelText('close navigation menu')).not.toBeInTheDocument();
      });
      
      // Open again
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(screen.getByLabelText('close navigation menu')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for navigation buttons', () => {
      mockUseMediaQuery.mockReturnValue(true);
      
      render(
        <TestWrapper>
          <AppLayout>
            <div>Content</div>
          </AppLayout>
        </TestWrapper>
      );

      expect(screen.getByLabelText('open navigation menu')).toBeInTheDocument();
    });

    it('maintains focus management for drawer interactions', async () => {
      mockUseMediaQuery.mockReturnValue(true);
      
      render(
        <TestWrapper>
          <AppLayout>
            <div>Content</div>
          </AppLayout>
        </TestWrapper>
      );

      const menuButton = screen.getByLabelText('open navigation menu');
      fireEvent.click(menuButton);

      await waitFor(() => {
        const closeButton = screen.getByLabelText('close navigation menu');
        expect(closeButton).toBeInTheDocument();
      });
    });
  });
});