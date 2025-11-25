// main/appLifecycle.js - Управление жизненным циклом Electron приложения
// @description: Обработка событий приложения, выход и завершение процессов
// @created: 2025-06-25 - выделено из main.js при рефакторинге

const { app, BrowserWindow } = require('electron');

// Флаг для отслеживания процесса выхода
let isQuitting = false;

// Переменная для хранения ссылки на file watcher
let fileWatcher = null;

// Функция для установки file watcher
const setFileWatcher = (watcher) => {
  fileWatcher = watcher;
};

// Обработчик события перед выходом
const handleBeforeQuit = (event) => {
  console.log('Событие before-quit');
  isQuitting = true;
};

// Обработчик завершения работы приложения
const handleWillQuit = (event) => {
  console.log('Событие will-quit - приложение завершает работу');
  // Отправляем сигнал родительскому процессу (npm/concurrently)
  if (process.send) {
    process.send('shutdown');
  }
};

// Закрытие приложения при закрытии всех окон (кроме macOS)
const handleWindowAllClosed = () => {
  console.log('Все окна закрыты');
  if (process.platform !== 'darwin') {
    app.quit();
    // Принудительное завершение, если app.quit() не сработал
    setTimeout(() => {
      if (!isQuitting) {
        console.log('Принудительное завершение через window-all-closed');
        process.exit(0);
      }
    }, 1000);
  }
};

// Обработчик принудительного выхода
const handleForceQuit = () => {
  console.log('Принудительный выход из приложения');
  // Устанавливаем флаг, чтобы пропустить все проверки
  global.forceQuit = true;
  // Принудительно закрываем все окна
  BrowserWindow.getAllWindows().forEach(window => {
    window.destroy();
  });
  // Выходим из приложения
  app.quit();
};

// Обработчик выхода из приложения
const handleExitApp = () => {
  console.log('Получен запрос на выход из приложения');
  
  if (isQuitting) {
    console.log('Выход уже в процессе...');
    return;
  }
  
  isQuitting = true;
  
  // Закрываем file watcher если он есть
  if (fileWatcher) {
    console.log('Закрытие file watcher...');
    fileWatcher.close();
    fileWatcher = null;
  }
  
  // Отключаем все обработчики и наблюдатели
  const { isDev } = require('./pathsConfig');
  if (isDev) {
    BrowserWindow.getAllWindows().forEach(window => {
      window.removeAllListeners();
    });
  }
  
  // Закрываем все окна
  BrowserWindow.getAllWindows().forEach(window => {
    window.removeAllListeners();
    window.destroy();
  });
  
  // Принудительно выходим из приложения
  app.quit();
  
  // Если app.quit() не сработал, используем process.exit()
  setTimeout(() => {
    console.log('Принудительное завершение процесса');
    // Пробуем завершить всю группу процессов
    try {
      if (process.platform === 'win32') {
        // На Windows убиваем процесс по PID
        require('child_process').exec(`taskkill /pid ${process.pid} /T /F`);
      } else {
        // На Unix-системах убиваем группу процессов
        process.kill(-process.pid, 'SIGTERM');
      }
    } catch (e) {
      console.error('Ошибка при завершении группы процессов:', e);
    }
    // Финальная попытка
    process.exit(0);
  }, 500);
};

// Регистрация всех обработчиков жизненного цикла
const registerLifecycleHandlers = () => {
  app.on('window-all-closed', handleWindowAllClosed);
  app.on('before-quit', handleBeforeQuit);
  app.on('will-quit', handleWillQuit);
};

module.exports = {
  isQuitting,
  setFileWatcher,
  handleForceQuit,
  handleExitApp,
  registerLifecycleHandlers
};