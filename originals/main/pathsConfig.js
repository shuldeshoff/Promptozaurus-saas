// main/pathsConfig.js - Конфигурация путей к ресурсам и управление директориями
// @description: Централизованное управление путями проекта и создание необходимых директорий
// @created: 2025-06-25 - выделено из main.js при рефакторинге

const path = require('path');
const fs = require('fs');

// Определяем, в режиме разработки мы или нет
const isDev = process.argv.includes('--dev');

// Функция для получения путей к ресурсам в зависимости от режима (разработка/продакшн)
const getResourcePath = (folderName) => {
  if (isDev) {
    return path.join(__dirname, '..', folderName);
  } else {
    return path.join(process.resourcesPath, folderName);
  }
};

// Функция для проверки и создания директории, если она не существует
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    console.log(`Создание директории: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Пути к директориям с разными типами файлов по умолчанию
const templatesPath = getResourcePath('templates');
const projectTemplatesPath = getResourcePath('project_templates');
const projectsPath = getResourcePath('projects');
const contextDataPath = getResourcePath('context_data');

// Функция инициализации всех необходимых директорий
const initializeDirectories = () => {
  console.log('Инициализация директорий проекта');
  
  ensureDirectoryExists(templatesPath);
  ensureDirectoryExists(projectTemplatesPath);
  ensureDirectoryExists(projectsPath);
  ensureDirectoryExists(contextDataPath);
  
  console.log('Пути к ресурсам:');
  console.log('Шаблоны промптов:', templatesPath);
  console.log('Шаблоны проектов:', projectTemplatesPath);
  console.log('Проекты:', projectsPath);
  console.log('Блоки контекста:', contextDataPath);
};

module.exports = {
  isDev,
  getResourcePath,
  ensureDirectoryExists,
  initializeDirectories,
  paths: {
    templates: templatesPath,
    projectTemplates: projectTemplatesPath,
    projects: projectsPath,
    contextData: contextDataPath
  }
};