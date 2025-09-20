import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JoinClassForm } from '../JoinClassForm';

describe('JoinClassForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form correctly', () => {
    render(
      <JoinClassForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/join a class/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/invite code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join class/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByText(/invite codes are 8 characters long/i)).toBeInTheDocument();
  });

  it('formats invite code input correctly', () => {
    render(
      <JoinClassForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByLabelText(/invite code/i);
    
    // Test lowercase conversion to uppercase
    fireEvent.change(input, { target: { value: 'abc123' } });
    expect(input).toHaveValue('ABC123');

    // Test special character removal
    fireEvent.change(input, { target: { value: 'ABC-123!' } });
    expect(input).toHaveValue('ABC123');

    // Test length limit
    fireEvent.change(input, { target: { value: 'ABCDEFGHIJK' } });
    expect(input).toHaveValue('ABCDEFGH');
  });

  it('validates empty invite code', async () => {
    render(
      <JoinClassForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const form = document.querySelector('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/please enter an invite code/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates invite code format', async () => {
    render(
      <JoinClassForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByLabelText(/invite code/i);
    
    // Test short code
    fireEvent.change(input, { target: { value: 'ABC123' } });
    
    const submitButton = screen.getByRole('button', { name: /join class/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invite code must be 8 characters/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits valid invite code', async () => {
    render(
      <JoinClassForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByLabelText(/invite code/i);
    fireEvent.change(input, { target: { value: 'ABC12345' } });

    const submitButton = screen.getByRole('button', { name: /join class/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('ABC12345');
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <JoinClassForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables form when loading', () => {
    render(
      <JoinClassForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    );

    expect(screen.getByLabelText(/invite code/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /joining/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('disables submit button when invite code is empty', () => {
    render(
      <JoinClassForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole('button', { name: /join class/i });
    expect(submitButton).toBeDisabled();

    const input = screen.getByLabelText(/invite code/i);
    fireEvent.change(input, { target: { value: 'ABC12345' } });
    
    expect(submitButton).not.toBeDisabled();
  });

  it('clears error when user starts typing', async () => {
    render(
      <JoinClassForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Trigger validation error
    const form = document.querySelector('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/please enter an invite code/i)).toBeInTheDocument();
    });

    // Start typing to clear error
    const input = screen.getByLabelText(/invite code/i);
    fireEvent.change(input, { target: { value: 'A' } });

    await waitFor(() => {
      expect(screen.queryByText(/please enter an invite code/i)).not.toBeInTheDocument();
    });
  });

  it('handles mixed case input correctly', async () => {
    render(
      <JoinClassForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByLabelText(/invite code/i);
    fireEvent.change(input, { target: { value: 'aBc12DeF' } });

    const submitButton = screen.getByRole('button', { name: /join class/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('ABC12DEF');
    });
  });

  it('trims whitespace from input', async () => {
    render(
      <JoinClassForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByLabelText(/invite code/i);
    fireEvent.change(input, { target: { value: '  ABC12345  ' } });

    const submitButton = screen.getByRole('button', { name: /join class/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('ABC12345');
    });
  });
});