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
  max_completion_tokens?: number;
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

// New /v1/responses endpoint format (for GPT-5.1 models)
interface OpenAIResponsesRequest {
  model: string;
  input: string;  // Not 'messages', but 'input' with text prompt
  temperature?: number;
  max_output_tokens?: number;  // Not 'max_completion_tokens', but 'max_output_tokens'
}

interface OpenAIResponsesResponse {
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

      const data = await response.json() as OpenAIModelsResponse;

      // Filter and format chat models (GPT models only)
      const chatModels = data.data
        .filter((model) => {
          const id = model.id;
          // Include GPT-3.5, GPT-4, GPT-4o, GPT-5, GPT-6, etc.
          return id.includes('gpt') && !id.includes('instruct') && !id.includes('vision');
        })
        .map((model) => this.formatModel(model.id))
        .sort((a, b) => {
          // Sort: GPT-6 > GPT-5 > GPT-4 > GPT-3.5
          const getVersion = (id: string) => {
            if (id.includes('gpt-6')) return 6;
            if (id.includes('gpt-5')) return 5;
            if (id.includes('gpt-4')) return 4;
            if (id.includes('gpt-3.5')) return 3.5;
            return 0;
          };
          
          const versionDiff = getVersion(b.id) - getVersion(a.id);
          if (versionDiff !== 0) return versionDiff;
          
          // Within same version, sort by name
          return a.name.localeCompare(b.name);
        });

      return chatModels.length > 0 ? chatModels : this.getDefaultModels();
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

    // GPT-5.1 models with "codex" or "chat" in name use new /v1/responses endpoint
    const isResponsesAPI = options.model.includes('gpt-5.1') && 
                          (options.model.includes('codex') || options.model.includes('chat'));
    
    // GPT-5 and later models use max_completion_tokens instead of max_tokens
    const isGpt5OrLater = options.model.includes('gpt-5') || options.model.includes('gpt-6');
    
    // GPT-5-mini only supports temperature=1 (default)
    const temperature = isGpt5OrLater && options.model.includes('mini') 
      ? 1 
      : (options.temperature ?? 0.7);

    if (isResponsesAPI) {
      // New /v1/responses endpoint format
      return this.sendMessageResponsesAPI(options, messages, temperature);
    }

    // Standard /v1/chat/completions endpoint
    const requestBody: OpenAIChatRequest = {
      model: options.model,
      messages,
      temperature,
      ...(isGpt5OrLater 
        ? { max_completion_tokens: options.maxTokens }
        : { max_tokens: options.maxTokens }
      ),
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
        const errorData = await response.json().catch(() => ({})) as { error?: { message?: string; type?: string; code?: string } };
        console.error(`OpenAI API Error (${options.model}):`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          requestBody: {
            model: requestBody.model,
            temperature: requestBody.temperature,
            maxTokensField: isGpt5OrLater ? 'max_completion_tokens' : 'max_tokens',
          }
        });
        throw new Error(
          errorData.error?.message || `OpenAI API error: ${response.statusText}`
        );
      }

      const data = await response.json() as OpenAIChatResponse;
      
      // Log if content is empty
      if (!data.choices[0]?.message.content) {
        console.warn(`OpenAI returned empty content for model ${options.model}:`, {
          choices: data.choices,
          finishReason: data.choices[0]?.finish_reason,
        });
      }

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
      console.error(`OpenAI sendMessage error for ${options.model}:`, error);
      return {
        content: '',
        model: options.model,
        provider: this.getProviderName(),
        error: this.formatError(error),
      };
    }
  }

  // New method for /v1/responses endpoint (GPT-5.1 models)
  private async sendMessageResponsesAPI(
    options: SendMessageOptions,
    messages: OpenAIMessage[],
    temperature: number
  ): Promise<AIResponse> {
    // Convert messages to single text input
    let inputText = '';
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        inputText += `System: ${msg.content}\n\n`;
      } else if (msg.role === 'user') {
        inputText += msg.content;
      }
    }
    
    const requestBody: OpenAIResponsesRequest = {
      model: options.model,
      input: inputText,
      temperature,
      max_output_tokens: options.maxTokens,
    };

    try {
      const response = await fetch(`${this.baseUrl}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: { message?: string; type?: string; code?: string } };
        console.error(`OpenAI Responses API Error (${options.model}):`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
        });
        throw new Error(
          errorData.error?.message || `OpenAI Responses API error: ${response.statusText}`
        );
      }

      const data = await response.json() as OpenAIResponsesResponse;
      
      // Log FULL response structure for debugging
      console.log(`OpenAI Responses API FULL response for ${options.model}:`, JSON.stringify(data, null, 2));
      
      // Log if content is empty
      if (!data.choices?.[0]?.message?.content) {
        console.warn(`OpenAI Responses API returned empty content for model ${options.model}:`, {
          choices: data.choices,
          finishReason: data.choices?.[0]?.finish_reason,
        });
      }

      return {
        content: data.choices?.[0]?.message?.content || '',
        model: data.model,
        provider: this.getProviderName(),
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        finishReason: data.choices?.[0]?.finish_reason,
      };
    } catch (error) {
      console.error(`OpenAI Responses API sendMessage error for ${options.model}:`, error);
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

