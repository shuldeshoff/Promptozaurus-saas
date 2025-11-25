// src/services/ai/AnthropicProvider.js - Провайдер для Anthropic Claude API
// @description: Реализация провайдера для работы с Anthropic Claude моделями
// @created: 2025-06-25 - интеграция с Anthropic API

import BaseProvider from './BaseProvider.js';
import modelsCache from '../ModelsCache.js';

/**
 * Провайдер для работы с Anthropic Claude API
 * Поддерживает Claude-3, Claude-2 и другие модели Anthropic
 */
class AnthropicProvider extends BaseProvider {
  constructor(config = {}) {
    super('Anthropic', 'https://api.anthropic.com', {
      temperature: 0.7,
      maxTokens: 4000,
      topP: 1,
      topK: 40,
      ...config
    });
    
    // Локальный кэш в памяти для быстрого доступа
    this.memoryCache = null;
    this.memoryCacheTimestamp = null;
    
    // Fallback модели на случай недоступности API
    this.fallbackModels = [
      'claude-sonnet-4-20250514',    // Claude Sonnet 4 - актуальная модель (май 2025)
      'claude-opus-4-20250514',      // Claude Opus 4 - самая мощная модель (май 2025)
      'claude-3-7-sonnet-20250224',  // Claude 3.7 Sonnet (февраль 2025)
      'claude-3-5-sonnet-20241022',  // Claude 3.5 Sonnet - октябрь 2024
      'claude-3-5-sonnet-20240620',  // Claude 3.5 Sonnet - июнь 2024
      'claude-3-5-haiku-20241022',   // Claude 3.5 Haiku
      'claude-3-opus-20240229',      // Claude 3 Opus
      'claude-3-sonnet-20240229',    // Claude 3 Sonnet (старая)
      'claude-3-haiku-20240307'      // Claude 3 Haiku (старая)
    ];
    
    this.anthropicVersion = '2023-06-01';
  }
  
