# AI Testing Guide

## Обзор

Этот документ описывает систему тестирования AI функциональности в Promptozaurus.

## Типы тестов

### 1. Integration Tests (`ai-providers.test.ts`)

**Цель:** Проверить что каждый AI провайдер может успешно подключаться и возвращать ответы.

**Что тестируется:**
- ✅ Подключение к API (`testConnection`)
- ✅ Генерация текста (обычный режим)
- ✅ Streaming режим
- ✅ Обработка ошибок (неверный API ключ)
- ✅ Сравнение производительности всех провайдеров

**Провайдеры:**
- OpenAI (GPT-4o, GPT-4o-mini)
- Anthropic (Claude 3.5 Sonnet, Claude 3.5 Haiku)
- Google Gemini (1.5 Flash, 1.5 Pro)
- OpenRouter (различные модели)
- X.AI Grok (Grok Beta, Grok Vision Beta)

**Запуск:**
```bash
# Все тесты
npm test ai-providers.test.ts

# С API ключами
OPENAI_API_KEY=sk-... ANTHROPIC_API_KEY=sk-ant-... npm test ai-providers.test.ts

# Пропустить AI тесты
SKIP_AI_TESTS=true npm test
```

---

### 2. E2E Tests (`ai-e2e.test.ts`)

**Цель:** Проверить полный flow от HTTP запроса до получения AI ответа.

**Что тестируется:**
- ✅ Аутентификация пользователя
- ✅ Сохранение/удаление API ключей
- ✅ Отправка запросов к AI (`POST /ai/send`)
- ✅ Получение списка моделей (`GET /ai/models`)
- ✅ Управление конфигурацией (`GET/PUT /ai/config`)
- ✅ Streaming responses
- ✅ Error handling (rate limits, timeouts, network errors)
- ✅ Multi-provider workflow

**Запуск:**
```bash
# Все E2E тесты
npm test ai-e2e.test.ts

# С реальными API ключами
OPENAI_API_KEY=sk-... npm test ai-e2e.test.ts
```

---

### 3. Bash Script (`test-ai-providers.sh`)

**Цель:** Автоматизировать запуск всех AI тестов с удобным выводом.

**Что делает:**
- Проверяет наличие API ключей в env
- Запускает integration тесты
- Запускает E2E тесты
- Выводит красивый отчет с результатами

**Запуск:**
```bash
# Сделать исполняемым
chmod +x apps/api/scripts/test-ai-providers.sh

# Запустить
./apps/api/scripts/test-ai-providers.sh

# Или через npm
npm run test:ai
```

---

## Настройка окружения

### Необходимые переменные:

Создайте файл `apps/api/.env.test` со следующими ключами:

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini
GEMINI_API_KEY=AIzaSy...

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-...

# X.AI Grok
GROK_API_KEY=xai-...

# JWT для тестов
JWT_SECRET=test-secret-key

# Database (для E2E тестов)
DATABASE_URL=postgresql://user:password@localhost:5432/promptozaurus_test

# Redis (для E2E тестов)
REDIS_URL=redis://localhost:6379
```

---

## Структура тестов

```
apps/api/src/tests/
├── ai-providers.test.ts      # Integration тесты провайдеров
├── ai-e2e.test.ts             # E2E тесты API endpoints
└── helpers/
    ├── test-app.ts            # Создание тестового Fastify app
    └── test-auth.ts           # Helpers для аутентификации
```

---

## Примеры тестов

### Integration Test Example

```typescript
it('should generate response with GPT-4o-mini', async () => {
  const provider = new OpenAIProvider();
  
  const response = await provider.sendMessage({
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Say "Hello, test!" in one short sentence.' }],
    temperature: 0.7,
    maxTokens: 50,
  });

  expect(response).toBeDefined();
  expect(response.length).toBeGreaterThan(0);
  expect(response.toLowerCase()).toContain('hello');
}, 30000);
```

### E2E Test Example

```typescript
it('should generate AI response with valid API key', async () => {
  // Сохраняем API ключ
  await request(app.server)
    .post('/user/api-keys/openai')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ apiKey: process.env.OPENAI_API_KEY });

  // Отправляем запрос к AI
  const response = await request(app.server)
    .post('/ai/send')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      provider: 'openai',
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say "test" in one word.' }],
      temperature: 0.7,
      maxTokens: 10,
    });

  expect(response.status).toBe(200);
  expect(response.body.response).toBeDefined();
}, 30000);
```

---

## Запуск тестов

### Локально

```bash
# Установка зависимостей
npm install

# Все тесты
npm test

# Только AI тесты
npm test ai-providers
npm test ai-e2e

# Через bash script
./apps/api/scripts/test-ai-providers.sh

# С конкретным провайдером
OPENAI_API_KEY=sk-... npm test ai-providers

