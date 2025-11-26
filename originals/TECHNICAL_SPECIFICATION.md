# Техническое задание: PromptyFlow SaaS
**Сайт: http://promptyflow.com/**

## 1. Описание проекта

Разработка веб-приложения для создания и управления промптами для AI-моделей. Трансформация существующего Electron-приложения в многопользовательский облачный SaaS-сервис с сохранением всей ключевой функциональности.

## 2. Технологический стек

### 2.1 Frontend

**Основной фреймворк:**
- React 18+ с TypeScript
- Vite или Next.js (на выбор разработчика)

**Управление состоянием:**
- Zustand (рекомендуется, легковесный) ИЛИ
- Redux Toolkit (для сложной логики) ИЛИ
- Jotai (атомарный подход)

**Серверное состояние:**
- TanStack Query (React Query) — обязательно для кэширования и синхронизации

**Стилизация:**
- Tailwind CSS — обязательно
- shadcn/ui или Headless UI — для готовых компонентов

**Интернационализация:**
- i18next + react-i18next

**Формы и валидация:**
- React Hook Form
- Zod — схемы валидации

**HTTP клиент:**
- Axios или Fetch API с обертками

**Дополнительно:**
- react-window — виртуализация списков
- lodash/debounce — debounce для автосохранения
- date-fns — работа с датами

### 2.2 Backend

**Runtime и фреймворк:**
- Node.js 20+
- Express.js ИЛИ Fastify (быстрее) ИЛИ Nest.js (структурированный)
- TypeScript — обязательно

**База данных:**
- PostgreSQL 15+ — основная БД
- Prisma ORM — рекомендуется ИЛИ TypeORM

**Кэширование:**
- Redis — для сессий и кэша моделей AI

**Аутентификация:**
- Passport.js с Google OAuth 2.0 Strategy ИЛИ
- NextAuth.js (если используется Next.js)
- JWT для токенов (jsonwebtoken)

**Шифрование:**
- crypto (встроенный Node.js модуль) — для API ключей
- bcrypt — для хэширования (если понадобится)

**Валидация:**
- Zod — синхронизация схем с фронтендом

**Логирование:**
- Winston или Pino

**Безопасность:**
- helmet — защита заголовков
- cors — настройка CORS
- express-rate-limit — rate limiting

### 2.3 Deployment

**Hosting:**
- Frontend: Vercel, Netlify или AWS Amplify
- Backend: Railway, Render, AWS EC2/ECS или DigitalOcean
- База данных: Supabase, AWS RDS или DigitalOcean Managed PostgreSQL
- Redis: Upstash, Redis Cloud или AWS ElastiCache

**CI/CD:**
- GitHub Actions ИЛИ GitLab CI

**Мониторинг:**
- Sentry — отслеживание ошибок
- LogRocket или PostHog — аналитика поведения пользователей (опционально)

## 3. Архитектура приложения

### 3.1 Общая структура

```
Клиент (React SPA) <---> API Gateway <---> Backend Services
                                              ├── Auth Service
                                              ├── Project Service
                                              ├── Template Service
                                              ├── AI Proxy Service
                                              └── User Service
                                                     ├── PostgreSQL
                                                     └── Redis
```

### 3.2 Frontend архитектура

**Структура папок:**
```
src/
├── app/                    # Next.js App Router (если Next.js) или routes
├── components/             # React компоненты
│   ├── layout/            # Layout компоненты
│   ├── projects/          # Проекты
│   ├── contexts/          # Контекстные блоки
│   ├── prompts/           # Промпты
│   ├── library/           # Библиотека шаблонов
│   ├── ai/                # AI интеграция
│   └── ui/                # Общие UI компоненты
├── features/              # Фичи (если используется feature-sliced design)
├── hooks/                 # Кастомные хуки
├── stores/                # State management (Zustand/Redux stores)
├── services/              # API сервисы
│   ├── api.ts            # Axios instance с конфигурацией
│   ├── projects.ts       # CRUD проектов
│   ├── templates.ts      # Библиотека шаблонов
│   ├── ai.ts             # AI запросы
│   └── auth.ts           # Аутентификация
├── types/                 # TypeScript типы
├── utils/                 # Утилиты
├── locales/               # Переводы
│   ├── en/
│   └── ru/
└── styles/                # Глобальные стили
```

