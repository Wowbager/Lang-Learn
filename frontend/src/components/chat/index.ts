/**
 * Chat components exports
 */

export { default as ChatInterface } from './ChatInterface';
export { default as ChatMessage } from './ChatMessage';
export { default as MessageList } from './MessageList';
export { default as MessageInput } from './MessageInput';
export { default as TypingIndicator } from './TypingIndicator';

// Re-export types for convenience
export type { ChatContextType } from '../../types/chat';
export { useChat } from '../../contexts/ChatContext';