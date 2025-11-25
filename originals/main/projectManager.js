// main/projectManager.js - Управление проектами и контекстными блоками
// @description: Операции с проектами, шаблонами проектов, контекстными блоками, импорт/экспорт
// @created: 2025-06-25 - выделено из main.js при рефакторинге

const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { paths, ensureDirectoryExists } = require('./pathsConfig');

// Регистрация всех обработчиков проектов
function registerProjectHandlers() {
  // Обработчики путей к папкам
  ipcMain.handle('get-project-templates-path', handleGetProjectTemplatesPath);
  ipcMain.handle('get-projects-path', handleGetProjectsPath);
  ipcMain.handle('get-context-data-path', handleGetContextDataPath);
  
  // Обработчики чтения списков файлов
  ipcMain.handle('read-project-templates', handleReadProjectTemplates);
  ipcMain.handle('read-projects', handleReadProjects);
  ipcMain.handle('read-context-blocks', handleReadContextBlocks);
  
  // Обработчики для работы с шаблонами проектов
  ipcMain.handle('read-project-template', handleReadProjectTemplate);
  ipcMain.handle('save-project-template', handleSaveProjectTemplate);
  
  // Обработчики для работы с контекстными блоками
  ipcMain.handle('export-context-block', handleExportContextBlock);
  ipcMain.handle('import-context-block', handleImportContextBlock);
}

// Папка для шаблонов проектов
async function handleGetProjectTemplatesPath() {
  ensureDirectoryExists(paths.projectTemplates);
  return paths.projectTemplates;
}

// Папка для проектов
async function handleGetProjectsPath() {
  ensureDirectoryExists(paths.projects);
  return paths.projects;
}

// Папка для блоков контекста
async function handleGetContextDataPath() {
  ensureDirectoryExists(paths.contextData);
  return paths.contextData;
}

// Читаем список шаблонов проектов
async function handleReadProjectTemplates() {
  try {
    ensureDirectoryExists(paths.projectTemplates);
    const files = await fs.promises.readdir(paths.projectTemplates);
    return files.filter(f => f.endsWith('.json'));
  } catch (error) {
    console.error('Ошибка при чтении списка шаблонов проектов:', error);
    throw error;
  }
}

// Читаем список проектов
async function handleReadProjects() {
  try {
    ensureDirectoryExists(paths.projects);
    const files = await fs.promises.readdir(paths.projects);
    return files.filter(f => f.endsWith('.json'));
  } catch (error) {
    console.error('Ошибка при чтении списка проектов:', error);
    throw error;
  }
}

// Читаем список контекстных блоков
async function handleReadContextBlocks() {
  try {
    ensureDirectoryExists(paths.contextData);
    const files = await fs.promises.readdir(paths.contextData);
    return files.filter(f => f.endsWith('.json'));
  } catch (error) {
    console.error('Ошибка при чтении контекстных блоков:', error);
    throw error;
  }
}

// Читаем шаблон проекта
async function handleReadProjectTemplate(event, filename) {
  try {
    const filePath = path.join(paths.projectTemplates, filename);
    console.log('Чтение шаблона проекта:', filePath);
    const content = await fs.promises.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error(`Ошибка при чтении шаблона проекта ${filename}:`, error);
    throw error;
  }
}

// Сохраняем шаблон проекта
async function handleSaveProjectTemplate(event, filename, content) {
  try {
    ensureDirectoryExists(paths.projectTemplates);
    const filePath = path.join(paths.projectTemplates, filename);
    console.log('Сохранение шаблона проекта:', filePath);
    await fs.promises.writeFile(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Ошибка при сохранении шаблона проекта ${filename}:`, error);
    throw error;
  }
}

// Обновленный обработчик экспорта контекстного блока с поддержкой указанной директории
async function handleExportContextBlock(event, blockId, blockData, options = {}) {
  try {
    console.log(`Экспорт блока контекста ${blockId}`);
    const safeFilename = blockData.title
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_а-яА-ЯёЁ]/g, '')
      .trim();
    const defaultFilename = safeFilename || `context_block_${blockId}`;
    
    // Используем указанный contextDataFolder или директорию по умолчанию
    let defaultPath = options.defaultPath || paths.contextData;
    if (!fs.existsSync(defaultPath)) {
      ensureDirectoryExists(defaultPath);
    }
    
    defaultPath = path.join(defaultPath, `${defaultFilename}.json`);
    
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath,
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    
    if (canceled) {
      console.log('Пользователь отменил экспорт контекстного блока');
      return { success: false, canceled: true };
    }
    
    const exportData = {
      ...blockData,
      exportedAt: new Date().toISOString()
    };
    
    await fs.promises.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf8');
    console.log(`Блок контекста ${blockId} экспортирован в ${filePath}`);
    return { success: true, filePath };
  } catch (error) {
    console.error(`Ошибка экспорта блока контекста ${blockId}:`, error);
    return { success: false, error: error.message };
  }
}

// Обновленный обработчик импорта контекстного блока с поддержкой указанной директории
async function handleImportContextBlock(event, options = {}) {
  try {
    console.log('Импорт контекстного блока');
    
    // Используем указанный contextDataFolder или директорию по умолчанию
    let defaultPath = options.defaultPath || paths.contextData;
    if (!fs.existsSync(defaultPath)) {
      ensureDirectoryExists(defaultPath);
    }
    
    const { canceled, filePaths } = await dialog.showOpenDialog({
      defaultPath,
      properties: ['openFile'],
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    
    if (canceled || !filePaths[0]) {
      return { success: false, canceled: true };
    }
    
    const content = await fs.promises.readFile(filePaths[0], 'utf8');
    const blockData = JSON.parse(content);
    return { success: true, blockData };
  } catch (error) {
    console.error('Ошибка при импорте контекстного блока:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  registerProjectHandlers
};