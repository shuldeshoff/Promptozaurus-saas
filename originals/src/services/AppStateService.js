// src/services/AppStateService.js - Сервис для сохранения и восстановления состояния приложения
// @description: Управляет сохранением состояния приложения между сессиями, включая последний открытый проект и UI настройки
// @created: 2025-06-25

// AppStateService использует window.electronAPI напрямую для работы с файлами

const STATE_FILE_NAME = 'app-state.json';

class AppStateService {
  constructor() {
    this.stateFilePath = null;
    this.defaultState = {
      lastProjectPath: null,
      lastOpenedAt: null,
      activeTab: 'context',
      activeContextBlockId: null,
      activePromptBlockId: null,
      windowBounds: null,
      projectFolder: null,
      projectTemplateFolder: null,
      contextDataFolder: null,
      templateFolder: null,
      uiState: {
        sidebarWidth: null,
        editorSplitPosition: null
      }
    };
  }

  // Инициализация пути к файлу состояния
  async initialize() {
    try {
      // Получаем путь к папке приложения
      const appDataPath = await window.electronAPI.getAppDataPath();
      this.stateFilePath = `${appDataPath}/prompt-constructor/${STATE_FILE_NAME}`;
      console.log('Путь к файлу состояния:', this.stateFilePath);
      
      // Создаем директорию если её нет
      const dirPath = this.stateFilePath.substring(0, this.stateFilePath.lastIndexOf('/'));
      await window.electronAPI.ensureDirectory(dirPath);
      
      return true;
    } catch (error) {
      console.error('Ошибка инициализации AppStateService:', error);
      return false;
    }
  }

  // Загрузка состояния приложения
  async loadAppState() {
    try {
      if (!this.stateFilePath) {
        await this.initialize();
      }

      console.log('Загрузка состояния приложения из:', this.stateFilePath);
      const exists = await window.electronAPI.fileExists(this.stateFilePath);
      
      if (!exists) {
        console.log('Файл состояния не найден, используем значения по умолчанию');
        return this.defaultState;
      }

      const stateData = await window.electronAPI.readFile(this.stateFilePath);
      const state = JSON.parse(stateData);
      
      console.log('Состояние приложения загружено:', {
        lastProjectPath: state.lastProjectPath,
        lastOpenedAt: state.lastOpenedAt,
        activeTab: state.activeTab
      });
      
      return { ...this.defaultState, ...state };
    } catch (error) {
      console.error('Ошибка при загрузке состояния приложения:', error);
      return this.defaultState;
    }
  }

  // Сохранение состояния приложения
  async saveAppState(state) {
    try {
      if (!this.stateFilePath) {
        await this.initialize();
      }

      const stateToSave = {
        ...state,
        lastSavedAt: new Date().toISOString()
      };

      console.log('Сохранение состояния приложения:', {
        lastProjectPath: stateToSave.lastProjectPath,
        activeTab: stateToSave.activeTab
      });

      await window.electronAPI.writeFile(this.stateFilePath, JSON.stringify(stateToSave, null, 2));
      console.log('Состояние приложения сохранено');
      
      return true;
    } catch (error) {
      console.error('Ошибка при сохранении состояния приложения:', error);
      return false;
    }
  }

  // Обновление отдельных полей состояния
  async updateAppState(updates) {
    try {
      const currentState = await this.loadAppState();
      const newState = { ...currentState, ...updates };
      return await this.saveAppState(newState);
    } catch (error) {
      console.error('Ошибка при обновлении состояния приложения:', error);
      return false;
    }
  }

  // Сохранение пути последнего проекта
  async saveLastProjectPath(projectPath) {
    return await this.updateAppState({
      lastProjectPath: projectPath,
      lastOpenedAt: new Date().toISOString()
    });
  }

  // Очистка состояния
  async clearAppState() {
    try {
      if (!this.stateFilePath) {
        await this.initialize();
      }

      const exists = await window.electronAPI.fileExists(this.stateFilePath);
      if (exists) {
        await window.electronAPI.deleteFile(this.stateFilePath);
        console.log('Состояние приложения очищено');
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при очистке состояния приложения:', error);
      return false;
    }
  }

  // Сохранение UI состояния
  async saveUIState(uiState) {
    return await this.updateAppState({ uiState });
  }

  // Сохранение активных элементов
  async saveActiveElements(activeTab, activeContextBlockId, activePromptBlockId) {
    return await this.updateAppState({
      activeTab,
      activeContextBlockId,
      activePromptBlockId
    });
  }

  // Сохранение путей к папкам
  async saveFolderPaths(folders) {
    return await this.updateAppState({
      projectFolder: folders.projectFolder,
      projectTemplateFolder: folders.projectTemplateFolder,
      contextDataFolder: folders.contextDataFolder,
      templateFolder: folders.templateFolder
    });
  }
}

// Экспортируем единственный экземпляр сервиса
export default new AppStateService();