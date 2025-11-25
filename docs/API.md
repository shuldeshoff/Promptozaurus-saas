# 📘 API Documentation

## Обзор

Promptozaurus SaaS Backend API построен на Fastify + TypeScript и предоставляет RESTful API для работы с проектами, контекстами, промптами, шаблонами и AI-провайдерами.

**Base URL:** `https://api.yourapp.com` (или `http://localhost:3000` для разработки)

**Authentication:** JWT Bearer token в header `Authorization: Bearer <token>`

---

## 🔐 Authentication

### POST /auth/google

Инициирует OAuth 2.0 flow с Google.

**Request:** Redirect пользователя на этот endpoint

**Response:** Redirect на Google OAuth consent screen

---

### GET /auth/google/callback

Callback для Google OAuth.

**Query Parameters:**
- `code` (string, required) - Authorization code от Google

**Response:**
```json
{
  "token": "jwt-access-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": "https://...",
    "googleId": "google-user-id",
    "createdAt": "2025-11-25T10:00:00Z"
  }
}
```

**Cookies:** `token` (HTTP-only cookie с JWT)

**Errors:**
- `401 Unauthorized` - OAuth flow failed
- `500 Internal Server Error` - Server error

---

### POST /auth/logout

Выход пользователя (очистка cookie).

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

### POST /auth/refresh

Обновление JWT token (если используется refresh token logic).

**Request Body:**
```json
{
  "refreshToken": "refresh-token-here"
}
```

**Response:**
```json
{
  "token": "new-jwt-access-token"
}
```

---

## 👤 User

### GET /api/user/profile

Получить профиль текущего пользователя.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "avatarUrl": "https://...",
  "googleId": "google-user-id",
  "createdAt": "2025-11-25T10:00:00Z",
  "projectCount": 5
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `404 Not Found` - User not found

---

### PATCH /api/user/profile

Обновить профиль пользователя.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "jane@example.com",
  "name": "Jane Doe",
  "avatarUrl": "https://...",
  "googleId": "google-user-id",
  "createdAt": "2025-11-25T10:00:00Z"
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `400 Bad Request` - Invalid input

---

## 📁 Projects

### GET /api/projects

