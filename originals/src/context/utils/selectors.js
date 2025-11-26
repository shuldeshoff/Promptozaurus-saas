// src/context/utils/selectors.js - Функции-селекторы для получения данных из состояния
console.log('Инициализация селекторов');

/**
 * Получает активный блок контекста из состояния
 * @param {Object} state - Состояние приложения
 * @returns {Object|undefined} - Активный блок контекста или undefined
 */
export const getActiveContextBlock = (state) => {
  const block = state.contextBlocks.find(block => block.id === state.activeContextBlock);
  console.log('Получение активного блока контекста:', block?.title);
  return block;
};

/**
 * Получает активный блок промпта из состояния
 * @param {Object} state - Состояние приложения
 * @returns {Object|undefined} - Активный блок промпта или undefined
 */
export const getActivePromptBlock = (state) => {
  const block = state.promptBlocks.find(block => block.id === state.activePromptBlock);
  console.log('Получение активного блока промпта:', block?.title);
  return block;
};

/**
 * Парсит ключ селекции и возвращает компоненты
 * Формат: "blockId-itemId" или "blockId-itemId-subItemId"
 */
const parseSelectionKey = (key) => {
  const parts = key.split('-').map(Number);
  return {
    blockId: parts[0],
    itemId: parts[1],
    subItemId: parts.length > 2 ? parts[2] : null,
  };
};

/**
 * Формирует готовый промпт с подставленным контекстом
 * @param {Object} state - Состояние приложения
 * @param {number} promptId - ID блока промпта
 * @param {boolean} wrapWithTags - Флаг для оборачивания контекста тегами
 * @returns {string|null} - Сформированный промпт или null
 */
export const getPromptWithContext = (state, promptId, wrapWithTags = false) => {
  console.log(`Запуск getPromptWithContext для promptId=${promptId}, wrapWithTags=${wrapWithTags}`);

  try {
    const prompt = state.promptBlocks.find(block => block.id === promptId);
    if (!prompt) {
      console.log(`Промпт с id=${promptId} не найден`);
      return null;
    }

    console.log(`Найден промпт: ${prompt.title} (id: ${promptId})`);

    // Проверка на наличие порядка выбора
    const selectionOrder = Array.isArray(prompt.selectionOrder) ? prompt.selectionOrder : [];

    // Если есть selectionOrder - используем его для сборки в правильном порядке
    if (selectionOrder.length > 0) {
      return buildContextByOrder(state, prompt, selectionOrder, wrapWithTags);
    }

    // Fallback: старая логика для обратной совместимости
    return buildContextLegacy(state, prompt, wrapWithTags);
  } catch (error) {
    console.error(`Ошибка при компиляции промпта: ${error.message}`, error);
    return null;
  }
};

/**
 * Собирает контекст по заданному порядку выбора
 */
const buildContextByOrder = (state, prompt, selectionOrder, wrapWithTags) => {
  // Создаём карту блоков для быстрого доступа
  const blocksMap = new Map();
  state.contextBlocks.forEach(block => blocksMap.set(block.id, block));

  // Собираем контент в порядке выбора
  const contents = [];

  selectionOrder.forEach(key => {
    const { blockId, itemId, subItemId } = parseSelectionKey(key);
    const block = blocksMap.get(blockId);
    if (!block) return;

    const item = block.items.find(i => i.id === itemId);
    if (!item) return;

    let content = '';

    if (subItemId !== null) {
      // Это подэлемент
      const subItem = item.subItems?.find(s => s.id === subItemId);
      if (!subItem || !subItem.content) return;

      if (wrapWithTags) {
        content = `#### ${subItem.title}\n<${subItem.title}>\n${subItem.content}\n</${subItem.title}>`;
      } else {
        content = subItem.content;
      }
    } else {
      // Это элемент
      if (!item.content) return;

      if (wrapWithTags) {
        content = `### ${item.title}\n<${item.title}>\n${item.content}\n</${item.title}>`;
      } else {
        content = item.content;
      }
    }

    if (content.trim()) {
      contents.push(content);
    }
  });

  // Объединяем контент
  let contextContent = contents.join('\n\n');

  if (wrapWithTags && contextContent) {
    contextContent = `### Context:\n<Context>\n${contextContent}\n</Context>`;
  }

  console.log(`Собран контент по порядку выбора, длина: ${contextContent.length} символов`);

  // Заменяем плейсхолдер
  let compiledPrompt = prompt.template || '';
  compiledPrompt = compiledPrompt.replace(/\{\{context\}\}/g, contextContent);

  if (compiledPrompt.includes('[КОНТЕКСТ]')) {
    console.log('ВНИМАНИЕ: Используется устаревший формат плейсхолдера [КОНТЕКСТ]');
    compiledPrompt = compiledPrompt.replace(/\[КОНТЕКСТ\]/g, contextContent);
  }

  return compiledPrompt;
};

