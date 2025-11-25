// src/services/ProjectService.js - Сервис для работы с проектами

class ProjectService {
  /**
   * Получает путь к директории проектов
   * @returns {Promise<string>} - Путь к директории
   */
  static async getProjectsPath() {
    try {
      return await window.electronAPI.getProjectsPath();
    } catch (error) {
      console.error('Ошибка при получении пути к директории проектов:', error);
      return null;
    }
  }

  /**
   * Получает список проектов
   * @returns {Promise<string[]>} - Массив имен файлов проектов
   */
  static async getProjectsList() {
    try {
      const projects = await window.electronAPI.readProjects();
      return projects;
    } catch (error) {
      console.error('Ошибка при получении списка проектов:', error);
      return [];
    }
  }

  /**
   * Загружает проект
   * @param {string} filePath - Путь к файлу проекта
   * @returns {Promise<Object|null>} - Данные проекта или null при ошибке
   */
  static async loadProject(filePath) {
    try {
      console.log('Загрузка проекта из файла:', filePath);
      const content = await window.electronAPI.readFile(filePath);
      console.log('Содержимое проекта (первые 100 символов):', content.substring(0, 100) + '...');
      
      const projectData = JSON.parse(content);
      console.log('Данные проекта после парсинга:', projectData);
      
      // Проверяем, что проект содержит необходимые поля
      if (!projectData.projectName) {
        console.warn('Загруженный проект не содержит поле projectName, устанавливаем значение по умолчанию');
        projectData.projectName = 'Загруженный проект';
      }
      
      // Миграция данных из старого формата - добавляем поле subItems, если его нет
      if (projectData.contextBlocks) {
        console.log('Миграция блоков контекста из старого формата...');
        projectData.contextBlocks = projectData.contextBlocks.map(block => ({
          ...block,
          items: (block.items || []).map(item => ({
            ...item,
            subItems: item.subItems || [] // Добавляем пустой массив подэлементов, если его нет
          }))
        }));
      }
      
      // Миграция данных в промптах - добавляем поле subItemIds, если его нет
      if (projectData.promptBlocks) {
        console.log('Миграция промптов из старого формата...');
        projectData.promptBlocks = projectData.promptBlocks.map(block => ({
          ...block,
          selectedContexts: (block.selectedContexts || []).map(sel => ({
            ...sel,
            subItemIds: sel.subItemIds || [] // Добавляем пустой массив ID подэлементов, если его нет
          }))
        }));
      }
      
      console.log('Миграция данных проекта завершена');
      return projectData;
    } catch (error) {
      console.error(`Ошибка при загрузке проекта ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Сохраняет проект
   * @param {string} filePath - Путь к файлу проекта
   * @param {Object} data - Данные проекта
   * @returns {Promise<boolean>} - Результат операции
   */
  static async saveProject(filePath, data) {
    try {
      console.log('Сохранение проекта в файл:', filePath);
      console.log('Данные проекта для сохранения:', data);
      
      // Проверяем наличие имени проекта
      if (!data.projectName) {
        console.warn('Данные для сохранения не содержат поле projectName, устанавливаем значение по умолчанию');
        data.projectName = 'Сохраненный проект';
      }
      
      // Проверяем наличие subItems во всех элементах контекста
      if (data.contextBlocks) {
        data.contextBlocks = data.contextBlocks.map(block => ({
          ...block,
          items: (block.items || []).map(item => ({
            ...item,
            subItems: item.subItems || []
          }))
        }));
      }
      
      // Проверяем наличие subItemIds во всех промптах
      if (data.promptBlocks) {
        data.promptBlocks = data.promptBlocks.map(block => ({
          ...block,
          selectedContexts: (block.selectedContexts || []).map(sel => ({
            ...sel,
            subItemIds: sel.subItemIds || []
          }))
        }));
      }
      
      const content = JSON.stringify(data, null, 2);
      console.log('Размер данных для сохранения:', content.length, 'символов');
      
      await window.electronAPI.writeFile(filePath, content);
      console.log('Проект успешно сохранен');
      
      return true;
    } catch (error) {
      console.error(`Ошибка при сохранении проекта ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Открывает диалог выбора файла проекта с использованием указанной папки проектов
   * @param {string} projectFolder - Путь к папке проектов
   * @returns {Promise<string|null>} - Путь к выбранному файлу или null при отмене
   */
  static async openProjectDialog(projectFolder) {
    try {
      console.log('Открытие диалога выбора файла проекта из папки:', projectFolder);
      const options = {
        filters: [
          { name: 'JSON Files', extensions: ['json'] }
        ]
      };
      
      // Если указана папка проектов, используем её как начальную директорию
      if (projectFolder) {
        options.defaultPath = projectFolder;
      }
      
      const filePath = await window.electronAPI.openFileDialog(options);
      
      console.log('Выбранный файл проекта:', filePath);
      return filePath;
    } catch (error) {
      console.error('Ошибка при открытии диалога выбора проекта:', error);
      return null;
    }
  }

  /**
   * Открывает диалог сохранения файла проекта с использованием указанной папки проектов
   * @param {string} defaultName - Имя файла по умолчанию
   * @param {string} projectFolder - Путь к папке проектов
   * @returns {Promise<string|null>} - Путь к файлу или null при отмене
   */
  static async saveProjectDialog(defaultName = 'project.json', projectFolder) {
    try {
      console.log('Открытие диалога сохранения проекта с именем:', defaultName, 'в папку:', projectFolder);
      let fullPath = defaultName;

      // Если указана папка проектов, объединяем её с именем файла
      if (projectFolder) {
        try {
          fullPath = window.path.join(projectFolder, defaultName);
        } catch (e) {
          fullPath = `${projectFolder}/${defaultName}`;
        }
      }
      
      const options = {
        defaultPath: fullPath,
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      };
      
      console.log('Опции диалога сохранения:', options);
      const filePath = await window.electronAPI.saveFileDialog(options);
      
      console.log('Выбранный путь для сохранения проекта:', filePath);
      return filePath;
    } catch (error) {
      console.error('Ошибка при открытии диалога сохранения проекта:', error);
      return null;
    }
  }

  /**
   * Создает имя файла из названия проекта
   * @param {string} projectName - Название проекта
   * @returns {string} - Имя файла
   */
  static projectNameToFilename(projectName) {
    if (!projectName) return 'project.json';
    
    console.log('Преобразование названия проекта в имя файла:', projectName);
    
    // Преобразуем название проекта в безопасное имя файла
    const safeFilename = projectName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_а-яА-ЯёЁ]/g, '') // Добавляем поддержку кириллицы
      .trim();
    
    // Если после обработки имя пустое, используем стандартное
    if (!safeFilename) return 'project.json';
    
    // Добавляем расширение .json
    const result = `${safeFilename}.json`;
    console.log('Результат преобразования:', result);
    return result;
  }
  
  /**
   * Преобразует имя файла в название проекта
   * @param {string} filename - Имя файла (с расширением или без)
   * @returns {string} - Название проекта
   */
  static filenameToProjectName(filename) {
    if (!filename) return 'New Project';
    
    console.log('Преобразование имени файла в название проекта:', filename);
    
    // Убираем расширение .json
    const nameWithoutExt = filename.replace(/\.json$/, '');
    
    // Убираем путь, если он есть (берем только имя файла после последнего слеша или бэкслеша)
    const baseName = nameWithoutExt.split(/[/\\]/).pop();
    
    // Преобразуем имя файла в читаемое название проекта
    // Заменяем подчеркивания пробелами и делаем первую букву каждого слова заглавной
    const projectName = baseName
      .split('_')
      .map(word => {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
    
    console.log('Результат преобразования имени файла в название проекта:', projectName);
    return projectName;
  }
}

export default ProjectService;