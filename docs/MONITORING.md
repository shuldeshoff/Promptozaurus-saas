#  Мониторинг и логирование

## Обзор

Система мониторинга для PromptyFlow на Ubuntu включает:
- **PM2** - мониторинг Node.js процессов
- **Nginx** - логи веб-сервера и access logs
- **PostgreSQL** - мониторинг БД и slow queries
- **Redis** - мониторинг кеша и памяти
- **System** - CPU, Memory, Disk, Network
- **Winston** - структурированное логирование приложения
- **Netdata** (опционально) - real-time system monitoring
- **Grafana + Prometheus** (опционально) - продвинутая визуализация

---

##  Системный мониторинг

### htop - интерактивный мониторинг процессов

```bash
# Установка
sudo apt install -y htop

# Запуск
htop

# Горячие клавиши:
# F6 - сортировка по CPU/Memory
# F9 - kill процесс
# Q - выход
```

### free - мониторинг памяти

```bash
# Общая информация о памяти
free -h

# Обновление каждую секунду
watch -n 1 free -h
```

### df - мониторинг дискового пространства

```bash
# Использование дисков
df -h

# Найти большие файлы
du -sh /var/* | sort -h

# Топ 10 самых больших директорий
du -h /var | sort -rh | head -n 10
```

### iostat - мониторинг ввода-вывода

```bash
# Установка
sudo apt install -y sysstat

# Статистика I/O
iostat -x 1

# Расширенная статистика CPU
mpstat 1
```

### netstat - мониторинг сети

```bash
# Активные соединения
sudo netstat -tuln

# Статистика по портам
sudo ss -tunlp | grep :3001

# Подсчет соединений
sudo netstat -an | grep ESTABLISHED | wc -l
```

---

##  PM2 мониторинг

### Основные команды

```bash
# Список всех процессов
pm2 list

# Детальная информация
pm2 show promptyflow-api

# Мониторинг в реальном времени
pm2 monit

# Статус и использование ресурсов
pm2 status
```

### Просмотр логов

```bash
# Все логи
pm2 logs promptyflow-api

# Только последние 100 строк
pm2 logs promptyflow-api --lines 100

# Только ошибки
pm2 logs promptyflow-api --err

# Следить за логами в реальном времени
pm2 logs promptyflow-api --raw

# Очистить логи
pm2 flush
```

### Метрики PM2

```bash
# Web-based мониторинг (PM2 Plus - бесплатно для 1 сервера)
pm2 plus

# Или используйте pm2-web (локальный dashboard)
npm install -g pm2-web
pm2-web
# Откройте http://localhost:9000
```

### Настройка алертов

Создайте \`/home/promptyflow/pm2-alerts.sh\`:

```bash
#!/bin/bash

# Проверка что процесс запущен
pm2 describe promptyflow-api > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "ALERT: promptyflow-api is not running!" | mail -s "PM2 Alert" admin@example.com
    pm2 restart promptyflow-api
fi

# Проверка использования памяти
MEMORY=$(pm2 jlist | jq '.[0].monit.memory' | awk '{print int($1/1024/1024)}')
if [ $MEMORY -gt 450 ]; then
    echo "ALERT: promptyflow-api using ${MEMORY}MB of memory" | mail -s "PM2 Memory Alert" admin@example.com
fi
```

Добавьте в cron:

```bash
crontab -e

# Проверка каждые 5 минут
*/5 * * * * /home/promptyflow/pm2-alerts.sh
```

---

##  Nginx мониторинг

### Access Logs

```bash
# Просмотр access логов
sudo tail -f /var/log/nginx/access.log

# Последние 100 строк
sudo tail -n 100 /var/log/nginx/access.log

# Статистика по IP адресам
sudo awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -n 10

# Статистика по User-Agent
sudo awk -F'"' '{print $6}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -n 10

# Статистика по кодам ответов
sudo awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn
```

### Error Logs

```bash
# Просмотр error логов
sudo tail -f /var/log/nginx/error.log

# Поиск 502 ошибок
sudo grep "502" /var/log/nginx/error.log