  /**
   * Отправка запроса к Anthropic API
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
      
      // Разрешаем алиасы моделей
      let modelToUse = options.model || 'claude-sonnet-4-20250514';
      if (modelToUse.includes('latest')) {
        modelToUse = await this.resolveModelAlias(modelToUse, this.apiKey);
        console.log(`Алиас модели разрешен: ${options.model} -> ${modelToUse}`);
      }
      
      const requestOptions = {
        model: modelToUse,
        max_tokens: options.maxTokens ?? this.config.maxTokens,
        temperature: options.temperature ?? this.config.temperature,
        top_p: options.topP ?? this.config.topP,
        top_k: options.topK ?? this.config.topK,
        stream: options.stream || false,
        messages: [
          {
            role: 'user',
            content: validation.prompt
          }
        ]
      };
      
      // Добавляем системное сообщение если указано
      if (options.systemPrompt) {
        requestOptions.system = options.systemPrompt;
      }
      
      console.log('Отправка запроса к Anthropic:', { 
        model: requestOptions.model, 
        messageCount: requestOptions.messages.length,
        temperature: requestOptions.temperature
      });
      
      const startTime = Date.now();
      
      // Выполняем запрос через main процесс
      const result = await window.electronAPI.invoke('http-request', {
        url: 'https://api.anthropic.com/v1/messages',
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': this.anthropicVersion
          },
          body: requestOptions,
          timeout: 60000
        }
      });
      
      const duration = Date.now() - startTime;
      
      if (!result.success) {
        throw new Error(result.error || 'Ошибка запроса к Anthropic');
      }
      
      const response = result.data;
      
      // Проверяем структуру ответа Claude
      if (!response.content || response.content.length === 0) {
        throw new Error('Некорректный ответ от Anthropic API');
      }
      
      const content = response.content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join('');
      
      this.logActivity('requestComplete', { 
        duration, 
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens 
      });
      
      return this.formatResponse({
        content,
        usage: {
          prompt_tokens: response.usage?.input_tokens || 0,
          completion_tokens: response.usage?.output_tokens || 0,
          total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
        },
        finish_reason: response.stop_reason || 'stop'
      }, {
        model: requestOptions.model,
        duration,
        provider: 'anthropic'
      });
      
    } catch (error) {
      this.logActivity('requestError', { error: error.message });
      return this.handleError(error, 'sendRequest');
    }
  }
  
  /**
   * Получение списка доступных моделей
   * @param {string} apiKey - API ключ Anthropic
   * @param {boolean} forceRefresh - Принудительное обновление кэша
   * @returns {Promise<Array>}
   */
  async getAvailableModels(apiKey, forceRefresh = false) {
    try {
      this.logActivity('getAvailableModels', { forceRefresh });
      
      if (!apiKey) {
        throw new Error('API ключ обязателен');
      }
      
      // Проверяем кэш в памяти
      if (!forceRefresh && this.memoryCache && this.memoryCacheTimestamp) {
        const age = Date.now() - this.memoryCacheTimestamp;
        if (age < 5 * 60 * 1000) { // 5 минут для кэша в памяти
          this.logActivity('modelsLoaded', { count: this.memoryCache.length, source: 'memory' });
          return this.memoryCache;
        }
      }
      
      // Проверяем локальный кэш
      if (!forceRefresh) {
        const cached = modelsCache.getCache('anthropic');
        if (cached && cached.models) {
          this.memoryCache = cached.models;
          this.memoryCacheTimestamp = Date.now();
          this.logActivity('modelsLoaded', { count: cached.models.length, source: 'localStorage' });
          return cached.models;
        }
      }
      
      // Пытаемся получить актуальный список моделей через API
      const result = await window.electronAPI.invoke('http-request', {
        url: 'https://api.anthropic.com/v1/models',
        options: {
          method: 'GET',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': this.anthropicVersion,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      });
      
      if (result.success && result.data) {
        // Обрабатываем ответ API
        let models = [];
        
        // API может вернуть массив в разных форматах
        if (Array.isArray(result.data)) {
          models = result.data;
        } else if (result.data.data && Array.isArray(result.data.data)) {
          models = result.data.data;
        } else if (result.data.models && Array.isArray(result.data.models)) {
          models = result.data.models;
        }
        
        if (models.length > 0) {
          // Обрабатываем реальные модели из API
          const apiModels = models
            .filter(model => !model.type || model.type === 'model') // Некоторые модели могут не иметь типа
            .map(model => {
              const modelInfo = {
                id: model.id || model.model_id || model.name,
                name: model.display_name || model.name || this.getModelDisplayName(model.id || model.model_id || model.name),
                provider: 'anthropic',
                contextLength: model.context_length || this.getModelContextLength(model.id || model.model_id || model.name),
                description: model.description || this.getModelDescription(model.id || model.model_id || model.name),
                capabilities: this.getModelCapabilities(model.id || model.model_id || model.name),
                created_at: model.created_at || model.created,
                max_tokens: model.max_tokens || model.max_output_tokens,
                input_cost: model.input_cost_per_token,
                output_cost: model.output_cost_per_token
              };
              
              // Добавляем дополнительную информацию если есть
              if (model.training_data_cutoff) {
                modelInfo.training_cutoff = model.training_data_cutoff;
              }
              
              return modelInfo;
            })
            .sort((a, b) => {
              // Сортируем по дате создания (новые сверху)
              if (a.created_at && b.created_at) {
                const dateA = new Date(a.created_at);
                const dateB = new Date(b.created_at);
                const dateDiff = dateB.getTime() - dateA.getTime();
                if (dateDiff !== 0) return dateDiff;
              }
              
              // Затем по приоритету модели
              return this.getModelPriority(b.id) - this.getModelPriority(a.id);
            });
          
          // Сохраняем в кэш
          this.memoryCache = apiModels;
          this.memoryCacheTimestamp = Date.now();
          
          // Сохраняем в localStorage через сервис
          modelsCache.setCache('anthropic', apiModels, {
            source: 'api',
            apiVersion: this.anthropicVersion
          });
          
          this.logActivity('modelsLoaded', { count: apiModels.length, source: 'api' });
          return apiModels;
        }
      }
      
      // Если не удалось получить модели через API, пробуем загрузить из локального кэша
      const cached = modelsCache.getCache('anthropic', 7 * 24 * 60 * 60 * 1000); // Неделя
      if (cached && cached.models && cached.models.length > 0) {
        console.warn('Используем сохраненный кэш моделей');
        this.memoryCache = cached.models;
        this.memoryCacheTimestamp = Date.now();
        return cached.models;
      }
      
      // В крайнем случае используем fallback
      console.warn('Используем fallback список моделей');
      return this.getFallbackModels();
      
    } catch (error) {
      console.error('Ошибка получения моделей через API:', error);
      
      // Пробуем загрузить из локального кэша
      const cached = modelsCache.getCache('anthropic', 7 * 24 * 60 * 60 * 1000); // Неделя
      if (cached && cached.models && cached.models.length > 0) {
        console.warn('Используем сохраненный кэш моделей после ошибки');
        this.memoryCache = cached.models;
        this.memoryCacheTimestamp = Date.now();
        return cached.models;
      }
      
      console.warn('Используем fallback список моделей');
      return this.getFallbackModels();
    }
  }
  
  /**
   * Получение fallback списка моделей
   * @returns {Array}
   */
  getFallbackModels() {
    const models = this.fallbackModels.map(modelId => ({
      id: modelId,
      name: this.getModelDisplayName(modelId),
      provider: 'anthropic',
      contextLength: this.getModelContextLength(modelId),
      description: this.getModelDescription(modelId),
      capabilities: this.getModelCapabilities(modelId)
    }));
    
    this.logActivity('modelsLoaded', { count: models.length, source: 'fallback' });
    return models;
  }
  
  /**
   * Принудительное обновление списка моделей
   * @param {string} apiKey - API ключ
   * @returns {Promise<Array>}
   */
  async refreshModels(apiKey) {
    return this.getAvailableModels(apiKey, true);
  }
  
  /**
   * Очистка кэша моделей
   */
  clearModelsCache() {
    this.memoryCache = null;
    this.memoryCacheTimestamp = null;
    modelsCache.removeCache('anthropic');
  }
  
  /**
   * Получение статистики кэша
   * @returns {Object}
   */
  getCacheStats() {
    const stats = modelsCache.getCacheStats();
    return stats.providers.anthropic || null;
  }
  
  /**
   * Разрешение алиасов моделей на конкретные версии
   * @param {string} modelAlias - Алиас модели (например, claude-3-latest)
   * @param {string} apiKey - API ключ для получения списка моделей
   * @returns {Promise<string>} - Конкретная версия модели
   */
  async resolveModelAlias(modelAlias, apiKey) {
    // Если это не алиас, возвращаем как есть
    if (!modelAlias.includes('-latest') && !modelAlias.includes('latest')) {
      return modelAlias;
    }
    
    try {
      // Получаем актуальный список моделей
      const models = await this.getAvailableModels(apiKey);
      
      // Определяем базовое имя модели
      const basePattern = modelAlias
        .replace('-latest', '')
        .replace('latest', '')
        .trim();
      
      // Ищем самую новую версию с таким паттерном
      const matchingModels = models.filter(model => 
        model.id.toLowerCase().includes(basePattern.toLowerCase())
      );
      
      if (matchingModels.length > 0) {
        // Модели уже отсортированы по дате создания
        return matchingModels[0].id;
      }
      
      // Если не нашли подходящую модель, пробуем fallback
      const fallbackMap = {
        'claude-3-latest': 'claude-3-5-sonnet-20241022',
        'claude-3-sonnet-latest': 'claude-3-5-sonnet-20241022',
        'claude-3-opus-latest': 'claude-3-opus-20240229',
        'claude-3-haiku-latest': 'claude-3-5-haiku-20241022',
        'claude-4-latest': 'claude-sonnet-4-20250514',
        'claude-sonnet-latest': 'claude-sonnet-4-20250514',
        'claude-opus-latest': 'claude-opus-4-20250514'
      };
      
      return fallbackMap[modelAlias] || modelAlias;
    } catch (error) {
      console.error(`Ошибка разрешения алиаса модели ${modelAlias}:`, error);
      return modelAlias;
    }
  }
  
  /**
   * Получение информации о стоимости модели
   * @param {string} modelId - ID модели
   * @returns {Object} - {inputCost, outputCost} в $ за 1M токенов
   */
  getModelPricing(modelId) {
    const pricingMap = {
      'claude-opus-4-20250514': { input: 15, output: 75 },
      'claude-sonnet-4-20250514': { input: 3, output: 15 },
      'claude-3-7-sonnet-20250224': { input: 3, output: 15 },
      'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
      'claude-3-5-sonnet-20240620': { input: 3, output: 15 },
      'claude-3-5-haiku-20241022': { input: 0.8, output: 4 },
      'claude-3-opus-20240229': { input: 15, output: 75 },
      'claude-3-sonnet-20240229': { input: 3, output: 15 },
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 }
    };
    
    return pricingMap[modelId] || { input: 0, output: 0 };
  }
  
  /**
   * Тестирование соединения с Anthropic API
   * @param {string} apiKey - API ключ для тестирования
   * @returns {Promise<Object>}
   */
  async testConnection(apiKey) {
    try {
      this.logActivity('testConnection');
      
      if (!apiKey) {
        throw new Error('API ключ обязателен для тестирования');
      }
      
      // Отправляем минимальный запрос для проверки
      const testResult = await window.electronAPI.invoke('http-request', {
        url: 'https://api.anthropic.com/v1/messages',
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': this.anthropicVersion
          },
          body: {
            model: 'claude-3-5-haiku-20241022', // Самая быстрая модель для теста
            max_tokens: 10,
            messages: [
              {
                role: 'user',
                content: 'Hi'
              }
            ]
          },
          timeout: 15000
        }
      });
      
      if (!testResult.success) {
        throw new Error(testResult.error || 'Ошибка подключения к Anthropic');
      }
      
      this.logActivity('connectionTestSuccess');
      
      return {
        success: true,
        message: 'Соединение с Anthropic установлено успешно',
        modelsCount: this.fallbackModels.length,
        availableModels: this.fallbackModels.slice(0, 3) // Первые 3 для превью
      };
    } catch (error) {
      this.logActivity('connectionTestError', { error: error.message });
      return this.handleError(error, 'testConnection');
    }
  }
  
