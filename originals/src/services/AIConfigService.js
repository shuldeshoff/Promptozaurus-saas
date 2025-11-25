// src/services/AIConfigService.js - Сервис для сохранения и загрузки конфигурации ИИ
// @description: Управляет постоянным хранением настроек ИИ провайдеров и моделей в файловой системе
// @created: 2025-06-25

import FileService from './FileService';

const CONFIG_FILENAME = 'ai-config.json';
const CONFIG_VERSION = '1.0';

class AIConfigService {
  /**
   * Получает путь к файлу конфигурации
   * @returns {Promise<string>} Путь к файлу конфигурации
   */
  static async getConfigPath() {
    try {
      // Получаем путь к директории данных приложения
      const userDataPath = await window.electronAPI.getUserDataPath();
      return `${userDataPath}/${CONFIG_FILENAME}`;
    } catch (error) {
      console.error('Ошибка получения пути к конфигурации:', error);
      throw error;
    }
  }

  /**
   * Сохраняет конфигурацию ИИ в файл
   * @param {Object} aiConfig - Объект конфигурации ИИ из состояния
   * @returns {Promise<boolean>} Успешность сохранения
   */
  static async saveConfig(aiConfig) {
    try {
      const configPath = await this.getConfigPath();
      
      // Подготавливаем данные для сохранения
      const configData = {
        version: CONFIG_VERSION,
        lastUpdated: new Date().toISOString(),
        selectedModels: aiConfig.selectedModels || [],
        currentModelId: aiConfig.currentModelId,
        globalSettings: aiConfig.globalSettings || {
          timeout: 60000,
          retryCount: 3,
          streamingEnabled: true,
          autoSave: true
        },
        // Сохраняем информацию о провайдерах (кроме ключей)
        providers: {}
      };

      // Копируем информацию о провайдерах без чувствительных данных
      Object.keys(aiConfig.providers || {}).forEach(providerId => {
        const provider = aiConfig.providers[providerId];
        configData.providers[providerId] = {
          id: provider.id,
          name: provider.name,
          hasKey: provider.hasKey,
          status: provider.status,
          availableModels: provider.availableModels || [],
          lastChecked: provider.lastChecked,
          // Не сохраняем error для безопасности
        };
      });

      // Сохраняем в файл
      const success = await FileService.writeFile(configPath, JSON.stringify(configData, null, 2));
      
      if (success) {
        console.log('Конфигурация ИИ сохранена:', configPath);
      }
      
      return success;
    } catch (error) {
      console.error('Ошибка сохранения конфигурации ИИ:', error);
      return false;
    }
  }

  /**
   * Загружает конфигурацию ИИ из файла
   * @returns {Promise<Object|null>} Объект конфигурации или null
   */
  static async loadConfig() {
    try {
      const configPath = await this.getConfigPath();
      
      // Проверяем существование файла
      const exists = await FileService.fileExists(configPath);
      if (!exists) {
        console.log('Файл конфигурации ИИ не найден');
        return null;
      }

      // Читаем файл
      const configContent = await FileService.readFile(configPath);
      if (!configContent) {
        console.warn('Файл конфигурации ИИ пуст');
        return null;
      }

      // Парсим JSON
      const configData = JSON.parse(configContent);
      
      // Проверяем версию
      if (configData.version !== CONFIG_VERSION) {
        console.warn(`Версия конфигурации (${configData.version}) не совпадает с текущей (${CONFIG_VERSION})`);
        // В будущем здесь можно добавить миграцию
      }

      console.log('Конфигурация ИИ загружена:', {
        lastUpdated: configData.lastUpdated,
        modelsCount: configData.selectedModels?.length || 0,
        currentModelId: configData.currentModelId
      });

      return configData;
    } catch (error) {
      console.error('Ошибка загрузки конфигурации ИИ:', error);
      return null;
    }
  }

  /**
   * Удаляет файл конфигурации
   * @returns {Promise<boolean>} Успешность удаления
   */
  static async deleteConfig() {
    try {
      const configPath = await this.getConfigPath();
      const exists = await FileService.fileExists(configPath);
      
      if (!exists) {
        return true; // Файла нет, считаем что удаление успешно
      }

      // Здесь должен быть вызов удаления файла через FileService
      // Пока FileService не поддерживает удаление, просто перезаписываем пустым объектом
      const success = await FileService.writeFile(configPath, '{}');
      
      if (success) {
        console.log('Конфигурация ИИ удалена');
      }
      
      return success;
    } catch (error) {
      console.error('Ошибка удаления конфигурации ИИ:', error);
      return false;
    }
  }

  /**
   * Экспортирует конфигурацию в указанный файл
   * @param {string} exportPath - Путь для экспорта
   * @param {Object} aiConfig - Объект конфигурации
   * @returns {Promise<boolean>} Успешность экспорта
   */
  static async exportConfig(exportPath, aiConfig) {
    try {
      // Используем тот же формат что и для сохранения
      const configData = {
        version: CONFIG_VERSION,
        exported: new Date().toISOString(),
        selectedModels: aiConfig.selectedModels || [],
        currentModelId: aiConfig.currentModelId,
        globalSettings: aiConfig.globalSettings || {},
        providers: {}
      };

      // Копируем информацию о провайдерах
      Object.keys(aiConfig.providers || {}).forEach(providerId => {
        const provider = aiConfig.providers[providerId];
        configData.providers[providerId] = {
          id: provider.id,
          name: provider.name,
          hasKey: provider.hasKey,
          availableModels: provider.availableModels || []
        };
      });

      const success = await FileService.writeFile(exportPath, JSON.stringify(configData, null, 2));
      
      if (success) {
        console.log('Конфигурация ИИ экспортирована:', exportPath);
      }
      
      return success;
    } catch (error) {
      console.error('Ошибка экспорта конфигурации ИИ:', error);
      return false;
    }
  }

  /**
   * Импортирует конфигурацию из файла
   * @param {string} importPath - Путь к файлу для импорта
   * @returns {Promise<Object|null>} Импортированная конфигурация или null
   */
  static async importConfig(importPath) {
    try {
      const configContent = await FileService.readFile(importPath);
      if (!configContent) {
        throw new Error('Файл конфигурации пуст');
      }

      const configData = JSON.parse(configContent);
      
      // Проверяем наличие обязательных полей
      if (!configData.version || !configData.selectedModels) {
        throw new Error('Неверный формат файла конфигурации');
      }

      console.log('Конфигурация ИИ импортирована:', {
        exported: configData.exported,
        modelsCount: configData.selectedModels?.length || 0
      });

      return configData;
    } catch (error) {
      console.error('Ошибка импорта конфигурации ИИ:', error);
      return null;
    }
  }
}

export default AIConfigService;