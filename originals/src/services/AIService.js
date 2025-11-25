// src/services/AIService.js - Основной сервис для работы с AI провайдерами
// @description: Центральный координатор для всех AI провайдеров и управления моделями
// @created: 2025-06-25 - архитектурный слой для AI интеграции

import OpenAIProvider from './ai/OpenAIProvider.js';
import AnthropicProvider from './ai/AnthropicProvider.js';
import OpenRouterProvider from './ai/OpenRouterProvider.js';
import GeminiProvider from './ai/GeminiProvider.js';
import GrokProvider from './ai/GrokProvider.js';
import CredentialsService from './CredentialsService.js';

/**
 * Основной сервис для работы с AI провайдерами
 * Координирует работу между различными AI API и управляет конфигурациями моделей
 */
class AIService {
  constructor() {
    this.providers = {
      openai: new OpenAIProvider(),
      anthropic: new AnthropicProvider(),
      openrouter: new OpenRouterProvider(),
      gemini: new GeminiProvider(),
      grok: new GrokProvider()
    };
    
    this.modelConfigs = new Map(); // Кэш конфигураций моделей
    this.activeModels = []; // Список активных настроенных моделей
    this.loadedModels = new Map(); // Кэш загруженных моделей по провайдеру
    
    console.log('AIService инициализирован с провайдерами:', Object.keys(this.providers));
  }
  
  /**
   * Получить список всех доступных провайдеров
   * @returns {Array}
   */
  getAvailableProviders() {
    return Object.keys(this.providers).map(key => ({
      id: key,
      name: this.providers[key].name,
      baseUrl: this.providers[key].baseUrl,
      capabilities: this.providers[key].getCapabilities()
    }));
  }
  
  /**
   * Проверить наличие API ключей для всех провайдеров
   * @returns {Promise<Object>}
   */
  async checkProvidersStatus() {
    try {
      console.log('Проверка статуса всех провайдеров');
      
      const statusResult = await CredentialsService.getAllProvidersStatus();
      if (!statusResult.success) {
        throw new Error(statusResult.error || 'Ошибка проверки статуса провайдеров');
      }
      
      const providersStatus = {};
      
      for (const [providerId, status] of Object.entries(statusResult.providers)) {
        providersStatus[providerId] = {
          hasKey: status.hasKey,
          provider: this.providers[providerId]?.name || providerId,
          capabilities: this.providers[providerId]?.getCapabilities() || {},
          status: status.hasKey ? 'configured' : 'not_configured',
          error: status.error
        };
      }
      
      return {
        success: true,
        providers: providersStatus
      };
    } catch (error) {
      console.error('Ошибка проверки статуса провайдеров:', error);
      return {
        success: false,
        error: error.message,
        providers: {}
      };
    }
  }
  
  /**
   * Тестировать соединение с провайдером
   * @param {string} providerId - ID провайдера
   * @param {string} apiKey - API ключ для тестирования
   * @returns {Promise<Object>}
   */
  async testProviderConnection(providerId, apiKey) {
    try {
      console.log(`Тестирование соединения с провайдером: ${providerId}`);
      
      const provider = this.providers[providerId];
      if (!provider) {
        throw new Error(`Неизвестный провайдер: ${providerId}`);
      }
      
      // Устанавливаем API ключ в провайдер
      provider.setApiKey(apiKey);
      
      const result = await provider.testConnection(apiKey);
      
      if (result.success) {
        console.log(`Соединение с ${providerId} успешно установлено`);
      } else {
        console.warn(`Ошибка соединения с ${providerId}:`, result.error);
      }
      
      return result;
    } catch (error) {
      console.error(`Ошибка тестирования ${providerId}:`, error);
      return {
        success: false,
        error: error.message || `Ошибка соединения с ${providerId}`
      };
    }
  }
  
  /**
   * Загрузить доступные модели для провайдера
   * @param {string} providerId - ID провайдера
   * @param {boolean} forceRefresh - Принудительное обновление, игнорируя кэш
   * @returns {Promise<Array>}
   */
  async loadProviderModels(providerId, forceRefresh = false) {
    try {
      console.log(`Загрузка моделей для провайдера: ${providerId}${forceRefresh ? ' (принудительное обновление)' : ''}`);
      
      const provider = this.providers[providerId];
      if (!provider) {
        throw new Error(`Неизвестный провайдер: ${providerId}`);
      }
      
      // Получаем API ключ
      const keyResult = await CredentialsService.getAPIKey(providerId);
      if (!keyResult.success || !keyResult.apiKey) {
        throw new Error(`API ключ для ${providerId} не найден`);
      }
      
      // Устанавливаем API ключ в провайдер
      provider.setApiKey(keyResult.apiKey);
      
      // Получаем модели с учетом флага принудительного обновления
      const models = await provider.getAvailableModels(keyResult.apiKey, forceRefresh);
      
      // Сохраняем в локальный кэш сервиса
      if (models && models.length > 0) {
        this.loadedModels.set(providerId, models);
      }
      
      console.log(`Загружено ${models.length} моделей для ${providerId}`);
      
      return {
        success: true,
        models: models
      };
    } catch (error) {
      console.error(`Ошибка загрузки моделей для ${providerId}:`, error);
      return {
        success: false,
        error: error.message,
        models: []
      };
    }
  }
  
