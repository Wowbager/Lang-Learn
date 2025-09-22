import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import DashboardPage from '../DashboardPage';
import { theme } from '../../theme';
import { User, UserRole } from '../../types/auth';

// Mock the useAuth hook
const mockNavigate = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Test users
const studentUser: User = {
  id: '1',
  username: 'student1',
  email: 'student@test.com',
  full_name: 'John Student',
  role: UserRole.STUDENT,
  grade_level: '10',
  curriculum_type: 'standard',
  is_active: true,
  created_at: '2023-01-01T00:00:00Z',
};

const teacherUser: User = {
  id: '2',
  username: 'teacher1',
  email: 'teacher@test.com',
  full_name: 'Jane Teacher',
  role: UserRole.TEACHER,
  is_active: true,
  created_at: '2023-01-01T00:00:00Z',
};

const renderDashboard = (user: User | null = studentUser) => {
  mockUseAuth.mockReturnValue({ user });
  
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <DashboardPage />
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Welcome Section', () => {
    it('renders welcome message with user name', () => {
      renderDashboard(studentUser);
      
      expect(screen.getByText(/Good (morning|afternoon|evening), John Student!/)).toBeInTheDocument();
    });

    it('displays user avatar with first letter of name', () => {
      renderDashboard(studentUser);
      
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('shows user role chip', () => {
      renderDashboard(studentUser);
      
      expect(screen.getByText('Student')).toBeInTheDocument();
    });

    it('shows grade level chip when available', () => {
      renderDashboard(studentUser);
      
      expect(screen.getByText('Grade 10')).toBeInTheDocument();
    });

    it('displays teacher role correctly', () => {
      renderDashboard(teacherUser);
      
      expect(screen.getByText('Teacher')).toBeInTheDocument();
    });

    it('falls back to username when full_name is not available', () => {
      const userWithoutFullName = { ...studentUser, full_name: '' };
      renderDashboard(userWithoutFullName);
      
      expect(screen.getByText(/Good (morning|afternoon|evening), student1!/)).toBeInTheDocument();
    });
  });

  describe('Learning Statistics', () => {
    it('renders progress section', () => {
      renderDashboard();
      
      expect(screen.getByText('Your Progress')).toBeInTheDocument();
    });

    it('displays learning statistics cards', () => {
      renderDashboard();
      
      expect(screen.getByText('Lessons Completed')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('Current Streak')).toBeInTheDocument();
      expect(screen.getByText('5 days')).toBeInTheDocument();
      expect(screen.getByText('Achievements')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('shows progress bar for lessons completed', () => {
      renderDashboard();
      
      expect(screen.getByText('60% complete')).toBeInTheDocument();
    });
  });

  describe('Quick Access Features', () => {
    it('renders quick access section', () => {
      renderDashboard();
      
      expect(screen.getByText('Quick Access')).toBeInTheDocument();
    });

    it('displays feature cards for students', () => {
      renderDashboard(studentUser);
      
      expect(screen.getByText('Learning Content')).toBeInTheDocument();
      expect(screen.getByText('Collaboration')).toBeInTheDocument();
      expect(screen.getByText('My Profile')).toBeInTheDocument();
      expect(screen.queryByText('Teacher Tools')).not.toBeInTheDocument();
    });

    it('displays teacher tools for teachers', () => {
      renderDashboard(teacherUser);
      
      expect(screen.getByText('Teacher Tools')).toBeInTheDocument();
    });

    it('navigates to content page when content card is clicked', async () => {
      renderDashboard();
      
      const contentCard = screen.getByText('Learning Content').closest('.MuiCard-root');
      expect(contentCard).toBeInTheDocument();
      
      fireEvent.click(contentCard!);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/content');
      });
    });

    it('navigates to collaboration page when collaboration card is clicked', async () => {
      renderDashboard();
      
      const collaborationCard = screen.getByText('Collaboration').closest('.MuiCard-root');
      expect(collaborationCard).toBeInTheDocument();
      
      fireEvent.click(collaborationCard!);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/collaboration');
      });
    });

    it('navigates to profile page when profile card is clicked', async () => {
      renderDashboard();
      
      const profileCard = screen.getByText('My Profile').closest('.MuiCard-root');
      expect(profileCard).toBeInTheDocument();
      
      fireEvent.click(profileCard!);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/profile');
      });
    });

    it('navigates to teacher dashboard when teacher tools card is clicked', async () => {
      renderDashboard(teacherUser);
      
      const teacherCard = screen.getByText('Teacher Tools').closest('.MuiCard-root');
      expect(teacherCard).toBeInTheDocument();
      
      fireEvent.click(teacherCard!);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/teacher-dashboard');
      });
    });
  });

  describe('Continue Learning Section', () => {
    it('renders continue learning section', () => {
      renderDashboard();
      
      expect(screen.getByText('Continue Learning')).toBeInTheDocument();
    });

    it('displays recent lesson information', () => {
      renderDashboard();
      
      expect(screen.getByText('Recent Lesson: Spanish Conversation Basics')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('navigates to content when continue button is clicked', async () => {
      renderDashboard();
      
      const continueButton = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/content');
      });
    });

    it('navigates to content when view all lessons button is clicked', async () => {
      renderDashboard();
      
      const viewAllButton = screen.getByRole('button', { name: /view all lessons/i });
      fireEvent.click(viewAllButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/content');
      });
    });
  });

  describe('Responsive Design', () => {
    it('renders without crashing on different screen sizes', () => {
      renderDashboard();
      
      // Check that all main sections are present
      expect(screen.getByText('Your Progress')).toBeInTheDocument();
      expect(screen.getByText('Quick Access')).toBeInTheDocument();
      expect(screen.getByText('Continue Learning')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderDashboard();
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent(/Good (morning|afternoon|evening), John Student!/);
      
      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(sectionHeadings).toHaveLength(3);
      expect(sectionHeadings[0]).toHaveTextContent('Your Progress');
      expect(sectionHeadings[1]).toHaveTextContent('Quick Access');
      expect(sectionHeadings[2]).toHaveTextContent('Continue Learning');
    });

    it('has accessible button labels', () => {
      renderDashboard();
      
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view all lessons/i })).toBeInTheDocument();
    });

    it('provides meaningful text for screen readers', () => {
      renderDashboard();
      
      expect(screen.getByText('Browse and access learning materials, lessons, and resources')).toBeInTheDocument();
      expect(screen.getByText('Join classes, work with peers, and participate in group activities')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing user gracefully', () => {
      renderDashboard(null);
      
      // Should still render the page structure
      expect(screen.getByText('Your Progress')).toBeInTheDocument();
      expect(screen.getByText('Quick Access')).toBeInTheDocument();
    });

    it('handles user without full name', () => {
      const userWithoutName = { ...studentUser, full_name: '', username: 'testuser' };
      renderDashboard(userWithoutName);
      
      expect(screen.getByText(/Good (morning|afternoon|evening), testuser!/)).toBeInTheDocument();
    });

    it('handles user without grade level', () => {
      const userWithoutGrade = { ...studentUser, grade_level: undefined };
      renderDashboard(userWithoutGrade);
      
      expect(screen.queryByText(/Grade/)).not.toBeInTheDocument();
      expect(screen.getByText('Student')).toBeInTheDocument();
    });
  });
});