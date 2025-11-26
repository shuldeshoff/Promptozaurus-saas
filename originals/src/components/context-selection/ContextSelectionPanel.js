// src/components/context-selection/ContextSelectionPanel.js - Главная панель выбора контекста
import React, { useState, useCallback, useMemo, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import useDragSelect from '../../hooks/useDragSelect';
import ContextSectionGrid from './ContextSectionGrid';

/**
 * Парсит ключ тайла и возвращает его компоненты
 * Формат: "blockId-itemId" или "blockId-itemId-subItemId"
 */
const parseItemKey = (key) => {
  const parts = key.split('-').map(Number);
  return {
    blockId: parts[0],
    itemId: parts[1],
    subItemId: parts.length > 2 ? parts[2] : null,
  };
};

/**
 * Конвертирует внутреннее состояние выбора в формат selectedContexts
 */
const convertToSelectedContexts = (selectionOrder, contextBlocks) => {
  const blocksMap = new Map();

  selectionOrder.forEach(key => {
    const { blockId, itemId, subItemId } = parseItemKey(key);

    if (!blocksMap.has(blockId)) {
      blocksMap.set(blockId, { blockId, itemIds: [], subItemIds: [] });
    }

    const blockData = blocksMap.get(blockId);

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
 * Инициализирует selectionOrder из существующих selectedContexts
 */
const initSelectionOrderFromContexts = (selectedContexts, contextBlocks) => {
  const order = [];

  if (!Array.isArray(selectedContexts)) return order;

  selectedContexts.forEach(sel => {
    if (!sel || !sel.blockId) return;

    // Добавляем выбранные items
    if (Array.isArray(sel.itemIds)) {
      sel.itemIds.forEach(itemId => {
        order.push(`${sel.blockId}-${itemId}`);
      });
    }

    // Добавляем выбранные subItems
    if (Array.isArray(sel.subItemIds)) {
      sel.subItemIds.forEach(subItemKey => {
        const [itemId, subItemId] = subItemKey.split('.');
        order.push(`${sel.blockId}-${itemId}-${subItemId}`);
      });
    }
  });

  return order;
};

/**
 * Главная панель выбора контекста с drag-select
 */
const ContextSelectionPanel = forwardRef(({
  promptId,
  contextBlocks,
  selectedContexts,
  selectionOrder: initialSelectionOrder,
  onSelectionChange,
  totalChars = 0,
}, ref) => {
  const { t } = useTranslation();
  const [selectionOrder, setSelectionOrder] = useState(() =>
    Array.isArray(initialSelectionOrder) && initialSelectionOrder.length > 0
      ? initialSelectionOrder
      : initSelectionOrderFromContexts(selectedContexts, contextBlocks)
  );
  const [copySuccess, setCopySuccess] = useState(false);
  const containerRef = useRef(null);

  // Синхронизация при изменении selectionOrder извне
  useEffect(() => {
    if (Array.isArray(initialSelectionOrder) && initialSelectionOrder.length > 0) {
      setSelectionOrder(initialSelectionOrder);
    } else {
      const newOrder = initSelectionOrderFromContexts(selectedContexts, contextBlocks);
      setSelectionOrder(newOrder);
    }
  }, [initialSelectionOrder, selectedContexts, contextBlocks]);

  // Обработчик изменения выбора
  const handleSelectionChange = useCallback((itemKey, isSelected) => {
    setSelectionOrder(prevOrder => {
      let newOrder;

      if (isSelected) {
        // Добавляем в конец списка
        newOrder = prevOrder.includes(itemKey) ? prevOrder : [...prevOrder, itemKey];
      } else {
        // Удаляем из списка
        newOrder = prevOrder.filter(k => k !== itemKey);
      }

      // Вызываем callback с новым состоянием и порядком выбора
      const newSelectedContexts = convertToSelectedContexts(newOrder, contextBlocks);
      onSelectionChange(newSelectedContexts, newOrder);

      return newOrder;
    });
  }, [contextBlocks, onSelectionChange]);

  // Хук drag-select
  const { isDragging, handleMouseDown, handleMouseEnter } = useDragSelect(handleSelectionChange);

  // Множества для быстрой проверки выбранных элементов
  const { selectedItemsMap, selectedSubItemsMap, selectionOrderMap } = useMemo(() => {
    const itemsMap = new Map(); // blockId -> Set<itemId>
    const subItemsMap = new Map(); // blockId -> Set<"itemId.subItemId">
    const orderMap = new Map(); // "blockId-itemId[-subItemId]" -> order number

    selectionOrder.forEach((key, index) => {
      const { blockId, itemId, subItemId } = parseItemKey(key);
      orderMap.set(key, index + 1);

      if (subItemId !== null) {
        if (!subItemsMap.has(blockId)) subItemsMap.set(blockId, new Set());
        subItemsMap.get(blockId).add(`${itemId}.${subItemId}`);
      } else {
        if (!itemsMap.has(blockId)) itemsMap.set(blockId, new Set());
        itemsMap.get(blockId).add(itemId);
      }
    });

    return { selectedItemsMap: itemsMap, selectedSubItemsMap: subItemsMap, selectionOrderMap: orderMap };
  }, [selectionOrder]);

  // Выбрать все в секции
  const handleSelectAll = useCallback((blockId) => {
    const block = contextBlocks.find(b => b.id === blockId);
    if (!block) return;

    setSelectionOrder(prevOrder => {
      const newOrder = [...prevOrder];

      block.items.forEach(item => {
        const itemKey = `${blockId}-${item.id}`;
        const hasContent = (item.chars || (item.content && item.content.length)) > 0;

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

  // Снять выбор в секции
  const handleDeselectAll = useCallback((blockId) => {
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

  // Выбрать все подэлементы конкретного элемента
  const handleSelectAllSubItems = useCallback((blockId, itemId) => {
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

  // Снять выбор со всех подэлементов конкретного элемента
  const handleDeselectAllSubItems = useCallback((blockId, itemId) => {
    setSelectionOrder(prevOrder => {
      const newOrder = prevOrder.filter(key => {
        const { blockId: keyBlockId, itemId: keyItemId, subItemId } = parseItemKey(key);
        // Убираем только подэлементы данного item
        return !(keyBlockId === blockId && keyItemId === itemId && subItemId !== null);
      });

      const newSelectedContexts = convertToSelectedContexts(newOrder, contextBlocks);
      onSelectionChange(newSelectedContexts, newOrder);

      return newOrder;
    });
  }, [contextBlocks, onSelectionChange]);

  // Очистить весь выбор
  const handleClearAll = useCallback(() => {
    setSelectionOrder([]);
    onSelectionChange([], []);
  }, [onSelectionChange]);

  // Выбрать все элементы во всех блоках
  const handleSelectAllGlobal = useCallback(() => {
    const newOrder = [];

    contextBlocks.forEach(block => {
      block.items.forEach(item => {
        const itemKey = `${block.id}-${item.id}`;
        const hasContent = (item.chars || (item.content && item.content.length)) > 0;

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

  // Экспортируем методы через ref для использования из родительского компонента
  useImperativeHandle(ref, () => ({
    selectAll: handleSelectAllGlobal,
    clearSelection: handleClearAll,
    getSelectionCount: () => selectionOrder.length,
  }), [handleSelectAllGlobal, handleClearAll, selectionOrder.length]);

  // Копирование
  const handleCopy = useCallback(async () => {
    // Собираем контент из выбранных элементов
    const contents = [];

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
      {/* Секции с блоками контекста */}
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
        <div className="cs-preview__empty">{t('contextSelection.noContextBlocks')}</div>
      )}

      {/* Панель предпросмотра статистики */}
      <div className="cs-preview">
        <div className="cs-preview__header">
          <span className="cs-preview__title">{t('contextSelection.preview')}</span>
          <div className="cs-preview__stats">
            <span>{selectionOrder.length} {t('contextSelection.selected')}</span>
            <span>{totalChars.toLocaleString()} {t('contextSelection.characters')}</span>
            <button
              className={`cs-copy-btn ${copySuccess ? 'cs-copy-btn--success' : ''}`}
              onClick={handleCopy}
              disabled={selectionOrder.length === 0}
            >
              {copySuccess ? t('contextSelection.copied') : t('contextSelection.copyContext')}
            </button>
          </div>
        </div>
      </div>

      {/* Кнопки быстрых действий */}
      <div className="cs-actions">
        <button className="cs-action-btn cs-action-btn--primary" onClick={handleSelectAllGlobal}>
          {t('contextSelection.selectAllGlobal')}
        </button>
        {selectionOrder.length > 0 && (
          <button className="cs-action-btn" onClick={handleClearAll}>
            {t('contextSelection.clearSelection')}
          </button>
        )}
      </div>

    </div>
  );
});

export default ContextSelectionPanel;
