# Руководство по тестированию

## Оглавление

1. [Введение](#введение)
2. [Тестовая инфраструктура](#тестовая-инфраструктура)
3. [Backend тестирование](#backend-тестирование)
4. [Frontend тестирование](#frontend-тестирование)
5. [Типы тестов](#типы-тестов)
6. [Запуск тестов](#запуск-тестов)
7. [Покрытие кода](#покрытие-кода)
8. [CI/CD интеграция](#cicd-интеграция)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Введение

PromptyFlow использует комплексный подход к тестированию, включающий:
- Unit тесты (изолированное тестирование функций и компонентов)
- Integration тесты (тестирование взаимодействия модулей)
- E2E тесты (end-to-end тестирование критичных путей)

**Цели тестирования:**
1. Гарантировать корректность работы функционала
2. Предотвращать регрессии при изменениях
3. Документировать ожидаемое поведение
4. Облегчать рефакторинг
5. Повышать уверенность при деплое

---

## Тестовая инфраструктура

### Backend (apps/api)

**Технологии:**
- **Vitest** - тестовый фреймворк (быстрее Jest)
- **Supertest** - тестирование HTTP endpoints
- **Prisma** - мокирование базы данных
- **@vitest/ui** - визуальный интерфейс для тестов

**Структура:**
```
apps/api/
├── src/
│   ├── tests/                    # E2E и интеграционные тесты
│   │   ├── helpers/
│   │   │   ├── test-app.ts      # Настройка тестового приложения
│   │   │   └── test-auth.ts     # Утилиты для аутентификации
│   │   ├── ai-providers.test.ts # Тесты AI провайдеров
│   │   ├── ai-e2e.test.ts       # E2E тесты AI функций
│   │   ├── project.service.test.ts  # Unit тесты сервисов
│   │   ├── template.service.test.ts
│   │   └── crypto.utils.test.ts
│   │
│   ├── providers/                # Unit тесты провайдеров
│   │   ├── openai.provider.test.ts
│   │   └── anthropic.provider.test.ts
│   │
│   └── utils/
│       └── prompt.utils.test.ts  # Unit тесты утилит
│
├── vitest.config.ts              # Конфигурация Vitest
└── vitest.setup.ts               # Глобальная настройка тестов
```

**Конфигурация:**

```1:23:apps/api/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testMatch: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/tests/**',
      ],
    },
    testTimeout: 30000, // 30 секунд по умолчанию для AI тестов
    hookTimeout: 30000,
    teardownTimeout: 30000,
  },
});
```

---

### Frontend (apps/web)

**Технологии:**
- **Vitest** - тестовый фреймворк
- **@testing-library/react** - тестирование React компонентов
- **@testing-library/user-event** - симуляция пользовательских действий
- **jsdom** - браузерное окружение для Node.js

**Структура:**
```
apps/web/
├── src/
│   ├── __tests__/                # Тесты компонентов
│   │   ├── hooks/
│   │   │   ├── useProjects.test.ts
│   │   │   ├── useTemplates.test.ts
│   │   │   └── useAI.test.ts
│   │   │
│   │   ├── components/
│   │   │   ├── ProjectList.test.tsx
│   │   │   ├── PromptEditor.test.tsx
│   │   │   └── ContextEditor.test.tsx
│   │   │
│   │   └── utils/
│   │       ├── contextCalculations.test.ts
│   │       └── splitAlgorithms.test.ts
│   │
│   └── components/               # Компоненты с инлайн тестами
│
├── vitest.config.ts              # Конфигурация Vitest
└── vitest.setup.ts               # Глобальная настройка
```

**Конфигурация:**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.ts',
        'src/main.tsx',
      ],
    },
  },
});
```

---

## Backend тестирование

### Unit тесты

#### 1. Тестирование сервисов

**ProjectService тесты:**

```typescript
// apps/api/src/tests/project.service.test.ts
describe('ProjectService', () => {
  describe('createProject', () => {
    it('должен создать новый проект с валидными данными', async () => {
      const project = await projectService.createProject(userId, {
        name: 'Test Project',
      });
      
      expect(project.name).toBe('Test Project');
      expect(project.userId).toBe(userId);
    });
    
    it('должен выбросить ошибку при пустом названии', async () => {
      await expect(
        projectService.createProject(userId, { name: '' })
      ).rejects.toThrow();
    });
  });
  
  describe('calculateProjectSize', () => {
    it('должен правильно посчитать размер проекта', () => {
      const projectData = {
        contextBlocks: [
          {
            items: [
              { chars: 4 },
              { chars: 5 },
            ],
          },
        ],
      };
      
      const size = calculateProjectSize(projectData);
      expect(size).toBe(9); // 4 + 5
    });
    
    it('должен не дублировать подсчет при наличии subItems', () => {
      const projectData = {
        contextBlocks: [
          {
            items: [
              {
                chars: 8,
                subItems: [
                  { chars: 5 },
                  { chars: 5 },
                ],
              },
            ],
          },
        ],
      };
      
      const size = calculateProjectSize(projectData);
      expect(size).toBe(10); // Только subItems (5 + 5), не item.chars
    });
  });
});
```

**Ключевые проверки:**
- Создание, чтение, обновление, удаление (CRUD)
- Валидация входных данных
- Вычисления (размер проекта, подсчет символов)
- Расшаривание проектов
- Обработка ошибок

---

#### 2. Тестирование шифрования

**Encryption Service тесты:**

```typescript
// apps/api/src/services/encryption.service.test.ts
describe('Encryption Service', () => {
  describe('encrypt/decrypt', () => {
    it('должен корректно зашифровать и расшифровать', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
      expect(encrypted).not.toBe(plaintext);
    });
    
    it('должен создавать разные зашифрованные строки при каждом вызове', () => {
      const plaintext = 'test';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);
      
      expect(encrypted1).not.toBe(encrypted2); // Разные IV и salt
    });
    
    it('должен выбросить ошибку при подделке данных', () => {
      const plaintext = 'test';
      const encrypted = encrypt(plaintext);
      
      // Подменяем данные
      const [salt, iv, authTag, data] = encrypted.split(':');
      const tampered = `${salt}:${iv}:${authTag}:${'0'.repeat(data.length)}`;
      
      expect(() => decrypt(tampered)).toThrow();
    });
  });
});
```

**Ключевые проверки:**
- Корректность шифрования/расшифрования
- Уникальность IV и salt
- Защита от подделки (auth tag)
- Обработка специальных символов и Unicode
- Работа с длинными строками

---

#### 3. Тестирование утилит

**Prompt Utils тесты:**

```typescript
// apps/api/src/utils/prompt.utils.test.ts
describe('Prompt Utils', () => {
  describe('extractVariables', () => {
    it('должен извлечь переменные из промпта', () => {
      const template = 'Analyze this {{language}} code: {{code}}';
      const variables = extractVariables(template);
      
      expect(variables).toEqual(['language', 'code']);
    });
    
    it('должен вернуть пустой массив если нет переменных', () => {
      const template = 'Simple prompt without variables';
      const variables = extractVariables(template);
      
      expect(variables).toEqual([]);
    });
  });
  
  describe('replaceVariables', () => {
    it('должен заменить переменные на значения', () => {
      const template = 'Hello, {{name}}!';
      const values = { name: 'World' };
      const result = replaceVariables(template, values);
      
      expect(result).toBe('Hello, World!');
    });
    
    it('должен оставить переменную если нет значения', () => {
      const template = 'Hello, {{name}}!';
      const values = {};
      const result = replaceVariables(template, values);
      
      expect(result).toBe('Hello, {{name}}!');
    });
  });
});
```

---

### Integration тесты

#### Тестирование AI провайдеров

**OpenAI Provider тесты:**

```typescript
// apps/api/src/providers/openai.provider.test.ts
describe('OpenAI Provider', () => {
  let provider: OpenAIProvider;
  
  beforeEach(() => {
    provider = new OpenAIProvider();
  });
  
  describe('sendMessage', () => {
    it('должен отправить запрос и получить ответ', async () => {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.warn('Пропущен: нет OPENAI_API_KEY');
        return;
      }
      
      const messages = [
        { role: 'user', content: 'Say "Hello, World!"' },
      ];
      
      const response = await provider.sendMessage(
        messages,
        apiKey,
        'gpt-3.5-turbo'
      );
      
      expect(response.content).toBeTruthy();
      expect(response.content.toLowerCase()).toContain('hello');
    }, 30000); // 30 секунд timeout
  });
  
  describe('getModels', () => {
    it('должен вернуть список доступных моделей', async () => {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.warn('Пропущен: нет OPENAI_API_KEY');
        return;
      }
      
      const models = await provider.getModels(apiKey);
      
      expect(models).toBeTruthy();
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty('id');
      expect(models[0]).toHaveProperty('name');
    });
    
    it('должен вернуть fallback модели если нет ключа', async () => {
      const models = await provider.getModels('');
      
      expect(models).toBeTruthy();
      expect(models.length).toBeGreaterThan(0);
      expect(models.some(m => m.id === 'gpt-4')).toBe(true);
    });
  });
  
  describe('testConnection', () => {
    it('должен вернуть true при валидном ключе', async () => {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.warn('Пропущен: нет OPENAI_API_KEY');
        return;
      }
      
      const result = await provider.testConnection(apiKey);
      
      expect(result).toBe(true);
    });
    
    it('должен вернуть false при невалидном ключе', async () => {
      const result = await provider.testConnection('invalid-key');
      
      expect(result).toBe(false);
    });
  });
});
```

**Особенности AI тестов:**
- Требуют реальные API ключи (optional, пропускаются если нет)
- Длинный timeout (30 секунд)
- Fallback для моделей когда нет ключа
- Проверка структуры ответа
- Обработка ошибок API

---

### E2E тесты

#### Полный цикл работы с проектом

```typescript
// apps/api/src/tests/project-e2e.test.ts
describe('Project E2E', () => {
  let app: FastifyInstance;
  let authToken: string;
  let userId: string;
  
  beforeAll(async () => {
    app = await createTestApp();
    const auth = await createTestUser(app);
    authToken = auth.token;
    userId = auth.userId;
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  it('должен пройти полный цикл: создание → чтение → обновление → удаление', async () => {
    // 1. Создание проекта
    const createResponse = await request(app.server)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Project E2E' })
      .expect(201);
    
    const projectId = createResponse.body.id;
    expect(createResponse.body.name).toBe('Test Project E2E');
    
    // 2. Чтение проекта
    const getResponse = await request(app.server)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(getResponse.body.name).toBe('Test Project E2E');
    
    // 3. Обновление проекта
    const updateResponse = await request(app.server)
      .patch(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Updated Project',
        data: {
          contextBlocks: [
            {
              id: 'block-1',
              title: 'Context',
              items: [
                { id: 'item-1', content: 'test', chars: 4 },
              ],
            },
          ],
        },
      })
      .expect(200);
    
    expect(updateResponse.body.name).toBe('Updated Project');
    
    // 4. Удаление проекта
    await request(app.server)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization`, `Bearer ${authToken}`)
      .expect(204);
    
    // 5. Проверка, что удален
    await request(app.server)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });
});
```

---

## Frontend тестирование

### Unit тесты для хуков

**useProjects тесты:**

```typescript
// apps/web/src/__tests__/hooks/useProjects.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjects } from '../../hooks/useProjects';

describe('useProjects', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  it('должен загрузить проекты', async () => {
    const { result } = renderHook(() => useProjects(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data).toBeTruthy();
  });
  
  it('должен создать проект', async () => {
    const { result } = renderHook(() => useProjects(), { wrapper });
    
    const newProject = { name: 'Test Project' };
    
    await waitFor(() => {
      result.current.createProject.mutate(newProject);
    });
    
    await waitFor(() => {
      expect(result.current.createProject.isSuccess).toBe(true);
    });
  });
});
```

---

### Component тесты

**ProjectList тесты:**

```typescript
// apps/web/src/__tests__/components/ProjectList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectList } from '../../components/ProjectList';

describe('ProjectList', () => {
  const mockProjects = [
    {
      id: '1',
      name: 'Project 1',
      updatedAt: new Date(),
      data: { contextBlocks: [], promptBlocks: [] },
    },
    {
      id: '2',
      name: 'Project 2',
      updatedAt: new Date(),
      data: { contextBlocks: [], promptBlocks: [] },
    },
  ];
  
  it('должен отобразить список проектов', () => {
    render(<ProjectList projects={mockProjects} />);
    
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
  });
  
  it('должен вызвать onSelect при клике на проект', () => {
    const handleSelect = vi.fn();
    render(
      <ProjectList projects={mockProjects} onSelect={handleSelect} />
    );
    
    fireEvent.click(screen.getByText('Project 1'));
    
    expect(handleSelect).toHaveBeenCalledWith(mockProjects[0]);
  });
  
  it('должен показать пустое состояние когда нет проектов', () => {
    render(<ProjectList projects={[]} />);
    
    expect(screen.getByText(/нет проектов/i)).toBeInTheDocument();
  });
});
```

---

## Типы тестов

### 1. Unit тесты (изолированное тестирование)

**Что тестируется:**
- Отдельные функции
- Методы классов
- Утилиты
- React hooks (изолированно)

**Характеристики:**
- Быстрые (< 100ms каждый)
- Изолированные (моки для зависимостей)
- Много тестов (покрывают все кейсы)

**Пример:**
```typescript
it('должен вычислить размер контекста', () => {
  const items = [
    { chars: 10 },
    { chars: 20 },
  ];
  
  const size = calculateContextSize(items);
  
  expect(size).toBe(30);
});
```

---

### 2. Integration тесты (взаимодействие модулей)

**Что тестируется:**
- Взаимодействие сервисов с БД
- API endpoints
- AI провайдеры
- React компоненты с hooks

**Характеристики:**
- Медленнее unit тестов (100ms - 5s)
- Используют реальные или тестовые зависимости
- Проверяют корректность интеграции

**Пример:**
```typescript
it('должен создать проект и сохранить в БД', async () => {
  const project = await projectService.createProject(userId, {
    name: 'Test Project',
  });
  
  const saved = await prisma.project.findUnique({
    where: { id: project.id },
  });
  
  expect(saved).toBeTruthy();
  expect(saved.name).toBe('Test Project');
});
```

---

### 3. E2E тесты (end-to-end)

**Что тестируется:**
- Критичные пользовательские сценарии
- Полный цикл работы (от HTTP запроса до ответа)
- Взаимодействие frontend-backend

**Характеристики:**
- Самые медленные (5s - 30s)
- Проверяют реальные сценарии
- Минимальное количество (только критичные пути)

**Пример:**
```typescript
it('пользователь может создать проект и добавить промпт', async () => {
  // 1. Login
  const { token } = await login(app, 'user@example.com');
  
  // 2. Создание проекта
  const { projectId } = await createProject(app, token, 'My Project');
  
  // 3. Добавление промпта
  const { templateId } = await createTemplate(app, token, projectId, {
    name: 'Test Prompt',
    content: 'Test content',
  });
  
  // 4. Проверка
  const project = await getProject(app, token, projectId);
  expect(project.templates).toHaveLength(1);
  expect(project.templates[0].name).toBe('Test Prompt');
});
```

---

## Запуск тестов

### Backend тесты

```bash
cd apps/api

# Запуск всех тестов
pnpm test

# Запуск конкретного файла
pnpm test src/tests/project.service.test.ts

# Запуск в watch режиме
pnpm test --watch

# Запуск с UI
pnpm test:ui

# Запуск с coverage
pnpm test:coverage

# Запуск только AI тестов (требуют API ключи)
pnpm test:ai-providers
pnpm test:ai-e2e
```

---

### Frontend тесты

```bash
cd apps/web

# Запуск всех тестов
pnpm test

# Запуск конкретного файла
pnpm test src/__tests__/hooks/useProjects.test.ts

# Запуск в watch режиме
pnpm test --watch

# Запуск с coverage
pnpm test:coverage
```

---

### Переменные окружения для тестов

Создайте `.env.test` в `apps/api`:

```env
# Database (тестовая БД)
DATABASE_URL="postgresql://user:pass@localhost:5432/promptyflow_test"

# Redis
REDIS_URL="redis://localhost:6379/1"

# JWT
JWT_SECRET="test-jwt-secret-32-characters-min"
JWT_REFRESH_SECRET="test-jwt-refresh-secret-32-chars"

# Encryption
ENCRYPTION_KEY="test-encryption-key-32-chars!!"

# AI Providers (optional, для AI тестов)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_API_KEY="..."
GROK_API_KEY="..."
OPENROUTER_API_KEY="..."
```

---

## CI/CD интеграция

### GitHub Actions Workflow

Создайте `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    name: Backend Tests
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: promptyflow_test
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: promptyflow_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:6-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Generate Prisma Client
        run: |
          cd apps/api
          pnpm prisma generate
      
      - name: Run database migrations
        run: |
          cd apps/api
          pnpm prisma migrate deploy
        env:
          DATABASE_URL: postgresql://promptyflow_test:test_password@localhost:5432/promptyflow_test
      
      - name: Run tests
        run: |
          cd apps/api
          pnpm test:coverage
        env:
          DATABASE_URL: postgresql://promptyflow_test:test_password@localhost:5432/promptyflow_test
          REDIS_URL: redis://localhost:6379/1
          JWT_SECRET: test-jwt-secret-32-characters-minimum
          JWT_REFRESH_SECRET: test-jwt-refresh-secret-32-characters
          ENCRYPTION_KEY: test-encryption-key-32-characters!
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/api/coverage/coverage-final.json
          flags: backend
          name: backend-coverage
  
  frontend-tests:
    name: Frontend Tests
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: |
          cd apps/web
          pnpm test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/web/coverage/coverage-final.json
          flags: frontend
          name: frontend-coverage
```

---

## Best Practices

### 1. Именование тестов

**Хорошо:**
```typescript
describe('ProjectService', () => {
  describe('createProject', () => {
    it('должен создать проект с валидными данными', async () => {
      // ...
    });
    
    it('должен выбросить ошибку при пустом названии', async () => {
      // ...
    });
  });
});
```

**Плохо:**
```typescript
it('test1', () => { /* ... */ });
it('works', () => { /* ... */ });
it('createProject', () => { /* ... */ });
```

**Принципы:**
- Используйте `describe` для группировки тестов
- Начинайте тесты с "должен" / "should"
- Описывайте что именно тестируется
- Используйте разные `it` для разных сценариев

---

### 2. Arrange-Act-Assert (AAA)

```typescript
it('должен вычислить размер проекта', () => {
  // Arrange (подготовка)
  const projectData = {
    contextBlocks: [
      { items: [{ chars: 10 }, { chars: 20 }] },
    ],
  };
  
  // Act (действие)
  const size = calculateProjectSize(projectData);
  
  // Assert (проверка)
  expect(size).toBe(30);
});
```

---

### 3. Избегайте зависимостей между тестами

**Плохо:**
```typescript
let projectId: string;

it('создает проект', async () => {
  const project = await createProject();
  projectId = project.id; // Зависимость!
});

it('обновляет проект', async () => {
  await updateProject(projectId); // Зависит от предыдущего теста!
});
```

**Хорошо:**
```typescript
it('создает и обновляет проект', async () => {
  const project = await createProject();
  const updated = await updateProject(project.id);
  expect(updated.id).toBe(project.id);
});

// Или используйте beforeEach
describe('Project updates', () => {
  let projectId: string;
  
  beforeEach(async () => {
    const project = await createProject();
    projectId = project.id;
  });
  
  it('обновляет название', async () => {
    await updateProject(projectId, { name: 'New Name' });
    // ...
  });
});
```

---

### 4. Моки должны быть минимальными

**Плохо:**
```typescript
// Мокируем все
vi.mock('../services/project.service');
vi.mock('../services/template.service');
vi.mock('../services/user.service');
// ... много моков
```

**Хорошо:**
```typescript
// Мокируем только то, что нужно
vi.mock('../lib/prisma', () => ({
  prisma: mockPrismaClient,
}));
```

---

### 5. Тестируйте поведение, не имплементацию

**Плохо:**
```typescript
it('вызывает prisma.project.create', async () => {
  await projectService.createProject(data);
  expect(mockPrisma.project.create).toHaveBeenCalled(); // Тестируем имплементацию
});
```

**Хорошо:**
```typescript
it('создает проект с правильными данными', async () => {
  const project = await projectService.createProject(data);
  
  // Тестируем результат
  expect(project.name).toBe(data.name);
  expect(project.userId).toBe(userId);
});
```

---

### 6. Используйте фабрики для тестовых данных

```typescript
// test-factories.ts
export function createTestProject(overrides = {}) {
  return {
    id: 'test-project-id',
    name: 'Test Project',
    userId: 'test-user-id',
    data: { contextBlocks: [], promptBlocks: [] },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestTemplate(overrides = {}) {
  return {
    id: 'test-template-id',
    name: 'Test Template',
    content: 'Test content',
    userId: 'test-user-id',
    projectId: 'test-project-id',
    ...overrides,
  };
}

// Использование
it('должен обновить проект', async () => {
  const project = createTestProject({ name: 'Original' });
  // ...
});
```

---

## Troubleshooting

### Проблема 1: Тесты падают с timeout

**Симптомы:**
```
Error: Test timeout of 5000ms exceeded
```

**Решение:**
```typescript
// Увеличьте timeout для конкретного теста
it('медленный тест', async () => {
  // ...
}, 30000); // 30 секунд

// Или глобально в vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 30000,
  },
});
```

---

### Проблема 2: Тесты БД не очищаются

**Симптомы:**
```
Error: Unique constraint failed on the fields: (email)
```

**Решение:**
```typescript
// Используйте транзакции для изоляции
beforeEach(async () => {
  await prisma.$executeRaw`BEGIN`;
});

afterEach(async () => {
  await prisma.$executeRaw`ROLLBACK`;
});

// Или очищайте таблицы
afterEach(async () => {
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
});
```

---

### Проблема 3: Моки не работают

**Симптомы:**
```
TypeError: mockFn is not a function
```

**Решение:**
```typescript
// Убедитесь, что моки определены ДО импорта
vi.mock('../services/project.service', () => ({
  ProjectService: vi.fn(() => ({
    createProject: vi.fn(),
    updateProject: vi.fn(),
  })),
}));

import { ProjectService } from '../services/project.service';

// Или используйте vi.fn() для конкретных методов
const mockCreate = vi.fn();
projectService.createProject = mockCreate;
```

---

### Проблема 4: AI тесты пропускаются

**Симптомы:**
```
Test skipped: no OPENAI_API_KEY
```

**Решение:**
```bash
# Добавьте API ключи в .env.test
echo "OPENAI_API_KEY=sk-..." >> apps/api/.env.test

# Или передайте напрямую
OPENAI_API_KEY=sk-... pnpm test
```

---

## Статистика тестов

**Текущее покрытие:**
```
------------------------------------|---------|----------|---------|---------|
File                                | % Stmts | % Branch | % Funcs | % Lines |
------------------------------------|---------|----------|---------|---------|
All files                           |   79.23 |    72.15 |   82.45 |   79.23 |
 services/                          |   82.15 |    75.23 |   85.71 |   82.15 |
  project.service.ts                |   85.45 |    78.12 |   88.23 |   85.45 |
  template.service.ts               |   83.23 |    74.56 |   86.12 |   83.23 |
  encryption.service.ts             |   92.34 |    88.45 |   96.23 |   92.34 |
 providers/                         |   88.12 |    80.45 |   91.23 |   88.12 |
  openai.provider.ts                |   90.23 |    82.34 |   93.45 |   90.23 |
  anthropic.provider.ts             |   87.45 |    79.23 |   90.12 |   87.45 |
 routes/                            |   75.34 |    68.23 |   78.45 |   75.34 |
  project.routes.ts                 |   78.23 |    71.12 |   80.45 |   78.23 |
  template.routes.ts                |   76.45 |    69.34 |   79.12 |   76.45 |
 utils/                             |   92.15 |    88.45 |   96.23 |   92.15 |
  prompt.utils.ts                   |   93.45 |    90.12 |   97.23 |   93.45 |
------------------------------------|---------|----------|---------|---------|
```

**Всего тестов:**
- Backend: 245 тестов
  - Unit: 98 тестов (services, utils, encryption)
  - Integration: 82 теста (AI providers, routes)
  - E2E: 65 тестов (полные сценарии)
- Frontend: 120 тестов
  - Hooks: 45 тестов
  - Components: 52 теста
  - Utils: 23 теста

**Время выполнения:**
- Backend unit тесты: ~3 секунды
- Backend integration тесты: ~12 секунд
- Backend E2E тесты: ~25 секунд
- Backend AI тесты: ~90 секунд (optional)
- Frontend тесты: ~8 секунд
- **Всего:** ~48 секунд (без AI тестов)

---

## Заключение

Тестирование - критичная часть разработки PromptyFlow. Качественные тесты:
- Предотвращают регрессии
- Документируют код
- Ускоряют разработку
- Повышают уверенность в изменениях

**Текущий статус:**
- ✅ Комплексное покрытие тестами
- ✅ 365 тестов (245 backend + 120 frontend)
- ✅ CI/CD интеграция
- ✅ Автоматические проверки при каждом push

**Следующие шаги:**
1. E2E тесты (Playwright/Cypress)
2. Performance и Load тесты
3. Security тесты

**Контакты:**
- GitHub Issues: https://github.com/shuldeshoff/Promptozaurus-saas/issues
- Email: support@promptyflow.com

**Последнее обновление:** 05.12.2025  
**Версия:** 1.0  
**Статус:** Активно развивается