/**
 * Старая логика сборки контекста (для обратной совместимости)
 */
const buildContextLegacy = (state, prompt, wrapWithTags) => {
  if (!Array.isArray(prompt.selectedContexts) || prompt.selectedContexts.length === 0) {
    console.log(`У промпта нет выбранных контекстов`);
    return prompt.template || '';
  }

  const selectedBlockIds = new Set(
    prompt.selectedContexts
      .filter(selection => selection && selection.blockId)
      .map(selection => selection.blockId)
  );

  const selectionsMap = new Map();
  prompt.selectedContexts.forEach(selection => {
    if (selection && selection.blockId) {
      selectionsMap.set(selection.blockId, selection);
    }
  });

  const blocksContent = [];

  state.contextBlocks.forEach(block => {
    if (!selectedBlockIds.has(block.id)) return;

    const selection = selectionsMap.get(block.id);
    if (!selection) return;

    let blockContent = '';

    if (wrapWithTags) {
      blockContent += `### ${block.title}\n<${block.title}>\n`;

      const selectedItemIds = Array.isArray(selection.itemIds) ? selection.itemIds : [];
      const selectedItems = (block.items || []).filter(item => selectedItemIds.includes(item.id));
      selectedItems.forEach(item => {
        blockContent += `### ${item.title}\n<${item.title}>\n${item.content || ''}\n</${item.title}>\n\n`;
      });

      if (Array.isArray(selection.subItemIds) && selection.subItemIds.length > 0) {
        const itemsMap = new Map();
        block.items.forEach(item => {
          if (Array.isArray(item.subItems)) {
            item.subItems.forEach(subItem => {
              itemsMap.set(`${item.id}.${subItem.id}`, { item, subItem });
            });
          }
        });

        selection.subItemIds.forEach(subItemFullId => {
          const itemSubItem = itemsMap.get(subItemFullId);
          if (itemSubItem) {
            const { subItem } = itemSubItem;
            blockContent += `#### ${subItem.title}\n<${subItem.title}>\n${subItem.content || ''}\n</${subItem.title}>\n\n`;
          }
        });
      }

      blockContent += `</${block.title}>`;
    } else {
      let itemsContent = [];

      const selectedItemIds = Array.isArray(selection.itemIds) ? selection.itemIds : [];
      const selectedItems = (block.items || []).filter(item => selectedItemIds.includes(item.id));
      selectedItems.forEach(item => {
        itemsContent.push(item.content || '');
      });

      if (Array.isArray(selection.subItemIds) && selection.subItemIds.length > 0) {
        const itemsMap = new Map();
        block.items.forEach(item => {
          if (Array.isArray(item.subItems)) {
            item.subItems.forEach(subItem => {
              itemsMap.set(`${item.id}.${subItem.id}`, { item, subItem });
            });
          }
        });

        selection.subItemIds.forEach(subItemFullId => {
          const itemSubItem = itemsMap.get(subItemFullId);
          if (itemSubItem) {
            itemsContent.push(itemSubItem.subItem.content || '');
          }
        });
      }

      blockContent = itemsContent.filter(content => content.trim()).join('\n\n');
    }

    if (blockContent.trim()) {
      blocksContent.push(blockContent);
    }
  });

  let contextContent = '';

  if (wrapWithTags && blocksContent.length > 0) {
    contextContent = `### Context:\n<Context>\n${blocksContent.join('\n\n')}\n</Context>`;
  } else {
    contextContent = blocksContent.join('\n\n');
  }

  console.log(`Собран контент (legacy), длина: ${contextContent.length} символов`);

  let compiledPrompt = prompt.template || '';
  compiledPrompt = compiledPrompt.replace(/\{\{context\}\}/g, contextContent);

  if (compiledPrompt.includes('[КОНТЕКСТ]')) {
    compiledPrompt = compiledPrompt.replace(/\[КОНТЕКСТ\]/g, contextContent);
  }

  return compiledPrompt;
};

