// main/electronWindow.js - Создание и настройка главного окна Electron
// @description: Управление окном приложения, настройки безопасности, орфография и live-reload
// @created: 2025-06-25 - выделено из main.js при рефакторинге

const { BrowserWindow, Menu, MenuItem } = require('electron');
const path = require('path');
const { isDev, initializeDirectories } = require('./pathsConfig');
const { setFileWatcher } = require('./appLifecycle');

// Переменная для хранения ссылки на главное окно
let mainWindow = null;

// Создание окна приложения
function createWindow() {
  console.log('Создание главного окна приложения');
  
  // Отключаем кэш для режима разработки
  if (isDev) {
    const { app } = require('electron');
    app.commandLine.appendSwitch('disable-http-cache');
    console.log('Кэш отключен для режима разработки');
  }
  
  // Проверяем и создаем необходимые директории
  initializeDirectories();
  
  // Создаем основное окно браузера
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'PromptyFlow',
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    webPreferences: {
      // Отключаем прямую интеграцию с Node.js в целях безопасности
      nodeIntegration: false,
      // Включаем изоляцию контекста для безопасности
      contextIsolation: true,
      // Путь к скрипту предзагрузки для безопасной коммуникации
      preload: path.join(__dirname, '..', 'preload.js'),
      // Включаем проверку орфографии
      spellcheck: true
    }
  });

  // Устанавливаем языки для проверки орфографии
  mainWindow.webContents.session.setSpellCheckerLanguages(['ru', 'en-US']);
  
  // Предотвращаем показ диалога о несохраненных изменениях
  mainWindow.webContents.on('will-prevent-unload', (event) => {
    console.log('Предотвращение стандартного диалога закрытия');
    event.preventDefault();
  });

  // Обрабатываем контекстное меню для показа вариантов исправления ошибок
  setupSpellCheckContextMenu();

  // Настраиваем live-reload для разработки или обычную загрузку для продакшна
  setupWindowLoading();
  
  return mainWindow;
}

// Настройка контекстного меню для проверки орфографии
function setupSpellCheckContextMenu() {
  mainWindow.webContents.on('context-menu', (event, params) => {
    // Проверяем, есть ли подчеркнутое слово с ошибкой
    if (params.misspelledWord) {
      const menu = new Menu();
      
      // Добавляем варианты исправления ошибки
      params.dictionarySuggestions.forEach(suggestion => {
        menu.append(new MenuItem({
          label: suggestion,
          click: () => {
            // Заменяем ошибочное слово на выбранный вариант
            mainWindow.webContents.replaceMisspelling(suggestion);
          }
        }));
      });
      
      // Добавляем разделитель, если есть варианты
      if (params.dictionarySuggestions.length > 0) {
        menu.append(new MenuItem({ type: 'separator' }));
      }
      
      // Добавляем опцию «Добавить в словарь»
      menu.append(new MenuItem({
        label: 'Добавить в словарь',
        click: () => {
          mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord);
        }
      }));
      
      // Показываем контекстное меню
      menu.popup();
    }
  });
}

// Настройка загрузки окна с live-reload для разработки
function setupWindowLoading() {
  // В режиме разработки загружаем index.html из dist с live-reload
  if (isDev) {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    // Открываем DevTools в режиме разработки
    mainWindow.webContents.openDevTools();
    console.log('Приложение запущено в режиме разработки');
    
    // Подключаем chokidar для live-reload
    setupLiveReload();
  } else {
    // В продакшене
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    console.log('Приложение запущено в производственном режиме');
    
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }
}

// Настройка live-reload для режима разработки
function setupLiveReload() {
  try {
    const chokidar = require('chokidar');
    const fileWatcher = chokidar.watch(path.join(__dirname, '..', 'dist'), {
      ignored: /(^|[\/\\])\../, // игнорируем скрытые файлы
      persistent: true
    });
    
    fileWatcher.on('change', (changedPath) => {
      console.log('Обнаружены изменения в файле:', changedPath);
      if (mainWindow && !mainWindow.isDestroyed()) {
        console.log('Перезагрузка приложения...');
        mainWindow.webContents.reloadIgnoringCache();
      }
    });
    
    // При закрытии окна — закрываем watcher
    mainWindow.on('closed', () => {
      if (fileWatcher) {
        console.log('Закрытие наблюдателя при закрытии окна');
        fileWatcher.close();
      }
      mainWindow = null;
    });
    
    // Сохраняем ссылку на watcher в модуле lifecycle
    setFileWatcher(fileWatcher);
    
  } catch (error) {
    console.error('Ошибка при настройке наблюдателя chokidar:', error);
  }
}

// Получение ссылки на главное окно
function getMainWindow() {
  return mainWindow;
}

module.exports = {
  createWindow,
  getMainWindow
};