Получить список всех проектов пользователя.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "My Project",
    "userId": "user-uuid",
    "data": {
      "contextBlocks": [...],
      "promptBlocks": [...]
    },
    "createdAt": "2025-11-25T10:00:00Z",
    "updatedAt": "2025-11-25T11:00:00Z"
  }
]
```

**Errors:**
- `401 Unauthorized` - No token or invalid token

---

### GET /api/projects/:id

Получить проект по ID.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (string, required) - Project ID

**Response:**
```json
{
  "id": "uuid",
  "name": "My Project",
  "userId": "user-uuid",
  "data": {
    "contextBlocks": [
      {
        "id": "block-1",
        "name": "API Documentation",
        "items": [
          {
            "id": "item-1",
            "name": "GET /users",
            "subItems": [
              {
                "id": "subitem-1",
                "name": "Request params",
                "text": "?page=1&limit=10"
              }
            ]
          }
        ]
      }
    ],
    "promptBlocks": [
      {
        "id": "prompt-1",
        "name": "API Analysis",
        "text": "Analyze this API: {{context}}"
      }
    ]
  },
  "createdAt": "2025-11-25T10:00:00Z",
  "updatedAt": "2025-11-25T11:00:00Z"
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `403 Forbidden` - Not the project owner
- `404 Not Found` - Project not found

---

### POST /api/projects

Создать новый проект.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New Project"
}
```

**Response:**
```json
{
  "id": "new-uuid",
  "name": "New Project",
  "userId": "user-uuid",
  "data": {
    "contextBlocks": [],
    "promptBlocks": []
  },
  "createdAt": "2025-11-25T12:00:00Z",
  "updatedAt": "2025-11-25T12:00:00Z"
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `400 Bad Request` - Invalid input
- `403 Forbidden` - Project limit reached (10 for free plan)

---

### PATCH /api/projects/:id

Обновить проект.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (string, required) - Project ID

**Request Body:**
```json
{
  "name": "Updated Name",
  "data": {
    "contextBlocks": [...],
    "promptBlocks": [...]
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "userId": "user-uuid",
  "data": {...},
  "createdAt": "2025-11-25T10:00:00Z",
  "updatedAt": "2025-11-25T13:00:00Z"
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `403 Forbidden` - Not the project owner
- `404 Not Found` - Project not found
- `400 Bad Request` - Invalid input

---

### DELETE /api/projects/:id

Удалить проект.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (string, required) - Project ID

**Response:**
```json
{
  "message": "Project deleted successfully"
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `403 Forbidden` - Not the project owner
- `404 Not Found` - Project not found

---

### POST /api/projects/:id/duplicate

Дублировать проект.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (string, required) - Project ID

**Response:**
```json
{
  "id": "new-uuid",
  "name": "My Project (Copy)",
  "userId": "user-uuid",
  "data": {...},
  "createdAt": "2025-11-25T14:00:00Z",
  "updatedAt": "2025-11-25T14:00:00Z"
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `403 Forbidden` - Not the project owner or limit reached
- `404 Not Found` - Project not found

---

### GET /api/projects/:id/export

Экспорт проекта в JSON.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (string, required) - Project ID

**Response:** JSON file download

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `403 Forbidden` - Not the project owner
- `404 Not Found` - Project not found

---

### POST /api/projects/import

Импорт проекта из JSON.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Imported Project",
  "data": {
    "contextBlocks": [...],
    "promptBlocks": [...]
  }
}
```

**Response:**
```json
{
  "id": "new-uuid",
  "name": "Imported Project",
  "userId": "user-uuid",
  "data": {...},
  "createdAt": "2025-11-25T15:00:00Z",
  "updatedAt": "2025-11-25T15:00:00Z"
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `400 Bad Request` - Invalid JSON structure
- `403 Forbidden` - Project limit reached

---

## 📝 Context Blocks

### PATCH /api/projects/:projectId/context

Обновить context blocks в проекте.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `projectId` (string, required) - Project ID

**Request Body:**
```json
{
  "contextBlocks": [
    {
      "id": "block-1",
      "name": "API Docs",
      "items": [...]
    }
  ]
}
```

**Response:**
```json
{
  "id": "project-uuid",
  "name": "Project Name",
  "data": {
    "contextBlocks": [...],
    "promptBlocks": [...]
  },
  "updatedAt": "2025-11-25T16:00:00Z"
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `403 Forbidden` - Not the project owner
- `404 Not Found` - Project not found
- `400 Bad Request` - Invalid context structure

---

## 🤖 Prompt Blocks

### PATCH /api/projects/:projectId/prompts

Обновить prompt blocks в проекте.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `projectId` (string, required) - Project ID

**Request Body:**
```json
{
  "promptBlocks": [
    {
      "id": "prompt-1",
      "name": "Analysis Prompt",
      "text": "Analyze: {{context}}"
    }
  ]
}
```

**Response:**
```json
{
  "id": "project-uuid",
  "name": "Project Name",
  "data": {
    "contextBlocks": [...],
    "promptBlocks": [...]
  },
  "updatedAt": "2025-11-25T17:00:00Z"
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `403 Forbidden` - Not the project owner
- `404 Not Found` - Project not found
- `400 Bad Request` - Invalid prompt structure

---

### POST /api/projects/:projectId/prompts/compile

Скомпилировать промпт с контекстом.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `projectId` (string, required) - Project ID

**Request Body:**
```json
{
  "promptBlockId": "prompt-1",
  "contextBlockIds": ["block-1", "block-2"]
}
```

**Response:**
```json
{
  "compiledPrompt": "Analyze this API:\n\n<context>\n<api_docs>...</api_docs>\n</context>",
  "characterCount": 1543
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `403 Forbidden` - Not the project owner
- `404 Not Found` - Project or blocks not found
- `400 Bad Request` - Invalid request

---

## 📚 Templates

### GET /api/templates

Получить все шаблоны пользователя.

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `search` (string, optional) - Search by name or content

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "user-uuid",
    "name": "API Analysis Template",
    "content": "Analyze this API: {{context}}",
    "createdAt": "2025-11-25T10:00:00Z"
  }
]
```

**Errors:**
- `401 Unauthorized` - No token or invalid token

---

### GET /api/templates/:id

Получить шаблон по ID.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (string, required) - Template ID

**Response:**
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "name": "API Analysis Template",
  "content": "Analyze this API: {{context}}",
  "createdAt": "2025-11-25T10:00:00Z"
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `403 Forbidden` - Not the template owner
- `404 Not Found` - Template not found

---

### POST /api/templates

Создать новый шаблон.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New Template",
  "content": "Template content here"
}
```

**Response:**
```json
{
  "id": "new-uuid",
  "userId": "user-uuid",
  "name": "New Template",
  "content": "Template content here",
  "createdAt": "2025-11-25T18:00:00Z"
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `400 Bad Request` - Invalid input

---

### PATCH /api/templates/:id

Обновить шаблон.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (string, required) - Template ID

**Request Body:**
```json
{
  "name": "Updated Name",
  "content": "Updated content"
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "name": "Updated Name",
  "content": "Updated content",
  "createdAt": "2025-11-25T10:00:00Z"
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `403 Forbidden` - Not the template owner
- `404 Not Found` - Template not found
- `400 Bad Request` - Invalid input

---

### DELETE /api/templates/:id

Удалить шаблон.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (string, required) - Template ID

**Response:**
```json
{
  "message": "Template deleted successfully"
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `403 Forbidden` - Not the template owner
- `404 Not Found` - Template not found

---

## 🔑 API Keys

### GET /api/apikeys

Получить все API ключи пользователя (без значений ключей).

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "user-uuid",
    "provider": "openai",
    "status": "active",
    "createdAt": "2025-11-25T10:00:00Z"
  }
]
```

**Errors:**
- `401 Unauthorized` - No token or invalid token

---

### POST /api/apikeys

Сохранить API ключ (зашифрованный).

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "provider": "openai",
  "key": "sk-..."
}
```

**Response:**
```json
{
  "id": "new-uuid",
  "userId": "user-uuid",
  "provider": "openai",
  "status": "active",
  "createdAt": "2025-11-25T19:00:00Z"
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `400 Bad Request` - Invalid provider or key format

---

### DELETE /api/apikeys/:id

Удалить API ключ.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (string, required) - API Key ID

**Response:**
```json
{
  "message": "API key deleted successfully"
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `403 Forbidden` - Not the key owner
- `404 Not Found` - Key not found

---

### POST /api/apikeys/:id/test

Тестировать API ключ (проверка валидности).

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (string, required) - API Key ID

**Response:**
```json
{
  "status": "valid",
  "provider": "openai",
  "message": "Connection successful"
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `403 Forbidden` - Not the key owner
- `404 Not Found` - Key not found
- `400 Bad Request` - Invalid API key

---

## 🤖 AI

### GET /api/ai/models/:provider

Получить список моделей для провайдера.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `provider` (string, required) - Provider name (openai, anthropic, gemini, grok, openrouter)

**Response:**
```json
[
  {
    "id": "gpt-4",
    "name": "GPT-4",
    "contextWindow": 8192,
    "supportsStreaming": true
  }
]
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `400 Bad Request` - Invalid provider
- `404 Not Found` - No API key for provider

---

### POST /api/ai/models/:provider/refresh

Обновить список моделей для провайдера.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `provider` (string, required) - Provider name

**Response:**
```json
{
  "message": "Models refreshed successfully",
  "count": 15
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `400 Bad Request` - Invalid provider
- `404 Not Found` - No API key for provider

---

### POST /api/ai/send

Отправить промпт в AI.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "provider": "openai",
  "model": "gpt-4",
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
  "maxTokens": 1000
}
```

**Response:**
```json
{
  "provider": "openai",
  "model": "gpt-4",
  "response": "Hello! How can I help you today?",
  "usage": {
    "promptTokens": 25,
    "completionTokens": 10,
    "totalTokens": 35
  }
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `400 Bad Request` - Invalid request format
- `404 Not Found` - No API key for provider
- `500 Internal Server Error` - AI API error

---

## 🏥 Health & Monitoring

### GET /health

Health check endpoint (без авторизации).

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-25T20:00:00Z",
  "redis": "connected"
}
```

---

## ❌ Error Responses

Все ошибки возвращаются в формате:

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "statusCode": 400
}
```

### Common Status Codes:

- `200 OK` - Успешный запрос
- `201 Created` - Ресурс создан
- `400 Bad Request` - Неверные данные в запросе
- `401 Unauthorized` - Не авторизован
- `403 Forbidden` - Доступ запрещен
- `404 Not Found` - Ресурс не найден
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Ошибка сервера

---

## 🔒 Rate Limiting

API использует rate limiting:
- **Free tier:** 100 requests/minute per user
- **Authenticated:** 500 requests/minute per user

При превышении лимита:
```json
{
  "error": "Rate Limit Exceeded",
  "message": "Too many requests, please try again later",
  "statusCode": 429,
  "retryAfter": 60
}
```

---

## 📝 Request/Response Examples

### Full Example: Create Project → Add Context → Compile Prompt

**1. Create Project:**
```bash
curl -X POST https://api.yourapp.com/api/projects \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "API Analysis"}'
```

**2. Add Context:**
```bash
curl -X PATCH https://api.yourapp.com/api/projects/<project-id>/context \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "contextBlocks": [{
      "id": "block-1",
      "name": "API Docs",
      "items": [{
        "id": "item-1",
        "name": "GET /users",
        "subItems": [{
          "id": "sub-1",
          "name": "Description",
          "text": "Returns list of users"
        }]
      }]
    }]
  }'
```

**3. Compile Prompt:**
```bash
curl -X POST https://api.yourapp.com/api/projects/<project-id>/prompts/compile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "promptBlockId": "prompt-1",
    "contextBlockIds": ["block-1"]
  }'
```

---

**Дата создания:** 25 ноября 2025  
**Версия:** 1.0  
**Статус:** Complete API Reference 📘

