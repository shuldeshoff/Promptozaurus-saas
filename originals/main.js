// main-new.js - Рефакторенная версия главного процесса Electron
// @description: Модульная версия main.js с разделением на логические компоненты
// @created: 2025-06-25 - результат рефакторинга main.js (1028 строк → модульная архитектура)

const { app, BrowserWindow, ipcMain } = require('electron');

// Импорт всех модулей
const { createWindow } = require('./main/electronWindow');
const { registerLifecycleHandlers, handleExitApp, handleForceQuit } = require('./main/appLifecycle');
const { registerFileHandlers } = require('./main/fileOperations');
const { registerProjectHandlers } = require('./main/projectManager');
const { registerUserFolderHandlers } = require('./main/userFolders');
const { registerLegacyTemplateHandlers } = require('./main/templatesLegacy');
const { registerCredentialHandlers } = require('./main/aiCredentials');
const { registerAIHttpHandlers } = require('./main/aiHttpClient');

// Отключаем прокси-сервер, чтобы избежать ошибок SSL при запуске
app.commandLine.appendSwitch('no-proxy-server');

// Включаем поддержку русского языка для проверки орфографии
app.commandLine.appendSwitch('lang', 'ru-RU');
app.commandLine.appendSwitch('enable-spellchecking');

// Регистрация всех обработчиков IPC
function registerAllHandlers() {
  console.log('Регистрация всех IPC обработчиков');
  
  registerFileHandlers();
  registerProjectHandlers();
  registerUserFolderHandlers();
  registerLegacyTemplateHandlers();
  registerCredentialHandlers();
  registerAIHttpHandlers();
  
  // Обработчики для управления приложением
  ipcMain.on('reload-app', () => {
    console.log('Получен запрос на перезагрузку');
    const mainWindow = require('./main/electronWindow').getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.reloadIgnoringCache();
    }
  });
  
  ipcMain.on('exit-app', handleExitApp);
  ipcMain.handle('force-quit', handleForceQuit);
}

// Инициализация приложения, когда Electron готов
app.whenReady().then(() => {
  console.log('Electron готов - инициализация приложения');
  
  // Регистрируем все обработчики
  registerAllHandlers();
  
  // Регистрируем обработчики жизненного цикла
  registerLifecycleHandlers();
  
  // Создаем главное окно
  createWindow();
  
  // На macOS обычно пересоздают окно, когда нажимают на иконку в доке
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

console.log('Главный процесс Electron инициализирован (модульная версия)');