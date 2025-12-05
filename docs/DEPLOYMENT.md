#  Руководство по развертыванию

## Обзор

PromptyFlow SaaS разворачивается на Ubuntu сервере со следующим стеком:
- **OS:** Ubuntu 22.04 LTS или выше
- **Web Server:** Nginx (reverse proxy)
- **Database:** PostgreSQL 14+
- **Cache:** Redis 7+
- **Process Manager:** PM2
- **SSL:** Let's Encrypt (Certbot)

---

##  Системные требования

### Минимальные требования:
- **CPU:** 2 cores
- **RAM:** 2 GB
- **Disk:** 20 GB SSD
- **Bandwidth:** 100 Mbps

### Рекомендуемые требования:
- **CPU:** 4 cores
- **RAM:** 4 GB
- **Disk:** 40 GB SSD
- **Bandwidth:** 1 Gbps

### Программное обеспечение:
- Ubuntu 22.04 LTS
- Права root или sudo
- Домен с настроенными DNS записями

---

##  1. Подготовка сервера

### 1.1. Обновление системы

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

### 1.2. Настройка firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### 1.3. Создание пользователя для приложения

```bash
sudo adduser --disabled-password --gecos "" promptyflow
sudo usermod -aG sudo promptyflow
```

---

##  2. Установка зависимостей

### 2.1. Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Проверка версии
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 2.2. PostgreSQL 14+

```bash
# Добавление репозитория PostgreSQL
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo tee /etc/apt/trusted.gpg.d/pgdg.asc &>/dev/null

# Установка
sudo apt update
sudo apt install -y postgresql-14 postgresql-contrib-14

# Проверка статуса
sudo systemctl status postgresql
```

### 2.3. Redis 7+

```bash
# Установка из официального репозитория
sudo apt install -y lsb-release
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list

sudo apt update
sudo apt install -y redis

# Проверка статуса
sudo systemctl status redis-server
```

### 2.4. Nginx

```bash
sudo apt install -y nginx

# Проверка статуса
sudo systemctl status nginx
```

### 2.5. PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Настройка автозапуска
pm2 startup systemd -u promptyflow --hp /home/promptyflow
```

### 2.6. Certbot (для SSL)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

##  3. Настройка PostgreSQL

### 3.1. Создание базы данных и пользователя

```bash
sudo -u postgres psql

-- В psql консоли:
CREATE USER promptyflow WITH PASSWORD 'your_secure_password';
CREATE DATABASE promptyflow OWNER promptyflow;
GRANT ALL PRIVILEGES ON DATABASE promptyflow TO promptyflow;

-- Включение расширений
\c promptyflow
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Выход
\q
```

### 3.2. Настройка доступа

Отредактируйте `/etc/postgresql/14/main/pg_hba.conf`:

```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Добавьте/измените строку:

```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   promptyflow     promptyflow                             md5
host    promptyflow     promptyflow     127.0.0.1/32           md5
```

Перезапустите PostgreSQL:

```bash
sudo systemctl restart postgresql
```

### 3.3. Проверка подключения

```bash
psql -U promptyflow -d promptyflow -h 127.0.0.1

# Если успешно подключились:
\q
```

---

##  4. Настройка Redis

### 4.1. Конфигурация Redis

Отредактируйте `/etc/redis/redis.conf`:

```bash
sudo nano /etc/redis/redis.conf
```

Найдите и измените:

```conf
# Bind на localhost
bind 127.0.0.1

# Установите пароль
requirepass your_redis_password

# Настройки памяти
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
```

### 4.2. Перезапуск Redis

```bash
sudo systemctl restart redis-server
```

### 4.3. Проверка подключения

```bash
redis-cli -a your_redis_password ping
# Ответ: PONG
```

---

##  5. Клонирование репозитория

### 5.1. Переключение на пользователя promptyflow

```bash
sudo su - promptyflow
```

### 5.2. Клонирование

