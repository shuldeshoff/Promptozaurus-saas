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

interface GeminiModelInfo {
  name: string; // Format: "models/gemini-pro"
  displayName: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedGenerationMethods: string[];
}

interface GeminiModelsResponse {
  models: GeminiModelInfo[];
}

export class GeminiProvider extends BaseAIProvider {
  protected getDefaultBaseUrl(): string {
    return 'https://generativelanguage.googleapis.com/v1';
  }

  getProviderName(): string {
    return 'gemini';
  }

  async getModels(): Promise<AIModel[]> {
    try {
      // Gemini uses v1beta API for models list (v1 is more restrictive)
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Gemini models API error: ${response.status} ${response.statusText}`, errorText);
        console.warn('Using fallback models for Gemini');
        return this.getDefaultModels();
      }

      const data = await response.json() as GeminiModelsResponse;
      
      console.log(`Gemini API returned ${data.models?.length || 0} models`);

      // Filter generative models that support generateContent
      const models = (data.models || [])
        .filter((model) => 
          model.supportedGenerationMethods?.includes('generateContent') &&
          model.name.includes('gemini')
        )
        .map((model) => {
          // Extract model ID from full name (e.g., "models/gemini-pro" -> "gemini-pro")
          const modelId = model.name.split('/').pop() || model.name;
          
          return {
            id: modelId,
            name: model.displayName || this.formatModelName(modelId),
            provider: this.getProviderName(),
            contextWindow: model.inputTokenLimit || 1000000,
            maxOutputTokens: model.outputTokenLimit || 8192,
            supportsVision: modelId.includes('vision') || modelId.includes('pro') || modelId.includes('flash'),
          };
        })
        .sort((a, b) => {
          // Sort: gemini-2.5 > gemini-2.0 > gemini-1.5
          const getVersion = (id: string) => {
            if (id.includes('2.5')) return 2.5;
            if (id.includes('2.0')) return 2.0;
            if (id.includes('1.5')) return 1.5;
            if (id.includes('1.0')) return 1.0;
            return 0;
          };
          
          const versionDiff = getVersion(b.id) - getVersion(a.id);
          if (versionDiff !== 0) return versionDiff;
          
          // Flash models before Pro
          if (a.id.includes('flash') && !b.id.includes('flash')) return -1;
          if (!a.id.includes('flash') && b.id.includes('flash')) return 1;
          
          return a.name.localeCompare(b.name);
        });

      console.log(`Filtered to ${models.length} Gemini generative models`);

      return models.length > 0 ? models : this.getDefaultModels();
    } catch (error) {
      console.error('Failed to fetch Gemini models:', error);
      return this.getDefaultModels();
    }
  }

  private formatModelName(modelId: string): string {
    // Convert "gemini-2.5-flash" to "Gemini 2.5 Flash"
    return modelId
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
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
      // Use v1beta API (same as getModels) with gemini-2.5-flash
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
      
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
        console.error('Gemini test connection failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        return false;
      }

      console.log('✅ Gemini connection test successful');
      return true;
    } catch (error) {
      console.error('Gemini test connection error:', error);
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

