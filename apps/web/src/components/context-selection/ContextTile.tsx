// components/context-selection/ContextTile.tsx - Tile for selecting context element
import React, { memo, useCallback } from 'react';

/**
 * Formats number with separators
 */
const formatChars = (num: number): string => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

interface ContextTileProps {
  itemKey: string;
  title: string;
  chars?: number;
  isSelected: boolean;
  selectionOrder: number | null;
  isAvailable?: boolean;
  isSubItem?: boolean;
  onMouseDown?: (itemKey: string, isSelected: boolean) => void;
  onMouseEnter?: (itemKey: string) => void;
}

/**
 * Context tile component for selecting an element
 */
const ContextTile = memo<ContextTileProps>(({
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
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
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

  // Truncate title if too long
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
      {/* Selection order number */}
      {isSelected && selectionOrder !== null && (
        <span className="cs-tile__order">{selectionOrder}</span>
      )}

      {/* Title and size */}
      <div className="cs-tile__content">
        <span className="cs-tile__title">{displayTitle}</span>
        <span className="cs-tile__chars">{formatChars(chars)}</span>
      </div>
    </div>
  );
});

ContextTile.displayName = 'ContextTile';

export default ContextTile;

