# 🗄️ База данных

## Обзор

PromptyFlow использует **PostgreSQL 14+** как основную СУБД с поддержкой:
- JSONB для хранения структурированных данных
- Full-Text Search (GIN индексы) для быстрого поиска
- UUID для первичных ключей
- Автоматические timestamps (created_at, updated_at)
- Каскадное удаление связанных записей
- AES-256-GCM шифрование чувствительных данных

**ORM:** Prisma 5.x для TypeScript type-safety и миграций

---

## 📊 Схема базы данных

### Таблицы

1. **users** - пользователи (Google OAuth)
2. **projects** - проекты с контекстом и промптами
3. **project_shares** - шеринг проектов между пользователями
4. **templates** - библиотека промптов
5. **api_keys** - API ключи AI провайдеров (зашифрованы)
6. **models_cache** - кеш списков моделей AI провайдеров

---

## 📋 Детальное описание таблиц

### 1. users

Пользователи приложения (авторизация через Google OAuth).

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    language VARCHAR(10) DEFAULT 'en', -- en | ru
    theme VARCHAR(10) DEFAULT 'dark',  -- dark | light
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_email ON users(email);
```

**Поля:**
- `id` - UUID, первичный ключ
- `google_id` - ID пользователя из Google OAuth (уникальный)
- `email` - Email пользователя (уникальный)
- `name` - Имя пользователя
- `avatar_url` - URL аватара из Google
- `language` - Язык интерфейса (en/ru)
- `theme` - Тема интерфейса (dark/light)
- `created_at` - Дата создания
- `updated_at` - Дата обновления

**Связи:**
- `1:N` с `projects`
- `1:N` с `templates`
- `1:N` с `api_keys`

---

### 2. projects

Проекты с контекстными блоками и промптами.

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    name_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, ''))) STORED
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_user_updated ON projects(user_id, updated_at DESC);
CREATE INDEX idx_projects_name_tsv ON projects USING gin(name_tsv);
```

**Поля:**
- `id` - UUID, первичный ключ
- `user_id` - UUID пользователя (foreign key)
- `name` - Название проекта
- `data` - JSONB структура проекта (см. ниже)
- `name_tsv` - tsvector для full-text search
- `created_at` - Дата создания
- `updated_at` - Дата обновления

**JSONB структура data:**

```typescript
{
  contextBlocks: [
    {
      id: number,
      title: string,
      items: [
        {
          id: number,
          title: string,
          content: string,
          chars: number,
          subItems?: [
            {
              id: number,
              title: string,
              content: string,
              chars: number
            }
          ]
        }
      ]
    }
  ],
  promptBlocks: [
    {
      id: number,
      title: string,
      template: string,
      wrapInTags: boolean,
      selectedContext: [
        {
          blockId: number,
          itemId: number,
          subItemId?: number,
          order: number
        }
      ]
    }
  ]
}
```

**Связи:**
- `N:1` с `users`
- `1:N` с `project_shares`

**Лимиты:**
- Максимум 10 проектов на пользователя
- Максимум 10M символов на проект
- Максимум 5M символов на контекстный блок

---

### 3. project_shares

Шеринг проектов между пользователями.

```sql
CREATE TABLE project_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    shared_with_email VARCHAR(255) NOT NULL,
    permission VARCHAR(10) DEFAULT 'view', -- view | edit
    status VARCHAR(20) DEFAULT 'pending',  -- pending | accepted | rejected
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, shared_with_email)
);

CREATE INDEX idx_project_shares_project_id ON project_shares(project_id);
CREATE INDEX idx_project_shares_email ON project_shares(shared_with_email);
```

**Поля:**
- `id` - UUID, первичный ключ
- `project_id` - UUID проекта (foreign key)
- `owner_id` - UUID владельца проекта
- `shared_with_email` - Email пользователя для шеринга
- `permission` - Уровень доступа (view/edit)
- `status` - Статус приглашения (pending/accepted/rejected)
- `created_at` - Дата создания
- `updated_at` - Дата обновления

