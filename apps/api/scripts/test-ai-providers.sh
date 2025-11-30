#!/bin/bash

# AI Provider Testing Script
# Тестирует реальные ответы от всех AI провайдеров

set -e

echo "🧪 AI Provider Testing Suite"
echo "=============================="
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Проверка переменных окружения
check_env_var() {
  if [ -z "${!1}" ]; then
    echo -e "${YELLOW}⚠️  $1 не установлена${NC}"
    return 1
  else
    echo -e "${GREEN}✅ $1 установлена${NC}"
    return 0
  fi
}

echo "📋 Проверка API ключей:"
echo "----------------------"

HAS_OPENAI=0
HAS_ANTHROPIC=0
HAS_GEMINI=0
HAS_OPENROUTER=0
HAS_GROK=0

check_env_var "OPENAI_API_KEY" && HAS_OPENAI=1 || true
check_env_var "ANTHROPIC_API_KEY" && HAS_ANTHROPIC=1 || true
check_env_var "GEMINI_API_KEY" && HAS_GEMINI=1 || true
check_env_var "OPENROUTER_API_KEY" && HAS_OPENROUTER=1 || true
check_env_var "GROK_API_KEY" && HAS_GROK=1 || true

echo ""
echo "📊 Запуск тестов:"
echo "----------------"

# Переход в директорию API
cd "$(dirname "$0")/../"

# Функция для запуска тестов
run_tests() {
  local test_type=$1
  local description=$2
  
  echo ""
  echo -e "${BLUE}🧪 $description${NC}"
  
  if npm test -- $test_type; then
    echo -e "${GREEN}✅ $description - PASSED${NC}"
    return 0
  else
    echo -e "${RED}❌ $description - FAILED${NC}"
    return 1
  fi
}

# Счетчики
TOTAL=0
PASSED=0
FAILED=0

# Unit тесты провайдеров
if run_tests "ai-providers.test.ts" "Integration Tests (AI Providers)"; then
  PASSED=$((PASSED + 1))
else
  FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# E2E тесты API
if run_tests "ai-e2e.test.ts" "E2E Tests (AI API Endpoints)"; then
  PASSED=$((PASSED + 1))
else
  FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# Итоги
echo ""
echo "=============================="
echo "📈 Результаты тестирования:"
echo "=============================="
echo -e "Всего тестов: ${BLUE}$TOTAL${NC}"
echo -e "Успешно: ${GREEN}$PASSED${NC}"
echo -e "Провалено: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 Все тесты пройдены успешно!${NC}"
  exit 0
else
  echo -e "${RED}❌ Некоторые тесты провалились${NC}"
  exit 1
fi

