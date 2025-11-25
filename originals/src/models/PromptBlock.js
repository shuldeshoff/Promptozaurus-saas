// src/models/PromptBlock.js

class PromptBlock {
  /**
   * Создает новый блок промпта
   * @param {number} id - Идентификатор блока
   * @param {string} title - Заголовок блока
   * @param {string} template - Шаблон промпта
   * @param {Array} selectedContexts - Массив выбранных контекстов
   * @param {string|null} templateFilename - Имя .txt-файла (чтобы не терять связь при редактировании)
   */
  constructor(
    id,
    title = 'Новый промпт',
    template = '',
    selectedContexts = [],
    templateFilename = null
  ) {
    this.id = id;
    this.title = title;
    this.template = template;
    
    // Обработка выбранных контекстов - убедимся, что все имеют поле subItemIds
    this.selectedContexts = Array.isArray(selectedContexts) ? selectedContexts.map(sel => ({
      ...sel,
      itemIds: Array.isArray(sel.itemIds) ? sel.itemIds : [],
      subItemIds: Array.isArray(sel.subItemIds) ? sel.subItemIds : []
    })) : [];
    
    this.templateFilename = templateFilename; // Связь с файлом шаблона
    
    console.log(`Создан новый блок промпта: ${title} (id: ${id}), файл шаблона: ${templateFilename}`);
  }

  /**
   * Компилирует промпт с заменой плейсхолдеров контекстом
   * @param {Array} contextBlocks - Массив всех блоков контекста
   * @param {boolean} wrapWithTags - Обернуть ли контекст тегами
   * @returns {string} - Скомпилированный промпт
   */
  compilePrompt(contextBlocks, wrapWithTags = false) {
    console.log(`Компиляция промпта: ${this.title}, wrapWithTags=${wrapWithTags}`);
    
    // Проверяем, что массивы существуют
    if (!Array.isArray(this.selectedContexts) || !Array.isArray(contextBlocks)) {
      console.error('Отсутствуют необходимые данные для компиляции промпта');
      return this.template || '';
    }
    
    // Собираем содержимое всех выбранных контекстов
    const blocksContent = this.selectedContexts.flatMap(selection => {
      const block = contextBlocks.find(b => b.id === selection.blockId);
      if (!block || !Array.isArray(block.items)) return [];

      // Проверяем наличие необходимых полей
      const itemIds = Array.isArray(selection.itemIds) ? selection.itemIds : [];
      const subItemIds = Array.isArray(selection.subItemIds) ? selection.subItemIds : [];
      
      // Создаем карту для быстрого доступа к элементам и подэлементам
      const itemsMap = new Map();
      block.items.forEach(item => {
        // Запоминаем сам элемент
        itemsMap.set(`item-${item.id}`, item);
        
        // Запоминаем его подэлементы
        if (Array.isArray(item.subItems)) {
          item.subItems.forEach(subItem => {
            itemsMap.set(`subitem-${item.id}-${subItem.id}`, { 
              parentItem: item, 
              subItem 
            });
          });
        }
      });
      
      // Соберем содержимое для этого блока
      let blockContents = [];
      
      // Добавляем выбранные элементы
      itemIds.forEach(itemId => {
        const item = itemsMap.get(`item-${itemId}`);
        if (!item) return;
        
        if (wrapWithTags) {
          blockContents.push(`### ${item.title}\n<${item.title}>\n${item.content || ''}\n</${item.title}>`);
        } else {
          blockContents.push(item.content || '');
        }
      });
      
      // Добавляем выбранные подэлементы (независимо от того, выбраны родительские элементы или нет)
      subItemIds.forEach(subItemFullId => {
        // Идентификатор подэлемента имеет формат "itemId.subItemId"
        const [parentItemId, subItemId] = subItemFullId.split('.');
        
        // Изменено: убрано условие пропуска подэлементов, чьи родители уже выбраны
        
        const itemSubItem = itemsMap.get(`subitem-${parentItemId}-${subItemId}`);
        if (!itemSubItem) return;
        
        const { parentItem, subItem } = itemSubItem;
        
        if (wrapWithTags) {
          blockContents.push(`#### ${subItem.title}\n<${subItem.title}>\n${subItem.content || ''}\n</${subItem.title}>`);
        } else {
          blockContents.push(subItem.content || '');
        }
      });
      
      // Объединяем содержимое всех элементов и подэлементов
      const finalContent = blockContents.filter(content => content.trim()).join('\n\n');
      
      // Добавляем обертку блока, если нужно
      if (wrapWithTags && finalContent) {
        return `### ${block.title}\n<${block.title}>\n${finalContent}\n</${block.title}>`;
      }
      
      return finalContent;
    }).filter(content => content.trim());
    
    // Объединяем содержимое всех блоков
    let contextContent = '';
    
    if (wrapWithTags && blocksContent.length > 0) {
      // Если нужно обернуть в теги и есть содержимое, добавляем общий заголовок и обертку
      contextContent = `### Context:\n<Context>\n${blocksContent.join('\n\n')}\n</Context>`;
    } else {
      // Иначе просто объединяем блоки
      contextContent = blocksContent.join('\n\n');
    }
    
    // Заменяем плейсхолдер на реальный контекст
    let compiled = this.template || '';
    if (compiled.includes('{{context}}')) {
      compiled = compiled.replace(/\{\{context\}\}/g, contextContent);
    }
    if (compiled.includes('[КОНТЕКСТ]')) {
      console.warn('Используется устаревший плейсхолдер [КОНТЕКСТ], рекомендовано {{context}}');
      compiled = compiled.replace(/\[КОНТЕКСТ\]/g, contextContent);
    }

    return compiled;
  }

