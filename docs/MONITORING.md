# 📊 Monitoring & Logging Guide

## Обзор

Система мониторинга для Promptozaurus SaaS включает:
- **Railway Metrics** - мониторинг backend (CPU, Memory, Network)
- **Vercel Analytics** - мониторинг frontend (посетители, производительность)
- **Winston Logger** - структурированное логирование backend
- **Sentry** (опционально) - отслеживание ошибок
- **Upstash Console** - мониторинг Redis

---

## 🖥️ Railway Metrics (Backend)

### Встроенный мониторинг

Railway автоматически собирает метрики:

1. **CPU Usage** - использование процессора
2. **Memory Usage** - использование оперативной памяти
3. **Network** - входящий/исходящий трафик
4. **Requests** - количество запросов в секунду

### Доступ к метрикам

1. Откройте [Railway Dashboard](https://railway.app)
2. Выберите проект → Metrics
3. Просмотрите графики за последние 24 часа / 7 дней / 30 дней

### Алерты

Railway автоматически уведомляет при:
- Превышении лимитов памяти
- Падении приложения
- Проблемах с deployment

---

## 🌐 Vercel Analytics (Frontend)

### Встроенная аналитика

Vercel предоставляет:
- **Page Views** - просмотры страниц
- **Unique Visitors** - уникальные посетители
- **Top Pages** - самые популярные страницы
- **Real-time** - данные в реальном времени

### Включение аналитики

1. Откройте [Vercel Dashboard](https://vercel.com)
2. Выберите проект → Analytics
3. Бесплатный план: базовые метрики
4. Pro план ($20/мес): детальная аналитика

### Web Vitals (производительность)

Vercel автоматически отслеживает:
- **LCP** (Largest Contentful Paint) - скорость загрузки
- **FID** (First Input Delay) - интерактивность
- **CLS** (Cumulative Layout Shift) - стабильность макета

---

## 📝 Winston Logger (Backend)

### Текущая настройка

Winston уже настроен в `apps/api/src/index.ts`:

```typescript
const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});
```

### Уровни логирования

- **error** - критические ошибки (всегда в продакшне)
- **warn** - предупреждения
- **info** - информационные сообщения (по умолчанию в продакшне)
- **debug** - отладочные сообщения (только в разработке)

### Просмотр логов в Railway

```bash
# Через Railway CLI
railway logs

# В Railway Dashboard
Project → Deployments → View Logs
```

### Структурированное логирование

Пример использования в коде:

```typescript
server.log.info({ userId: user.id }, 'User logged in');
server.log.error({ error: err.message }, 'Database connection failed');
server.log.warn({ projectId }, 'Project limit reached');
```

### Фильтрация логов

В Railway Console:
```bash
# Только ошибки
railway logs --filter error

# Последние 100 строк
railway logs --tail 100

# Следить в реальном времени
railway logs --follow
```

---

## 🚨 Sentry Integration (опционально)

### Установка

```bash
# Backend
cd apps/api
npm install @sentry/node @sentry/profiling-node

# Frontend
cd apps/web
npm install @sentry/react
```

### Backend Setup

Создайте `apps/api/src/lib/sentry.ts`:

```typescript
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export const initSentry = () => {
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
      integrations: [
        new ProfilingIntegration(),
      ],
    });
    
    console.log('✅ Sentry initialized');
  }
};
```

В `apps/api/src/index.ts`:

```typescript
import { initSentry } from './lib/sentry.js';

// Инициализировать Sentry первым делом
initSentry();

// ... rest of code
```

### Frontend Setup

В `apps/web/src/main.tsx`:

```typescript
import * as Sentry from '@sentry/react';

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

### Environment Variables

Railway (Backend):
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

Vercel (Frontend):
```bash
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Создание Sentry проекта

1. Зарегистрируйтесь на [Sentry.io](https://sentry.io)
2. Создайте 2 проекта:
   - `promptozaurus-api` (Node.js)
   - `promptozaurus-web` (React)
3. Скопируйте DSN из Settings → Client Keys

### Бесплатный план

- 5,000 ошибок/месяц
- 10,000 performance events/месяц
- Достаточно для MVP и первых пользователей

---

## 🔍 Database Monitoring (Supabase)

### Встроенные метрики

Supabase Dashboard → Database:

1. **Connection Pooling** - активные подключения
2. **Query Performance** - медленные запросы
3. **Storage** - использование дискового пространства
4. **Backups** - статус бэкапов

### Slow Query Monitoring

В Supabase Dashboard → Database → Query Performance:
- Просмотр самых медленных запросов
- Оптимизация индексов

### Alerts

Настройте email уведомления при:
- Превышении 80% storage
- Превышении лимитов подключений
- Падении доступности

---

## 💾 Redis Monitoring (Upstash)

### Upstash Console

1. Откройте [Upstash Console](https://console.upstash.com)
2. Выберите Redis instance
3. Просмотрите:
   - **Commands/sec** - запросов в секунду
   - **Data Size** - размер данных
   - **Hit Rate** - эффективность кэша
   - **Evictions** - вытесненные ключи

### Алерты

Upstash уведомляет при:
- Превышении free tier лимита (10,000 commands/day)
- Проблемах с доступностью

### Redis CLI

```bash
# Подключиться к Redis
redis-cli -u $REDIS_URL

# Проверить размер БД
INFO keyspace

# Просмотреть все ключи
KEYS *

# Проверить TTL ключа
TTL models:openai

# Очистить кэш (осторожно!)
FLUSHDB
```

---

## 📈 Custom Metrics (опционально)

### Backend Metrics Service

Создайте `apps/api/src/services/metrics.service.ts`:

```typescript
class MetricsService {
  private stats = {
    totalRequests: 0,
    totalErrors: 0,
    totalUsers: 0,
    totalProjects: 0,
    aiRequests: {
      openai: 0,
      anthropic: 0,
      gemini: 0,
    },
  };

  incrementRequests() {
    this.stats.totalRequests++;
  }

  incrementErrors() {
    this.stats.totalErrors++;
  }

  incrementAIRequest(provider: string) {
    if (provider in this.stats.aiRequests) {
      this.stats.aiRequests[provider]++;
    }
  }

  async getStats() {
    // Получить данные из БД
    const users = await prisma.user.count();
    const projects = await prisma.project.count();
    
    return {
      ...this.stats,
      totalUsers: users,
      totalProjects: projects,
      timestamp: new Date().toISOString(),
    };
  }
}

export const metricsService = new MetricsService();
```

### Metrics Endpoint

В `apps/api/src/index.ts`:

```typescript
// Admin-only endpoint
server.get('/admin/metrics', {
  preHandler: [server.authenticate, requireAdmin],
}, async () => {
  return await metricsService.getStats();
});
```

---

## 🔔 Alerting Strategy

### Critical Alerts (немедленно)

- Backend crashes (Railway)
- Database unavailable (Supabase)
- Redis unavailable (Upstash)
- Frontend build fails (Vercel)

### Warning Alerts (в течение часа)

- High memory usage (>80%)
- High CPU usage (>80%)
- Slow database queries (>1s)
- Error rate >5%

### Info Alerts (ежедневный отчет)

- Количество новых пользователей
- Количество созданных проектов
- Количество AI запросов
- Top errors в Sentry

---

## 📊 Dashboard (опционально)

### Внутренний Dashboard

Создайте простой admin dashboard:

**Frontend:** `apps/web/src/pages/AdminDashboard.tsx`

```typescript
export default function AdminDashboard() {
  const { data: metrics } = useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: () => api.get('/admin/metrics'),
    refetchInterval: 10000, // Каждые 10 секунд
  });

  return (
    <div className="p-8">
      <h1>Admin Dashboard</h1>
      
      <div className="grid grid-cols-4 gap-4">
        <StatCard 
          label="Total Users" 
          value={metrics?.totalUsers} 
        />
        <StatCard 
          label="Total Projects" 
          value={metrics?.totalProjects} 
        />
        <StatCard 
          label="Total Requests" 
          value={metrics?.totalRequests} 
        />
        <StatCard 
          label="Error Rate" 
          value={`${(metrics?.totalErrors / metrics?.totalRequests * 100).toFixed(2)}%`} 
        />
      </div>
      
      <div className="mt-8">
        <h2>AI Requests</h2>
        <BarChart data={metrics?.aiRequests} />
      </div>
    </div>
  );
}
```

### External Dashboards

**Grafana + Prometheus** (для больших проектов):
- Более детальные метрики
- Custom queries
- Advanced alerting

---

## ✅ Monitoring Checklist

- [ ] Railway metrics проверяются ежедневно
- [ ] Vercel analytics настроена
- [ ] Winston logger работает в production
- [ ] Sentry установлен и настроен (опционально)
- [ ] Supabase backups настроены
- [ ] Upstash Redis мониторится
- [ ] Email alerts настроены
- [ ] Admin dashboard создан (опционально)
- [ ] Health check endpoint работает (`/health`)
- [ ] Логи регулярно проверяются

---

## 🐛 Debugging Production Issues

### 1. Backend Error

```bash
# Проверить логи
railway logs --filter error --tail 100

# Проверить health
curl https://[YOUR-RAILWAY-DOMAIN]/health

# Проверить DATABASE_URL
railway variables
```

### 2. Frontend Error

1. Открыть Vercel → Deployments → Logs
2. Проверить Sentry → Issues
3. Открыть DevTools → Console в браузере

### 3. Database Issue

1. Supabase → Database → Query Performance
2. Проверить медленные запросы
3. Проверить connection pooling

### 4. Redis Issue

1. Upstash Console → Metrics
2. Проверить hit rate
3. Очистить кэш при необходимости

---

## 📝 Regular Maintenance Tasks

### Ежедневно:
- [ ] Проверить Railway/Vercel dashboards
- [ ] Проверить error rate в Sentry
- [ ] Просмотреть critical errors

### Еженедельно:
- [ ] Просмотреть slow queries в Supabase
- [ ] Проверить storage usage
- [ ] Проверить Redis cache hit rate
- [ ] Обновить зависимости (если есть security fixes)

### Ежемесячно:
- [ ] Проверить billing (Railway, Vercel, Supabase, Upstash)
- [ ] Оптимизировать медленные запросы
- [ ] Удалить неиспользуемые данные
- [ ] Backup review

---

**Дата создания:** 25 ноября 2025  
**Версия:** 1.0  
**Статус:** Production monitoring guide 📊

