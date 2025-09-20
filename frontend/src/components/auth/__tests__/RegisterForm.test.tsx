/**
 * Tests for RegisterForm component.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../RegisterForm';
import { AuthProvider } from '../../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { UserRole } from '../../../types/auth';

// Mock the auth service
jest.mock('../../../services/authService', () => ({
  AuthService: {
    register: jest.fn(),
    login: jest.fn(),
    isAuthenticated: jest.fn(() => false),
    getStoredUser: jest.fn(() => null),
  },
}));

const MockWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders registration form with all required fields', () => {
    render(
      <MockWrapper>
        <RegisterForm />
      </MockWrapper>
    );

    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <MockWrapper>
        <RegisterForm />
      </MockWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
    });
  });

  it('validates username length', async () => {
    const user = userEvent.setup();
    
    render(
      <MockWrapper>
        <RegisterForm />
      </MockWrapper>
    );

    const usernameField = screen.getByLabelText(/username/i);
    await user.type(usernameField, 'ab'); // Too short

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    
    render(
      <MockWrapper>
        <RegisterForm />
      </MockWrapper>
    );

    const emailField = screen.getByLabelText(/email address/i);
    await user.type(emailField, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    const user = userEvent.setup();
    
    render(
      <MockWrapper>
        <RegisterForm />
      </MockWrapper>
    );

    const passwordField = screen.getByLabelText(/^password$/i);
    await user.type(passwordField, '123'); // Too short

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('validates password confirmation match', async () => {
    const user = userEvent.setup();
    
    render(
      <MockWrapper>
        <RegisterForm />
      </MockWrapper>
    );

    const passwordField = screen.getByLabelText(/^password$/i);
    const confirmPasswordField = screen.getByLabelText(/confirm password/i);
    
    await user.type(passwordField, 'password123');
    await user.type(confirmPasswordField, 'different123');

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('clears validation errors when user starts typing', async () => {
    const user = userEvent.setup();
    
    render(
      <MockWrapper>
        <RegisterForm />
      </MockWrapper>
    );

    // Trigger validation errors
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    });

    // Start typing in username field
    const usernameField = screen.getByLabelText(/username/i);
    await user.type(usernameField, 'test');

    await waitFor(() => {
      expect(screen.queryByText(/username is required/i)).not.toBeInTheDocument();
    });
  });

  it('allows selection of different user roles', async () => {
    const user = userEvent.setup();
    
    render(
      <MockWrapper>
        <RegisterForm />
      </MockWrapper>
    );

    // Open role dropdown
    const roleSelect = screen.getByLabelText(/role/i);
    await user.click(roleSelect);

    // Check that all role options are available
    await waitFor(() => {
      expect(screen.getByText('Student')).toBeInTheDocument();
      expect(screen.getByText('Teacher')).toBeInTheDocument();
      expect(screen.getByText('Parent')).toBeInTheDocument();
    });

    // Select teacher role
    await user.click(screen.getByText('Teacher'));

    // Verify selection
    expect(screen.getByDisplayValue('teacher')).toBeInTheDocument();
  });

  it('handles optional fields correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <MockWrapper>
        <RegisterForm />
      </MockWrapper>
    );

    // Fill in required fields only
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');

    // Optional fields should be empty but form should still be valid
    expect(screen.getByLabelText(/grade level/i)).toHaveValue('');
    expect(screen.getByLabelText(/curriculum type/i)).toHaveValue('');

    // Form should be submittable
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    expect(submitButton).toBeEnabled();
  });

  it('calls onSwitchToLogin when login link is clicked', async () => {
    const user = userEvent.setup();
    const mockSwitchToLogin = jest.fn();
    
    render(
      <MockWrapper>
        <RegisterForm onSwitchToLogin={mockSwitchToLogin} />
      </MockWrapper>
    );

    const loginLink = screen.getByText(/sign in here/i);
    await user.click(loginLink);

    expect(mockSwitchToLogin).toHaveBeenCalledTimes(1);
  });

  it('submits form with correct data structure', async () => {
    const user = userEvent.setup();
    
    render(
      <MockWrapper>
        <RegisterForm />
      </MockWrapper>
    );

    // Fill in all fields
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.type(screen.getByLabelText(/grade level/i), '5th Grade');
    await user.type(screen.getByLabelText(/curriculum type/i), 'Common Core');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    // Verify form data is present
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5th Grade')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Common Core')).toBeInTheDocument();
  });

  it('defaults to student role', () => {
    render(
      <MockWrapper>
        <RegisterForm />
      </MockWrapper>
    );

    // Student should be the default selected role
    expect(screen.getByDisplayValue('student')).toBeInTheDocument();
  });
});