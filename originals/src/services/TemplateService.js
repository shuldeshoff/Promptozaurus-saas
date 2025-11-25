// src/services/TemplateService.js
console.log('Инициализация TemplateService');

let cache = {
  filesList: {},
  contentMap: {},
  lastUpdate: {}
};
let fetching = false;
const CACHE_REFRESH_MS = 60000;

class TemplateService {
  /**
   * Получить список .txt–файлов из указанной директории (с кэшированием).
   * @param {boolean} forceRefresh - Принудительное обновление кэша
   * @param {string} folderPath - Путь к директории с шаблонами
   */
  static async getTemplatesList(forceRefresh = false, folderPath = '/templates') {
    try {
      const now = Date.now();
      if (!folderPath) folderPath = '/templates';

      // Если уже загружаем
      if (fetching) {
        return cache.filesList[folderPath] || [];
      }
      
      // Если кэш актуален для данной директории
      if (!forceRefresh &&
          cache.lastUpdate[folderPath] &&
          now - cache.lastUpdate[folderPath] < CACHE_REFRESH_MS &&
          cache.filesList[folderPath] && 
          cache.filesList[folderPath].length > 0) {
        console.log('TemplateService: возвращаем кэшированный список из', folderPath);
        return cache.filesList[folderPath];
      }

      console.log('TemplateService: чтение списка файлов из папки:', folderPath);
      fetching = true;
      const files = await window.electronAPI.invoke(
        'read-template-files-from-path',
        folderPath
      );
      fetching = false;

      // Обновляем кэш только для данной директории
      cache.filesList[folderPath] = (files || []).filter(f => f.endsWith('.txt'));
      cache.lastUpdate[folderPath] = now;
      
      return cache.filesList[folderPath];
    } catch (error) {
      fetching = false;
      console.error('Ошибка getTemplatesList:', error);
      return [];
    }
  }

  /**
   * Прочитать содержимое .txt-файла из указанной папки.
   * @param {string} folderPath - Путь к директории с шаблонами
   * @param {string} filename - Имя файла шаблона
   */
  static async getTemplateContent(folderPath, filename) {
    if (!folderPath) folderPath = '/templates';
    if (!filename) return null;

    // Если закэшировано
    const key = `${folderPath}::${filename}`;
    if (cache.contentMap[key]) {
      return cache.contentMap[key];
    }

    try {
      console.log(`TemplateService: чтение контента файла ${filename} из папки ${folderPath}`);
      const content = await window.electronAPI.invoke(
        'read-template-content-from-path',
        folderPath,
        filename
      );
      cache.contentMap[key] = content;
      return content;
    } catch (err) {
      console.error(`Ошибка при чтении файла ${filename}:`, err);
      return null;
    }
  }

  /**
   * Сохранить текст шаблона .txt в выбранной папке.
   * @param {string} folderPath - Путь к директории для сохранения шаблонов
   * @param {string} filename - Имя файла шаблона
   * @param {string} content - Содержимое шаблона
   */
  static async saveTemplate(folderPath, filename, content) {
    if (!folderPath) folderPath = '/templates';
    if (!filename) filename = 'unnamed.txt';
    try {
      console.log(`TemplateService: сохранение ${filename} в папку ${folderPath}`);
      const saved = await window.electronAPI.invoke(
        'save-template-content-to-path',
        folderPath,
        filename,
        content
      );
      // Обновим кэш
      if (saved) {
        const key = `${folderPath}::${filename}`;
        cache.contentMap[key] = content;
        // Перечитаем список файлов (на всякий случай)
        await this.getTemplatesList(true, folderPath);
      }
      return saved;
    } catch (error) {
      console.error(`Ошибка при сохранении ${filename}:`, error);
      return false;
    }
  }

  /**
   * Преобразовать имя файла в более красивое название
   */
  static filenameToTitle(filename) {
    if (!filename) return '';
    return filename.replace(/\.txt$/, '')
      .split('_')
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
  }

  /**
   * Преобразовать строку в имя файла .txt
   */
  static titleToFilename(title) {
    if (!title) return 'template.txt';
    const safe = title
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9а-яёё_]/gi, '');
    return safe ? `${safe}.txt` : 'template.txt';
  }
  
  /**
   * Очистить кэш для указанной директории
   * @param {string} folderPath - Путь к директории
   */
  static clearCache(folderPath) {
    if (folderPath) {
      delete cache.filesList[folderPath];
      delete cache.lastUpdate[folderPath];
      
      // Удаляем все записи contentMap, относящиеся к этой директории
      Object.keys(cache.contentMap).forEach(key => {
        if (key.startsWith(`${folderPath}::`)) {
          delete cache.contentMap[key];
        }
      });
    } else {
      // Очищаем весь кэш, если директория не указана
      cache = {
        filesList: {},
        contentMap: {},
        lastUpdate: {}
      };
    }
  }
}

export default TemplateService;