**Связи:**
- `N:1` с `projects`

**Ограничения:**
- Один проект нельзя расшарить дважды с одним email

---

### 4. templates

Библиотека промпт-шаблонов пользователя.

```sql
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    name_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, ''))) STORED,
    content_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED
);

CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_name_btree ON templates(name);
CREATE INDEX idx_templates_user_updated ON templates(user_id, updated_at DESC);
CREATE INDEX idx_templates_name_tsv ON templates USING gin(name_tsv);
CREATE INDEX idx_templates_content_tsv ON templates USING gin(content_tsv);
CREATE INDEX idx_templates_combined_tsv ON templates USING gin(
  (setweight(to_tsvector('english', coalesce(name, '')), 'A') || 
   setweight(to_tsvector('english', coalesce(content, '')), 'B'))
);
```

**Поля:**
- `id` - UUID, первичный ключ
- `user_id` - UUID пользователя (foreign key)
- `name` - Название шаблона
- `content` - Текст шаблона (может содержать {{context}})
- `name_tsv` - tsvector для full-text search по названию
- `content_tsv` - tsvector для full-text search по контенту
- `created_at` - Дата создания
- `updated_at` - Дата обновления

**Связи:**
- `N:1` с `users`

**Оптимизация:**
- GIN индексы для full-text search (1-11ms на 1000+ записей)
- Composite index для поиска по названию и контенту с весами
- B-tree индекс для точного поиска и сортировки

---

### 5. api_keys

Зашифрованные API ключи AI провайдеров.

```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,     -- openai | anthropic | gemini | grok | openrouter
    encrypted_key TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'not_configured', -- not_configured | active | error
    last_tested_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_user_provider ON api_keys(user_id, provider);
```

**Поля:**
- `id` - UUID, первичный ключ
- `user_id` - UUID пользователя (foreign key)
- `provider` - Название провайдера
- `encrypted_key` - AES-256-GCM зашифрованный API ключ
- `status` - Статус ключа (not_configured/active/error)
- `last_tested_at` - Дата последней проверки ключа
- `created_at` - Дата создания
- `updated_at` - Дата обновления

**Поддерживаемые провайдеры:**
- `openai` - OpenAI (GPT-4, GPT-5.1)
- `anthropic` - Anthropic (Claude 4.5, Claude 4, Claude 3.5)
- `gemini` - Google Gemini
- `grok` - xAI Grok
- `openrouter` - OpenRouter (100+ моделей)

**Безопасность:**
- Ключи шифруются AES-256-GCM перед сохранением
- Encryption key хранится в переменной окружения `ENCRYPTION_KEY`
- Ключи никогда не возвращаются в API responses

**Связи:**
- `N:1` с `users`

**Ограничения:**
- Один пользователь может иметь только один ключ на провайдера

---

### 6. models_cache

Кеш списков моделей AI провайдеров.

```sql
CREATE TABLE models_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) UNIQUE NOT NULL,
    models_list JSONB NOT NULL,
    cached_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_models_cache_provider ON models_cache(provider);
CREATE INDEX idx_models_cache_expires ON models_cache(expires_at);
```

**Поля:**
- `id` - UUID, первичный ключ
- `provider` - Название провайдера (уникальный)
- `models_list` - JSONB массив моделей
- `cached_at` - Дата кеширования
- `expires_at` - Дата истечения кеша (TTL: 1 час)

**JSONB структура models_list:**

```typescript
[
  {
    id: string,           // Идентификатор модели
    name: string,         // Человеческое название
    provider: string,     // Провайдер
    contextWindow?: number // Размер контекстного окна
  }
]
```

**Назначение:**
- Кеширование списков моделей для снижения нагрузки на AI APIs
- Fallback модели, если API провайдера недоступен
- Redis используется как L1 cache (1 час TTL)
- PostgreSQL как L2 cache (persistent)

---

## 🔐 Безопасность

