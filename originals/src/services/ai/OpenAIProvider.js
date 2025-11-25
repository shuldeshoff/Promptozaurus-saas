// src/services/ai/OpenAIProvider.js - Провайдер для OpenAI API
// @description: Реализация провайдера для работы с OpenAI GPT моделями
// @created: 2025-06-25 - интеграция с OpenAI API

import BaseProvider from './BaseProvider.js';

/**
 * Провайдер для работы с OpenAI API
 * Поддерживает GPT-3.5, GPT-4 и другие модели OpenAI
 */
class OpenAIProvider extends BaseProvider {
  constructor(config = {}) {
    super('OpenAI', 'https://api.openai.com/v1', {
      temperature: 0.7,
      maxTokens: 4000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      ...config
    });
    
    this.supportedModels = [
      'gpt-4-turbo',
      'gpt-4',
      'gpt-4-32k',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k'
    ];
  }
  
  /**
   * Отправка запроса к OpenAI API
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
        model: options.model || 'gpt-3.5-turbo',
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
      
      // Если указана системная роль
      if (options.systemPrompt) {
        requestOptions.messages.unshift({
          role: 'system',
          content: options.systemPrompt
        });
      }
      
      console.log('Отправка запроса к OpenAI:', { 
        model: requestOptions.model, 
        messageCount: requestOptions.messages.length,
        temperature: requestOptions.temperature
      });
      
      const startTime = Date.now();
      
      // Выполняем запрос через main процесс для безопасности
      const result = await window.electronAPI.invoke('http-request', {
        url: 'https://api.openai.com/v1/chat/completions',
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: requestOptions,
          timeout: 60000
        }
      });
      
      const duration = Date.now() - startTime;
      
      if (!result.success) {
        throw new Error(result.error || 'Ошибка запроса к OpenAI');
      }
      
      const response = result.data;
      
      // Проверяем структуру ответа
      if (!response.choices || response.choices.length === 0) {
        throw new Error('Некорректный ответ от OpenAI API');
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
        provider: 'openai'
      });
      
    } catch (error) {
      this.logActivity('requestError', { error: error.message });
      return this.handleError(error, 'sendRequest');
    }
  }
  
  /**
   * Получение списка доступных моделей
   * @param {string} apiKey - API ключ OpenAI
   * @returns {Promise<Array>}
   */
  async getAvailableModels(apiKey) {
    try {
      this.logActivity('getAvailableModels');
      
      if (!apiKey) {
        throw new Error('API ключ обязателен');
      }
      
      const result = await window.electronAPI.invoke('http-request', {
        url: 'https://api.openai.com/v1/models',
        options: {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 30000
        }
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Ошибка получения моделей от OpenAI');
      }
      
      const models = result.data.data || [];
      
      // Фильтруем только поддерживаемые GPT модели
      const supportedModels = models
        .filter(model => {
          const id = model.id;
          return id.includes('gpt') && (
            id.includes('gpt-4') || 
            id.includes('gpt-3.5') ||
            this.supportedModels.includes(id)
          );
        })
        .map(model => ({
          id: model.id,
          name: this.getModelDisplayName(model.id),
          provider: 'openai',
          contextLength: this.getModelContextLength(model.id),
          description: this.getModelDescription(model.id),
          capabilities: this.getModelCapabilities(model.id)
        }))
        .sort((a, b) => {
          // Сортируем по приоритету (GPT-4 первые)
          const priorityA = a.id.includes('gpt-4') ? 0 : 1;
          const priorityB = b.id.includes('gpt-4') ? 0 : 1;
          return priorityA - priorityB || a.name.localeCompare(b.name);
        });
      
      this.logActivity('modelsLoaded', { count: supportedModels.length });
      
      return supportedModels;
    } catch (error) {
      this.logActivity('modelsError', { error: error.message });
      throw this.handleError(error, 'getAvailableModels');
    }
  }
  
  /**
   * Тестирование соединения с OpenAI API
   * @param {string} apiKey - API ключ для тестирования
   * @returns {Promise<Object>}
   */
  async testConnection(apiKey) {
    try {
      this.logActivity('testConnection');
      
      if (!apiKey) {
        throw new Error('API ключ обязателен для тестирования');
      }
      
      // Простой запрос для проверки соединения
      const testResult = await window.electronAPI.invoke('http-request', {
        url: 'https://api.openai.com/v1/models',
        options: {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 10000 // Короткий таймаут для теста
        }
      });
      
      if (!testResult.success) {
        throw new Error(testResult.error || 'Ошибка подключения к OpenAI');
      }
      
      const models = testResult.data.data || [];
      const gptModels = models.filter(model => model.id.includes('gpt'));
      
      this.logActivity('connectionTestSuccess', { modelsCount: gptModels.length });
      
      return {
        success: true,
        message: 'Соединение с OpenAI установлено успешно',
        modelsCount: gptModels.length,
        availableModels: gptModels.slice(0, 5).map(m => m.id) // Первые 5 для превью
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
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4-turbo-preview': 'GPT-4 Turbo Preview',
      'gpt-4': 'GPT-4',
      'gpt-4-32k': 'GPT-4 32K',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'gpt-3.5-turbo-16k': 'GPT-3.5 Turbo 16K'
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
      'gpt-4-turbo': 128000,
      'gpt-4-turbo-preview': 128000,
      'gpt-4': 8192,
      'gpt-4-32k': 32768,
      'gpt-3.5-turbo': 4096,
      'gpt-3.5-turbo-16k': 16384
    };
    
    return contextMap[modelId] || 4096;
  }
  
  /**
   * Получение описания модели
   * @param {string} modelId - ID модели
   * @returns {string}
   */
  getModelDescription(modelId) {
    const descriptionMap = {
      'gpt-4-turbo': 'Самая мощная модель GPT-4 с улучшенной скоростью',
      'gpt-4': 'Флагманская модель OpenAI с превосходным качеством',
      'gpt-4-32k': 'GPT-4 с расширенным контекстом до 32K токенов',
      'gpt-3.5-turbo': 'Быстрая и эффективная модель для большинства задач',
      'gpt-3.5-turbo-16k': 'GPT-3.5 с расширенным контекстом'
    };
    
    return descriptionMap[modelId] || 'Модель OpenAI GPT';
  }
  
  /**
   * Получение возможностей модели
   * @param {string} modelId - ID модели
   * @returns {Object}
   */
  getModelCapabilities(modelId) {
    const isGPT4 = modelId.includes('gpt-4');
    
    return {
      textGeneration: true,
      codeGeneration: true,
      reasoning: isGPT4,
      multiLanguage: true,
      contextRetention: true,
      streaming: true,
      functions: isGPT4,
      vision: modelId.includes('vision') || modelId.includes('turbo')
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
      fineTuning: true,
      embeddings: true
    };
  }
}

export default OpenAIProvider;