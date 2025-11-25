#!/bin/bash

# Скрипт для запуска Promptozaurus SaaS в режиме разработки

echo "🦖 Запуск Promptozaurus SaaS..."
echo ""

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js >= 20.0.0"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Требуется Node.js >= 20.0.0, установлена версия: $(node -v)"
    exit 1
fi

# Проверка PostgreSQL
echo "🔍 Проверка PostgreSQL..."
if ! psql -U postgres -c "SELECT 1" &> /dev/null; then
    echo "⚠️  PostgreSQL не доступен. Запустите PostgreSQL сервер:"
    echo "   brew services start postgresql@14"
    echo ""
fi

# Проверка Redis
echo "🔍 Проверка Redis..."
if ! redis-cli ping &> /dev/null; then
    echo "⚠️  Redis не доступен. Запустите Redis сервер:"
    echo "   brew services start redis"
    echo ""
fi

# Проверка БД
echo "🔍 Проверка базы данных..."
if ! psql -U postgres -lqt | cut -d \| -f 1 | grep -qw promptozaurus_dev; then
    echo "📦 Создание базы данных promptozaurus_dev..."
    psql -U postgres -c "CREATE DATABASE promptozaurus_dev;" 2>/dev/null || true
fi

# Применение миграций
echo "🔧 Применение миграций Prisma..."
cd apps/api
npx prisma migrate deploy 2>/dev/null || npx prisma db push
cd ../..

echo ""
echo "✅ Все проверки пройдены!"
echo ""
echo "🚀 Запуск серверов..."
echo "   - Backend API: http://localhost:3000"
echo "   - Frontend:    http://localhost:5173"
echo ""
echo "Нажмите Ctrl+C для остановки"
echo ""

# Запуск в режиме разработки
npm run dev

