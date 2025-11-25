// src/services/ContextBlockService.js - Сервис для работы с блоками контекста
class ContextBlockService {
  /**
   * Получает путь к директории с контекстными блоками
   * @returns {Promise<string>} - Путь к директории
   */
  static async getContextDataPath() {
    try {
      return await window.electronAPI.getContextDataPath();
    } catch (error) {
      console.error('Ошибка при получении пути к директории контекстных блоков:', error);
      return null;
    }
  }

  /**
   * Получает список файлов контекстных блоков
   * @returns {Promise<string[]>} - Массив имен файлов контекстных блоков
   */
  static async getContextBlocksList() {
    try {
      const blocks = await window.electronAPI.readContextBlocks();
      return blocks;
    } catch (error) {
      console.error('Ошибка при получении списка контекстных блоков:', error);
      return [];
    }
  }

  /**
   * Экспортирует блок контекста в файл
   * @param {number} blockId - ID блока контекста
   * @param {Object} blockData - Данные блока контекста
   * @param {string} [contextDataFolder=null] - Папка для экспорта блоков контекста
   * @returns {Promise<Object>} - Результат операции
   */
  static async exportContextBlock(blockId, blockData, contextDataFolder = null) {
    try {
      console.log(`Экспорт блока контекста ${blockId}:`, blockData.title);
      
      // Проверка на наличие подэлементов в блоке и их инициализация при необходимости
      const processedBlockData = {
        ...blockData,
        items: Array.isArray(blockData.items) ? blockData.items.map(item => ({
          ...item,
          subItems: Array.isArray(item.subItems) ? item.subItems : [] // Гарантируем, что у каждого элемента есть поле subItems
        })) : []
      };
      
      const options = {};
      if (contextDataFolder) {
        options.defaultPath = contextDataFolder;
      }
      
      const result = await window.electronAPI.exportContextBlock(blockId, processedBlockData, options);
      return result;
    } catch (error) {
      console.error(`Ошибка при экспорте блока контекста ${blockId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Импортирует блок контекста из файла
   * @param {string} [contextDataFolder=null] - Папка для импорта блоков контекста
   * @returns {Promise<Object>} - Данные импортированного блока или информация об ошибке
   */
  static async importContextBlock(contextDataFolder = null) {
    try {
      console.log('Импорт блока контекста');
      const options = {};
      if (contextDataFolder) {
        options.defaultPath = contextDataFolder;
      }
      
      const result = await window.electronAPI.importContextBlock(options);
      
      // Если импорт успешен, проверяем и дополняем данные блока
      if (result.success && result.blockData) {
        console.log('Проверка и миграция данных импортированного блока контекста');
        
        // Проверяем наличие всех необходимых полей
        if (!result.blockData.title) {
          result.blockData.title = 'Импортированный блок';
        }
        
        // Добавляем массив items, если его нет
        if (!Array.isArray(result.blockData.items)) {
          result.blockData.items = [];
        }
        
        // Добавляем подэлементы, если они отсутствуют
        result.blockData.items = result.blockData.items.map(item => ({
          ...item,
          // Добавляем поле chars, если его нет
          chars: typeof item.chars === 'number' ? item.chars : (item.content ? item.content.length : 0),
          // Добавляем пустой массив подэлементов, если его нет
          subItems: Array.isArray(item.subItems) ? item.subItems : []
        }));
        
        console.log('Миграция данных блока контекста завершена');
      }
      
      return result;
    } catch (error) {
      console.error('Ошибка при импорте блока контекста:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Создает безопасное имя файла из заголовка блока
   * @param {string} title - Заголовок блока
   * @returns {string} - Безопасное имя файла
   */
  static titleToFilename(title) {
    if (!title) return 'context_block';
    
    // Преобразуем заголовок: приводим к нижнему регистру, заменяем пробелы на подчеркивания
    const filename = title.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_а-яА-ЯёЁ]/g, ''); // Поддержка кириллицы
    
    return filename || 'context_block';
  }

  /**
   * Преобразует имя файла в читаемый заголовок
   * @param {string} filename - Имя файла (с расширением или без)
   * @returns {string} - Заголовок
   */
  static filenameToTitle(filename) {
    if (!filename) return 'Блок контекста';
    
    // Убираем расширение .json
    const nameWithoutExt = filename.replace(/\.json$/, '');
    
    // Убираем путь, если он есть
    const baseName = nameWithoutExt.split(/[/\\]/).pop();
    
    // Форматируем строку (заменяем подчеркивания пробелами и делаем первые буквы заглавными)
    return baseName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

export default ContextBlockService;