# Пропустить AI тесты (если нет ключей)
SKIP_AI_TESTS=true npm test
```

### CI/CD

```yaml
# .github/workflows/test-ai.yml
name: AI Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  test-ai:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run AI tests
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          GROK_API_KEY: ${{ secrets.GROK_API_KEY }}
        run: npm run test:ai
```

---

## Интерпретация результатов

### Успешный тест

```
✅ OpenAI Provider
  ✅ should connect and test API key (450ms)
  ✅ should generate response with GPT-4o-mini (1200ms)
  ✅ should handle streaming (1500ms)
```

**Означает:**
- API ключ валидный
- Модель отвечает корректно
- Streaming работает

### Провальный тест

```
❌ Gemini Provider
  ❌ should connect and test API key
    Error: User location is not supported for the API use.
```

**Возможные причины:**
- Региональные ограничения API
- Неверный API ключ
- Проблемы с сетью
- Превышен лимит запросов

### Пропущенный тест

```
⏭️  Skipping Grok (no API key)
```

**Означает:**
- Env переменная не установлена
- Тест был пропущен автоматически

---

## Performance Benchmarking

Тесты автоматически замеряют время ответа каждого провайдера:

```
📊 Performance ranking:
1. Gemini 1.5 Flash: 850ms ✅
2. GPT-4o-mini: 1200ms ✅
3. Claude 3.5 Haiku: 1450ms ✅
4. OpenRouter (Llama): 1800ms ✅
5. Grok Beta: 2100ms ✅
```

---

## Troubleshooting

### "API key not set"

```bash
# Убедитесь что API ключи в .env.test
cat apps/api/.env.test

# Или экспортируйте в shell
export OPENAI_API_KEY=sk-...
```

### "Connection timeout"

```bash
# Увеличьте timeout в тестах
const TEST_TIMEOUT = 60000; // 60 секунд
```

### "Rate limit exceeded"

```bash
# Добавьте задержки между тестами
await new Promise(resolve => setTimeout(resolve, 1000));
```

### "Database connection failed"

```bash
# Запустите тестовую БД
docker-compose up -d postgres-test

# Или используйте SQLite для тестов
DATABASE_URL=file:./test.db
```

---

## Метрики покрытия

Тесты покрывают:

- ✅ 5 AI провайдеров
- ✅ 12+ моделей
- ✅ 2 режима (обычный + streaming)
- ✅ 6 API endpoints
- ✅ Error handling
- ✅ Multi-provider workflows
- ✅ Performance benchmarking

---

## Добавление новых тестов

### Новый провайдер

```typescript
describe('New Provider', () => {
  let provider: NewProvider;

  beforeAll(() => {
    if (!process.env.NEW_PROVIDER_API_KEY) {
      console.warn('⚠️  NEW_PROVIDER_API_KEY not set');
    } else {
      provider = new NewProvider();
    }
  });

  it.skipIf(!process.env.NEW_PROVIDER_API_KEY)(
    'should generate response',
    async () => {
      const response = await provider.sendMessage({
        apiKey: process.env.NEW_PROVIDER_API_KEY!,
        model: 'model-name',
        messages: [{ role: 'user', content: TEST_PROMPT }],
      });

      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
    },
    TEST_TIMEOUT
  );
});
```

### Новый endpoint

```typescript
describe('POST /ai/new-endpoint', () => {
  it('should handle new functionality', async () => {
    const response = await request(app.server)
      .post('/ai/new-endpoint')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ /* payload */ });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('result');
  });
});
```

---

## Best Practices

1. **Всегда используйте `skipIf`** для тестов требующих API ключи
2. **Устанавливайте таймауты** (AI запросы могут быть медленными)
3. **Проверяйте response содержимое**, не только статус код
4. **Тестируйте error cases** (invalid keys, timeouts, rate limits)
5. **Используйте моки** для unit тестов, реальные API для integration
6. **Добавляйте logging** для отладки провальных тестов
7. **Кэшируйте результаты** где возможно (списки моделей)

---

## Автоматизация

### Pre-commit hook

```bash
# .husky/pre-commit
#!/bin/sh
npm run test:ai || echo "⚠️  AI tests failed, but allowing commit"
```

### Scheduled tests

```yaml
# .github/workflows/scheduled-ai-tests.yml
on:
  schedule:
    - cron: '0 */6 * * *' # Каждые 6 часов

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:ai
```

---

## Статус провайдеров

| Провайдер | Тесты | Streaming | Статус |
|-----------|-------|-----------|--------|
| OpenAI | ✅ | ✅ | Рабочий |
| Anthropic | ✅ | ✅ | Рабочий |
| Gemini | ✅ | ✅ | Региональные ограничения |
| OpenRouter | ✅ | ✅ | Рабочий |
| Grok | ✅ | ✅ | Рабочий |

---

## Контакты

**Вопросы по тестам:** создайте issue в репозитории  
**Документация:** `docs/AI_TESTING_GUIDE.md`  
**Roadmap:** `docs/REFACTORING_PLAN.md`

---

**Последнее обновление:** 30 ноября 2025

