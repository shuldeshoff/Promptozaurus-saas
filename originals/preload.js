// preload.js - Скрипт предзагрузки для безопасной коммуникации между рендер-процессом и главным процессом
const { contextBridge, ipcRenderer } = require('electron');

// Определение API для рендер-процесса
// Это позволяет безопасно вызывать функции из главного процесса Electron
contextBridge.exposeInMainWorld('electronAPI', {
  // Общий метод для вызова любого IPC канала
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  
  // Методы для работы с файлами
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  writeFile: (path, content) => ipcRenderer.invoke('write-file', path, content),
  
  // Методы для работы с диалогами выбора файлов
  openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options),
  saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),
  selectDirectory: (options) => ipcRenderer.invoke('select-directory', options),
  
  // Методы для работы с шаблонами промптов
  readTemplateFiles: () => ipcRenderer.invoke('read-template-files'),
  readTemplateContent: (filename) => ipcRenderer.invoke('read-template-content', filename),
  saveTemplateContent: (filename, content) => ipcRenderer.invoke('save-template-content', filename, content),
  
  // Методы для работы с шаблонами проектов
  getProjectTemplatesPath: () => ipcRenderer.invoke('get-project-templates-path'),
  readProjectTemplates: () => ipcRenderer.invoke('read-project-templates'),
  readProjectTemplate: (filename) => ipcRenderer.invoke('read-project-template', filename),
  saveProjectTemplate: (filename, content) => ipcRenderer.invoke('save-project-template', filename, content),
  
  // Методы для работы с проектами
  getProjectsPath: () => ipcRenderer.invoke('get-projects-path'),
  readProjects: () => ipcRenderer.invoke('read-projects'),
  
  // Методы для работы с блоками контекста
  getContextDataPath: () => ipcRenderer.invoke('get-context-data-path'),
  readContextBlocks: () => ipcRenderer.invoke('read-context-blocks'),
  exportContextBlock: (blockId, blockData) => ipcRenderer.invoke('export-context-block', blockId, blockData),
  importContextBlock: () => ipcRenderer.invoke('import-context-block'),
  
  // Методы для управления приложением
  reloadApp: () => ipcRenderer.send('reload-app'),
  exitApp: () => ipcRenderer.send('exit-app'),
  
  // Методы для работы с проверкой орфографии
  addWordToDictionary: (word) => ipcRenderer.invoke('add-word-to-dictionary', word),
  getAvailableSpellcheckerLanguages: () => ipcRenderer.invoke('get-available-spellchecker-languages'),
  setSpellcheckerLanguages: (languages) => ipcRenderer.invoke('set-spellchecker-languages', languages),
  
  // Методы для работы с состоянием приложения
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  ensureDirectory: (dirPath) => ipcRenderer.invoke('ensure-directory', dirPath),
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath)
});

console.log('Preload script загружен - API инициализирован');