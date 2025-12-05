# 🏗️ Архитектура PromptyFlow SaaS

## 📋 Содержание

1. [Обзор системы](#обзор-системы)
2. [Технологический стек](#технологический-стек)
3. [Структура проекта](#структура-проекта)
4. [Frontend архитектура](#frontend-архитектура)
5. [Backend архитектура](#backend-архитектура)
6. [База данных](#база-данных)
7. [AI интеграция](#ai-интеграция)
8. [Безопасность](#безопасность)
9. [Производительность](#производительность)
10. [Масштабируемость](#масштабируемость)

---

## Обзор системы

PromptyFlow — это облачное SaaS-приложение для работы с AI-промптами. Приложение построено как **монорепозиторий** на TypeScript с использованием современного стека технологий.

### Основные компоненты

```
┌─────────────────────────────────────────────────────────────────┐
│                      PromptyFlow SaaS                            │
├──────────────────┬──────────────────────┬───────────────────────┤
│    Frontend      │       Backend        │       Shared          │
│   (apps/web)     │      (apps/api)      │  (packages/shared)    │
│                  │                      │                       │
│  React 18.3      │  Fastify 4.28        │  TypeScript Types     │
│  Vite 5.4        │  TypeScript 5.6      │  Zod Schemas          │
│  TanStack Query  │  PostgreSQL 14+      │  Validation           │
│  Zustand         │  Prisma ORM 5.22     │                       │
│  Tailwind CSS    │  Redis 7+            │                       │
│  i18next         │  Winston Logger      │                       │
│                  │                      │                       │
└──────────────────┴──────────────────────┴───────────────────────┘
```

### Ключевые возможности

- **Управление промптами**: создание, редактирование, организация промптов в блоки
- **Контекстные блоки**: структурирование больших объемов текста с поддержкой вложенности
- **AI интеграция**: поддержка 5 провайдеров (OpenAI, Anthropic, Gemini, Grok, OpenRouter)
- **Визуальный селектор**: drag-select для выбора контекста как в файловых менеджерах
- **Разделение текста**: интеллектуальное разбиение на части по границам предложений
- **Шаблоны**: библиотека переиспользуемых промптов с полнотекстовым поиском
- **Мультиязычность**: русский и английский интерфейс
- **OAuth аутентификация**: вход через Google

---

## Технологический стек

### Frontend (apps/web)

| Категория | Технологии | Назначение |
|-----------|------------|------------|
| **Основа** | React 18.3, TypeScript 5.6, Vite 5.4 | Фреймворк, типизация, сборщик |
| **Стилизация** | Tailwind CSS 3.4 | Utility-first CSS фреймворк |
| **State Management** | TanStack Query v5, Zustand | Server state и client state |
| **HTTP** | Axios 1.7 | HTTP клиент с interceptors |
| **Routing** | React Router 6 | Клиентская маршрутизация |
| **i18n** | react-i18next 15+ | Интернационализация (ru/en) |
| **UI Components** | @dnd-kit, react-syntax-highlighter | Drag-and-drop, подсветка кода |
| **Notifications** | react-hot-toast | Toast уведомления |

### Backend (apps/api)

| Категория | Технологии | Назначение |
|-----------|------------|------------|
| **Основа** | Fastify 4.28, TypeScript 5.6 | Быстрый веб-фреймворк |
| **База данных** | PostgreSQL 14+, Prisma ORM 5.22 | Реляционная БД и ORM |
| **Кеширование** | Redis 7+ | In-memory кеш для моделей AI |
| **Аутентификация** | Google OAuth 2.0, JWT | Вход через Google |
| **Шифрование** | Node.js crypto (AES-256-GCM) | Шифрование API ключей |
| **Логирование** | Winston | Структурированные логи |
| **Валидация** | Zod | Runtime validation |

### AI Провайдеры

| Провайдер | Модели | Особенности |
|-----------|--------|-------------|
| **OpenAI** | GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-5.1 | Поддержка нового `/v1/responses` API |
| **Anthropic** | Claude 4.5, Claude 4, Claude 3.5 (Sonnet/Opus/Haiku) | Все последние модели |
| **Google Gemini** | Gemini 2.5/1.5 Flash, Pro | API v1beta |
| **X.AI Grok** | Grok Beta, Grok Vision | Новый провайдер |
| **OpenRouter** | 100+ моделей | Агрегатор AI моделей |

---

## Структура проекта

```
Promptozaurus-saas/
│
├── apps/
│   │
│   ├── web/                                 # Frontend приложение
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── layout/                 # Компоненты макета
│   │   │   │   │   ├── Header.tsx          # Шапка с навигацией
│   │   │   │   │   ├── MainLayout.tsx      # Основной layout
│   │   │   │   │   └── NavigationPanel.tsx # Панель проектов
│   │   │   │   │
│   │   │   │   ├── context/                # Управление контекстом
│   │   │   │   │   ├── ContextEditor.tsx
│   │   │   │   │   ├── ContextItem.tsx
│   │   │   │   │   └── SplitModal.tsx
│   │   │   │   │
│   │   │   │   ├── prompt/                 # Управление промптами
│   │   │   │   │   ├── PromptEditor.tsx
│   │   │   │   │   └── PromptItem.tsx
│   │   │   │   │
│   │   │   │   ├── context-selection/      # Визуальный селектор
│   │   │   │   │   └── ContextSelectionPanel.tsx
│   │   │   │   │
│   │   │   │   ├── ui/                     # Переиспользуемые компоненты
│   │   │   │   ├── AIConfigModal.tsx
│   │   │   │   ├── AIResponseModal.tsx
│   │   │   │   ├── ProjectList.tsx
│   │   │   │   └── ConfirmationModal.tsx
│   │   │   │
│   │   │   ├── pages/
│   │   │   │   ├── LandingPage.tsx
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── AuthCallbackPage.tsx
│   │   │   │   └── ErrorPage.tsx
│   │   │   │
│   │   │   ├── hooks/                      # Кастомные хуки
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useProjects.ts
│   │   │   │   ├── useAI.ts
│   │   │   │   ├── useAIModels.ts
│   │   │   │   ├── useProjectUpdate.ts
│   │   │   │   └── useTemplates.ts
│   │   │   │
│   │   │   ├── context/                    # React Context
│   │   │   │   ├── EditorContext.tsx
│   │   │   │   └── ConfirmationContext.tsx
│   │   │   │
│   │   │   ├── store/                      # Zustand stores
│   │   │   │   ├── auth.store.ts
│   │   │   │   └── offline.store.ts
│   │   │   │
│   │   │   ├── lib/                        # Core утилиты
│   │   │   │   ├── api.ts
│   │   │   │   ├── queryClient.ts
│   │   │   │   └── i18n.ts
│   │   │   │
│   │   │   ├── locales/                    # Переводы
│   │   │   │   ├── ru/
│   │   │   │   │   ├── common.json
│   │   │   │   │   ├── editor.json
│   │   │   │   │   ├── aiConfig.json
│   │   │   │   │   └── providers.json
│   │   │   │   └── en/ (аналогично)
│   │   │   │
│   │   │   ├── utils/                      # Хелперы
│   │   │   └── data/                       # Статические данные
│   │   │
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   └── api/                                # Backend приложение
│       ├── src/
│       │   ├── index.ts                    # Точка входа
│       │   │
│       │   ├── routes/                     # API endpoints
│       │   │   ├── auth.routes.ts          # OAuth, JWT refresh
│       │   │   ├── project.routes.ts       # CRUD проектов
│       │   │   ├── context.routes.ts       # Контекстные блоки
│       │   │   ├── prompt.routes.ts        # Блоки промптов
│       │   │   ├── template.routes.ts      # Библиотека шаблонов
│       │   │   ├── ai.routes.ts            # AI интеграция
│       │   │   └── user.routes.ts          # Профиль, API ключи
│       │   │
│       │   ├── services/                   # Бизнес-логика
│       │   │   ├── project.service.ts
│       │   │   ├── template.service.ts
│       │   │   ├── user.service.ts
│       │   │   ├── modelsCache.service.ts
│       │   │   └── encryption.service.ts
│       │   │
│       │   ├── providers/                  # AI провайдеры
│       │   │   ├── base.provider.ts
│       │   │   ├── openai.provider.ts
│       │   │   ├── anthropic.provider.ts
│       │   │   ├── gemini.provider.ts
│       │   │   ├── grok.provider.ts
│       │   │   └── openrouter.provider.ts
│       │   │
│       │   ├── middleware/                 # Middleware
│       │   │   ├── auth.middleware.ts
│       │   │   ├── errorHandler.ts
│       │   │   └── cors.ts
│       │   │
│       │   ├── lib/                        # Core утилиты
│       │   │   ├── prisma.ts
│       │   │   ├── redis.ts
│       │   │   └── logger.ts
│       │   │
│       │   └── utils/
│       │       └── prompt.utils.ts
│       │
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       │
│       ├── scripts/
│       └── package.json
│
└── packages/
    └── shared/                             # Общие типы
        ├── src/
        │   ├── types.ts
        │   ├── schemas.ts
        │   └── index.ts
        └── package.json
```

---

## Frontend архитектура

### Иерархия компонентов

```
App.tsx
│
├─ ErrorBoundary                            # Перехват ошибок React
│  └─ QueryClientProvider                   # TanStack Query
│     └─ ConfirmationProvider               # Модалки подтверждения
│        │
│        ├─ LandingPage                     # Для гостей
│        │  ├─ Header (guest)
│        │  ├─ Hero
│        │  ├─ Features
│        │  └─ Footer
│        │
│        └─ DashboardPage                   # Для пользователей
│           └─ EditorProvider               # Состояние редактора
│              └─ MainLayout
│                 │
│                 ├─ Header (authorized)
│                 │  ├─ Project selector
│                 │  ├─ AI config
│                 │  ├─ Language switcher
│                 │  └─ User menu
│                 │
│                 ├─ NavigationPanel         # Левая панель
│                 │  ├─ ProjectList
│                 │  └─ "Create project"
│                 │
│                 ├─ BlocksPanel             # Центральная панель
│                 │  ├─ Tabs: Context | Prompts
│                 │  ├─ Blocks list
│                 │  └─ "Create block"
│                 │
│                 └─ EditorPanel             # Правая панель
│                    ├─ ContextEditor
│                    │  ├─ Title
│                    │  ├─ Items (drag-drop)
│                    │  ├─ SubItems
│                    │  ├─ Split modal
│                    │  └─ Export
│                    │
│                    └─ PromptEditor
│                       ├─ Template
│                       ├─ Context selector
│                       ├─ Preview
│                       └─ AI send
```

### Управление состоянием

**1. Server State (TanStack Query)**

Автоматическая синхронизация с сервером:

```typescript
// GET запросы
useProjects()          // Список проектов
useProject(id)         // Один проект
useTemplates()         // Шаблоны
useAIModels()          // AI модели

// Мутации
useUpdateProject()     // Обновить проект
useDeleteProject()     // Удалить проект
useSendToAI()          // Отправить в AI
```

**Преимущества:**
- Автоматическое кеширование
- Фоновое обновление
- Optimistic updates
- Retry на ошибках
- Дедупликация запросов

**2. Client State (Zustand)**

Глобальное клиентское состояние:

```typescript
// auth.store.ts - аутентификация
{
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  login()
  logout()
  updateToken()
}

// offline.store.ts - оффлайн режим
{
  pendingChanges: Change[]
  addPendingChange()
  syncChanges()
}
```

**3. Context API**

UI состояние для глубокой передачи:

```typescript
// EditorContext - состояние редактора
{
  activeTab: 'context' | 'prompts'
  activeContextBlockId: number | null
  activePromptBlockId: number | null
  expandedItems: Set<number>
}

// ConfirmationContext - модалки
{
  confirm(message)
  alert(message)
}
```

**4. Local State (useState)**

Локальное состояние компонента:

```typescript
const [editingName, setEditingName] = useState(false)
const [localTitle, setLocalTitle] = useState(block.title)
```

### Ключевые паттерны

**Optimistic Updates**

UI обновляется немедленно, откатывается при ошибке:

```typescript
useMutation({
  onMutate: async (newData) => {
    await queryClient.cancelQueries(['projects'])
    const previous = queryClient.getQueryData(['projects'])
    queryClient.setQueryData(['projects'], optimisticData)
    return { previous }
  },
  onError: (err, data, context) => {
    queryClient.setQueryData(['projects'], context.previous)
  }
})
```

**Debounced Auto-Save**

Задержка сохранения на 500мс:

```typescript
const debouncedSave = useMemo(
  () => debounce((data) => updateProject.mutate(data), 500),
  []
)

const handleChange = (content) => {
  setLocalContent(content)  // Немедленно
  debouncedSave(content)    // С задержкой
}
```

**Offline Support**

Сохранение в localStorage при отсутствии сети:

```typescript
onError: (error) => {
  if (!navigator.onLine) {
    offlineStore.addPendingChange(data)
    toast.info('Оффлайн: изменения сохранены локально')
  }
}
```

---

## Backend архитектура

### Слоистая архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    ROUTES LAYER                          │
│  • HTTP маршрутизация                                    │
│  • Валидация запросов (Zod)                              │
│  • Middleware (auth, CORS, rate limit)                   │
│  • Обработка ошибок                                      │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                          │
│  • Бизнес-логика                                         │
│  • Авторизация (проверка владельца)                      │
│  • Валидация бизнес-правил                               │
│  • Трансформация данных                                  │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│                 DATA ACCESS LAYER                        │
│  • Операции с БД (Prisma)                                │
│  • Кеширование (Redis)                                   │
│  • Внешние API (AI провайдеры)                          │
│  • Шифрование/дешифрование                               │
└─────────────────────────────────────────────────────────┘
```

### RESTful API

```
📁 Authentication
POST   /auth/google                 # OAuth callback
POST   /auth/refresh                # Refresh access token

📁 User Profile
GET    /api/user                    # Получить профиль
PATCH  /api/user                    # Обновить профиль
POST   /api/user/api-keys/:provider # Добавить API ключ
DELETE /api/user/api-keys/:provider # Удалить API ключ
GET    /api/user/api-keys           # Список ключей

📁 Projects
GET    /api/projects                # Список проектов
POST   /api/projects                # Создать проект
GET    /api/projects/:id            # Получить проект
PATCH  /api/projects/:id            # Обновить проект
DELETE /api/projects/:id            # Удалить проект

📁 Context Blocks
PATCH  /api/projects/:id/context-blocks        # Обновить
GET    /api/projects/:id/context-blocks/stats  # Статистика

📁 Prompt Blocks
PATCH  /api/projects/:id/prompt-blocks         # Обновить
POST   /api/projects/:id/prompt-blocks/compile # Скомпилировать

📁 Templates
GET    /api/templates               # Список шаблонов
GET    /api/templates/search?q=     # Поиск (full-text)
POST   /api/templates               # Создать
PATCH  /api/templates/:id           # Обновить
DELETE /api/templates/:id           # Удалить

📁 AI Integration
GET    /ai/models                   # Доступные модели
POST   /ai/send                     # Отправить запрос
POST   /ai/test-connection          # Тест API ключа
```

### Service Layer

Пример ProjectService:

```typescript
class ProjectService {
  // Получить все проекты пользователя
  async getUserProjects(userId: string): Promise<Project[]> {
    return prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    })
  }

  // Обновить с валидацией
  async updateProject(
    projectId: string,
    userId: string,
    input: UpdateProjectInput
  ): Promise<Project> {
    // 1. Проверка владельца
    const project = await this.getProjectById(projectId, userId)
    
    // 2. Валидация размера
    if (input.data) {
      const validation = this.validateProjectSize(input.data)
      if (!validation.valid) {
        throw new Error(validation.error)
      }
    }
    
    // 3. Обновление
    return prisma.project.update({
      where: { id: projectId },
      data: input
    })
  }

  // Валидация лимитов
  validateProjectSize(data: ProjectData) {
    const MAX_PROJECT_SIZE = 10_000_000  // 10M символов
    const MAX_BLOCK_SIZE = 5_000_000     // 5M символов
    
    const { totalChars, largestBlockChars } = 
      this.calculateProjectSize(data)
    
    if (largestBlockChars > MAX_BLOCK_SIZE) {
      return { 
        valid: false, 
        error: \`Блок превышает лимит\` 
      }
    }
    
    if (totalChars > MAX_PROJECT_SIZE) {
      return { 
        valid: false, 
        error: \`Проект превышает лимит\` 
      }
    }
    
    return { valid: true }
  }

  // Подсчет символов
  calculateProjectSize(data: ProjectData) {
    let totalChars = 0
    let largestBlockChars = 0

    for (const block of data.contextBlocks || []) {
      let blockChars = 0
      
      for (const item of block.items || []) {
        // Если есть subItems, считаем только их
        if (item.subItems?.length > 0) {
          blockChars += item.subItems.reduce(
            (sum, sub) => sum + (sub.chars || 0), 
            0
          )
        } else {
          blockChars += item.chars || 0
        }
      }
      
      totalChars += blockChars
      largestBlockChars = Math.max(largestBlockChars, blockChars)
    }

    return { totalChars, largestBlockChars }
  }
}
```

### Provider Pattern

Единый интерфейс для AI провайдеров:

```typescript
// Базовый класс
abstract class BaseProvider {
  protected apiKey: string
  protected baseUrl: string

  abstract getModels(apiKey?: string): Promise<AIModel[]>
  abstract sendMessage(options: SendMessageOptions): Promise<string>
  abstract testConnection(apiKey: string): Promise<boolean>
  
  protected getFallbackModels(): AIModel[] {
    return []
  }
}

// OpenAI реализация
class OpenAIProvider extends BaseProvider {
  protected getDefaultBaseUrl() {
    return 'https://api.openai.com'
  }

  async sendMessage(options: SendMessageOptions): Promise<string> {
    const { apiKey, model, messages, temperature, maxTokens } = options

    // GPT-5.1 использует другой endpoint
    const isGpt5 = model.startsWith('gpt-5')
    const endpoint = isGpt5 ? '/v1/responses' : '/v1/chat/completions'

    // Разный формат запроса
    const requestBody = isGpt5 
      ? {
          model,
          input: messages.map(m => m.content).join('\n'),
          temperature,
          max_output_tokens: maxTokens
        }
      : {
          model,
          messages,
          temperature,
          max_tokens: maxTokens
        }

    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()

    // Разный формат ответа
    if (isGpt5) {
      const msg = data.output?.find(i => i.type === 'message')
      const text = msg?.content?.find(c => c.type === 'output_text')?.text
      return text || ''
    }

    return data.choices[0]?.message?.content || ''
  }
}
```

### Middleware

**Authentication**

```typescript
async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization
  
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Unauthorized' })
  }
  
  const token = authHeader.substring(7)
  const decoded = jwt.verify(token, process.env.JWT_SECRET!)
  
  request.user = {
    userId: decoded.userId,
    email: decoded.email
  }
}
```

**Error Handler**

```typescript
function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  logger.error('Request error:', {
    error: error.message,
    url: request.url,
    method: request.method
  })

  if (error.message.includes('превышает лимит')) {
    return reply.code(413).send({
      error: 'PAYLOAD_TOO_LARGE',
      message: error.message
    })
  }

  return reply.code(500).send({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Внутренняя ошибка сервера'
  })
}
```

---

## База данных

### Схема PostgreSQL

```prisma
model User {
  id          String    @id @default(cuid())
  googleId    String    @unique
  email       String    @unique
  name        String?
  picture     String?
  lastLoginAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  projects  Project[]
  templates Template[]
  apiKeys   ApiKey[]

  @@index([googleId])
  @@index([email])
}

model Project {
  id        String   @id @default(cuid())
  userId    String
  name      String
  data      Json     // ProjectData JSONB
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([updatedAt])
}

model Template {
  id         String   @id @default(cuid())
  userId     String
  name       String
  content    String   @db.Text
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Full-text search
  name_tsv    Unsupported("tsvector")?
  content_tsv Unsupported("tsvector")?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([name_tsv], type: Gin)
  @@index([content_tsv], type: Gin)
}

model ApiKey {
  id           String   @id @default(cuid())
  userId       String
  provider     String   // openai | anthropic | gemini | grok | openrouter
  encryptedKey String   @db.Text
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, provider])
  @@index([userId])
}
```

### Типы данных (JSONB)

```typescript
interface ProjectData {
  contextBlocks: ContextBlock[]
  promptBlocks: PromptBlock[]
}

interface ContextBlock {
  id: number
  title: string
  items: ContextItem[]
}

interface ContextItem {
  id: number
  title: string
  content: string
  chars: number
  subItems?: SubItem[]
}

interface SubItem {
  id: number
  title: string
  content: string
  chars: number
}

interface PromptBlock {
  id: number
  title: string
  template: string
  wrapInTags: boolean
  selectedContext: SelectedContext[]
}

interface SelectedContext {
  blockId: number
  itemId: number
  subItemId?: number
  order: number
}
```

### Индексы и оптимизации

**1. Full-Text Search**

```sql
-- Generated columns
ALTER TABLE templates 
ADD COLUMN name_tsv tsvector 
GENERATED ALWAYS AS (to_tsvector('english', name)) STORED;

-- GIN индексы
CREATE INDEX idx_templates_name_tsv 
ON templates USING gin(name_tsv);

CREATE INDEX idx_templates_content_tsv 
ON templates USING gin(content_tsv);
```

**Использование:**

```typescript
const results = await prisma.$queryRaw\`
  SELECT * FROM templates
  WHERE user_id = \${userId}
    AND (name_tsv @@ to_tsquery('english', \${query})
         OR content_tsv @@ to_tsquery('english', \${query}))
  ORDER BY ts_rank(name_tsv || content_tsv, to_tsquery('english', \${query})) DESC
  LIMIT 100
\`

// Результат: 1-11ms вместо 7-8 секунд
```

**2. Обычные индексы**

```sql
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_projects_updated_at ON projects(updated_at);
```

---

## AI интеграция

### Архитектура

```
CLIENT
  │ POST /ai/send
  │ { provider: 'openai', model: 'gpt-4o', messages: [...] }
  ▼
ROUTE HANDLER
  │ 1. Authenticate user
  │ 2. Get encrypted API key from DB
  │ 3. Decrypt API key
  ▼
PROVIDER FACTORY
  │ switch (provider) {
  │   case 'openai': return new OpenAIProvider()
  │   case 'anthropic': return new AnthropicProvider()
  │   ...
  │ }
  ▼
PROVIDER INSTANCE
  │ provider.sendMessage({ apiKey, model, messages, ... })
  ▼
AI API (OpenAI/Anthropic/Gemini/Grok/OpenRouter)
  │ HTTP request to external AI service
  ▼
AI RESPONSE
  │ { content: 'Generated text...', usage: {...} }
  ▼
RETURN TO CLIENT
  │ { success: true, response: 'Generated text...' }
```

### Поддерживаемые провайдеры

| Провайдер | Endpoint | Особенности |
|-----------|----------|-------------|
| **OpenAI** | api.openai.com | GPT-5.1: `/v1/responses`<br>Остальные: `/v1/chat/completions` |
| **Anthropic** | api.anthropic.com | `/v1/messages`<br>Claude 4.5 поддержка |
| **Gemini** | generativelanguage.googleapis.com | API v1beta |
| **Grok** | api.x.ai | X.AI API |
| **OpenRouter** | openrouter.ai | Агрегатор 100+ моделей |

### Кеширование моделей

```typescript
class ModelsCacheService {
  private CACHE_TTL = 3600 // 1 час

  async getModels(provider: string, apiKey?: string): Promise<AIModel[]> {
    const cacheKey = \`models:\${provider}\`
    
    // Проверяем Redis
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    // Запрашиваем у провайдера
    const models = await providerInstance.getModels(apiKey)

    // Сохраняем в Redis
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(models))

    return models
  }

  // Fallback если нет API ключа
  async getFallbackModels(provider: string): Promise<AIModel[]> {
    const providerInstance = this.getProviderInstance(provider)
    return providerInstance.getFallbackModels()
  }
}
```

---

## Безопасность

### Google OAuth 2.0 + JWT

**Поток аутентификации:**

```
1. USER CLICKS "Войти через Google"
   ▼
2. REDIRECT TO GOOGLE OAUTH
   https://accounts.google.com/o/oauth2/v2/auth?
     client_id=...
     redirect_uri=https://promptyflow.com/auth/google/callback
     scope=openid email profile
   ▼
3. USER AUTHORIZES
   Вводит логин/пароль Google
   ▼
4. GOOGLE REDIRECTS BACK
   https://promptyflow.com/auth/google/callback?code=<CODE>
   ▼
5. BACKEND EXCHANGES CODE FOR TOKENS
   POST https://oauth2.googleapis.com/token
   Body: { code, client_id, client_secret, ... }
   ▼
6. FETCH USER PROFILE
   GET https://www.googleapis.com/oauth2/v1/userinfo
   Headers: { Authorization: Bearer <access_token> }
   ▼
7. CREATE/UPDATE USER IN DB
   prisma.user.upsert({
     where: { googleId },
     create: { googleId, email, name, picture },
     update: { lastLoginAt: new Date() }
   })
   ▼
8. GENERATE JWT TOKENS
   Access Token (15 min): jwt.sign({ userId, email }, SECRET, { expiresIn: '15m' })
   Refresh Token (7 days): jwt.sign({ userId }, SECRET, { expiresIn: '7d' })
   ▼
9. REDIRECT TO FRONTEND
   https://promptyflow.com/#/auth/callback?
     access_token=...&refresh_token=...
   ▼
10. FRONTEND STORES TOKENS
   useAuthStore.login({ accessToken, refreshToken }, user)
   ▼
11. SUBSEQUENT REQUESTS
   axios.interceptors.request.use(config => {
     config.headers.Authorization = \`Bearer \${accessToken}\`
   })
```

### Шифрование API ключей

**AES-256-GCM:**

```typescript
class EncryptionService {
  private algorithm = 'aes-256-gcm'
  private key: Buffer // 32 bytes from env

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Формат: iv:authTag:encrypted
    return \`\${iv.toString('hex')}:\${authTag.toString('hex')}:\${encrypted}\`
  }

  decrypt(encrypted: string): string {
    const [ivHex, authTagHex, encryptedText] = encrypted.split(':')
    
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv)
    
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}
```

**Использование:**

```typescript
// Сохранение
const encryptedKey = encryptionService.encrypt(apiKey)
await prisma.apiKey.create({
  data: { userId, provider, encryptedKey }
})

// Получение
const record = await prisma.apiKey.findFirst({
  where: { userId, provider }
})
const apiKey = encryptionService.decrypt(record.encryptedKey)
```

### Best Practices

**1. SQL Injection**
- Prisma ORM (параметризованные запросы)
- Zod валидация входных данных

**2. XSS**
- React автоматически экранирует JSX
- CSP headers

**3. CORS**
```typescript
fastify.register(cors, {
  origin: 'https://promptyflow.com',
  credentials: true
})
```

**4. Rate Limiting**
```typescript
fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
})
```

---

## Производительность

### Frontend оптимизации

**1. Code Splitting**

```typescript
const LandingPage = lazy(() => import('./pages/LandingPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
```

**2. Memoization**

```typescript
const stats = useMemo(() => {
  return blocks.map(block => ({
    ...block,
    totalChars: calculateTotalChars(block)
  }))
}, [blocks])
```

**3. Debouncing**

```typescript
const debouncedSave = useMemo(
  () => debounce((data) => save(data), 500),
  []
)
```

### Backend оптимизации

**1. Database Indexes**

- B-tree индексы: `user_id`, `updated_at`
- GIN индексы: full-text search на `name_tsv`, `content_tsv`

**2. Redis Caching**

- AI models: 1 час TTL
- User sessions: 7 дней TTL

**3. Full-Text Search**

До: 7-8 секунд  
После: 1-11ms (700x быстрее)

**4. Connection Pooling**

- Prisma: 20 connections pool
- PgBouncer для масштабирования

---

## Масштабируемость

### Horizontal Scaling

```
               Nginx Load Balancer
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   Backend 1      Backend 2      Backend 3
   (Fastify)      (Fastify)      (Fastify)
        │              │              │
        └──────────────┼──────────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
       PostgreSQL             Redis
        (Primary)            (Cluster)
            │
     ┌──────┴──────┐
     │             │
     ▼             ▼
  Replica 1    Replica 2
 (Read-only)  (Read-only)
```

### Caching Strategy

```
┌────────────────────────────────────────────┐
│            CACHE LAYERS                    │
├────────────────────────────────────────────┤
│ L1: Browser (React Query)  5-15 min        │
│     • Projects, templates, AI models       │
│                                            │
│ L2: Redis (Backend)        1-24 hours      │
│     • AI models, sessions, rate limits     │
│                                            │
│ L3: PostgreSQL             Permanent       │
│     • Users, projects, templates, keys     │
└────────────────────────────────────────────┘
```

### Database Scaling

**1. Read Replicas**

```typescript
const prismaWrite = new PrismaClient({ url: PRIMARY_URL })
const prismaRead = new PrismaClient({ url: REPLICA_URL })

// Чтение
const projects = await prismaRead.project.findMany()

// Запись
await prismaWrite.project.create()
```

**2. Sharding (будущее)**

Разделение по `user_id` с consistent hashing.

**3. PgBouncer**

Connection pooling для эффективного использования соединений.

---

**Дата:** 05.12.2025  
**Версия:** 3.0  
**Статус:** Производственная версия
