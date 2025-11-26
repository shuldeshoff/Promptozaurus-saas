// hooks/useDragSelect.ts - Hook for drag-select logic
import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook for implementing drag-select element selection
 * @param onSelectionChange - Callback on selection change (key, isSelected)
 * @returns Handlers and state for drag-select
 */
export const useDragSelect = (
  onSelectionChange: (itemKey: string, isSelected: boolean) => void
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'add' | 'remove' | null>(null);
  const processedItems = useRef<Set<string>>(new Set());

  // Start drag-select
  const handleMouseDown = useCallback(
    (itemKey: string, isCurrentlySelected: boolean) => {
      // Determine mode: if item was selected - remove, otherwise - add
      const mode = isCurrentlySelected ? 'remove' : 'add';
      setDragMode(mode);
      setIsDragging(true);
      processedItems.current = new Set([itemKey]);

      // Apply action to the first element
      onSelectionChange(itemKey, mode === 'add');
    },
    [onSelectionChange]
  );

  // Mouse enters element during drag
  const handleMouseEnter = useCallback(
    (itemKey: string) => {
      if (!isDragging || !dragMode) return;

      // Skip already processed elements
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
};

