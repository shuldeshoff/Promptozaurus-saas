// src/services/ai/OpenRouterProvider.js - Провайдер для OpenRouter API
// @description: Реализация провайдера для работы с множественными AI моделями через OpenRouter
// @created: 2025-06-25 - интеграция с OpenRouter API

import BaseProvider from './BaseProvider.js';

/**
 * Провайдер для работы с OpenRouter API
 * Предоставляет доступ к множественным AI моделям через единый интерфейс
 */
class OpenRouterProvider extends BaseProvider {
  constructor(config = {}) {
    super('OpenRouter', 'https://openrouter.ai/api/v1', {
      temperature: 0.7,
      maxTokens: 4000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      ...config
    });
    
    // Популярные модели доступные через OpenRouter
    this.popularModels = [
      'openai/gpt-4-turbo',
      'openai/gpt-4',
      'openai/gpt-3.5-turbo',
      'anthropic/claude-3-opus',
      'anthropic/claude-3-sonnet',
      'anthropic/claude-3-haiku',
      'meta-llama/llama-2-70b-chat',
      'google/gemini-pro',
      'mistralai/mixtral-8x7b-instruct',
      'cohere/command-r-plus'
    ];
  }
  
  /**
   * Отправка запроса к OpenRouter API
   * @param {string} prompt - Текст промпта
   * @param {Object} options - Настройки запроса
   * @returns {Promise<Object>}
   */
  async sendRequest(prompt, options = {}) {
    try {
      this.logActivity('sendRequest', { promptLength: prompt.length, options });
      
      // Валидация промпта
      const validation = this.validatePrompt(prompt);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      const requestOptions = {
        model: options.model || 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: validation.prompt
          }
        ],
        temperature: options.temperature ?? this.config.temperature,
        max_tokens: options.maxTokens ?? this.config.maxTokens,
        top_p: options.topP ?? this.config.topP,
        frequency_penalty: options.frequencyPenalty ?? this.config.frequencyPenalty,
        presence_penalty: options.presencePenalty ?? this.config.presencePenalty,
        stream: options.stream || false
      };
      
      // Добавляем системное сообщение если указано
      if (options.systemPrompt) {
        requestOptions.messages.unshift({
          role: 'system',
          content: options.systemPrompt
        });
      }
      
      console.log('Отправка запроса к OpenRouter:', { 
        model: requestOptions.model, 
        messageCount: requestOptions.messages.length,
        temperature: requestOptions.temperature
      });
      
      const startTime = Date.now();
      