# Поиск upstream ошибок
sudo grep "upstream" /var/log/nginx/error.log
```

### Nginx Status Module

Включите stub_status в конфигурации Nginx:

```nginx
server {
    listen 127.0.0.1:8080;
    server_name localhost;

    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
```

Проверка статуса:

```bash
curl http://127.0.0.1:8080/nginx_status

# Вывод:
# Active connections: 5
# server accepts handled requests
#  1000 1000 5000
# Reading: 0 Writing: 2 Waiting: 3
```

### Анализ логов с GoAccess

```bash
# Установка
sudo apt install -y goaccess

# Real-time HTML отчет
sudo goaccess /var/log/nginx/access.log -o /var/www/html/report.html --log-format=COMBINED --real-time-html

# Терминальный отчет
sudo goaccess /var/log/nginx/access.log --log-format=COMBINED
```

---

##  PostgreSQL мониторинг

### Основные метрики

```bash
# Подключение к БД
sudo -u postgres psql -d promptyflow

-- Активные подключения
SELECT count(*) FROM pg_stat_activity;

-- Долгие запросы (больше 5 секунд)
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 seconds';

-- Размер БД
SELECT pg_size_pretty(pg_database_size('promptyflow'));

-- Размер таблиц
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Статистика по индексам
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Cache hit ratio (должен быть >99%)
SELECT 
    sum(heap_blks_read) as heap_read,
    sum(heap_blks_hit)  as heap_hit,
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;
```

### pg_stat_statements (расширение для мониторинга запросов)

```bash
sudo -u postgres psql -d promptyflow

-- Включить расширение
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

-- Топ 10 самых частых запросов
SELECT
    calls,
    total_exec_time,
    query
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 10;
```

### Логирование медленных запросов

Отредактируйте \`/etc/postgresql/14/main/postgresql.conf\`:

```conf
# Логировать запросы дольше 1 секунды
log_min_duration_statement = 1000

# Логировать все DDL команды
log_statement = 'ddl'

# Детализация логов
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

Перезапуск:

```bash
sudo systemctl restart postgresql
```

Просмотр логов:

```bash
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

##  Redis мониторинг

### Redis CLI команды

```bash
# Подключение
redis-cli -a your_redis_password

# Информация о сервере
INFO

# Информация о памяти
INFO memory

# Информация о статистике
INFO stats

# Информация о клиентах
INFO clients

# Все ключи (осторожно в продакшне!)
KEYS *

# Количество ключей
DBSIZE

# Мониторинг команд в реальном времени
MONITOR

# Медленные запросы
SLOWLOG GET 10

# Проверка конкретного ключа
TTL models:openai
GET models:openai
```

### Метрики Redis

```bash
# Используемая память
redis-cli -a password INFO memory | grep used_memory_human

# Hit rate (эффективность кеша)
redis-cli -a password INFO stats | grep keyspace

# Подключенные клиенты
redis-cli -a password INFO clients | grep connected_clients

# Операций в секунду
redis-cli -a password INFO stats | grep instantaneous_ops_per_sec
```

### redis-stat - визуальный мониторинг

```bash
# Установка
gem install redis-stat

# Запуск
redis-stat --auth your_redis_password --server

# Откройте http://localhost:63790
```

---

##  Winston логирование

### Конфигурация логирования

Backend уже использует Winston через Fastify logger:

```typescript
// apps/api/src/index.ts
const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }
})
```

### Уровни логирования

- \`error\` - критические ошибки
- \`warn\` - предупреждения
- \`info\` - информационные сообщения (по умолчанию)
- \`debug\` - отладочные сообщения
- \`trace\` - детальная трассировка

### Использование в коде

```typescript
// Информация
server.log.info({ userId: user.id }, 'User logged in')

// Ошибка
server.log.error({ 
  error: err.message, 
  stack: err.stack,
  userId 
}, 'Failed to update project')

// Предупреждение
server.log.warn({ 
  projectId, 
  size: currentSize,
  limit: MAX_SIZE 
}, 'Project approaching size limit')

// Отладка
server.log.debug({ query }, 'Executing database query')
```

### Просмотр логов

```bash
# PM2 логи (Winston пишет в PM2)
pm2 logs promptyflow-api

# Прямые файлы логов
tail -f ~/Promptozaurus-saas/apps/api/logs/pm2-out.log
tail -f ~/Promptozaurus-saas/apps/api/logs/pm2-error.log

