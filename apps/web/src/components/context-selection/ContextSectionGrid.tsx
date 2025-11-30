import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ContextTile from './ContextTile';
import type { ContextBlock } from '@promptozaurus/shared';

interface ContextSectionGridProps {
  contextBlock: ContextBlock;
  selectedItems: Set<number>;
  selectedSubItems: Set<string>;
  selectionOrderMap: Map<string, number>;
  onMouseDown: (itemKey: string, isSelected: boolean) => void;
  onMouseEnter: (itemKey: string) => void;
  onSelectAll: (blockId: number) => void;
  onDeselectAll: (blockId: number) => void;
  onSelectAllSubItems: (blockId: number, itemId: number) => void;
  onDeselectAllSubItems: (blockId: number, itemId: number) => void;
}

/**
 * Section component with blocks for one context
 * Layout: main items vertically, subitems horizontally to the right
 */
const ContextSectionGrid = memo(({
  contextBlock,
  selectedItems,
  selectedSubItems,
  selectionOrderMap,
  onMouseDown,
  onMouseEnter,
  onSelectAll,
  onDeselectAll,
  onSelectAllSubItems,
  onDeselectAllSubItems,
}: ContextSectionGridProps) => {
  const { t } = useTranslation('contextSelection');

  const blockId = contextBlock.id;
  const items = Array.isArray(contextBlock.items) ? contextBlock.items : [];

  // Count selected elements
  const selectedCount = useMemo(() => {
    let count = 0;
    items.forEach((item) => {
      if (selectedItems.has(item.id)) count++;
      if (Array.isArray(item.subItems)) {
        item.subItems.forEach((sub) => {
          if (selectedSubItems.has(`${item.id}.${sub.id}`)) count++;
        });
      }
    });
    return count;
  }, [items, selectedItems, selectedSubItems]);

  // Total count of elements
  const totalCount = useMemo(() => {
    let count = 0;
    items.forEach((item) => {
      count++;
      if (Array.isArray(item.subItems)) {
        count += item.subItems.length;
      }
    });
    return count;
  }, [items]);

  return (
    <div className="border border-gray-700 rounded-lg mb-4 bg-gray-800/50">
      {/* Section header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">{contextBlock.title}</h3>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-400">
            {selectedCount}/{totalCount} {t('selected')}
          </span>
          <button
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            onClick={() =>
              selectedCount > 0 ? onDeselectAll(blockId) : onSelectAll(blockId)
            }
          >
            {selectedCount > 0 ? t('deselectAll') : t('selectAll')}
          </button>
        </div>
      </div>

      {/* Items - each in its own row with subitems to the right */}
      <div className="p-4">
        <div className="space-y-3">
          {items.map((item) => {
            const itemKey = `${blockId}-${item.id}`;
            const isItemSelected = selectedItems.has(item.id);
            const hasSubItems =
              Array.isArray(item.subItems) && item.subItems.length > 0;
            const itemChars = item.chars || (item.content ? item.content.length : 0);

            // Count selected subitems for this item
            const selectedSubItemsCount = hasSubItems
              ? item.subItems.filter((sub) =>
                  selectedSubItems.has(`${item.id}.${sub.id}`)
                ).length
              : 0;
            const totalSubItemsCount = hasSubItems ? item.subItems.length : 0;
            const hasSelectedSubItems = selectedSubItemsCount > 0;
            const allSubItemsSelected =
              hasSubItems && selectedSubItemsCount === totalSubItemsCount;

            return (
              <div
                key={item.id}
                className={`flex gap-2 ${hasSubItems ? 'items-start' : 'items-center'}`}
              >
                {/* Main item on the left */}
                <div className="flex items-center gap-2">
                  <ContextTile
                    itemKey={itemKey}
                    title={item.title}
                    chars={itemChars}
                    isSelected={isItemSelected}
                    selectionOrder={selectionOrderMap.get(itemKey) ?? null}
                    isAvailable={itemChars > 0 || hasSubItems}
                    onMouseDown={onMouseDown}
                    onMouseEnter={onMouseEnter}
                  />

                  {/* Subitem selection buttons */}
                  {hasSubItems && (
                    <div className="flex gap-1">
                      {!allSubItemsSelected && (
                        <button
                          className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAllSubItems(blockId, item.id);
                          }}
                          title={t('selectAllSubItems')}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                      )}
                      {hasSelectedSubItems && (
                        <button
                          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeselectAllSubItems(blockId, item.id);
                          }}
                          title={t('deselectAllSubItems')}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Subitems on the right (horizontal, left to right) */}
                {hasSubItems && (
                  <div className="flex flex-wrap gap-2">
                    {item.subItems.map((subItem) => {
                      const subKey = `${blockId}-${item.id}-${subItem.id}`;
                      const subItemKeyForSelection = `${item.id}.${subItem.id}`;
                      const isSubSelected = selectedSubItems.has(
                        subItemKeyForSelection
                      );

                      return (
                        <ContextTile
                          key={subKey}
                          itemKey={subKey}
                          title={subItem.title}
                          chars={subItem.chars || 0}
                          isSelected={isSubSelected}
                          selectionOrder={selectionOrderMap.get(subKey) ?? null}
                          isAvailable={(subItem.chars || 0) > 0}
                          isSubItem
                          onMouseDown={onMouseDown}
                          onMouseEnter={onMouseEnter}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-6 text-gray-400">{t('noItems')}</div>
        )}
      </div>
    </div>
  );
});

ContextSectionGrid.displayName = 'ContextSectionGrid';

export default ContextSectionGrid;
