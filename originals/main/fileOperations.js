// main/fileOperations.js - Базовые файловые операции и диалоги
// @description: Общие операции чтения/записи файлов, диалоги открытия/сохранения
// @created: 2025-06-25 - выделено из main.js при рефакторинге

const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { paths } = require('./pathsConfig');

// Регистрация всех обработчиков файловых операций
function registerFileHandlers() {
  // Обработчик для чтения файла
  ipcMain.handle('read-file', handleReadFile);
  
  // Обработчик для записи файла
  ipcMain.handle('write-file', handleWriteFile);
  
  // Обработчик диалога «Открыть файл»
  ipcMain.handle('open-file-dialog', handleOpenFileDialog);
  
  // Обработчик диалога «Сохранить файл»
  ipcMain.handle('save-file-dialog', handleSaveFileDialog);
  
  // Обработчик для выбора директории
  ipcMain.handle('select-directory', handleSelectDirectory);
  
  // Обработчики для работы с состоянием приложения
  ipcMain.handle('get-app-data-path', handleGetAppDataPath);
  ipcMain.handle('get-user-data-path', handleGetUserDataPath);
  ipcMain.handle('ensure-directory', handleEnsureDirectory);
  ipcMain.handle('file-exists', handleFileExists);
  ipcMain.handle('delete-file', handleDeleteFile);
}

// Обработчик для чтения файла
async function handleReadFile(event, filePath) {
  try {
    console.log('Чтение файла:', filePath);
    const data = await fs.promises.readFile(filePath, 'utf8');
    return data;
  } catch (error) {
    console.error('Ошибка при чтении файла:', error);
    throw error;
  }
}

// Обработчик для записи файла
async function handleWriteFile(event, filePath, content) {
  try {
    console.log('Запись в файл:', filePath);
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
      await fs.promises.mkdir(dirname, { recursive: true });
    }
    await fs.promises.writeFile(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error('Ошибка при записи файла:', error);
    throw error;
  }
}

// Обработчик диалога «Открыть файл»
async function handleOpenFileDialog(event, options = {}) {
  console.log('Открытие диалога выбора файла, опции:', options);
  const defaultOptions = {
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  };
  const merged = { ...defaultOptions, ...options };
  const { canceled, filePaths } = await dialog.showOpenDialog(merged);
  if (canceled) return null;
  return filePaths[0] || null;
}

// Обработчик диалога «Сохранить файл»
async function handleSaveFileDialog(event, options = {}) {
  console.log('Открытие диалога сохранения файла, опции:', options);
  const defaultOptions = {
    defaultPath: options.defaultPath || path.join(paths.projects, 'project.json'),
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  };
  const merged = { ...defaultOptions, ...options };
  
  const { canceled, filePath } = await dialog.showSaveDialog(merged);
  if (canceled) return null;
  return filePath;
}

// Обработчик для выбора директории
async function handleSelectDirectory() {
  console.log('Выбор директории (openDirectory)');
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (canceled || !filePaths.length) {
    return null;
  }
  return filePaths[0];
}

// Обработчики для работы с состоянием приложения
async function handleGetAppDataPath() {
  const { app } = require('electron');
  return app.getPath('userData');
}

async function handleGetUserDataPath() {
  const { app } = require('electron');
  return app.getPath('userData');
}

async function handleEnsureDirectory(event, dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('Ошибка при создании директории:', error);
    return false;
  }
}

async function handleFileExists(event, filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error('Ошибка при проверке существования файла:', error);
    return false;
  }
}

async function handleDeleteFile(event, filePath) {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
    return true;
  } catch (error) {
    console.error('Ошибка при удалении файла:', error);
    return false;
  }
}

module.exports = {
  registerFileHandlers
};