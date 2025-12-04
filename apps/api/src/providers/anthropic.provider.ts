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
      console.log(`📤 Anthropic API request: model=${options.model}, tokens=${options.maxTokens}`);
      
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
        const errorText = await response.text();
        console.error(`❌ Anthropic API error (${response.status}):`, errorText);
        
        let errorData: { error?: { message?: string; type?: string } } = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          // ignore parse errors
        }
        
        throw new Error(
          errorData.error?.message || `Anthropic API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json() as AnthropicResponse;
      console.log(`✅ Anthropic response: ${data.content[0]?.text?.substring(0, 100)}...`);

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
      console.error('❌ Anthropic sendMessage failed:', error);
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
      // Claude Sonnet 4.5 (latest - September 2024)
      // Multiple variants as Anthropic doesn't document exact API name yet
      {
        id: 'claude-sonnet-4.5-20240929',
        name: 'Claude Sonnet 4.5 (v1)',
        provider: this.getProviderName(),
        contextWindow: 200000,
        maxOutputTokens: 16384,
        supportsVision: true,
      },
      {
        id: 'claude-sonnet-4-20240929',
        name: 'Claude Sonnet 4.5 (v2)',
        provider: this.getProviderName(),
        contextWindow: 200000,
        maxOutputTokens: 16384,
        supportsVision: true,
      },
      {
        id: 'claude-4-sonnet-20240929',
        name: 'Claude Sonnet 4.5 (v3)',
        provider: this.getProviderName(),
        contextWindow: 200000,
        maxOutputTokens: 16384,
        supportsVision: true,
      },
      {
        id: 'claude-sonnet-4.5',
        name: 'Claude Sonnet 4.5 (simple)',
        provider: this.getProviderName(),
        contextWindow: 200000,
        maxOutputTokens: 16384,
        supportsVision: true,
      },
      // Claude 3.5 models (October 2024)
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet (New)',
        provider: this.getProviderName(),
        contextWindow: 200000,
        maxOutputTokens: 8192,
        supportsVision: true,
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku (New)',
        provider: this.getProviderName(),
        contextWindow: 200000,
        maxOutputTokens: 8192,
        supportsVision: true,
      },
      // Claude 3.5 models (June 2024)
      {
        id: 'claude-3-5-sonnet-20240620',
        name: 'Claude 3.5 Sonnet',
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

