// components/context-selection/ContextSelectionPanel.tsx - Main context selection panel
import { useState, useCallback, useMemo, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDragSelect } from '../../hooks/useDragSelect';
import ContextSectionGrid from './ContextSectionGrid';
import { ContextBlock, SelectedContext } from '@promptozaurus/shared';

/**
 * Parses tile key and returns its components
 * Format: "blockId-itemId" or "blockId-itemId-subItemId"
 */
const parseItemKey = (key: string) => {
  const parts = key.split('-').map(Number);
  return {
    blockId: parts[0],
    itemId: parts[1],
    subItemId: parts.length > 2 ? parts[2] : null,
  };
};

/**
 * Converts internal selection state to selectedContexts format
 */
const convertToSelectedContexts = (selectionOrder: string[], _contextBlocks: ContextBlock[]): SelectedContext[] => {
  const blocksMap = new Map<number, { blockId: number; itemIds: number[]; subItemIds: string[] }>();

  selectionOrder.forEach(key => {
    const { blockId, itemId, subItemId } = parseItemKey(key);

    if (!blocksMap.has(blockId)) {
      blocksMap.set(blockId, { blockId, itemIds: [], subItemIds: [] });
    }

    const blockData = blocksMap.get(blockId)!;

    if (subItemId !== null) {
      const subKey = `${itemId}.${subItemId}`;
      if (!blockData.subItemIds.includes(subKey)) {
        blockData.subItemIds.push(subKey);
      }
    } else {
      if (!blockData.itemIds.includes(itemId)) {
        blockData.itemIds.push(itemId);
      }
    }
  });

  return Array.from(blocksMap.values());
};

/**
 * Initializes selectionOrder from existing selectedContexts
 */
const initSelectionOrderFromContexts = (selectedContexts: SelectedContext[], _contextBlocks: ContextBlock[]): string[] => {
  const order: string[] = [];

  if (!Array.isArray(selectedContexts)) return order;

  selectedContexts.forEach(sel => {
    if (!sel || !sel.blockId) return;

    // Add selected items
    if (Array.isArray(sel.itemIds)) {
      sel.itemIds.forEach(itemId => {
        order.push(`${sel.blockId}-${itemId}`);
      });
    }

    // Add selected subItems
    if (Array.isArray(sel.subItemIds)) {
      sel.subItemIds.forEach(subItemKey => {
        const [itemId, subItemId] = subItemKey.split('.');
        order.push(`${sel.blockId}-${itemId}-${subItemId}`);
      });
    }
  });

  return order;
};

export interface ContextSelectionPanelRef {
  selectAll: () => void;
  clearSelection: () => void;
  getSelectionCount: () => number;
}

interface ContextSelectionPanelProps {
  contextBlocks: ContextBlock[];
  selectedContexts: SelectedContext[];
  selectionOrder?: string[];
  onSelectionChange: (selectedContexts: SelectedContext[], selectionOrder: string[]) => void;
  totalChars?: number;
}

/**
 * Main context selection panel with drag-select
 */
