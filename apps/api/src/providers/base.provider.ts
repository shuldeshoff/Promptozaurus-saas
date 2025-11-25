/**
 * Base interface for AI provider responses
 */
export interface AIResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason?: string;
  error?: string;
}

/**
 * Base interface for AI model information
 */
export interface AIModel {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  supportsVision?: boolean;
  pricing?: {
    input: number; // per 1M tokens
    output: number; // per 1M tokens
  };
}

/**
 * Send message options
 */
export interface SendMessageOptions {
  prompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * Abstract base class for AI providers
 */
export abstract class BaseAIProvider {
  protected apiKey: string;
  protected baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || this.getDefaultBaseUrl();
  }

  /**
   * Get default base URL for the provider
   */
  protected abstract getDefaultBaseUrl(): string;

  /**
   * Get provider name
   */
  abstract getProviderName(): string;

  /**
   * Get list of available models
   */
  abstract getModels(): Promise<AIModel[]>;

  /**
   * Send a message to the AI
   */
  abstract sendMessage(options: SendMessageOptions): Promise<AIResponse>;

  /**
   * Test if the API key is valid
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Format error message
   */
  protected formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}

