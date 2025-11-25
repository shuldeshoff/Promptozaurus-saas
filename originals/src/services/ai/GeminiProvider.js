// src/services/ai/GeminiProvider.js - Провайдер для Google Gemini API
// @description: Реализация провайдера для работы с Google Gemini моделями
// @created: 2025-06-25 - интеграция с Google AI Studio API

import BaseProvider from './BaseProvider.js';

/**
 * Провайдер для работы с Google Gemini API
 * Поддерживает Gemini Pro, Gemini Pro Vision и другие модели Google
 */
class GeminiProvider extends BaseProvider {
  constructor(config = {}) {
    super('Gemini', 'https://generativelanguage.googleapis.com', {
      temperature: 0.7,
      maxTokens: 8192,
      topP: 0.95,
      topK: 64,
      ...config
    });
    
    this.supportedModels = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro',
      'gemini-1.0-pro'
    ];
    
    this.apiVersion = 'v1';
  }
  
  /**
   * Отправка запроса к Gemini API
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
      
      const model = options.model || 'gemini-1.5-flash';
      
      const requestOptions = {
        contents: [{
          parts: [{
            text: validation.prompt
          }]
        }],
        generationConfig: {
          temperature: options.temperature ?? this.config.temperature,
          topK: options.topK ?? this.config.topK,
          topP: options.topP ?? this.config.topP,
          maxOutputTokens: options.maxTokens ?? this.config.maxTokens,
          stopSequences: options.stopSequences || []
        }
      };
      
      // Добавляем системную инструкцию если указана
      if (options.systemPrompt) {
        requestOptions.systemInstruction = {
          parts: [{
            text: options.systemPrompt
          }]
        };
      }
      
      console.log('Отправка запроса к Gemini:', { 
        model, 
        temperature: requestOptions.generationConfig.temperature
      });
      
      const startTime = Date.now();
      
      // Выполняем запрос через main процесс
      const result = await window.electronAPI.invoke('http-request', {
        url: `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${this.apiKey}`,
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: requestOptions,
          timeout: 60000
        }
      });
      
      const duration = Date.now() - startTime;
      
      if (!result.success) {
        throw new Error(result.error || 'Ошибка запроса к Gemini');
      }
      
      const response = result.data;
      
      // Проверяем структуру ответа Gemini
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('Некорректный ответ от Gemini API');
      }
      
      const candidate = response.candidates[0];
      const content = candidate.content?.parts
        ?.map(part => part.text)
        .join('') || '';
      
      this.logActivity('requestComplete', { 
        duration, 
        tokensCount: response.usageMetadata?.totalTokenCount
      });
      
      return this.formatResponse({
        content,
        usage: {
          prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
          completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: response.usageMetadata?.totalTokenCount || 0
        },
        finish_reason: candidate.finishReason || 'STOP'
      }, {
        model,
        duration,
        provider: 'gemini'
      });
      
    } catch (error) {
      this.logActivity('requestError', { error: error.message });
      return this.handleError(error, 'sendRequest');
    }
  }
  
  /**
   * Получение списка доступных моделей
   * @param {string} apiKey - API ключ Gemini
   * @returns {Promise<Array>}
   */
  async getAvailableModels(apiKey) {
    try {
      this.logActivity('getAvailableModels');
      
      if (!apiKey) {
        throw new Error('API ключ обязателен');
      }
      
      // Запрашиваем список моделей у Google
      const result = await window.electronAPI.invoke('http-request', {
        url: `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
        options: {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Ошибка получения моделей от Gemini');
      }
      
      const modelsData = result.data.models || [];
      
      // Фильтруем и обрабатываем модели
      const models = modelsData
        .filter(model => {
          // Показываем только генеративные модели
          return model.supportedGenerationMethods?.includes('generateContent');
        })
        .map(model => ({
          id: model.name.split('/').pop(), // Извлекаем короткое имя
          name: this.getModelDisplayName(model.name.split('/').pop()),
          provider: 'gemini',
          contextLength: model.inputTokenLimit || 32768,
          outputLength: model.outputTokenLimit || 8192,
          description: model.description || this.getModelDescription(model.name.split('/').pop()),
          capabilities: this.getModelCapabilities(model),
          version: model.version || '1.0',
          supportedMethods: model.supportedGenerationMethods || []
        }))
        .sort((a, b) => {
          // Сортируем по версии и возможностям
          const aScore = this.getModelPriority(a.id);
          const bScore = this.getModelPriority(b.id);
          return bScore - aScore;
        });
      
      this.logActivity('modelsLoaded', { count: models.length });
      
      return models;
    } catch (error) {
      this.logActivity('modelsError', { error: error.message });
      // Если не удалось загрузить, возвращаем предопределенный список
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
      provider: 'gemini',
      contextLength: this.getModelContextLength(modelId),
      description: this.getModelDescription(modelId),
      capabilities: this.getModelCapabilities({ name: `models/${modelId}` })
    }));
  }
  
  /**
   * Тестирование соединения с Gemini API
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
        url: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            contents: [{
              parts: [{
                text: 'Hi'
              }]
            }],
            generationConfig: {
              maxOutputTokens: 10,
              temperature: 0.1
            }
          },
          timeout: 15000
        }
      });
      
      if (!testResult.success) {
        throw new Error(testResult.error || 'Ошибка подключения к Gemini');
      }
      
      this.logActivity('connectionTestSuccess');
      
      return {
        success: true,
        message: 'Соединение с Gemini установлено успешно',
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
      'gemini-1.5-pro': 100,
      'gemini-1.5-flash': 80,
      'gemini-1.5-flash-8b': 70,
      'gemini-1.0-pro': 60
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
      'gemini-1.5-flash': 'Gemini 1.5 Flash',
      'gemini-1.5-flash-8b': 'Gemini 1.5 Flash 8B',
      'gemini-1.5-pro': 'Gemini 1.5 Pro',
      'gemini-1.0-pro': 'Gemini 1.0 Pro'
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
      'gemini-1.5-flash': 1048576, // 1M токенов
      'gemini-1.5-flash-8b': 1048576,
      'gemini-1.5-pro': 2097152, // 2M токенов
      'gemini-1.0-pro': 32768
    };
    
    return contextMap[modelId] || 32768;
  }
  
  /**
   * Получение описания модели
   * @param {string} modelId - ID модели
   * @returns {string}
   */
  getModelDescription(modelId) {
    const descriptionMap = {
      'gemini-1.5-flash': 'Быстрая модель с огромным контекстом',
      'gemini-1.5-flash-8b': 'Легкая и быстрая модель с большим контекстом',
      'gemini-1.5-pro': 'Мощная модель с огромным контекстом до 2М токенов',
      'gemini-1.0-pro': 'Универсальная модель для текстовых задач'
    };
    
    return descriptionMap[modelId] || 'Модель Google Gemini';
  }
  
  /**
   * Получение возможностей модели
   * @param {Object} model - Объект модели
   * @returns {Object}
   */
  getModelCapabilities(model) {
    const modelId = model.name?.split('/').pop() || '';
    const isVision = modelId.includes('vision');
    const is15 = modelId.includes('1.5');
    
    return {
      textGeneration: true,
      codeGeneration: true,
      reasoning: true,
      multiLanguage: true,
      contextRetention: true,
      streaming: true,
      functions: false, // Gemini пока не поддерживает function calling через API
      vision: isVision,
      longContext: is15,
      audio: false,
      video: is15 // Gemini 1.5 поддерживает видео
    };
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
      safety: true,
      video: true,
      free: true // Google предоставляет бесплатный доступ
    };
  }
  
  /**
   * Специфическая обработка ошибок Gemini
   * @param {Error} error - Ошибка для обработки
   * @param {string} context - Контекст ошибки
   * @returns {Object}
   */
  handleError(error, context = 'API запрос') {
    // Проверяем специфические ошибки Gemini
    if (error.message.includes('INVALID_API_KEY')) {
      return {
        success: false,
        error: 'Неверный API ключ Google AI Studio',
        type: 'authentication'
      };
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      return {
        success: false,
        error: 'Превышена квота запросов к Gemini API',
        type: 'quota'
      };
    } else if (error.message.includes('RESOURCE_EXHAUSTED')) {
      return {
        success: false,
        error: 'Исчерпан лимит токенов или запросов',
        type: 'rate_limit'
      };
    }
    
    // Возвращаем базовую обработку ошибок
    return super.handleError(error, context);
  }
}

export default GeminiProvider;