**Глобальное состояние (на примере Zustand):**

```typescript
// Основное состояние приложения
interface AppStore {
  // User
  user: User | null;
  setUser: (user: User) => void;

  // Projects
  projects: Project[];
  activeProjectId: string | null;
  setActiveProject: (id: string) => void;

  // Active project data
  contextBlocks: ContextBlock[];
  promptBlocks: PromptBlock[];

  // UI state
  activeTab: 'context' | 'prompt';
  activeContextBlockId: number | null;
  activePromptBlockId: number | null;
  language: 'en' | 'ru';
  theme: 'dark' | 'light';

  // Actions
  addContextBlock: (block: ContextBlock) => void;
  updateContextBlock: (id: number, data: Partial<ContextBlock>) => void;
  removeContextBlock: (id: number) => void;
  // ... другие actions
}
```

**Серверное состояние (React Query):**
- Используется для всех данных с сервера
- Автоматическое кэширование
- Оптимистичные обновления
- Автоматическая ре-валидация

```typescript
// Пример использования
const { data: projects } = useQuery({
  queryKey: ['projects'],
  queryFn: projectsService.getAll
});

const updateProjectMutation = useMutation({
  mutationFn: projectsService.update,
  onSuccess: () => {
    queryClient.invalidateQueries(['projects']);
  }
});
```

### 3.3 Backend архитектура

**Структура папок:**
```
server/
├── src/
│   ├── routes/            # Express/Fastify routes
│   │   ├── auth.ts
│   │   ├── projects.ts
│   │   ├── templates.ts
│   │   ├── ai.ts
│   │   └── user.ts
│   ├── controllers/       # Route handlers
│   ├── services/          # Бизнес-логика
│   │   ├── project.service.ts
│   │   ├── template.service.ts
│   │   ├── ai/
│   │   │   ├── openai.provider.ts
│   │   │   ├── anthropic.provider.ts
│   │   │   ├── gemini.provider.ts
│   │   │   ├── grok.provider.ts
│   │   │   └── openrouter.provider.ts
│   │   └── encryption.service.ts
│   ├── middleware/        # Express middleware
│   │   ├── auth.ts       # JWT validation
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── models/            # Prisma схемы или модели
│   ├── types/             # TypeScript типы
│   ├── utils/             # Утилиты
│   └── config/            # Конфигурация
├── prisma/
│   └── schema.prisma      # Prisma схема БД
└── server.ts              # Entry point
```

### 3.4 База данных

**Prisma схема (основные модели):**

```prisma
model User {
  id         String   @id @default(uuid())
  googleId   String   @unique
  email      String   @unique
  name       String
  avatarUrl  String?
  language   Language @default(en)
  theme      Theme    @default(dark)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  projects   Project[]
  templates  Template[]
  apiKeys    ApiKey[]
}

model Project {
  id        String   @id @default(uuid())
  userId    String
  name      String
  data      Json     // Вся структура проекта
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model Template {
  id        String   @id @default(uuid())
  userId    String
  name      String
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model ApiKey {
  id            String    @id @default(uuid())
  userId        String
  provider      Provider
  encryptedKey  String    @db.Text
  status        KeyStatus @default(not_configured)
  lastTestedAt  DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, provider])
  @@index([userId])
}

enum Language {
  en
  ru
}

enum Theme {
  dark
  light
}

enum Provider {
  openai
  anthropic
  gemini
  grok
  openrouter
}

enum KeyStatus {
  not_configured
  active
  error
}
```

## 4. Ключевые функциональные требования

### 4.1 Аутентификация

