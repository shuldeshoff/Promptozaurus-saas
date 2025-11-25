# Testing Guide

## Completed Tests

### ✅ Unit Tests (14/14 passed)

Unit-тесты для `ProjectService` полностью покрывают бизнес-логику:

- **getUserProjects** - получение списка проектов пользователя
- **getProjectById** - получение проекта по ID
- **createProject** - создание нового проекта
- **updateProject** - обновление проекта
- **deleteProject** - удаление проекта
- **duplicateProject** - дублирование проекта
- **canCreateProject** - проверка лимита проектов
- **getProjectCount** - подсчет проектов
- **exportProject** - экспорт проекта в JSON
- **importProject** - импорт проекта из JSON

### Running Unit Tests

```bash
cd apps/api
npm test -- --run
```

Unit-тесты используют моки для Prisma Client, поэтому не требуют базы данных.

## Integration & E2E Tests

Integration и E2E тесты требуют настройки тестовой базы данных.

### Setup Test Database

1. Создайте файл `.env.test` в `apps/api/`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/promptozaurus_test"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="test-jwt-secret"
```

2. Создайте тестовую базу данных:

```bash
createdb promptozaurus_test
```

3. Примените миграции:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/promptozaurus_test" npx prisma migrate deploy
```

### Running Integration Tests

```bash
cd apps/api
NODE_ENV=test npm test -- --run
```

## Test Coverage

Для проверки покрытия кода тестами:

```bash
cd apps/api
npm run test:coverage
```

## Manual API Testing

Для ручного тестирования API можно использовать:

### 1. curl

```bash
# Get all projects
curl http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create project
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Project"}'
```

### 2. Postman / Insomnia

Импортируйте коллекцию API endpoints:

- GET `/api/projects` - список проектов
- GET `/api/projects/:id` - получить проект
- POST `/api/projects` - создать проект
- PATCH `/api/projects/:id` - обновить проект  
- DELETE `/api/projects/:id` - удалить проект
- POST `/api/projects/:id/duplicate` - дублировать
- POST `/api/projects/import` - импортировать
- GET `/api/projects/:id/export` - экспортировать

## Test Scenarios Covered

### Project CRUD
- ✅ Создание проекта
- ✅ Получение списка проектов
- ✅ Получение проекта по ID
- ✅ Обновление проекта
- ✅ Удаление проекта

### Business Logic
- ✅ Лимит 10 проектов на пользователя
- ✅ Проверка владельца проекта
- ✅ Дублирование проектов
- ✅ Импорт/экспорт JSON

### Validation
- ✅ Валидация входных данных
- ✅ 404 для несуществующих проектов
- ✅ 403 при превышении лимита
- ✅ Проверка прав доступа

## Notes

- Unit-тесты полностью функциональны и не требуют внешних зависимостей
- Integration/E2E тесты требуют настройки тестовой БД
- Для production deployment рекомендуется настроить CI/CD с автоматическим запуском тестов

