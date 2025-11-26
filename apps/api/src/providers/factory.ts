import { AiProvider } from '@promptozaurus/shared';
import { BaseAIProvider } from './base.provider.js';
import { OpenAIProvider } from './openai.provider.js';
import { AnthropicProvider } from './anthropic.provider.js';
import { GeminiProvider } from './gemini.provider.js';
import { GrokProvider } from './grok.provider.js';
import { OpenRouterProvider } from './openrouter.provider.js';

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
        return new GrokProvider(apiKey);
      
      case 'openrouter':
        return new OpenRouterProvider(apiKey);
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}

