import {
  BaseAIProvider,
  AIModel,
  AIResponse,
  SendMessageOptions,
} from './base.provider.js';

interface GeminiContent {
  parts: Array<{
    text: string;
  }>;
}

interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiProvider extends BaseAIProvider {
  protected getDefaultBaseUrl(): string {
    return 'https://generativelanguage.googleapis.com/v1beta';
  }

  getProviderName(): string {
    return 'gemini';
  }

  async getModels(): Promise<AIModel[]> {
    // Gemini doesn't have a models endpoint easily accessible, return hardcoded list
    return this.getDefaultModels();
  }

  async sendMessage(options: SendMessageOptions): Promise<AIResponse> {
    const contents: GeminiContent[] = [];

    // Gemini handles system prompt differently - prepend to user message
    let userMessage = options.prompt;
    if (options.systemPrompt) {
      userMessage = `${options.systemPrompt}\n\n${options.prompt}`;
    }

    contents.push({
      parts: [{ text: userMessage }],
    });

    const requestBody: GeminiRequest = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 8192,
      },
    };

    try {
      const url = `${this.baseUrl}/models/${options.model}:generateContent?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(
          errorData.error?.message || `Gemini API error: ${response.statusText}`
        );
      }

      const data = await response.json() as GeminiResponse;

      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        content,
        model: options.model,
        provider: this.getProviderName(),
        usage: data.usageMetadata
          ? {
              promptTokens: data.usageMetadata.promptTokenCount,
              completionTokens: data.usageMetadata.candidatesTokenCount,
              totalTokens: data.usageMetadata.totalTokenCount,
            }
          : undefined,
        finishReason: data.candidates?.[0]?.finishReason,
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
      const url = `${this.baseUrl}/models/gemini-pro:generateContent?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: 'Hi' }],
            },
          ],
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
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: this.getProviderName(),
        contextWindow: 1000000,
        maxOutputTokens: 8192,
        supportsVision: true,
      },
      {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash-Lite',
        provider: this.getProviderName(),
        contextWindow: 1000000,
        maxOutputTokens: 8192,
        supportsVision: true,
      },
      {
        id: 'gemini-1.5-pro-latest',
        name: 'Gemini 1.5 Pro',
        provider: this.getProviderName(),
        contextWindow: 1000000, // 1M tokens
        maxOutputTokens: 8192,
        supportsVision: true,
      },
      {
        id: 'gemini-1.5-flash-latest',
        name: 'Gemini 1.5 Flash',
        provider: this.getProviderName(),
        contextWindow: 1000000,
        maxOutputTokens: 8192,
        supportsVision: true,
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: this.getProviderName(),
        contextWindow: 32760,
        maxOutputTokens: 8192,
      },
      {
        id: 'gemini-pro-vision',
        name: 'Gemini Pro Vision',
        provider: this.getProviderName(),
        contextWindow: 16384,
        maxOutputTokens: 8192,
        supportsVision: true,
      },
    ];
  }
}