```bash
cd ~
git clone https://github.com/your-username/Promptozaurus-saas.git
cd Promptozaurus-saas
```

### 5.3. Установка зависимостей

```bash
npm install
```

---

##  6. Настройка Backend

### 6.1. Создание .env файла

```bash
cd ~/Promptozaurus-saas/apps/api
nano .env.production
```

Добавьте переменные окружения:

```bash
# Environment
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# Database
DATABASE_URL="postgresql://promptyflow:your_secure_password@localhost:5432/promptyflow"

# Redis
REDIS_URL="redis://:your_redis_password@localhost:6379"

# JWT & Security
JWT_SECRET=<generate-64-char-random-string>
ENCRYPTION_KEY=<generate-32-byte-base64-string>
SESSION_SECRET=<generate-64-char-random-string>

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback

# CORS
CORS_ORIGIN=https://your-domain.com

# Frontend URL
FRONTEND_URL=https://your-domain.com
```

### 6.2. Генерация секретных ключей

```bash
# JWT_SECRET (64 символа hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ENCRYPTION_KEY (32 байта base64)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# SESSION_SECRET (64 символа hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6.3. Применение миграций Prisma

```bash
cd ~/Promptozaurus-saas/apps/api

# Загрузка переменных окружения
export $(cat .env.production | xargs)

# Применение миграций
npx prisma migrate deploy

# Генерация Prisma Client
npx prisma generate
```

### 6.4. Сборка Backend

```bash
cd ~/Promptozaurus-saas/apps/api
npm run build

# Проверка сборки
ls -la dist/
```

### 6.5. Настройка PM2

Создайте `ecosystem.config.js`:

```bash
cd ~/Promptozaurus-saas/apps/api
nano ecosystem.config.js
```

Содержимое:

```javascript
module.exports = {
  apps: [{
    name: 'promptyflow-api',
    script: './dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    watch: false
  }]
}
```

### 6.6. Запуск Backend через PM2

```bash
cd ~/Promptozaurus-saas/apps/api

# Создание директории для логов
mkdir -p logs

# Загрузка переменных окружения
export $(cat .env.production | xargs)

# Запуск приложения
pm2 start ecosystem.config.js --env production

# Проверка статуса
pm2 status

# Просмотр логов
pm2 logs promptyflow-api

# Сохранение конфигурации PM2
pm2 save
```

### 6.7. Проверка работы Backend

```bash
curl http://localhost:3001/health

# Ожидаемый ответ:
# {"status":"ok","timestamp":"...","redis":"connected"}
```

---

##  7. Настройка Frontend

### 7.1. Создание .env файла

```bash
cd ~/Promptozaurus-saas/apps/web
nano .env.production
```

Добавьте:

```bash
VITE_API_URL=https://your-domain.com
```

### 7.2. Сборка Frontend

```bash
cd ~/Promptozaurus-saas/apps/web

# Установка зависимостей
npm install

# Сборка production bundle
npm run build

# Проверка сборки
ls -la dist/
```

### 7.3. Копирование статических файлов

```bash
# Создание директории для frontend
sudo mkdir -p /var/www/promptyflow
sudo chown -R promptyflow:promptyflow /var/www/promptyflow

