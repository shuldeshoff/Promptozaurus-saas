// src/services/ai/GrokProvider.js - Провайдер для X.AI Grok API
// @description: Реализация провайдера для работы с Grok моделями от X.AI
// @created: 2025-06-25 - интеграция с X.AI Grok API

import BaseProvider from './BaseProvider.js';

/**
 * Провайдер для работы с X.AI Grok API
 * Поддерживает Grok-1 и другие модели от X.AI
 */
class GrokProvider extends BaseProvider {
  constructor(config = {}) {
    super('Grok', 'https://api.x.ai', {
      temperature: 0.7,
      maxTokens: 4096,
      topP: 0.95,
      topK: 40,
      ...config
    });
    
    this.supportedModels = [
      'grok'
    ];
    
    this.apiVersion = 'v1';
  }
  
  /**
   * Отправка запроса к Grok API
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
        model: options.model || 'grok',
        messages: [
          {
            role: 'user',
            content: validation.prompt
          }
        ],
        temperature: options.temperature ?? this.config.temperature,
        max_tokens: options.maxTokens ?? this.config.maxTokens,
        top_p: options.topP ?? this.config.topP,
        stream: options.stream || false
      };
      
      // Добавляем системное сообщение если указано
      if (options.systemPrompt) {
        requestOptions.messages.unshift({
          role: 'system',
          content: options.systemPrompt
        });
      }
      
      // Добавляем специфичные для Grok параметры
      if (options.humor !== undefined) {
        requestOptions.humor_level = options.humor; // Уровень юмора 0-10
      }
      if (options.realTime !== undefined) {
        requestOptions.real_time_data = options.realTime; // Использовать актуальные данные
      }
      
      console.log('Отправка запроса к Grok:', { 
        model: requestOptions.model, 
        messageCount: requestOptions.messages.length,
        temperature: requestOptions.temperature
      });
      
      const startTime = Date.now();
      
      // Выполняем запрос через main процесс
      const result = await window.electronAPI.invoke('http-request', {
        url: 'https://api.x.ai/v1/chat/completions',
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'X-API-Version': this.apiVersion
          },
          body: requestOptions,
          timeout: 60000
        }
      });
      
      const duration = Date.now() - startTime;
      
      if (!result.success) {
        throw new Error(result.error || 'Ошибка запроса к Grok');
      }
      
      const response = result.data;
      
      // Проверяем структуру ответа
      if (!response.choices || response.choices.length === 0) {
        throw new Error('Некорректный ответ от Grok API');
      }
      
      const choice = response.choices[0];
      const content = choice.message?.content || choice.text || '';
      
      this.logActivity('requestComplete', { 
        duration, 
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens 
      });
      
      return this.formatResponse({
        content,
        usage: response.usage,
        finish_reason: choice.finish_reason
      }, {
        model: requestOptions.model,
        duration,
        provider: 'grok',
        humor_detected: response.humor_score || 0,
        real_time_used: response.real_time_sources?.length > 0
      });
      
    } catch (error) {
      this.logActivity('requestError', { error: error.message });
      return this.handleError(error, 'sendRequest');
    }
  }
  
  /**
   * Получение списка доступных моделей
   * @param {string} apiKey - API ключ Grok
   * @returns {Promise<Array>}
   */
  async getAvailableModels(apiKey) {
    try {
      this.logActivity('getAvailableModels');
      
      if (!apiKey) {
        throw new Error('API ключ обязателен');
      }
      
      // Запрашиваем список моделей у X.AI
      const result = await window.electronAPI.invoke('http-request', {
        url: 'https://api.x.ai/v1/models',
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
        // Если API не предоставляет список, используем предопределенный
        return this.getFallbackModels();
      }
      
      const modelsData = result.data.data || [];
      
      // Обрабатываем модели
      const models = modelsData
        .filter(model => model.active !== false)
        .map(model => ({
          id: model.id,
          name: this.getModelDisplayName(model.id),
          provider: 'grok',
          contextLength: model.context_window || 8192,
          description: model.description || this.getModelDescription(model.id),
          capabilities: this.getModelCapabilities(model),
          pricing: model.pricing || null,
          version: model.version || '1.0'
        }))
        .sort((a, b) => {
          const aScore = this.getModelPriority(a.id);
          const bScore = this.getModelPriority(b.id);
          return bScore - aScore;
        });
      
      this.logActivity('modelsLoaded', { count: models.length });
      
      return models;
    } catch (error) {
      this.logActivity('modelsError', { error: error.message });
      // Возвращаем предопределенный список при ошибке
      return this.getFallbackModels();
    }
  }
  
  /**
   * Получение резервного списка моделей
   * @returns {Array}
   */
  getFallbackModels() {
    return this.supportedModels.map(modelId => ({
      id: modelId,
      name: this.getModelDisplayName(modelId),
      provider: 'grok',
      contextLength: this.getModelContextLength(modelId),
      description: this.getModelDescription(modelId),
      capabilities: this.getModelCapabilities({ id: modelId })
    }));
  }
  
  /**
   * Тестирование соединения с Grok API
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
        url: 'https://api.x.ai/v1/chat/completions',
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-API-Version': this.apiVersion
          },
          body: {
            model: 'grok',
            messages: [
              {
                role: 'user',
                content: 'Hi'
              }
            ],
            max_tokens: 10,
            temperature: 0.1
          },
          timeout: 15000
        }
      });
      
      if (!testResult.success) {
        throw new Error(testResult.error || 'Ошибка подключения к Grok');
      }
      
      this.logActivity('connectionTestSuccess');
      
      return {
        success: true,
        message: 'Соединение с Grok установлено успешно',
        modelsCount: this.supportedModels.length,
        availableModels: this.supportedModels.slice(0, 3)
      };
    } catch (error) {
      this.logActivity('connectionTestError', { error: error.message });
      return this.handleError(error, 'testConnection');
    }
  }
  
  /**
   * Получение приоритета модели для сортировки
   * @param {string} modelId - ID модели
   * @returns {number}
   */
  getModelPriority(modelId) {
    const priorities = {
      'grok': 100
    };
    
    return priorities[modelId] || 0;
  }
  
  /**
   * Получение отображаемого имени модели
   * @param {string} modelId - ID модели
   * @returns {string}
   */
  getModelDisplayName(modelId) {
    const nameMap = {
      'grok': 'Grok'
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
      'grok': 131072 // 128K контекст
    };
    
    return contextMap[modelId] || 8192;
  }
  
  /**
   * Получение описания модели
   * @param {string} modelId - ID модели
   * @returns {string}
   */
  getModelDescription(modelId) {
    const descriptionMap = {
      'grok': 'Мощная модель Grok с актуальными данными и большим контекстом'
    };
    
    return descriptionMap[modelId] || 'Модель Grok от X.AI';
  }
  
  /**
   * Получение возможностей модели
   * @param {Object} model - Объект модели
   * @returns {Object}
   */
  getModelCapabilities(model) {
    const modelId = model.id || '';
    const isV2 = modelId.includes('2');
    
    return {
      textGeneration: true,
      codeGeneration: true,
      reasoning: true,
      multiLanguage: true,
      contextRetention: true,
      streaming: true,
      functions: isV2, // Grok 2 поддерживает function calling
      vision: false, // Пока не поддерживается
      longContext: isV2,
      realTimeData: true, // Уникальная фича Grok
      humor: true, // Еще одна уникальная фича
      twitter: true // Интеграция с X (Twitter)
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
      vision: false,
      multiModal: false,
      longContext: true,
      realTimeData: true,
      humor: true,
      twitter: true,
      personality: true
    };
  }
  
  /**
   * Специфическая обработка ошибок Grok
   * @param {Error} error - Ошибка для обработки
   * @param {string} context - Контекст ошибки
   * @returns {Object}
   */
  handleError(error, context = 'API запрос') {
    // Проверяем специфические ошибки Grok
    if (error.message.includes('invalid_api_key')) {
      return {
        success: false,
        error: 'Неверный API ключ X.AI',
        type: 'authentication'
      };
    } else if (error.message.includes('rate_limit')) {
      return {
        success: false,
        error: 'Превышен лимит запросов к Grok API',
        type: 'rate_limit'
      };
    } else if (error.message.includes('model_not_available')) {
      return {
        success: false,
        error: 'Запрошенная модель Grok недоступна',
        type: 'model'
      };
    }
    
    // Возвращаем базовую обработку ошибок
    return super.handleError(error, context);
  }
}

export default GrokProvider;