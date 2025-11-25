import { z } from 'zod';

// Context Block schemas
export const ContextSubItemSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200),
  content: z.string(),
  chars: z.number().min(0),
});

export const ContextItemSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200),
  content: z.string(),
  chars: z.number().min(0),
  subItems: z.array(ContextSubItemSchema),
});

export const ContextBlockSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200),
  items: z.array(ContextItemSchema),
});

// Prompt Block schemas
export const SelectedContextSchema = z.object({
  blockId: z.number(),
  itemIds: z.array(z.number()),
  subItemIds: z.array(z.string()), // Format: "itemId.subItemId"
});

export const PromptBlockSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200),
  template: z.string(),
  templateFilename: z.string().nullable().optional(),
  selectedContexts: z.array(SelectedContextSchema),
});

// Project Data schema
export const ProjectDataSchema = z.object({
  contextBlocks: z.array(ContextBlockSchema),
  promptBlocks: z.array(PromptBlockSchema),
});

// User schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  googleId: z.string(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  avatarUrl: z.string().url().optional(),
  language: z.enum(['en', 'ru']),
  theme: z.enum(['dark', 'light']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Project schema
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(100),
  data: ProjectDataSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Template schema
export const TemplateSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(100),
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// AI Provider schema
export const AiProviderSchema = z.enum(['openai', 'anthropic', 'gemini', 'grok', 'openrouter']);

// API Key schema
export const ApiKeySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  provider: AiProviderSchema,
  status: z.enum(['not_configured', 'active', 'error']),
  lastTestedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