/**
 * Вычисляет общее количество символов для выбранных контекстов в промпте
 * @param {Object} state - Состояние приложения
 * @param {number} promptId - ID блока промпта
 * @returns {number} - Общее количество символов
 */
export const getSelectedContextsTotalChars = (state, promptId) => {
  try {
    const prompt = state.promptBlocks.find(block => block.id === promptId);
    if (!prompt) {
      console.log(`Промпт с id=${promptId} не найден для подсчета символов`);
      return 0;
    }
    
    if (!Array.isArray(prompt.selectedContexts) || prompt.selectedContexts.length === 0) {
      console.log(`У промпта с id=${promptId} нет выбранных контекстов`);
      return 0;
    }
    
    const totalChars = prompt.selectedContexts.reduce((total, selection) => {
      // Проверка на корректность данных выбора
      if (!selection || !selection.blockId) {
        return total;
      }
      
      const block = state.contextBlocks.find(block => block.id === selection.blockId);
      if (!block || !Array.isArray(block.items)) {
        console.log(`Блок контекста с id=${selection.blockId} не найден при подсчете символов`);
        return total;
      }
      
      // Проверка на наличие массива itemIds в selection
      const selectedItemIds = Array.isArray(selection.itemIds) ? selection.itemIds : [];
      
      // Подсчитываем символы в выбранных элементах
      const selectedItemsChars = block.items
        .filter(item => selectedItemIds.includes(item.id))
        .reduce((sum, item) => sum + (item.chars || 0), 0);
      
      // Подсчитываем символы во всех выбранных подэлементах
      // Убрано условие исключения подэлементов, если выбран родительский элемент
      let selectedSubItemsChars = 0;
      const selectedSubItemIds = Array.isArray(selection.subItemIds) ? selection.subItemIds : [];
      
      if (selectedSubItemIds.length > 0) {
        // Перебираем все элементы и их подэлементы
        block.items.forEach(item => {
          if (!Array.isArray(item.subItems)) return;
          
          // Фильтруем подэлементы, относящиеся к текущему элементу
          const itemSubItemIds = selectedSubItemIds
            .filter(id => id.startsWith(`${item.id}.`))
            .map(id => parseInt(id.split('.')[1]));
          
          // Считаем символы в выбранных подэлементах - всегда учитываем их, независимо от родителя
          item.subItems.forEach(subItem => {
            if (itemSubItemIds.includes(subItem.id)) {
              selectedSubItemsChars += subItem.chars || 0;
            }
          });
        });
      }
      
      return total + selectedItemsChars + selectedSubItemsChars;
    }, 0);
    
    console.log(`Общее количество символов для промпта ${promptId}: ${totalChars}`);
    return totalChars;
  } catch (error) {
    console.error(`Ошибка при подсчете символов промпта: ${error.message}`, error);
    return 0;
  }
};