**Реализовать:**
- Google OAuth 2.0 flow
- Создание пользователя при первом входе
- JWT токены в httpOnly cookies
- Refresh token механизм
- Middleware для защиты API endpoints
- Endpoint `/auth/me` для получения текущего пользователя

### 4.2 Управление проектами

**Реализовать:**
- CRUD операции для проектов
- Лимит 10 проектов на бесплатного пользователя
- Валидация лимита на бэкенде
- Автосохранение с debounce (2 секунды)
- Экспорт проекта в JSON
- Импорт проекта из JSON с валидацией
- Дублирование проектов
- Миграция данных старого формата (добавление `subItems`, `subItemIds`)

### 4.3 Контекстные блоки

**Реализовать:**
- Трехуровневая структура: блоки → элементы → подэлементы
- CRUD для каждого уровня
- Автоматический подсчет символов
- Разделение текста на подэлементы:
  - По символам
  - По параграфам (split по `\n\n`)
  - По предложениям (regex: `[.!?]\s+`)
  - По кастомному шаблону (regex от пользователя)
- Inline редактирование названий (двойной клик)

### 4.4 Промпты

**Реализовать:**
- CRUD для промпт-блоков
- Редактор шаблона с плейсхолдером `{{context}}`
- Выбор контекстов через древовидные чекбоксы
- Независимые чекбоксы (можно выбрать подэлемент без родителя)
- Компиляция промпта:
  - Режим без тегов
  - Режим с XML тегами
- Копирование результата в буфер обмена (Clipboard API)
- Счетчик символов выбранного контекста
- Связь с шаблонами из библиотеки

### 4.5 Библиотека шаблонов

**Реализовать:**
- CRUD для персональных шаблонов пользователя
- Модальное окно библиотеки
- Поиск по названию (фильтрация на фронтенде)
- Загрузка шаблона в промпт
- Сохранение текущего промпта как шаблона
- Превью содержимого (первые 100 символов)

### 4.6 AI интеграция

**Реализовать:**

**Управление API ключами:**
- Добавление/обновление/удаление ключей для 5 провайдеров
- Шифрование ключей перед сохранением в БД (AES-256)
- Тест подключения для каждого провайдера
- Загрузка списка доступных моделей
- Кэширование списков моделей в Redis (TTL: 24 часа)

**AI провайдеры (создать базовый класс и наследников):**
- OpenAI Provider
- Anthropic Provider
- Google Gemini Provider
- Grok (X.AI) Provider
- OpenRouter Provider

Каждый провайдер должен иметь методы:
- `testConnection(apiKey)` — проверка ключа
- `getModels(apiKey)` — получение списка моделей
- `sendMessage(modelId, prompt, options)` — отправка промпта

**Proxy endpoint:**
- `/api/ai/send` — принимает промпт, использует зашифрованный ключ пользователя, проксирует запрос к провайдеру
- Обработка ошибок (rate limit, invalid key, model not found и т.д.)

### 4.7 Интернационализация

**Реализовать:**
- i18next конфигурация
- Переводы для en/ru
- Переключение языка без перезагрузки
- Сохранение выбора в профиле пользователя
- Определение языка браузера при первом входе

**Модули переводов:**
- common, header, navigation, modals, notifications, blocks, editor, ai, profile

### 4.8 UI/UX

**Реализовать:**
- Трехпанельный layout с изменяемыми размерами (resize handles)
- Темная тема (CSS переменные или Tailwind dark mode)
- Уведомления (toast notifications) — использовать react-hot-toast или sonner
- Модальные окна (использовать shadcn/ui Dialog или Headless UI)
- Индикатор загрузки при запросах
- Индикатор автосохранения ("Сохранено" / "Сохранение...")
- Breadcrumb навигация в редакторе
- Виртуализация для длинных списков (react-window)
- Debounce для автосохранения (lodash/debounce или useDebouncedCallback)

### 4.9 Безопасность

