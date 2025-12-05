#  API Документация

## Обзор

PromptyFlow Backend API предоставляет RESTful интерфейс для работы с проектами, контекстом, промптами, шаблонами и AI-провайдерами.

**Base URL:** `https://your-domain.com` или `http://localhost:3001` (разработка)

**Аутентификация:** JWT Bearer token в заголовке `Authorization: Bearer <token>`

**Формат:** JSON (Content-Type: application/json)

---

##  Аутентификация

### Google OAuth Flow

#### POST /auth/google

Инициирует OAuth 2.0 авторизацию через Google.

**Request:** Redirect пользователя на этот endpoint

**Response:** 302 Redirect на Google OAuth consent screen

---

#### GET /auth/google/callback

Callback endpoint для Google OAuth.

**Query Parameters:**
- `code` - Authorization code от Google

**Response:** 302 Redirect на frontend с токенами в URL:
```
https://your-domain.com/#/auth/callback?access_token=...&refresh_token=...
```

**Ошибки:**
- `401` - OAuth авторизация не удалась
- `500` - Ошибка сервера

---

#### POST /auth/refresh

Обновление access token.

**Body:**
```json
{
  "refreshToken": "refresh-token-here"
}
```

**Response:**
```json
{
  "accessToken": "new-jwt-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Ошибки:**
- `401` - Refresh token невалиден или истек

---

##  Профиль пользователя

### GET /api/user

Получить профиль текущего пользователя.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://...",
  "googleId": "google-user-id",
  "lastLoginAt": "2025-12-05T10:00:00Z",
  "createdAt": "2025-11-25T10:00:00Z",
  "updatedAt": "2025-12-05T10:00:00Z"
}
```

**Ошибки:**
- `401` - Не авторизован
- `404` - Пользователь не найден

---

### PATCH /api/user

Обновить профиль пользователя.

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Jane Doe"
}
```

**Response:** Обновленный профиль пользователя

**Ошибки:**
- `401` - Не авторизован
- `400` - Невалидные данные

---

### POST /api/user/api-keys/:provider

Добавить/обновить API ключ AI провайдера.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `provider` - openai | anthropic | gemini | grok | openrouter

**Body:**
```json
{
  "apiKey": "sk-..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "API key saved successfully"
}
```

**Примечание:** API ключ шифруется AES-256-GCM перед сохранением в БД.

---

### DELETE /api/user/api-keys/:provider

Удалить API ключ провайдера.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `provider` - openai | anthropic | gemini | grok | openrouter

**Response:**
```json
{
  "success": true,
  "message": "API key deleted successfully"
}
```

---

### GET /api/user/api-keys

Получить список сохраненных провайдеров (без значений ключей).

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "providers": ["openai", "anthropic"]
}
```

---

##  Проекты

### GET /api/projects

Получить все проекты пользователя.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "My Project",
      "userId": "user-uuid",
      "data": {
        "contextBlocks": [],
        "promptBlocks": []
      },
      "createdAt": "2025-12-05T10:00:00Z",
      "updatedAt": "2025-12-05T11:00:00Z"
    }
  ]
}
```

---

### GET /api/projects/:id

Получить проект по ID.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` - Project ID (UUID)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Project",
    "userId": "user-uuid",
    "data": {
      "contextBlocks": [
        {
          "id": 1,
          "title": "Context Block 1",
          "items": [
            {
              "id": 1,
              "title": "Item 1",
              "content": "Item content",
              "chars": 12,
              "subItems": [
                {
                  "id": 1,
                  "title": "Sub-item 1",
                  "content": "Sub-item content",
                  "chars": 16
                }
              ]
            }
          ]
        }
      ],
      "promptBlocks": [
        {
          "id": 1,
          "title": "Prompt 1",
          "template": "Analyze: {{context}}",
          "wrapInTags": true,
          "selectedContext": [
            {
              "blockId": 1,
              "itemId": 1,
              "order": 0
            }
          ]
        }
      ]
    },
    "createdAt": "2025-12-05T10:00:00Z",
    "updatedAt": "2025-12-05T11:00:00Z"
  }
}
```

**Ошибки:**
- `401` - Не авторизован
- `403` - Нет доступа к проекту
- `404` - Проект не найден

---

### POST /api/projects

Создать новый проект.

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "New Project"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "name": "New Project",
    "userId": "user-uuid",
    "data": {
      "contextBlocks": [],
      "promptBlocks": []
    },
    "createdAt": "2025-12-05T12:00:00Z",
    "updatedAt": "2025-12-05T12:00:00Z"
  }
}
```

