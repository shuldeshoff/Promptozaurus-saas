// src/hooks/useDragSelect.js - Хук для логики drag-select выделения
import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Хук для реализации drag-select выделения элементов
 * @param {Function} onSelectionChange - Callback при изменении выбора (key, isSelected)
 * @returns {Object} - Обработчики и состояние drag-select
 */
const useDragSelect = (onSelectionChange) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null); // 'add' | 'remove'
  const processedItems = useRef(new Set()); // Элементы, обработанные в текущем drag

  // Начало drag-select
  const handleMouseDown = useCallback((itemKey, isCurrentlySelected) => {
    // Определяем режим: если элемент был выбран - снимаем, иначе - добавляем
    const mode = isCurrentlySelected ? 'remove' : 'add';
    setDragMode(mode);
    setIsDragging(true);
    processedItems.current = new Set([itemKey]);

    // Применяем действие к первому элементу
    onSelectionChange(itemKey, mode === 'add');
  }, [onSelectionChange]);

  // Вход курсора в элемент во время drag
  const handleMouseEnter = useCallback((itemKey) => {
    if (!isDragging || !dragMode) return;

    // Пропускаем уже обработанные элементы
    if (processedItems.current.has(itemKey)) return;

    processedItems.current.add(itemKey);
    onSelectionChange(itemKey, dragMode === 'add');
  }, [isDragging, dragMode, onSelectionChange]);

  // Завершение drag-select (глобальный обработчик)
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

  // Блокировка выделения текста во время drag
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

export default useDragSelect;