  /**
   * Загрузить модели для всех настроенных провайдеров
   * @returns {Promise<Object>}
   */
  async loadAllAvailableModels() {
    try {
      console.log('Загрузка моделей для всех провайдеров');
      
      const statusResult = await this.checkProvidersStatus();
      if (!statusResult.success) {
        throw new Error('Ошибка проверки статуса провайдеров');
      }
      
      const allModels = {};
      const errors = {};
      
      for (const [providerId, status] of Object.entries(statusResult.providers)) {
        if (status.hasKey && status.status === 'configured') {
          try {
            const modelsResult = await this.loadProviderModels(providerId);
            if (modelsResult.success) {
              allModels[providerId] = modelsResult.models;
              // Сохраняем в кэш
              this.loadedModels.set(providerId, modelsResult.models);
            } else {
              errors[providerId] = modelsResult.error;
            }
          } catch (error) {
            errors[providerId] = error.message;
          }
        }
      }
      
      return {
        success: true,
        models: allModels,
        errors: errors
      };
    } catch (error) {
      console.error('Ошибка загрузки всех моделей:', error);
      return {
        success: false,
        error: error.message,
        models: {},
        errors: {}
      };
    }
  }
  
  /**
   * Получить загруженные модели для провайдера из кэша
   * @param {string} providerId - ID провайдера
   * @returns {Array}
   */
  getCachedModels(providerId) {
    return this.loadedModels.get(providerId) || [];
  }
  
  /**
   * Получить все загруженные модели из кэша
   * @returns {Object}
   */
  getAllCachedModels() {
    const models = {};
    for (const [providerId, providerModels] of this.loadedModels) {
      models[providerId] = providerModels;
    }
    return models;
  }
  
  /**
   * Обновить модели для конкретного провайдера
   * @param {string} providerId - ID провайдера
   * @returns {Promise<Object>}
   */
  async refreshProviderModels(providerId) {
    try {
      console.log(`Обновление моделей для провайдера: ${providerId}`);
      
      const result = await this.loadProviderModels(providerId);
      if (result.success) {
        this.loadedModels.set(providerId, result.models);
      }
      
      return result;
    } catch (error) {
      console.error(`Ошибка обновления моделей для ${providerId}:`, error);
      return {
        success: false,
        error: error.message,
        models: []
      };
    }
  }
  
  /**
   * Отправить запрос к AI модели
   * @param {string} prompt - Текст промпта
   * @param {Object} modelConfig - Конфигурация модели
   * @param {Object} options - Дополнительные опции
   * @returns {Promise<Object>}
   */
  async sendRequest(prompt, modelConfig, options = {}) {
    try {
      console.log('Отправка запроса к AI:', { 
        model: modelConfig.modelId, 
        provider: modelConfig.provider,
        promptLength: prompt.length 
      });
      
      const provider = this.providers[modelConfig.provider];
      if (!provider) {
        throw new Error(`Неизвестный провайдер: ${modelConfig.provider}`);
      }
      
      // Получаем API ключ
      const keyResult = await CredentialsService.getAPIKey(modelConfig.provider);
      if (!keyResult.success || !keyResult.apiKey) {
        throw new Error(`API ключ для ${modelConfig.provider} не найден`);
      }
      
      // Подготавливаем опции запроса
      const requestOptions = {
        model: modelConfig.modelId,
        temperature: modelConfig.temperature ?? 0.7,
        maxTokens: modelConfig.maxTokens ?? 4000,
        systemPrompt: options.systemPrompt,
        stream: options.stream || false,
        ...options
      };
      
      const startTime = Date.now();
      
      // Устанавливаем API ключ в провайдер
      provider.setApiKey(keyResult.apiKey);
      
      // Выполняем запрос
      const result = await provider.sendRequest(prompt, requestOptions);
      
      const duration = Date.now() - startTime;
      
      if (result.success) {
        // Обогащаем ответ информацией о конфигурации
        result.modelConfig = {
          id: modelConfig.id,
          name: modelConfig.name || modelConfig.customName,
          provider: modelConfig.provider,
          modelId: modelConfig.modelId
        };
        
        result.metadata.requestDuration = duration;
        
        console.log('AI запрос выполнен успешно:', {
          provider: modelConfig.provider,
          model: modelConfig.modelId,
          duration: duration,
          tokens: result.usage.totalTokens
        });
      }
      
      return result;
    } catch (error) {
      console.error('Ошибка AI запроса:', error);
      return {
        success: false,
        error: error.message || 'Неизвестная ошибка AI запроса',
        provider: modelConfig.provider,
        model: modelConfig.modelId
      };
    }
  }
  
