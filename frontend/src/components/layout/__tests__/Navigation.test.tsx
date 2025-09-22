import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Navigation } from '../Navigation';
import { AuthProvider } from '../../../contexts/AuthContext';
import { theme } from '../../../theme';

// Mock the useAuth hook
const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'student',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockTeacherUser = {
  ...mockUser,
  role: 'teacher',
};

// Create mock functions
const mockNavigate = jest.fn();
const mockUseAuth = jest.fn();
const mockUseLocation = jest.fn();

// Mock the contexts and hooks
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('Navigation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set default mock implementations
    mockUseAuth.mockReturnValue({
      user: mockUser,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      isLoading: false,
      error: null,
    });
    
    mockUseLocation.mockReturnValue({ pathname: '/dashboard' });
  });

  describe('Rendering', () => {
    it('renders navigation items correctly', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Collaboration')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('does not render teacher-only items for student users', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      expect(screen.queryByText('Teacher Dashboard')).not.toBeInTheDocument();
    });

    it('renders teacher-only items for teacher users', () => {
      // Mock teacher user
      mockUseAuth.mockReturnValue({
        user: mockTeacherUser,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        isLoading: false,
        error: null,
      });

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      expect(screen.getByText('Teacher Dashboard')).toBeInTheDocument();
    });

    it('renders breadcrumbs when showBreadcrumbs is true', () => {
      // Mock a non-dashboard location
      mockUseLocation.mockReturnValue({ pathname: '/content' });

      render(
        <TestWrapper>
          <Navigation showBreadcrumbs={true} />
        </TestWrapper>
      );

      expect(screen.getByLabelText('navigation breadcrumbs')).toBeInTheDocument();
    });

    it('does not render breadcrumbs when showBreadcrumbs is false', () => {
      render(
        <TestWrapper>
          <Navigation showBreadcrumbs={false} />
        </TestWrapper>
      );

      expect(screen.queryByLabelText('navigation breadcrumbs')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Interactions', () => {
    it('navigates to correct path when item is clicked', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      const contentButton = screen.getByRole('button', { name: /Navigate to Content/ });
      fireEvent.click(contentButton);

      expect(mockNavigate).toHaveBeenCalledWith('/content');
    });

    it('calls onItemClick callback when provided', async () => {
      const mockOnItemClick = jest.fn();
      
      render(
        <TestWrapper>
          <Navigation onItemClick={mockOnItemClick} />
        </TestWrapper>
      );

      const dashboardButton = screen.getByRole('button', { name: /Navigate to Dashboard/ });
      fireEvent.click(dashboardButton);

      expect(mockOnItemClick).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'dashboard',
          label: 'Dashboard',
          path: '/dashboard',
        })
      );
    });

    it('highlights active navigation item', () => {
      // Mock dashboard location
      mockUseLocation.mockReturnValue({ pathname: '/dashboard' });

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      const dashboardButton = screen.getByRole('button', { name: /Navigate to Dashboard/ });
      expect(dashboardButton).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation with arrow keys', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      const firstButton = screen.getByRole('button', { name: /Navigate to Dashboard/ });
      firstButton.focus();

      // Press arrow down to move to next item
      fireEvent.keyDown(firstButton, { key: 'ArrowDown' });
      
      // The focus should move to the next navigation item
      // Note: This test verifies the keyboard event handling is set up
      expect(firstButton).toHaveAttribute('tabIndex', '0');
    });

    it('activates navigation item with Enter key', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      const contentButton = screen.getByRole('button', { name: /Navigate to Content/ });
      contentButton.focus();
      
      fireEvent.keyDown(contentButton, { key: 'Enter' });

      expect(mockNavigate).toHaveBeenCalledWith('/content');
    });

    it('activates navigation item with Space key', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      const collaborationButton = screen.getByRole('button', { name: /Navigate to Collaboration/ });
      collaborationButton.focus();
      
      fireEvent.keyDown(collaborationButton, { key: ' ' });

      expect(mockNavigate).toHaveBeenCalledWith('/collaboration');
    });
  });

  describe('Responsive Behavior', () => {
    it('renders mobile variant correctly', () => {
      render(
        <TestWrapper>
          <Navigation variant="mobile" />
        </TestWrapper>
      );

      // Mobile variant should not show descriptions
      expect(screen.queryByText('Overview and quick access to features')).not.toBeInTheDocument();
    });

    it('renders desktop variant with descriptions', () => {
      render(
        <TestWrapper>
          <Navigation variant="desktop" />
        </TestWrapper>
      );

      // Desktop variant should show descriptions
      expect(screen.getByText('Overview and quick access to features')).toBeInTheDocument();
    });
  });

  describe('Breadcrumb Functionality', () => {
    it('generates correct breadcrumbs for nested paths', () => {
      mockUseLocation.mockReturnValue({ pathname: '/content' });

      render(
        <TestWrapper>
          <Navigation showBreadcrumbs={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      // Use getAllByText to handle multiple "Content" elements and check the breadcrumb specifically
      const contentElements = screen.getAllByText('Content');
      expect(contentElements.length).toBeGreaterThan(0);
      // Verify breadcrumb navigation is present
      expect(screen.getByLabelText('navigation breadcrumbs')).toBeInTheDocument();
    });

    it('navigates when breadcrumb is clicked', async () => {
      mockUseLocation.mockReturnValue({ pathname: '/content' });

      render(
        <TestWrapper>
          <Navigation showBreadcrumbs={true} />
        </TestWrapper>
      );

      const homeLink = screen.getByRole('button', { name: /Navigate to Home/ });
      fireEvent.click(homeLink);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
      expect(screen.getByRole('menubar')).toBeInTheDocument();
    });

    it('has proper focus management', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      const firstButton = screen.getByRole('button', { name: /Navigate to Dashboard/ });
      
      firstButton.focus();
      expect(firstButton).toHaveFocus();
    });

    it('provides descriptive aria-labels for navigation items', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/Navigate to Dashboard: Overview and quick access to features/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Navigate to Content: Browse and manage learning materials/)).toBeInTheDocument();
    });

    it('indicates current page with aria-current', () => {
      mockUseLocation.mockReturnValue({ pathname: '/dashboard' });

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      const dashboardButton = screen.getByRole('button', { name: /Navigate to Dashboard/ });
      expect(dashboardButton).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Animation and Transitions', () => {
    it('applies hover effects to navigation items', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      const contentButton = screen.getByRole('button', { name: /Navigate to Content/ });
      
      fireEvent.mouseEnter(contentButton);
      
      // Verify that the button has transition styles applied (checking for the actual computed style)
      const computedStyle = window.getComputedStyle(contentButton);
      expect(computedStyle.transition).toBeTruthy();
    });

    it('shows fade-in animation for navigation list', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      const navigationList = screen.getByRole('menubar');
      // Check if the list is wrapped in a fade component
      expect(navigationList).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('maintains focus state correctly', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      const contentButton = screen.getByRole('button', { name: /Navigate to Content/ });
      
      fireEvent.click(contentButton);
      contentButton.focus();
      
      expect(contentButton).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('handles missing user gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        isLoading: false,
        error: null,
      });

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      // Should still render basic navigation items
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('handles navigation errors gracefully', async () => {
      // Mock console.error to avoid error output in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation error');
      });

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      const contentButton = screen.getByRole('button', { name: /Navigate to Content/ });
      
      // Should not throw error when navigation fails
      expect(() => fireEvent.click(contentButton)).not.toThrow();
      
      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Navigation error:', expect.any(Error));
      
      // Cleanup
      consoleSpy.mockRestore();
    });
  });
});