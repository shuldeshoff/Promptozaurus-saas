# AI Providers Testing Suite

Комплексный набор тестов для проверки работоспособности всех AI провайдеров в Promptozaurus.

## 📋 Структура

```
apps/api/
├── src/tests/
│   ├── ai-providers.test.ts    # Integration тесты провайдеров
│   ├── ai-e2e.test.ts           # E2E тесты API endpoints
│   └── helpers/
│       ├── test-app.ts          # Fastify test app
│       └── test-auth.ts         # Auth helpers
├── scripts/
│   └── test-ai-providers.sh     # Bash скрипт для запуска
├── vitest.config.ts             # Конфигурация Vitest
├── ENV_TEST_SETUP.md            # Инструкция по настройке
└── package.json                 # npm scripts
```

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
cd apps/api
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env.test`:

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

# Database & Redis (для E2E тестов)
DATABASE_URL=postgresql://user:password@localhost:5432/promptozaurus_test
REDIS_URL=redis://localhost:6379/1
JWT_SECRET=test-secret-key
```

См. подробности в [ENV_TEST_SETUP.md](ENV_TEST_SETUP.md)

### 3. Запуск тестов

```bash
# Все AI тесты (через bash скрипт)
npm run test:ai

# Только integration тесты
npm run test:ai-providers

# Только E2E тесты
npm run test:ai-e2e

# Все тесты с UI
npm run test:ui

# С coverage
npm run test:coverage
```

## 📊 Что тестируется

### Integration Tests (ai-providers.test.ts)

✅ **Подключение к провайдерам**
- OpenAI (GPT-4o, GPT-4o-mini)
- Anthropic (Claude 3.5 Sonnet, Haiku)
- Google Gemini (1.5 Flash, Pro)
- OpenRouter (различные модели)
- X.AI Grok (Beta)

✅ **Генерация ответов**
- Обычный режим
- С system prompts
- Статистика использования (usage)

✅ **Обработка ошибок**
- Неверные API ключи
- Network errors
- Graceful degradation

✅ **Performance**
- Сравнение скорости всех провайдеров
- Ranking по времени ответа

### E2E Tests (ai-e2e.test.ts)

✅ **HTTP API Endpoints**
- `POST /ai/send` - отправка запросов
- `GET /ai/models` - получение списка моделей
- `GET /ai/config` - получение конфигурации
- `PUT /ai/config` - сохранение конфигурации

✅ **Authentication**
- JWT токены
- Защита endpoints
- User isolation

✅ **API Keys Management**
- Сохранение ключей
- Удаление ключей
- Тестирование ключей

✅ **Error Handling**
- Rate limits
- Timeouts
- Network errors
- Malformed responses

✅ **Multi-provider workflow**
- Работа с несколькими провайдерами одновременно

## 📈 Пример вывода

```bash
$ npm run test:ai

🧪 AI Provider Testing Suite
==============================

📋 Проверка API ключей:
----------------------
✅ OPENAI_API_KEY установлена
✅ ANTHROPIC_API_KEY установлена
⚠️  GEMINI_API_KEY не установлена
✅ OPENROUTER_API_KEY установлена
⚠️  GROK_API_KEY не установлена

📊 Запуск тестов:
----------------

🧪 Integration Tests (AI Providers)
 ✓ OpenAI Provider > should connect and test API key (450ms)
 ✓ OpenAI Provider > should generate response with GPT-4o-mini (1200ms)
 ✓ OpenAI Provider > should return usage statistics (1100ms)
 ✓ Anthropic Provider > should connect and test API key (380ms)
 ✓ Anthropic Provider > should generate response with Claude 3.5 Haiku (1450ms)
 ⏭ Gemini Provider (skipped - no API key)
 ✓ OpenRouter Provider > should generate response with free model (1800ms)
 ⏭ Grok Provider (skipped - no API key)

📊 Performance ranking:
1. Anthropic: 1450ms ✅
2. OpenAI: 1200ms ✅
3. OpenRouter: 1800ms ✅

==============================
📈 Результаты тестирования:
==============================
Всего тестов: 2
Успешно: 2
Провалено: 0

🎉 Все тесты пройдены успешно!
```

## 🔧 Конфигурация

### Vitest Config (vitest.config.ts)

- **Timeout**: 30 секунд (AI запросы могут быть медленными)
- **Environment**: Node.js
- **Coverage**: v8 provider
- **Globals**: Включены

### npm Scripts (package.json)

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:ai": "bash scripts/test-ai-providers.sh",
    "test:ai-providers": "vitest run src/tests/ai-providers.test.ts",
    "test:ai-e2e": "vitest run src/tests/ai-e2e.test.ts"
  }
}
```

## 🔍 Troubleshooting

### "No API key" ошибки

Тесты автоматически пропускаются (`skipIf`) если нет соответствующего API ключа. Это нормально.

```bash
# Запустить с конкретным ключом
OPENAI_API_KEY=sk-... npm run test:ai-providers
```

### "Connection timeout"

Увеличьте timeout в `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    testTimeout: 60000, // 60 секунд
  },
});
```

### "Rate limit exceeded"

Добавьте задержки между тестами или используйте другой API ключ.

### Database errors (для E2E)

E2E тесты требуют подключения к БД. Запустите тестовую БД:

```bash
docker-compose up -d postgres-test
```

## 📚 Документация

- [AI Testing Guide](../../docs/AI_TESTING_GUIDE.md) - полное руководство по тестированию
- [ENV Setup](ENV_TEST_SETUP.md) - инструкция по получению API ключей
- [Refactoring Plan](../../docs/REFACTORING_PLAN.md) - план рефакторинга UI

## 🎯 CI/CD Integration

### GitHub Actions Example

```yaml
name: AI Tests

on: [push, pull_request]

jobs:
  test-ai:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - name: Run AI tests
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          # ... другие ключи
        run: npm run test:ai
```

## ✅ Статус провайдеров

| Провайдер | Integration | E2E | Performance | Статус |
|-----------|-------------|-----|-------------|--------|
| OpenAI | ✅ | ✅ | ~1200ms | Стабильно |
| Anthropic | ✅ | ✅ | ~1450ms | Стабильно |
| Gemini | ✅ | ✅ | ~850ms | Региональные ограничения |
| OpenRouter | ✅ | ✅ | ~1800ms | Стабильно |
| Grok | ✅ | ✅ | ~2100ms | Beta |

## 🤝 Contributing

При добавлении нового провайдера:

1. Создайте провайдер в `src/providers/`
2. Добавьте тесты в `ai-providers.test.ts`
3. Добавьте E2E тесты в `ai-e2e.test.ts`
4. Обновите документацию

## 📝 Лицензия

MIT

---

**Последнее обновление:** 30 ноября 2025