**Реализовать:**
- Helmet.js для защиты заголовков
- CORS конфигурация (только фронтенд домен)
- Rate limiting на все endpoints (express-rate-limit):
  - Auth: 5 запросов/минута
  - API: 100 запросов/минута
  - AI: 20 запросов/минута
- Валидация всех входных данных (Zod)
- Проверка user_id при всех операциях с БД
- httpOnly cookies для JWT
- Sanitization против XSS

## 5. Что НЕ нужно делать в первой версии

- ❌ Светлая тема (только архитектура для будущего добавления)
- ❌ Streaming режим для AI ответов
- ❌ История запросов к AI
- ❌ Шаринг проектов между пользователями
- ❌ Командная работа
- ❌ Платные планы (только готовность архитектуры)
- ❌ Мобильное приложение (только responsive web)
- ❌ Offline режим
- ❌ Версионирование проектов
- ❌ Webhooks и API для интеграций

## 6. API Endpoints

### 6.1 Authentication
```
GET  /auth/google              - Начало OAuth flow
GET  /auth/google/callback     - OAuth callback
POST /auth/logout              - Выход
GET  /auth/me                  - Текущий пользователь
```

### 6.2 User
```
GET    /api/user/profile       - Получить профиль
PATCH  /api/user/profile       - Обновить профиль (язык, тема)
GET    /api/user/api-keys      - Статусы API ключей
POST   /api/user/api-keys/:provider        - Добавить/обновить ключ
DELETE /api/user/api-keys/:provider        - Удалить ключ
POST   /api/user/api-keys/:provider/test   - Тест подключения
```

### 6.3 Projects
```
GET    /api/projects           - Список проектов
GET    /api/projects/:id       - Получить проект
POST   /api/projects           - Создать проект
PATCH  /api/projects/:id       - Обновить проект
DELETE /api/projects/:id       - Удалить проект
POST   /api/projects/:id/duplicate  - Дублировать проект
POST   /api/projects/import    - Импорт из JSON
```

### 6.4 Templates
```
GET    /api/templates          - Список шаблонов
GET    /api/templates/:id      - Получить шаблон
POST   /api/templates          - Создать шаблон
PATCH  /api/templates/:id      - Обновить шаблон
DELETE /api/templates/:id      - Удалить шаблон
```

### 6.5 AI
```
GET  /api/ai/providers         - Список провайдеров и статусов
GET  /api/ai/models            - Доступные модели (все провайдеры)
POST /api/ai/models/refresh    - Обновить кэш моделей
POST /api/ai/send              - Отправить промпт
```

## 7. Процесс разработки

### 7.1 Этапы

**Этап 1: Инфраструктура**
- Настроить проект (frontend + backend)
- Настроить БД (PostgreSQL + Prisma)
- Настроить Redis
- Настроить CI/CD

**Этап 2: Аутентификация**
- Google OAuth 2.0
- JWT middleware
- User model и endpoints

**Этап 3: Базовая структура UI**
- Layout (Header + 3 панели)
- Routing
- i18n настройка
- Темная тема

**Этап 4: Проекты**
- CRUD проектов
- Лимит на 10 проектов
- Автосохранение
- Импорт/экспорт

**Этап 5: Контекстные блоки**
- Трехуровневая структура
- CRUD для блоков/элементов/подэлементов
- Счетчики символов
- Разделение текста

**Этап 6: Промпты**
- CRUD промптов
- Редактор шаблонов
- Выбор контекста
- Компиляция (без тегов и с тегами)

**Этап 7: Библиотека шаблонов**
- CRUD шаблонов
- Поиск и фильтрация
- Интеграция с промптами

**Этап 8: AI интеграция**
- Управление API ключами (шифрование)
- 5 провайдеров
- Загрузка моделей
- Отправка промптов через proxy
- Кэширование в Redis

**Этап 9: Полировка**
- Обработка ошибок
- Валидация всех форм
- Responsive design
- Тестирование

**Этап 10: Deployment**
- Деплой frontend
- Деплой backend
- Настройка БД и Redis в production
- Настройка мониторинга

