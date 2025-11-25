// src/services/ai/BaseProvider.js - Базовый класс для AI провайдеров
// @description: Абстрактный базовый класс определяющий интерфейс для всех AI провайдеров
// @created: 2025-06-25 - архитектурная основа для провайдеров ИИ

/**
 * Базовый абстрактный класс для всех AI провайдеров
 * Определяет единый интерфейс для работы с различными AI API
 */
class BaseProvider {
  constructor(name, baseUrl, config = {}) {
    if (this.constructor === BaseProvider) {
      throw new Error('BaseProvider не может быть инстанцирован напрямую');
    }
    
    this.name = name;
    this.baseUrl = baseUrl;
    this.config = {
      timeout: 60000,
      retryCount: 3,
      maxTokens: 4000,
      temperature: 0.7,
      ...config
    };
    this.apiKey = null; // Храним API ключ
    
    console.log(`Инициализация провайдера: ${this.name}`);
  }
  
  /**
   * Установить API ключ для провайдера
   * @param {string} apiKey - API ключ
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    console.log(`API ключ установлен для провайдера ${this.name}`);
  }
  
  /**
   * Абстрактный метод для отправки запроса к AI
   * Должен быть реализован в каждом провайдере
   * @param {string} prompt - Текст промпта
   * @param {Object} options - Настройки запроса
   * @returns {Promise<Object>}
   */
  async sendRequest(prompt, options = {}) {
    throw new Error('Метод sendRequest должен быть реализован в наследуемом классе');
  }
  
  /**
   * Абстрактный метод для получения списка доступных моделей
   * @param {string} apiKey - API ключ
   * @returns {Promise<Array>}
   */
  async getAvailableModels(apiKey) {
    throw new Error('Метод getAvailableModels должен быть реализован в наследуемом классе');
  }
  
  /**
   * Абстрактный метод для тестирования соединения
   * @param {string} apiKey - API ключ
   * @returns {Promise<Object>}
   */
  async testConnection(apiKey) {
    throw new Error('Метод testConnection должен быть реализован в наследуемом классе');
  }
  
  /**
   * Общий метод для выполнения HTTP запросов
   * @param {string} url - URL для запроса
   * @param {Object} options - Опции fetch запроса
   * @returns {Promise<Object>}
   */
  async makeHttpRequest(url, options = {}) {
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'prompt-constructor/1.0.0',
        ...options.headers
      },
      timeout: this.config.timeout,
      ...options
    };
    
    try {
      console.log(`Выполнение HTTP запроса к ${url}`);
      
      // Используем Electron main процесс для HTTP запросов (безопасность)
      const result = await window.electronAPI.invoke('http-request', {
        url,
        options: defaultOptions
      });
      
      if (!result.success) {
        throw new Error(result.error || 'HTTP запрос завершился ошибкой');
      }
      
      return result.data;
    } catch (error) {
      console.error(`Ошибка HTTP запроса к ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * Обработка ошибок API
   * @param {Error} error - Ошибка для обработки
   * @param {string} context - Контекст в котором произошла ошибка
   * @returns {Object}
   */
  handleError(error, context = 'API запрос') {
    console.error(`Ошибка ${this.name} (${context}):`, error);
    
    // Определяем тип ошибки и возвращаем понятное сообщение
    if (error.message.includes('401')) {
      return {
        success: false,
        error: 'Неверный API ключ',
        type: 'authentication'
      };
    } else if (error.message.includes('403')) {
      return {
        success: false,
        error: 'Доступ запрещен - проверьте права API ключа',
        type: 'authorization'
      };
    } else if (error.message.includes('429')) {
      return {
        success: false,
        error: 'Превышен лимит запросов - попробуйте позже',
        type: 'rate_limit'
      };
    } else if (error.message.includes('timeout')) {
      return {
        success: false,
        error: 'Таймаут запроса - проверьте интернет соединение',
        type: 'timeout'
      };
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Ошибка сети - проверьте интернет соединение',
        type: 'network'
      };
    } else {
      return {
        success: false,
        error: error.message || 'Неизвестная ошибка API',
        type: 'unknown'
      };
    }
  }
  
  /**
   * Валидация промпта перед отправкой
   * @param {string} prompt - Промпт для валидации
   * @returns {Object}
   */
  validatePrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      return {
        valid: false,
        error: 'Промпт должен быть непустой строкой'
      };
    }
    
    const trimmedPrompt = prompt.trim();
    
    if (trimmedPrompt.length === 0) {
      return {
        valid: false,
        error: 'Промпт не может быть пустым'
      };
    }
    
    if (trimmedPrompt.length > 100000) {
      return {
        valid: false,
        error: 'Промпт слишком длинный (максимум 100,000 символов)'
      };
    }
    
    return {
      valid: true,
      prompt: trimmedPrompt
    };
  }
  
  /**
   * Форматирование ответа от AI в единый формат
   * @param {Object} rawResponse - Сырой ответ от API
   * @param {Object} metadata - Метаданные запроса
   * @returns {Object}
   */
  formatResponse(rawResponse, metadata = {}) {
    return {
      success: true,
      content: rawResponse.content || rawResponse.text || '',
      provider: this.name,
      model: metadata.model || 'unknown',
      usage: {
        inputTokens: rawResponse.usage?.prompt_tokens || 0,
        outputTokens: rawResponse.usage?.completion_tokens || 0,
        totalTokens: rawResponse.usage?.total_tokens || 0
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: metadata.duration || 0,
        finishReason: rawResponse.finish_reason || 'unknown',
        ...metadata
      }
    };
  }
  
  /**
   * Получение информации о провайдере
   * @returns {Object}
   */
  getProviderInfo() {
    return {
      name: this.name,
      baseUrl: this.baseUrl,
      config: { ...this.config },
      capabilities: {
        streaming: false,
        functions: false,
        vision: false,
        ...this.getCapabilities()
      }
    };
  }
  
  /**
   * Абстрактный метод для получения возможностей провайдера
   * Должен быть переопределен в наследуемых классах
   * @returns {Object}
   */
  getCapabilities() {
    return {};
  }
  
  /**
   * Абстрактный метод для получения списка доступных моделей
   * Должен быть переопределен в наследуемых классах
   * @param {string} apiKey - API ключ
   * @param {boolean} forceRefresh - Принудительное обновление
   * @returns {Promise<Array>}
   */
  async getAvailableModels(apiKey, forceRefresh = false) {
    throw new Error('Метод getAvailableModels должен быть реализован в наследуемом классе');
  }
  
  /**
   * Логирование активности провайдера
   * @param {string} action - Выполняемое действие
   * @param {Object} details - Детали действия
   */
  logActivity(action, details = {}) {
    const logEntry = {
      provider: this.name,
      action,
      timestamp: new Date().toISOString(),
      ...details
    };
    
    console.log(`[${this.name}] ${action}:`, logEntry);
  }
}

export default BaseProvider;