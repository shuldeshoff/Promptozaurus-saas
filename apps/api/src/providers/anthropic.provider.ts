import {
  BaseAIProvider,
  AIModel,
  AIResponse,
  SendMessageOptions,
} from './base.provider.js';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  temperature?: number;
  system?: string;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicProvider extends BaseAIProvider {
  protected getDefaultBaseUrl(): string {
    return 'https://api.anthropic.com/v1';
  }

  getProviderName(): string {
    return 'anthropic';
  }

  async getModels(): Promise<AIModel[]> {
    // Anthropic doesn't have a models endpoint, return hardcoded list
    return this.getDefaultModels();
  }

  async sendMessage(options: SendMessageOptions): Promise<AIResponse> {
    const messages: AnthropicMessage[] = [
      {
        role: 'user',
        content: options.prompt,
      },
    ];

    const requestBody: AnthropicRequest = {
      model: options.model,
      messages,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
    };

    if (options.systemPrompt) {
      requestBody.system = options.systemPrompt;
    }

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(
          errorData.error?.message || `Anthropic API error: ${response.statusText}`
        );
      }

      const data = await response.json() as AnthropicResponse;

      return {
        content: data.content[0]?.text || '',
        model: data.model,
        provider: this.getProviderName(),
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
        finishReason: data.stop_reason,
      };
    } catch (error) {
      return {
        content: '',
        model: options.model,
        provider: this.getProviderName(),
        error: this.formatError(error),
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test with a minimal request
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 10,
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  private getDefaultModels(): AIModel[] {
    return [
      // Claude 4.5 models (latest generation - Dec 2025)
      {
        id: 'claude-4.5-opus-20251201',
        name: 'Claude 4.5 Opus',
        provider: this.getProviderName(),
        contextWindow: 200000,
        maxOutputTokens: 16384,
        supportsVision: true,
      },
      {
        id: 'claude-4.5-sonnet-20251201',
        name: 'Claude 4.5 Sonnet',
        provider: this.getProviderName(),
        contextWindow: 200000,
        maxOutputTokens: 16384,
        supportsVision: true,
      },
      {
        id: 'claude-4.5-haiku-20251201',
        name: 'Claude 4.5 Haiku',
        provider: this.getProviderName(),
        contextWindow: 200000,
        maxOutputTokens: 8192,
        supportsVision: true,
      },
      // Claude 3.5 models (previous generation - fallback)
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        provider: this.getProviderName(),
        contextWindow: 200000,
        maxOutputTokens: 8192,
        supportsVision: true,
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        provider: this.getProviderName(),
        contextWindow: 200000,
        maxOutputTokens: 8192,
        supportsVision: true,
      },
      // Claude 3 models (legacy)
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        provider: this.getProviderName(),
        contextWindow: 200000,
        maxOutputTokens: 4096,
        supportsVision: true,
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        provider: this.getProviderName(),
        contextWindow: 200000,
        maxOutputTokens: 4096,
        supportsVision: true,
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        provider: this.getProviderName(),
        contextWindow: 200000,
        maxOutputTokens: 4096,
        supportsVision: true,
      },
    ];
  }
}

