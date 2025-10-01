/**
 * TypeScript types for chat functionality.
 */

export enum SenderType {
  USER = "user",
  AI = "ai"
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: SenderType;
  timestamp: string;
  corrections?: GrammarCorrection[] | null;
  vocabulary_used?: VocabularyUsage[] | null;
  isStreaming?: boolean;
}

export interface GrammarCorrection {
  original: string;
  corrected: string;
  explanation: string;
  grammar_rule?: string;
  severity?: 'minor' | 'moderate' | 'major';
  learning_tip?: string;
  gentle_feedback?: string;
}

export interface VocabularyUsage {
  word: string;
  used_correctly: boolean;
  context: string;
  definition_match?: boolean;
  improvement_suggestion?: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  learning_set_id: string;
  start_time: string;
  end_time?: string | null;
  total_messages: number;
  vocabulary_practiced?: Record<string, any> | null;
  grammar_corrections: number;
  created_at: string;
  updated_at?: string;
}

export interface ChatSessionCreate {
  learning_set_id: string;
}

export interface WebSocketMessage {
  type?: 'message' | 'typing_indicator' | 'streaming_response' | 'complete_message' | 'error';
  id?: string;
  content?: string;
  chunk?: string;
  sender?: SenderType | string;
  timestamp?: string;
  corrections?: GrammarCorrection[] | null;
  vocabulary_used?: VocabularyUsage[] | null;
  user_id?: string;
  is_typing?: boolean;
  error?: string;
}

export interface TypingIndicator {
  user_id: string;
  is_typing: boolean;
  timestamp: string;
}

export interface AIAnalysisResult {
  corrections: GrammarCorrection[];
  vocabulary_used: VocabularyUsage[];
  encouragement: string;
  difficulty_assessment?: string;
  learning_progress?: {
    grammar_concepts_demonstrated: string[];
    vocabulary_level: string;
    areas_for_improvement: string[];
  };
  detailed_vocabulary_feedback?: string;
  grammar_pattern_feedback?: string;
}

export interface ChatContextType {
  // Current session
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // AI state
  aiTyping: boolean;
  aiHealthy: boolean;
  
  // Typing indicators
  typingUsers: Set<string>;
  
  // Actions
  startSession: (learningSetId: string) => Promise<void>;
  endSession: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  
  // Session management
  loadSession: (sessionId: string) => Promise<void>;
  loadMessages: (sessionId: string, skip?: number, limit?: number) => Promise<ChatMessage[]>;
  getUserSessions: (skip?: number, limit?: number) => Promise<ChatSession[]>;
  
  // AI features
  getConversationStarter: () => Promise<string>;
  analyzeMessage: (content: string) => Promise<AIAnalysisResult>;
  checkAIHealth: () => Promise<boolean>;
}