# Копирование собранных файлов
cp -r ~/Promptozaurus-saas/apps/web/dist/* /var/www/promptyflow/
```

---

##  8. Настройка Nginx

### 8.1. Создание конфигурации Nginx

```bash
sudo nano /etc/nginx/sites-available/promptyflow
```

Базовая конфигурация (HTTP):

```nginx
# HTTP конфигурация (временная, до установки SSL)
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    # Frontend
    root /var/www/promptyflow;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Frontend SPA routing
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Auth endpoints
    location /auth/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # AI endpoints
    location /ai/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Увеличенные таймауты для AI запросов
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
```

### 8.2. Активация конфигурации

```bash
# Создание символической ссылки
sudo ln -s /etc/nginx/sites-available/promptyflow /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации
sudo rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx
```

---

##  9. Установка SSL сертификата

### 9.1. Получение Let's Encrypt сертификата

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot автоматически:
1. Получит сертификат
2. Настроит Nginx для HTTPS
3. Настроит автоматическое обновление

### 9.2. Проверка автоматического обновления

```bash
sudo certbot renew --dry-run
```

### 9.3. Финальная конфигурация Nginx (после SSL)

Certbot автоматически обновит конфигурацию, добавив:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (добавлены Certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ... остальная конфигурация ...
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

##  10. Обновление приложения

### 10.1. Создание скрипта обновления

```bash
nano ~/Promptozaurus-saas/deploy.sh
```

Содержимое:

```bash
#!/bin/bash

set -e

echo " Starting deployment..."

# 1. Pull latest changes
echo " Pulling latest code..."
cd ~/Promptozaurus-saas
git pull origin main

# 2. Install dependencies
echo " Installing dependencies..."
npm install

# 3. Build Backend
echo " Building backend..."
cd apps/api
npm run build

# 4. Apply migrations
echo " Applying database migrations..."
export $(cat .env.production | xargs)
npx prisma migrate deploy

# 5. Build Frontend
echo " Building frontend..."
cd ../web
npm run build

# 6. Copy frontend files
echo " Copying frontend files..."
sudo cp -r dist/* /var/www/promptyflow/

# 7. Restart backend
echo " Restarting backend..."
pm2 restart promptyflow-api

# 8. Reload Nginx
echo " Reloading Nginx..."
sudo systemctl reload nginx

echo " Deployment completed successfully!"
```

Сделайте скрипт исполняемым:

```bash
chmod +x ~/Promptozaurus-saas/deploy.sh
```

### 10.2. Запуск обновления

```bash
cd ~/Promptozaurus-saas
./deploy.sh
```

---

##  11. Мониторинг и логирование

### 11.1. Просмотр логов PM2

```bash
# Все логи
pm2 logs promptyflow-api

# Только ошибки
pm2 logs promptyflow-api --err

# Последние 100 строк
pm2 logs promptyflow-api --lines 100

# Очистка логов
pm2 flush
```

### 11.2. Просмотр логов Nginx

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### 11.3. Мониторинг системы

```bash
# Мониторинг процессов PM2
pm2 monit

# Статус сервисов
sudo systemctl status postgresql
sudo systemctl status redis-server
sudo systemctl status nginx

# Использование ресурсов
htop
```

### 11.4. Настройка ротации логов

Создайте `/etc/logrotate.d/promptyflow`:

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

##  12. Настройка Google OAuth

### 12.1. Обновление Authorized Redirect URIs

1. Зайдите в [Google Cloud Console](https://console.cloud.google.com)
2. Перейдите в APIs & Services → Credentials
3. Выберите ваш OAuth Client
4. В "Authorized redirect URIs" добавьте:
   ```
   https://your-domain.com/auth/google/callback
   ```

### 12.2. Обновление Authorized JavaScript origins

```
https://your-domain.com
```

---

##  13. Безопасность

### 13.1. Настройка fail2ban

```bash
sudo apt install -y fail2ban

# Создание конфигурации для Nginx
sudo nano /etc/fail2ban/jail.local
```

Добавьте:

```ini
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-noscript]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 6
```

Перезапустите fail2ban:

```bash
sudo systemctl restart fail2ban
sudo fail2ban-client status
```

### 13.2. Ограничение SSH доступа

```bash
sudo nano /etc/ssh/sshd_config
```

Измените:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Перезапустите SSH:

```bash
sudo systemctl restart sshd
```

### 13.3. Автоматические обновления безопасности

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

##  14. Резервное копирование

### 14.1. Создание скрипта бэкапа

```bash
sudo nano /usr/local/bin/backup-promptyflow.sh
```

Содержимое:

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/promptyflow"
DATE=$(date +%Y%m%d_%H%M%S)

# Создание директории
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
echo "Backing up PostgreSQL..."
sudo -u postgres pg_dump promptyflow | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup Redis
echo "Backing up Redis..."
sudo cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Backup приложения
echo "Backing up application files..."
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /home/promptyflow Promptozaurus-saas

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR"
```

Сделайте исполняемым:

```bash
sudo chmod +x /usr/local/bin/backup-promptyflow.sh
```

### 14.2. Настройка cron для автоматических бэкапов

```bash
sudo crontab -e
```

Добавьте (ежедневно в 3:00 AM):

```
0 3 * * * /usr/local/bin/backup-promptyflow.sh >> /var/log/promptyflow-backup.log 2>&1
```

---

##  Checklist развертывания

- [ ] Ubuntu сервер подготовлен и обновлен
- [ ] Firewall настроен (UFW)
- [ ] Node.js 20.x установлен
- [ ] PostgreSQL 14+ установлен и настроен
- [ ] Redis 7+ установлен и настроен
- [ ] Nginx установлен
- [ ] PM2 установлен
- [ ] Репозиторий склонирован
- [ ] Backend .env.production настроен
- [ ] Frontend .env.production настроен
- [ ] Миграции Prisma применены
- [ ] Backend собран и запущен через PM2
- [ ] Frontend собран и скопирован в /var/www
- [ ] Nginx настроен
- [ ] SSL сертификат установлен (Let's Encrypt)
- [ ] Google OAuth redirect URIs обновлены
- [ ] Health check возвращает 200
- [ ] Login через Google работает
- [ ] Dashboard загружается корректно
- [ ] Скрипт обновления (deploy.sh) создан
- [ ] fail2ban настроен
- [ ] Резервное копирование настроено

---

##  Troubleshooting

### Backend не запускается

```bash
# Проверка логов PM2
pm2 logs promptyflow-api --err

# Проверка переменных окружения
pm2 env 0

# Перезапуск
pm2 restart promptyflow-api
```

### PostgreSQL connection failed

```bash
# Проверка статуса
sudo systemctl status postgresql

# Проверка подключения
psql -U promptyflow -d promptyflow -h 127.0.0.1

# Проверка логов
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Redis connection failed

```bash
# Проверка статуса
sudo systemctl status redis-server

# Проверка подключения
redis-cli -a your_redis_password ping

# Проверка логов
sudo tail -f /var/log/redis/redis-server.log
```

### Nginx 502 Bad Gateway

```bash
# Проверка backend
curl http://localhost:3001/health

# Проверка конфигурации Nginx
sudo nginx -t

# Проверка логов
sudo tail -f /var/log/nginx/error.log
```

### SSL сертификат не обновляется

```bash
# Проверка статуса Certbot
sudo certbot certificates

# Принудительное обновление
sudo certbot renew --force-renewal

# Проверка cron задачи
sudo systemctl status certbot.timer
```

---

##  Полезные команды

### PM2

```bash
pm2 list                    # Список процессов
pm2 restart promptyflow-api # Перезапуск
pm2 stop promptyflow-api    # Остановка
pm2 delete promptyflow-api  # Удаление
pm2 monit                   # Мониторинг
pm2 save                    # Сохранение конфигурации
```

### Nginx

```bash
sudo nginx -t               # Проверка конфигурации
sudo systemctl restart nginx # Перезапуск
sudo systemctl reload nginx  # Перезагрузка конфигурации
sudo systemctl status nginx  # Статус
```

### PostgreSQL

```bash
sudo systemctl restart postgresql # Перезапуск
sudo -u postgres psql            # Вход в psql
pg_dump promptyflow > backup.sql # Бэкап
psql promptyflow < backup.sql    # Восстановление
```

### Redis

```bash
sudo systemctl restart redis-server # Перезапуск
redis-cli -a password              # Подключение
redis-cli -a password FLUSHALL     # Очистка
```

---

**Дата создания:** 05.12.2025  
**Версия:** 2.0 (Self-Hosted Ubuntu)  
**Статус:** Production Ready 
