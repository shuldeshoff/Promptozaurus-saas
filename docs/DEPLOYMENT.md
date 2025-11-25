# 🚀 Deployment Guide

## Обзор

Promptozaurus SaaS разворачивается на следующих сервисах:
- **Frontend:** Vercel (бесплатный план)
- **Backend:** Railway (бесплатный план для начала)
- **Database:** Supabase PostgreSQL (бесплатный план)
- **Redis:** Upstash Redis (бесплатный план)

---

## 📋 Предварительные требования

1. Аккаунты на сервисах:
   - [GitHub](https://github.com) (для репозитория и CI/CD)
   - [Vercel](https://vercel.com) (для frontend)
   - [Railway](https://railway.app) (для backend)
   - [Supabase](https://supabase.com) (для PostgreSQL)
   - [Upstash](https://upstash.com) (для Redis)

2. Инструменты:
   - Node.js 18+
   - Git
   - Prisma CLI: `npm install -g prisma`

---

## 🗄️ 1. Настройка PostgreSQL (Supabase)

### 1.1. Создание проекта

1. Зайдите на [Supabase](https://supabase.com) и создайте новый проект
2. Выберите регион (ближайший к вашим пользователям)
3. Задайте надежный пароль для базы данных
4. Дождитесь создания проекта (~2 минуты)

### 1.2. Получение Database URL

1. Откройте Settings → Database
2. Скопируйте Connection String в формате:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
   ```

### 1.3. Применение миграций

```bash
cd apps/api

# Установите DATABASE_URL
export DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"

# Примените миграции
npx prisma migrate deploy

# Проверьте подключение
npx prisma db pull
```

### 1.4. Настройка backups

1. В Supabase → Settings → Database
2. Backups настроены автоматически (ежедневно)
3. Для дополнительной безопасности: настройте Point-in-Time Recovery (PITR) в платном плане

---

## 🔴 2. Настройка Redis (Upstash)

### 2.1. Создание Redis instance

1. Зайдите на [Upstash](https://upstash.com)
2. Создайте новую базу Redis
3. Выберите регион (тот же, что и для БД)
4. Выберите Free Plan (10,000 команд/день)

### 2.2. Получение REDIS_URL

1. Откройте созданную базу
2. Скопируйте Redis URL:
   ```
   redis://default:[PASSWORD]@[HOST]:6379
   ```

---

## 🖥️ 3. Deployment Backend (Railway)

### 3.1. Подготовка

1. Убедитесь, что код закоммичен в Git:
   ```bash
   git add .
   git commit -m "feat: prepare for deployment"
   git push origin main
   ```

2. Проверьте `railway.json` в `apps/api/`:
   ```json
   {
     "build": {
       "builder": "NIXPACKS",
       "buildCommand": "npm install && npm run build"
     },
     "deploy": {
       "startCommand": "node dist/index.js",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     },
     "healthcheck": {
       "path": "/health",
       "interval": 30,
       "timeout": 10
     }
   }
   ```

### 3.2. Deployment на Railway

1. Зайдите на [Railway](https://railway.app)
2. Нажмите "New Project" → "Deploy from GitHub repo"
3. Выберите ваш репозиторий
4. Railway автоматически определит Node.js проект

### 3.3. Настройка переменных окружения

В Railway → Settings → Variables добавьте:

```bash
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database (из Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres

# Redis (из Upstash)
REDIS_URL=redis://default:[PASSWORD]@[HOST]:6379

# JWT & Security (сгенерируйте новые!)
JWT_SECRET=<generate-random-64-char-string>
ENCRYPTION_KEY=<generate-random-32-byte-base64-string>

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://[YOUR-RAILWAY-DOMAIN]/auth/google/callback

# CORS (будет URL Vercel)
CORS_ORIGIN=https://[YOUR-VERCEL-DOMAIN]

# Session
SESSION_SECRET=<generate-random-64-char-string>

# Frontend URL (будет URL Vercel)
FRONTEND_URL=https://[YOUR-VERCEL-DOMAIN]
```

### 3.4. Генерация секретных ключей

```bash
# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.5. Настройка Custom Domain (опционально)

1. Railway → Settings → Domains
2. Добавьте свой домен или используйте Railway subdomain
3. Обновите `GOOGLE_CALLBACK_URL` и `CORS_ORIGIN`

### 3.6. Проверка deployment

```bash
# Проверьте health endpoint
curl https://[YOUR-RAILWAY-DOMAIN]/health

# Ожидаемый ответ:
# {"status":"ok","timestamp":"...","redis":"connected"}
```

---

## 🌐 4. Deployment Frontend (Vercel)

### 4.1. Подготовка

Проверьте `vercel.json` в `apps/web/`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 4.2. Deployment на Vercel

1. Зайдите на [Vercel](https://vercel.com)
2. Нажмите "Add New" → "Project"
3. Импортируйте GitHub репозиторий
4. Vercel автоматически определит Vite проект

### 4.3. Настройка Build Settings

- **Framework Preset:** Vite
- **Root Directory:** `apps/web`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 4.4. Настройка переменных окружения

В Vercel → Settings → Environment Variables добавьте:

```bash
VITE_API_URL=https://[YOUR-RAILWAY-DOMAIN]
```

### 4.5. Deployment

1. Нажмите "Deploy"
2. Дождитесь завершения (1-2 минуты)
3. Получите URL: `https://[YOUR-PROJECT].vercel.app`

### 4.6. Обновление Backend CORS

Вернитесь в Railway и обновите:
```bash
CORS_ORIGIN=https://[YOUR-VERCEL-DOMAIN]
FRONTEND_URL=https://[YOUR-VERCEL-DOMAIN]
```

### 4.7. Настройка Custom Domain (опционально)

1. Vercel → Settings → Domains
2. Добавьте свой домен
3. Настройте DNS записи (A/CNAME)

---

## 🔐 5. Настройка Google OAuth

### 5.1. Обновление Authorized Redirect URIs

1. Зайдите в [Google Cloud Console](https://console.cloud.google.com)
2. Перейдите в APIs & Services → Credentials
3. Выберите ваш OAuth Client
4. В "Authorized redirect URIs" добавьте:
   ```
   https://[YOUR-RAILWAY-DOMAIN]/auth/google/callback
   ```

### 5.2. Обновление Authorized JavaScript origins

```
https://[YOUR-VERCEL-DOMAIN]
```

---

## 🔄 6. CI/CD с GitHub Actions

### 6.1. Frontend CI/CD (Vercel)

Vercel автоматически настроит CI/CD для вашего репозитория:
- Pull Request → Preview deployment
- Push to main → Production deployment

### 6.2. Backend CI/CD (Railway)

Railway также автоматически настроит CI/CD:
- Push to main → Automatic deployment
- Health check → Rollback при ошибках

### 6.3. Дополнительные GitHub Actions (опционально)

Создайте `.github/workflows/test.yml`:

```yaml
name: Run Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Run backend tests
        run: |
          cd apps/api
          npm test
          
      - name: Run frontend tests (if any)
        run: |
          cd apps/web
          npm test
```

---

## 📊 7. Мониторинг и логирование

### 7.1. Railway встроенный мониторинг

1. Railway → Metrics
2. Отслеживайте: CPU, Memory, Network
3. Настройте алерты при превышении лимитов

### 7.2. Vercel Analytics

1. Vercel → Analytics
2. Бесплатный план: основные метрики
3. Pro план: детальная аналитика посетителей

### 7.3. Sentry (опционально, для продакшна)

```bash
# Backend
npm install @sentry/node

# Frontend
npm install @sentry/react
```

Настройка в отдельном гайде (MONITORING.md)

---

## ✅ 8. Проверка deployment

### 8.1. Backend Health Check

```bash
curl https://[YOUR-RAILWAY-DOMAIN]/health

# Ожидаемый ответ:
{
  "status": "ok",
  "timestamp": "2025-11-25T...",
  "redis": "connected"
}
```

### 8.2. Frontend

1. Откройте `https://[YOUR-VERCEL-DOMAIN]`
2. Проверьте, что загружается лендинг
3. Нажмите "Login with Google"
4. Авторизуйтесь и проверьте Dashboard

### 8.3. Полный flow

1. Login → создание проекта → создание контекста → создание промпта
2. Проверьте auto-save
3. Проверьте работу с AI (если ключи настроены)

---

## 🐛 Troubleshooting

### Backend не запускается

1. Проверьте логи в Railway → Deployments → View Logs
2. Убедитесь, что `DATABASE_URL` и `REDIS_URL` правильные
3. Проверьте, что миграции применены

### Frontend не подключается к Backend

1. Проверьте `VITE_API_URL` в Vercel
2. Проверьте `CORS_ORIGIN` в Railway
3. Откройте DevTools → Network для проверки запросов

### Google OAuth не работает

1. Проверьте Redirect URI в Google Console
2. Проверьте `GOOGLE_CALLBACK_URL` в Railway
3. Проверьте `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET`

### Redis connection failed

1. Проверьте `REDIS_URL` формат
2. Убедитесь, что Upstash instance активен
3. Проверьте регион (должен быть близко к Railway)

---

## 📝 Checklist финального deployment

- [ ] PostgreSQL создана на Supabase
- [ ] Миграции Prisma применены
- [ ] Redis создан на Upstash
- [ ] Backend развернут на Railway
- [ ] Все environment variables настроены в Railway
- [ ] Frontend развернут на Vercel
- [ ] `VITE_API_URL` настроен в Vercel
- [ ] Google OAuth redirect URIs обновлены
- [ ] CORS настроен правильно
- [ ] Health check возвращает 200
- [ ] Login through Google работает
- [ ] Dashboard загружается
- [ ] Создание проектов работает
- [ ] Auto-save работает
- [ ] AI integration работает (если ключи настроены)

---

## 🚀 Next Steps

После успешного deployment:

1. Настройте мониторинг (Sentry)
2. Настройте алерты (Railway, Vercel)
3. Проведите нагрузочное тестирование
4. Соберите feedback от первых пользователей
5. Настройте backup стратегию

---

**Дата создания:** 25 ноября 2025  
**Версия:** 1.0  
**Статус:** Ready for production 🚀