### 7.2 Тестирование

**Frontend:**
- Unit тесты ключевых утилит (Vitest или Jest)
- E2E тесты основных flow (Playwright или Cypress) — опционально

**Backend:**
- Unit тесты сервисов
- Integration тесты API endpoints (Supertest)
- Тесты провайдеров AI (с моками)

### 7.3 Environment переменные

**Backend (.env):**
```
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=

# Encryption
ENCRYPTION_KEY=  # 32-символьный ключ для AES-256

# App
NODE_ENV=development|production
PORT=3001
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=
```

## 8. Производительность

**Оптимизации:**
- React.memo для компонентов списков
- Code splitting (React.lazy)
- Виртуализация списков (react-window)
- Debounce для автосохранения (2 секунды)
- React Query для кэширования серверных данных
- Redis для кэширования списков моделей (TTL: 24 часа)
- Индексы в БД (userId на всех таблицах)
- Connection pooling для PostgreSQL
- Compression middleware (compression для Express)

## 9. Мониторинг и логирование

**Логи (Winston/Pino):**
- Все ошибки API
- Все запросы к AI провайдерам (для отладки)
- Ошибки аутентификации
- Rate limit violations

**Метрики (опционально):**
- Количество пользователей
- Количество проектов
- Количество запросов к AI (по провайдерам)
- Время ответа endpoints

**Мониторинг ошибок:**
- Sentry для фронтенда и бэкенда

## 10. Документация

**Что нужно:**
- README.md с инструкциями по запуску проекта
- API документация (Swagger/OpenAPI) — опционально
- Комментарии в коде для сложной логики
- Примеры .env файлов (.env.example)

## 11. Миграция данных из desktop версии

**Необязательно, но желательно:**
- Утилита для конвертации JSON проектов из Electron версии
- Автоматическая миграция при импорте:
  - Добавление `subItems: []` если отсутствует
  - Добавление `subItemIds: []` если отсутствует
  - Валидация структуры

## 12. Рекомендации по коду

**Общие принципы:**
- TypeScript строгий режим (strict: true)
- ESLint + Prettier
- Функциональный стиль (избегать классов где возможно, кроме AI провайдеров)
- Кастомные хуки для переиспользуемой логики
- Composition над наследованием
- DRY (Don't Repeat Yourself)
- SOLID принципы для бэкенда

**Именование:**
- camelCase для переменных и функций
- PascalCase для компонентов и типов
- UPPER_CASE для констант
- Файлы компонентов: PascalCase.tsx
- Файлы утилит: camelCase.ts

**Структура компонентов:**
```typescript
// 1. Imports
import { ... } from '...'

// 2. Types
interface Props { ... }

// 3. Component
export function ComponentName({ props }: Props) {
  // Hooks
  const state = useXXX();

  // Handlers
  const handleClick = () => { ... };

  // Render
  return <div>...</div>;
}
```

## 13. Итого

**Основные задачи:**
1. Настроить инфраструктуру (React + Node.js + PostgreSQL + Redis)
2. Реализовать Google OAuth аутентификацию
3. Создать трехпанельный UI с темной темой и i18n
4. Реализовать CRUD для проектов с лимитом 10 на пользователя
5. Реализовать трехуровневую систему контекстных блоков
6. Реализовать систему промптов с компиляцией
7. Создать библиотеку персональных шаблонов
8. Интегрировать 5 AI провайдеров с шифрованием ключей
9. Настроить автосохранение и синхронизацию данных
10. Деплоить на production

**Критерии готовности:**
- Пользователь может войти через Google
- Пользователь может создать до 10 проектов
- Пользователь может создать контексты, элементы, подэлементы
- Пользователь может создать промпты и скомпилировать их с контекстом
- Пользователь может добавить API ключи и отправить промпт через AI
- Все данные синхронизируются между устройствами
- Интерфейс работает на русском и английском
- Приложение работает стабильно без критических багов
