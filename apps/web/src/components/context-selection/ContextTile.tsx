import { memo, useCallback } from 'react';
import './ContextTile.css';

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
 * Format number with separators
 */
const formatChars = (num: number): string => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

/**
 * Context tile component for selecting context items
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
}: ContextTileProps) => {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (isAvailable && onMouseDown) {
        onMouseDown(itemKey, isSelected);
      }
    },
    [itemKey, isSelected, isAvailable, onMouseDown]
  );

  const handleMouseEnter = useCallback(() => {
    if (isAvailable && onMouseEnter) {
      onMouseEnter(itemKey);
    }
  }, [itemKey, isAvailable, onMouseEnter]);

  const classNames = [
    'context-tile',
    isSubItem ? 'context-tile--subitem' : 'context-tile--item',
    isAvailable ? 'context-tile--available' : 'context-tile--unavailable',
    isSelected && 'context-tile--selected',
  ]
    .filter(Boolean)
    .join(' ');

  // Truncate title if too long
  const displayTitle =
    title.length > (isSubItem ? 14 : 24)
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
        <span className="context-tile__order">{selectionOrder}</span>
      )}

      {/* Title and size */}
      <div className="context-tile__content">
        <span className="context-tile__title">{displayTitle}</span>
        <span className="context-tile__chars">{formatChars(chars)}</span>
      </div>
    </div>
  );
});

ContextTile.displayName = 'ContextTile';

export default ContextTile;
