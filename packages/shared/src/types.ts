// User types
export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  language: 'en' | 'ru';
  theme: 'dark' | 'light';
  createdAt: Date;
  updatedAt: Date;
}

// Project types
export interface Project {
  id: string;
  userId: string;
  name: string;
  data: ProjectData;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectData {
  contextBlocks: ContextBlock[];
  promptBlocks: PromptBlock[];
}

export interface ContextBlock {
  id: number;
  title: string;
  items: ContextItem[];
}

export interface ContextItem {
  id: number;
  title: string;
  content: string;
  chars: number;
  subItems: ContextSubItem[];
}

export interface ContextSubItem {
  id: number;
  title: string;
  content: string;
  chars: number;
}

export interface PromptBlock {
  id: number;
  title: string;
  template: string;
  templateFilename?: string | null;
  selectedContexts: SelectedContext[];
}

export interface SelectedContext {
  blockId: number;
  itemIds: number[];
  subItemIds: string[];
}

// Template types
export interface Template {
  id: string;
  userId: string;
  name: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Key types
export interface ApiKey {
  id: string;
  userId: string;
  provider: AiProvider;
  status: 'not_configured' | 'active' | 'error';
  lastTestedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type AiProvider = 'openai' | 'anthropic' | 'gemini' | 'grok' | 'openrouter';

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

