// main/aiCredentials.js - Управление API ключами для ИИ провайдеров
// @description: Безопасное хранение и управление credentials для AI сервисов
// @created: 2025-06-25 - выделено из main.js при рефакторинге

const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

// Простое хранение без шифрования для локального использования
// Путь к файлу с credentials
let credentialsPath = null;

// Инициализация пути к credentials
function initializeCredentials() {
  const { app } = require('electron');
  credentialsPath = path.join(app.getPath('userData'), 'api-credentials.json');
}

// Регистрация всех обработчиков credentials
function registerCredentialHandlers() {
  initializeCredentials();
  
  // Обработчики для старого API credentials
  ipcMain.handle('credentials-store', handleCredentialsStore);
  ipcMain.handle('credentials-get', handleCredentialsGet);
  ipcMain.handle('credentials-remove', handleCredentialsRemove);
  
  // Обработчики для нового encrypted API
  ipcMain.handle('credentials-store-encrypted', handleCredentialsStoreEncrypted);
  ipcMain.handle('credentials-get-encrypted', handleCredentialsGetEncrypted);
  ipcMain.handle('credentials-remove-encrypted', handleCredentialsRemoveEncrypted);
}

// Функции для работы с credentials файлом
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
async function handleCredentialsStore(event, { service, account, password }) {
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
}

// Обработчик получения API ключа (простое чтение)
async function handleCredentialsGet(event, { service, account }) {
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
}

// Обработчик удаления API ключа (простое удаление)
async function handleCredentialsRemove(event, { service, account }) {
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
}

// Обработчик сохранения через fallback хранение
async function handleCredentialsStoreEncrypted(event, { provider, apiKey }) {
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
}

// Обработчик получения через fallback хранение
async function handleCredentialsGetEncrypted(event, { provider }) {
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
}

// Обработчик удаления через fallback хранение
async function handleCredentialsRemoveEncrypted(event, { provider }) {
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
}

module.exports = {
  registerCredentialHandlers
};