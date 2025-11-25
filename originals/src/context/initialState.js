// src/context/initialState.js
console.log('Инициализация начального состояния приложения');

const initialState = {
  activeContextBlock: 0,
  activePromptBlock: 0,
  activeTab: 'context',
  contextBlocks: [],
  promptBlocks: [],
  projectName: 'New Project',
  projectPath: null,
  currentTemplateFilename: null,
  createdAt: null,
  updatedAt: null,
  notification: {
    visible: false,
    message: '',
    type: 'info',
    timestamp: null
  },

  // Отдельные директории для разных типов файлов
  templateFolder: '/templates',         // Папка для .txt шаблонов промптов
  projectFolder: '/projects',           // Папка для сохранения проектов
  contextDataFolder: '/context_data',    // Папка для блоков контекста
  
  // AI интеграция
  aiConfig: {
    providers: {
      openai: { 
        id: 'openai',
        name: 'OpenAI', 
        hasKey: false, 
        status: 'not_configured', // not_configured | checking | active | error
        availableModels: [],
        lastChecked: null,
        error: null
      },
      anthropic: { 
        id: 'anthropic',
        name: 'Anthropic', 
        hasKey: false, 
        status: 'not_configured',
        availableModels: [],
        lastChecked: null,
        error: null
      },
      openrouter: { 
        id: 'openrouter',
        name: 'OpenRouter', 
        hasKey: false, 
        status: 'not_configured',
        availableModels: [],
        lastChecked: null,
        error: null
      },
      gemini: { 
        id: 'gemini',
        name: 'Google Gemini', 
        hasKey: false, 
        status: 'not_configured',
        availableModels: [],
        lastChecked: null,
        error: null
      },
      grok: { 
        id: 'grok',
        name: 'X.AI Grok', 
        hasKey: false, 
        status: 'not_configured',
        availableModels: [],
        lastChecked: null,
        error: null
      }
    },
    selectedModels: [], // Массив конфигураций выбранных моделей
    currentModelId: null, // ID текущей активной модели
    availableModels: {}, // Кэш загруженных моделей по провайдерам
    globalSettings: {
      timeout: 60000,
      retryCount: 3,
      streamingEnabled: true,
      autoSave: true
    }
  }
};

export default initialState;