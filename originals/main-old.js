// main.js - Главный процесс Electron, отвечает за создание окна приложения и взаимодействие с OS
const { app, BrowserWindow, ipcMain, dialog, Menu, MenuItem } = require('electron');
const path = require('path');
const fs = require('fs');

// Отключаем прокси-сервер, чтобы избежать ошибок SSL при запуске
app.commandLine.appendSwitch('no-proxy-server');

// Включаем поддержку русского языка для проверки орфографии
app.commandLine.appendSwitch('lang', 'ru-RU');
app.commandLine.appendSwitch('enable-spellchecking');

// Переменная для хранения ссылки на главное окно
let mainWindow = null;

// Переменная для хранения ссылки на file watcher
let fileWatcher = null;

// Флаг для отслеживания процесса выхода
let isQuitting = false;

// Определяем, в режиме разработки мы или нет
const isDev = process.argv.includes('--dev');

// Функция для получения путей к ресурсам в зависимости от режима (разработка/продакшн)
const getResourcePath = (folderName) => {
  if (isDev) {
    return path.join(__dirname, folderName);
  } else {
    return path.join(process.resourcesPath, folderName);
  }
};

// Пути к директориям с разными типами файлов по умолчанию
const templatesPath = getResourcePath('templates');
const projectTemplatesPath = getResourcePath('project_templates');
const projectsPath = getResourcePath('projects');
const contextDataPath = getResourcePath('context_data');

// Функция для проверки и создания директории, если она не существует
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    console.log(`Создание директории: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Создание окна приложения
function createWindow() {
  console.log('Создание главного окна приложения');
  
  // Отключаем кэш для режима разработки
  if (isDev) {
    app.commandLine.appendSwitch('disable-http-cache');
    console.log('Кэш отключен для режима разработки');
  }
  
  // Проверяем и создаем необходимые директории
  ensureDirectoryExists(templatesPath);
  ensureDirectoryExists(projectTemplatesPath);
  ensureDirectoryExists(projectsPath);
  ensureDirectoryExists(contextDataPath);
  
  console.log('Пути к ресурсам:');
  console.log('Шаблоны промптов:', templatesPath);
  console.log('Шаблоны проектов:', projectTemplatesPath);
  console.log('Проекты:', projectsPath);
  console.log('Блоки контекста:', contextDataPath);
  
  // Создаем основное окно браузера
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Конструктор промптов',
    webPreferences: {
      // Отключаем прямую интеграцию с Node.js в целях безопасности
      nodeIntegration: false,
      // Включаем изоляцию контекста для безопасности
      contextIsolation: true,
      // Путь к скрипту предзагрузки для безопасной коммуникации
      preload: path.join(__dirname, 'preload.js'),
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

  // В режиме разработки загружаем index.html из dist с live-reload
  if (isDev) {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    // Открываем DevTools в режиме разработки
    mainWindow.webContents.openDevTools();
    console.log('Приложение запущено в режиме разработки');
    
    // Подключаем chokidar для live-reload
    try {
      const chokidar = require('chokidar');
      fileWatcher = chokidar.watch(path.join(__dirname, 'dist'), {
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
          fileWatcher = null;
        }
        mainWindow = null;
      });
    } catch (error) {
      console.error('Ошибка при настройке наблюдателя chokidar:', error);
    }
  } else {
    // В продакшене
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    console.log('Приложение запущено в производственном режиме');
    
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }
}

// Инициализация приложения, когда Electron готов
app.whenReady().then(() => {
  console.log('Electron готов - инициализация приложения');
  createWindow();
  
  // На macOS обычно пересоздают окно, когда нажимают на иконку в доке
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Закрытие приложения при закрытии всех окон (кроме macOS)
app.on('window-all-closed', function () {
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
});

// Обработчик события перед выходом
app.on('before-quit', (event) => {
  console.log('Событие before-quit');
  isQuitting = true;
});

// Обработчик завершения работы приложения
app.on('will-quit', (event) => {
  console.log('Событие will-quit - приложение завершает работу');
  // Отправляем сигнал родительскому процессу (npm/concurrently)
  if (process.send) {
    process.send('shutdown');
  }
});

// Обработчик ручной перезагрузки приложения
ipcMain.on('reload-app', () => {
  console.log('Получен запрос на перезагрузку');
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.reloadIgnoringCache();
  }
});

// Обработчик выхода из приложения
ipcMain.on('exit-app', () => {
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
  if (isDev && mainWindow) {
    mainWindow.removeAllListeners();
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
});

// Обработчик принудительного выхода
ipcMain.handle('force-quit', () => {
  console.log('Принудительный выход из приложения');
  // Устанавливаем флаг, чтобы пропустить все проверки
  global.forceQuit = true;
  // Принудительно закрываем все окна
  BrowserWindow.getAllWindows().forEach(window => {
    window.destroy();
  });
  // Выходим из приложения
  app.quit();
});

// Обработчик для чтения файла
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    console.log('Чтение файла:', filePath);
    const data = await fs.promises.readFile(filePath, 'utf8');
    return data;
  } catch (error) {
    console.error('Ошибка при чтении файла:', error);
    throw error;
  }
});

// Обработчик для записи файла
ipcMain.handle('write-file', async (event, filePath, content) => {
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
});

// Обработчик диалога «Открыть файл»
ipcMain.handle('open-file-dialog', async (event, options = {}) => {
  console.log('Открытие диалога выбора файла, опции:', options);
  const defaultOptions = {
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  };
  const merged = { ...defaultOptions, ...options };
  const { canceled, filePaths } = await dialog.showOpenDialog(merged);
  if (canceled) return null;
  return filePaths[0] || null;
});

// Обработчик диалога «Сохранить файл»
ipcMain.handle('save-file-dialog', async (event, options = {}) => {
  console.log('Открытие диалога сохранения файла, опции:', options);
  const defaultOptions = {
    defaultPath: options.defaultPath || path.join(projectsPath, 'project.json'),
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  };
  const merged = { ...defaultOptions, ...options };
  
  const { canceled, filePath } = await dialog.showSaveDialog(merged);
  if (canceled) return null;
  return filePath;
});

// Чтение списка файлов шаблонов (историческая — можно не использовать, если есть новый механизм)
ipcMain.handle('read-template-files', async () => {
  try {
    console.log('Чтение списка файлов из:', templatesPath);
    ensureDirectoryExists(templatesPath);
    const files = await fs.promises.readdir(templatesPath);
    return files.filter(f => f.endsWith('.txt'));
  } catch (error) {
    console.error('Ошибка при чтении списка шаблонов:', error);
    throw error;
  }
});

// Чтение содержимого файла шаблона (историческое)
ipcMain.handle('read-template-content', async (event, filename) => {
  try {
    const filePath = path.join(templatesPath, filename);
    console.log('Чтение шаблона:', filePath);
    const content = await fs.promises.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error(`Ошибка при чтении шаблона ${filename}:`, error);
    throw error;
  }
});

// Сохранение шаблона (историческое)
ipcMain.handle('save-template-content', async (event, filename, content) => {
  try {
    ensureDirectoryExists(templatesPath);
    const filePath = path.join(templatesPath, filename);
    console.log('Сохранение шаблона:', filePath);
    await fs.promises.writeFile(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Ошибка при сохранении шаблона ${filename}:`, error);
    throw error;
  }
});

