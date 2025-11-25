// src/services/FileService.js - Сервис для работы с файлами через Electron API
class FileService {
    /**
     * Сохраняет проект в файл
     * @param {Object} project - Данные проекта
     * @param {string} path - Путь к файлу (если не указан, будет открыт диалог выбора)
     * @returns {Promise<{success: boolean, path: string|null, error: Error|null}>} - Результат операции
     */
    static async saveProject(project, path = null) {
      try {
        console.log('Сохранение проекта...');
        
        // Если путь не указан, открываем диалог сохранения
        if (!path) {
          path = await window.electronAPI.saveFileDialog();
          if (!path) {
            console.log('Пользователь отменил сохранение');
            return { success: false, path: null, error: null };
          }
        }
        
        // Преобразуем объект проекта в JSON строку
        const content = JSON.stringify(project, null, 2);
        
        // Записываем в файл
        await window.electronAPI.writeFile(path, content);
        console.log(`Проект успешно сохранен: ${path}`);
        
        return { success: true, path, error: null };
      } catch (error) {
        console.error('Ошибка при сохранении проекта:', error);
        return { success: false, path: null, error };
      }
    }
  
    /**
     * Загружает проект из файла
     * @param {string} path - Путь к файлу (если не указан, будет открыт диалог выбора)
     * @returns {Promise<{success: boolean, data: Object|null, path: string|null, error: Error|null}>} - Загруженный проект или null в случае ошибки
     */
    static async loadProject(path = null) {
      try {
        console.log('Загрузка проекта...');
        
        // Если путь не указан, открываем диалог выбора файла
        if (!path) {
          path = await window.electronAPI.openFileDialog();
          if (!path) {
            console.log('Пользователь отменил выбор файла');
            return { success: false, data: null, path: null, error: null };
          }
        }
        
        // Читаем содержимое файла
        const content = await window.electronAPI.readFile(path);
        
        // Преобразуем JSON строку в объект
        const data = JSON.parse(content);
        console.log(`Проект успешно загружен: ${path}`);
        
        return { success: true, data, path, error: null };
      } catch (error) {
        console.error('Ошибка при загрузке проекта:', error);
        return { success: false, data: null, path: null, error };
      }
    }
    
    /**
     * Создает новый проект
     * @returns {Object} - Шаблон нового проекта
     */
    static createNewProject() {
      console.log('Создание нового проекта');
      
      return {
        name: 'New Project',
        template: 'Базовый',
        contextBlocks: [],
        promptBlocks: []
      };
    }
    
    /**
     * Экспортирует промпт в текстовый файл
     * @param {string} promptText - Текст промпта
     * @param {string} fileName - Имя файла (если не указано, будет открыт диалог сохранения)
     * @returns {Promise<{success: boolean, path: string|null, error: Error|null}>} - Результат операции
     */
    static async exportPrompt(promptText, fileName = null) {
      try {
        console.log('Экспорт промпта...');
        
        // Если имя файла не указано, открываем диалог сохранения
        let path = fileName;
        if (!path) {
          path = await window.electronAPI.saveFileDialog({
            filters: [
              { name: 'Текстовые файлы', extensions: ['txt'] }
            ]
          });
          
          if (!path) {
            console.log('Пользователь отменил сохранение');
            return { success: false, path: null, error: null };
          }
        }
        
        // Записываем в файл
        await window.electronAPI.writeFile(path, promptText);
        console.log(`Промпт успешно экспортирован: ${path}`);
        
        return { success: true, path, error: null };
      } catch (error) {
        console.error('Ошибка при экспорте промпта:', error);
        return { success: false, path: null, error };
      }
    }
    
    /**
     * Импортирует текст из файла
     * @param {string} path - Путь к файлу (если не указан, будет открыт диалог выбора)
     * @returns {Promise<{success: boolean, text: string|null, path: string|null, error: Error|null}>} - Загруженный текст или null в случае ошибки
     */
    static async importText(path = null) {
      try {
        console.log('Импорт текста...');
        
        // Если путь не указан, открываем диалог выбора файла
        if (!path) {
          path = await window.electronAPI.openFileDialog({
            filters: [
              { name: 'Текстовые файлы', extensions: ['txt', 'md', 'html'] }
            ]
          });
          
          if (!path) {
            console.log('Пользователь отменил выбор файла');
            return { success: false, text: null, path: null, error: null };
          }
        }
        
        // Читаем содержимое файла
        const text = await window.electronAPI.readFile(path);
        console.log(`Текст успешно импортирован из: ${path}`);
        
        return { success: true, text, path, error: null };
      } catch (error) {
        console.error('Ошибка при импорте текста:', error);
        return { success: false, text: null, path: null, error };
      }
    }
    
    /**
     * Универсальный метод для записи файла
     * @param {string} path - Путь к файлу
     * @param {string} content - Содержимое файла
     * @returns {Promise<boolean>} - Успешность операции
     */
    static async writeFile(path, content) {
      try {
        await window.electronAPI.writeFile(path, content);
        return true;
      } catch (error) {
        console.error('Ошибка при записи файла:', error);
        return false;
      }
    }
    
    /**
     * Универсальный метод для чтения файла
     * @param {string} path - Путь к файлу
     * @returns {Promise<string|null>} - Содержимое файла или null
     */
    static async readFile(path) {
      try {
        const content = await window.electronAPI.readFile(path);
        return content;
      } catch (error) {
        console.error('Ошибка при чтении файла:', error);
        return null;
      }
    }
    
    /**
     * Проверяет существование файла
     * @param {string} path - Путь к файлу
     * @returns {Promise<boolean>} - Существует ли файл
     */
    static async fileExists(path) {
      try {
        const exists = await window.electronAPI.fileExists(path);
        return exists;
      } catch (error) {
        console.error('Ошибка при проверке существования файла:', error);
        return false;
      }
    }
  }
  
  export default FileService;