# Фильтрация по уровню (grep)
pm2 logs promptyflow-api | grep ERROR
pm2 logs promptyflow-api | grep WARN
```

### Ротация логов

PM2 автоматически управляет логами, но можно настроить logrotate:

```bash
sudo nano /etc/logrotate.d/promptyflow
```

Содержимое:

```
/home/promptyflow/Promptozaurus-saas/apps/api/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 promptyflow promptyflow
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

##  Netdata - Real-time мониторинг

### Установка Netdata

```bash
# Автоматическая установка
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Netdata запустится автоматически
sudo systemctl status netdata
```

### Доступ к Dashboard

Откройте в браузере: \`http://your-server-ip:19999\`

**Функции:**
- Real-time графики CPU, RAM, Disk, Network
- Мониторинг Nginx, PostgreSQL, Redis
- Мониторинг Node.js приложений
- Алерты и уведомления
- Исторические данные

### Безопасность

Настройте доступ только с localhost или через Nginx reverse proxy:

```nginx
# В конфигурации Nginx
location /netdata/ {
    proxy_pass http://localhost:19999/;
    proxy_set_header Host $host;
    
    # Basic Auth
    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd;
}
```

Создание пароля:

```bash
sudo apt install -y apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd admin
```

---

##  Grafana + Prometheus (продвинутый мониторинг)

### Установка Prometheus

```bash
# Создать пользователя
sudo useradd --no-create-home --shell /bin/false prometheus

# Скачать Prometheus
cd /tmp
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvf prometheus-2.45.0.linux-amd64.tar.gz

# Установить
sudo mv prometheus-2.45.0.linux-amd64/prometheus /usr/local/bin/
sudo mv prometheus-2.45.0.linux-amd64/promtool /usr/local/bin/

# Создать директории
sudo mkdir /etc/prometheus
sudo mkdir /var/lib/prometheus

# Конфигурация
sudo nano /etc/prometheus/prometheus.yml
```

Базовая конфигурация:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']
```

Systemd service:

```bash
sudo nano /etc/systemd/system/prometheus.service
```

```ini
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \
    --config.file /etc/prometheus/prometheus.yml \
    --storage.tsdb.path /var/lib/prometheus/ \
    --web.console.templates=/etc/prometheus/consoles \
    --web.console.libraries=/etc/prometheus/console_libraries

[Install]
WantedBy=multi-user.target
```

Запуск:

```bash
sudo systemctl daemon-reload
sudo systemctl start prometheus
sudo systemctl enable prometheus
```

### Установка Grafana

```bash
# Добавить репозиторий
sudo apt install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -

# Установить
sudo apt update
sudo apt install -y grafana

# Запустить
sudo systemctl start grafana-server
sudo systemctl enable grafana-server
```

Откройте: \`http://your-server-ip:3000\` (логин: admin, пароль: admin)

### Настройка Grafana

1. Add data source → Prometheus → \`http://localhost:9090\`
2. Import dashboard → Dashboard ID: 1860 (Node Exporter Full)
3. Import dashboard → Dashboard ID: 12708 (PostgreSQL)
4. Создайте свои dashboards для PromptyFlow метрик

---

##  Алертинг

### Email алерты через mail

```bash
# Установка
sudo apt install -y mailutils

# Тест
echo "Test email" | mail -s "Test Subject" admin@example.com
```

### Скрипт проверки здоровья системы

```bash
sudo nano /usr/local/bin/health-check.sh
```

```bash
#!/bin/bash

ADMIN_EMAIL="admin@example.com"
ALERT=false
MESSAGE=""

# Проверка backend
if ! pm2 describe promptyflow-api > /dev/null 2>&1; then
    MESSAGE+="CRITICAL: Backend is not running!\n"
    ALERT=true
    pm2 restart promptyflow-api
fi

# Проверка Nginx
if ! sudo systemctl is-active --quiet nginx; then
    MESSAGE+="CRITICAL: Nginx is not running!\n"
    ALERT=true
    sudo systemctl start nginx
fi