**Ошибки:**
- `401` - Не авторизован
- `400` - Невалидные данные
- `403` - Достигнут лимит проектов (10)

---

### PATCH /api/projects/:id

Обновить проект.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` - Project ID

**Body:**
```json
{
  "name": "Updated Name",
  "data": {
    "contextBlocks": [...],
    "promptBlocks": [...]
  }
}
```

**Response:** Обновленный проект

**Ошибки:**
- `401` - Не авторизован
- `403` - Нет доступа к проекту
- `404` - Проект не найден
- `413` - Превышен лимит размера (10M символов для проекта, 5M для блока)

---

### DELETE /api/projects/:id

Удалить проект.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` - Project ID

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Ошибки:**
- `401` - Не авторизован
- `403` - Нет доступа к проекту
- `404` - Проект не найден

---

##  Контекстные блоки

### PATCH /api/projects/:id/context-blocks

Обновить контекстные блоки проекта.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` - Project ID

**Body:**
```json
{
  "contextBlocks": [
    {
      "id": 1,
      "title": "Updated Context",
      "items": [...]
    }
  ]
}
```

**Response:** Обновленный проект

---

### GET /api/projects/:id/context-blocks/stats

Получить статистику по контекстным блокам.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` - Project ID

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBlocks": 5,
    "totalItems": 25,
    "totalSubItems": 50,
    "totalChars": 125000,
    "largestBlockChars": 45000
  }
}
```

---

##  Блоки промптов

### PATCH /api/projects/:id/prompt-blocks

Обновить блоки промптов проекта.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` - Project ID

**Body:**
```json
{
  "promptBlocks": [
    {
      "id": 1,
      "title": "Analysis Prompt",
      "template": "Analyze: {{context}}",
      "wrapInTags": true,
      "selectedContext": [...]
    }
  ]
}
```

**Response:** Обновленный проект

---

### POST /api/projects/:id/prompt-blocks/compile

Скомпилировать промпт с выбранным контекстом.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` - Project ID

**Body:**
```json
{
  "promptBlockId": 1,
  "contextIds": [
    {
      "blockId": 1,
      "itemId": 1,
      "subItemId": 1
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "compiledPrompt": "Analyze: <Context>\nItem content\nSub-item content\n</Context>",
  "stats": {
    "templateChars": 25,
    "contextChars": 150,
    "totalChars": 175
  }
}
```

---

##  Библиотека шаблонов

### GET /api/templates

Получить все шаблоны пользователя.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "name": "API Analysis",
      "content": "Analyze this API: {{context}}",
      "createdAt": "2025-12-05T10:00:00Z",
      "updatedAt": "2025-12-05T10:00:00Z"
    }
  ]
}
```

---

### GET /api/templates/search

Полнотекстовый поиск по шаблонам.

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `q` - Поисковый запрос

**Response:** Список найденных шаблонов отсортированных по релевантности

**Примечание:** Использует PostgreSQL Full-Text Search с GIN индексами (1-11ms на тысячах записей).

---

### POST /api/templates

Создать новый шаблон.

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "New Template",
  "content": "Template content with {{context}}"
}
```

**Response:** Созданный шаблон

---

### PATCH /api/templates/:id

Обновить шаблон.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` - Template ID

**Body:**
```json
{
  "name": "Updated Name",
  "content": "Updated content"
}
```

**Response:** Обновленный шаблон

---

### DELETE /api/templates/:id

Удалить шаблон.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` - Template ID

**Response:**
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

---

##  AI интеграция

### GET /ai/models

Получить список доступных AI моделей.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "gpt-4o",
      "name": "GPT-4o",
      "provider": "openai",
      "contextWindow": 128000
    },
    {
      "id": "claude-sonnet-4-5-20250929",
      "name": "Claude Sonnet 4.5",
      "provider": "anthropic",
      "contextWindow": 200000
    }
  ]
}
```

**Примечание:** 
- Возвращает модели для всех провайдеров с сохраненными API ключами
- Если ключей нет, возвращает fallback список моделей
- Результат кешируется в Redis на 1 час

---

### POST /ai/send

Отправить промпт в AI.

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant"
    },
    {
      "role": "user",
      "content": "Hello!"
    }
  ],
  "temperature": 0.7,
  "maxTokens": 2000
}
```

**Response:**
```json
{
  "success": true,
  "response": "Hello! How can I help you today?",
  "usage": {
    "promptTokens": 25,
    "completionTokens": 10,
    "totalTokens": 35
  }
}
```

**Поддерживаемые провайдеры:**
- `openai` - GPT-4, GPT-4o, GPT-5.1 (автоматически использует `/v1/responses` для GPT-5.1)
- `anthropic` - Claude 4.5, Claude 4, Claude 3.5
- `gemini` - Gemini 2.5 Flash, Gemini 1.5 Flash/Pro
- `grok` - Grok Beta, Grok Vision
- `openrouter` - 100+ моделей разных провайдеров

**Ошибки:**
- `401` - Не авторизован
- `404` - API ключ для провайдера не найден
- `400` - Невалидный запрос
- `500` - Ошибка AI API

---

### POST /ai/test-connection

Тестировать подключение к AI провайдеру.

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "provider": "openai"
}
```

