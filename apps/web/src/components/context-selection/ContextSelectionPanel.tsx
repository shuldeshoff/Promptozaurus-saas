import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useDragSelect } from '../../hooks/useDragSelect';
import ContextSectionGrid from './ContextSectionGrid';
import type { ContextBlock } from '@promptozaurus/shared';

interface SelectedContext {
  blockId: number;
  itemIds: number[];
  subItemIds: string[]; // format: "itemId.subItemId"
}

interface ContextSelectionPanelProps {
  contextBlocks: ContextBlock[];
  selectedContexts: SelectedContext[];
  selectionOrder?: string[];
  onSelectionChange: (
    selectedContexts: SelectedContext[],
    selectionOrder: string[]
  ) => void;
  totalChars?: number;
}

export interface ContextSelectionPanelRef {
  selectAll: () => void;
  clearSelection: () => void;
  getSelectionCount: () => number;
}

/**
 * Parse tile key and return its components
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
 * Convert internal selection state to selectedContexts format
 */
const convertToSelectedContexts = (
  selectionOrder: string[]
): SelectedContext[] => {
  const blocksMap = new Map<
    number,
    { blockId: number; itemIds: number[]; subItemIds: string[] }
  >();

  selectionOrder.forEach((key) => {
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
 * Initialize selectionOrder from existing selectedContexts
 */
const initSelectionOrderFromContexts = (
  selectedContexts: SelectedContext[]
): string[] => {
  const order: string[] = [];

  if (!Array.isArray(selectedContexts)) return order;

  selectedContexts.forEach((sel) => {
    if (!sel || !sel.blockId) return;

    // Add selected items
    if (Array.isArray(sel.itemIds)) {
      sel.itemIds.forEach((itemId) => {
        order.push(`${sel.blockId}-${itemId}`);
      });
    }

    // Add selected subItems
    if (Array.isArray(sel.subItemIds)) {
      sel.subItemIds.forEach((subItemKey) => {
        const [itemId, subItemId] = subItemKey.split('.');
        order.push(`${sel.blockId}-${itemId}-${subItemId}`);
      });
    }
  });

  return order;
};

/**
 * Main context selection panel with drag-select
 */
const ContextSelectionPanel = forwardRef<
  ContextSelectionPanelRef,
  ContextSelectionPanelProps
>(
  (
    {
      contextBlocks,
      selectedContexts,
      selectionOrder: initialSelectionOrder,
      onSelectionChange,
      totalChars = 0,
    },
    ref
  ) => {
    const { t } = useTranslation('contextSelection');
    const [selectionOrder, setSelectionOrder] = useState<string[]>(() =>
      Array.isArray(initialSelectionOrder) && initialSelectionOrder.length > 0
        ? initialSelectionOrder
        : initSelectionOrderFromContexts(selectedContexts)
    );
    const [copySuccess, setCopySuccess] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync when selectionOrder changes from outside
    useEffect(() => {
      if (
        Array.isArray(initialSelectionOrder) &&
        initialSelectionOrder.length > 0
      ) {
        setSelectionOrder(initialSelectionOrder);
      } else {
        const newOrder = initSelectionOrderFromContexts(
          selectedContexts
        );
        setSelectionOrder(newOrder);
      }
    }, [initialSelectionOrder, selectedContexts]);

    // Selection change handler
    const handleSelectionChange = useCallback(
      (itemKey: string, isSelected: boolean) => {
        setSelectionOrder((prevOrder) => {
          let newOrder: string[];

          if (isSelected) {
            // Add to end of list
            newOrder = prevOrder.includes(itemKey)
              ? prevOrder
              : [...prevOrder, itemKey];
          } else {
            // Remove from list
            newOrder = prevOrder.filter((k) => k !== itemKey);
          }

          // Call callback with new state and selection order
          const newSelectedContexts = convertToSelectedContexts(
            newOrder
          );
          onSelectionChange(newSelectedContexts, newOrder);

          return newOrder;
        });
      },
      [contextBlocks, onSelectionChange]
    );

    // Drag-select hook
    const { isDragging, handleMouseDown, handleMouseEnter } =
      useDragSelect(handleSelectionChange);

    // Sets for quick checking of selected elements
    const { selectedItemsMap, selectedSubItemsMap, selectionOrderMap } = useMemo(() => {
      const itemsMap = new Map<number, Set<number>>(); // blockId -> Set<itemId>
      const subItemsMap = new Map<number, Set<string>>(); // blockId -> Set<"itemId.subItemId">
      const orderMap = new Map<string, number>(); // "blockId-itemId[-subItemId]" -> order number

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

      return {
        selectedItemsMap: itemsMap,
        selectedSubItemsMap: subItemsMap,
        selectionOrderMap: orderMap,
      };
    }, [selectionOrder]);

    // Select all in section
    const handleSelectAll = useCallback(
      (blockId: number) => {
        const block = contextBlocks.find((b) => b.id === blockId);
        if (!block) return;

        setSelectionOrder((prevOrder) => {
          const newOrder = [...prevOrder];

          block.items.forEach((item) => {
            const itemKey = `${blockId}-${item.id}`;
            const hasContent =
              (item.chars || (item.content && item.content.length)) > 0;

            if (hasContent && !newOrder.includes(itemKey)) {
              newOrder.push(itemKey);
            }

            if (Array.isArray(item.subItems)) {
              item.subItems.forEach((sub) => {
                const subKey = `${blockId}-${item.id}-${sub.id}`;
                if ((sub.chars || 0) > 0 && !newOrder.includes(subKey)) {
                  newOrder.push(subKey);
                }
              });
            }
          });

          const newSelectedContexts = convertToSelectedContexts(
            newOrder
          );
          onSelectionChange(newSelectedContexts, newOrder);

          return newOrder;
        });
      },
      [contextBlocks, onSelectionChange]
    );

    // Deselect all in section
    const handleDeselectAll = useCallback(
      (blockId: number) => {
        setSelectionOrder((prevOrder) => {
          const newOrder = prevOrder.filter((key) => {
            const { blockId: keyBlockId } = parseItemKey(key);
            return keyBlockId !== blockId;
          });

          const newSelectedContexts = convertToSelectedContexts(
            newOrder
          );
          onSelectionChange(newSelectedContexts, newOrder);

          return newOrder;
        });
      },
      [contextBlocks, onSelectionChange]
    );

    // Select all subitems of specific item
    const handleSelectAllSubItems = useCallback(
      (blockId: number, itemId: number) => {
        const block = contextBlocks.find((b) => b.id === blockId);
        if (!block) return;

        const item = block.items.find((i) => i.id === itemId);
        if (!item || !Array.isArray(item.subItems)) return;

        setSelectionOrder((prevOrder) => {
          const newOrder = [...prevOrder];

          item.subItems.forEach((sub) => {
            const subKey = `${blockId}-${itemId}-${sub.id}`;
            if ((sub.chars || 0) > 0 && !newOrder.includes(subKey)) {
              newOrder.push(subKey);
            }
          });

          const newSelectedContexts = convertToSelectedContexts(
            newOrder
          );
          onSelectionChange(newSelectedContexts, newOrder);

          return newOrder;
        });
      },
      [contextBlocks, onSelectionChange]
    );

    // Deselect all subitems of specific item
    const handleDeselectAllSubItems = useCallback(
      (blockId: number, itemId: number) => {
        setSelectionOrder((prevOrder) => {
          const newOrder = prevOrder.filter((key) => {
            const {
              blockId: keyBlockId,
              itemId: keyItemId,
              subItemId,
            } = parseItemKey(key);
            // Remove only subitems of this item
            return !(
              keyBlockId === blockId &&
              keyItemId === itemId &&
              subItemId !== null
            );
          });

          const newSelectedContexts = convertToSelectedContexts(
            newOrder
          );
          onSelectionChange(newSelectedContexts, newOrder);

          return newOrder;
        });
      },
      [contextBlocks, onSelectionChange]
    );

    // Clear all selection
    const handleClearAll = useCallback(() => {
      setSelectionOrder([]);
      onSelectionChange([], []);
    }, [onSelectionChange]);

    // Select all elements in all blocks
    const handleSelectAllGlobal = useCallback(() => {
      const newOrder: string[] = [];

      contextBlocks.forEach((block) => {
        block.items.forEach((item) => {
          const itemKey = `${block.id}-${item.id}`;
          const hasContent =
            (item.chars || (item.content && item.content.length)) > 0;

          if (hasContent) {
            newOrder.push(itemKey);
          }

          if (Array.isArray(item.subItems)) {
            item.subItems.forEach((sub) => {
              const subKey = `${block.id}-${item.id}-${sub.id}`;
              if ((sub.chars || 0) > 0) {
                newOrder.push(subKey);
              }
            });
          }
        });
      });

      setSelectionOrder(newOrder);
      const newSelectedContexts = convertToSelectedContexts(
        newOrder
      );
      onSelectionChange(newSelectedContexts, newOrder);
    }, [contextBlocks, onSelectionChange]);

    // Export methods via ref for use from parent component
    useImperativeHandle(
      ref,
      () => ({
        selectAll: handleSelectAllGlobal,
        clearSelection: handleClearAll,
        getSelectionCount: () => selectionOrder.length,
      }),
      [handleSelectAllGlobal, handleClearAll, selectionOrder.length]
    );

    // Copy
    const handleCopy = useCallback(async () => {
      // Collect content from selected elements
      const contents: string[] = [];

      selectionOrder.forEach((key) => {
        const { blockId, itemId, subItemId } = parseItemKey(key);
        const block = contextBlocks.find((b) => b.id === blockId);
        if (!block) return;

        const item = block.items.find((i) => i.id === itemId);
        if (!item) return;

        if (subItemId !== null) {
          const subItem = item.subItems?.find((s) => s.id === subItemId);
          if (subItem && subItem.content) {
            contents.push(subItem.content);
          }
        } else {
          if (item.content) {
            contents.push(item.content);
          }
        }
      });

      const compiledContent = contents.join('\n\n---\n\n');

      try {
        await navigator.clipboard.writeText(compiledContent);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }, [selectionOrder, contextBlocks]);

    return (
      <div
        ref={containerRef}
        className={`${isDragging ? 'cs-dragging' : ''} space-y-4`}
      >
        {/* Sections with context blocks */}
        {contextBlocks.map((block) => (
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
          <div className="text-center py-12 text-gray-400">
            {t('noContextBlocks')}
          </div>
        )}

        {/* Preview statistics panel */}
        <div className="sticky bottom-0 bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-white">
              {t('preview')}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-gray-300">
                {selectionOrder.length} {t('selected')}
              </span>
              <span className="text-gray-300">
                {totalChars.toLocaleString()} {t('characters')}
              </span>
              <button
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  copySuccess
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={handleCopy}
                disabled={selectionOrder.length === 0}
              >
                {copySuccess ? t('copied') : t('copyContext')}
              </button>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            onClick={handleSelectAllGlobal}
          >
            {t('selectAllGlobal')}
          </button>
          {selectionOrder.length > 0 && (
            <button
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              onClick={handleClearAll}
            >
              {t('clearSelection')}
            </button>
          )}
        </div>
      </div>
    );
  }
);

ContextSelectionPanel.displayName = 'ContextSelectionPanel';

export default ContextSelectionPanel;
