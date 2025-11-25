// src/context/AppContext.js
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { useConfirmation } from './ConfirmationContext';
import initialState from './initialState';
import appReducer from './reducers/appReducer';
import ActionTypes from './actionTypes';
import {
  getActiveContextBlock,
  getActivePromptBlock,
  getPromptWithContext,
  getSelectedContextsTotalChars
} from './utils/selectors';
import {
  generateDefaultContextBlockName,
  generateDefaultPromptBlockName,
  generateDefaultContextItemName,
  generateDefaultContextSubItemName
} from './utils/nameGenerators';
import ProjectTemplateService from '../services/ProjectTemplateService';
import ProjectService from '../services/ProjectService';
import ContextBlockService from '../services/ContextBlockService';
import TemplateService from '../services/TemplateService';
import AppStateService from '../services/AppStateService';
import AIConfigService from '../services/AIConfigService';

console.log('Initializing main application context');

const AppContext = createContext();

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { openConfirmation } = useConfirmation();
  const isFirstRender = React.useRef(true);
  
  const actions = {
    setActiveTab: (tab) => {
      dispatch({ type: ActionTypes.SET_ACTIVE_TAB, payload: tab });
    },
    setActiveContextBlock: (id) => {
      dispatch({ type: ActionTypes.SET_ACTIVE_CONTEXT_BLOCK, payload: id });
    },
    setActivePromptBlock: (id) => {
      dispatch({ type: ActionTypes.SET_ACTIVE_TAB, payload: 'prompt' });
      dispatch({ type: ActionTypes.SET_ACTIVE_PROMPT_BLOCK, payload: id });
    },
    scrollToBlock: (blockType, blockId) => {
      try {
        const selector = `div[data-block-type="${blockType}"][data-block-id="${blockId}"]`;
        const blockElement = document.querySelector(selector);
        if (blockElement) {
          // Находим контейнер с прокруткой
          const panelContainer = blockElement.closest('.overflow-y-auto');
          if (panelContainer) {
            // Получаем верхнюю позицию блока
            const blockTop = blockElement.offsetTop;
            
            // Вычисляем высоту верхней панели (примерно 60px для Header + немного отступа)
            const headerOffset = 70;
            
            // Учитываем отступ для лучшей видимости
            const scrollPosition = blockTop - headerOffset;
            
            // Анимированная прокрутка с учетом отступа
            panelContainer.scrollTo({
              top: scrollPosition,
              behavior: 'smooth'
            });
            
            // Добавляем подсветку для привлечения внимания
            blockElement.classList.add('highlight-block');
            setTimeout(() => {
              blockElement.classList.remove('highlight-block');
            }, 1500);
          }
        }
      } catch (error) {
        console.error('Error scrolling to block:', error);
      }
    },
    
    updateContextBlock: (id, data) => {
      dispatch({
        type: ActionTypes.UPDATE_CONTEXT_BLOCK,
        payload: { id, ...data }
      });
    },
    updateContextItem: (blockId, itemId, data) => {
      dispatch({
        type: ActionTypes.UPDATE_CONTEXT_ITEM,
        payload: { blockId, itemId, ...data }
      });
    },
    // Метод для обновления подэлемента
    updateContextSubItem: (blockId, itemId, subItemId, data) => {
      dispatch({
        type: ActionTypes.UPDATE_CONTEXT_SUBITEM,
        payload: { blockId, itemId, subItemId, ...data }
      });
    },
    addContextBlock: (title) => {
      const defaultTitle = title || generateDefaultContextBlockName(state.contextBlocks);
      dispatch({
        type: ActionTypes.ADD_CONTEXT_BLOCK,
        payload: { title: defaultTitle }
      });
    },
    addContextItem: (blockId, title) => {
      const block = state.contextBlocks.find(b => b.id === blockId);
      const defaultTitle = title || generateDefaultContextItemName(block);
      dispatch({
        type: ActionTypes.ADD_CONTEXT_ITEM,
        payload: { blockId, title: defaultTitle }
      });
    },
    // Метод для добавления нескольких подэлементов сразу из блока 
    addMultipleContextItems: (blockId, items) => {
      if (!blockId || !Array.isArray(items) || items.length === 0) {
        console.error('Error: invalid data for addMultipleContextItems');
        return;
      }
      
      dispatch({
        type: ActionTypes.ADD_MULTIPLE_CONTEXT_ITEMS,
        payload: { blockId, items }
      });
      
      // Показываем уведомление
      dispatch({
        type: ActionTypes.SHOW_NOTIFICATION,
        payload: {
          message: `Added ${items.length} new items`,
          type: 'success'
        }
      });
    },


    // Метод для добавления подэлемента с содержимым
    addContextSubItem: (blockId, itemId, title, content = '') => {
      const block = state.contextBlocks.find(b => b.id === blockId);
      if (!block) return;
      
      const item = block.items.find(i => i.id === itemId);
      if (!item) return;
      
      const defaultTitle = title || generateDefaultContextSubItemName(item);
      dispatch({
        type: ActionTypes.ADD_CONTEXT_SUBITEM,
        payload: { blockId, itemId, title: defaultTitle, content, chars: content.length }
      });
    },
    deleteContextBlock: (blockId) => {
      const block = state.contextBlocks.find(b => b.id === blockId);
      if (!block) return;
      openConfirmation(
        'Delete context block',
        `Are you sure you want to delete block "${block.title}"?`,
        () => dispatch({ type: ActionTypes.DELETE_CONTEXT_BLOCK, payload: blockId }),
        'Delete'
      );
    },
    deleteContextItem: (blockId, itemId) => {
      const block = state.contextBlocks.find(b => b.id === blockId);
      if (!block) return;
      const item = block.items.find(i => i.id === itemId);
      if (!item) return;
      openConfirmation(
        'Delete context item',
        `Delete item "${item.title}"?`,
        () => dispatch({ type: ActionTypes.DELETE_CONTEXT_ITEM, payload: { blockId, itemId } }),
        'Delete'
      );
    },
    // Метод для удаления подэлемента
    deleteContextSubItem: (blockId, itemId, subItemId) => {
      const block = state.contextBlocks.find(b => b.id === blockId);
      if (!block) return;
      
      const item = block.items.find(i => i.id === itemId);
      if (!item || !Array.isArray(item.subItems)) return;
      
      const subItem = item.subItems.find(s => s.id === subItemId);
      if (!subItem) return;
      
      openConfirmation(
        'Delete context subitem',
        `Delete subitem "${subItem.title}"?`,
        () => dispatch({ 
          type: ActionTypes.DELETE_CONTEXT_SUBITEM, 
          payload: { blockId, itemId, subItemId } 
        }),
        'Delete'
      );
    },
    
    updatePromptBlock: useCallback((id, data) => {
      return new Promise((resolve) => {
        dispatch({
          type: ActionTypes.UPDATE_PROMPT_BLOCK,
          payload: { id, ...data }
        });
        setTimeout(() => resolve(true), 0);
      });
    }, []),
    addPromptBlock: (title) => {
      const defaultTitle = title || generateDefaultPromptBlockName(state.promptBlocks);
      dispatch({
        type: ActionTypes.ADD_PROMPT_BLOCK,
        payload: { title: defaultTitle }
      });
    },
    deletePromptBlock: (promptId) => {
      const block = state.promptBlocks.find(b => b.id === promptId);
      if (!block) return;
      openConfirmation(
        'Delete prompt block',
        `Delete prompt "${block.title}"?`,
        () => dispatch({ type: ActionTypes.DELETE_PROMPT_BLOCK, payload: promptId }),
        'Delete'
      );
    },
    updateSelectedContexts: (promptId, selectedContexts) => {
      // Нормализуем данные перед обновлением
      const normalizedSelectedContexts = Array.isArray(selectedContexts) 
        ? selectedContexts.map(sel => ({
            ...sel,
            itemIds: Array.isArray(sel.itemIds) ? sel.itemIds : [], 
            subItemIds: Array.isArray(sel.subItemIds) ? sel.subItemIds : []
          }))
        : [];
      
      dispatch({
        type: ActionTypes.UPDATE_SELECTED_CONTEXTS,
        payload: { promptId, selectedContexts: normalizedSelectedContexts }
      });
    },
    
    moveContextBlockUp: (blockId) => {
      dispatch({ type: ActionTypes.MOVE_CONTEXT_BLOCK_UP, payload: blockId });
    },
    moveContextBlockDown: (blockId) => {
      dispatch({ type: ActionTypes.MOVE_CONTEXT_BLOCK_DOWN, payload: blockId });
    },
    movePromptBlockUp: (blockId) => {
      dispatch({ type: ActionTypes.MOVE_PROMPT_BLOCK_UP, payload: blockId });
    },
    movePromptBlockDown: (blockId) => {
      dispatch({ type: ActionTypes.MOVE_PROMPT_BLOCK_DOWN, payload: blockId });
    },
    moveContextItemUp: (blockId, itemId) => {
      dispatch({ 
        type: ActionTypes.MOVE_CONTEXT_ITEM_UP, 
        payload: { blockId, itemId } 
      });
    },
    moveContextItemDown: (blockId, itemId) => {
      dispatch({ 
        type: ActionTypes.MOVE_CONTEXT_ITEM_DOWN, 
        payload: { blockId, itemId } 
      });
    },
    // Методы для перемещения подэлементов
    moveContextSubItemUp: (blockId, itemId, subItemId) => {
      dispatch({ 
        type: ActionTypes.MOVE_CONTEXT_SUBITEM_UP, 
        payload: { blockId, itemId, subItemId } 
      });
    },
    moveContextSubItemDown: (blockId, itemId, subItemId) => {
      dispatch({ 
        type: ActionTypes.MOVE_CONTEXT_SUBITEM_DOWN, 
        payload: { blockId, itemId, subItemId } 
      });
    },
    
    createNewProject: (projectName = null, skipDialog = false) => {
      if (skipDialog && projectName) {
        // Создаем проект без диалога
        dispatch({
          type: ActionTypes.CREATE_NEW_PROJECT,
          payload: { projectName }
        });
        dispatch({
          type: ActionTypes.SHOW_NOTIFICATION,
          payload: {
            message: `Project "${projectName}" created`,
            type: 'success'
          }
        });
      } else {
        // Показываем диалог
        openConfirmation(
          'Create new project',
          'Enter new project name:',
          (inputName) => {
            const name = inputName || 'New Project';
            dispatch({
              type: ActionTypes.CREATE_NEW_PROJECT,
              payload: { projectName: name }
            });
            dispatch({
              type: ActionTypes.SHOW_NOTIFICATION,
              payload: {
                message: `Проект "${name}" создан`,
                type: 'success'
              }
            });
          },
          'Create',
          true,
          projectName || 'New Project'
        );
      }
    },
    
    openProject: async () => {
      try {
        // Всегда используем отдельную директорию для проектов
        const filePath = await ProjectService.openProjectDialog(state.projectFolder);
        if (!filePath) return;
        
        console.log('Loading project from file:', filePath);
        const projectData = await ProjectService.loadProject(filePath);
        
        if (!projectData) {
          throw new Error('Failed to load project');
        }
        
        console.log('Project loaded successfully, sending to reducer');
        dispatch({
          type: ActionTypes.LOAD_PROJECT,
          payload: { projectData, projectPath: filePath }
        });
        
        dispatch({
          type: ActionTypes.SHOW_NOTIFICATION,
          payload: { message: `Project "${projectData.projectName}" loaded`, type: 'success' }
        });
      } catch (error) {
        console.error('Error opening project:', error);
        dispatch({
          type: ActionTypes.SHOW_NOTIFICATION,
          payload: { message: 'Error opening project: ' + error.message, type: 'error' }
        });
      }
    },
    
    loadProject: (projectData, projectPath) => {
      dispatch({
        type: ActionTypes.LOAD_PROJECT,
        payload: { projectData, projectPath }
      });
    },
    
    saveProject: async () => {
      try {
        console.log('=== START PROJECT SAVE ===');
        console.log('Current project path:', state.projectPath);
        
        if (!state.projectPath) {
          console.log('Project path not defined, calling saveProjectAs');
          return actions.saveProjectAs();
        }
        
        // Подготавливаем данные для сохранения с обеспечением наличия всех необходимых полей
        const contextBlocks = state.contextBlocks.map(block => ({
          ...block,
          items: block.items.map(item => ({
            ...item,
            subItems: Array.isArray(item.subItems) ? item.subItems : []
          }))
        }));
        
        console.log('Number of context blocks:', contextBlocks.length);
        contextBlocks.forEach((block, index) => {
          console.log(`Block ${index + 1}: "${block.title}" - items: ${block.items.length}`);
        });
        
        const promptBlocks = state.promptBlocks.map(block => ({
          ...block,
          selectedContexts: Array.isArray(block.selectedContexts) 
            ? block.selectedContexts.map(sel => ({
                ...sel,
                itemIds: Array.isArray(sel.itemIds) ? sel.itemIds : [],
                subItemIds: Array.isArray(sel.subItemIds) ? sel.subItemIds : []
              }))
            : []
        }));
        
        console.log('Number of prompt blocks:', promptBlocks.length);
        
        const projectData = {
          projectName: state.projectName,
          templateName: state.templateName,
          contextBlocks,
          promptBlocks,
          createdAt: state.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        console.log('Project data to save:', {
          projectName: projectData.projectName,
          templateName: projectData.templateName,
          contextBlocksCount: projectData.contextBlocks.length,
          promptBlocksCount: projectData.promptBlocks.length
        });
        
        const success = await ProjectService.saveProject(state.projectPath, projectData);
        console.log('Save to file result:', success);
        
        if (!success) throw new Error('Failed to save project');
        
        dispatch({
          type: ActionTypes.SHOW_NOTIFICATION,
          payload: { message: `Project "${state.projectName}" saved`, type: 'success' }
        });
        
        console.log('=== PROJECT SAVE COMPLETED ===');
        return true;
      } catch (error) {
        console.error('Error saving project:', error);
        dispatch({
          type: ActionTypes.SHOW_NOTIFICATION,
          payload: { message: 'Error saving project: ' + error.message, type: 'error' }
        });
        return false;
      }
    },
    
    saveProjectAs: async () => {
      try {
        const defaultFilename = ProjectService.projectNameToFilename(state.projectName);
        // Всегда используем отдельную директорию для проектов
        const filePath = await ProjectService.saveProjectDialog(defaultFilename, state.projectFolder);
        if (!filePath) return false;
        
        // Подготавливаем данные для сохранения с обеспечением наличия всех необходимых полей
        const contextBlocks = state.contextBlocks.map(block => ({
          ...block,
          items: block.items.map(item => ({
            ...item,
            subItems: Array.isArray(item.subItems) ? item.subItems : []
          }))
        }));
        
        const promptBlocks = state.promptBlocks.map(block => ({
          ...block,
          selectedContexts: Array.isArray(block.selectedContexts) 
            ? block.selectedContexts.map(sel => ({
                ...sel,
                itemIds: Array.isArray(sel.itemIds) ? sel.itemIds : [],
                subItemIds: Array.isArray(sel.subItemIds) ? sel.subItemIds : []
              }))
            : []
        }));
        
        const projectData = {
          projectName: state.projectName,
          templateName: state.templateName,
          contextBlocks,
          promptBlocks,
          createdAt: state.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const success = await ProjectService.saveProject(filePath, projectData);
        if (!success) throw new Error('Failed to save project');
        
        dispatch({ type: ActionTypes.SET_PROJECT_PATH, payload: filePath });
        
        dispatch({
          type: ActionTypes.SHOW_NOTIFICATION,
          payload: { message: `Project "${state.projectName}" saved`, type: 'success' }
        });
        
        return true;
      } catch (error) {
        console.error('Error saving project:', error);
        dispatch({
          type: ActionTypes.SHOW_NOTIFICATION,
          payload: { message: 'Error saving project: ' + error.message, type: 'error' }
        });
        return false;
      }
    },
    
    setProjectName: (name) => {
      dispatch({ type: ActionTypes.SET_PROJECT_NAME, payload: name });
    },
    
    exportContextBlock: (blockId) => {
      const block = state.contextBlocks.find(b => b.id === blockId);
      if (!block) {
        dispatch({
          type: ActionTypes.SHOW_NOTIFICATION,
          payload: { message: 'Error: context block not found', type: 'error' }
        });
        return;
      }
      
      // Обеспечиваем наличие всех необходимых полей
      const normalizedBlock = {
        ...block,
        items: block.items.map(item => ({
          ...item,
          subItems: Array.isArray(item.subItems) ? item.subItems : []
        }))
      };
      
      ContextBlockService.exportContextBlock(blockId, normalizedBlock, state.contextDataFolder)
        .then(result => {
          if (result.success) {
            dispatch({
              type: ActionTypes.SHOW_NOTIFICATION,
              payload: { message: `Block "${block.title}" exported`, type: 'success' }
            });
          } else {
            throw new Error(result.error || 'Failed to export block');
          }
        })
        .catch(error => {
          dispatch({
            type: ActionTypes.SHOW_NOTIFICATION,
            payload: { message: `Export error: ${error.message}`, type: 'error' }
          });
        });
    },
    
    importContextBlock: () => {
      ContextBlockService.importContextBlock(state.contextDataFolder)
        .then(result => {
          if (result.success) {
            dispatch({
              type: ActionTypes.IMPORT_CONTEXT_BLOCK,
              payload: { blockData: result.blockData }
            });
            dispatch({
              type: ActionTypes.SHOW_NOTIFICATION,
              payload: { message: `Block "${result.blockData.title}" imported`, type: 'success' }
            });
          } else if (result.canceled) {
            console.log('Context block import canceled by user');
          } else {
            throw new Error(result.error || 'Failed to import block');
          }
        })
        .catch(error => {
          dispatch({
            type: ActionTypes.SHOW_NOTIFICATION,
            payload: { message: `Import error: ${error.message}`, type: 'error' }
          });
        });
    },
    
    hideNotification: () => {
      dispatch({ type: ActionTypes.HIDE_NOTIFICATION });
    },
    
    showNotification: (message, type = 'info') => {
      dispatch({
        type: ActionTypes.SHOW_NOTIFICATION,
        payload: { message, type }
      });
    },

    // === Обновленные методы для установки разных директорий ===
    setTemplateFolder: (folderPath) => {
      console.log('Setting prompt templates folder:', folderPath);
      // Очищаем кэш для старой директории
      if (state.templateFolder) {
        TemplateService.clearCache(state.templateFolder);
      }
      dispatch({ type: ActionTypes.SET_TEMPLATE_FOLDER, payload: folderPath });
      dispatch({
        type: ActionTypes.SHOW_NOTIFICATION,
        payload: { message: `Prompt templates folder: ${folderPath}`, type: 'info' }
      });
    },
    
    setProjectFolder: (folderPath) => {
      console.log('Setting projects folder:', folderPath);
      dispatch({ type: ActionTypes.SET_PROJECT_FOLDER, payload: folderPath });
      dispatch({
        type: ActionTypes.SHOW_NOTIFICATION,
        payload: { message: `Projects folder: ${folderPath}`, type: 'info' }
      });
    },
    
    setContextDataFolder: (folderPath) => {
      console.log('Setting context blocks folder:', folderPath);
      dispatch({ type: ActionTypes.SET_CONTEXT_DATA_FOLDER, payload: folderPath });
      dispatch({
        type: ActionTypes.SHOW_NOTIFICATION,
        payload: { message: `Context blocks folder: ${folderPath}`, type: 'info' }
      });
    },
    
    // === AI интеграция действия ===
    updateAIProviderStatus: (providerId, updates) => {
      dispatch({
        type: ActionTypes.UPDATE_AI_PROVIDER_STATUS,
        payload: { providerId, updates }
      });
    },
    
    setAIProviderModels: (providerId, models) => {
      dispatch({
        type: ActionTypes.SET_AI_PROVIDER_MODELS,
        payload: { providerId, models }
      });
    },
    
    setAvailableModels: (modelsMap) => {
      dispatch({
        type: ActionTypes.SET_AVAILABLE_MODELS,
        payload: { modelsMap }
      });
    },
    
    addAIModelConfig: (config) => {
      dispatch({
        type: ActionTypes.ADD_AI_MODEL_CONFIG,
        payload: { config }
      });
    },
    
    updateAIModelConfig: (modelId, updates) => {
      dispatch({
        type: ActionTypes.UPDATE_AI_MODEL_CONFIG,
        payload: { modelId, updates }
      });
    },
    
    removeAIModelConfig: (modelId) => {
      openConfirmation(
        'Delete model configuration',
        'Delete this model configuration?',
        () => dispatch({
          type: ActionTypes.REMOVE_AI_MODEL_CONFIG,
          payload: { modelId }
        }),
        'Delete'
      );
    },
    
    setCurrentAIModel: (modelId) => {
      dispatch({
        type: ActionTypes.SET_CURRENT_AI_MODEL,
        payload: { modelId }
      });
    },
    
    updateAIGlobalSettings: (settings) => {
      dispatch({
        type: ActionTypes.UPDATE_AI_GLOBAL_SETTINGS,
        payload: settings
      });
    }
  };

  const nameGenerators = {
    generateContextBlockName: () => generateDefaultContextBlockName(state.contextBlocks),
    generatePromptBlockName: () => generateDefaultPromptBlockName(state.promptBlocks),
    generateContextItemName: (blockId) => {
      const block = state.contextBlocks.find(b => b.id === blockId);
      return generateDefaultContextItemName(block);
    },
    generateContextSubItemName: (blockId, itemId) => {
      const block = state.contextBlocks.find(b => b.id === blockId);
      if (!block) return 'New SubItem';
      
      const item = block.items.find(i => i.id === itemId);
      if (!item) return 'New SubItem';
      
      return generateDefaultContextSubItemName(item);
    }
  };

  const selectors = {
    getActiveContextBlock: () => getActiveContextBlock(state),
    getActivePromptBlock: () => getActivePromptBlock(state),
    getPromptWithContext: (promptId, wrapWithTags) => getPromptWithContext(state, promptId, wrapWithTags),
    getSelectedContextsTotalChars: (promptId) => getSelectedContextsTotalChars(state, promptId)
  };
  
  const value = {
    state,
    actions,
    ...selectors,
    ...nameGenerators
  };

  // Загрузка конфигурации ИИ при старте приложения
  React.useEffect(() => {
    const loadAIConfig = async () => {
      try {
        const savedConfig = await AIConfigService.loadConfig();
        if (savedConfig) {
          console.log('Loading saved AI configuration');
          
          // Загружаем всю конфигурацию одним действием
          dispatch({
            type: ActionTypes.LOAD_AI_CONFIG,
            payload: {
              selectedModels: savedConfig.selectedModels || [],
              currentModelId: savedConfig.currentModelId || null,
              globalSettings: savedConfig.globalSettings || {}
            }
          });
          
          // Восстанавливаем информацию о провайдерах
          if (savedConfig.providers) {
            for (const providerId of Object.keys(savedConfig.providers)) {
              const provider = savedConfig.providers[providerId];
              if (provider.hasKey) {
                try {
                  // Проверяем, действительно ли ключ есть в системе
                  const { CredentialsService } = await import('../services/CredentialsService');
                  const hasKey = await CredentialsService.hasApiKey(providerId);
                  
                  if (hasKey) {
                    dispatch({
                      type: ActionTypes.UPDATE_AI_PROVIDER_STATUS,
                      payload: {
                        provider: providerId,
                        status: provider.status || 'active',
                        hasKey: true,
                        availableModels: provider.availableModels || []
                      }
                    });
                    
                    // Восстанавливаем доступные модели в кэш
                    if (provider.availableModels && provider.availableModels.length > 0) {
                      dispatch({
                        type: ActionTypes.SET_AVAILABLE_MODELS,
                        payload: {
                          provider: providerId,
                          models: provider.availableModels
                        }
                      });
                    }
                  }
                } catch (error) {
                  console.error(`Error checking key for ${providerId}:`, error);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading AI configuration:', error);
      }
    };
    
    loadAIConfig();
  }, []); // Загружаем только при монтировании компонента
  
  // Автосохранение конфигурации ИИ при изменениях
  React.useEffect(() => {
    // Пропускаем первый рендер
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Сохраняем конфигурацию с небольшой задержкой для группировки изменений
    const saveTimer = setTimeout(async () => {
      try {
        await AIConfigService.saveConfig(state.aiConfig);
        console.log('AI configuration saved automatically');
      } catch (error) {
        console.error('Error autosaving AI configuration:', error);
      }
    }, 1000); // Задержка 1 секунда
    
    return () => clearTimeout(saveTimer);
  }, [state.aiConfig]); // Отслеживаем изменения в aiConfig

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return context;
}

export default AppContext;