  /**
   * Вычисляет общее количество символов выбранных контекстов
   * @param {Array} contextBlocks - Массив всех блоков контекста
   * @returns {number} - Количество символов
   */
  getSelectedContextsChars(contextBlocks) {
    // Проверяем, что массивы существуют
    if (!Array.isArray(this.selectedContexts) || !Array.isArray(contextBlocks)) {
      console.error('Отсутствуют необходимые данные для подсчета символов');
      return 0;
    }
    
    const total = this.selectedContexts.reduce((acc, selection) => {
      // Проверка на наличие необходимых полей
      if (!selection || !selection.blockId) return acc;
      
      const block = contextBlocks.find(b => b.id === selection.blockId);
      if (!block || !Array.isArray(block.items)) return acc;

      // Проверяем наличие необходимых полей
      const itemIds = Array.isArray(selection.itemIds) ? selection.itemIds : [];
      const subItemIds = Array.isArray(selection.subItemIds) ? selection.subItemIds : [];
      
      // Подсчет символов в выбранных элементах
      const itemsChars = block.items
        .filter(item => itemIds.includes(item.id))
        .reduce((sum, item) => sum + (item.chars || 0), 0);
      
      // Подсчет символов в выбранных подэлементах
      // Изменено: считаем все выбранные подэлементы независимо от выбора родителя
      let subItemsChars = 0;
      
      // Собираем карту с родительскими элементами для каждого подэлемента
      const subItemParentsMap = new Map();
      block.items.forEach(item => {
        if (Array.isArray(item.subItems)) {
          item.subItems.forEach(subItem => {
            subItemParentsMap.set(`${item.id}.${subItem.id}`, { item, subItem });
          });
        }
      });
      
      // Считаем символы в выбранных подэлементах
      subItemIds.forEach(subItemId => {
        const itemSubItem = subItemParentsMap.get(subItemId);
        if (!itemSubItem) return;
        
        const { item, subItem } = itemSubItem;
        
        // Изменено: убрано условие пропуска подэлементов, родители которых уже выбраны
        // Всегда учитываем символы выбранных подэлементов
        subItemsChars += subItem.chars || 0;
      });
      
      return acc + itemsChars + subItemsChars;
    }, 0);

    console.log(`Количество символов в выбранных контекстах промпта "${this.title}": ${total}`);
    return total;
  }

  /**
   * Проверяет, выбран ли блок контекста
   * @param {number} blockId - Идентификатор блока контекста
   * @returns {boolean} - Результат проверки
   */
  isContextBlockSelected(blockId) {
    return Array.isArray(this.selectedContexts) && 
           this.selectedContexts.some(sel => sel && sel.blockId === blockId);
  }

  /**
   * Проверяет, выбран ли элемент контекста
   * @param {number} blockId - Идентификатор блока контекста
   * @param {number} itemId - Идентификатор элемента контекста
   * @returns {boolean} - Результат проверки
   */
  isContextItemSelected(blockId, itemId) {
    if (!Array.isArray(this.selectedContexts)) return false;
    
    const selection = this.selectedContexts.find(sel => sel && sel.blockId === blockId);
    return selection && Array.isArray(selection.itemIds) && selection.itemIds.includes(itemId);
  }

  /**
   * Обновляет выбор контекстов
   * @param {Array} selectedContexts - Новый массив выбранных контекстов
   */
  updateSelectedContexts(selectedContexts) {
    console.log(`Обновление выбранных контекстов для промпта "${this.title}"`);
    
    // Проверяем и нормализуем данные перед обновлением
    if (Array.isArray(selectedContexts)) {
      this.selectedContexts = selectedContexts.map(sel => ({
        ...sel,
        itemIds: Array.isArray(sel.itemIds) ? sel.itemIds : [],
        subItemIds: Array.isArray(sel.subItemIds) ? sel.subItemIds : []
      }));
    } else {
      console.warn('Получен некорректный формат данных для selectedContexts');
      this.selectedContexts = [];
    }
  }
}

export default PromptBlock;