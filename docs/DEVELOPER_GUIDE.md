# Руководство разработчика: Как самостоятельно дорабатывать проект

## Введение

Этот документ содержит пошаговые инструкции для самостоятельной доработки, изменения и публикации изменений в проекте PromptyFlow. Предназначен для разработчиков, которые будут поддерживать и развивать проект.

---

## Оглавление

1. [Предварительные требования](#предварительные-требования)
2. [Настройка локального окружения](#настройка-локального-окружения)
3. [Структура проекта](#структура-проекта)
4. [Типовые задачи разработки](#типовые-задачи-разработки)
5. [Работа с базой данных](#работа-с-базой-данных)
6. [Тестирование изменений](#тестирование-изменений)
7. [Деплой на продакшен](#деплой-на-продакшен)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Предварительные требования

### Необходимые инструменты

**1. Node.js и npm**
```bash
# Проверить версию
node --version  # Требуется v18+
npm --version   # Требуется v9+

# Установка (если нужно)
# macOS
brew install node@18

# Ubuntu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**2. PostgreSQL**
```bash
# Проверить
psql --version  # Требуется v14+

# Установка
# macOS
brew install postgresql@14
brew services start postgresql@14

# Ubuntu
sudo apt install postgresql-14
sudo systemctl start postgresql
```

**3. Redis**
```bash
# Проверить
redis-cli --version  # Требуется v6+

# Установка
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt install redis-server
sudo systemctl start redis
```

**4. Git**
```bash
git --version
```

**5. Редактор кода**
- Visual Studio Code (рекомендуется)
- WebStorm
- Любой другой

---

## Настройка локального окружения

### Шаг 1: Клонирование репозитория

```bash
# Склонировать проект
git clone https://github.com/shuldeshoff/Promptozaurus-saas.git
cd Promptozaurus-saas

# Проверить структуру
ls -la
```

Должны увидеть:
```
apps/          # Приложения (web, api)
packages/      # Общие пакеты
docs/          # Документация
package.json   # Root package.json
pnpm-workspace.yaml
```

---

### Шаг 2: Установка зависимостей

```bash
# Установить pnpm глобально (если нет)
npm install -g pnpm

# Установить все зависимости проекта
pnpm install

# Это установит зависимости для:
# - apps/web (frontend)
# - apps/api (backend)
# - packages/shared (общие типы)
```

Ожидайте 2-5 минут на установку.

---

### Шаг 3: Настройка базы данных

**Создать базу данных:**
```bash
# Войти в PostgreSQL
psql postgres

# В psql консоли:
CREATE DATABASE promptyflow_dev;
CREATE USER promptyflow_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE promptyflow_dev TO promptyflow_user;
\q
```

**Проверить подключение:**
```bash
psql -h localhost -U promptyflow_user -d promptyflow_dev
# Ввести пароль
\q
```

---

### Шаг 4: Настройка переменных окружения

**Backend (apps/api/.env):**
```bash
cd apps/api
cp .env.example .env
nano .env
```

Заполнить:
```env
# Database
DATABASE_URL="postgresql://promptyflow_user:your_password@localhost:5432/promptyflow_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"

# Encryption (для API ключей)
ENCRYPTION_KEY="your-32-byte-encryption-key-here-exactly-32-chars"

# Google OAuth (необязательно для локальной разработки)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/auth/google/callback"

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"

# AI Providers (необязательно, но нужны для тестирования AI функций)
# Эти ключи пользователи добавят сами через UI
```

**Frontend (apps/web/.env):**
```bash
cd ../web
cp .env.example .env
nano .env
```

Заполнить:
```env
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

### Шаг 5: Применение миграций БД

```bash
cd apps/api

# Применить все миграции
pnpm prisma migrate dev

# Должны увидеть:
# ✓ Generated Prisma Client
# ✓ Applied migrations: ...
```

Это создаст все таблицы в БД.

**Проверить схему:**
```bash
pnpm prisma studio
```

Откроется браузер с визуальным интерфейсом БД (http://localhost:5555).

---

### Шаг 6: Запуск проекта локально

**Вариант 1: Запустить все сразу (из корня проекта):**
```bash
cd /path/to/Promptozaurus-saas

# Запустить frontend и backend одновременно
pnpm dev
```

**Вариант 2: Запустить отдельно (в разных терминалах):**

Терминал 1 - Backend:
```bash
cd apps/api
pnpm dev

# Должны увидеть:
# Server running on http://localhost:3001
# Database connected
# Redis connected
```

Терминал 2 - Frontend:
```bash
cd apps/web
pnpm dev

# Должны увидеть:
# VITE v4.x.x ready in xxx ms
# Local: http://localhost:3000
```

**Открыть в браузере:**
```
http://localhost:3000
```

---

## Структура проекта

### Обзор монорепозитория

```
Promptozaurus-saas/
├── apps/
│   ├── api/                    # Backend (Fastify + Prisma)
│   │   ├── src/
│   │   │   ├── routes/        # API endpoints
│   │   │   ├── services/      # Бизнес-логика
│   │   │   ├── providers/     # AI провайдеры
│   │   │   ├── middleware/    # Auth, CORS, etc.
│   │   │   ├── utils/         # Утилиты
│   │   │   └── index.ts       # Entry point
│   │   ├── prisma/
│   │   │   ├── schema.prisma  # Схема БД
│   │   │   └── migrations/    # SQL миграции
│   │   └── package.json
│   │
│   └── web/                    # Frontend (React + Vite)
│       ├── src/
│       │   ├── components/    # React компоненты
│       │   ├── hooks/         # Custom hooks
│       │   ├── stores/        # Zustand stores
│       │   ├── api/           # API клиент
│       │   ├── locales/       # i18n переводы
│       │   ├── types/         # TypeScript типы
│       │   └── App.tsx        # Root компонент
│       └── package.json
│
├── packages/
│   └── shared/                 # Общие типы и утилиты
│       └── src/
│           └── types.ts
│
├── docs/                       # Документация
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   ├── MONITORING.md
│   ├── SECURITY.md
│   └── DEVELOPER_GUIDE.md     # Этот файл
│
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # Workspace конфигурация
└── README.md
```

---

### Где что находится

| Задача | Файлы |
|--------|-------|
| **API endpoints** | `apps/api/src/routes/*.routes.ts` |
| **Бизнес-логика** | `apps/api/src/services/*.service.ts` |
| **Схема БД** | `apps/api/prisma/schema.prisma` |
| **AI провайдеры** | `apps/api/src/providers/*.provider.ts` |
| **React компоненты** | `apps/web/src/components/**/*.tsx` |
| **API хуки** | `apps/web/src/hooks/*.ts` |
| **Глобальное состояние** | `apps/web/src/stores/*.ts` |
| **Переводы** | `apps/web/src/locales/ru/*.json` |
| **Типы** | `packages/shared/src/types.ts` |

---

## Типовые задачи разработки

### Задача 1: Добавить новое поле в проект

**Сценарий:** Нужно добавить поле "description" к проектам.

**Шаг 1: Обновить схему БД**
```bash
cd apps/api
nano prisma/schema.prisma
```

Изменить модель Project:
```prisma
model Project {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text  // Новое поле
  data        Json     @db.JsonB
  userId      String
  // ... остальные поля
}
```

**Шаг 2: Создать миграцию**
```bash
pnpm prisma migrate dev --name add_project_description

# Prisma спросит название миграции (уже указали)
# Создастся файл: prisma/migrations/YYYYMMDDHHMMSS_add_project_description/migration.sql
```

**Шаг 3: Обновить типы (автоматически)**
```bash
pnpm prisma generate
```

**Шаг 4: Обновить API**

Открыть `apps/api/src/services/project.service.ts`:
```typescript
async createProject(userId: string, data: { name: string; description?: string }) {
  return this.prisma.project.create({
    data: {
      name: data.name,
      description: data.description, // Добавить
      userId,
      data: { contextBlocks: [], promptBlocks: [] },
    },
  });
}

async updateProject(id: string, userId: string, updates: { name?: string; description?: string }) {
  return this.prisma.project.update({
    where: { id, userId },
    data: updates, // description автоматически включен
  });
}
```

**Шаг 5: Обновить Frontend**

Открыть `apps/web/src/components/ProjectModal.tsx`:
```typescript
const [description, setDescription] = useState('');

// В JSX добавить:
<textarea
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  placeholder="Описание проекта (необязательно)"
/>

// При сохранении:
await createProject({ name, description });
```

**Шаг 6: Тестирование**
```bash
# Перезапустить backend (если не hot-reload)
cd apps/api
pnpm dev

# Frontend должен перезагрузиться автоматически (Vite HMR)
```

Проверить:
1. Создать новый проект с описанием
2. Проверить в БД через Prisma Studio
3. Проверить, что описание отображается

---

### Задача 2: Добавить новый AI провайдер

**Сценарий:** Добавить поддержку Mistral AI.

**Шаг 1: Создать провайдер**
```bash
cd apps/api/src/providers
touch mistral.provider.ts
```

Содержимое `mistral.provider.ts`:
```typescript
import axios from 'axios';
import { AIProvider, AIMessage, AIResponse } from '../types/ai.types';

export class MistralProvider implements AIProvider {
  name = 'mistral' as const;

  async sendMessage(
    messages: AIMessage[],
    apiKey: string,
    model: string,
    options?: any
  ): Promise<AIResponse> {
    try {
      const response = await axios.post(
        'https://api.mistral.ai/v1/chat/completions',
        {
          model,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 2000,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        content: response.data.choices[0].message.content,
        model,
        usage: {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        },
      };
    } catch (error: any) {
      throw new Error(`Mistral API error: ${error.message}`);
    }
  }

  async getModels(apiKey: string): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await axios.get('https://api.mistral.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      return response.data.data.map((model: any) => ({
        id: model.id,
        name: model.id,
      }));
    } catch (error) {
      // Fallback models
      return [
        { id: 'mistral-tiny', name: 'Mistral Tiny' },
        { id: 'mistral-small', name: 'Mistral Small' },
        { id: 'mistral-medium', name: 'Mistral Medium' },
      ];
    }
  }

  async testConnection(apiKey: string): Promise<boolean> {
    try {
      await this.getModels(apiKey);
      return true;
    } catch {
      return false;
    }
  }
}
```

**Шаг 2: Зарегистрировать провайдер**

Открыть `apps/api/src/services/ai.service.ts`:
```typescript
import { MistralProvider } from '../providers/mistral.provider';

export class AIService {
  private providers = {
    openai: new OpenAIProvider(),
    anthropic: new AnthropicProvider(),
    gemini: new GeminiProvider(),
    grok: new GrokProvider(),
    openrouter: new OpenRouterProvider(),
    mistral: new MistralProvider(), // Добавить
  };
  
  // ...
}
```

**Шаг 3: Обновить схему БД (enum)**

Открыть `apps/api/prisma/schema.prisma`:
```prisma
enum AIProvider {
  OPENAI
  ANTHROPIC
  GEMINI
  GROK
  OPENROUTER
  MISTRAL  // Добавить
}
```

Создать миграцию:
```bash
cd apps/api
pnpm prisma migrate dev --name add_mistral_provider
```

**Шаг 4: Обновить Frontend**

Открыть `apps/web/src/constants/providers.ts`:
```typescript
export const PROVIDERS = {
  openai: { name: 'OpenAI', icon: '🤖' },
  anthropic: { name: 'Anthropic', icon: '🧠' },
  gemini: { name: 'Google Gemini', icon: '✨' },
  grok: { name: 'xAI Grok', icon: '🚀' },
  openrouter: { name: 'OpenRouter', icon: '🔀' },
  mistral: { name: 'Mistral AI', icon: '🌪️' }, // Добавить
} as const;
```

**Шаг 5: Добавить в модальное окно**

Frontend автоматически подхватит нового провайдера через API `/ai/models`.

**Шаг 6: Тестирование**
```bash
# Перезапустить backend
cd apps/api
pnpm dev
```

1. Открыть настройки AI
2. Добавить Mistral API ключ
3. Проверить подключение
4. Отправить тестовое сообщение

---

### Задача 3: Изменить UI компонент

**Сценарий:** Изменить цвет кнопки "Создать проект".

**Шаг 1: Найти компонент**
```bash
cd apps/web
grep -r "Создать проект" src/
# Или найти через поиск в VS Code: Cmd+Shift+F
```

Найдем в `src/components/ProjectList.tsx`.

**Шаг 2: Изменить стили**

Открыть `apps/web/src/components/ProjectList.tsx`:
```tsx
// Было:
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
  Создать проект
</button>

// Стало:
<button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
  Создать проект
</button>
```

**Шаг 3: Проверить изменения**

Vite автоматически перезагрузит (Hot Module Replacement). Просто посмотрите в браузер - кнопка должна стать зеленой.

**Шаг 4: Кастомные цвета (если нужно)**

Если нужны цвета не из Tailwind, открыть `apps/web/tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-primary': '#FF6B6B',
        'brand-secondary': '#4ECDC4',
      },
    },
  },
};
```

Использовать:
```tsx
<button className="bg-brand-primary hover:bg-brand-secondary">
  Создать проект
</button>
```

---

### Задача 4: Добавить новый перевод

**Сценарий:** Добавить текст "Export All Projects" на русский.

**Шаг 1: Найти ключ в коде**
```typescript
// В компоненте:
const { t } = useTranslation('projects');
<button>{t('exportAll')}</button>
```

**Шаг 2: Добавить перевод**

Открыть `apps/web/src/locales/ru/projects.json`:
```json
{
  "title": "Проекты",
  "create": "Создать проект",
  "exportAll": "Экспортировать все проекты"  // Добавить
}
```

Открыть `apps/web/src/locales/en/projects.json`:
```json
{
  "title": "Projects",
  "create": "Create Project",
  "exportAll": "Export All Projects"  // Добавить
}
```

**Шаг 3: Проверить**

Изменения применятся автоматически (HMR). Переключите язык в приложении.

---

## Работа с базой данных

### Создание новой таблицы

**Шаг 1: Добавить модель в schema.prisma**
```bash
cd apps/api
nano prisma/schema.prisma
```

Пример - таблица для тегов:
```prisma
model Tag {
  id        String   @id @default(cuid())
  name      String   @unique
  color     String?  @default("#3B82F6")
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  
  @@index([userId])
}

// Добавить связь в модель User:
model User {
  // ... существующие поля
  tags      Tag[]    // Добавить
}
```

**Шаг 2: Создать миграцию**
```bash
pnpm prisma migrate dev --name add_tags_table
```

**Шаг 3: Проверить миграцию**
```bash
cat prisma/migrations/YYYYMMDD_add_tags_table/migration.sql
```

Должно быть:
```sql
CREATE TABLE "Tag" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "color" TEXT DEFAULT '#3B82F6',
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "Tag_userId_idx" ON "Tag"("userId");
```

**Шаг 4: Применить к продакшен БД (позже)**
```bash
# На проде:
pnpm prisma migrate deploy
```

---

### Изменение существующей таблицы

**Сценарий:** Добавить поле `archived` к проектам.

**Шаг 1: Изменить схему**
```prisma
model Project {
  // ... существующие поля
  archived  Boolean  @default(false)  // Добавить
}
```

**Шаг 2: Создать миграцию**
```bash
pnpm prisma migrate dev --name add_archived_to_projects
```

**Шаг 3: Обновить запросы**

Открыть `apps/api/src/services/project.service.ts`:
```typescript
async getUserProjects(userId: string) {
  return this.prisma.project.findMany({
    where: { 
      userId,
      archived: false,  // Фильтровать архивные
    },
    orderBy: { updatedAt: 'desc' },
  });
}

async archiveProject(id: string, userId: string) {
  return this.prisma.project.update({
    where: { id, userId },
    data: { archived: true },
  });
}
```

---

### Откат миграции

**Если миграция сломала БД:**
```bash
cd apps/api

# Посмотреть историю миграций
pnpm prisma migrate status

# Откатить последнюю миграцию (DEV ONLY!)
pnpm prisma migrate reset

# Это:
# 1. Удалит все данные
# 2. Применит все миграции заново
# ⚠️ ТОЛЬКО ДЛЯ РАЗРАБОТКИ!
```

**На продакшене откат сложнее:**
```bash
# 1. Создать миграцию, которая отменяет изменения
pnpm prisma migrate dev --name revert_feature_x

# 2. Вручную написать SQL в migration.sql
# Например, если добавляли поле:
ALTER TABLE "Project" DROP COLUMN "archived";

# 3. Применить
pnpm prisma migrate deploy
```

---

### Просмотр данных в БД

**Вариант 1: Prisma Studio (визуальный интерфейс)**
```bash
cd apps/api
pnpm prisma studio
```

Откроется http://localhost:5555 с GUI для БД.

**Вариант 2: psql (консоль)**
```bash
psql -h localhost -U promptyflow_user -d promptyflow_dev

# Посмотреть таблицы
\dt

# Посмотреть структуру таблицы
\d "Project"

# Запрос
SELECT id, name, "createdAt" FROM "Project" LIMIT 10;

# Выход
\q
```

**Вариант 3: GUI клиент**
- pgAdmin 4
- DBeaver
- TablePlus (macOS)

---

## Тестирование изменений

### Локальное тестирование

**1. Проверка TypeScript**
```bash
# Backend
cd apps/api
pnpm tsc --noEmit

# Frontend
cd apps/web
pnpm tsc --noEmit
```

Не должно быть ошибок типов.

**2. Проверка ESLint**
```bash
# Backend
cd apps/api
pnpm lint

# Frontend
cd apps/web
pnpm lint
```

**3. Запуск тестов (если есть)**
```bash
# Backend
cd apps/api
pnpm test

# Frontend
cd apps/web
pnpm test
```

---

### Ручное тестирование

**Чек-лист для каждого изменения:**

1. Авторизация работает
2. Создание проекта работает
3. Сохранение промптов работает
4. AI запросы работают (хотя бы 1 провайдер)
5. Поиск работает
6. Экспорт/импорт работает
7. Нет ошибок в консоли браузера (F12)
8. Нет ошибок в консоли backend

**Тестовые сценарии:**
```bash
# 1. Авторизация
- Открыть http://localhost:3000
- Войти через Google OAuth
- Проверить, что попали в приложение

# 2. Создание проекта
- Нажать "Создать проект"
- Ввести название
- Проверить, что проект создался

# 3. Работа с промптами
- Создать промпт
- Добавить контекст
- Сохранить
- Перезагрузить страницу - всё на месте?

# 4. AI запрос
- Настроить AI провайдер (добавить ключ)
- Отправить тестовый промпт
- Проверить, что пришел ответ
- Сохранить ответ в контекст

# 5. Поиск
- Создать несколько промптов
- Ввести поисковый запрос
- Проверить, что находит правильные результаты

# 6. Экспорт
- Экспортировать проект
- Проверить JSON файл
- Импортировать обратно
```

---

### Тестирование на мобильных

**Chrome DevTools:**
```bash
# Открыть DevTools: F12 или Cmd+Option+I
# Toggle Device Toolbar: Cmd+Shift+M (Mac) или Ctrl+Shift+M (Windows)

# Тестировать на:
- iPhone SE (375x667)
- iPhone 12 Pro (390x844)
- iPad (768x1024)
- Android Phone (360x640)
```

**Проверить:**
- Все кнопки кликабельны
- Текст читаем
- Модальные окна не выходят за границы
- Скролл работает
- Клавиатура не закрывает поля ввода

---

## Деплой на продакшен

### Подготовка к деплою

**1. Проверка изменений**
```bash
cd /path/to/Promptozaurus-saas

# Посмотреть статус
git status

# Посмотреть изменения
git diff
```

**2. Коммит изменений**
```bash
# Добавить файлы
git add .

# Или выборочно:
git add apps/api/src/services/project.service.ts
git add apps/web/src/components/ProjectModal.tsx

# Коммит с понятным сообщением
git commit -m "feat: добавлено поле description к проектам

- Добавлено поле description в schema.prisma
- Обновлен project.service.ts для поддержки description
- Добавлен UI для ввода description в ProjectModal
- Создана миграция add_project_description"

# Отправить в GitHub
git push origin main
```

---

### Деплой через SSH

**Подключение к серверу:**
```bash
# Используя алиас (если настроен)
ssh promptyflow

# Или напрямую:
ssh user@promptyflow.com
```

**После подключения к серверу:**
```bash
# 1. Перейти в директорию проекта
cd ~/Promptozaurus-saas

# 2. Остановить приложение
pm2 stop all

# 3. Получить последние изменения
git pull origin main

# 4. Установить новые зависимости (если есть)
pnpm install

# 5. Применить миграции БД
cd apps/api
pnpm prisma migrate deploy

# 6. Сгенерировать Prisma Client
pnpm prisma generate

# 7. Собрать Frontend
cd ../web
pnpm build

# 8. Собрать Backend
cd ../api
pnpm build

# 9. Перезапустить приложение
cd ../..
pm2 restart all

# 10. Проверить статус
pm2 status
pm2 logs

# 11. Проверить сайт
curl -I https://promptyflow.com
```

---

### Автоматический деплой скрипт

**Создать скрипт deploy.sh:**
```bash
cd ~/Promptozaurus-saas
nano deploy.sh
```

Содержимое:
```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Остановить приложение
echo "📦 Stopping application..."
pm2 stop all

# Получить изменения
echo "📥 Pulling latest changes..."
git pull origin main

# Установить зависимости
echo "📦 Installing dependencies..."
pnpm install

# Миграции БД
echo "🗄️ Running database migrations..."
cd apps/api
pnpm prisma migrate deploy
pnpm prisma generate

# Сборка Frontend
echo "🎨 Building frontend..."
cd ../web
pnpm build

# Сборка Backend
echo "⚙️ Building backend..."
cd ../api
pnpm build

# Перезапуск
echo "🔄 Restarting application..."
cd ../..
pm2 restart all

# Статус
echo "✅ Deployment complete!"
pm2 status

echo ""
echo "🌐 Check: https://promptyflow.com"
```

Дать права:
```bash
chmod +x deploy.sh
```

**Использование:**
```bash
ssh promptyflow
cd ~/Promptozaurus-saas
./deploy.sh
```

---

### Откат деплоя (Rollback)

**Если что-то пошло не так:**
```bash
# 1. Подключиться к серверу
ssh promptyflow
cd ~/Promptozaurus-saas

# 2. Посмотреть последние коммиты
git log --oneline -10

# 3. Откатиться на предыдущий коммит
git reset --hard <commit-hash>
# Например: git reset --hard abc123f

# 4. Пересобрать и перезапустить
./deploy.sh

# 5. Если нужно откатить миграцию БД:
cd apps/api
# Создать миграцию отката вручную (см. раздел "Откат миграции")
```

**Альтернатива - использовать ветки:**
```bash
# На локальной машине:
git checkout -b release-v1.0.0
git push origin release-v1.0.0

# На сервере деплоить с этой ветки:
git checkout release-v1.0.0
git pull origin release-v1.0.0
./deploy.sh
```

---

### Проверка после деплоя

**1. Проверка PM2:**
```bash
pm2 status
# Все процессы должны быть "online"

pm2 logs --lines 50
# Не должно быть ошибок
```

**2. Проверка Nginx:**
```bash
sudo systemctl status nginx
# Должен быть active (running)

sudo tail -f /var/log/nginx/error.log
# Не должно быть новых ошибок
```

**3. Проверка БД:**
```bash
sudo systemctl status postgresql
# Должен быть active (running)

psql -h localhost -U promptyflow_user -d promptyflow_prod -c "SELECT COUNT(*) FROM \"Project\";"
# Должны увидеть число проектов
```

**4. Проверка Redis:**
```bash
sudo systemctl status redis
# Должен быть active (running)

redis-cli ping
# Должен ответить PONG
```

**5. Проверка сайта:**
```bash
# HTTP статус
curl -I https://promptyflow.com
# Должен быть 200 OK

# SSL сертификат
curl -vI https://promptyflow.com 2>&1 | grep "SSL certificate verify ok"
```

**6. Проверка в браузере:**
- Открыть https://promptyflow.com
- Войти в аккаунт
- Создать тестовый проект
- Отправить AI запрос
- Проверить новый функционал

---

## Troubleshooting

### Проблема 1: Backend не стартует

**Симптомы:**
```bash
pnpm dev
# Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Решение:**
```bash
# Проверить PostgreSQL
psql --version
sudo systemctl status postgresql  # Linux
brew services list  # macOS

# Запустить PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql@14  # macOS

# Проверить подключение
psql -h localhost -U promptyflow_user -d promptyflow_dev
```

---

### Проблема 2: Prisma не видит БД

**Симптомы:**
```bash
pnpm prisma migrate dev
# Error: Can't reach database server
```

**Решение:**
```bash
# Проверить DATABASE_URL в .env
cat apps/api/.env | grep DATABASE_URL

# Формат должен быть:
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Проверить, что USER и DATABASE существуют
psql postgres -c "\du"  # Список пользователей
psql postgres -c "\l"   # Список БД

# Создать, если нет
psql postgres
CREATE USER promptyflow_user WITH PASSWORD 'password';
CREATE DATABASE promptyflow_dev OWNER promptyflow_user;
\q
```

---

### Проблема 3: Frontend не видит Backend

**Симптомы:**
```
Console error: net::ERR_CONNECTION_REFUSED http://localhost:3001
```

**Решение:**
```bash
# 1. Проверить, что backend запущен
lsof -i :3001
# Должен показать node процесс

# Если нет:
cd apps/api
pnpm dev

# 2. Проверить VITE_API_URL
cat apps/web/.env
# Должно быть: VITE_API_URL=http://localhost:3001

# 3. Проверить CORS в backend
# apps/api/src/index.ts должен иметь:
await app.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});
```

---

### Проблема 4: Миграция падает

**Симптомы:**
```bash
pnpm prisma migrate dev
# Error: Foreign key constraint violation
```

**Решение:**
```bash
# Опция 1: Сбросить БД (DEV ONLY!)
pnpm prisma migrate reset

# Опция 2: Вручную удалить конфликтующие данные
psql -h localhost -U promptyflow_user -d promptyflow_dev

# Найти проблемные записи
SELECT * FROM "Project" WHERE "userId" NOT IN (SELECT id FROM "User");

# Удалить
DELETE FROM "Project" WHERE "userId" NOT IN (SELECT id FROM "User");
\q

# Попробовать миграцию снова
pnpm prisma migrate dev
```

---

### Проблема 5: PM2 не запускает приложение на проде

**Симптомы:**
```bash
pm2 logs
# Error: Cannot find module 'dist/index.js'
```

**Решение:**
```bash
# Убедиться, что проект собран
cd ~/Promptozaurus-saas/apps/api
ls dist/
# Должны увидеть index.js

# Если нет:
pnpm build

# Проверить ecosystem.config.js
cat ecosystem.config.js
# script должен указывать на dist/index.js

# Перезапустить
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

---

### Проблема 6: 502 Bad Gateway после деплоя

**Симптомы:**
```
Браузер показывает: 502 Bad Gateway
```

**Решение:**
```bash
# 1. Проверить статус приложения
pm2 status
# Если stopped или errored:
pm2 logs
# Исправить ошибку и перезапустить

# 2. Проверить, что backend слушает на правильном порту
netstat -tulpn | grep 3001
# Должен показать node процесс

# 3. Проверить конфигурацию Nginx
sudo nginx -t
# Должен сказать "syntax is ok"

# Если ошибка:
sudo nano /etc/nginx/sites-available/promptyflow
# Исправить конфигурацию
sudo systemctl reload nginx

# 4. Проверить логи Nginx
sudo tail -f /var/log/nginx/error.log
```

---

### Проблема 7: SSL сертификат истек

**Симптомы:**
```
Браузер: "Your connection is not private"
```

**Решение:**
```bash
# Проверить срок действия сертификата
sudo certbot certificates

# Обновить сертификат
sudo certbot renew

# Или принудительно
sudo certbot renew --force-renewal

# Перезагрузить Nginx
sudo systemctl reload nginx

# Проверить
curl -vI https://promptyflow.com 2>&1 | grep "expire date"
```

---

## Best Practices

### Работа с Git

**1. Создавайте осмысленные коммиты:**
```bash
# Хорошо:
git commit -m "feat: добавлен экспорт проектов в CSV

- Создан service method exportToCSV
- Добавлена кнопка экспорта в UI
- Добавлены тесты"

# Плохо:
git commit -m "фикс"
git commit -m "еще изменения"
```

**2. Используйте ветки для больших фич:**
```bash
# Создать ветку
git checkout -b feature/project-sharing

# Работать в ветке
git add .
git commit -m "feat: добавлена база для шеринга проектов"

# Отправить в GitHub
git push origin feature/project-sharing

# После тестирования - смержить в main
git checkout main
git merge feature/project-sharing
git push origin main
```

**3. Префиксы коммитов:**
```
feat:     новая функциональность
fix:      исправление бага
refactor: рефакторинг кода
docs:     изменения в документации
style:    форматирование кода
test:     добавление тестов
chore:    рутинные задачи (обновление зависимостей и т.п.)
perf:     улучшение производительности
```

---

### Работа с кодом

**1. TypeScript:**
```typescript
// Хорошо: явные типы
interface ProjectData {
  name: string;
  description?: string;
}

async function createProject(data: ProjectData): Promise<Project> {
  // ...
}

// Плохо: any
async function createProject(data: any): Promise<any> {
  // ...
}
```

**2. Error Handling:**
```typescript
// Хорошо: обработка ошибок
try {
  const result = await api.createProject(data);
  toast.success('Проект создан');
  return result;
} catch (error) {
  console.error('Failed to create project:', error);
  toast.error('Не удалось создать проект');
  throw error;
}

// Плохо: игнорирование ошибок
const result = await api.createProject(data);
toast.success('Проект создан');
```

**3. Именование:**
```typescript
// Хорошо: понятные имена
const activeProjects = projects.filter(p => !p.archived);
const totalCharacters = calculateProjectSize(project);

// Плохо: сокращения
const actProj = projects.filter(p => !p.arch);
const totChars = calcSize(proj);
```

**4. Комментарии:**
```typescript
// Хорошо: объяснение "почему"
// Используем debounce 500ms, чтобы избежать множественных запросов
// при быстром наборе текста
const debouncedSearch = useMemo(
  () => debounce(handleSearch, 500),
  []
);

// Плохо: объяснение "что" (очевидно из кода)
// Функция для поиска
function search() { ... }
```

---

### Работа с БД

**1. Всегда используйте индексы:**
```prisma
model Project {
  id     String @id @default(cuid())
  userId String
  
  @@index([userId])  // Индекс для быстрого поиска по userId
}
```

**2. Используйте транзакции для связанных операций:**
```typescript
// Хорошо: в транзакции
await prisma.$transaction([
  prisma.project.delete({ where: { id } }),
  prisma.template.deleteMany({ where: { projectId: id } }),
]);

// Плохо: отдельно (может сломаться между операциями)
await prisma.project.delete({ where: { id } });
await prisma.template.deleteMany({ where: { projectId: id } });
```

**3. Избегайте N+1 запросов:**
```typescript
// Хорошо: один запрос с include
const projects = await prisma.project.findMany({
  where: { userId },
  include: {
    templates: true,  // Загружаем связанные templates сразу
  },
});

// Плохо: N+1 запросов
const projects = await prisma.project.findMany({ where: { userId } });
for (const project of projects) {
  const templates = await prisma.template.findMany({ 
    where: { projectId: project.id } 
  });  // Запрос в цикле!
}
```

---

### Работа с производительностью

**1. Используйте React.memo для тяжелых компонентов:**
```typescript
// Предотвращаем лишние ре-рендеры
export const ProjectCard = React.memo(({ project }: { project: Project }) => {
  return <div>{project.name}</div>;
});
```

**2. Используйте useMemo для тяжелых вычислений:**
```typescript
const sortedProjects = useMemo(() => {
  return projects.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}, [projects]);  // Пересчитываем только когда projects изменился
```

**3. Lazy loading для больших компонентов:**
```typescript
const AIConfigModal = lazy(() => import('./AIConfigModal'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <AIConfigModal />
    </Suspense>
  );
}
```

**4. Пагинация для больших списков:**
```typescript
// Backend
async getUserProjects(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  return this.prisma.project.findMany({
    where: { userId },
    skip,
    take: limit,
    orderBy: { updatedAt: 'desc' },
  });
}
```

---

### Безопасность

**1. Всегда проверяйте userId:**
```typescript
// Хорошо: проверяем, что пользователь может редактировать проект
async updateProject(id: string, userId: string, data: any) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== userId) {
    throw new Error('Unauthorized');
  }
  return prisma.project.update({ where: { id }, data });
}

// Плохо: не проверяем владельца
async updateProject(id: string, data: any) {
  return prisma.project.update({ where: { id }, data });
}
```

**2. Никогда не логируйте чувствительные данные:**
```typescript
// Хорошо
console.log('User logged in:', { userId: user.id });

// Плохо
console.log('User logged in:', { 
  userId: user.id, 
  apiKey: user.openaiKey  // Никогда не логируйте ключи!
});
```

**3. Валидируйте входные данные:**
```typescript
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

// В route handler:
const data = createProjectSchema.parse(request.body);
```

---

## Полезные команды

### Git
```bash
# Статус
git status

# Посмотреть изменения
git diff

# История коммитов
git log --oneline -10

# Откатить изменения в файле
git checkout -- apps/api/src/file.ts

# Отменить последний коммит (но сохранить изменения)
git reset --soft HEAD~1

# Посмотреть, кто изменял файл
git blame apps/api/src/file.ts
```

### PM2
```bash
# Статус всех процессов
pm2 status

# Логи
pm2 logs
pm2 logs api --lines 100

# Перезапуск
pm2 restart all
pm2 restart api

# Остановка
pm2 stop all

# Удаление
pm2 delete all

# Мониторинг в реальном времени
pm2 monit
```

### PostgreSQL
```bash
# Подключение
psql -h localhost -U promptyflow_user -d promptyflow_dev

# В psql:
\l          # Список БД
\dt         # Список таблиц
\d "Table"  # Структура таблицы
\du         # Список пользователей
\q          # Выход

# Бэкап
pg_dump -h localhost -U promptyflow_user promptyflow_prod > backup.sql

# Восстановление
psql -h localhost -U promptyflow_user promptyflow_prod < backup.sql
```

### Nginx
```bash
# Проверка конфигурации
sudo nginx -t

# Перезагрузка
sudo systemctl reload nginx

# Логи
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### System
```bash
# Использование диска
df -h

# Использование памяти
free -h

# Процессы
htop

# Сетевые подключения
netstat -tulpn
```

---

## Заключение

Это руководство охватывает основные сценарии разработки и деплоя. Для более детальной информации обратитесь к:

- **docs/ARCHITECTURE.md** - архитектура проекта
- **docs/API.md** - документация API
- **docs/DATABASE.md** - схема БД и оптимизации
- **docs/DEPLOYMENT.md** - детальный процесс деплоя
- **docs/MONITORING.md** - мониторинг и отладка
- **docs/SECURITY.md** - безопасность данных

**Контакты для вопросов:**
- GitHub Issues: https://github.com/shuldeshoff/Promptozaurus-saas/issues
- Email: support@promptyflow.com

**Последнее обновление:** 05.12.2025
**Версия:** 1.0

