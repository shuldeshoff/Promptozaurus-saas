import { z } from 'zod';

// User schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  googleId: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().url().optional(),
  language: z.enum(['en', 'ru']),
  theme: z.enum(['dark', 'light']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  language: z.enum(['en', 'ru']).optional(),
  theme: z.enum(['dark', 'light']).optional(),
});

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  data: z.any().optional(), // ProjectData validation can be more specific
});

// Template schemas
export const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  content: z.string(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
});

// API Key schemas
export const createApiKeySchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'gemini', 'grok', 'openrouter']),
  apiKey: z.string().min(1),
});

export const updateApiKeySchema = z.object({
  apiKey: z.string().min(1),
});

