import {
  BaseAIProvider,
  AIModel,
  AIResponse,
  SendMessageOptions,
} from './base.provider.js';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface OpenAIChatResponse {
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

interface OpenAIModelsResponse {
  data: Array<{
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }>;
}

export class OpenAIProvider extends BaseAIProvider {
  protected getDefaultBaseUrl(): string {
    return 'https://api.openai.com/v1';
  }

  getProviderName(): string {
    return 'openai';
  }

  async getModels(): Promise<AIModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data: OpenAIModelsResponse = await response.json();

      // Filter and format models
      const chatModels = data.data
        .filter((model) => model.id.includes('gpt'))
        .map((model) => this.formatModel(model.id));

      return chatModels;
    } catch (error) {
      console.error('Failed to fetch OpenAI models:', error);
      return this.getDefaultModels();
    }
  }

  async sendMessage(options: SendMessageOptions): Promise<AIResponse> {
    const messages: OpenAIMessage[] = [];

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

    const requestBody: OpenAIChatRequest = {
      model: options.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `OpenAI API error: ${response.statusText}`
        );
      }

      const data: OpenAIChatResponse = await response.json();

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
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  private formatModel(modelId: string): AIModel {
    const model: AIModel = {
      id: modelId,
      name: modelId,
      provider: this.getProviderName(),
    };

    // Add known model details
    if (modelId.includes('gpt-4-turbo') || modelId.includes('gpt-4-1106')) {
      model.contextWindow = 128000;
      model.maxOutputTokens = 4096;
      model.supportsVision = modelId.includes('vision');
    } else if (modelId.includes('gpt-4')) {
      model.contextWindow = 8192;
      model.maxOutputTokens = 4096;
    } else if (modelId.includes('gpt-3.5-turbo-16k')) {
      model.contextWindow = 16384;
      model.maxOutputTokens = 4096;
    } else if (modelId.includes('gpt-3.5')) {
      model.contextWindow = 4096;
      model.maxOutputTokens = 4096;
    }

    return model;
  }

  private getDefaultModels(): AIModel[] {
    return [
      {
        id: 'gpt-4-turbo-preview',
        name: 'GPT-4 Turbo',
        provider: this.getProviderName(),
        contextWindow: 128000,
        maxOutputTokens: 4096,
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: this.getProviderName(),
        contextWindow: 8192,
        maxOutputTokens: 4096,
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: this.getProviderName(),
        contextWindow: 4096,
        maxOutputTokens: 4096,
      },
    ];
  }
}

