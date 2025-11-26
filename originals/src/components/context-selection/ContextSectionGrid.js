// src/components/context-selection/ContextSectionGrid.js - Секция с блоками контекста
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ContextTile from './ContextTile';

/**
 * Компонент секции с блоками для одного контекста
 * Layout: основные элементы вертикально, подэлементы горизонтально слева
 */
const ContextSectionGrid = memo(({
  contextBlock,
  selectedItems,      // Set<number> - ID выбранных items
  selectedSubItems,   // Set<string> - "itemId.subItemId"
  selectionOrderMap,  // Map<string, number> - порядок выбора
  onMouseDown,
  onMouseEnter,
  onSelectAll,
  onDeselectAll,
  onSelectAllSubItems,
  onDeselectAllSubItems,
}) => {
  const { t } = useTranslation();

  const blockId = contextBlock.id;
  const items = Array.isArray(contextBlock.items) ? contextBlock.items : [];

  // Подсчёт выбранных элементов
  const selectedCount = useMemo(() => {
    let count = 0;
    items.forEach(item => {
      if (selectedItems.has(item.id)) count++;
      if (Array.isArray(item.subItems)) {
        item.subItems.forEach(sub => {
          if (selectedSubItems.has(`${item.id}.${sub.id}`)) count++;
        });
      }
    });
    return count;
  }, [items, selectedItems, selectedSubItems]);

  // Общее количество элементов
  const totalCount = useMemo(() => {
    let count = 0;
    items.forEach(item => {
      count++;
      if (Array.isArray(item.subItems)) {
        count += item.subItems.length;
      }
    });
    return count;
  }, [items]);

  return (
    <div className="cs-section">
      {/* Заголовок секции */}
      <div className="cs-section-header">
        <div className="cs-section-title">
          <span>{contextBlock.title}</span>
        </div>
        <div className="cs-section-stats">
          <span>{selectedCount}/{totalCount} {t('contextSelection.selected')}</span>
          <button
            className="cs-action-btn"
            onClick={() => selectedCount > 0 ? onDeselectAll(blockId) : onSelectAll(blockId)}
          >
            {selectedCount > 0 ? t('contextSelection.deselectAll') : t('contextSelection.selectAll')}
          </button>
        </div>
      </div>

      {/* Элементы - каждый в своей строке с подэлементами слева */}
      <div className="cs-section-content">
        <div className="cs-rows">
          {items.map(item => {
            const itemKey = `${blockId}-${item.id}`;
            const isItemSelected = selectedItems.has(item.id);
            const hasSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;
            const itemChars = item.chars || (item.content ? item.content.length : 0);

            // Подсчёт выбранных подэлементов для данного item
            const selectedSubItemsCount = hasSubItems
              ? item.subItems.filter(sub => selectedSubItems.has(`${item.id}.${sub.id}`)).length
              : 0;
            const totalSubItemsCount = hasSubItems ? item.subItems.length : 0;
            const hasSelectedSubItems = selectedSubItemsCount > 0;
            const allSubItemsSelected = hasSubItems && selectedSubItemsCount === totalSubItemsCount;

            return (
              <div key={item.id} className={`cs-row ${hasSubItems ? 'cs-row--grouped' : ''}`}>
                {/* Основной элемент слева */}
                <div className="cs-row__item">
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

                  {/* Кнопки выбора/снятия подэлементов */}
                  {hasSubItems && (
                    <div className="cs-row__subitem-actions">
                      {!allSubItemsSelected && (
                        <button
                          className="cs-subitem-btn cs-subitem-btn--select"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAllSubItems(blockId, item.id);
                          }}
                          title={t('contextSelection.selectAllSubItems')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                      {hasSelectedSubItems && (
                        <button
                          className="cs-subitem-btn cs-subitem-btn--deselect"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeselectAllSubItems(blockId, item.id);
                          }}
                          title={t('contextSelection.deselectAllSubItems')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Подэлементы справа (горизонтально, слева направо) */}
                {hasSubItems && (
                  <div className="cs-row__subitems">
                    {item.subItems.map(subItem => {
                      const subKey = `${blockId}-${item.id}-${subItem.id}`;
                      const subItemKeyForSelection = `${item.id}.${subItem.id}`;
                      const isSubSelected = selectedSubItems.has(subItemKeyForSelection);

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
          <div className="cs-preview__empty">{t('contextSelection.noItems')}</div>
        )}
      </div>
    </div>
  );
});

ContextSectionGrid.displayName = 'ContextSectionGrid';

export default ContextSectionGrid;
