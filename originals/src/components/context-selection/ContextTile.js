// src/components/context-selection/ContextTile.js - Тайл для выбора элемента контекста
import React, { memo, useCallback } from 'react';

/**
 * Форматирует число с разделителями
 */
const formatChars = (num) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

/**
 * Компонент тайла для выбора элемента контекста
 */
const ContextTile = memo(({
  itemKey,
  title,
  chars = 0,
  isSelected,
  selectionOrder,
  isAvailable = true,
  isSubItem = false,
  onMouseDown,
  onMouseEnter,
}) => {
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    if (isAvailable && onMouseDown) {
      onMouseDown(itemKey, isSelected);
    }
  }, [itemKey, isSelected, isAvailable, onMouseDown]);

  const handleMouseEnter = useCallback(() => {
    if (isAvailable && onMouseEnter) {
      onMouseEnter(itemKey);
    }
  }, [itemKey, isAvailable, onMouseEnter]);

  const classNames = [
    'cs-tile',
    isSubItem ? 'cs-tile--subitem' : 'cs-tile--item',
    isAvailable ? 'cs-tile--available' : 'cs-tile--unavailable',
    isSelected && 'cs-tile--selected',
  ].filter(Boolean).join(' ');

  // Обрезаем название если слишком длинное
  const displayTitle = title.length > (isSubItem ? 14 : 24)
    ? title.substring(0, isSubItem ? 11 : 21) + '...'
    : title;

  return (
    <div
      className={classNames}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      title={`${title} (${chars} chars)`}
    >
      {/* Номер порядка выбора */}
      {isSelected && selectionOrder !== null && (
        <span className="cs-tile__order">{selectionOrder}</span>
      )}

      {/* Название и размер */}
      <div className="cs-tile__content">
        <span className="cs-tile__title">{displayTitle}</span>
        <span className="cs-tile__chars">{formatChars(chars)}</span>
      </div>
    </div>
  );
});

ContextTile.displayName = 'ContextTile';

export default ContextTile;