  /**
   * Получение отображаемого имени модели
   * @param {string} modelId - ID модели
   * @returns {string}
   */
  getModelDisplayName(modelId) {
    const nameMap = {
      'claude-sonnet-4-20250514': 'Claude Sonnet 4 (Latest)',
      'claude-opus-4-20250514': 'Claude Opus 4 (Most Capable)',
      'claude-3-7-sonnet-20250224': 'Claude 3.7 Sonnet',
      'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet (Oct 2024)',
      'claude-3-5-sonnet-20240620': 'Claude 3.5 Sonnet (June 2024)',
      'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
      'claude-3-opus-20240229': 'Claude 3 Opus',
      'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
      'claude-3-haiku-20240307': 'Claude 3 Haiku'
    };
    
    return nameMap[modelId] || modelId;
  }
  
  /**
   * Получение размера контекста модели
   * @param {string} modelId - ID модели
   * @returns {number}
   */
  getModelContextLength(modelId) {
    const contextMap = {
      'claude-sonnet-4-20250514': 200000,
      'claude-opus-4-20250514': 200000,
      'claude-3-7-sonnet-20250224': 200000,
      'claude-3-5-sonnet-20241022': 200000,
      'claude-3-5-sonnet-20240620': 200000,
      'claude-3-5-haiku-20241022': 200000,
      'claude-3-opus-20240229': 200000,
      'claude-3-sonnet-20240229': 200000,
      'claude-3-haiku-20240307': 200000
    };
    
    return contextMap[modelId] || 200000;
  }
  
