import { useEffect, DependencyList } from 'react';

/**
 * Хук для регистрации обработчиков горячих клавиш
 * @param keyMap - Объект с комбинациями клавиш и обработчиками
 * @param deps - Зависимости для обновления обработчиков
 * @param targetElement - Элемент, к которому привязывается обработчик (по умолчанию window)
 */
const useKeyboardShortcut = (
  keyMap: Record<string, (event?: KeyboardEvent) => void>,
  deps: DependencyList = [],
  targetElement: HTMLElement | null = null
) => {
  useEffect(() => {
    // Основной обработчик нажатий клавиш
    const handleKeyDown = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
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
        if (hasCtrl !== keyboardEvent.ctrlKey) match = false;
        if (hasAlt !== keyboardEvent.altKey) match = false;
        if (hasShift !== keyboardEvent.shiftKey) match = false;
        if (hasMeta !== keyboardEvent.metaKey) match = false;

        // Проверяем основную клавишу (учитывая разные раскладки)
        if (mainKey && mainKey.length === 1) {
          // Для однобуквенных клавиш проверяем и код, и символ
          const isMainKeyMatch =
            keyboardEvent.code === `Key${mainKey.toUpperCase()}` ||
            keyboardEvent.key.toLowerCase() === mainKey ||
            // Для русской раскладки
            (mainKey === 'e' && keyboardEvent.key.toLowerCase() === 'у') ||
            (mainKey === 's' && keyboardEvent.key.toLowerCase() === 'ы');

          if (!isMainKeyMatch) match = false;
        } else if (mainKey) {
          // Для специальных клавиш проверяем код и ключ
          const isSpecialKeyMatch =
            keyboardEvent.code === mainKey.charAt(0).toUpperCase() + mainKey.slice(1) || keyboardEvent.key.toLowerCase() === mainKey;
          if (!isSpecialKeyMatch) match = false;
        }

        // Если все условия совпали, вызываем обработчик
        if (match) {
          keyboardEvent.preventDefault();
          handler(keyboardEvent);
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

