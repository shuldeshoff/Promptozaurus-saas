# AI Testing Environment Setup

Для запуска AI тестов необходимо создать файл `.env.test` в директории `apps/api/`:

```bash
# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key

# OpenRouter
OPENROUTER_API_KEY=your-openrouter-api-key

# X.AI Grok
GROK_API_KEY=your-grok-api-key

# JWT Secret for tests
JWT_SECRET=test-secret-key-change-in-production

# Database (use test database)
DATABASE_URL=postgresql://user:password@localhost:5432/promptozaurus_test

# Redis (use test instance)
REDIS_URL=redis://localhost:6379/1

# Skip AI tests if keys not available
SKIP_AI_TESTS=false
```

## Получение API ключей

### OpenAI
1. Перейдите на https://platform.openai.com/api-keys
2. Создайте новый API ключ
3. Скопируйте ключ (начинается с `sk-proj-`)

### Anthropic
1. Перейдите на https://console.anthropic.com/settings/keys
2. Создайте новый API ключ
3. Скопируйте ключ (начинается с `sk-ant-`)

### Google Gemini
1. Перейдите на https://makersuite.google.com/app/apikey
2. Создайте новый API ключ
3. Скопируйте ключ (начинается с `AIzaSy`)

### OpenRouter
1. Перейдите на https://openrouter.ai/keys
2. Создайте новый API ключ
3. Скопируйте ключ (начинается с `sk-or-v1-`)

### X.AI Grok
1. Перейдите на https://console.x.ai/
2. Создайте новый API ключ
3. Скопируйте ключ (начинается с `xai-`)

## Запуск тестов

```bash
# Скопируйте пример и заполните ключами
cp .env.test.example .env.test

# Запустите тесты
npm run test:ai

# Или отдельно
npm run test:ai-providers
npm run test:ai-e2e
```

