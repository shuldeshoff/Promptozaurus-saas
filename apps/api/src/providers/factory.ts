import { AiProvider } from '@promptozaurus/shared';
import { BaseAIProvider } from './base.provider.js';
import { OpenAIProvider } from './openai.provider.js';
import { AnthropicProvider } from './anthropic.provider.js';
import { GeminiProvider } from './gemini.provider.js';

/**
 * Factory for creating AI provider instances
 */
export class AIProviderFactory {
  static createProvider(provider: AiProvider, apiKey: string): BaseAIProvider {
    switch (provider) {
      case 'openai':
        return new OpenAIProvider(apiKey);
      
      case 'anthropic':
        return new AnthropicProvider(apiKey);
      
      case 'gemini':
        return new GeminiProvider(apiKey);
      
      case 'grok':
        // Grok uses OpenAI-compatible API
        return new OpenAIProvider(apiKey, 'https://api.x.ai/v1');
      
      case 'openrouter':
        // OpenRouter uses OpenAI-compatible API
        return new OpenAIProvider(apiKey, 'https://openrouter.ai/api/v1');
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}

