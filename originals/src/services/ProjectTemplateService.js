// src/services/ProjectTemplateService.js

console.log('Инициализация ProjectTemplateService');

class ProjectTemplateService {
  static async getProjectTemplatesPath() {
    try {
      return await window.electronAPI.getProjectTemplatesPath();
    } catch (err) {
      console.error('Ошибка при getProjectTemplatesPath:', err);
      return null;
    }
  }

  static async readProjectTemplates() {
    try {
      const files = await window.electronAPI.readProjectTemplates();
      return files;
    } catch (err) {
      console.error('Ошибка при чтении списка шаблонов проектов:', err);
      return [];
    }
  }

  /**
   * Открывает диалог выбора файла шаблона проекта с использованием указанной папки
   * @param {string} projectTemplateFolder - Путь к папке шаблонов проектов
   */
  static async openTemplateDialog(projectTemplateFolder = null) {
    try {
      const templatesPath = projectTemplateFolder || await this.getProjectTemplatesPath();
      const options = {
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      };
      
      if (templatesPath) {
        options.defaultPath = templatesPath;
      }
      
      const filePath = await window.electronAPI.openFileDialog(options);
      return filePath;
    } catch (err) {
      console.error('Ошибка при openTemplateDialog:', err);
      return null;
    }
  }

  static async loadProjectTemplate(filename) {
    try {
      console.log(`Загрузка шаблона проекта ${filename}`);
      const content = await window.electronAPI.readProjectTemplate(filename);
      
      if (!content) {
        console.error(`Пустое содержимое шаблона проекта ${filename}`);
        return null;
      }
      
      let templateData;
      try {
        templateData = JSON.parse(content);
      } catch (parseError) {
        console.error(`Ошибка парсинга JSON для шаблона ${filename}:`, parseError);
        return null;
      }
      
      console.log(`Шаблон загружен, начинаем миграцию данных...`);
      
      // Добавляем поле subItems для элементов контекста, если его нет
      if (templateData.contextBlocks) {
        templateData.contextBlocks = templateData.contextBlocks.map(block => ({
          ...block,
          items: (block.items || []).map(item => ({
            ...item,
            subItems: item.subItems || [] // Добавляем пустой массив подэлементов, если его нет
          }))
        }));
      }
      
      // Добавляем поле subItemIds для выбранных элементов контекста в промптах, если его нет
      if (templateData.promptBlocks) {
        templateData.promptBlocks = templateData.promptBlocks.map(block => ({
          ...block,
          selectedContexts: (block.selectedContexts || []).map(sel => ({
            ...sel,
            subItemIds: sel.subItemIds || [] // Добавляем пустой массив ID подэлементов, если его нет
          }))
        }));
      }
      
      if (!templateData.templateName) {
        templateData.templateName = this.filenameToTitle(filename);
      }
      if (!templateData.projectName) {
        templateData.projectName = 'New Project';
      }
      templateData.fileName = filename;
      
      console.log(`Миграция данных завершена для шаблона ${filename}`);
      return templateData;
    } catch (err) {
      console.error(`Ошибка при загрузке шаблона проекта ${filename}:`, err);
      return null;
    }
  }

  /**
   * Сохраняет шаблон проекта с указанием конкретной директории
   * @param {string} filename - Имя файла шаблона
   * @param {Object} data - Данные шаблона
   * @param {string} projectTemplateFolder - Папка для сохранения шаблонов проектов
   */
  static async saveProjectTemplate(filename, data, projectTemplateFolder = null) {
    try {
      console.log(`Сохранение шаблона проекта: ${filename}`);
      const fullFilename = filename.endsWith('.json') ? filename : filename + '.json';
      
      // Проверяем и дополняем данные перед сохранением
      if (data.contextBlocks) {
        data.contextBlocks = data.contextBlocks.map(block => ({
          ...block,
          items: (block.items || []).map(item => ({
            ...item,
            subItems: item.subItems || []
          }))
        }));
      }
      
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
      
      // Если указана конкретная директория, используем путь к ней
      if (projectTemplateFolder) {
        const path = window.electronAPI.path || window.path;
        let filePath;
        
        if (path && path.join) {
          filePath = path.join(projectTemplateFolder, fullFilename);
        } else {
          filePath = `${projectTemplateFolder}/${fullFilename}`;
        }
        
        await window.electronAPI.writeFile(filePath, content);
      } else {
        // Иначе используем стандартный метод сохранения шаблона
        await window.electronAPI.saveProjectTemplate(fullFilename, content);
      }
      
      console.log(`Шаблон проекта сохранён: ${fullFilename}`);
      return true;
    } catch (err) {
      console.error(`Ошибка при сохранении шаблона проекта ${filename}:`, err);
      return false;
    }
  }

  /**
   * Создаём объект-шаблон из текущего состояния
   * ВАЖНО: Сохраняем templateFilename у промптов, чтобы не терять связь
   */
  static createTemplateFromState(state) {
    console.log('Создание шаблона проекта из state');
    
    // Обеспечиваем наличие subItems у всех элементов контекста
    const contextBlocks = state.contextBlocks.map(block => ({
      ...block,
      items: (block.items || []).map(item => ({
        ...item,
        subItems: item.subItems || []
      }))
    }));
    
    // Обеспечиваем наличие subItemIds у всех выбранных элементов контекста в промптах
    const promptBlocks = state.promptBlocks.map(block => ({
      ...block,
      selectedContexts: (block.selectedContexts || []).map(sel => ({
        ...sel,
        subItemIds: sel.subItemIds || []
      }))
    }));
    
    const templateData = {
      templateName: state.templateName,
      projectName: state.projectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contextBlocks,
      promptBlocks
    };

    return templateData;
  }

  static filenameToTitle(filename) {
    if (!filename) return 'Template';
    const nameWithoutExt = filename.replace(/\.json$/, '');
    return nameWithoutExt
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  static titleToFilename(title) {
    if (!title) return 'template.json';
    const safe = title.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9а-яА-ЯёЁ]/g, '');
    if (!safe) return 'template.json';
    return `${safe}.json`;
  }
}

export default ProjectTemplateService;