# Проверка PostgreSQL
if ! sudo systemctl is-active --quiet postgresql; then
    MESSAGE+="CRITICAL: PostgreSQL is not running!\n"
    ALERT=true
    sudo systemctl start postgresql
fi

# Проверка Redis
if ! sudo systemctl is-active --quiet redis-server; then
    MESSAGE+="CRITICAL: Redis is not running!\n"
    ALERT=true
    sudo systemctl start redis-server
fi

# Проверка диска (>90% usage)
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    MESSAGE+="WARNING: Disk usage is ${DISK_USAGE}%\n"
    ALERT=true
fi

# Проверка памяти (>90% usage)
MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
if [ $MEM_USAGE -gt 90 ]; then
    MESSAGE+="WARNING: Memory usage is ${MEM_USAGE}%\n"
    ALERT=true
fi

# Отправка алерта
if [ "$ALERT" = true ]; then
    echo -e "$MESSAGE" | mail -s "PromptyFlow Health Alert" $ADMIN_EMAIL
fi
```

Сделать исполняемым и добавить в cron:

```bash
sudo chmod +x /usr/local/bin/health-check.sh

crontab -e
*/5 * * * * /usr/local/bin/health-check.sh
```

---

##  Метрики приложения

### Custom метрики endpoint

Добавьте в \`apps/api/src/routes/monitoring.routes.ts\`:

```typescript
import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth.middleware'

export async function monitoringRoutes(fastify: FastifyInstance) {
  // Публичный health check
  fastify.get('/health', async () => {
    const redisStatus = await checkRedis()
    const dbStatus = await checkDatabase()
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      redis: redisStatus ? 'connected' : 'disconnected',
      database: dbStatus ? 'connected' : 'disconnected'
    }
  })

  // Защищенные метрики (только для админа)
  fastify.get('/admin/metrics', {
    preHandler: authenticate
  }, async (request) => {
    // Проверка админа
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId }
    })
    
    if (!user || user.role !== 'admin') {
      return fastify.httpErrors.forbidden()
    }

    const [
      totalUsers,
      totalProjects,
      totalTemplates
    ] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.template.count()
    ])

    return {
      timestamp: new Date().toISOString(),
      users: totalUsers,
      projects: totalProjects,
      templates: totalTemplates,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  })
}
```

---

##  Checklist мониторинга

### Установка и настройка:
- [ ] htop установлен
- [ ] PM2 мониторинг настроен
- [ ] Nginx логи ротируются
- [ ] PostgreSQL медленные запросы логируются
- [ ] Redis мониторится
- [ ] Winston логирование работает
- [ ] Netdata установлен (опционально)
- [ ] Grafana + Prometheus настроены (опционально)
- [ ] Health check script создан
- [ ] Email алерты настроены
- [ ] Cron задачи для мониторинга добавлены

### Регулярные проверки:

**Ежедневно:**
- [ ] Проверить PM2 статус
- [ ] Просмотреть логи ошибок
- [ ] Проверить disk usage

**Еженедельно:**
- [ ] Проанализировать Nginx access logs
- [ ] Проверить PostgreSQL медленные запросы
- [ ] Проверить Redis hit rate
- [ ] Проверить logrotate работу

**Ежемесячно:**
- [ ] Очистить старые логи
- [ ] Оптимизировать БД (VACUUM, ANALYZE)
- [ ] Проверить и обновить систему
- [ ] Проверить размеры backups

---

##  Troubleshooting

### Backend не отвечает

```bash
pm2 logs promptyflow-api --err
pm2 restart promptyflow-api
curl http://localhost:3001/health
```

### Nginx 502 Bad Gateway

```bash
sudo tail -f /var/log/nginx/error.log
sudo systemctl status nginx
pm2 status
```

### PostgreSQL медленные запросы

```bash
sudo -u postgres psql -d promptyflow
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

### Redis память заполнена

```bash
redis-cli -a password INFO memory
redis-cli -a password FLUSHALL  # Осторожно!
```

### Disk заполнен

```bash
df -h
du -sh /var/* | sort -h
sudo journalctl --vacuum-time=7d
pm2 flush
```

---

**Дата обновления:** 05.12.2025  
**Версия:** 2.0 (Self-Hosted Ubuntu)  
**Статус:** Production Ready 
