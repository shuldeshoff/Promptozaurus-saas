# Setup инструкции - Этап 0

## Установка зависимостей

Зависимости уже установлены через npm workspaces.

## Установка PostgreSQL (без Docker)

### macOS (через Homebrew)

```bash
# Установка PostgreSQL
brew install postgresql@15

# Запуск сервиса
brew services start postgresql@15

# Создание базы данных
createdb promptozaurus_dev

# Создание пользователя (если нужно)
psql postgres
# В psql:
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE promptozaurus_dev TO postgres;
\q
```

### Linux (Ubuntu/Debian)

```bash
# Установка
sudo apt update
sudo apt install postgresql postgresql-contrib

# Запуск сервиса
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Создание базы данных
sudo -u postgres createdb promptozaurus_dev

# Создание пользователя
sudo -u postgres psql
# В psql:
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE promptozaurus_dev TO postgres;
\q
```

### Windows

1. Скачать установщик: https://www.postgresql.org/download/windows/
2. Установить PostgreSQL 15
3. Запустить pgAdmin 4
4. Создать базу данных `promptozaurus_dev`

## Установка Redis (без Docker)

### macOS (через Homebrew)

```bash
# Установка Redis
brew install redis

# Запуск сервиса
brew services start redis

# Проверка
redis-cli ping
# Должен вернуть: PONG
```

### Linux (Ubuntu/Debian)

```bash
# Установка
sudo apt update
sudo apt install redis-server

# Запуск сервиса
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Проверка
redis-cli ping
# Должен вернуть: PONG
```

### Windows

1. Скачать Redis для Windows: https://github.com/microsoftarchive/redis/releases
2. Установить и запустить redis-server.exe

## Настройка переменных окружения

```bash
# Скопировать пример
cp .env.example .env.local

# Заполнить переменные (основные уже настроены для локальной разработки)
```

## Инициализация Prisma

```bash
# Генерация Prisma Client
npm run prisma:generate --workspace=apps/api

# Создание миграций
npm run prisma:migrate --workspace=apps/api

# (Опционально) Открыть Prisma Studio
npm run prisma:studio --workspace=apps/api
```

## Запуск проекта

```bash
# Запуск всего (Frontend + Backend)
npm run dev

# Или отдельно:
npm run dev:web   # Frontend на http://localhost:5173
npm run dev:api   # Backend на http://localhost:3000
```

## Проверка

1. **Backend**: http://localhost:3000
   - Должен вернуть JSON с информацией об API

2. **Frontend**: http://localhost:5173
   - Должен открыться интерфейс приложения

3. **PostgreSQL**:
   ```bash
   psql -U postgres -d promptozaurus_dev -c "SELECT version();"
   ```

4. **Redis**:
   ```bash
   redis-cli ping
   ```

## Troubleshooting

### PostgreSQL не запускается

```bash
# macOS
brew services restart postgresql@15

# Linux
sudo systemctl restart postgresql
```

### Redis не запускается

```bash
# macOS
brew services restart redis

# Linux
sudo systemctl restart redis-server
```

### Проблемы с Prisma

```bash
# Очистить и пересоздать
rm -rf node_modules apps/api/node_modules
npm install
npm run prisma:generate --workspace=apps/api
```

---

**Этап 0 завершен!** ✅

