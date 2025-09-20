import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClassForm } from '../ClassForm';

describe('ClassForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form correctly', () => {
    render(
      <ClassForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/class name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create class/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('renders edit form correctly with initial data', () => {
    const initialData = {
      name: 'Test Class',
      description: 'Test Description'
    };

    render(
      <ClassForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        initialData={initialData}
      />
    );

    expect(screen.getByDisplayValue('Test Class')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update class/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <ClassForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole('button', { name: /create class/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/class name is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates name length', async () => {
    render(
      <ClassForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText(/class name/i);
    fireEvent.change(nameInput, { target: { value: 'a'.repeat(101) } });

    const submitButton = screen.getByRole('button', { name: /create class/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/class name must be between 1 and 100 characters/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    render(
      <ClassForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText(/class name/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    fireEvent.change(nameInput, { target: { value: 'Test Class' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });

    const submitButton = screen.getByRole('button', { name: /create class/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Class',
        description: 'Test Description'
      });
    });
  });

  it('submits form without description', async () => {
    render(
      <ClassForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText(/class name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Class' } });

    const submitButton = screen.getByRole('button', { name: /create class/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Class',
        description: undefined
      });
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <ClassForm
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
      <ClassForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    );

    expect(screen.getByLabelText(/class name/i)).toBeDisabled();
    expect(screen.getByLabelText(/description/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('clears errors when user starts typing', async () => {
    render(
      <ClassForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Trigger validation error
    const submitButton = screen.getByRole('button', { name: /create class/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/class name is required/i)).toBeInTheDocument();
    });

    // Start typing to clear error
    const nameInput = screen.getByLabelText(/class name/i);
    fireEvent.change(nameInput, { target: { value: 'T' } });

    await waitFor(() => {
      expect(screen.queryByText(/class name is required/i)).not.toBeInTheDocument();
    });
  });

  it('trims whitespace from inputs', async () => {
    render(
      <ClassForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText(/class name/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    fireEvent.change(nameInput, { target: { value: '  Test Class  ' } });
    fireEvent.change(descriptionInput, { target: { value: '  Test Description  ' } });

    const submitButton = screen.getByRole('button', { name: /create class/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Class',
        description: 'Test Description'
      });
    });
  });
});