const ContextSelectionPanel = forwardRef<ContextSelectionPanelRef, ContextSelectionPanelProps>(({
  contextBlocks,
  selectedContexts,
  selectionOrder: initialSelectionOrder,
  onSelectionChange,
  totalChars = 0,
}, ref) => {
  const { t } = useTranslation('contextSelection');
  const [selectionOrder, setSelectionOrder] = useState<string[]>(() =>
    Array.isArray(initialSelectionOrder) && initialSelectionOrder.length > 0
      ? initialSelectionOrder
      : initSelectionOrderFromContexts(selectedContexts, contextBlocks)
  );
  const [copySuccess, setCopySuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync when selectionOrder changes from outside
  useEffect(() => {
    if (Array.isArray(initialSelectionOrder) && initialSelectionOrder.length > 0) {
      setSelectionOrder(initialSelectionOrder);
    } else {
      const newOrder = initSelectionOrderFromContexts(selectedContexts, contextBlocks);
      setSelectionOrder(newOrder);
    }
  }, [initialSelectionOrder, selectedContexts, contextBlocks]);

  // Handle selection change
  const handleSelectionChange = useCallback((itemKey: string, isSelected: boolean) => {
    setSelectionOrder(prevOrder => {
      let newOrder: string[];

      if (isSelected) {
        // Add to end of list
        newOrder = prevOrder.includes(itemKey) ? prevOrder : [...prevOrder, itemKey];
      } else {
        // Remove from list
        newOrder = prevOrder.filter(k => k !== itemKey);
      }

      // Call callback with new state and selection order
      const newSelectedContexts = convertToSelectedContexts(newOrder, contextBlocks);
      onSelectionChange(newSelectedContexts, newOrder);

      return newOrder;
    });
  }, [contextBlocks, onSelectionChange]);

  // Drag-select hook
  const { isDragging, handleMouseDown, handleMouseEnter } = useDragSelect(handleSelectionChange);

  // Sets for quick check of selected elements
  const { selectedItemsMap, selectedSubItemsMap, selectionOrderMap } = useMemo(() => {
    const itemsMap = new Map<number, Set<number>>();
    const subItemsMap = new Map<number, Set<string>>();
    const orderMap = new Map<string, number>();

    selectionOrder.forEach((key, index) => {
      const { blockId, itemId, subItemId } = parseItemKey(key);
      orderMap.set(key, index + 1);

      if (subItemId !== null) {
        if (!subItemsMap.has(blockId)) subItemsMap.set(blockId, new Set());
        subItemsMap.get(blockId)!.add(`${itemId}.${subItemId}`);
      } else {
        if (!itemsMap.has(blockId)) itemsMap.set(blockId, new Set());
        itemsMap.get(blockId)!.add(itemId);
      }
    });

    return { selectedItemsMap: itemsMap, selectedSubItemsMap: subItemsMap, selectionOrderMap: orderMap };
  }, [selectionOrder]);

  // Select all in section
  const handleSelectAll = useCallback((blockId: number) => {
    const block = contextBlocks.find(b => b.id === blockId);
    if (!block) return;

    setSelectionOrder(prevOrder => {
      const newOrder = [...prevOrder];

      block.items.forEach(item => {
        const itemKey = `${blockId}-${item.id}`;
        const hasContent = typeof item.chars === 'number' ? item.chars > 0 : (item.content && item.content.length > 0);

        if (hasContent && !newOrder.includes(itemKey)) {
          newOrder.push(itemKey);
        }

        if (Array.isArray(item.subItems)) {
          item.subItems.forEach(sub => {
            const subKey = `${blockId}-${item.id}-${sub.id}`;
            if ((sub.chars || 0) > 0 && !newOrder.includes(subKey)) {
              newOrder.push(subKey);
            }
          });
        }
      });

      const newSelectedContexts = convertToSelectedContexts(newOrder, contextBlocks);
      onSelectionChange(newSelectedContexts, newOrder);

      return newOrder;
    });
  }, [contextBlocks, onSelectionChange]);

  // Deselect in section
  const handleDeselectAll = useCallback((blockId: number) => {
    setSelectionOrder(prevOrder => {
      const newOrder = prevOrder.filter(key => {
        const { blockId: keyBlockId } = parseItemKey(key);
        return keyBlockId !== blockId;
      });

      const newSelectedContexts = convertToSelectedContexts(newOrder, contextBlocks);
      onSelectionChange(newSelectedContexts, newOrder);

      return newOrder;
    });
  }, [contextBlocks, onSelectionChange]);

  // Select all sub-elements of specific element
  const handleSelectAllSubItems = useCallback((blockId: number, itemId: number) => {
    const block = contextBlocks.find(b => b.id === blockId);
    if (!block) return;

    const item = block.items.find(i => i.id === itemId);
    if (!item || !Array.isArray(item.subItems)) return;

    setSelectionOrder(prevOrder => {
      const newOrder = [...prevOrder];

      item.subItems.forEach(sub => {
        const subKey = `${blockId}-${itemId}-${sub.id}`;
        if ((sub.chars || 0) > 0 && !newOrder.includes(subKey)) {
          newOrder.push(subKey);
        }
      });

      const newSelectedContexts = convertToSelectedContexts(newOrder, contextBlocks);
      onSelectionChange(newSelectedContexts, newOrder);

      return newOrder;
    });
  }, [contextBlocks, onSelectionChange]);

  // Deselect all sub-elements of specific element
  const handleDeselectAllSubItems = useCallback((blockId: number, itemId: number) => {
    setSelectionOrder(prevOrder => {
      const newOrder = prevOrder.filter(key => {
        const { blockId: keyBlockId, itemId: keyItemId, subItemId } = parseItemKey(key);
        // Remove only sub-elements of this item
        return !(keyBlockId === blockId && keyItemId === itemId && subItemId !== null);
      });

      const newSelectedContexts = convertToSelectedContexts(newOrder, contextBlocks);
      onSelectionChange(newSelectedContexts, newOrder);

      return newOrder;
    });
  }, [contextBlocks, onSelectionChange]);

  // Clear all selection
  const handleClearAll = useCallback(() => {
    setSelectionOrder([]);
    onSelectionChange([], []);
  }, [onSelectionChange]);

  // Select all elements in all blocks
  const handleSelectAllGlobal = useCallback(() => {
    const newOrder: string[] = [];

    contextBlocks.forEach(block => {
      block.items.forEach(item => {
        const itemKey = `${block.id}-${item.id}`;
        const hasContent = typeof item.chars === 'number' ? item.chars > 0 : (item.content && item.content.length > 0);

        if (hasContent) {
          newOrder.push(itemKey);
        }

        if (Array.isArray(item.subItems)) {
          item.subItems.forEach(sub => {
            const subKey = `${block.id}-${item.id}-${sub.id}`;
            if ((sub.chars || 0) > 0) {
              newOrder.push(subKey);
            }
          });
        }
      });
    });

    setSelectionOrder(newOrder);
    const newSelectedContexts = convertToSelectedContexts(newOrder, contextBlocks);
    onSelectionChange(newSelectedContexts, newOrder);
  }, [contextBlocks, onSelectionChange]);

  // Export methods via ref for use from parent component
  useImperativeHandle(ref, () => ({
    selectAll: handleSelectAllGlobal,
    clearSelection: handleClearAll,
    getSelectionCount: () => selectionOrder.length,
  }), [handleSelectAllGlobal, handleClearAll, selectionOrder.length]);

  // Copying
  const handleCopy = useCallback(async () => {
    // Collect content from selected elements
    const contents: string[] = [];

    selectionOrder.forEach(key => {
      const { blockId, itemId, subItemId } = parseItemKey(key);
      const block = contextBlocks.find(b => b.id === blockId);
      if (!block) return;

      const item = block.items.find(i => i.id === itemId);
      if (!item) return;

      if (subItemId !== null) {
        const subItem = item.subItems?.find(s => s.id === subItemId);
        if (subItem && subItem.content) {
          contents.push(subItem.content);
        }
      } else if (item.content) {
        contents.push(item.content);
      }
    });

    const text = contents.join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [selectionOrder, contextBlocks]);

  return (
    <div
      ref={containerRef}
      className={`${isDragging ? 'cs-dragging' : ''}`}
    >
      {/* Sections with context blocks */}
      {contextBlocks.map(block => (
        <ContextSectionGrid
          key={block.id}
          contextBlock={block}
          selectedItems={selectedItemsMap.get(block.id) || new Set()}
          selectedSubItems={selectedSubItemsMap.get(block.id) || new Set()}
          selectionOrderMap={selectionOrderMap}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onSelectAllSubItems={handleSelectAllSubItems}
          onDeselectAllSubItems={handleDeselectAllSubItems}
        />
      ))}

      {contextBlocks.length === 0 && (
        <div className="cs-preview__empty">{t('contextSelection:noContextBlocks')}</div>
      )}

      {/* Statistics preview panel */}
      <div className="cs-preview">
        <div className="cs-preview__header">
          <span className="cs-preview__title">{t('contextSelection:preview')}</span>
          <div className="cs-preview__stats">
            <span>{selectionOrder.length} {t('contextSelection:selected')}</span>
            <span>{totalChars.toLocaleString()} {t('contextSelection:characters')}</span>
            <button
              className={`cs-copy-btn ${copySuccess ? 'cs-copy-btn--success' : ''}`}
              onClick={handleCopy}
              disabled={selectionOrder.length === 0}
            >
              {copySuccess ? t('contextSelection:copied') : t('contextSelection:copyContext')}
            </button>
          </div>
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="cs-actions">
        <button className="cs-action-btn cs-action-btn--primary" onClick={handleSelectAllGlobal}>
          {t('contextSelection:selectAllGlobal')}
        </button>
        {selectionOrder.length > 0 && (
          <button className="cs-action-btn" onClick={handleClearAll}>
            {t('contextSelection:clearSelection')}
          </button>
        )}
      </div>

    </div>
  );
});

ContextSelectionPanel.displayName = 'ContextSelectionPanel';

export default ContextSelectionPanel;