**Response:**
```json
{
  "success": true,
  "provider": "openai",
  "status": "connected",
  "message": "Connection successful"
}
```

**Ошибки:**
- `401` - Не авторизован
- `404` - API ключ не найден
- `400` - Подключение не удалось (невалидный ключ)

---

##  Здоровье системы

### GET /health

Health check endpoint (без авторизации).

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-05T20:00:00Z",
  "redis": "connected",
  "database": "connected"
}
```

**Использование:**
- Мониторинг доступности сервиса
- Load balancer health checks
- Автоматические проверки uptime

---

##  Ошибки

### Формат ответа с ошибкой

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

### Коды статусов

| Код | Описание |
|-----|----------|
| `200` | Успешный запрос |
| `201` | Ресурс создан |
| `400` | Невалидный запрос |
| `401` | Не авторизован |
| `403` | Доступ запрещен |
| `404` | Ресурс не найден |
| `413` | Payload слишком большой (превышен лимит) |
| `429` | Rate limit превышен |
| `500` | Ошибка сервера |

### Типичные ошибки

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "FORBIDDEN",
  "message": "You don't have access to this resource"
}
```

**413 Payload Too Large:**
```json
{
  "success": false,
  "error": "PAYLOAD_TOO_LARGE",
  "message": "Project exceeds limit (10,000,000 / 10,000,000 characters)"
}
```

**429 Rate Limit:**
```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests"
}
```

---

##  Rate Limiting

API ограничивает количество запросов:
- **Базовый лимит:** 100 запросов/минуту на пользователя
- **AI endpoints:** 20 запросов/минуту на пользователя

Headers в ответе:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

---

##  Лимиты и ограничения

### Проекты
- **Максимум проектов:** 10
- **Размер проекта:** 10M символов
- **Размер контекст блока:** 5M символов

### Запросы
- **Request body:** 10 MB
- **Response timeout:** 30 секунд (120 секунд для AI endpoints)

---

##  Примеры использования

### Базовый flow: Создание проекта и работа с AI

**1. Авторизация через Google:**
```bash
# Redirect пользователя на:
GET https://your-domain.com/auth/google

# После авторизации получите tokens из redirect URL
```

**2. Создать проект:**
```bash
curl -X POST https://your-domain.com/api/projects \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "My AI Project"}'
```

**3. Добавить контекст:**
```bash
curl -X PATCH https://your-domain.com/api/projects/<project-id> \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "contextBlocks": [{
        "id": 1,
        "title": "API Documentation",
        "items": [{
          "id": 1,
          "title": "Endpoint description",
          "content": "GET /api/users returns list of users",
          "chars": 41
        }]
      }],
      "promptBlocks": []
    }
  }'
```

**4. Сохранить API ключ OpenAI:**
```bash
curl -X POST https://your-domain.com/api/user/api-keys/openai \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "sk-proj-..."}'
```

**5. Отправить промпт в AI:**
```bash
curl -X POST https://your-domain.com/ai/send \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "model": "gpt-4o-mini",
    "messages": [{
      "role": "user",
      "content": "Analyze this API: GET /api/users returns list of users"
    }],
    "temperature": 0.7,
    "maxTokens": 1000
  }'
```

---

##  Changelog

### v2.0 (05.12.2025)
- Обновлена документация для self-hosted deployment
- Добавлена поддержка Claude 4.5 и GPT-5.1
- Улучшена структура ответов API
- Добавлены примеры использования
- Обновлена информация о лимитах

### v1.0 (25.11.2025)
- Первая версия API документации

---

**Дата обновления:** 05.12.2025  
**Версия:** 2.0  
**Статус:** Production Ready 
