# 🐳 Docker Deployment Guide

Полное руководство по развертыванию PromptyFlow на Windows с использованием Docker.

---

## 📋 Содержание

1. [Требования](#требования)
2. [Установка Docker Desktop](#установка-docker-desktop)
3. [Клонирование проекта](#клонирование-проекта)
4. [Настройка переменных окружения](#настройка-переменных-окружения)
5. [Настройка Google OAuth](#настройка-google-oauth)
6. [Запуск проекта](#запуск-проекта)
7. [Проверка работы](#проверка-работы)
8. [Управление контейнерами](#управление-контейнерами)
9. [Решение проблем](#решение-проблем)
10. [Обновление проекта](#обновление-проекта)

---

## 📦 Требования

### Системные требования:

- **ОС:** Windows 10/11 (64-bit) или Windows Server 2019+
- **RAM:** минимум 4 GB (рекомендуется 8 GB)
- **Диск:** минимум 10 GB свободного места
- **Процессор:** 64-bit процессор с поддержкой виртуализации

### Программное обеспечение:

- **Docker Desktop** для Windows (включает Docker Engine и Docker Compose)
- **Git** для клонирования репозитория
- **Текстовый редактор** (VS Code, Notepad++, или встроенный Блокнот)

---

## 🚀 Установка Docker Desktop

### Шаг 1: Скачивание Docker Desktop

1. Откройте браузер и перейдите на официальный сайт:
   ```
   https://www.docker.com/products/docker-desktop/
   ```

2. Нажмите кнопку **"Download for Windows"**

3. Будет скачан файл `Docker Desktop Installer.exe` (размер ~500 MB)

### Шаг 2: Установка Docker Desktop

1. **Запустите** `Docker Desktop Installer.exe` от имени администратора
   - Правый клик → "Запуск от имени администратора"

2. **Следуйте инструкциям установщика:**
   - Примите лицензионное соглашение
   - Выберите опцию "Use WSL 2 instead of Hyper-V" (рекомендуется)
   - Нажмите "Install"

3. **После установки:**
   - Нажмите "Close and restart" для перезагрузки компьютера
   - Или перезагрузите компьютер вручную

### Шаг 3: Первый запуск Docker Desktop

1. **После перезагрузки** найдите и запустите **Docker Desktop** из меню "Пуск"

2. **При первом запуске:**
   - Docker Desktop попросит принять условия использования
   - Может потребоваться войти в учетную запись Docker Hub (можно пропустить)

3. **Дождитесь запуска:**
   - В системном трее появится иконка Docker (кит)
   - Иконка должна быть **зеленой** (не красной или желтой)
   - Это может занять 1-2 минуты

4. **Проверьте установку:**
   - Откройте **PowerShell** или **Command Prompt**
   - Выполните команду:
     ```powershell
     docker --version
     ```
   - Должно вывестись: `Docker version 24.x.x` или выше
   - Выполните:
     ```powershell
     docker-compose --version
     ```
   - Должно вывестись: `Docker Compose version v2.x.x` или выше

### ⚠️ Важно: WSL 2 Backend

Если Docker Desktop использует WSL 2 (рекомендуется), убедитесь что:

1. **WSL 2 установлен:**
   - Откройте PowerShell от имени администратора
   - Выполните:
     ```powershell
     wsl --version
     ```
   - Если WSL не установлен, выполните:
     ```powershell
     wsl --install
     ```
   - Перезагрузите компьютер

2. **Проверьте версию WSL:**
   ```powershell
   wsl --list --verbose
   ```
   - Должна быть версия 2.0 или выше

---

## 📥 Клонирование проекта

### Шаг 1: Установка Git (если не установлен)

1. Скачайте Git для Windows:
   ```
   https://git-scm.com/download/win
   ```

2. Установите Git, следуя инструкциям установщика
   - Рекомендуется оставить все настройки по умолчанию

3. Проверьте установку:
   ```powershell
   git --version
   ```

### Шаг 2: Клонирование репозитория

1. **Откройте PowerShell** или **Command Prompt**

2. **Перейдите в нужную директорию:**
   ```powershell
   cd C:\Users\YourUsername\Documents
   ```
   (или в любую другую папку, где хотите разместить проект)

3. **Клонируйте репозиторий:**
   ```powershell
   git clone https://github.com/shuldeshoff/Promptozaurus-saas.git
   ```

4. **Перейдите в директорию проекта:**
   ```powershell
   cd Promptozaurus-saas
   ```

5. **Проверьте структуру:**
   ```powershell
   dir
   ```
   Должны быть видны папки: `apps`, `docs`, `packages`, файлы `docker-compose.yml`, `README.md`

---

## ⚙️ Настройка переменных окружения

### Шаг 1: Создание .env файла

1. **В корне проекта** создайте файл `.env`
   - Можно использовать любой текстовый редактор
   - Или в PowerShell:
     ```powershell
     New-Item -Path .env -ItemType File
     ```

2. **Откройте файл `.env`** и скопируйте следующий шаблон:

```env
# Backend API URL (для frontend)
VITE_API_URL=http://localhost:3000

# JWT Secret (сгенерируйте случайную строку минимум 32 символа)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars

# Encryption Key (должен быть минимум 32 символа)
ENCRYPTION_KEY=your-encryption-key-must-be-at-least-32-characters-long

# Google OAuth 2.0 (заполните после настройки OAuth)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# Log Level (опционально)
LOG_LEVEL=info
```

### Шаг 2: Генерация секретных ключей

**Важно:** Используйте **уникальные** секретные ключи для каждого развертывания!

#### Генерация JWT_SECRET:

**Вариант 1: PowerShell (рекомендуется)**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Вариант 2: Онлайн генератор**
- Перейдите на: https://www.random.org/strings/
- Настройки:
  - Length: 64
  - Characters: Letters (uppercase and lowercase) and digits
  - Generate: 1 string
- Скопируйте сгенерированную строку

#### Генерация ENCRYPTION_KEY:

Используйте тот же метод, что и для JWT_SECRET, но убедитесь что длина **минимум 32 символа** (рекомендуется 64).

**Пример сгенерированных ключей:**
```env
JWT_SECRET=aB3dEf9gHiJkLmNoPqRsTuVwXyZ1234567890AbCdEfGhIjKlMnOpQrStUvWxYz
ENCRYPTION_KEY=9xK2mP5qR8sT1vW4yZ7aB0cD3eF6gH9iJ2kL5mN8oP1qR4sT7vW0yZ3aB6cD
```

### Шаг 3: Заполнение .env файла

1. **Замените** `JWT_SECRET` и `ENCRYPTION_KEY` на сгенерированные значения
2. **Пока оставьте** `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET` как есть (настроим в следующем разделе)
3. **Сохраните** файл `.env`

---

## 🔐 Настройка Google OAuth

Для работы аутентификации через Google необходимо настроить OAuth 2.0 приложение.

### Шаг 1: Создание OAuth приложения в Google Cloud Console

1. **Откройте Google Cloud Console:**
   ```
   https://console.cloud.google.com/
   ```

2. **Войдите** в свой Google аккаунт

3. **Создайте новый проект** (если нет существующего):
   - Нажмите на выпадающий список проектов вверху
   - Нажмите "New Project"
   - Введите имя: `PromptyFlow` (или любое другое)
   - Нажмите "Create"

4. **Включите Google+ API:**
   - В меню слева: "APIs & Services" → "Library"
   - Найдите "Google+ API"
   - Нажмите "Enable"

5. **Создайте OAuth 2.0 credentials:**
   - Перейдите: "APIs & Services" → "Credentials"
   - Нажмите "Create Credentials" → "OAuth client ID"
   - Если появится запрос на настройку OAuth consent screen:
     - User Type: "External" (для тестирования)
     - App name: `PromptyFlow`
     - User support email: ваш email
     - Developer contact: ваш email
     - Нажмите "Save and Continue"
     - Scopes: оставьте по умолчанию, нажмите "Save and Continue"
     - Test users: добавьте свой email, нажмите "Save and Continue"
     - Нажмите "Back to Dashboard"

6. **Создайте OAuth Client ID:**
   - Application type: **"Web application"**
   - Name: `PromptyFlow Local`
   - **Authorized redirect URIs:**
     ```
     http://localhost:3000/api/auth/google/callback
     ```
   - Нажмите "Create"

7. **Скопируйте credentials:**
   - Откроется окно с **Client ID** и **Client Secret**
   - **Сохраните их** в безопасном месте (они понадобятся)

### Шаг 2: Добавление credentials в .env

1. **Откройте файл `.env`**

2. **Замените** значения на свои credentials из Google Cloud Console:
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

   **Важно:** Используйте свои собственные credentials, созданные в Google Cloud Console!

3. **Сохраните** файл `.env`

---

## 🚀 Запуск проекта

### Шаг 1: Проверка Docker

Убедитесь что Docker Desktop запущен:
- Иконка Docker в трее должна быть **зеленой**
- Если красная или желтая — дождитесь полного запуска

### Шаг 2: Сборка и запуск контейнеров

1. **Откройте PowerShell** в директории проекта:
   ```powershell
   cd C:\Users\YourUsername\Documents\Promptozaurus-saas
   ```

2. **Запустите Docker Compose:**
   ```powershell
   docker-compose up -d --build
   ```

   **Что происходит:**
   - `-d` — запуск в фоновом режиме (detached)
   - `--build` — сборка образов перед запуском
   - Docker скачает образы PostgreSQL и Redis (если их нет)
   - Соберет образы для backend и frontend
   - Запустит все контейнеры

3. **Первый запуск займет 5-10 минут:**
   - Скачивание базовых образов (~500 MB)
   - Установка зависимостей
   - Сборка приложений
   - Применение миграций БД

4. **Проверьте статус:**
   ```powershell
   docker-compose ps
   ```

   Должны быть запущены 4 контейнера:
   - `promptyflow-postgres` (Status: Up)
   - `promptyflow-redis` (Status: Up)
   - `promptyflow-api` (Status: Up)
   - `promptyflow-web` (Status: Up)

### Шаг 3: Просмотр логов (опционально)

Если нужно посмотреть логи запуска:

```powershell
# Логи всех сервисов
docker-compose logs

# Логи конкретного сервиса
docker-compose logs api
docker-compose logs web
docker-compose logs postgres
```

---

## ✅ Проверка работы

### Шаг 1: Проверка контейнеров

```powershell
docker-compose ps
```

Все контейнеры должны быть в статусе **"Up"**.

### Шаг 2: Проверка API

1. **Откройте браузер** и перейдите:
   ```
   http://localhost:3000/health
   ```

2. **Должен вернуться JSON:**
   ```json
   {
     "status": "ok",
     "timestamp": "2025-01-15T10:30:00.000Z",
     "redis": "connected"
   }
   ```

### Шаг 3: Проверка Frontend

1. **Откройте браузер** и перейдите:
   ```
   http://localhost:5173
   ```

2. **Должна открыться** главная страница PromptyFlow

3. **Попробуйте войти:**
   - Нажмите "Sign in with Google"
   - Должно произойти перенаправление на Google
   - После авторизации вернетесь на сайт

### Шаг 4: Проверка базы данных

```powershell
# Подключение к PostgreSQL
docker-compose exec postgres psql -U promptyflow -d promptyflow

# В консоли PostgreSQL выполните:
\dt

# Должны быть видны таблицы: users, projects, templates, и т.д.

# Выход:
\q
```

---

## 💾 Работа с базой данных

### Подключение к PostgreSQL

**Интерактивное подключение:**
```powershell
docker-compose exec postgres psql -U promptyflow -d promptyflow
```

После подключения вы окажетесь в консоли PostgreSQL (`promptyflow=#`).

### Полезные команды PostgreSQL

**Просмотр структуры базы данных:**
```sql
-- Список всех таблиц
\dt

-- Детальная информация о таблице
\d users
\d projects
\d templates

-- Список всех баз данных
\l

-- Список всех пользователей
\du

-- Размер базы данных
SELECT pg_size_pretty(pg_database_size('promptyflow'));

-- Размер всех таблиц
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Просмотр данных:**
```sql
-- Количество записей в таблицах
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM projects;
SELECT COUNT(*) FROM templates;

-- Просмотр данных (первые 10 записей)
SELECT * FROM users LIMIT 10;
SELECT * FROM projects LIMIT 10;

-- Поиск по условию
SELECT * FROM users WHERE email = 'user@example.com';
SELECT * FROM projects WHERE "user_id" = 'user-uuid-here';
```

**Выход из консоли PostgreSQL:**
```sql
\q
```

### Выполнение SQL скриптов

#### Вариант 1: Выполнение SQL команды напрямую

```powershell
# Выполнить одну SQL команду
docker-compose exec -T postgres psql -U promptyflow -d promptyflow -c "SELECT COUNT(*) FROM users;"

# Выполнить несколько команд
docker-compose exec -T postgres psql -U promptyflow -d promptyflow -c "SELECT * FROM users; SELECT * FROM projects;"
```

#### Вариант 2: Загрузка SQL скрипта из файла

**Шаг 1:** Создайте SQL файл на вашем компьютере, например `C:\Users\YourName\Documents\my_script.sql`:

```sql
-- Пример SQL скрипта
SELECT 
    u.email,
    COUNT(p.id) as project_count
FROM users u
LEFT JOIN projects p ON p.user_id = u.id
GROUP BY u.id, u.email
ORDER BY project_count DESC;
```

**Шаг 2:** Скопируйте файл в контейнер и выполните:

```powershell
# Копирование файла в контейнер
docker cp C:\Users\YourName\Documents\my_script.sql promptyflow-postgres:/tmp/my_script.sql

# Выполнение скрипта
docker-compose exec postgres psql -U promptyflow -d promptyflow -f /tmp/my_script.sql
```

**Альтернативный способ (без копирования в контейнер):**

Если ваш SQL файл находится в директории проекта:

```powershell
# Выполнение SQL файла напрямую (файл должен быть доступен из контейнера)
docker-compose exec -T postgres psql -U promptyflow -d promptyflow < C:\Users\YourName\Documents\my_script.sql
```

**Или через stdin:**

```powershell
Get-Content C:\Users\YourName\Documents\my_script.sql | docker-compose exec -T postgres psql -U promptyflow -d promptyflow
```

#### Вариант 3: Выполнение SQL из PowerShell скрипта

Создайте файл `run-sql.ps1`:

```powershell
# run-sql.ps1
param(
    [Parameter(Mandatory=$true)]
    [string]$SqlFile
)

if (-not (Test-Path $SqlFile)) {
    Write-Host "Файл не найден: $SqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "Выполнение SQL скрипта: $SqlFile" -ForegroundColor Green
Get-Content $SqlFile | docker-compose exec -T postgres psql -U promptyflow -d promptyflow

if ($LASTEXITCODE -eq 0) {
    Write-Host "SQL скрипт выполнен успешно!" -ForegroundColor Green
} else {
    Write-Host "Ошибка при выполнении SQL скрипта!" -ForegroundColor Red
}
```

**Использование:**
```powershell
.\run-sql.ps1 -SqlFile "C:\Users\YourName\Documents\my_script.sql"
```

### Экспорт данных из базы данных

**Экспорт всей базы данных (dump):**
```powershell
# Создать полный backup базы данных
docker-compose exec postgres pg_dump -U promptyflow promptyflow > backup.sql

# Или с форматированием
docker-compose exec postgres pg_dump -U promptyflow -F c promptyflow > backup.dump
```

**Экспорт конкретной таблицы:**
```powershell
# Экспорт таблицы users
docker-compose exec postgres pg_dump -U promptyflow -t users promptyflow > users_backup.sql

# Экспорт нескольких таблиц
docker-compose exec postgres pg_dump -U promptyflow -t users -t projects promptyflow > tables_backup.sql
```

**Экспорт только структуры (без данных):**
```powershell
docker-compose exec postgres pg_dump -U promptyflow -s promptyflow > schema_only.sql
```

**Экспорт только данных (без структуры):**
```powershell
docker-compose exec postgres pg_dump -U promptyflow -a promptyflow > data_only.sql
```

### Импорт данных в базу данных

**Восстановление из SQL файла:**
```powershell
# Импорт SQL файла
Get-Content backup.sql | docker-compose exec -T postgres psql -U promptyflow -d promptyflow

# Или напрямую
docker-compose exec -T postgres psql -U promptyflow -d promptyflow < backup.sql
```

**Восстановление из dump файла:**
```powershell
# Копирование dump файла в контейнер
docker cp backup.dump promptyflow-postgres:/tmp/backup.dump

# Восстановление
docker-compose exec postgres pg_restore -U promptyflow -d promptyflow -c /tmp/backup.dump
```

**Восстановление конкретной таблицы:**
```powershell
Get-Content users_backup.sql | docker-compose exec -T postgres psql -U promptyflow -d promptyflow
```

### Полезные SQL запросы для PromptyFlow

**Статистика пользователей:**
```sql
-- Количество пользователей
SELECT COUNT(*) as total_users FROM users;

-- Пользователи с количеством проектов
SELECT 
    u.email,
    u.name,
    COUNT(p.id) as project_count,
    u.created_at
FROM users u
LEFT JOIN projects p ON p.user_id = u.id
GROUP BY u.id, u.email, u.name, u.created_at
ORDER BY project_count DESC;
```

**Статистика проектов:**
```sql
-- Общее количество проектов
SELECT COUNT(*) as total_projects FROM projects;

-- Размер проектов (примерно, если хранится в JSON)
SELECT 
    id,
    name,
    pg_column_size(data) as size_bytes,
    created_at
FROM projects
ORDER BY size_bytes DESC
LIMIT 10;
```

**Статистика шаблонов:**
```sql
-- Количество шаблонов
SELECT COUNT(*) as total_templates FROM templates;

-- Популярные шаблоны (по использованию)
SELECT 
    name,
    usage_count,
    created_at
FROM templates
ORDER BY usage_count DESC
LIMIT 10;
```

**Очистка данных (осторожно!):**
```sql
-- Удалить все проекты (НЕОБРАТИМО!)
-- DELETE FROM projects;

-- Удалить все шаблоны (НЕОБРАТИМО!)
-- DELETE FROM templates;

-- Удалить всех пользователей кроме админа (НЕОБРАТИМО!)
-- DELETE FROM users WHERE email != 'admin@example.com';
```

### Работа с миграциями Prisma

**Просмотр примененных миграций:**
```powershell
docker-compose exec api npx prisma migrate status
```

**Применение новых миграций:**
```powershell
docker-compose exec api npx prisma migrate deploy
```

**Создание новой миграции (если нужно):**
```powershell
# Войдите в контейнер API
docker-compose exec api sh

# Внутри контейнера
npx prisma migrate dev --name your_migration_name
```

**Просмотр схемы базы данных:**
```powershell
docker-compose exec api npx prisma db pull
```

**Открыть Prisma Studio (GUI для БД):**
```powershell
# Запустить Prisma Studio в контейнере
docker-compose exec api npx prisma studio --hostname 0.0.0.0 --port 5555
```

**Примечание:** Для доступа к Prisma Studio из браузера нужно добавить проброс порта в `docker-compose.yml`:
```yaml
api:
  ports:
    - "3000:3000"
    - "5555:5555"  # Добавить эту строку для Prisma Studio
```

Затем откройте в браузере: `http://localhost:5555`

---

## 🛠️ Управление контейнерами

### Остановка контейнеров

```powershell
docker-compose stop
```

Контейнеры остановятся, но данные сохранятся.

### Запуск остановленных контейнеров

```powershell
docker-compose start
```

### Полная остановка и удаление контейнеров

```powershell
docker-compose down
```

**Внимание:** Это удалит контейнеры, но **НЕ удалит** данные (volumes сохраняются).

### Удаление контейнеров и данных

```powershell
docker-compose down -v
```

**Внимание:** Это **удалит все данные** из базы данных и Redis!

### Перезапуск конкретного сервиса

```powershell
docker-compose restart api
docker-compose restart web
```

### Просмотр логов в реальном времени

```powershell
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f api
```

### Выполнение команд внутри контейнера

```powershell
# Backend контейнер
docker-compose exec api sh

# PostgreSQL контейнер
docker-compose exec postgres psql -U promptyflow -d promptyflow

# Redis контейнер
docker-compose exec redis redis-cli
```

---

## 🔧 Решение проблем

### Проблема 1: Docker Desktop не запускается

**Симптомы:**
- Иконка Docker красная
- Ошибка "Docker Desktop failed to start"

**Решения:**

1. **Проверьте WSL 2:**
   ```powershell
   wsl --version
   ```
   Если не установлен:
   ```powershell
   wsl --install
   ```
   Перезагрузите компьютер.

2. **Перезапустите Docker Desktop:**
   - Правый клик на иконку Docker → "Restart Docker Desktop"

3. **Проверьте виртуализацию:**
   - Убедитесь что в BIOS включена виртуализация (Intel VT-x или AMD-V)

### Проблема 2: Порт уже занят

**Симптомы:**
```
Error: bind: address already in use
```

**Решения:**

1. **Измените порты в `docker-compose.yml`:**
   ```yaml
   ports:
     - "3001:3000"  # Вместо 3000:3000
     - "5174:80"    # Вместо 5173:80
   ```

2. **Или найдите и остановите процесс:**
   ```powershell
   # Найти процесс на порту 3000
   netstat -ano | findstr :3000
   
   # Остановить процесс (замените PID на найденный)
   taskkill /PID <PID> /F
   ```

### Проблема 3: Ошибка подключения к базе данных

**Симптомы:**
```
Error: connect ECONNREFUSED postgres:5432
```

**Решения:**

1. **Проверьте что PostgreSQL контейнер запущен:**
   ```powershell
   docker-compose ps
   ```

2. **Проверьте логи PostgreSQL:**
   ```powershell
   docker-compose logs postgres
   ```

3. **Перезапустите контейнеры:**
   ```powershell
   docker-compose restart postgres
   docker-compose restart api
   ```

### Проблема 4: Ошибка "Prisma migrate deploy"

**Симптомы:**
```
Error: P3005: Database schema is not empty
```

**Решения:**

1. **Примените миграции вручную:**
   ```powershell
   docker-compose exec api npx prisma migrate deploy
   ```

2. **Или сбросьте базу данных (удалит все данные!):**
   ```powershell
   docker-compose down -v
   docker-compose up -d
   ```

### Проблема 5: Frontend не подключается к API

**Симптомы:**
- Frontend открывается, но запросы к API не работают
- Ошибки CORS в консоли браузера

**Решения:**

1. **Проверьте переменную `VITE_API_URL` в `.env`:**
   ```env
   VITE_API_URL=http://localhost:3000
   ```

2. **Пересоберите frontend:**
   ```powershell
   docker-compose up -d --build web
   ```

3. **Проверьте что API доступен:**
   ```
   http://localhost:3000/health
   ```

### Проблема 6: Google OAuth не работает

**Симптомы:**
- При нажатии "Sign in with Google" ошибка
- "redirect_uri_mismatch"

**Решения:**

1. **Проверьте `GOOGLE_CALLBACK_URL` в `.env`:**
   ```env
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
   ```

2. **Проверьте настройки в Google Cloud Console:**
   - Authorized redirect URIs должен содержать:
     ```
     http://localhost:3000/api/auth/google/callback
     ```

3. **Убедитесь что OAuth consent screen настроен:**
   - В Google Cloud Console: "APIs & Services" → "OAuth consent screen"
   - Должен быть выбран тип "External" и добавлен ваш email в test users

### Проблема 7: Медленная работа

**Симптомы:**
- Долгая загрузка страниц
- Медленные запросы к API

**Решения:**

1. **Выделите больше ресурсов Docker:**
   - Docker Desktop → Settings → Resources
   - Увеличьте Memory до 4-8 GB
   - Увеличьте CPUs до 2-4
   - Нажмите "Apply & Restart"

2. **Проверьте использование ресурсов:**
   ```powershell
   docker stats
   ```

---

## 🔄 Обновление проекта

### Обновление кода из Git

1. **Остановите контейнеры:**
   ```powershell
   docker-compose down
   ```

2. **Обновите код:**
   ```powershell
   git pull origin main
   ```

3. **Пересоберите и запустите:**
   ```powershell
   docker-compose up -d --build
   ```

### Обновление миграций БД

Если были добавлены новые миграции:

```powershell
docker-compose exec api npx prisma migrate deploy
```

### Обновление зависимостей

Если изменились `package.json` файлы:

```powershell
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 📊 Мониторинг и отладка

### Просмотр использования ресурсов

```powershell
docker stats
```

### Просмотр логов всех сервисов

```powershell
docker-compose logs -f
```

### Просмотр логов конкретного сервиса

```powershell
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Подключение к базе данных

**Быстрое подключение:**
```powershell
docker-compose exec postgres psql -U promptyflow -d promptyflow
```

**📖 Подробная инструкция:** См. раздел [Работа с базой данных](#-работа-с-базой-данных) выше.

**Краткая справка:**
```sql
-- Список таблиц
\dt

-- Список пользователей
SELECT * FROM users;

-- Размер базы данных
SELECT pg_size_pretty(pg_database_size('promptyflow'));

-- Выполнение SQL скрипта из файла
-- (см. раздел "Работа с базой данных" для подробностей)

-- Выход
\q
```

### Подключение к Redis

```powershell
docker-compose exec redis redis-cli
```

**Полезные команды Redis:**
```redis
# Список всех ключей
KEYS *

# Получить значение
GET ai:models:openai

# Статистика
INFO stats

# Выход
exit
```

---

## 🗑️ Полное удаление проекта

Если нужно полностью удалить проект и все данные:

1. **Остановите и удалите контейнеры:**
   ```powershell
   docker-compose down -v
   ```

2. **Удалите образы:**
   ```powershell
   docker rmi promptyflow-saas-api promptyflow-saas-web
   ```

3. **Удалите директорию проекта:**
   ```powershell
   cd ..
   Remove-Item -Recurse -Force Promptozaurus-saas
   ```

---

## 📝 Дополнительная информация

### Структура Docker Compose

Проект использует 4 сервиса:

1. **postgres** — PostgreSQL 16 база данных
2. **redis** — Redis 7 кэш
3. **api** — Backend API (Fastify + TypeScript)
4. **web** — Frontend (React + Vite, обслуживается через Nginx)

### Порты

- **3000** — Backend API
- **5173** — Frontend (Nginx)
- **5432** — PostgreSQL (для внешнего доступа, опционально)
- **6379** — Redis (для внешнего доступа, опционально)

### Volumes (данные)

- `postgres_data` — данные PostgreSQL
- `redis_data` — данные Redis

Данные сохраняются между перезапусками контейнеров.

### Сеть

Все контейнеры находятся в одной Docker сети `promptyflow-network` и могут обращаться друг к другу по именам сервисов:
- `postgres` (вместо localhost)
- `redis` (вместо localhost)
- `api` (вместо localhost)
- `web` (вместо localhost)

---

## 🆘 Получение помощи

Если возникли проблемы:

1. **Проверьте логи:**
   ```powershell
   docker-compose logs
   ```

2. **Проверьте статус контейнеров:**
   ```powershell
   docker-compose ps
   ```

3. **Проверьте документацию:**
   - [Docker Desktop Documentation](https://docs.docker.com/desktop/)
   - [Docker Compose Documentation](https://docs.docker.com/compose/)

4. **Создайте issue на GitHub:**
   - Укажите версию Docker
   - Приложите логи ошибок
   - Опишите шаги для воспроизведения

---

## ✅ Чеклист первого запуска

- [ ] Docker Desktop установлен и запущен
- [ ] Git установлен
- [ ] Проект склонирован из репозитория
- [ ] Файл `.env` создан и заполнен
- [ ] `JWT_SECRET` и `ENCRYPTION_KEY` сгенерированы
- [ ] Google OAuth настроен в Google Cloud Console
- [ ] `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET` добавлены в `.env`
- [ ] `docker-compose up -d --build` выполнен успешно
- [ ] Все контейнеры в статусе "Up"
- [ ] API доступен по `http://localhost:3000/health`
- [ ] Frontend доступен по `http://localhost:5173`
- [ ] Вход через Google работает

---

**Готово! 🎉 Проект должен быть полностью развернут и готов к использованию.**