### Шифрование данных

**API ключи:**
- Алгоритм: AES-256-GCM
- Encryption key: 32-byte ключ из `ENCRYPTION_KEY` env variable
- IV (Initialization Vector): случайный 16-byte для каждого ключа
- Auth Tag: 16-byte для проверки целостности
- Формат хранения: `{iv}:{encryptedData}:{authTag}` (hex)

**Пример кода шифрования:**

```typescript
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`
}

export function decrypt(encryptedText: string): string {
  const [ivHex, encrypted, authTagHex] = encryptedText.split(':')
  
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
  
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
```

### Row Level Security (RLS)

Prisma middleware обеспечивает:
- Пользователь может читать/изменять только свои записи
- Cascade delete при удалении пользователя
- Валидация прав доступа на уровне запросов

### Индексы для безопасности

```sql
-- Быстрый поиск по пользователю
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

-- Уникальные ограничения
CREATE UNIQUE INDEX idx_users_google_id ON users(google_id);
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_api_keys_user_provider ON api_keys(user_id, provider);
```

---

## 🚀 Оптимизация производительности

### Full-Text Search

**GIN индексы для быстрого поиска:**

```sql
-- Templates: поиск по названию и контенту
CREATE INDEX idx_templates_name_tsv ON templates USING gin(name_tsv);
CREATE INDEX idx_templates_content_tsv ON templates USING gin(content_tsv);

-- Composite index с весами (название важнее)
CREATE INDEX idx_templates_combined_tsv ON templates USING gin(
  (setweight(to_tsvector('english', coalesce(name, '')), 'A') || 
   setweight(to_tsvector('english', coalesce(content, '')), 'B'))
);

-- Projects: поиск по названию
CREATE INDEX idx_projects_name_tsv ON projects USING gin(name_tsv);
```

**Производительность:**
- Без GIN: 7-8 секунд на 1000+ записей
- С GIN: 1-11ms на 1000+ записей
- Улучшение: **700-800x**

**Пример запроса:**

```sql
-- Поиск шаблонов по ключевым словам
SELECT 
    id, 
    name, 
    content,
    ts_rank(name_tsv || content_tsv, query) AS rank
FROM templates, 
     plainto_tsquery('english', 'api documentation') query
WHERE (name_tsv || content_tsv) @@ query
ORDER BY rank DESC
LIMIT 20;
```

### JSONB индексы

```sql
-- Индекс для поиска внутри JSONB
CREATE INDEX idx_projects_data_gin ON projects USING gin(data);

-- Пример: найти проекты с определенным prompt title
SELECT * FROM projects 
WHERE data @> '{"promptBlocks": [{"title": "API Analysis"}]}';
```

### Composite индексы

```sql
-- Быстрая сортировка проектов пользователя
CREATE INDEX idx_projects_user_updated ON projects(user_id, updated_at DESC);

-- Быстрая сортировка шаблонов пользователя
CREATE INDEX idx_templates_user_updated ON templates(user_id, updated_at DESC);
```

### EXPLAIN ANALYZE

Пример анализа производительности запросов:

```sql
EXPLAIN ANALYZE
SELECT * FROM templates
WHERE user_id = 'uuid-here'
  AND (name_tsv || content_tsv) @@ plainto_tsquery('english', 'search term')
ORDER BY updated_at DESC
LIMIT 20;
```

---

## 📊 Мониторинг БД

### Размеры таблиц

```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Статистика индексов

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Медленные запросы

Включите `pg_stat_statements`:

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Топ 10 медленных запросов
SELECT
    calls,
    total_exec_time,
    mean_exec_time,
    query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Cache hit ratio

```sql
SELECT 
    sum(heap_blks_read) as heap_read,
    sum(heap_blks_hit)  as heap_hit,
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;

-- Должен быть >99%
```

### Активные подключения

```sql
SELECT count(*) FROM pg_stat_activity;

-- Долгие запросы (>5 секунд)
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 seconds';
```

---

## 🔧 Обслуживание БД

### VACUUM и ANALYZE

```bash
# Vacuum для очистки мертвых строк
sudo -u postgres psql -d promptyflow -c "VACUUM VERBOSE ANALYZE;"

# Полный VACUUM (требует exclusive lock)
sudo -u postgres psql -d promptyflow -c "VACUUM FULL VERBOSE ANALYZE;"

# Автовакуум (настроено по умолчанию)
```

### Backup

```bash
# Полный backup
sudo -u postgres pg_dump promptyflow > backup_$(date +%Y%m%d_%H%M%S).sql

# Только схема
sudo -u postgres pg_dump -s promptyflow > schema_backup.sql

# Только данные
sudo -u postgres pg_dump -a promptyflow > data_backup.sql

# Backup с сжатием
sudo -u postgres pg_dump promptyflow | gzip > backup.sql.gz
```

### Restore

```bash
# Восстановление из backup
sudo -u postgres psql -d promptyflow < backup.sql

# Восстановление из сжатого backup
gunzip -c backup.sql.gz | sudo -u postgres psql -d promptyflow
```

### Reindexing

```sql
-- Пересоздать все индексы таблицы
REINDEX TABLE templates;

-- Пересоздать все индексы БД (долго!)
REINDEX DATABASE promptyflow;

-- Пересоздать конкретный индекс
REINDEX INDEX idx_templates_name_tsv;
```

---

## 🔄 Миграции

### Prisma миграции

```bash
# Создать миграцию
cd apps/api
npx prisma migrate dev --name migration_name

# Применить миграции (production)
npx prisma migrate deploy

# Проверить статус миграций
npx prisma migrate status

# Сгенерировать Prisma Client
npx prisma generate
```

### Ручные миграции

Миграции находятся в `apps/api/prisma/migrations/`:

**Основные миграции:**

1. **20251125101622_init** - Initial schema
2. **20251126000000_add_project_sharing** - Project sharing
3. **20251203183130_add_fulltext_search_indexes** - Full-text search

---

## 📈 Масштабирование

### Connection Pooling

Prisma использует встроенный connection pool:

```env
# .env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
```

Для production рекомендуется **PgBouncer**:

```bash
# Установка
sudo apt install -y pgbouncer

# Конфигурация
sudo nano /etc/pgbouncer/pgbouncer.ini
```

```ini
[databases]
promptyflow = host=localhost port=5432 dbname=promptyflow

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
```

### Read Replicas

Для высоконагруженных систем:

```typescript
// Prisma с read replica
const prismaRead = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_READ_URL
    }
  }
})

// Запись - master
await prisma.project.create(...)

// Чтение - replica
await prismaRead.project.findMany(...)
```

### Партиционирование

Для очень больших таблиц (миллионы записей):

```sql
-- Партиционирование templates по user_id
CREATE TABLE templates_partitioned (
    LIKE templates INCLUDING ALL
) PARTITION BY HASH (user_id);

CREATE TABLE templates_p0 PARTITION OF templates_partitioned
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);
    
CREATE TABLE templates_p1 PARTITION OF templates_partitioned
    FOR VALUES WITH (MODULUS 4, REMAINDER 1);
-- и т.д.
```

---

## 🔍 Troubleshooting

### Медленные запросы

```sql
-- Включить логирование медленных запросов
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1 секунда
SELECT pg_reload_conf();

-- Проверить логи
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Блокировки

```sql
-- Активные блокировки
SELECT * FROM pg_locks WHERE NOT granted;

-- Убить блокирующий процесс
SELECT pg_terminate_backend(pid);
```

### Проблемы с подключением

```bash
# Проверить статус PostgreSQL
sudo systemctl status postgresql

# Проверить порт
sudo netstat -tuln | grep 5432

# Проверить pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

---

## 📚 Полезные ссылки

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

**Дата создания:** 05.12.2025  
**Версия:** 1.0  
**Статус:** Production Ready 🗄️
