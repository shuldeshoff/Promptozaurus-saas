// src/context/utils/nameGenerators.js - Functions for generating default names
console.log('Initializing name generators');

/**
 * Функция для генерации имени по умолчанию для блока контекста
 * @param {Array} contextBlocks - Массив существующих блоков контекста
 * @returns {string} - Сгенерированное имя
 */
export const generateDefaultContextBlockName = (contextBlocks) => {
  // Находим все блоки контекста, имена которых соответствуют шаблону ContextN
  const contextNameRegex = /^Context(\d+)$/;
  const matchingBlocks = contextBlocks
    .map(block => {
      const match = block.title.match(contextNameRegex);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(num => num > 0);
  
  // Находим максимальный номер или 0, если таких блоков нет
  const maxNumber = matchingBlocks.length > 0 ? Math.max(...matchingBlocks) : 0;
  
  // Возвращаем новое имя с увеличенным номером
  const nextNumber = maxNumber + 1;
  console.log(`Generating default context block name: Context${nextNumber}`);
  return `Context${nextNumber}`;
};

/**
 * Функция для генерации имени по умолчанию для блока промпта
 * @param {Array} promptBlocks - Массив существующих блоков промптов
 * @returns {string} - Сгенерированное имя
 */
export const generateDefaultPromptBlockName = (promptBlocks) => {
  // Находим все блоки промптов, имена которых соответствуют шаблону PromptN
  const promptNameRegex = /^Prompt(\d+)$/;
  const matchingBlocks = promptBlocks
    .map(block => {
      const match = block.title.match(promptNameRegex);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(num => num > 0);
  
  // Находим максимальный номер или 0, если таких блоков нет
  const maxNumber = matchingBlocks.length > 0 ? Math.max(...matchingBlocks) : 0;
  
  // Возвращаем новое имя с увеличенным номером
  const nextNumber = maxNumber + 1;
  console.log(`Generating default prompt block name: Prompt${nextNumber}`);
  return `Prompt${nextNumber}`;
};

/**
 * Функция для генерации имени элемента контекста на основе предыдущего элемента
 * @param {Object} block - Блок контекста
 * @returns {string} - Сгенерированное имя
 */
export const generateDefaultContextItemName = (block) => {
  if (!block || !block.items || block.items.length === 0) {
    console.log('No previous items, returning "Item1"');
    return 'Item1';
  }
  
  // Сортируем элементы по id, чтобы получить последний добавленный элемент
  const sortedItems = [...block.items].sort((a, b) => b.id - a.id);
  const lastItem = sortedItems[0];
  
  // Пытаемся найти числовую часть в имени последнего элемента
  const match = lastItem.title.match(/^(.*?)(\d+)$/);
  if (match) {
    const [, prefix, numberStr] = match;
    const nextNumber = parseInt(numberStr, 10) + 1;
    const newName = `${prefix}${nextNumber}`;
    console.log(`Generating default context item name based on "${lastItem.title}": ${newName}`);
    return newName;
  }
  
  // Если не удалось найти числовую часть, добавляем " 2" к имени
  const newName = `${lastItem.title} 2`;
  console.log(`Could not find numeric part in "${lastItem.title}", returning: ${newName}`);
  return newName;
};

/**
 * Функция для генерации имени подэлемента контекста на основе предыдущего подэлемента
 * @param {Object} item - Элемент контекста, содержащий подэлементы
 * @returns {string} - Сгенерированное имя
 */
export const generateDefaultContextSubItemName = (item) => {
  if (!item || !item.subItems || item.subItems.length === 0) {
    console.log('No previous subitems, returning "SubItem1"');
    return 'SubItem1';
  }
  
  // Сортируем подэлементы по id, чтобы получить последний добавленный
  const sortedSubItems = [...item.subItems].sort((a, b) => b.id - a.id);
  const lastSubItem = sortedSubItems[0];
  
  // Пытаемся найти числовую часть в имени последнего подэлемента
  const match = lastSubItem.title.match(/^(.*?)(\d+)$/);
  if (match) {
    const [, prefix, numberStr] = match;
    const nextNumber = parseInt(numberStr, 10) + 1;
    const newName = `${prefix}${nextNumber}`;
    console.log(`Generating default context subitem name based on "${lastSubItem.title}": ${newName}`);
    return newName;
  }
  
  // Если не удалось найти числовую часть, добавляем " 2" к имени
  const newName = `${lastSubItem.title} 2`;
  console.log(`Could not find numeric part in "${lastSubItem.title}", returning: ${newName}`);
  return newName;
};