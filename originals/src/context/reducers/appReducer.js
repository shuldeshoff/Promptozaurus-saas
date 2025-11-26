// src/context/reducers/appReducer.js
import ActionTypes from '../actionTypes';

console.log('Инициализация редьюсера приложения');

const appReducer = (state, action) => {
  console.log('Действие:', action.type, action.payload);
  
  switch (action.type) {
    case ActionTypes.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };
      
    case ActionTypes.SET_ACTIVE_CONTEXT_BLOCK:
      return {
        ...state,
        activeContextBlock: action.payload,
        activeTab: 'context',
        // Сбрасываем активный элемент/подэлемент при смене блока
        activeContextItemId: null,
        activeContextSubItemId: null
      };

    case ActionTypes.SET_ACTIVE_CONTEXT_ITEM:
      return {
        ...state,
        // Устанавливаем блок, элемент и подэлемент за один раз
        activeContextBlock: action.payload.blockId,
        activeContextItemId: action.payload.itemId,
        activeContextSubItemId: action.payload.subItemId,
        activeTab: 'context'
      };

    case ActionTypes.SET_ACTIVE_PROMPT_BLOCK:
      return { 
        ...state, 
        activePromptBlock: action.payload, 
        activeTab: 'prompt' 
      };

    case ActionTypes.UPDATE_CONTEXT_BLOCK: {
      const { id, ...updatedData } = action.payload;
      return {
        ...state,
        contextBlocks: state.contextBlocks.map(b =>
          b.id === id ? { ...b, ...updatedData } : b
        )
      };
    }

    case ActionTypes.UPDATE_CONTEXT_ITEM: {
      const { blockId, itemId, ...updatedData } = action.payload;
      return {
        ...state,
        contextBlocks: state.contextBlocks.map(block => {
          if (block.id === blockId) {
            return {
              ...block,
              items: block.items.map(item =>
                item.id === itemId ? { ...item, ...updatedData } : item
              )
            };
          }
          return block;
        })
      };
    }

    case ActionTypes.ADD_CONTEXT_BLOCK: {
      const newId = Math.max(0, ...state.contextBlocks.map(b => b.id)) + 1;
      const newBlock = {
        id: newId,
        title: action.payload.title || 'Новый контекст',
        items: []
      };
      return {
        ...state,
        contextBlocks: [...state.contextBlocks, newBlock],
        activeContextBlock: newId,
        activeTab: 'context'
      };
    }

    case ActionTypes.ADD_CONTEXT_ITEM: {
      const { blockId, title } = action.payload || {};
      if (!blockId) {
        console.error('Ошибка: blockId не указан при ADD_CONTEXT_ITEM');
        return state;
      }
      return {
        ...state,
        contextBlocks: state.contextBlocks.map(block => {
          if (block.id === blockId) {
            const newId = Math.max(0, ...block.items.map(i => i.id)) + 1;
            const newItem = {
              id: newId,
              title: title || 'Новый элемент',
              content: '',
              chars: 0,
              subItems: [] // Добавляем массив для подэлементов
            };
            return {
              ...block,
              items: [...block.items, newItem]
            };
          }
          return block;
        })
      };
    }

    case ActionTypes.ADD_CONTEXT_SUBITEM: {
      const { blockId, itemId, title, content = '', chars = 0 } = action.payload || {};
      if (!blockId || !itemId) {
        console.error('Ошибка: blockId или itemId не указаны при ADD_CONTEXT_SUBITEM');
        return state;
      }
      return {
        ...state,
        contextBlocks: state.contextBlocks.map(block => {
          if (block.id === blockId) {
            return {
              ...block,
              items: block.items.map(item => {
                if (item.id === itemId) {
                  // Инициализируем подэлементы, если их нет
                  const subItems = Array.isArray(item.subItems) ? item.subItems : [];
                  const newId = subItems.length > 0 
                    ? Math.max(...subItems.map(i => i.id)) + 1 
                    : 1;
                  const newSubItem = {
                    id: newId,
                    title: title || 'Новый подэлемент',
                    content,
                    chars: content.length
                  };
                  return {
                    ...item,
                    subItems: [...subItems, newSubItem]
                  };
                }
                return item;
              })
            };
          }
          return block;
        })
      };
    }

    case ActionTypes.UPDATE_CONTEXT_SUBITEM: {
      const { blockId, itemId, subItemId, ...updatedData } = action.payload;
      return {
        ...state,
        contextBlocks: state.contextBlocks.map(block => {
          if (block.id === blockId) {
            return {
              ...block,
              items: block.items.map(item => {
                if (item.id === itemId) {
                  // Проверяем наличие subItems
                  if (!Array.isArray(item.subItems)) {
                    return {
                      ...item,
                      subItems: [] // Инициализируем массив, если его нет
                    };
                  }
                  
                  return {
                    ...item,
                    subItems: item.subItems.map(subItem => 
                      subItem.id === subItemId 
                        ? { 
                            ...subItem, 
                            ...updatedData,
                            // Обновляем количество символов, если изменилось содержимое
                            chars: updatedData.content !== undefined 
                              ? updatedData.content.length 
                              : subItem.chars
                          } 
                        : subItem
                    )
                  };
                }
                return item;
              })
            };
          }
          return block;
        })
      };
    }

    case ActionTypes.DELETE_CONTEXT_BLOCK: {
      const blockId = action.payload;
      const newContextBlocks = state.contextBlocks.filter(b => b.id !== blockId);

      let activeContextBlock = state.activeContextBlock;
      if (blockId === state.activeContextBlock) {
        activeContextBlock = newContextBlocks.length > 0 ? newContextBlocks[0].id : 0;
      }

      // Удаляем упоминания об этом блоке во всех промптах
      const updatedPromptBlocks = state.promptBlocks.map(pb => {
        // Проверяем наличие массива selectedContexts
        if (!Array.isArray(pb.selectedContexts)) {
          return { ...pb, selectedContexts: [] };
        }
        
        const updatedSelections = pb.selectedContexts.filter(sel => sel && sel.blockId !== blockId);
        return { ...pb, selectedContexts: updatedSelections };
      });

      return {
        ...state,
        contextBlocks: newContextBlocks,
        promptBlocks: updatedPromptBlocks,
        activeContextBlock
      };
    }

    case ActionTypes.DELETE_CONTEXT_ITEM: {
      const { blockId, itemId } = action.payload;
      const updatedContextBlocks = state.contextBlocks.map(block => {
        if (block.id === blockId) {
          return {
            ...block,
            items: block.items.filter(i => i.id !== itemId)
          };
        }
        return block;
      });

      // Обновляем выбранные контексты в промптах
      const updatedPromptBlocks = state.promptBlocks.map(pb => {
        // Проверяем наличие массива selectedContexts
        if (!Array.isArray(pb.selectedContexts)) {
          return { ...pb, selectedContexts: [] };
        }
        
        const updatedSelections = pb.selectedContexts.map(sel => {
          if (!sel || sel.blockId !== blockId) {
            return sel;
          }
          
          // Удаляем ссылки на элемент и его подэлементы
          return {
            ...sel,
            // Проверяем наличие массива itemIds
            itemIds: Array.isArray(sel.itemIds) 
              ? sel.itemIds.filter(id => id !== itemId) 
              : [],
            // Удаляем ссылки на подэлементы, если они были
            subItemIds: Array.isArray(sel.subItemIds) 
              ? sel.subItemIds.filter(id => !id.startsWith(`${itemId}.`)) 
              : []
          };
        }).filter(sel => {
          // Оставляем только те выборы, где есть хотя бы один элемент или подэлемент
          const hasItems = Array.isArray(sel.itemIds) && sel.itemIds.length > 0;
          const hasSubItems = Array.isArray(sel.subItemIds) && sel.subItemIds.length > 0;
          return hasItems || hasSubItems;
        });
        
        return { ...pb, selectedContexts: updatedSelections };
      });

      return {
        ...state,
        contextBlocks: updatedContextBlocks,
        promptBlocks: updatedPromptBlocks
      };
    }

    case ActionTypes.ADD_MULTIPLE_CONTEXT_ITEMS: {
      const { blockId, items } = action.payload;
      if (!blockId || !Array.isArray(items) || items.length === 0) {
        console.error('Ошибка: неверные данные для ADD_MULTIPLE_CONTEXT_ITEMS');
        return state;
      }
      
      return {
        ...state,
        contextBlocks: state.contextBlocks.map(block => {
          if (block.id === blockId) {
            // Находим максимальный ID для генерации новых ID
            const maxId = Math.max(0, ...block.items.map(i => i.id));
            
            // Создаем новые элементы с корректными ID
            const newItems = items.map((item, index) => ({
              id: maxId + index + 1,
              title: item.title || `Часть ${maxId + index + 1}`,
              content: item.content || '',
              chars: (item.content || '').length,
              subItems: []
            }));
            
            return {
              ...block,
              items: [...block.items, ...newItems]
            };
          }
          return block;
        })
      };
    }


    case ActionTypes.DELETE_CONTEXT_SUBITEM: {
      const { blockId, itemId, subItemId } = action.payload;
      const updatedContextBlocks = state.contextBlocks.map(block => {
        if (block.id === blockId) {
          return {
            ...block,
            items: block.items.map(item => {
              if (item.id === itemId) {
                // Проверяем наличие массива subItems
                if (!Array.isArray(item.subItems)) {
                  return { ...item, subItems: [] };
                }
                
                return {
                  ...item,
                  subItems: item.subItems.filter(s => s.id !== subItemId)
                };
              }
              return item;
            })
          };
        }
        return block;
      });

      // Обновляем выбранные контексты в промптах, удаляя ссылки на подэлемент
      const updatedPromptBlocks = state.promptBlocks.map(pb => {
        // Проверяем наличие массива selectedContexts
        if (!Array.isArray(pb.selectedContexts)) {
          return { ...pb, selectedContexts: [] };
        }
        
        const updatedSelections = pb.selectedContexts.map(sel => {
          if (!sel || sel.blockId !== blockId) {
            return sel;
          }
          
          return {
            ...sel,
            // Удаляем подэлемент из выбранных, если он там был
            subItemIds: Array.isArray(sel.subItemIds)
              ? sel.subItemIds.filter(id => id !== `${itemId}.${subItemId}`)
              : []
          };
        }).filter(sel => {
          // Оставляем только те выборы, где есть хотя бы один элемент или подэлемент
          const hasItems = Array.isArray(sel.itemIds) && sel.itemIds.length > 0;
          const hasSubItems = Array.isArray(sel.subItemIds) && sel.subItemIds.length > 0;
          return hasItems || hasSubItems;
        });
        
        return { ...pb, selectedContexts: updatedSelections };
      });

      return {
        ...state,
        contextBlocks: updatedContextBlocks,
        promptBlocks: updatedPromptBlocks
      };
    }

    



    case ActionTypes.UPDATE_PROMPT_BLOCK: {
      const { id, ...updatedData } = action.payload;
      return {
        ...state,
        promptBlocks: state.promptBlocks.map(block =>
          block.id === id ? { ...block, ...updatedData } : block
        )
      };
    }

    case ActionTypes.ADD_PROMPT_BLOCK: {
      const newId = Math.max(0, ...state.promptBlocks.map(b => b.id)) + 1;
      const newBlock = {
        id: newId,
        title: action.payload?.title || 'Новый промпт',
        template: '',
        templateFilename: null,
        selectedContexts: [],
        selectionOrder: []
      };
      return {
        ...state,
        promptBlocks: [...state.promptBlocks, newBlock],
        activePromptBlock: newId,
        activeTab: 'prompt'
      };
    }

    case ActionTypes.DELETE_PROMPT_BLOCK: {
      const promptId = action.payload;
      const newPromptBlocks = state.promptBlocks.filter(b => b.id !== promptId);

      let activePromptBlock = state.activePromptBlock;
      if (promptId === state.activePromptBlock) {
        activePromptBlock = newPromptBlocks.length > 0 ? newPromptBlocks[0].id : 0;
      }
      return {
        ...state,
        promptBlocks: newPromptBlocks,
        activePromptBlock
      };
    }

    case ActionTypes.UPDATE_SELECTED_CONTEXTS: {
      const { promptId, selectedContexts, selectionOrder } = action.payload;
      return {
        ...state,
        promptBlocks: state.promptBlocks.map(block =>
          block.id === promptId
            ? {
                ...block,
                selectedContexts: Array.isArray(selectedContexts)
                  ? selectedContexts.map(sel => ({
                      ...sel,
                      itemIds: Array.isArray(sel.itemIds) ? sel.itemIds : [],
                      subItemIds: Array.isArray(sel.subItemIds) ? sel.subItemIds : []
                    }))
                  : [],
                selectionOrder: Array.isArray(selectionOrder) ? selectionOrder : []
              }
            : block
        )
      };
    }

    // Перемещение контекстных блоков
    case ActionTypes.MOVE_CONTEXT_BLOCK_UP: {
      const blockId = action.payload;
      const idx = state.contextBlocks.findIndex(b => b.id === blockId);
      if (idx <= 0) return state;
      const arr = [...state.contextBlocks];
      [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];
      return { ...state, contextBlocks: arr };
    }
    
    case ActionTypes.MOVE_CONTEXT_BLOCK_DOWN: {
      const blockId = action.payload;
      const idx = state.contextBlocks.findIndex(b => b.id === blockId);
      if (idx === -1 || idx >= state.contextBlocks.length - 1) return state;
      const arr = [...state.contextBlocks];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return { ...state, contextBlocks: arr };
    }

    // Перемещение элементов контекста
    case ActionTypes.MOVE_CONTEXT_ITEM_UP: {
      const { blockId, itemId } = action.payload;
      const blockIndex = state.contextBlocks.findIndex(b => b.id === blockId);
      if (blockIndex === -1) return state;
      const block = state.contextBlocks[blockIndex];
      const itemIndex = block.items.findIndex(i => i.id === itemId);
      if (itemIndex <= 0) return state;
      const itemsCopy = [...block.items];
      [itemsCopy[itemIndex], itemsCopy[itemIndex - 1]] =
        [itemsCopy[itemIndex - 1], itemsCopy[itemIndex]];
      const newBlocks = [...state.contextBlocks];
      newBlocks[blockIndex] = { ...block, items: itemsCopy };
      return { ...state, contextBlocks: newBlocks };
    }
    
    case ActionTypes.MOVE_CONTEXT_ITEM_DOWN: {
      const { blockId, itemId } = action.payload;
      const blockIndex = state.contextBlocks.findIndex(b => b.id === blockId);
      if (blockIndex === -1) return state;
      const block = state.contextBlocks[blockIndex];
      const itemIndex = block.items.findIndex(i => i.id === itemId);
      if (itemIndex === -1 || itemIndex >= block.items.length - 1) return state;
      const itemsCopy = [...block.items];
      [itemsCopy[itemIndex], itemsCopy[itemIndex + 1]] =
        [itemsCopy[itemIndex + 1], itemsCopy[itemIndex]];
      const newBlocks = [...state.contextBlocks];
      newBlocks[blockIndex] = { ...block, items: itemsCopy };
      return { ...state, contextBlocks: newBlocks };
    }

    // Перемещение подэлементов контекста
    case ActionTypes.MOVE_CONTEXT_SUBITEM_UP: {
      const { blockId, itemId, subItemId } = action.payload;
      const blockIndex = state.contextBlocks.findIndex(b => b.id === blockId);
      if (blockIndex === -1) return state;
      
      const block = state.contextBlocks[blockIndex];
      const itemIndex = block.items.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return state;
      
      const item = block.items[itemIndex];
      
      // Проверяем наличие массива subItems
      if (!Array.isArray(item.subItems) || item.subItems.length < 2) {
        return state;
      }
      
      const subItemIndex = item.subItems.findIndex(s => s.id === subItemId);
      if (subItemIndex <= 0) return state;
      
      // Копируем массивы для обновления
      const newBlock = { ...block };
      const newItems = [...block.items];
      const newItem = { ...item, subItems: [...item.subItems] };
      
      // Меняем подэлементы местами
      [newItem.subItems[subItemIndex], newItem.subItems[subItemIndex - 1]] = 
        [newItem.subItems[subItemIndex - 1], newItem.subItems[subItemIndex]];
      
      // Обновляем структуру
      newItems[itemIndex] = newItem;
      newBlock.items = newItems;
      
      const newBlocks = [...state.contextBlocks];
      newBlocks[blockIndex] = newBlock;
      
      return { ...state, contextBlocks: newBlocks };
    }
    
    case ActionTypes.MOVE_CONTEXT_SUBITEM_DOWN: {
      const { blockId, itemId, subItemId } = action.payload;
      const blockIndex = state.contextBlocks.findIndex(b => b.id === blockId);
      if (blockIndex === -1) return state;
      
      const block = state.contextBlocks[blockIndex];
      const itemIndex = block.items.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return state;
      
      const item = block.items[itemIndex];
      
      // Проверяем наличие массива subItems
      if (!Array.isArray(item.subItems) || item.subItems.length < 2) {
        return state;
      }
      
      const subItemIndex = item.subItems.findIndex(s => s.id === subItemId);
      if (subItemIndex === -1 || subItemIndex >= item.subItems.length - 1) return state;
      
      // Копируем массивы для обновления
      const newBlock = { ...block };
      const newItems = [...block.items];
      const newItem = { ...item, subItems: [...item.subItems] };
      
      // Меняем подэлементы местами
      [newItem.subItems[subItemIndex], newItem.subItems[subItemIndex + 1]] = 
        [newItem.subItems[subItemIndex + 1], newItem.subItems[subItemIndex]];
      
      // Обновляем структуру
      newItems[itemIndex] = newItem;
      newBlock.items = newItems;
      
      const newBlocks = [...state.contextBlocks];
      newBlocks[blockIndex] = newBlock;
      
      return { ...state, contextBlocks: newBlocks };
    }

    // Перемещение промпт-блоков
    case ActionTypes.MOVE_PROMPT_BLOCK_UP: {
      const blockId = action.payload;
      const idx = state.promptBlocks.findIndex(b => b.id === blockId);
      if (idx <= 0) return state;
      const arr = [...state.promptBlocks];
      [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];
      return { ...state, promptBlocks: arr };
    }
    
    case ActionTypes.MOVE_PROMPT_BLOCK_DOWN: {
      const blockId = action.payload;
      const idx = state.promptBlocks.findIndex(b => b.id === blockId);
      if (idx === -1 || idx >= state.promptBlocks.length - 1) return state;
      const arr = [...state.promptBlocks];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return { ...state, promptBlocks: arr };
    }

    // Проекты
    case ActionTypes.CREATE_NEW_PROJECT: {
      const name = action.payload?.projectName || 'New Project';
      return {
        ...state,
        contextBlocks: [],
        promptBlocks: [],
        activeContextBlock: 0,
        activePromptBlock: 0,
        projectName: name,
        projectPath: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    case ActionTypes.LOAD_PROJECT: {
      const { projectData, projectPath } = action.payload;
      
      if (!projectData) {
        console.error('Ошибка: отсутствуют данные проекта при LOAD_PROJECT');
        return state;
      }
      
      const projectName = projectData.projectName || 'Загруженный проект';
      
      // Миграция данных старых проектов: добавляем subItems, если их нет
      const migratedContextBlocks = Array.isArray(projectData.contextBlocks) 
        ? projectData.contextBlocks.map(block => ({
            ...block,
            items: Array.isArray(block.items) 
              ? block.items.map(item => ({
                  ...item,
                  subItems: Array.isArray(item.subItems) ? item.subItems : [] // Добавляем пустой массив подэлементов, если его нет
                })) 
              : []
          })) 
        : [];
      
      // Миграция данных в промптах: добавляем поля subItemIds и selectionOrder, если их нет
      const migratedPromptBlocks = Array.isArray(projectData.promptBlocks)
        ? projectData.promptBlocks.map(block => ({
            ...block,
            selectedContexts: Array.isArray(block.selectedContexts)
              ? block.selectedContexts.map(sel => ({
                  ...sel,
                  itemIds: Array.isArray(sel.itemIds) ? sel.itemIds : [],
                  subItemIds: Array.isArray(sel.subItemIds) ? sel.subItemIds : []
                }))
              : [],
            selectionOrder: Array.isArray(block.selectionOrder) ? block.selectionOrder : []
          }))
        : [];
      
      console.log('Миграция данных проекта завершена');
      
      return {
        ...state,
        projectName,
        templateName: projectData.templateName || 'Базовый',
        contextBlocks: migratedContextBlocks,
        promptBlocks: migratedPromptBlocks,
        activeContextBlock: migratedContextBlocks.length > 0 ? migratedContextBlocks[0].id : 0,
        activePromptBlock: migratedPromptBlocks.length > 0 ? migratedPromptBlocks[0].id : 0,
        activeTab: 'context',
        projectPath,
        createdAt: projectData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    case ActionTypes.SET_PROJECT_NAME:
      return { ...state, projectName: action.payload };

    case ActionTypes.SET_PROJECT_PATH:
      return { ...state, projectPath: action.payload };

    // Шаблоны проектов
    case ActionTypes.CREATE_NEW_TEMPLATE: {
      const tmplName = action.payload?.templateName || 'Новый шаблон';
      return {
        ...state,
        templateName: tmplName,
        currentTemplateFilename: null
      };
    }

    case ActionTypes.SET_TEMPLATE_NAME:
      return { ...state, templateName: action.payload };

    case ActionTypes.SET_TEMPLATE_FILENAME:
      return { ...state, currentTemplateFilename: action.payload };

    case ActionTypes.LOAD_PROJECT_TEMPLATE: {
      const t = action.payload;
      
      if (!t) {
        console.error('Ошибка: отсутствуют данные шаблона при LOAD_PROJECT_TEMPLATE');
        return state;
      }
      
      // Миграция данных старых шаблонов: добавляем subItems, если их нет
      const migratedContextBlocks = Array.isArray(t.contextBlocks) 
        ? t.contextBlocks.map(block => ({
            ...block,
            items: Array.isArray(block.items) 
              ? block.items.map(item => ({
                  ...item,
                  subItems: Array.isArray(item.subItems) ? item.subItems : [] // Добавляем пустой массив подэлементов, если его нет
                })) 
              : []
          })) 
        : [];
      
      // Миграция данных в промптах: добавляем поля subItemIds и selectionOrder, если их нет
      const migratedPromptBlocks = Array.isArray(t.promptBlocks)
        ? t.promptBlocks.map(block => ({
            ...block,
            selectedContexts: Array.isArray(block.selectedContexts)
              ? block.selectedContexts.map(sel => ({
                  ...sel,
                  itemIds: Array.isArray(sel.itemIds) ? sel.itemIds : [],
                  subItemIds: Array.isArray(sel.subItemIds) ? sel.subItemIds : []
                }))
              : [],
            selectionOrder: Array.isArray(block.selectionOrder) ? block.selectionOrder : []
          }))
        : [];

      return {
        ...state,
        projectName: t.projectName || 'New Project',
        templateName: t.templateName || 'Базовый',
        contextBlocks: migratedContextBlocks,
        promptBlocks: migratedPromptBlocks,
        activeContextBlock: migratedContextBlocks.length > 0 ? migratedContextBlocks[0].id : 0,
        activePromptBlock: migratedPromptBlocks.length > 0 ? migratedPromptBlocks[0].id : 0,
        activeTab: 'context',
        currentTemplateFilename: t.fileName || null
      };
    }

    // Уведомления
    case ActionTypes.SHOW_NOTIFICATION:
      return {
        ...state,
        notification: {
          visible: true,
          message: action.payload.message,
          type: action.payload.type || 'info',
          timestamp: Date.now()
        }
      };
    case ActionTypes.HIDE_NOTIFICATION:
      return {
        ...state,
        notification: {
          ...state.notification,
          visible: false
        }
      };

    // Импорт/экспорт контекста
    case ActionTypes.IMPORT_CONTEXT_BLOCK: {
      const { blockData } = action.payload;
      
      if (!blockData) {
        console.error('Ошибка: отсутствуют данные блока при IMPORT_CONTEXT_BLOCK');
        return state;
      }
      
      const newId = Math.max(0, ...state.contextBlocks.map(b => b.id)) + 1;
      
      // Миграция данных старых блоков: добавляем subItems, если их нет
      const migratedBlockData = {
        ...blockData,
        items: Array.isArray(blockData.items)
          ? blockData.items.map((item, i) => ({
              ...item,
              id: i + 1,
              subItems: Array.isArray(item.subItems) ? item.subItems : [] // Добавляем пустой массив подэлементов, если его нет
            }))
          : []
      };
      
      const newBlock = {
        ...migratedBlockData,
        id: newId
      };
      
      return {
        ...state,
        contextBlocks: [...state.contextBlocks, newBlock],
        activeContextBlock: newId,
        activeTab: 'context'
      };
    }

    // Установка директорий для разных типов файлов
    case ActionTypes.SET_TEMPLATE_FOLDER:
      return {
        ...state,
        templateFolder: action.payload
      };

    case ActionTypes.SET_PROJECT_FOLDER:
      return {
        ...state,
        projectFolder: action.payload
      };
      
    case ActionTypes.SET_CONTEXT_DATA_FOLDER:
      return {
        ...state,
        contextDataFolder: action.payload
      };

    // AI интеграция действия
    case ActionTypes.UPDATE_AI_PROVIDER_STATUS:
      return {
        ...state,
        aiConfig: {
          ...state.aiConfig,
          providers: {
            ...state.aiConfig.providers,
            [action.payload.providerId]: {
              ...state.aiConfig.providers[action.payload.providerId],
              ...action.payload.updates
            }
          }
        }
      };
      
    case ActionTypes.SET_AI_PROVIDER_MODELS:
      return {
        ...state,
        aiConfig: {
          ...state.aiConfig,
          providers: {
            ...state.aiConfig.providers,
            [action.payload.providerId]: {
              ...state.aiConfig.providers[action.payload.providerId],
              availableModels: action.payload.models,
              lastChecked: new Date().toISOString()
            }
          }
        }
      };
      
    case ActionTypes.SET_AVAILABLE_MODELS:
      return {
        ...state,
        aiConfig: {
          ...state.aiConfig,
          availableModels: action.payload.modelsMap
        }
      };
      
    case ActionTypes.ADD_AI_MODEL_CONFIG:
      const newModelConfig = {
        id: action.payload.id || `model_${Date.now()}`,
        ...action.payload.config,
        created: new Date().toISOString()
      };
      
      return {
        ...state,
        aiConfig: {
          ...state.aiConfig,
          selectedModels: [...state.aiConfig.selectedModels, newModelConfig],
          currentModelId: state.aiConfig.currentModelId || newModelConfig.id
        }
      };
      
    case ActionTypes.UPDATE_AI_MODEL_CONFIG:
      return {
        ...state,
        aiConfig: {
          ...state.aiConfig,
          selectedModels: state.aiConfig.selectedModels.map(model =>
            model.id === action.payload.modelId
              ? { ...model, ...action.payload.updates, updated: new Date().toISOString() }
              : model
          )
        }
      };
      
    case ActionTypes.REMOVE_AI_MODEL_CONFIG:
      const filteredModels = state.aiConfig.selectedModels.filter(
        model => model.id !== action.payload.modelId
      );
      
      return {
        ...state,
        aiConfig: {
          ...state.aiConfig,
          selectedModels: filteredModels,
          currentModelId: state.aiConfig.currentModelId === action.payload.modelId
            ? (filteredModels[0]?.id || null)
            : state.aiConfig.currentModelId
        }
      };
      
    case ActionTypes.SET_CURRENT_AI_MODEL:
      return {
        ...state,
        aiConfig: {
          ...state.aiConfig,
          currentModelId: action.payload.modelId
        }
      };
      
    case ActionTypes.LOAD_AI_CONFIG:
      // Загружаем конфигурацию ИИ целиком, заменяя существующие модели
      return {
        ...state,
        aiConfig: {
          ...state.aiConfig,
          selectedModels: action.payload.selectedModels || [],
          currentModelId: action.payload.currentModelId || null,
          globalSettings: action.payload.globalSettings || state.aiConfig.globalSettings
        }
      };
      
    case ActionTypes.UPDATE_AI_GLOBAL_SETTINGS:
      return {
        ...state,
        aiConfig: {
          ...state.aiConfig,
          globalSettings: {
            ...state.aiConfig.globalSettings,
            ...action.payload
          }
        }
      };

    default:
      console.error('Неизвестный тип действия:', action.type);
      return state;
  }
};

export default appReducer;