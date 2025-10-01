/**
 * TypeScript types for content management (collections, learning sets, etc.)
 */

export interface Collection {
  id: string;
  name: string;
  description?: string;
  grade_level?: string;
  subject?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  learning_sets?: LearningSet[];
}

export interface LearningSet {
  id: string;
  name: string;
  description?: string;
  collection_ids?: string[];
  created_by: string;
  grade_level?: string;
  subject?: string;
  created_at: string;
  updated_at?: string;
  vocabulary_items?: VocabularyItem[];
  grammar_topics?: GrammarTopic[];
}

export interface VocabularyItem {
  id: string;
  word: string;
  definition: string;
  example_sentence?: string;
  part_of_speech?: string;
  difficulty_level?: string;
  learning_set_id: string;
  created_at: string;
}

export interface GrammarTopic {
  id: string;
  name: string;
  description: string;
  rule_explanation?: string;
  examples?: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  learning_set_id: string;
  created_at: string;
}

export interface Permission {
  id: string;
  user_id: string;
  learning_set_id: string;
  role: 'VIEWER' | 'EDITOR' | 'OWNER';
  granted_by: string;
  granted_at: string;
}

export interface CreateCollectionData {
  name: string;
  description?: string;
  grade_level?: string;
  subject?: string;
}

export interface CreateLearningSetData {
  name: string;
  description?: string;
  collection_ids?: string[];
  grade_level?: string;
  subject?: string;
}

export interface CreateVocabularyData {
  word: string;
  definition: string;
  example_sentence?: string;
  part_of_speech?: string;
  difficulty_level?: string;
  learning_set_id: string;
}

export interface CreateGrammarData {
  name: string;
  description: string;
  rule_explanation?: string;
  examples?: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  learning_set_id: string;
}