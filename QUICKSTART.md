# 🚀 Быстрый старт

## Установка и запуск

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка окружения

**Требуется:**
- Node.js >= 20.0.0
- PostgreSQL >= 14
- Redis >= 6.0

**Запуск сервисов (macOS):**
```bash
brew services start postgresql@14
brew services start redis
```

### 3. Запуск приложения

**Автоматический запуск (рекомендуется):**
```bash
npm start
# или
./start-dev.sh
```

Скрипт автоматически:
- ✅ Проверит Node.js, PostgreSQL, Redis
- ✅ Создаст БД `promptozaurus_dev`
- ✅ Применит Prisma миграции
- ✅ Запустит Frontend (http://localhost:5173)
- ✅ Запустит Backend (http://localhost:3000)

**Ручной запуск:**
```bash
# Backend (терминал 1)
cd apps/api
npm run dev

# Frontend (терминал 2)
cd apps/web
npm run dev
```

## 🔧 Настройка

### Backend (.env в apps/api/)
Уже настроен для локальной разработки:
- PostgreSQL: `localhost:5432/promptozaurus_dev`
- Redis: `localhost:6379`
- API: `http://localhost:3000`

### Frontend (.env в apps/web/)
```
VITE_API_URL=http://localhost:3000
```

### Google OAuth (опционально)
Для тестирования аутентификации обновите в `apps/api/.env`:
```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

## 📋 Полезные команды

```bash
# Запуск
npm start                 # Полный запуск с проверками
npm run dev              # Только dev-серверы
npm run dev:api          # Только backend
npm run dev:web          # Только frontend

# Тестирование
npm test                 # Все тесты (97 passed)
npm run test --workspace=apps/api  # Backend тесты

# Сборка
npm run build            # Prod сборка всего
npm run build:api        # Backend сборка
npm run build:web        # Frontend сборка

# Качество кода
npm run lint             # ESLint
npm run format           # Prettier
```

## 🌐 Endpoints

После запуска доступны:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health
- **API Docs:** [docs/API.md](docs/API.md)

## 🐛 Troubleshooting

**Backend не запускается:**
```bash
# Проверьте PostgreSQL
psql -U postgres -c "SELECT 1"

# Проверьте Redis
redis-cli ping

# Создайте БД вручную
psql -U postgres -c "CREATE DATABASE promptozaurus_dev;"
```

**Frontend не видит API:**
- Проверьте `apps/web/.env`: `VITE_API_URL=http://localhost:3000`
- Перезапустите frontend после изменения .env

**Ошибка миграций:**
```bash
cd apps/api
npx prisma migrate reset  # ВНИМАНИЕ: удалит данные!
npx prisma migrate deploy
```

## 📚 Дополнительная документация

- [Основной README](README.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [SaaS Roadmap](docs/SAAS_ROADMAP.md)

## ✅ Текущий статус

- ✅ **97 тестов** проходят (100%)
- ✅ PostgreSQL настроен
- ✅ Redis интегрирован
- ✅ JWT аутентификация
- ✅ Google OAuth готов
- ✅ API ключи с шифрованием
- ✅ AI провайдеры (OpenAI, Anthropic, Gemini)
- ✅ Темная тема
- ✅ Английский + Русский
- ✅ Responsive дизайн

**Проект готов к разработке!** 🎉

