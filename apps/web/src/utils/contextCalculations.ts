import type { ContextBlock, SelectedContext } from '@promptozaurus/shared';

/**
 * Подсчитывает общее количество символов в выбранных контекстах
 */
export function calculateSelectedContextsChars(
  selectedContexts: SelectedContext[],
  contextBlocks: ContextBlock[]
): number {
  let totalChars = 0;

  if (!Array.isArray(selectedContexts) || !Array.isArray(contextBlocks)) {
    return 0;
  }

  selectedContexts.forEach((selection) => {
    const block = contextBlocks.find((b) => b.id === selection.blockId);
    if (!block) return;

    // Подсчёт символов в выбранных items
    if (Array.isArray(selection.itemIds)) {
      selection.itemIds.forEach((itemId) => {
        const item = block.items.find((i) => i.id === itemId);
        if (item) {
          totalChars += item.chars || 0;
        }
      });
    }

    // Подсчёт символов в выбранных sub-items
    if (Array.isArray(selection.subItemIds)) {
      selection.subItemIds.forEach((subItemKey) => {
        const [itemIdStr, subItemIdStr] = subItemKey.split('.');
        const itemId = parseInt(itemIdStr, 10);
        const subItemId = parseInt(subItemIdStr, 10);

        const item = block.items.find((i) => i.id === itemId);
        if (item && Array.isArray(item.subItems)) {
          const subItem = item.subItems.find((s) => s.id === subItemId);
          if (subItem) {
            totalChars += subItem.chars || 0;
          }
        }
      });
    }
  });

  return totalChars;
}

