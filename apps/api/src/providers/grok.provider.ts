import {
  BaseAIProvider,
  AIModel,
  AIResponse,
  SendMessageOptions,
} from './base.provider.js';

interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokChatRequest {
  model: string;
  messages: GrokMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

interface GrokChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GrokProvider extends BaseAIProvider {
  protected getDefaultBaseUrl(): string {
    return 'https://api.x.ai/v1';
  }

  getProviderName(): string {
    return 'grok';
  }

  async getModels(): Promise<AIModel[]> {
    // X.AI не предоставляет endpoint для списка моделей, используем хардкод
    return this.getDefaultModels();
  }

  async sendMessage(options: SendMessageOptions): Promise<AIResponse> {
    const messages: GrokMessage[] = [];

    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: options.prompt,
    });

    const requestBody: GrokChatRequest = {
      model: options.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      top_p: 0.95,
      stream: false,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(
          errorData.error?.message || `Grok API error: ${response.statusText}`
        );
      }

      const data = await response.json() as GrokChatResponse;

      return {
        content: data.choices[0]?.message.content || '',
        model: data.model,
        provider: this.getProviderName(),
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
        finishReason: data.choices[0]?.finish_reason,
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
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'grok-3-mini',
          messages: [
            {
              role: 'user',
              content: 'Hi',
            },
          ],
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
      {
        id: 'grok-4-1-fast-non-reasoning',
        name: 'Grok 4.1 Fast (Non-Reasoning)',
        provider: this.getProviderName(),
        contextWindow: 131072, // 128K context
        maxOutputTokens: 4096,
      },
      {
        id: 'grok-3-mini',
        name: 'Grok 3 Mini',
        provider: this.getProviderName(),
        contextWindow: 131072,
        maxOutputTokens: 4096,
      },
      {
        id: 'grok',
        name: 'Grok',
        provider: this.getProviderName(),
        contextWindow: 131072,
        maxOutputTokens: 4096,
      },
    ];
  }
}

