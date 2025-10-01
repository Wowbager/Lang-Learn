/**
 * Tests for ChatMessage component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatMessage from '../ChatMessage';
import { ChatMessage as ChatMessageType, SenderType } from '../../../types/chat';

describe('ChatMessage', () => {
  const mockUserMessage: ChatMessageType = {
    id: 'msg-1',
    content: 'Hello, how are you?',
    sender: SenderType.USER,
    timestamp: '2023-12-01T10:00:00Z',
    corrections: null,
    vocabulary_used: null
  };

  const mockAIMessage: ChatMessageType = {
    id: 'msg-2',
    content: 'I am doing well, thank you for asking!',
    sender: SenderType.AI,
    timestamp: '2023-12-01T10:01:00Z',
    corrections: null,
    vocabulary_used: null
  };

  const mockMessageWithCorrections: ChatMessageType = {
    id: 'msg-3',
    content: 'I goed to the store yesterday.',
    sender: SenderType.USER,
    timestamp: '2023-12-01T10:02:00Z',
    corrections: [
      {
        original: 'goed',
        corrected: 'went',
        explanation: 'The past tense of "go" is "went", not "goed".',
        grammar_rule: 'Irregular verbs'
      }
    ],
    vocabulary_used: null
  };

  const mockMessageWithVocabulary: ChatMessageType = {
    id: 'msg-4',
    content: 'The weather is beautiful today.',
    sender: SenderType.USER,
    timestamp: '2023-12-01T10:03:00Z',
    corrections: null,
    vocabulary_used: [
      {
        word: 'weather',
        used_correctly: true,
        context: 'Used correctly to describe atmospheric conditions'
      },
      {
        word: 'beautiful',
        used_correctly: true,
        context: 'Used correctly as an adjective'
      }
    ]
  };

  it('renders user message correctly', () => {
    render(<ChatMessage message={mockUserMessage} />);
    
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
  });

  it('renders AI message correctly', () => {
    render(<ChatMessage message={mockAIMessage} />);
    
    expect(screen.getByText('AI Tutor')).toBeInTheDocument();
    expect(screen.getByText('I am doing well, thank you for asking!')).toBeInTheDocument();
  });

  it('applies correct CSS classes for user message', () => {
    const { container } = render(<ChatMessage message={mockUserMessage} />);
    
    expect(container.firstChild).toHaveClass('chat-message', 'user-message');
  });

  it('applies correct CSS classes for AI message', () => {
    const { container } = render(<ChatMessage message={mockAIMessage} />);
    
    expect(container.firstChild).toHaveClass('chat-message', 'ai-message');
  });

  it('displays grammar corrections when present', () => {
    render(<ChatMessage message={mockMessageWithCorrections} />);
    
    expect(screen.getByText('Grammar Corrections:')).toBeInTheDocument();
    expect(screen.getByText('"goed"')).toBeInTheDocument();
    expect(screen.getByText('"went"')).toBeInTheDocument();
    expect(screen.getByText('The past tense of "go" is "went", not "goed".')).toBeInTheDocument();
  });

  it('displays vocabulary usage when present', () => {
    render(<ChatMessage message={mockMessageWithVocabulary} />);
    
    expect(screen.getByText('Vocabulary Practice:')).toBeInTheDocument();
    // Use getAllByText since vocabulary words appear both inline and in the panel
    expect(screen.getAllByText('weather').length).toBeGreaterThan(0);
    expect(screen.getAllByText('beautiful').length).toBeGreaterThan(0);
    expect(screen.getByText('Used correctly to describe atmospheric conditions')).toBeInTheDocument();
    expect(screen.getByText('Used correctly as an adjective')).toBeInTheDocument();
  });

  it('hides timestamp when showTimestamp is false', () => {
    render(<ChatMessage message={mockUserMessage} showTimestamp={false} />);
    
    expect(screen.queryByText('10:00 AM')).not.toBeInTheDocument();
  });

  it('formats timestamp correctly', () => {
    const messageWithSpecificTime: ChatMessageType = {
      ...mockUserMessage,
      timestamp: '2023-12-01T14:30:00Z'
    };
    
    render(<ChatMessage message={messageWithSpecificTime} />);
    
    expect(screen.getByText('2:30 PM')).toBeInTheDocument();
  });

  it('handles message with both corrections and vocabulary', () => {
    const complexMessage: ChatMessageType = {
      id: 'msg-5',
      content: 'I goed to the beautiful store.',
      sender: SenderType.USER,
      timestamp: '2023-12-01T10:04:00Z',
      corrections: [
        {
          original: 'goed',
          corrected: 'went',
          explanation: 'The past tense of "go" is "went".',
          grammar_rule: 'Irregular verbs'
        }
      ],
      vocabulary_used: [
        {
          word: 'beautiful',
          used_correctly: true,
          context: 'Used correctly as an adjective'
        },
        {
          word: 'store',
          used_correctly: true,
          context: 'Used correctly to describe a place of business'
        }
      ]
    };

    render(<ChatMessage message={complexMessage} />);
    
    expect(screen.getByText('Grammar Corrections:')).toBeInTheDocument();
    expect(screen.getByText('Vocabulary Practice:')).toBeInTheDocument();
    // Use getAllByText since vocabulary words appear both inline and in the panel
    expect(screen.getAllByText('beautiful').length).toBeGreaterThan(0);
    expect(screen.getAllByText('store').length).toBeGreaterThan(0);
  });

  it('handles empty corrections and vocabulary arrays', () => {
    const messageWithEmptyArrays: ChatMessageType = {
      ...mockUserMessage,
      corrections: [],
      vocabulary_used: []
    };

    render(<ChatMessage message={messageWithEmptyArrays} />);
    
    expect(screen.queryByText('Grammar Corrections:')).not.toBeInTheDocument();
    expect(screen.queryByText('Vocabulary Practice:')).not.toBeInTheDocument();
  });

  it('displays streaming indicator for streaming messages', () => {
    const streamingMessage: ChatMessageType = {
      id: 'msg-6',
      content: 'This is a streaming response...',
      sender: SenderType.AI,
      timestamp: '2023-12-01T10:05:00Z',
      corrections: null,
      vocabulary_used: null,
      isStreaming: true
    };

    render(<ChatMessage message={streamingMessage} />);
    
    expect(screen.getByText('This is a streaming response...')).toBeInTheDocument();
    
    // Check for streaming indicator
    const streamingIndicator = document.querySelector('.streaming-indicator');
    expect(streamingIndicator).toBeInTheDocument();
  });

  it('shows grammar rule when provided', () => {
    const messageWithRule: ChatMessageType = {
      ...mockMessageWithCorrections,
      corrections: [
        {
          original: 'goed',
          corrected: 'went',
          explanation: 'The past tense of "go" is "went".',
          grammar_rule: 'Irregular verbs'
        }
      ]
    };

    render(<ChatMessage message={messageWithRule} />);
    
    expect(screen.getByText('Rule: Irregular verbs')).toBeInTheDocument();
  });

  it('shows correct and incorrect vocabulary usage indicators', () => {
    const messageWithMixedVocab: ChatMessageType = {
      id: 'msg-7',
      content: 'I am doing good at English.',
      sender: SenderType.USER,
      timestamp: '2023-12-01T10:06:00Z',
      corrections: null,
      vocabulary_used: [
        {
          word: 'English',
          used_correctly: true,
          context: 'Used correctly to refer to the language'
        },
        {
          word: 'good',
          used_correctly: false,
          context: 'Should use "well" instead of "good" here'
        }
      ]
    };

    render(<ChatMessage message={messageWithMixedVocab} />);
    
    expect(screen.getByText('✓')).toBeInTheDocument(); // Correct usage
    expect(screen.getByText('✗')).toBeInTheDocument(); // Incorrect usage
    expect(screen.getByText('Should use "well" instead of "good" here')).toBeInTheDocument();
  });

  it('displays enhanced grammar corrections with severity and tips', () => {
    const messageWithEnhancedCorrections: ChatMessageType = {
      id: 'msg-8',
      content: 'I goed to the store yesterday.',
      sender: SenderType.USER,
      timestamp: '2023-12-01T10:07:00Z',
      corrections: [
        {
          original: 'goed',
          corrected: 'went',
          explanation: 'The past tense of "go" is "went".',
          grammar_rule: 'Irregular verbs',
          severity: 'moderate',
          learning_tip: 'Remember that "go" becomes "went" in past tense',
          gentle_feedback: 'I can see you\'re talking about the past! When we say we went somewhere, we use "went" instead of "goed".'
        }
      ],
      vocabulary_used: null
    };

    render(<ChatMessage message={messageWithEnhancedCorrections} />);
    
    expect(screen.getByText('moderate')).toBeInTheDocument();
    expect(screen.getByText(/Remember that "go" becomes "went" in past tense/)).toBeInTheDocument();
    expect(screen.getByText(/I can see you're talking about the past/)).toBeInTheDocument();
  });

  it('displays enhanced vocabulary usage with definition matching and suggestions', () => {
    const messageWithEnhancedVocab: ChatMessageType = {
      id: 'msg-9',
      content: 'I want to adventure the forest.',
      sender: SenderType.USER,
      timestamp: '2023-12-01T10:08:00Z',
      corrections: null,
      vocabulary_used: [
        {
          word: 'adventure',
          used_correctly: false,
          context: 'Used as a verb instead of a noun',
          definition_match: false,
          improvement_suggestion: 'Try using "explore" as a verb, or use "adventure" as a noun like "go on an adventure"'
        }
      ]
    };

    render(<ChatMessage message={messageWithEnhancedVocab} />);
    
    expect(screen.getByText('Try using "explore" as a verb, or use "adventure" as a noun like "go on an adventure"')).toBeInTheDocument();
    // Check for definition indicator
    const definitionIndicator = document.querySelector('.definition-indicator.no-match');
    expect(definitionIndicator).toBeInTheDocument();
  });

  it('displays detailed feedback sections', () => {
    const messageWithDetailedFeedback = {
      ...mockUserMessage,
      detailed_vocabulary_feedback: 'Great use of vocabulary words! You showed good understanding of their meanings.',
      grammar_pattern_feedback: 'You\'re practicing past tense verbs well. Keep working on irregular verbs.'
    } as any;

    render(<ChatMessage message={messageWithDetailedFeedback} />);
    
    expect(screen.getByText('Vocabulary Insights:')).toBeInTheDocument();
    expect(screen.getByText('Great use of vocabulary words! You showed good understanding of their meanings.')).toBeInTheDocument();
    expect(screen.getByText('Grammar Patterns:')).toBeInTheDocument();
    expect(screen.getByText('You\'re practicing past tense verbs well. Keep working on irregular verbs.')).toBeInTheDocument();
  });

  it('applies correct CSS classes for severity badges', () => {
    const messageWithSeverities: ChatMessageType = {
      id: 'msg-10',
      content: 'I have some errors.',
      sender: SenderType.USER,
      timestamp: '2023-12-01T10:09:00Z',
      corrections: [
        {
          original: 'minor error',
          corrected: 'corrected',
          explanation: 'explanation',
          severity: 'minor'
        },
        {
          original: 'major error',
          corrected: 'corrected',
          explanation: 'explanation',
          severity: 'major'
        }
      ],
      vocabulary_used: null
    };

    render(<ChatMessage message={messageWithSeverities} />);
    
    const minorBadge = screen.getByText('minor');
    const majorBadge = screen.getByText('major');
    
    expect(minorBadge).toHaveClass('severity-badge', 'minor');
    expect(majorBadge).toHaveClass('severity-badge', 'major');
  });

  it('handles messages without enhanced features gracefully', () => {
    render(<ChatMessage message={mockUserMessage} />);
    
    expect(screen.queryByText('Grammar Corrections:')).not.toBeInTheDocument();
    expect(screen.queryByText('Vocabulary Practice:')).not.toBeInTheDocument();
    expect(screen.queryByText('Vocabulary Insights:')).not.toBeInTheDocument();
    expect(screen.queryByText('Grammar Patterns:')).not.toBeInTheDocument();
  });
});