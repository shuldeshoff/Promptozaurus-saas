// main/templatesLegacy.js - Устаревшие операции с шаблонами промптов
// @description: Поддержка старых операций с txt шаблонами (можно не использовать)
// @created: 2025-06-25 - выделено из main.js при рефакторинге

const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { paths, ensureDirectoryExists } = require('./pathsConfig');

// Регистрация всех legacy обработчиков шаблонов
function registerLegacyTemplateHandlers() {
  // Чтение списка файлов шаблонов (историческая — можно не использовать, если есть новый механизм)
  ipcMain.handle('read-template-files', handleReadTemplateFiles);
  
  // Чтение содержимого файла шаблона (историческое)
  ipcMain.handle('read-template-content', handleReadTemplateContent);
  
  // Сохранение шаблона (историческое)
  ipcMain.handle('save-template-content', handleSaveTemplateContent);
}

// Чтение списка файлов шаблонов (историческая функция)
async function handleReadTemplateFiles() {
  try {
    console.log('Чтение списка файлов из:', paths.templates);
    ensureDirectoryExists(paths.templates);
    const files = await fs.promises.readdir(paths.templates);
    return files.filter(f => f.endsWith('.txt'));
  } catch (error) {
    console.error('Ошибка при чтении списка шаблонов:', error);
    throw error;
  }
}

// Чтение содержимого файла шаблона (историческое)
async function handleReadTemplateContent(event, filename) {
  try {
    const filePath = path.join(paths.templates, filename);
    console.log('Чтение шаблона:', filePath);
    const content = await fs.promises.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error(`Ошибка при чтении шаблона ${filename}:`, error);
    throw error;
  }
}

// Сохранение шаблона (историческое)
async function handleSaveTemplateContent(event, filename, content) {
  try {
    ensureDirectoryExists(paths.templates);
    const filePath = path.join(paths.templates, filename);
    console.log('Сохранение шаблона:', filePath);
    await fs.promises.writeFile(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Ошибка при сохранении шаблона ${filename}:`, error);
    throw error;
  }
}

module.exports = {
  registerLegacyTemplateHandlers
};