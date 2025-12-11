import { ContextBlock, ContextItem, ContextSubItem, PromptBlock, SelectedContext } from '@promptozaurus/shared';

/**
 * Calculate total characters in a context block
 * ВАЖНО: Если у item есть subItems, считаем только их, игнорируя item.chars
 * чтобы избежать двойного подсчета
 */
export function calculateContextBlockChars(block: ContextBlock): number {
  return block.items.reduce((sum: number, item: ContextItem) => {
    let itemSum = 0;
    
    // Если есть подэлементы, считаем только их
    if (item.subItems && item.subItems.length > 0) {
      itemSum = item.subItems.reduce((subSum: number, subItem: ContextSubItem) => subSum + (subItem.chars || 0), 0);
    } else {
      // Иначе считаем символы самого элемента
      itemSum = item.chars || 0;
    }
    
    return sum + itemSum;
  }, 0);
}

/**
 * Calculate characters in selected contexts for a prompt
 */
export function calculatePromptContextChars(
  promptBlock: PromptBlock,
  contextBlocks: ContextBlock[]
): number {
  return promptBlock.selectedContexts.reduce((acc: number, selection: SelectedContext) => {
    const block = contextBlocks.find((b) => b.id === selection.blockId);
    if (!block) return acc;

    // Count chars in selected items
    const itemsChars = block.items
      .filter((item: ContextItem) => selection.itemIds.includes(item.id))
      .reduce((sum: number, item: ContextItem) => sum + (item.chars || 0), 0);

    // Count chars in selected subitems
    let subItemsChars = 0;
    const subItemParentsMap = new Map<string, { item: ContextItem; subItem: ContextSubItem }>();
    
    block.items.forEach((item: ContextItem) => {
      if (item.subItems) {
        item.subItems.forEach((subItem: ContextSubItem) => {
          subItemParentsMap.set(`${item.id}.${subItem.id}`, { item, subItem });
        });
      }
    });

    selection.subItemIds.forEach((subItemId: string) => {
      const itemSubItem = subItemParentsMap.get(subItemId);
      if (itemSubItem) {
        subItemsChars += itemSubItem.subItem.chars || 0;
      }
    });

    return acc + itemsChars + subItemsChars;
  }, 0);
}

/**
 * Compile prompt with context substitution
 */
export function compilePrompt(
  promptBlock: PromptBlock,
  contextBlocks: ContextBlock[],
  wrapWithTags = false
): string {
  // Collect content from all selected contexts
  const blocksContent = promptBlock.selectedContexts.flatMap((selection: SelectedContext) => {
    const block = contextBlocks.find((b) => b.id === selection.blockId);
    if (!block) return [];

    // Create map for quick access to items and subitems
    const itemsMap = new Map<string, ContextItem | { parentItem: ContextItem; subItem: ContextSubItem }>();
    block.items.forEach((item: ContextItem) => {
      itemsMap.set(`item-${item.id}`, item);
      
      if (item.subItems) {
        item.subItems.forEach((subItem: ContextSubItem) => {
          itemsMap.set(`subitem-${item.id}-${subItem.id}`, {
            parentItem: item,
            subItem,
          });
        });
      }
    });

    // Collect content for this block
    const blockContents: string[] = [];

    // Add selected items
    selection.itemIds.forEach((itemId: number) => {
      const item = itemsMap.get(`item-${itemId}`);
      if (!item || typeof item === 'object' && 'parentItem' in item) return;
      const contextItem = item as ContextItem;

      if (wrapWithTags) {
        blockContents.push(`### ${contextItem.title}\n<${contextItem.title}>\n${contextItem.content || ''}\n</${contextItem.title}>`);
      } else {
        blockContents.push(contextItem.content || '');
      }
    });

    // Add selected subitems
    selection.subItemIds.forEach((subItemFullId: string) => {
      const [parentItemId, subItemId] = subItemFullId.split('.');
      
      const itemSubItem = itemsMap.get(`subitem-${parentItemId}-${subItemId}`);
      if (!itemSubItem || typeof itemSubItem === 'object' && !('parentItem' in itemSubItem)) return;

      const { parentItem, subItem } = itemSubItem as { parentItem: ContextItem; subItem: ContextSubItem };

      if (wrapWithTags) {
        blockContents.push(`#### ${subItem.title}\n<${subItem.title}>\n${subItem.content || ''}\n</${subItem.title}>`);
      } else {
        blockContents.push(subItem.content || '');
      }
    });

    // Join content of all items and subitems
    const finalContent = blockContents.filter((content: string) => content.trim()).join('\n\n');

    // Add block wrapper if needed
    if (wrapWithTags && finalContent) {
      return `### ${block.title}\n<${block.title}>\n${finalContent}\n</${block.title}>`;
    }

    return finalContent;
  }).filter((content: string) => content.trim());

  // Join content of all blocks
  let contextContent = '';

  if (wrapWithTags && blocksContent.length > 0) {
    contextContent = `### Context:\n<Context>\n${blocksContent.join('\n\n')}\n</Context>`;
  } else {
    contextContent = blocksContent.join('\n\n');
  }

  // Replace placeholder with actual context
  let compiled = promptBlock.template || '';
  if (compiled.includes('{{context}}')) {
    compiled = compiled.replace(/\{\{context\}\}/g, contextContent);
  }
  if (compiled.includes('[КОНТЕКСТ]')) {
    compiled = compiled.replace(/\[КОНТЕКСТ\]/g, contextContent);
  }

  return compiled;
}

/**
 * Update character counts in context items
 */
export function updateContextItemChars(item: ContextItem): ContextItem {
  return {
    ...item,
    chars: item.content.length,
    subItems: item.subItems.map((subItem: ContextSubItem) => ({
      ...subItem,
      chars: subItem.content.length,
    })),
  };
}

/**
 * Validate context block structure
 */
export function validateContextBlock(block: ContextBlock): boolean {
  if (!block.id || typeof block.id !== 'number') return false;
  if (!block.title || typeof block.title !== 'string') return false;
  if (!Array.isArray(block.items)) return false;

  return block.items.every((item: ContextItem) => {
    if (!item.id || typeof item.id !== 'number') return false;
    if (!item.title || typeof item.title !== 'string') return false;
    if (typeof item.content !== 'string') return false;
    if (typeof item.chars !== 'number') return false;
    if (!Array.isArray(item.subItems)) return false;

    return item.subItems.every((subItem: ContextSubItem) => {
      if (!subItem.id || typeof subItem.id !== 'number') return false;
      if (!subItem.title || typeof subItem.title !== 'string') return false;
      if (typeof subItem.content !== 'string') return false;
      if (typeof subItem.chars !== 'number') return false;
      return true;
    });
  });
}

/**
 * Validate prompt block structure
 */
export function validatePromptBlock(block: PromptBlock): boolean {
  if (!block.id || typeof block.id !== 'number') return false;
  if (!block.title || typeof block.title !== 'string') return false;
  if (typeof block.template !== 'string') return false;
  if (!Array.isArray(block.selectedContexts)) return false;

  return block.selectedContexts.every((selection: SelectedContext) => {
    if (!selection.blockId || typeof selection.blockId !== 'number') return false;
    if (!Array.isArray(selection.itemIds)) return false;
    if (!Array.isArray(selection.subItemIds)) return false;
    return true;
  });
}

