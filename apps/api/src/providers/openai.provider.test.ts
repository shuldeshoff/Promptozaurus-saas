import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIProvider } from './openai.provider';

// Mock fetch globally
global.fetch = vi.fn();

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  const mockApiKey = 'sk-test-key-123';

  beforeEach(() => {
    provider = new OpenAIProvider(mockApiKey);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with API key', () => {
      expect(provider).toBeInstanceOf(OpenAIProvider);
      expect(provider.getProviderName()).toBe('openai');
    });

    it('should use custom base URL if provided', () => {
      const customProvider = new OpenAIProvider(mockApiKey, 'https://custom.openai.com');
      expect(customProvider).toBeInstanceOf(OpenAIProvider);
    });
  });

  describe('getProviderName', () => {
    it('should return "openai"', () => {
      expect(provider.getProviderName()).toBe('openai');
    });
  });

  describe('getModels', () => {
    it('should fetch and return models list', async () => {
      const mockResponse = {
        data: [
          { id: 'gpt-4-turbo', object: 'model', created: 123, owned_by: 'openai' },
          { id: 'gpt-4', object: 'model', created: 123, owned_by: 'openai' },
          { id: 'gpt-3.5-turbo', object: 'model', created: 123, owned_by: 'openai' },
          { id: 'whisper-1', object: 'model', created: 123, owned_by: 'openai' }, // Should be filtered out
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const models = await provider.getModels();

      expect(models).toHaveLength(3); // Only GPT models
      expect(models[0].id).toBe('gpt-4-turbo');
      expect(models[0].provider).toBe('openai');
      expect(models[0].contextWindow).toBe(128000);
    });

    it('should return default models on fetch error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const models = await provider.getModels();

      expect(models.length).toBeGreaterThan(0);
      expect(models[0].provider).toBe('openai');
    });

    it('should return default models on API error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      });

      const models = await provider.getModels();

      expect(models.length).toBeGreaterThan(0);
      expect(models[0].provider).toBe('openai');
    });
  });

  describe('sendMessage', () => {
    const mockOptions = {
      prompt: 'Hello, how are you?',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
    };

    it('should send message and return response', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'I am doing well, thank you!',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 8,
          total_tokens: 18,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await provider.sendMessage(mockOptions);

      expect(response.content).toBe('I am doing well, thank you!');
      expect(response.model).toBe('gpt-4');
      expect(response.provider).toBe('openai');
      expect(response.usage?.totalTokens).toBe(18);
      expect(response.finishReason).toBe('stop');
      expect(response.error).toBeUndefined();
    });

    it('should include system prompt when provided', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.sendMessage({
        ...mockOptions,
        systemPrompt: 'You are a helpful assistant.',
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.messages).toHaveLength(2);
      expect(requestBody.messages[0].role).toBe('system');
      expect(requestBody.messages[0].content).toBe('You are a helpful assistant.');
      expect(requestBody.messages[1].role).toBe('user');
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        json: async () => ({
          error: { message: 'Invalid API key' },
        }),
      });

      const response = await provider.sendMessage(mockOptions);

      expect(response.error).toContain('Invalid API key');
      expect(response.content).toBe('');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const response = await provider.sendMessage(mockOptions);

      expect(response.error).toContain('Network error');
      expect(response.content).toBe('');
    });

    it('should use default temperature if not provided', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.sendMessage({
        prompt: 'Test',
        model: 'gpt-4',
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.temperature).toBe(0.7);
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      const result = await provider.testConnection();

      expect(result).toBe(true);
    });

    it('should return false for failed connection', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      const result = await provider.testConnection();

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await provider.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('Model formatting', () => {
    it('should format GPT-4 Turbo models correctly', async () => {
      const mockResponse = {
        data: [{ id: 'gpt-4-turbo-preview', object: 'model', created: 123, owned_by: 'openai' }],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const models = await provider.getModels();

      expect(models[0].contextWindow).toBe(128000);
      expect(models[0].maxOutputTokens).toBe(4096);
    });

    it('should format GPT-3.5 models correctly', async () => {
      const mockResponse = {
        data: [{ id: 'gpt-3.5-turbo', object: 'model', created: 123, owned_by: 'openai' }],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const models = await provider.getModels();

      expect(models[0].contextWindow).toBe(4096);
      expect(models[0].maxOutputTokens).toBe(4096);
    });
  });
});

