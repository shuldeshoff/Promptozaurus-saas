import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook for implementing drag-select functionality
 * @param onSelectionChange - Callback when selection changes (key, isSelected)
 * @returns Handlers and drag-select state
 */
export function useDragSelect(
  onSelectionChange: (itemKey: string, isSelected: boolean) => void
) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'add' | 'remove' | null>(null);
  const processedItems = useRef(new Set<string>());

  // Start drag-select
  const handleMouseDown = useCallback(
    (itemKey: string, isCurrentlySelected: boolean) => {
      // Determine mode: if item was selected - remove, otherwise - add
      const mode: 'add' | 'remove' = isCurrentlySelected ? 'remove' : 'add';
      setDragMode(mode);
      setIsDragging(true);
      processedItems.current = new Set([itemKey]);

      // Apply action to the first item
      onSelectionChange(itemKey, mode === 'add');
    },
    [onSelectionChange]
  );

  // Mouse enters item during drag
  const handleMouseEnter = useCallback(
    (itemKey: string) => {
      if (!isDragging || !dragMode) return;

      // Skip already processed items
      if (processedItems.current.has(itemKey)) return;

      processedItems.current.add(itemKey);
      onSelectionChange(itemKey, dragMode === 'add');
    },
    [isDragging, dragMode, onSelectionChange]
  );

  // End drag-select (global handler)
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragMode(null);
        processedItems.current.clear();
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging]);

  // Block text selection during drag
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'crosshair';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging]);

  return {
    isDragging,
    dragMode,
    handleMouseDown,
    handleMouseEnter,
  };
}