  /**
   * Добавить конфигурацию модели
   * @param {Object} modelConfig - Конфигурация модели
   * @returns {Object}
   */
  addModelConfig(modelConfig) {
    try {
      const configId = this.generateConfigId();
      const config = {
        id: configId,
        provider: modelConfig.provider,
        modelId: modelConfig.modelId,
        name: modelConfig.name,
        customName: modelConfig.customName || modelConfig.name,
        temperature: modelConfig.temperature ?? 0.7,
        maxTokens: modelConfig.maxTokens ?? 4000,
        isDefault: modelConfig.isDefault || false,
        created: new Date().toISOString(),
        ...modelConfig
      };
      
      this.modelConfigs.set(configId, config);
      this.activeModels.push(config);
      
      console.log('Добавлена конфигурация модели:', config);
      
      return {
        success: true,
        config: config
      };
    } catch (error) {
      console.error('Ошибка добавления конфигурации модели:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Обновить конфигурацию модели
   * @param {string} configId - ID конфигурации
   * @param {Object} updates - Обновления
   * @returns {Object}
   */
  updateModelConfig(configId, updates) {
    try {
      const config = this.modelConfigs.get(configId);
      if (!config) {
        throw new Error('Конфигурация модели не найдена');
      }
      
      const updatedConfig = {
        ...config,
        ...updates,
        updated: new Date().toISOString()
      };
      
      this.modelConfigs.set(configId, updatedConfig);
      
      // Обновляем в списке активных моделей
      const index = this.activeModels.findIndex(m => m.id === configId);
      if (index !== -1) {
        this.activeModels[index] = updatedConfig;
      }
      
      console.log('Обновлена конфигурация модели:', updatedConfig);
      
      return {
        success: true,
        config: updatedConfig
      };
    } catch (error) {
      console.error('Ошибка обновления конфигурации модели:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Удалить конфигурацию модели
   * @param {string} configId - ID конфигурации
   * @returns {Object}
   */
  removeModelConfig(configId) {
    try {
      const config = this.modelConfigs.get(configId);
      if (!config) {
        throw new Error('Конфигурация модели не найдена');
      }
      
      this.modelConfigs.delete(configId);
      this.activeModels = this.activeModels.filter(m => m.id !== configId);
      
      console.log('Удалена конфигурация модели:', configId);
      
      return {
        success: true,
        removedConfig: config
      };
    } catch (error) {
      console.error('Ошибка удаления конфигурации модели:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Получить все активные конфигурации моделей
   * @returns {Array}
   */
  getActiveModelConfigs() {
    return [...this.activeModels];
  }
  
  /**
   * Получить конфигурацию модели по умолчанию
   * @returns {Object|null}
   */
  getDefaultModelConfig() {
    return this.activeModels.find(config => config.isDefault) || this.activeModels[0] || null;
  }
  
  /**
   * Установить модель по умолчанию
   * @param {string} configId - ID конфигурации
   * @returns {Object}
   */
  setDefaultModel(configId) {
    try {
      // Убираем флаг default со всех моделей
      this.activeModels.forEach(config => {
        config.isDefault = false;
        this.modelConfigs.set(config.id, config);
      });
      
      // Устанавливаем новую модель по умолчанию
      const config = this.modelConfigs.get(configId);
      if (!config) {
        throw new Error('Конфигурация модели не найдена');
      }
      
      config.isDefault = true;
      this.modelConfigs.set(configId, config);
      
      const index = this.activeModels.findIndex(m => m.id === configId);
      if (index !== -1) {
        this.activeModels[index] = config;
      }
      
      console.log('Установлена модель по умолчанию:', config.customName);
      
      return {
        success: true,
        defaultConfig: config
      };
    } catch (error) {
      console.error('Ошибка установки модели по умолчанию:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Генерация уникального ID для конфигурации
   * @returns {string}
   */
  generateConfigId() {
    return 'config_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * Получить статистику использования AI
   * @returns {Object}
   */
  getUsageStats() {
    const stats = {
      totalConfigs: this.activeModels.length,
      providerStats: {},
      defaultModel: this.getDefaultModelConfig()?.customName || 'Не установлена'
    };
    
    // Подсчитываем статистику по провайдерам
    this.activeModels.forEach(config => {
      if (!stats.providerStats[config.provider]) {
        stats.providerStats[config.provider] = {
          count: 0,
          models: []
        };
      }
      
      stats.providerStats[config.provider].count++;
      stats.providerStats[config.provider].models.push(config.customName);
    });
    
    return stats;
  }
}

// Экспортируем синглтон
const aiService = new AIService();
export default aiService;