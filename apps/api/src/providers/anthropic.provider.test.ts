import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnthropicProvider } from './anthropic.provider';

global.fetch = vi.fn();

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;
  const mockApiKey = 'sk-ant-test-key-123';

  beforeEach(() => {
    provider = new AnthropicProvider(mockApiKey);
    vi.clearAllMocks();
  });

  describe('getProviderName', () => {
    it('should return "anthropic"', () => {
      expect(provider.getProviderName()).toBe('anthropic');
    });
  });

  describe('getModels', () => {
    it('should return hardcoded models list', async () => {
      const models = await provider.getModels();

      expect(models.length).toBeGreaterThan(0);
      expect(models[0].provider).toBe('anthropic');
      expect(models.some(m => m.id.includes('claude-3'))).toBe(true);
    });
  });

  describe('sendMessage', () => {
    const mockOptions = {
      prompt: 'Hello Claude',
      model: 'claude-3-sonnet-20240229',
      temperature: 0.7,
      maxTokens: 1000,
    };

    it('should send message and return response', async () => {
      const mockResponse = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Hello! How can I help you?' }],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 10,
          output_tokens: 8,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await provider.sendMessage(mockOptions);

      expect(response.content).toBe('Hello! How can I help you?');
      expect(response.model).toBe('claude-3-sonnet-20240229');
      expect(response.provider).toBe('anthropic');
      expect(response.usage?.totalTokens).toBe(18);
    });

    it('should include system prompt when provided', async () => {
      const mockResponse = {
        id: 'msg_123',
        content: [{ type: 'text', text: 'Response' }],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 5 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.sendMessage({
        ...mockOptions,
        systemPrompt: 'You are a helpful AI.',
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.system).toBe('You are a helpful AI.');
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Invalid API key',
        json: async () => ({ error: { message: 'Authentication failed' } }),
      });

      const response = await provider.sendMessage(mockOptions);

      expect(response.error).toContain('Authentication failed');
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
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await provider.testConnection();

      expect(result).toBe(false);
    });
  });
});

