// main/aiHttpClient.js - HTTP клиент для AI API запросов
// @description: Обработка HTTP запросов к различным AI провайдерам
// @created: 2025-06-25 - выделено из main.js при рефакторинге

const { ipcMain } = require('electron');
const https = require('https');

// Регистрация всех обработчиков AI HTTP запросов
function registerAIHttpHandlers() {
  // Обработчик HTTP запросов для AI API
  ipcMain.handle('http-request', handleHttpRequest);
  
  // Обработчик AI запросов с поддержкой разных провайдеров
  ipcMain.handle('ai-request', handleAIRequest);
  
  // Обработчик тестирования соединения с AI провайдером
  ipcMain.handle('ai-test-connection', handleAITestConnection);
}

// Обработчик HTTP запросов для AI API
async function handleHttpRequest(event, { url, options }) {
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
}

// Обработчик AI запросов с поддержкой разных провайдеров
async function handleAIRequest(event, { provider, endpoint, method = 'GET', data, apiKey, headers = {}, timeout = 60000, streaming = false }) {
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
          // Используем fallback для keytar
          resolve({ success: false, error: `API ключ для ${provider} не найден` });
          return;
        } catch (credError) {
          console.error(`Ошибка получения API ключа для ${provider}:`, credError);
          resolve({ success: false, error: `API ключ для ${provider} не найден` });
          return;
        }
      }
      
      // Используем наш собственный HTTP клиент
      const result = await handleHttpRequest(event, { url, options: requestOptions });
      resolve(result);
      
    } catch (error) {
      console.error(`Ошибка AI запроса к ${provider}:`, error);
      resolve({ success: false, error: error.message });
    }
  });
}

// Обработчик тестирования соединения с AI провайдером
async function handleAITestConnection(event, { provider, apiKey }) {
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
    
    const result = await handleAIRequest(event, {
      provider,
      endpoint: testEndpoint,
      method: testData ? 'POST' : 'GET',
      data: testData,
      apiKey,
      timeout: 15000
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
}

module.exports = {
  registerAIHttpHandlers
};