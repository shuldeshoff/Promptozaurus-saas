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

interface GrokModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface GrokModelsResponse {
  object: string;
  data: GrokModel[];
}

export class GrokProvider extends BaseAIProvider {
  protected getDefaultBaseUrl(): string {
    return 'https://api.x.ai/v1';
  }

  getProviderName(): string {
    return 'grok';
  }

  async getModels(): Promise<AIModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        console.warn(`Grok models API error: ${response.statusText}, using fallback`);
        return this.getDefaultModels();
      }

      const data = await response.json() as GrokModelsResponse;

      const models = data.data
        .filter((model) => !model.id.includes('beta')) // Filter out beta models
        .map((model) => this.formatModel(model.id))
        .sort((a, b) => {
          // Sort by version: grok-4 > grok-3 > grok-2
          const getVersion = (id: string) => {
            if (id.includes('grok-4')) return 4;
            if (id.includes('grok-3')) return 3;
            if (id.includes('grok-2')) return 2;
            return 1;
          };
          
          const versionDiff = getVersion(b.id) - getVersion(a.id);
          if (versionDiff !== 0) return versionDiff;
          
          return a.name.localeCompare(b.name);
        });

      return models.length > 0 ? models : this.getDefaultModels();
    } catch (error) {
      console.error('Failed to fetch Grok models:', error);
      return this.getDefaultModels();
    }
  }

  private formatModel(modelId: string): AIModel {
    // Map model IDs to human-readable names
    const nameMap: Record<string, string> = {
      'grok-4-1-fast-non-reasoning': 'Grok 4.1 Fast (Non-Reasoning)',
      'grok-3-mini': 'Grok 3 Mini',
      'grok': 'Grok',
    };

    return {
      id: modelId,
      name: nameMap[modelId] || modelId.replace('grok-', 'Grok ').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      provider: this.getProviderName(),
      contextWindow: 131072, // 128K context for all Grok models
      maxOutputTokens: 4096,
    };
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

