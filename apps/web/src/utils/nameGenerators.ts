import type { ContextBlock, PromptBlock } from '@promptozaurus/shared';

/**
 * Генерирует имя по умолчанию для блока контекста
 * @param contextBlocks - Массив существующих блоков контекста
 * @returns Сгенерированное имя (Context1, Context2...)
 */
export function generateDefaultContextBlockName(contextBlocks: ContextBlock[]): string {
  const contextNameRegex = /^Context(\d+)$/;
  const matchingBlocks = contextBlocks
    .map((block) => {
      const match = block.title.match(contextNameRegex);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((num) => num > 0);

  const maxNumber = matchingBlocks.length > 0 ? Math.max(...matchingBlocks) : 0;
  const nextNumber = maxNumber + 1;

  return `Context${nextNumber}`;
}

/**
 * Генерирует имя по умолчанию для блока промпта
 * @param promptBlocks - Массив существующих блоков промптов
 * @returns Сгенерированное имя (Prompt1, Prompt2...)
 */
export function generateDefaultPromptBlockName(promptBlocks: PromptBlock[]): string {
  const promptNameRegex = /^Prompt(\d+)$/;
  const matchingBlocks = promptBlocks
    .map((block) => {
      const match = block.title.match(promptNameRegex);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((num) => num > 0);

  const maxNumber = matchingBlocks.length > 0 ? Math.max(...matchingBlocks) : 0;
  const nextNumber = maxNumber + 1;

  return `Prompt${nextNumber}`;
}

/**
 * Генерирует имя элемента контекста на основе предыдущего элемента
 * @param block - Блок контекста
 * @returns Сгенерированное имя (Item1, Item2...)
 */
export function generateDefaultContextItemName(block: ContextBlock): string {
  if (!block.items || block.items.length === 0) {
    return 'Item1';
  }

  const sortedItems = [...block.items].sort((a, b) => b.id - a.id);
  const lastItem = sortedItems[0];

  const match = lastItem.title.match(/^(.*?)(\d+)$/);
  if (match) {
    const [, prefix, numberStr] = match;
    const nextNumber = parseInt(numberStr, 10) + 1;
    return `${prefix}${nextNumber}`;
  }

  return `${lastItem.title} 2`;
}

/**
 * Генерирует имя подэлемента контекста на основе предыдущего подэлемента
 * @param item - Элемент контекста, содержащий подэлементы
 * @returns Сгенерированное имя (SubItem1, SubItem2...)
 */
export function generateDefaultContextSubItemName(item: any): string {
  if (!item.subItems || item.subItems.length === 0) {
    return 'SubItem1';
  }

  const sortedSubItems = [...item.subItems].sort((a: any, b: any) => b.id - a.id);
  const lastSubItem = sortedSubItems[0];

  const match = lastSubItem.title.match(/^(.*?)(\d+)$/);
  if (match) {
    const [, prefix, numberStr] = match;
    const nextNumber = parseInt(numberStr, 10) + 1;
    return `${prefix}${nextNumber}`;
  }

  return `${lastSubItem.title} 2`;
}

