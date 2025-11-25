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
    
    // Проверка на наличие выбранных контекстов
    if (!Array.isArray(prompt.selectedContexts) || prompt.selectedContexts.length === 0) {
      console.log(`У промпта нет выбранных контекстов`);
      return prompt.template || '';
    }
    
    // Создаем множество выбранных ID блоков для быстрой проверки
    const selectedBlockIds = new Set(
      prompt.selectedContexts
        .filter(selection => selection && selection.blockId)
        .map(selection => selection.blockId)
    );
    
    // Создаем карту выбранных контекстов для быстрого доступа
    const selectionsMap = new Map();
    prompt.selectedContexts.forEach(selection => {
      if (selection && selection.blockId) {
        selectionsMap.set(selection.blockId, selection);
      }
    });
    
    // Агрегируем контекст по блокам, сохраняя порядок блоков в state.contextBlocks
    const blocksContent = [];
    
    // Перебираем все блоки контекста в порядке их следования в state.contextBlocks
    state.contextBlocks.forEach(block => {
      // Пропускаем блоки, которые не выбраны
      if (!selectedBlockIds.has(block.id)) return;
      
      // Получаем данные выбора для текущего блока
      const selection = selectionsMap.get(block.id);
      if (!selection) return;
      
      let blockContent = '';
      
      if (wrapWithTags) {
        // Добавляем заголовок с именем блока контекста
        blockContent += `### ${block.title}\n`;
        // Открываем тег блока контекста
        blockContent += `<${block.title}>\n`;
        
        // Проверка на наличие массива itemIds в selection
        const selectedItemIds = Array.isArray(selection.itemIds) ? selection.itemIds : [];
        
        // Обрабатываем выбранные элементы
        const selectedItems = (block.items || []).filter(item => selectedItemIds.includes(item.id));
        selectedItems.forEach(item => {
          // Добавляем заголовок с именем элемента
          blockContent += `### ${item.title}\n`;
          // Оборачиваем элемент в теги
          blockContent += `<${item.title}>\n${item.content || ''}\n</${item.title}>\n\n`;
        });
        
        // Проверяем наличие подэлементов
        const hasSelectedSubItems = Array.isArray(selection.subItemIds) && selection.subItemIds.length > 0;
        
        // Обрабатываем выбранные подэлементы, независимо от выбора родительских элементов
        if (hasSelectedSubItems) {
          // Создаем карту всех элементов блока для быстрого доступа
          const itemsMap = new Map();
          block.items.forEach(item => {
            if (Array.isArray(item.subItems) && item.subItems.length > 0) {
              item.subItems.forEach(subItem => {
                itemsMap.set(`${item.id}.${subItem.id}`, { item, subItem });
              });
            }
          });
          
          // Обрабатываем каждый выбранный подэлемент
          selection.subItemIds.forEach(subItemFullId => {
            const itemSubItem = itemsMap.get(subItemFullId);
            if (itemSubItem) {
              const { item, subItem } = itemSubItem;
              
              // Добавляем подэлемент независимо от того, выбран родитель или нет
              // Изменено: убрано условие проверки на выбор родительского элемента
              blockContent += `#### ${subItem.title}\n`;
              blockContent += `<${subItem.title}>\n${subItem.content || ''}\n</${subItem.title}>\n\n`;
            }
          });
        }
        
        // Закрываем тег блока контекста
        blockContent += `</${block.title}>`;
      } else {
        // Обычный режим без тегов
        let itemsContent = [];
        
        // Проверка на наличие массива itemIds в selection
        const selectedItemIds = Array.isArray(selection.itemIds) ? selection.itemIds : [];
        
        // Обрабатываем выбранные элементы
        const selectedItems = (block.items || []).filter(item => selectedItemIds.includes(item.id));
        selectedItems.forEach(item => {
          // Добавляем основное содержимое элемента
          itemsContent.push(item.content || '');
        });
        
        // Проверяем наличие подэлементов
        const hasSelectedSubItems = Array.isArray(selection.subItemIds) && selection.subItemIds.length > 0;
        
        // Обрабатываем выбранные подэлементы, независимо от выбора родительских элементов
        if (hasSelectedSubItems) {
          // Создаем карту всех элементов блока для быстрого доступа
          const itemsMap = new Map();
          block.items.forEach(item => {
            if (Array.isArray(item.subItems) && item.subItems.length > 0) {
              item.subItems.forEach(subItem => {
                itemsMap.set(`${item.id}.${subItem.id}`, { item, subItem });
              });
            }
          });
          
          // Обрабатываем каждый выбранный подэлемент
          selection.subItemIds.forEach(subItemFullId => {
            const itemSubItem = itemsMap.get(subItemFullId);
            if (itemSubItem) {
              const { item, subItem } = itemSubItem;
              
              // Добавляем содержимое подэлемента независимо от того, выбран родитель или нет
              // Изменено: убрано условие проверки на выбор родительского элемента
              itemsContent.push(subItem.content || '');
            }
          });
        }
        
        // Объединяем содержимое всех выбранных элементов и подэлементов
        blockContent = itemsContent.filter(content => content.trim()).join('\n\n');
      }
      
      // Добавляем содержимое блока только если оно не пустое
      if (blockContent.trim()) {
        blocksContent.push(blockContent);
      }
    });
    
    // Объединяем содержимое всех блоков
    let contextContent = '';
    
    if (wrapWithTags && blocksContent.length > 0) {
      // Если нужно обернуть в теги и есть содержимое, добавляем общий заголовок и обертку
      contextContent = `### Context:\n<Context>\n${blocksContent.join('\n\n')}\n</Context>`;
    } else {
      // Иначе просто объединяем блоки
      contextContent = blocksContent.join('\n\n');
    }
    
    console.log(`Собран контент длиной ${contextContent.length} символов`);
    
    // Заменяем плейсхолдер на реальный контекст
    let compiledPrompt = prompt.template || '';
    
    // Используем единый плейсхолдер {{context}}
    compiledPrompt = compiledPrompt.replace(/\{\{context\}\}/g, contextContent);
    
    // Для обратной совместимости поддерживаем старый формат [КОНТЕКСТ], но в лог выводим предупреждение
    if (compiledPrompt.includes('[КОНТЕКСТ]')) {
      console.log('ВНИМАНИЕ: Используется устаревший формат плейсхолдера [КОНТЕКСТ]. Рекомендуется использовать {{context}}');
      compiledPrompt = compiledPrompt.replace(/\[КОНТЕКСТ\]/g, contextContent);
    }
    
    console.log(`Получение скомпилированного промпта для ${promptId}, символов: ${compiledPrompt.length}`);
    return compiledPrompt;
  } catch (error) {
    console.error(`Ошибка при компиляции промпта: ${error.message}`, error);
    return null;
  }
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