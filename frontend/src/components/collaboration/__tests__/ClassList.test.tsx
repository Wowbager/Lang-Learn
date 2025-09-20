import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClassList } from '../ClassList';
import { ClassData } from '../../../types/collaboration';

describe('ClassList', () => {
  const mockOnClassSelect = jest.fn();
  const mockOnEditClass = jest.fn();
  const mockOnDeleteClass = jest.fn();

  const mockClasses: ClassData[] = [
    {
      id: '1',
      name: 'Math Class',
      description: 'Advanced Mathematics',
      teacher_id: 'teacher1',
      invite_code: 'MATH1234',
      is_active: true,
      students: [
        { id: 'student1', username: 'john', full_name: 'John Doe', email: 'john@example.com', role: 'student' },
        { id: 'student2', username: 'jane', full_name: 'Jane Smith', email: 'jane@example.com', role: 'student' }
      ],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z'
    },
    {
      id: '2',
      name: 'Science Class',
      description: 'Basic Science',
      teacher_id: 'teacher2',
      invite_code: 'SCI5678',
      is_active: false,
      students: [],
      created_at: '2023-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    render(
      <ClassList
        classes={[]}
        currentUserId="user1"
        onClassSelect={mockOnClassSelect}
        isLoading={true}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders empty state when no classes', () => {
    render(
      <ClassList
        classes={[]}
        currentUserId="user1"
        onClassSelect={mockOnClassSelect}
        isLoading={false}
      />
    );

    expect(screen.getByText(/no classes/i)).toBeInTheDocument();
    expect(screen.getByText(/get started by creating a new class/i)).toBeInTheDocument();
  });

  it('renders class list correctly', () => {
    render(
      <ClassList
        classes={mockClasses}
        currentUserId="teacher1"
        onClassSelect={mockOnClassSelect}
        onEditClass={mockOnEditClass}
        onDeleteClass={mockOnDeleteClass}
      />
    );

    expect(screen.getByText('Math Class')).toBeInTheDocument();
    expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Science Class')).toBeInTheDocument();
    expect(screen.getByText('Basic Science')).toBeInTheDocument();
  });

  it('shows teacher badge for classes taught by current user', () => {
    render(
      <ClassList
        classes={mockClasses}
        currentUserId="teacher1"
        onClassSelect={mockOnClassSelect}
      />
    );

    const teacherBadges = screen.getAllByText('Teacher');
    expect(teacherBadges).toHaveLength(1);
    
    const studentBadges = screen.getAllByText('Student');
    expect(studentBadges).toHaveLength(1);
  });

  it('shows student count correctly', () => {
    render(
      <ClassList
        classes={mockClasses}
        currentUserId="teacher1"
        onClassSelect={mockOnClassSelect}
      />
    );

    expect(screen.getByText('2 students')).toBeInTheDocument();
    expect(screen.getByText('0 students')).toBeInTheDocument();
  });

  it('shows invite code for teacher classes', () => {
    render(
      <ClassList
        classes={mockClasses}
        currentUserId="teacher1"
        onClassSelect={mockOnClassSelect}
      />
    );

    expect(screen.getByText('Code: MATH1234')).toBeInTheDocument();
    expect(screen.queryByText('Code: SCI5678')).not.toBeInTheDocument();
  });

  it('shows inactive badge for inactive classes', () => {
    render(
      <ClassList
        classes={mockClasses}
        currentUserId="teacher1"
        onClassSelect={mockOnClassSelect}
      />
    );

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('calls onClassSelect when class is clicked', () => {
    render(
      <ClassList
        classes={mockClasses}
        currentUserId="teacher1"
        onClassSelect={mockOnClassSelect}
      />
    );

    fireEvent.click(screen.getByText('Math Class'));
    expect(mockOnClassSelect).toHaveBeenCalledWith(mockClasses[0]);
  });

  it('shows edit and delete buttons for teacher classes', () => {
    render(
      <ClassList
        classes={mockClasses}
        currentUserId="teacher1"
        onClassSelect={mockOnClassSelect}
        onEditClass={mockOnEditClass}
        onDeleteClass={mockOnDeleteClass}
      />
    );

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('does not show edit and delete buttons for student classes', () => {
    render(
      <ClassList
        classes={mockClasses}
        currentUserId="student1"
        onClassSelect={mockOnClassSelect}
        onEditClass={mockOnEditClass}
        onDeleteClass={mockOnDeleteClass}
      />
    );

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('calls onEditClass when edit button is clicked', () => {
    render(
      <ClassList
        classes={mockClasses}
        currentUserId="teacher1"
        onClassSelect={mockOnClassSelect}
        onEditClass={mockOnEditClass}
        onDeleteClass={mockOnDeleteClass}
      />
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEditClass).toHaveBeenCalledWith(mockClasses[0]);
    expect(mockOnClassSelect).not.toHaveBeenCalled();
  });

  it('shows confirmation dialog and calls onDeleteClass when delete button is clicked', () => {
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    render(
      <ClassList
        classes={mockClasses}
        currentUserId="teacher1"
        onClassSelect={mockOnClassSelect}
        onEditClass={mockOnEditClass}
        onDeleteClass={mockOnDeleteClass}
      />
    );

    fireEvent.click(screen.getByText('Delete'));
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete "Math Class"?');
    expect(mockOnDeleteClass).toHaveBeenCalledWith('1');
    expect(mockOnClassSelect).not.toHaveBeenCalled();

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('does not call onDeleteClass when confirmation is cancelled', () => {
    // Mock window.confirm to return false
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => false);

    render(
      <ClassList
        classes={mockClasses}
        currentUserId="teacher1"
        onClassSelect={mockOnClassSelect}
        onEditClass={mockOnEditClass}
        onDeleteClass={mockOnDeleteClass}
      />
    );

    fireEvent.click(screen.getByText('Delete'));
    
    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnDeleteClass).not.toHaveBeenCalled();

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('handles singular student count correctly', () => {
    const singleStudentClass: ClassData[] = [
      {
        ...mockClasses[0],
        students: [{ id: 'student1', username: 'john', full_name: 'John Doe', email: 'john@example.com', role: 'student' }]
      }
    ];

    render(
      <ClassList
        classes={singleStudentClass}
        currentUserId="teacher1"
        onClassSelect={mockOnClassSelect}
      />
    );

    expect(screen.getByText('1 student')).toBeInTheDocument();
  });
});