// src/hooks/useKeyboardShortcut.js
import { useEffect } from 'react';

/**
 * Хук для регистрации обработчиков горячих клавиш
 * @param {Object} keyMap - Объект с комбинациями клавиш и обработчиками
 * @param {Array<any>} deps - Зависимости для обновления обработчиков
 * @param {HTMLElement|null} targetElement - Элемент, к которому привязывается обработчик (по умолчанию window)
 */
const useKeyboardShortcut = (keyMap, deps = [], targetElement = null) => {
  useEffect(() => {
    // Основной обработчик нажатий клавиш
    const handleKeyDown = (event) => {
      // Перебираем все зарегистрированные комбинации клавиш
      Object.entries(keyMap).forEach(([keyCombination, handler]) => {
        const keys = keyCombination.toLowerCase().split('+');
        let match = true;
        
        // Проверяем наличие модификаторов
        const hasCtrl = keys.includes('ctrl');
        const hasAlt = keys.includes('alt');
        const hasShift = keys.includes('shift');
        const hasMeta = keys.includes('meta');
        
        // Получаем основную клавишу (последний элемент в комбинации)
        const mainKey = keys[keys.length - 1];
        
        // Проверяем совпадение модификаторов
        if (hasCtrl !== event.ctrlKey) match = false;
        if (hasAlt !== event.altKey) match = false;
        if (hasShift !== event.shiftKey) match = false;
        if (hasMeta !== event.metaKey) match = false;
        
        // Проверяем основную клавишу (учитывая разные раскладки)
        if (mainKey && mainKey.length === 1) {
          // Для однобуквенных клавиш проверяем и код, и символ
          const isMainKeyMatch = (
            event.code === `Key${mainKey.toUpperCase()}` || 
            event.key.toLowerCase() === mainKey || 
            // Для русской раскладки
            (mainKey === 'e' && event.key.toLowerCase() === 'у') ||
            (mainKey === 's' && event.key.toLowerCase() === 'ы')
          );
          
          if (!isMainKeyMatch) match = false;
        } else if (mainKey) {
          // Для специальных клавиш проверяем код и ключ
          const isSpecialKeyMatch = (
            event.code === mainKey.charAt(0).toUpperCase() + mainKey.slice(1) || 
            event.key.toLowerCase() === mainKey
          );
          if (!isSpecialKeyMatch) match = false;
        }
        
        // Если все условия совпали, вызываем обработчик
        if (match) {
          event.preventDefault();
          handler(event);
        }
      });
    };
    
    // Определяем целевой элемент для привязки обработчика
    const target = targetElement || window;
    
    // Регистрируем обработчик
    target.addEventListener('keydown', handleKeyDown);
    
    // Удаляем обработчик при размонтировании
    return () => {
      target.removeEventListener('keydown', handleKeyDown);
    };
  }, [...deps]);
};

export default useKeyboardShortcut;