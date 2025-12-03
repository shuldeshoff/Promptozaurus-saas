import {
  BaseAIProvider,
  AIModel,
  AIResponse,
  SendMessageOptions,
} from './base.provider.js';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterChatRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface OpenRouterChatResponse {
  id: string;
  model: string;
  choices: Array<{
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

interface OpenRouterModelsResponse {
  data: Array<{
    id: string;
    name?: string;
    context_length?: number;
    pricing?: {
      prompt: string;
      completion: string;
    };
  }>;
}

export class OpenRouterProvider extends BaseAIProvider {
  protected getDefaultBaseUrl(): string {
    return 'https://openrouter.ai/api/v1';
  }

  getProviderName(): string {
    return 'openrouter';
  }

  async getModels(): Promise<AIModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json() as OpenRouterModelsResponse;

      console.log(`OpenRouter API returned ${data.data?.length || 0} total models`);

      // Filter and format models (no limit - return all models)
      const models = (data.data || [])
        .filter((model) => !model.id.includes('moderated') && !model.id.includes('deprecated'))
        .map((model) => this.formatModel(model));

      console.log(`Filtered to ${models.length} OpenRouter models (removed moderated/deprecated)`);

      return models.length > 0 ? models : this.getDefaultModels();
    } catch (error) {
      console.error('Failed to fetch OpenRouter models:', error);
      return this.getDefaultModels();
    }
  }

  async sendMessage(options: SendMessageOptions): Promise<AIResponse> {
    const messages: OpenRouterMessage[] = [];

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

    const requestBody: OpenRouterChatRequest = {
      model: options.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://promptyflow.com',
          'X-Title': 'PromptyFlow',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(
          errorData.error?.message || `OpenRouter API error: ${response.statusText}`
        );
      }

      const data = await response.json() as OpenRouterChatResponse;

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
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  private formatModel(model: { id: string; name?: string; context_length?: number; pricing?: { prompt: string; completion: string } }): AIModel {
    return {
      id: model.id,
      name: model.name || this.extractModelName(model.id),
      provider: this.getProviderName(),
      contextWindow: model.context_length || 4096,
      maxOutputTokens: Math.min(model.context_length || 4096, 16384),
    };
  }

  private extractModelName(modelId: string): string {
    const parts = modelId.split('/');
    const name = parts[parts.length - 1];
    return name
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace(/Gpt/g, 'GPT')
      .replace(/Llama/g, 'LLaMA')
      .replace(/Claude/g, 'Claude');
  }

  private getDefaultModels(): AIModel[] {
    return [
      {
        id: 'openai/gpt-4-turbo',
        name: 'GPT-4 Turbo (OpenRouter)',
        provider: this.getProviderName(),
        contextWindow: 128000,
        maxOutputTokens: 4096,
      },
      {
        id: 'openai/gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo (OpenRouter)',
        provider: this.getProviderName(),
        contextWindow: 16384,
        maxOutputTokens: 4096,
      },
      {
        id: 'anthropic/claude-3-opus',
        name: 'Claude 3 Opus (OpenRouter)',
        provider: this.getProviderName(),
        contextWindow: 200000,
        maxOutputTokens: 4096,
      },
      {
        id: 'anthropic/claude-3-sonnet',
        name: 'Claude 3 Sonnet (OpenRouter)',
        provider: this.getProviderName(),
        contextWindow: 200000,
        maxOutputTokens: 4096,
      },
      {
        id: 'google/gemini-pro',
        name: 'Gemini Pro (OpenRouter)',
        provider: this.getProviderName(),
        contextWindow: 32760,
        maxOutputTokens: 8192,
      },
      {
        id: 'meta-llama/llama-2-70b-chat',
        name: 'LLaMA 2 70B (OpenRouter)',
        provider: this.getProviderName(),
        contextWindow: 4096,
        maxOutputTokens: 4096,
      },
    ];
  }
}