      // Выполняем запрос через main процесс
      const result = await window.electronAPI.invoke('http-request', {
        url: 'https://openrouter.ai/api/v1/chat/completions',
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://prompt-constructor.app',
            'X-Title': 'Prompt Constructor'
          },
          body: requestOptions,
          timeout: 60000
        }
      });
      
      const duration = Date.now() - startTime;
      
      if (!result.success) {
        throw new Error(result.error || 'Ошибка запроса к OpenRouter');
      }
      
      const response = result.data;
      
      // Проверяем структуру ответа
      if (!response.choices || response.choices.length === 0) {
        throw new Error('Некорректный ответ от OpenRouter API');
      }
      
      const choice = response.choices[0];
      const content = choice.message?.content || choice.text || '';
      
      this.logActivity('requestComplete', { 
        duration, 
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens,
        model: requestOptions.model
      });
      
      return this.formatResponse({
        content,
        usage: response.usage,
        finish_reason: choice.finish_reason
      }, {
        model: requestOptions.model,
        duration,
        provider: 'openrouter'
      });
      
    } catch (error) {
      this.logActivity('requestError', { error: error.message });
      return this.handleError(error, 'sendRequest');
    }
  }
  
  /**
   * Получение списка доступных моделей
   * @param {string} apiKey - API ключ OpenRouter
   * @returns {Promise<Array>}
   */
  async getAvailableModels(apiKey) {
    try {
      this.logActivity('getAvailableModels');
      
      if (!apiKey) {
        throw new Error('API ключ обязателен');
      }
      
      const result = await window.electronAPI.invoke('http-request', {
        url: 'https://openrouter.ai/api/v1/models',
        options: {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Ошибка получения моделей от OpenRouter');
      }
      
      const modelsData = result.data.data || [];
      
      // Фильтруем и обрабатываем модели
      const models = modelsData
        .filter(model => {
          // Показываем только активные модели
          return !model.id.includes('moderated') && 
                 !model.id.includes('deprecated') &&
                 model.pricing && 
                 (model.pricing.prompt !== undefined || model.pricing.completion !== undefined);
        })
        .map(model => ({
          id: model.id,
          name: this.getModelDisplayName(model),
          provider: 'openrouter',
          actualProvider: this.extractProviderFromId(model.id),
          contextLength: model.context_length || 4096,
          description: model.description || this.generateModelDescription(model),
          capabilities: this.getModelCapabilities(model),
          pricing: {
            prompt: model.pricing?.prompt || 0,
            completion: model.pricing?.completion || 0
          },
          topProvider: model.top_provider || null
        }))
        .sort((a, b) => {
          // Сортируем по популярности и качеству
          const aIsPopular = this.popularModels.includes(a.id);
          const bIsPopular = this.popularModels.includes(b.id);
          
          if (aIsPopular && !bIsPopular) return -1;
          if (!aIsPopular && bIsPopular) return 1;
          
          // Сортируем по провайдеру и контексту
          return a.actualProvider.localeCompare(b.actualProvider) || 
                 b.contextLength - a.contextLength;
        });
      
      this.logActivity('modelsLoaded', { count: models.length });
      
      return models;
    } catch (error) {
      this.logActivity('modelsError', { error: error.message });
      throw this.handleError(error, 'getAvailableModels');
    }
  }
  
  /**
   * Тестирование соединения с OpenRouter API
   * @param {string} apiKey - API ключ для тестирования
   * @returns {Promise<Object>}
   */
  async testConnection(apiKey) {
    try {
      this.logActivity('testConnection');
      
      if (!apiKey) {
        throw new Error('API ключ обязателен для тестирования');
      }
      
      // Проверяем доступ к API через запрос моделей
      const testResult = await window.electronAPI.invoke('http-request', {
        url: 'https://openrouter.ai/api/v1/models',
        options: {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      });
      
      if (!testResult.success) {
        throw new Error(testResult.error || 'Ошибка подключения к OpenRouter');
      }
      
      const models = testResult.data.data || [];
      const activeModels = models.filter(model => 
        !model.id.includes('moderated') && 
        !model.id.includes('deprecated')
      );
      
      this.logActivity('connectionTestSuccess', { modelsCount: activeModels.length });
      
      return {
        success: true,
        message: 'Соединение с OpenRouter установлено успешно',
        modelsCount: activeModels.length,
        availableModels: this.popularModels.slice(0, 5) // Первые 5 популярных для превью
      };
    } catch (error) {
      this.logActivity('connectionTestError', { error: error.message });
      return this.handleError(error, 'testConnection');
    }
  }
  
  /**
   * Получение отображаемого имени модели
   * @param {Object} model - Объект модели от OpenRouter
   * @returns {string}
   */
  getModelDisplayName(model) {
    if (model.name) {
      return model.name;
    }
    
    // Извлекаем красивое имя из ID
    const parts = model.id.split('/');
    const modelName = parts[parts.length - 1];
    
    return modelName
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/Gpt/g, 'GPT')
      .replace(/Llama/g, 'LLaMA')
      .replace(/Claude/g, 'Claude');
  }
  
  /**
   * Извлечение провайдера из ID модели
   * @param {string} modelId - ID модели
   * @returns {string}
   */
  extractProviderFromId(modelId) {
    const parts = modelId.split('/');
    const provider = parts[0];
    
    const providerMap = {
      'openai': 'OpenAI',
      'anthropic': 'Anthropic',
      'meta-llama': 'Meta',
      'google': 'Google',
      'mistralai': 'Mistral AI',
      'cohere': 'Cohere',
      'huggingface': 'Hugging Face'
    };
    
    return providerMap[provider] || provider;
  }
  
  /**
   * Генерация описания модели
   * @param {Object} model - Объект модели
   * @returns {string}
   */
  generateModelDescription(model) {
    const provider = this.extractProviderFromId(model.id);
    const contextLength = model.context_length || 4096;
    
    let description = `Модель ${provider}`;
    
    if (contextLength > 32000) {
      description += ' с расширенным контекстом';
    } else if (contextLength > 16000) {
      description += ' с большим контекстом';
    }
    
    if (model.pricing) {
      const cost = parseFloat(model.pricing.prompt || 0);
      if (cost === 0) {
        description += ' (бесплатная)';
      } else if (cost < 0.001) {
        description += ' (низкая стоимость)';
      } else if (cost > 0.01) {
        description += ' (премиум)';
      }
    }
    
    return description;
  }
  
  /**
   * Получение возможностей модели
   * @param {Object} model - Объект модели
   * @returns {Object}
   */
  getModelCapabilities(model) {
    const modelId = model.id.toLowerCase();
    const isGPT4 = modelId.includes('gpt-4');
    const isClaude3 = modelId.includes('claude-3');
    const isLLaMA = modelId.includes('llama');
    
    return {
      textGeneration: true,
      codeGeneration: isGPT4 || isClaude3 || modelId.includes('code'),
      reasoning: isGPT4 || isClaude3,
      multiLanguage: true,
      contextRetention: true,
      streaming: true,
      functions: isGPT4,
      vision: modelId.includes('vision') || (isGPT4 && modelId.includes('turbo')),
      openSource: isLLaMA || modelId.includes('mixtral'),
      commercial: !isLLaMA
    };
  }
  
  /**
   * Получение возможностей провайдера
   * @returns {Object}
   */
  getCapabilities() {
    return {
      streaming: true,
      functions: true,
      vision: true,
      multiModal: true,
      multiProvider: true,
      pricing: true,
      openSource: true,
      variety: true
    };
  }
  
  /**
   * Специфическая обработка ошибок OpenRouter
   * @param {Error} error - Ошибка для обработки
   * @param {string} context - Контекст ошибки
   * @returns {Object}
   */
  handleError(error, context = 'API запрос') {
    // Проверяем специфические ошибки OpenRouter
    if (error.message.includes('insufficient_quota')) {
      return {
        success: false,
        error: 'Недостаточно средств на балансе OpenRouter',
        type: 'billing'
      };
    } else if (error.message.includes('model_not_found')) {
      return {
        success: false,
        error: 'Указанная модель недоступна через OpenRouter',
        type: 'model'
      };
    } else if (error.message.includes('provider_error')) {
      return {
        success: false,
        error: 'Ошибка базового провайдера модели',
        type: 'provider'
      };
    }
    
    // Возвращаем базовую обработку ошибок
    return super.handleError(error, context);
  }
}

export default OpenRouterProvider;