  /**
   * Получение описания модели
   * @param {string} modelId - ID модели
   * @returns {string}
   */
  getModelDescription(modelId) {
    const descriptionMap = {
      'claude-sonnet-4-20250514': 'Новейшая модель Claude 4 с превосходными возможностями кодирования и рассуждения',
      'claude-opus-4-20250514': 'Самая мощная модель Claude 4 - лидер в области кодинга и сложных задач',
      'claude-3-7-sonnet-20250224': 'Гибридная модель с возможностями расширенного мышления',
      'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet с улучшенными возможностями',
      'claude-3-5-sonnet-20240620': 'Claude 3.5 Sonnet - превосходная модель для сложных задач',
      'claude-3-5-haiku-20241022': 'Быстрая и экономичная модель Claude 3.5',
      'claude-3-opus-20240229': 'Мощная модель Claude 3 с превосходными аналитическими способностями',
      'claude-3-sonnet-20240229': 'Балансирует производительность и скорость для большинства задач',
      'claude-3-haiku-20240307': 'Быстрая модель Claude для простых задач'
    };
    
    return descriptionMap[modelId] || 'Модель Anthropic Claude';
  }
  
  /**
   * Получение возможностей модели
   * @param {string} modelId - ID модели
   * @returns {Object}
   */
  getModelCapabilities(modelId) {
    const isClaude3 = modelId.includes('claude-3');
    const isClaude35 = modelId.includes('claude-3-5');
    const isClaude37 = modelId.includes('claude-3-7');
    const isClaude4 = modelId.includes('claude-') && (modelId.includes('-4-') || modelId.includes('sonnet-4') || modelId.includes('opus-4'));
    const isOpus = modelId.includes('opus');
    const isSonnet = modelId.includes('sonnet');
    
    return {
      textGeneration: true,
      codeGeneration: true,
      reasoning: isClaude3 || isClaude4,
      multiLanguage: true,
      contextRetention: true,
      streaming: true,
      functions: false, // Claude не поддерживает function calling
      vision: (isClaude3 || isClaude4) && (isSonnet || isOpus), // Claude 3+ и 4 Sonnet/Opus поддерживают vision
      longContext: true,
      safety: true,
      constitutional: true,
      artifacts: isClaude35 || isClaude37 || isClaude4, // Claude 3.5+ поддерживает артефакты
      computerUse: (isClaude35 || isClaude37 || isClaude4) && isSonnet, // Computer use в Sonnet версиях
      extendedThinking: isClaude37 || isClaude4, // Расширенное мышление в 3.7 и 4
      toolUse: isClaude35 || isClaude37 || isClaude4, // Использование инструментов
      codeExecution: isClaude4 // Выполнение кода в Claude 4
    };
  }
  