// Папка для шаблонов проектов
ipcMain.handle('get-project-templates-path', async () => {
  ensureDirectoryExists(projectTemplatesPath);
  return projectTemplatesPath;
});

// Папка для проектов
ipcMain.handle('get-projects-path', async () => {
  ensureDirectoryExists(projectsPath);
  return projectsPath;
});

// Папка для блоков контекста
ipcMain.handle('get-context-data-path', async () => {
  ensureDirectoryExists(contextDataPath);
  return contextDataPath;
});

// Читаем список шаблонов проектов
ipcMain.handle('read-project-templates', async () => {
  try {
    ensureDirectoryExists(projectTemplatesPath);
    const files = await fs.promises.readdir(projectTemplatesPath);
    return files.filter(f => f.endsWith('.json'));
  } catch (error) {
    console.error('Ошибка при чтении списка шаблонов проектов:', error);
    throw error;
  }
});

// Читаем список проектов
ipcMain.handle('read-projects', async () => {
  try {
    ensureDirectoryExists(projectsPath);
    const files = await fs.promises.readdir(projectsPath);
    return files.filter(f => f.endsWith('.json'));
  } catch (error) {
    console.error('Ошибка при чтении списка проектов:', error);
    throw error;
  }
});

// Читаем список контекстных блоков
ipcMain.handle('read-context-blocks', async () => {
  try {
    ensureDirectoryExists(contextDataPath);
    const files = await fs.promises.readdir(contextDataPath);
    return files.filter(f => f.endsWith('.json'));
  } catch (error) {
    console.error('Ошибка при чтении контекстных блоков:', error);
    throw error;
  }
});

