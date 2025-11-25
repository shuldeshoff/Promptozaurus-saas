// main/userFolders.js - Операции с пользовательскими папками и txt файлами
// @description: Чтение и запись txt файлов из указанных пользователем папок
// @created: 2025-06-25 - выделено из main.js при рефакторинге

const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { ensureDirectoryExists } = require('./pathsConfig');

// Регистрация всех обработчиков пользовательских папок
function registerUserFolderHandlers() {
  // Обработчики для работы с пользовательской папкой (читать/записывать txt)
  ipcMain.handle('read-template-files-from-path', handleReadTemplateFilesFromPath);
  ipcMain.handle('read-template-content-from-path', handleReadTemplateContentFromPath);
  ipcMain.handle('save-template-content-to-path', handleSaveTemplateContentToPath);
}

// Чтение списка .txt файлов из указанной папки
async function handleReadTemplateFilesFromPath(event, folderPath) {
  try {
    console.log('Чтение списка .txt-файлов из папки:', folderPath);
    if (!fs.existsSync(folderPath)) {
      ensureDirectoryExists(folderPath);
    }
    const items = fs.readdirSync(folderPath, { withFileTypes: true });
    const files = items
      .filter(dirent => dirent.isFile())
      .map(dirent => dirent.name)
      .filter(name => name.endsWith('.txt'));
    return files;
  } catch (error) {
    console.error('Ошибка read-template-files-from-path:', error);
    return [];
  }
}

// Чтение содержимого txt файла из указанной папки
async function handleReadTemplateContentFromPath(event, folderPath, filename) {
  try {
    if (!fs.existsSync(folderPath)) {
      ensureDirectoryExists(folderPath);
    }
    const filePath = path.join(folderPath, filename);
    console.log(`Чтение файла ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error('Ошибка read-template-content-from-path:', error);
    throw error;
  }
}

// Сохранение txt файла в указанную папку
async function handleSaveTemplateContentToPath(event, folderPath, filename, content) {
  try {
    console.log(`Сохранение в папку ${folderPath}, файл ${filename}`);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    const filePath = path.join(folderPath, filename);
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error('Ошибка save-template-content-to-path:', error);
    return false;
  }
}

module.exports = {
  registerUserFolderHandlers
};