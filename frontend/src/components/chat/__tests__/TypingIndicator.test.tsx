/**
 * Tests for TypingIndicator component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TypingIndicator from '../TypingIndicator';

describe('TypingIndicator', () => {
  it('does not render when no users are typing', () => {
    const { container } = render(
      <TypingIndicator typingUsers={new Set()} showAITyping={false} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders AI typing indicator', () => {
    render(<TypingIndicator typingUsers={new Set()} showAITyping={true} />);
    
    expect(screen.getByText('AI Tutor is typing...')).toBeInTheDocument();
  });

  it('renders single user typing indicator', () => {
    const typingUsers = new Set(['user1']);
    render(<TypingIndicator typingUsers={typingUsers} showAITyping={false} />);
    
    expect(screen.getByText('Someone is typing...')).toBeInTheDocument();
  });

  it('renders two users typing indicator', () => {
    const typingUsers = new Set(['user1', 'user2']);
    render(<TypingIndicator typingUsers={typingUsers} showAITyping={false} />);
    
    expect(screen.getByText('2 people are typing...')).toBeInTheDocument();
  });

  it('renders multiple users typing indicator', () => {
    const typingUsers = new Set(['user1', 'user2', 'user3']);
    render(<TypingIndicator typingUsers={typingUsers} showAITyping={false} />);
    
    expect(screen.getByText('3 people are typing...')).toBeInTheDocument();
  });

  it('prioritizes AI typing over user typing', () => {
    const typingUsers = new Set(['user1', 'user2']);
    render(<TypingIndicator typingUsers={typingUsers} showAITyping={true} />);
    
    expect(screen.getByText('AI Tutor is typing...')).toBeInTheDocument();
    expect(screen.queryByText('2 people are typing...')).not.toBeInTheDocument();
  });

  it('renders typing dots animation', () => {
    render(<TypingIndicator typingUsers={new Set()} showAITyping={true} />);
    
    const dots = screen.getAllByText('', { selector: '.dot' });
    expect(dots).toHaveLength(3);
  });

  it('applies correct CSS classes', () => {
    const { container } = render(
      <TypingIndicator typingUsers={new Set()} showAITyping={true} />
    );
    
    expect(container.firstChild).toHaveClass('typing-indicator');
    expect(container.querySelector('.typing-indicator-content')).toBeInTheDocument();
    expect(container.querySelector('.typing-dots')).toBeInTheDocument();
    expect(container.querySelector('.typing-text')).toBeInTheDocument();
  });

  it('handles empty set correctly', () => {
    const { container } = render(
      <TypingIndicator typingUsers={new Set()} showAITyping={false} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('updates when typing users change', () => {
    const { rerender } = render(
      <TypingIndicator typingUsers={new Set(['user1'])} showAITyping={false} />
    );
    
    expect(screen.getByText('Someone is typing...')).toBeInTheDocument();
    
    rerender(
      <TypingIndicator typingUsers={new Set(['user1', 'user2'])} showAITyping={false} />
    );
    
    expect(screen.getByText('2 people are typing...')).toBeInTheDocument();
  });

  it('updates when AI typing state changes', () => {
    const { rerender } = render(
      <TypingIndicator typingUsers={new Set()} showAITyping={false} />
    );
    
    expect(screen.queryByText('AI Tutor is typing...')).not.toBeInTheDocument();
    
    rerender(
      <TypingIndicator typingUsers={new Set()} showAITyping={true} />
    );
    
    expect(screen.getByText('AI Tutor is typing...')).toBeInTheDocument();
  });
});