// Читаем шаблон проекта
ipcMain.handle('read-project-template', async (event, filename) => {
  try {
    const filePath = path.join(projectTemplatesPath, filename);
    console.log('Чтение шаблона проекта:', filePath);
    const content = await fs.promises.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error(`Ошибка при чтении шаблона проекта ${filename}:`, error);
    throw error;
  }
});

// Сохраняем шаблон проекта
ipcMain.handle('save-project-template', async (event, filename, content) => {
  try {
    ensureDirectoryExists(projectTemplatesPath);
    const filePath = path.join(projectTemplatesPath, filename);
    console.log('Сохранение шаблона проекта:', filePath);
    await fs.promises.writeFile(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Ошибка при сохранении шаблона проекта ${filename}:`, error);
    throw error;
  }
});

// Обновленный обработчик экспорта контекстного блока с поддержкой указанной директории
ipcMain.handle('export-context-block', async (event, blockId, blockData, options = {}) => {
  try {
    console.log(`Экспорт блока контекста ${blockId}`);
    const safeFilename = blockData.title
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_а-яА-ЯёЁ]/g, '')
      .trim();
    const defaultFilename = safeFilename || `context_block_${blockId}`;
    
    // Используем указанный contextDataFolder или директорию по умолчанию
    let defaultPath = options.defaultPath || contextDataPath;
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
});

// Обновленный обработчик импорта контекстного блока с поддержкой указанной директории
ipcMain.handle('import-context-block', async (event, options = {}) => {
  try {
    console.log('Импорт контекстного блока');
    
    // Используем указанный contextDataFolder или директорию по умолчанию
    let defaultPath = options.defaultPath || contextDataPath;
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
});

// Обработчик для выбора директории
ipcMain.handle('select-directory', async () => {
  console.log('Выбор директории (openDirectory)');
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (canceled || !filePaths.length) {
    return null;
  }
  return filePaths[0];
});

// Обработчики для работы с состоянием приложения
ipcMain.handle('get-app-data-path', async () => {
  return app.getPath('userData');
});

ipcMain.handle('ensure-directory', async (event, dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('Ошибка при создании директории:', error);
    return false;
  }
});

ipcMain.handle('file-exists', async (event, filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error('Ошибка при проверке существования файла:', error);
    return false;
  }
});

ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
    return true;
  } catch (error) {
    console.error('Ошибка при удалении файла:', error);
    return false;
  }
});

// === Новые обработчики для работы с пользовательской папкой (читать/записывать txt) ===
ipcMain.handle('read-template-files-from-path', async (event, folderPath) => {
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
});

ipcMain.handle('read-template-content-from-path', async (event, folderPath, filename) => {
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
});

ipcMain.handle('save-template-content-to-path', async (event, folderPath, filename, content) => {
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
});

// ================================
// AI INTEGRATION - CREDENTIALS & HTTP HANDLERS
// ================================

// Обработчики для безопасного хранения API ключей
// const keytar = require('keytar'); // Отключено из-за проблем совместимости
const https = require('https');
const crypto = require('crypto');

// Простое хранение без шифрования для локального использования
// Путь к файлу с credentials
const credentialsPath = path.join(app.getPath('userData'), 'api-credentials.json');

function loadCredentials() {
  try {
    if (fs.existsSync(credentialsPath)) {
      const data = fs.readFileSync(credentialsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Ошибка загрузки credentials:', error);
  }
  return {};
}

function saveCredentials(credentials) {
  try {
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Ошибка сохранения credentials:', error);
    return false;
  }
}

// Обработчик сохранения API ключа (простое сохранение)
ipcMain.handle('credentials-store', async (event, { service, account, password }) => {
  try {
    console.log(`Сохранение credentials: ${service}:${account}`);
    const credentials = loadCredentials();
    const key = `${service}:${account}`;
    credentials[key] = password; // Просто сохраняем без шифрования
    const success = saveCredentials(credentials);
    return { success };
  } catch (error) {
    console.error('Ошибка сохранения credentials:', error);
    return { success: false, error: error.message };
  }
});

// Обработчик получения API ключа (простое чтение)
ipcMain.handle('credentials-get', async (event, { service, account }) => {
  try {
    console.log(`Получение credentials: ${service}:${account}`);
    const credentials = loadCredentials();
    const key = `${service}:${account}`;
    if (!credentials[key]) {
      return { success: false, notFound: true };
    }
    const password = credentials[key]; // Просто читаем без расшифровки
    return { success: true, password };
  } catch (error) {
    console.error('Ошибка получения credentials:', error);
    return { success: false, error: error.message };
  }
});

// Обработчик удаления API ключа (простое удаление)
ipcMain.handle('credentials-remove', async (event, { service, account }) => {
  try {
    console.log(`Удаление credentials: ${service}:${account}`);
    const credentials = loadCredentials();
    const key = `${service}:${account}`;
    delete credentials[key];
    const success = saveCredentials(credentials);
    return { success };
  } catch (error) {
    console.error('Ошибка удаления credentials:', error);
    return { success: false, error: error.message };
  }
});

// Удалено - уже определено выше

// Используем те же функции для совместимости
const loadEncryptedCredentials = loadCredentials;
const saveEncryptedCredentials = saveCredentials;

// Обработчик сохранения через fallback хранение
ipcMain.handle('credentials-store-encrypted', async (event, { provider, apiKey }) => {
  try {
    console.log(`Сохранение ключа для: ${provider}`);
    const credentials = loadCredentials();
    credentials[provider] = apiKey; // Просто сохраняем
    const success = saveCredentials(credentials);
    return { success };
  } catch (error) {
    console.error('Ошибка сохранения ключа:', error);
    return { success: false, error: error.message };
  }
});

// Обработчик получения через fallback хранение
ipcMain.handle('credentials-get-encrypted', async (event, { provider }) => {
  try {
    console.log(`Получение ключа для: ${provider}`);
    const credentials = loadCredentials();
    if (!credentials[provider]) {
      return { success: false, notFound: true };
    }
    const apiKey = credentials[provider]; // Просто читаем
    return { success: true, apiKey };
  } catch (error) {
    console.error('Ошибка получения ключа:', error);
    return { success: false, error: error.message };
  }
});

// Обработчик удаления через fallback хранение
ipcMain.handle('credentials-remove-encrypted', async (event, { provider }) => {
  try {
    console.log(`Удаление ключа для: ${provider}`);
    const credentials = loadCredentials();
    delete credentials[provider];
    const success = saveCredentials(credentials);
    return { success };
  } catch (error) {
    console.error('Ошибка удаления ключа:', error);
    return { success: false, error: error.message };
  }
});

// Обработчик HTTP запросов для AI API
ipcMain.handle('http-request', async (event, { url, options }) => {
  return new Promise((resolve) => {
    try {
      console.log(`HTTP запрос: ${options.method || 'GET'} ${url}`);
      
      // Используем встроенный https модуль вместо node-fetch
      const parsedUrl = new URL(url);
      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: options.timeout || 60000
      };
      
      const protocol = parsedUrl.protocol === 'https:' ? https : require('http');
      
      // Для локального использования игнорируем SSL ошибки
      if (parsedUrl.protocol === 'https:') {
        requestOptions.rejectUnauthorized = false;
      }
      
      const req = protocol.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            console.log(`Response status: ${res.statusCode}`);
            console.log(`Response headers:`, res.headers);
            console.log(`Response data length: ${data.length}`);
            
            if (data.length === 0) {
              resolve({ 
                success: false, 
                error: `Empty response from server (status: ${res.statusCode})` 
              });
              return;
            }
            
            const jsonData = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true, data: jsonData });
            } else {
              resolve({ 
                success: false, 
                error: `HTTP ${res.statusCode}: ${JSON.stringify(jsonData)}` 
              });
            }
          } catch (error) {
            console.error('Parse error:', error);
            console.log('Raw response data:', data);
            resolve({ success: false, error: `Parse error: ${error.message}` });
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('HTTP запрос ошибка:', error);
        resolve({ success: false, error: error.message });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Request timeout' });
      });
      
      // Добавляем заголовки для правильной работы
      if (options.body) {
        const bodyData = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
        req.setHeader('Content-Length', Buffer.byteLength(bodyData));
        req.write(bodyData);
      }
      
      req.end();
    } catch (error) {
      console.error('Ошибка выполнения HTTP запроса:', error);
      resolve({ success: false, error: error.message });
    }
  });
});

// Обработчик AI запросов с поддержкой разных провайдеров
ipcMain.handle('ai-request', async (event, { provider, endpoint, method = 'GET', data, apiKey, headers = {}, timeout = 60000, streaming = false }) => {
  return new Promise(async (resolve) => {
    try {
      console.log(`AI запрос к ${provider}: ${method} ${endpoint}`);
      
      // Определяем базовый URL и заголовки для каждого провайдера
      let baseUrl;
      let authHeaders = {};
      
      switch (provider) {
        case 'openai':
          baseUrl = 'https://api.openai.com/v1';
          authHeaders = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          };
          break;
        case 'anthropic':
          baseUrl = 'https://api.anthropic.com';
          authHeaders = {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          };
          break;
        case 'openrouter':
          baseUrl = 'https://openrouter.ai/api/v1';
          authHeaders = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          };
          break;
        default:
          throw new Error(`Неизвестный провайдер: ${provider}`);
      }
      
      const url = `${baseUrl}${endpoint}`;
      const requestOptions = {
        method,
        headers: {
          ...authHeaders,
          ...headers
        },
        timeout
      };
      
      if (data && (method === 'POST' || method === 'PUT')) {
        requestOptions.body = JSON.stringify(data);
      }
      
      // Получаем credentials из хранилища если не предоставлен apiKey
      if (!apiKey) {
        try {
          const keyResult = await keytar.getPassword('prompt-constructor-ai', `${provider}-api-key`);
          if (keyResult) {
            requestOptions.headers.Authorization = provider === 'anthropic' 
              ? undefined 
              : `Bearer ${keyResult}`;
            if (provider === 'anthropic') {
              requestOptions.headers['x-api-key'] = keyResult;
            }
          } else {
            throw new Error(`API ключ для ${provider} не найден`);
          }
        } catch (credError) {
          console.error(`Ошибка получения API ключа для ${provider}:`, credError);
          resolve({ success: false, error: `API ключ для ${provider} не найден` });
          return;
        }
      }
      
      const fetch = require('node-fetch');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      fetch(url, {
        ...requestOptions,
        signal: controller.signal
      })
      .then(response => {
        clearTimeout(timeoutId);
        return response.text().then(text => {
          try {
            const data = JSON.parse(text);
            if (!response.ok) {
              throw new Error(`${provider.toUpperCase()} API ${response.status}: ${data.error?.message || text}`);
            }
            resolve({ success: true, data });
          } catch (parseError) {
            if (!response.ok) {
              throw new Error(`${provider.toUpperCase()} API ${response.status}: ${text}`);
            }
            resolve({ success: true, data: { content: text } });
          }
        });
      })
      .catch(error => {
        clearTimeout(timeoutId);
        console.error(`${provider} API ошибка:`, error);
        resolve({ success: false, error: error.message });
      });
    } catch (error) {
      console.error(`Ошибка AI запроса к ${provider}:`, error);
      resolve({ success: false, error: error.message });
    }
  });
});

// Обработчик тестирования соединения с AI провайдером
ipcMain.handle('ai-test-connection', async (event, { provider, apiKey }) => {
  try {
    console.log(`Тестирование соединения с ${provider}`);
    
    let testEndpoint;
    let testData = null;
    
    switch (provider) {
      case 'openai':
        testEndpoint = '/models';
        break;
      case 'anthropic':
        testEndpoint = '/v1/messages';
        testData = {
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        };
        break;
      case 'openrouter':
        testEndpoint = '/models';
        break;
      default:
        throw new Error(`Неизвестный провайдер: ${provider}`);
    }
    
    const result = await new Promise((resolve) => {
      const ipcEvent = { sender: event.sender };
      ipcMain.emit('ai-request', ipcEvent, {
        provider,
        endpoint: testEndpoint,
        method: testData ? 'POST' : 'GET',
        data: testData,
        apiKey,
        timeout: 15000
      });
      
      // Хак для получения результата из обработчика ai-request
      setTimeout(async () => {
        const testResult = await ipcMain.handle('ai-request', () => {}, {
          provider,
          endpoint: testEndpoint,
          method: testData ? 'POST' : 'GET',
          data: testData,
          apiKey,
          timeout: 15000
        });
        resolve(testResult());
      }, 100);
    });
    
    if (result.success) {
      const models = provider === 'anthropic' ? [] : (result.data.data || []);
      console.log(`Соединение с ${provider} успешно, моделей: ${models.length}`);
      return { success: true, models: models.slice(0, 10) }; // Первые 10 для теста
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error(`Ошибка тестирования ${provider}:`, error);
    return { success: false, error: error.message };
  }
});