  /**
   * Получение приоритета модели для сортировки
   * @param {string} modelId - ID модели
   * @returns {number}
   */
  getModelPriority(modelId) {
    const priorityMap = {
      'claude-opus-4-20250514': 100,      // Самый высокий приоритет
      'claude-sonnet-4-20250514': 95,     // Второй по приоритету
      'claude-3-7-sonnet-20250224': 90,   // Третий
      'claude-3-5-sonnet-20241022': 85,
      'claude-3-5-sonnet-20240620': 80,
      'claude-3-5-haiku-20241022': 75,
      'claude-3-opus-20240229': 70,
      'claude-3-sonnet-20240229': 65,
      'claude-3-haiku-20240307': 60
    };
    
    return priorityMap[modelId] || 50;
  }
  
  /**
   * Получение возможностей провайдера
   * @returns {Object}
   */
  getCapabilities() {
    return {
      streaming: true,
      functions: false,
      vision: true,
      multiModal: true,
      longContext: true,
      constitutional: true,
      safety: true,
      reasoning: true
    };
  }
  
  /**
   * Специфическая обработка ошибок Anthropic
   * @param {Error} error - Ошибка для обработки
   * @param {string} context - Контекст ошибки
   * @returns {Object}
   */
  handleError(error, context = 'API запрос') {
    // Проверяем специфические ошибки Anthropic
    if (error.message.includes('credit_balance_too_low')) {
      return {
        success: false,
        error: 'Недостаточно средств на балансе Anthropic',
        type: 'billing'
      };
    } else if (error.message.includes('rate_limit_exceeded')) {
      return {
        success: false,
        error: 'Превышен лимит запросов к Anthropic API',
        type: 'rate_limit'
      };
    } else if (error.message.includes('model_not_found')) {
      return {
        success: false,
        error: 'Указанная модель Claude недоступна',
        type: 'model'
      };
    }
    
    // Возвращаем базовую обработку ошибок
    return super.handleError(error, context);
  }
}

export default AnthropicProvider;