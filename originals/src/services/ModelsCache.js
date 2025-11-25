// src/services/ModelsCache.js - Сервис кэширования списков моделей AI
// @description: Управление кэшированием списков моделей для всех AI провайдеров
// @created: 2025-06-25 - создан для динамического получения списков моделей

/**
 * Сервис управления кэшем моделей AI провайдеров
 * Обеспечивает централизованное хранение и обновление списков моделей
 */
class ModelsCache {
  constructor() {
    this.cachePrefix = 'ai_models_cache_';
    this.cacheExpirationTime = 24 * 60 * 60 * 1000; // 24 часа по умолчанию
    this.localStorageAvailable = this.checkLocalStorageAvailable();
  }
  
  /**
   * Проверка доступности localStorage
   * @returns {boolean}
   */
  checkLocalStorageAvailable() {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('localStorage недоступен:', error);
      return false;
    }
  }
  
  /**
   * Получение кэшированных моделей
   * @param {string} provider - Имя провайдера
   * @param {number} maxAge - Максимальный возраст кэша в миллисекундах
   * @returns {Object|null} - { timestamp, models } или null
   */
  getCache(provider, maxAge = null) {
    if (!this.localStorageAvailable) return null;
    
    try {
      const key = `${this.cachePrefix}${provider}`;
      const cacheStr = localStorage.getItem(key);
      
      if (!cacheStr) return null;
      
      const cache = JSON.parse(cacheStr);
      
      // Проверяем возраст кэша
      const age = Date.now() - cache.timestamp;
      const maxAgeToCheck = maxAge || this.cacheExpirationTime;
      
      if (age > maxAgeToCheck) {
        // Кэш устарел
        this.removeCache(provider);
        return null;
      }
      
      return cache;
    } catch (error) {
      console.error(`Ошибка чтения кэша для ${provider}:`, error);
      return null;
    }
  }
  
  /**
   * Сохранение моделей в кэш
   * @param {string} provider - Имя провайдера
   * @param {Array} models - Список моделей
   * @param {Object} metadata - Дополнительные метаданные
   */
  setCache(provider, models, metadata = {}) {
    if (!this.localStorageAvailable) return false;
    
    try {
      const key = `${this.cachePrefix}${provider}`;
      const cache = {
        timestamp: Date.now(),
        provider: provider,
        models: models,
        count: models.length,
        ...metadata
      };
      
      localStorage.setItem(key, JSON.stringify(cache));
      
      // Также сохраняем время последнего обновления
      this.setLastUpdateTime(provider);
      
      return true;
    } catch (error) {
      console.error(`Ошибка сохранения кэша для ${provider}:`, error);
      
      // Если ошибка из-за переполнения localStorage, очищаем старые кэши
      if (error.name === 'QuotaExceededError') {
        this.cleanupOldCaches();
        
        // Пробуем еще раз
        try {
          localStorage.setItem(key, JSON.stringify(cache));
          return true;
        } catch (retryError) {
          console.error('Повторная ошибка после очистки:', retryError);
        }
      }
      
      return false;
    }
  }
  
  /**
   * Удаление кэша провайдера
   * @param {string} provider - Имя провайдера
   */
  removeCache(provider) {
    if (!this.localStorageAvailable) return;
    
    try {
      const key = `${this.cachePrefix}${provider}`;
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_last_update`);
    } catch (error) {
      console.error(`Ошибка удаления кэша для ${provider}:`, error);
    }
  }
  
  /**
   * Очистка старых кэшей всех провайдеров
   * @param {number} maxAge - Максимальный возраст в миллисекундах (по умолчанию 7 дней)
   */
  cleanupOldCaches(maxAge = 7 * 24 * 60 * 60 * 1000) {
    if (!this.localStorageAvailable) return;
    
    try {
      const keysToRemove = [];
      
      // Находим все ключи кэша
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.cachePrefix)) {
          try {
            const cacheStr = localStorage.getItem(key);
            const cache = JSON.parse(cacheStr);
            
            const age = Date.now() - cache.timestamp;
            if (age > maxAge) {
              keysToRemove.push(key);
            }
          } catch (error) {
            // Если не удается разобрать кэш, удаляем его
            keysToRemove.push(key);
          }
        }
      }
      
      // Удаляем старые кэши
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log(`Очищено ${keysToRemove.length} устаревших кэшей`);
    } catch (error) {
      console.error('Ошибка очистки старых кэшей:', error);
    }
  }
  
  /**
   * Получение времени последнего обновления
   * @param {string} provider - Имя провайдера
   * @returns {number|null} - Timestamp последнего обновления
   */
  getLastUpdateTime(provider) {
    if (!this.localStorageAvailable) return null;
    
    try {
      const key = `${this.cachePrefix}${provider}_last_update`;
      const timeStr = localStorage.getItem(key);
      return timeStr ? parseInt(timeStr, 10) : null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Установка времени последнего обновления
   * @param {string} provider - Имя провайдера
   */
  setLastUpdateTime(provider) {
    if (!this.localStorageAvailable) return;
    
    try {
      const key = `${this.cachePrefix}${provider}_last_update`;
      localStorage.setItem(key, Date.now().toString());
    } catch (error) {
      console.error(`Ошибка сохранения времени обновления для ${provider}:`, error);
    }
  }
  
  /**
   * Проверка необходимости обновления кэша
   * @param {string} provider - Имя провайдера
   * @param {number} updateInterval - Интервал обновления в миллисекундах
   * @returns {boolean}
   */
  needsUpdate(provider, updateInterval = null) {
    const interval = updateInterval || this.cacheExpirationTime;
    const lastUpdate = this.getLastUpdateTime(provider);
    
    if (!lastUpdate) return true;
    
    const timeSinceUpdate = Date.now() - lastUpdate;
    return timeSinceUpdate > interval;
  }
  
  /**
   * Получение статистики кэша
   * @returns {Object} - Статистика по всем провайдерам
   */
  getCacheStats() {
    const stats = {
      providers: {},
      totalSize: 0,
      totalModels: 0
    };
    
    if (!this.localStorageAvailable) return stats;
    
    try {
      const providers = ['anthropic', 'openai', 'gemini', 'openrouter', 'grok'];
      
      providers.forEach(provider => {
        const cache = this.getCache(provider, Infinity); // Получаем даже устаревшие
        if (cache) {
          const cacheStr = localStorage.getItem(`${this.cachePrefix}${provider}`);
          const size = cacheStr ? cacheStr.length : 0;
          
          stats.providers[provider] = {
            timestamp: cache.timestamp,
            age: Date.now() - cache.timestamp,
            modelCount: cache.models.length,
            size: size,
            isExpired: Date.now() - cache.timestamp > this.cacheExpirationTime
          };
          
          stats.totalSize += size;
          stats.totalModels += cache.models.length;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Ошибка получения статистики кэша:', error);
      return stats;
    }
  }
  
  /**
   * Экспорт всех кэшей в JSON
   * @returns {Object} - Все кэши
   */
  exportAllCaches() {
    const exports = {};
    
    if (!this.localStorageAvailable) return exports;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.cachePrefix)) {
          const value = localStorage.getItem(key);
          exports[key] = JSON.parse(value);
        }
      }
      
      return exports;
    } catch (error) {
      console.error('Ошибка экспорта кэшей:', error);
      return exports;
    }
  }
  
  /**
   * Импорт кэшей из JSON
   * @param {Object} data - Данные для импорта
   */
  importCaches(data) {
    if (!this.localStorageAvailable || !data) return false;
    
    try {
      Object.entries(data).forEach(([key, value]) => {
        if (key.startsWith(this.cachePrefix)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });
      
      return true;
    } catch (error) {
      console.error('Ошибка импорта кэшей:', error);
      return false;
    }
  }
}

// Создаем единственный экземпляр сервиса
const modelsCache = new ModelsCache();

export default modelsCache;