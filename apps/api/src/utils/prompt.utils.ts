import { ContextBlock, ContextItem, ContextSubItem, PromptBlock, SelectedContext } from '@promptozaurus/shared';

/**
 * Calculate total characters in a context block
 */
export function calculateContextBlockChars(block: ContextBlock): number {
  return block.items.reduce((sum, item) => {
    let itemSum = item.chars || 0;
    
    if (item.subItems && item.subItems.length > 0) {
      itemSum += item.subItems.reduce((subSum, subItem) => subSum + (subItem.chars || 0), 0);
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
  return promptBlock.selectedContexts.reduce((acc, selection) => {
    const block = contextBlocks.find((b) => b.id === selection.blockId);
    if (!block) return acc;

    // Count chars in selected items
    const itemsChars = block.items
      .filter((item) => selection.itemIds.includes(item.id))
      .reduce((sum, item) => sum + (item.chars || 0), 0);

    // Count chars in selected subitems
    let subItemsChars = 0;
    const subItemParentsMap = new Map<string, { item: ContextItem; subItem: ContextSubItem }>();
    
    block.items.forEach((item) => {
      if (item.subItems) {
        item.subItems.forEach((subItem) => {
          subItemParentsMap.set(`${item.id}.${subItem.id}`, { item, subItem });
        });
      }
    });

    selection.subItemIds.forEach((subItemId) => {
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
  const blocksContent = promptBlock.selectedContexts.flatMap((selection) => {
    const block = contextBlocks.find((b) => b.id === selection.blockId);
    if (!block) return [];

    // Create map for quick access to items and subitems
    const itemsMap = new Map<string, any>();
    block.items.forEach((item) => {
      itemsMap.set(`item-${item.id}`, item);
      
      if (item.subItems) {
        item.subItems.forEach((subItem) => {
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
    selection.itemIds.forEach((itemId) => {
      const item = itemsMap.get(`item-${itemId}`);
      if (!item) return;

      if (wrapWithTags) {
        blockContents.push(`### ${item.title}\n<${item.title}>\n${item.content || ''}\n</${item.title}>`);
      } else {
        blockContents.push(item.content || '');
      }
    });

    // Add selected subitems
    selection.subItemIds.forEach((subItemFullId) => {
      const [parentItemId, subItemId] = subItemFullId.split('.');
      
      const itemSubItem = itemsMap.get(`subitem-${parentItemId}-${subItemId}`);
      if (!itemSubItem) return;

      const { parentItem, subItem } = itemSubItem;

      if (wrapWithTags) {
        blockContents.push(`#### ${subItem.title}\n<${subItem.title}>\n${subItem.content || ''}\n</${subItem.title}>`);
      } else {
        blockContents.push(subItem.content || '');
      }
    });

    // Join content of all items and subitems
    const finalContent = blockContents.filter((content) => content.trim()).join('\n\n');

    // Add block wrapper if needed
    if (wrapWithTags && finalContent) {
      return `### ${block.title}\n<${block.title}>\n${finalContent}\n</${block.title}>`;
    }

    return finalContent;
  }).filter((content) => content.trim());

  // Join content of all blocks
  let contextContent = '';

  if (wrapWithTags && blocksContent.length > 0) {
    contextContent = `### Context:\n<Context>\n${blocksContent.join('\n\n')}\n</Context>`;
  } else {
    contextContent = blocksContent.join('\n\n');
  }

  // Replace placeholder with actual context
  let compiled = promptBlock.template || '';
  
  // Support multiple placeholder formats
  if (compiled.includes('{context}')) {
    compiled = compiled.replace(/\{context\}/g, contextContent);
  }
  if (compiled.includes('{{context}}')) {
    compiled = compiled.replace(/\{\{context\}\}/g, contextContent);
  }
  if (compiled.includes('[КОНТЕКСТ]')) {
    compiled = compiled.replace(/\[КОНТЕКСТ\]/g, contextContent);
  }
  if (compiled.includes('[контекст]')) {
    compiled = compiled.replace(/\[контекст\]/g, contextContent);
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
    subItems: item.subItems.map((subItem) => ({
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

  return block.items.every((item) => {
    if (!item.id || typeof item.id !== 'number') return false;
    if (!item.title || typeof item.title !== 'string') return false;
    if (typeof item.content !== 'string') return false;
    if (typeof item.chars !== 'number') return false;
    if (!Array.isArray(item.subItems)) return false;

    return item.subItems.every((subItem) => {
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

  return block.selectedContexts.every((selection) => {
    if (!selection.blockId || typeof selection.blockId !== 'number') return false;
    if (!Array.isArray(selection.itemIds)) return false;
    if (!Array.isArray(selection.subItemIds)) return false;
    return true;
  });
}

