# ⚡ PromptyFlow SaaS

> Мощный конструктор промптов для AI-моделей с трехуровневой структурой контекста

[![Version](https://img.shields.io/badge/version-0.8-blue.svg)](https://github.com/yourusername/promptyflow-saas)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Website](https://img.shields.io/badge/website-promptyflow.com-brightgreen.svg)](https://promptyflow.com)

---

## 📖 О проекте

**PromptyFlow** — это приложение для создания, организации и управления сложными промптами для работы с AI-моделями. Проект находится в процессе трансформации из desktop Electron-приложения в полноценный многопользовательский SaaS-сервис.

### Ключевые возможности

✅ **Трехуровневая структура контекста** (Блок → Элемент → Подэлемент)  
✅ **Визуальный выбор контекстов** с drag-select интерфейсом  
✅ **Интеграция с 5 AI-провайдерами** (OpenAI, Anthropic, Gemini, Grok, OpenRouter)  
✅ **Библиотека шаблонов промптов** для повторного использования  
✅ **Компиляция промптов** с плейсхолдерами и XML-тегами  
✅ **Двуязычный интерфейс** (английский/русский)  
✅ **Темная тема** с современным дизайном  
✅ **Разделение текста** на части по различным критериям  
✅ **Экспорт/импорт проектов** в JSON формате  

---

## 🚀 Быстрый старт

### SaaS версия (в разработке)

**Требования:**
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

**Установка для разработки:**

```bash
# Клонировать репозиторий
git clone https://github.com/yourusername/promptyflow-saas.git
cd promptyflow-saas

# Установить зависимости
npm install

# Настроить environment variables
cd apps/api
cp .env.example .env
# Заполните DATABASE_URL, REDIS_URL, GOOGLE_CLIENT_ID и др.

# Применить миграции базы данных
npx prisma migrate dev

# Запустить backend
npm run dev

# В новом терминале: запустить frontend
cd apps/web
npm run dev
```

**Доступные команды:**

```bash
# Root команды
npm run dev          # Запуск всех сервисов
npm run build        # Сборка всех приложений
npm test             # Запуск всех тестов

# Backend (apps/api)
npm run dev          # Режим разработки с hot reload
npm run build        # Сборка TypeScript
npm test             # Запуск тестов
npm run lint         # Проверка линтером

# Frontend (apps/web)
npm run dev          # Vite dev server
npm run build        # Production сборка
npm run preview      # Предпросмотр production сборки
```

### Desktop версия (legacy)

Desktop версия на Electron находится в папке `originals/`.

**Для запуска:**

```bash
cd originals/Promptozaurus-v-0-7-en-ru
npm install
npm run dev
```

---

## 📁 Структура проекта

```
Promptozaurus-saas/
├── apps/
│   ├── web/                   # Frontend (React + Vite)
│   │   ├── src/
│   │   │   ├── components/    # React компоненты
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── pages/         # Страницы (Landing, Dashboard)
│   │   │   ├── store/         # Zustand stores
│   │   │   ├── lib/           # Утилиты (API, i18n, queryClient)
│   │   │   └── locales/       # Переводы (EN/RU)
│   │   └── vercel.json        # Конфигурация Vercel
│   │
│   └── api/                   # Backend (Fastify + TypeScript)
│       ├── src/
│       │   ├── routes/        # API endpoints
│       │   ├── services/      # Бизнес-логика
│       │   ├── providers/     # AI провайдеры
│       │   ├── middleware/    # Middleware (auth, errors)
│       │   └── lib/           # Утилиты (prisma, redis)
│       ├── prisma/            # Схема БД и миграции
│       └── railway.json       # Конфигурация Railway
│
├── packages/
│   └── shared/                # Общие типы и схемы (Zod)
│
├── docs/                      # Документация
│   ├── PROJECT_ANALYSIS.md    # Анализ проекта
│   ├── SAAS_ROADMAP.md        # Roadmap разработки
│   ├── DEPLOYMENT.md          # Гайд по deployment
│   └── MONITORING.md          # Гайд по мониторингу
│
├── originals/                 # Оригинальная Electron версия
│   └── Promptozaurus-v-0-7-en-ru/
│
└── .github/
    └── workflows/             # GitHub Actions CI/CD
```

---

## 🎯 Функциональность

### 1. Работа с контекстом

Создавайте организованную структуру данных для промптов:

```
Проект
└── Контекстный блок "API Documentation"
    ├── Элемент "GET /users"
    │   ├── Подэлемент "Request parameters"
    │   └── Подэлемент "Response example"
    └── Элемент "POST /users"
        └── Подэлемент "Request body"
```

**Возможности:**
- Создание неограниченного количества уровней
- Автоматический подсчет символов на каждом уровне
- Разделение больших текстов на части
- Выбор нужных элементов через чекбоксы

### 2. Промпт-блоки

Создавайте шаблоны промптов с плейсхолдерами:

```
Проанализируй следующую API документацию:

{{context}}

Ответь на вопросы:
1. Какие методы представлены?
2. Какие параметры они принимают?
3. Какие ответы возвращают?
```

**Возможности:**
- Плейсхолдер `{{context}}` для вставки контекстных данных
- Компиляция с XML-тегами для структурирования
- Копирование результата в буфер обмена
- Отправка напрямую через API AI-провайдеров

### 3. Интеграция с AI

**Поддерживаемые провайдеры:**
- **OpenAI** — GPT-4, GPT-3.5 Turbo
- **Anthropic** — Claude 3 (Opus, Sonnet, Haiku)
- **Google Gemini** — Gemini Pro, Ultra
- **X.AI** — Grok модели
- **OpenRouter** — 100+ моделей

**Возможности:**
- Безопасное хранение API-ключей
- Тестирование подключений
- Автоматическая загрузка списка моделей
- Отправка промптов и получение ответов

### 4. Библиотека шаблонов

Сохраняйте часто используемые шаблоны промптов и используйте их в любых проектах.

---

## 🗺️ Roadmap к SaaS

Проект находится в активной разработке полноценного веб-сервиса:

### ✅ Завершенные этапы

**ЭТАП 0: Инфраструктура** ✅
- Monorepository (apps/web, apps/api, packages/shared)
- Frontend: Vite + React + TypeScript + Tailwind CSS
- Backend: Fastify + TypeScript + Prisma + PostgreSQL
- Redis для кэширования

**ЭТАП 1: Аутентификация** ✅
- Google OAuth 2.0
- JWT tokens + refresh mechanism
- User profiles и session management

**ЭТАП 2: API для проектов** ✅
- Full CRUD для проектов
- Лимит 10 проектов (free plan)
- Project sharing между пользователями
- Import/Export JSON
- Auto-save с debounce
- Offline mode с localStorage

**ЭТАП 3: Контекст и промпты** ✅
- 3-level structure (Block → Item → SubItem)
- JSONB хранение в PostgreSQL
- Character counters с правильным подсчетом (без дублирования)
- Prompt compilation с XML tags
- Split text по различным критериям
- Copy to clipboard

**ЭТАП 4: Библиотека шаблонов** ✅
- CRUD для templates
- Full-text search (PostgreSQL GIN indexes)
- Preview и quick use
- Auto-save в контекст из AI ответов

**ЭТАП 5: AI Integration** ✅
- Secure API keys (AES-256-GCM encryption)
- 5 провайдеров: OpenAI, Anthropic, Gemini, Grok, OpenRouter
- Dynamic model loading (100+ моделей)
- Models cache (Redis)
- Support для GPT-5.1 и Claude 4/4.5
- AI response modal с сохранением в context
- Unit tests (70+ tests passing)

**ЭТАП 6: UI/UX оптимизация** ✅
- Responsive design (mobile-first)
- Performance optimization (FTS search 1-11ms для тысяч промптов)
- Error boundaries + skeleton loaders
- Welcome modal для новых пользователей
- Project size limits (5M блок / 10M проект)
- Improved project cards (3-line layout)
- Auto-naming для AI моделей
- Debounced inputs (предотвращение cursor jump)

### ✅ В продакшене

**ЭТАП 7: Deployment** ✅
- Frontend: https://promptyflow.com (Nginx + VPS)
- Backend: Node.js + PM2 на VPS
- PostgreSQL (локальный сервер)
- SSL сертификаты (Let's Encrypt)
- Автоматический deployment через SSH

### 📅 Следующие этапы

**ЭТАП 8: Финальное тестирование** ⏳
- Integration тесты (>80% coverage backend)
- E2E тесты (full user flows)
- Load testing (Artillery/k6)
- Security audit (OWASP Top 10)

**Post-launch (v1.1-2.0):**
- Платные планы (unlimited проекты)
- Sharing и коллаборация
- Marketplace шаблонов
- AI-ассистент для создания промптов

**Подробнее:** см. [SAAS_ROADMAP.md](docs/SAAS_ROADMAP.md)

---

## 📚 Документация

### Для разработчиков:
- **[PROJECT_ANALYSIS.md](docs/PROJECT_ANALYSIS.md)** — Полный анализ проекта
- **[SAAS_ROADMAP.md](docs/SAAS_ROADMAP.md)** — Roadmap трансформации в SaaS (7 этапов)
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** — Полный гайд по deployment (Vercel + Railway + Supabase)
- **[MONITORING.md](docs/MONITORING.md)** — Гайд по мониторингу и логированию

### Для пользователей:
- **[help-en.md](originals/help-en.md)** — User guide (English)
- **[help-ru.md](originals/help-ru.md)** — Руководство пользователя (Русский)

### Архивные документы (legacy):
- **[PROMPTOZAURUS_SAAS_SPECIFICATION.md](originals/PROMPTOZAURUS_SAAS_SPECIFICATION.md)** — Детальная спецификация SaaS (1628 строк)
- **[TECHNICAL_SPECIFICATION.md](originals/TECHNICAL_SPECIFICATION.md)** — Технические требования

---

## 🛠️ Технологический стек

### SaaS версия (текущая разработка)

**Frontend:**
- React 18 + Vite 5
- TypeScript 5
- Tailwind CSS 3.4
- React Query (TanStack Query) - server state
- Zustand - client state
- i18next - интернационализация

**Backend:**
- Node.js 18+ + Fastify 4
- TypeScript 5
- Prisma ORM 5
- PostgreSQL 14+
- Redis 7+
- Winston - логирование

**Authentication:**
- Google OAuth 2.0
- JWT + Refresh tokens
- Passport.js

**Security:**
- AES-256-GCM encryption для API keys
- Helmet.js для security headers
- CORS configuration
- Rate limiting

**Deployment:**
- Vercel (frontend)
- Railway (backend)
- Supabase (PostgreSQL)
- Upstash (Redis)

**CI/CD:**
- GitHub Actions
- Automated tests
- Automated deployment

### Desktop версия (legacy)
- React 18.3, Tailwind CSS 3.4, i18next
- Electron 25.9
- Webpack 5, Babel, PostCSS
- keytar (OS-level key storage)

---

## 🤝 Участие в разработке

Проект находится в стадии активной разработки. Contributions are welcome!

### Как внести вклад:

1. Fork репозиторий
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

### Правила разработки:

- ✅ Сначала реализуем → потом тестируем → потом коммитим
- ✅ Production-ready код (без упрощений)
- ✅ Следуем принципам из [user rules](#)
- ✅ Все новые функции должны иметь тесты

---

## 📊 Статистика проекта

### SaaS версия:
- **Backend:**
  - API endpoints: 40+
  - Services: 8 файлов
  - AI providers: 5 классов
  - Unit tests: 70+ (100% passing)
  - Строк кода: ~3500

- **Frontend:**
  - React компоненты: 30+ файлов
  - Custom hooks: 12 файлов
  - Pages: 3 (Landing, Dashboard, Error)
  - Stores: 3 (Auth, Offline, Projects)
  - Строк кода: ~4000

- **Shared:**
  - Zod schemas: 15+
  - TypeScript types: 50+

- **Документация:**
  - DEPLOYMENT.md: 400+ строк
  - MONITORING.md: 500+ строк
  - SAAS_ROADMAP.md: 716 строк
  - Всего: 2000+ строк документации

**Общий объем:** ~10,000+ строк кода + 2000+ строк документации

### Desktop версия (legacy):
- Строк кода: ~5000+
- Спецификация: 1628 строк

---

## 📄 Лицензия

ISC License

---

## 🙏 Благодарности

- [React](https://reactjs.org/) — UI библиотека
- [Electron](https://www.electronjs.org/) — Desktop framework
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- [i18next](https://www.i18next.com/) — Интернационализация
- Все AI-провайдеры за отличные API

---

## 📞 Контакты

**Автор:** [Ваше имя]  
**Email:** your.email@example.com  
**GitHub:** [@yourusername](https://github.com/yourusername)

---

**Создано с ❤️ для работы с AI-моделями**

