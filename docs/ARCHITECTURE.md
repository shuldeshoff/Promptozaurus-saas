# 🏗️ Архитектура PromptyFlow SaaS

## 📋 Содержание

1. [Обзор архитектуры](#обзор-архитектуры)
2. [Структура проекта](#структура-проекта)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Data Flow](#data-flow)
6. [Security](#security)
7. [Performance](#performance)
8. [Scalability](#scalability)

---

## Обзор архитектуры

PromptyFlow — это **monorepo** приложение, состоящее из трёх основных пакетов:

```
┌─────────────────────────────────────────────────────────────┐
│                    PromptyFlow SaaS                          │
├───────────────┬──────────────────────┬──────────────────────┤
│   Frontend    │      Backend         │       Shared         │
│  (apps/web)   │     (apps/api)       │   (packages/shared)  │
│               │                      │                      │
│  React + Vite │  Fastify + Prisma    │   Types + Schemas    │
│  TypeScript   │    TypeScript        │     TypeScript       │
│  TanStack     │    PostgreSQL        │        Zod           │
│   Query       │      Redis           │                      │
│               │                      │                      │
└───────────────┴──────────────────────┴──────────────────────┘
```

### Технологический стек

**Frontend:**
- **Framework:** React 18.3 + Vite 5
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3.4
- **State Management:** 
  - TanStack Query (server state)
  - Zustand (client state)
- **i18n:** react-i18next
- **HTTP:** Axios

**Backend:**
- **Framework:** Fastify 4
- **Language:** TypeScript 5
- **Database:** PostgreSQL 14+ (Prisma ORM 5)
- **Cache:** Redis 7+
- **Authentication:** Google OAuth 2.0 + JWT
- **Security:** AES-256-GCM encryption

**Shared:**
- **Validation:** Zod schemas
- **Types:** TypeScript interfaces

---

## Структура проекта

```
Promptozaurus-saas/
├── apps/
│   ├── web/                        # Frontend application
│   │   ├── src/
│   │   │   ├── components/         # React components
│   │   │   │   ├── layout/         # Layout components (Header, MainLayout, etc.)
│   │   │   │   ├── context/        # Context management UI
│   │   │   │   ├── prompt/         # Prompt management UI
│   │   │   │   ├── context-selection/ # Visual context selector
│   │   │   │   └── ui/             # Reusable UI components
│   │   │   ├── pages/              # Application pages
│   │   │   │   ├── LandingPage.tsx
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   └── ErrorPage.tsx
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useProjects.ts
│   │   │   │   ├── useAI.ts
│   │   │   │   └── useProjectUpdate.ts
│   │   │   ├── context/            # React Context providers
│   │   │   │   ├── EditorContext.tsx
│   │   │   │   └── ConfirmationContext.tsx
│   │   │   ├── store/              # Zustand stores
│   │   │   │   ├── auth.store.ts
│   │   │   │   └── offline.store.ts
│   │   │   ├── lib/                # Core utilities
│   │   │   │   ├── api.ts          # Axios instance
│   │   │   │   ├── queryClient.ts  # TanStack Query setup
│   │   │   │   └── i18n.ts         # i18next config
│   │   │   ├── locales/            # Translations (ru/en)
│   │   │   │   ├── ru/
│   │   │   │   │   ├── common.json
│   │   │   │   │   ├── editor.json
│   │   │   │   │   └── aiConfig.json
│   │   │   │   └── en/
│   │   │   │       └── (same structure)
│   │   │   ├── utils/              # Helper functions
│   │   │   │   ├── nameGenerators.ts
│   │   │   │   └── contextCalculations.ts
│   │   │   └── data/               # Static data
│   │   │       └── quickHelp.ts
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── api/                        # Backend application
│       ├── src/
│       │   ├── index.ts            # Entry point
│       │   ├── routes/             # API endpoints
│       │   │   ├── auth.routes.ts  # /api/auth/*
│       │   │   ├── project.routes.ts # /api/projects/*
│       │   │   ├── context.routes.ts # /api/projects/:id/context-blocks
│       │   │   ├── prompt.routes.ts # /api/projects/:id/prompt-blocks
│       │   │   ├── template.routes.ts # /api/templates/*
│       │   │   ├── ai.routes.ts    # /api/ai/*
│       │   │   └── user.routes.ts  # /api/user/*
│       │   ├── services/           # Business logic
│       │   │   ├── project.service.ts
│       │   │   ├── template.service.ts
│       │   │   ├── user.service.ts
│       │   │   ├── modelsCache.service.ts
│       │   │   └── encryption.service.ts
│       │   ├── providers/          # AI providers
│       │   │   ├── base.provider.ts
│       │   │   ├── openai.provider.ts
│       │   │   ├── anthropic.provider.ts
│       │   │   ├── gemini.provider.ts
│       │   │   ├── grok.provider.ts
│       │   │   └── openrouter.provider.ts
│       │   ├── middleware/         # Fastify middleware
│       │   │   ├── auth.middleware.ts
│       │   │   └── errorHandler.ts
│       │   ├── lib/                # Core utilities
│       │   │   ├── prisma.ts       # Prisma client
│       │   │   └── redis.ts        # Redis client
│       │   └── utils/              # Helper functions
│       │       └── prompt.utils.ts
│       ├── prisma/
│       │   ├── schema.prisma       # Database schema
│       │   └── migrations/         # Database migrations
│       ├── scripts/                # Utility scripts
│       └── package.json
│
└── packages/
    └── shared/                     # Shared types and schemas
        ├── src/
        │   ├── types.ts            # TypeScript types
        │   ├── schemas.ts          # Zod validation schemas
        │   └── index.ts
        └── package.json
```

---

## Frontend Architecture

### Component Hierarchy

```
App.tsx
├── ErrorBoundary
│   └── QueryClientProvider
│       └── ConfirmationProvider
│           ├── LandingPage (guest)
│           └── DashboardPage (authorized)
│               └── EditorProvider
│                   └── MainLayout
│                       ├── Header
│                       ├── NavigationPanel (projects + blocks)
│                       ├── BlocksPanel (context/prompt viewer)
│                       └── EditorPanel
│                           ├── ContextEditor
│                           └── PromptEditor
```

### State Management Strategy

**1. Server State (TanStack Query)**
```typescript
// Автоматическая синхронизация с сервером
useProjects()       // GET /api/projects
useProject(id)      // GET /api/projects/:id
useUpdateProject()  // PATCH /api/projects/:id
useTemplates()      // GET /api/templates
useAIModels()       // GET /ai/models
```

**2. Client State (Zustand)**
```typescript
// Локальное состояние приложения
useAuthStore()      // User, tokens, login/logout
useOfflineStore()   // Offline mode, pending changes
```

**3. Context API**
```typescript
// Глобальное UI состояние
EditorContext       // Active blocks, items, expanded state
ConfirmationContext // Modal confirmation dialogs
```

**4. Local Component State (useState)**
```typescript
// Локальное состояние компонентов
const [editingName, setEditingName] = useState('')
const [isModalOpen, setIsModalOpen] = useState(false)
```

### Data Flow Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                         USER ACTION                          │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENT EVENT                           │
│  onClick={() => updateProject({ name: 'New Name' })}        │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  CUSTOM HOOK (React Query)                   │
│  const updateMutation = useUpdateProject()                   │
│  updateMutation.mutate({ id, data })                         │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      API CALL (Axios)                        │
│  api.patch('/api/projects/:id', data)                        │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API (Fastify)                     │
│  projectRoutes.patch('/:id', handler)                        │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                              │
│  projectService.updateProject(id, userId, data)              │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE (Prisma)                          │
│  prisma.project.update({ where: { id }, data })             │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   RESPONSE FLOWS BACK                        │
│  updatedProject -> API response -> React Query cache        │
│  -> Component re-render with new data                        │
└─────────────────────────────────────────────────────────────┘
```

### Key Frontend Patterns

**1. Optimistic Updates**
```typescript
const updateProjectMutation = useUpdateProject({
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['projects'])
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['projects'])
    
    // Optimistically update cache
    queryClient.setQueryData(['projects'], (old) => 
      old.map(p => p.id === newData.id ? { ...p, ...newData } : p)
    )
    
    return { previous }
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['projects'], context.previous)
  }
})
```

**2. Debounced Auto-Save**
```typescript
const debouncedUpdate = useMemo(
  () => debounce((data) => {
    updateProject.mutate(data)
  }, 500),
  []
)

const handleContentChange = (content: string) => {
  setLocalContent(content)  // Immediate UI update
  debouncedUpdate({ content })  // Debounced API call
}
```

**3. Offline Support**
```typescript
// useProjectUpdate.ts
try {
  await updateProjectMutation.mutateAsync(data)
} catch (error) {
  if (!navigator.onLine) {
    // Save to localStorage
    offlineStore.addPendingChange(data)
    toast.info('Offline - changes saved locally')
  }
}
```

---

## Backend Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ROUTES LAYER                            │
│  HTTP routing, request validation, error handling            │
│  auth.routes.ts, project.routes.ts, etc.                    │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                            │
│  Business logic, authorization, data transformation          │
│  projectService, templateService, userService                │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA ACCESS LAYER                          │
│  Database operations, caching, external APIs                 │
│  Prisma ORM, Redis, AI providers                            │
└─────────────────────────────────────────────────────────────┘
```

### API Design Principles

**RESTful API Structure:**
```
/api/auth/*                      # Authentication
  POST /api/auth/google           # Google OAuth callback
  POST /api/auth/refresh          # Refresh access token
  
/api/user                        # User profile
  GET  /api/user                  # Get profile
  PATCH /api/user                 # Update profile
  
/api/projects                    # Projects CRUD
  GET    /api/projects            # List all projects
  POST   /api/projects            # Create project
  GET    /api/projects/:id        # Get single project
  PATCH  /api/projects/:id        # Update project
  DELETE /api/projects/:id        # Delete project
  
/api/projects/:id/context-blocks  # Context management
  PATCH /api/projects/:id/context-blocks
  GET   /api/projects/:id/context-blocks/stats
  
/api/projects/:id/prompt-blocks   # Prompt management
  PATCH /api/projects/:id/prompt-blocks
  POST  /api/projects/:id/prompt-blocks/compile
  
/api/templates                   # Template library
  GET    /api/templates           # List templates
  GET    /api/templates/search?q= # Search templates
  POST   /api/templates           # Create template
  PATCH  /api/templates/:id       # Update template
  DELETE /api/templates/:id       # Delete template
  
/api/ai/*                        # AI integration
  GET  /api/ai/models             # List available models
  POST /api/ai/send               # Send prompt to AI
  POST /api/ai/test-key           # Test API key
  
/api/api-keys                    # API keys management
  GET    /api/api-keys            # List user's keys
  POST   /api/api-keys            # Add new key
  DELETE /api/api-keys/:id        # Delete key
```

### Service Layer Pattern

```typescript
// project.service.ts
class ProjectService {
  // Get all user projects
  async getUserProjects(userId: string): Promise<Project[]> {
    return await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    })
  }
  
  // Update project with validation
  async updateProject(
    projectId: string, 
    userId: string, 
    input: UpdateProjectInput
  ): Promise<Project> {
    // 1. Verify ownership
    const project = await this.getProjectById(projectId, userId)
    if (!project) throw new Error('Project not found')
    
    // 2. Validate data
    if (input.data) {
      const validation = this.validateProjectSize(input.data)
      if (!validation.valid) throw new Error(validation.error)
    }
    
    // 3. Update in database
    return await prisma.project.update({
      where: { id: projectId },
      data: input as any
    })
  }
  
  // Calculate project size
  calculateProjectSize(data: ProjectData): ProjectSizeInfo {
    // Complex calculation logic...
  }
}

export const projectService = new ProjectService()
```

### Provider Pattern (AI Integration)

```typescript
// base.provider.ts
export abstract class BaseProvider {
  protected apiKey: string
  protected baseUrl: string
  
  abstract getModels(): Promise<AIModel[]>
  abstract sendMessage(options: SendMessageOptions): Promise<AIResponse>
  abstract testConnection(): Promise<boolean>
}

// openai.provider.ts
export class OpenAIProvider extends BaseProvider {
  async getModels(): Promise<AIModel[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    })
    // Transform to unified format
    return response.data.data.map(model => ({
      id: model.id,
      name: model.id,
      provider: 'openai' as const,
      contextWindow: this.getContextWindow(model.id)
    }))
  }
  
  async sendMessage(options: SendMessageOptions): Promise<AIResponse> {
    // Handle GPT-5.1 special endpoint
    const isGpt5 = options.model.startsWith('gpt-5')
    const endpoint = isGpt5 ? '/v1/responses' : '/v1/chat/completions'
    // ... implementation
  }
}
```

---

## Data Flow

### Complete Request Flow Example

**User edits context block → Server update → UI refresh**

```typescript
// 1. User types in textarea
<textarea 
  value={item.content}
  onChange={(e) => handleItemContentChange(item.id, e.target.value)}
/>

// 2. Component handler (with debounce)
const handleItemContentChange = async (itemId: number, content: string) => {
  const chars = content.length
  const updatedBlocks = currentProject.data.contextBlocks.map(b => 
    b.id === block.id ? {
      ...b,
      items: b.items.map(item => 
        item.id === itemId ? { ...item, content, chars } : item
      )
    } : b
  )
  
  await updateProjectAndRefresh({ 
    ...currentProject.data, 
    contextBlocks: updatedBlocks 
  })
}

// 3. Custom hook (useProjectUpdate)
const updateProjectAndRefresh = async (data: ProjectData) => {
  const updatedProject = await updateProjectMutation.mutateAsync({
    id: currentProject.id,
    data
  })
  
  setCurrentProject(updatedProject)
  queryClient.invalidateQueries(['projects'])
}

// 4. API call (via React Query)
const updateProjectMutation = useMutation({
  mutationFn: async ({ id, data }) => {
    const response = await api.patch(`/api/projects/${id}`, { data })
    return response.data.data
  }
})

// 5. Backend route
fastify.patch('/api/projects/:id', 
  { preHandler: authenticate },
  async (request, reply) => {
    const { userId } = request.user
    const { id } = request.params
    const { data } = request.body
    
    const project = await projectService.updateProject(id, userId, { data })
    return { success: true, data: project }
  }
)

// 6. Service layer
async updateProject(projectId, userId, input) {
  // Verify ownership
  const project = await this.getProjectById(projectId, userId)
  if (!project) throw new Error('Project not found')
  
  // Validate size
  if (input.data) {
    const validation = this.validateProjectSize(input.data)
    if (!validation.valid) throw new Error(validation.error)
  }
  
  // Update
  return await prisma.project.update({
    where: { id: projectId },
    data: input
  })
}

// 7. Database (PostgreSQL via Prisma)
UPDATE projects 
SET data = $1, updated_at = NOW()
WHERE id = $2 AND user_id = $3
RETURNING *

// 8. Response propagates back through all layers
// 9. React Query updates cache
// 10. Component re-renders with new data
```

---

## Security

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     USER CLICKS "LOGIN"                      │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         REDIRECT TO GOOGLE OAUTH (promptyflow.com)          │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           USER AUTHORIZES IN GOOGLE ACCOUNT                  │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│      GOOGLE REDIRECTS TO /auth/google/callback              │
│      WITH AUTHORIZATION CODE                                 │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│             BACKEND EXCHANGES CODE FOR TOKENS                │
│     1. Get access_token from Google                          │
│     2. Fetch user profile from Google                        │
│     3. Create/update user in database                        │
│     4. Generate JWT access token (15 min)                    │
│     5. Generate JWT refresh token (7 days)                   │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│   REDIRECT TO FRONTEND WITH TOKENS IN URL PARAMS            │
│   /#/auth/callback?access_token=...&refresh_token=...       │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│        FRONTEND STORES TOKENS IN MEMORY (Zustand)            │
│        AND REDIRECTS TO DASHBOARD                            │
└─────────────────────────────────────────────────────────────┘
```

### API Key Encryption

```typescript
// encryption.service.ts
class EncryptionService {
  private algorithm = 'aes-256-gcm'
  private key: Buffer
  
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Return: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
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

### Security Best Practices

1. **Все API keys шифруются AES-256-GCM** перед сохранением в БД
2. **JWT токены короткоживущие** (access: 15 мин, refresh: 7 дней)
3. **CORS настроен** только на разрешенные домены
4. **Rate limiting** на критичных endpoints
5. **Input validation** через Zod schemas
6. **SQL injection protected** через Prisma ORM
7. **XSS protected** через React по умолчанию

---

## Performance

### Frontend Optimizations

**1. Code Splitting**
```typescript
// Lazy loading routes
const LandingPage = lazy(() => import('./pages/LandingPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
```

**2. Memoization**
```typescript
// Expensive calculations cached
const contextBlocksWithChars = useMemo(
  () => contextBlocks.map(block => ({
    ...block,
    totalChars: calculateTotalChars(block)
  })),
  [contextBlocks]
)
```

**3. Debouncing**
```typescript
// Prevent excessive API calls
const debouncedSave = useCallback(
  debounce((data) => saveToServer(data), 500),
  []
)
```

**4. Virtual Scrolling** (для больших списков в будущем)

### Backend Optimizations

**1. Database Indexes**
```sql
-- Full-text search indexes
CREATE INDEX idx_templates_name_tsv ON templates USING gin(name_tsv);
CREATE INDEX idx_templates_content_tsv ON templates USING gin(content_tsv);

-- Regular indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_templates_user_id ON templates(user_id);
```

**2. Redis Caching**
```typescript
// Cache AI models list (1 hour TTL)
const cacheKey = `models:${provider}`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)

const models = await provider.getModels()
await redis.setex(cacheKey, 3600, JSON.stringify(models))
return models
```

**3. Full-Text Search**
```typescript
// PostgreSQL GIN indexes для быстрого поиска
const results = await prisma.$queryRaw`
  SELECT * FROM templates
  WHERE user_id = ${userId}
    AND (name_tsv @@ to_tsquery('english', ${query})
         OR content_tsv @@ to_tsquery('english', ${query}))
  ORDER BY ts_rank(name_tsv || content_tsv, to_tsquery('english', ${query})) DESC
  LIMIT 100
`
// Результат: 1-11ms вместо 7-8 секунд на тысячах записей
```

**4. Connection Pooling**
```typescript
// Prisma connection pool
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  pool_timeout = 10
  connection_limit = 20
}
```

---

## Scalability

### Horizontal Scaling Strategy

```
                    ┌─────────────┐
                    │   Nginx     │
                    │ Load Balancer│
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Backend  │    │ Backend  │    │ Backend  │
    │ Instance │    │ Instance │    │ Instance │
    │    #1    │    │    #2    │    │    #3    │
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
         └───────────────┼───────────────┘
                         ▼
                  ┌─────────────┐
                  │ PostgreSQL  │
                  │  (Primary)  │
                  └──────┬──────┘
                         │
                  ┌──────┴──────┐
                  ▼             ▼
           ┌───────────┐ ┌───────────┐
           │PostgreSQL │ │PostgreSQL │
           │ (Replica) │ │ (Replica) │
           └───────────┘ └───────────┘
```

### Database Scaling

**1. Read Replicas**
- Читающие запросы → replicas
- Пишущие запросы → primary

**2. Sharding** (будущее)
- По user_id (consistent hashing)

**3. Connection Pooling**
- PgBouncer перед PostgreSQL

### Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      CACHE LAYERS                            │
├─────────────────────────────────────────────────────────────┤
│  L1: Browser (React Query cache)                5-15 min    │
│  L2: Redis (Models, Sessions)                   1-24 hours  │
│  L3: PostgreSQL                                  Permanent   │
└─────────────────────────────────────────────────────────────┘
```

---

## Monitoring & Observability

### Logging Strategy

```typescript
// Winston logger with levels
logger.error('Failed to update project', { 
  userId, 
  projectId, 
  error: error.message 
})

logger.warn('Project size approaching limit', { 
  userId, 
  projectId, 
  currentSize, 
  limit 
})

logger.info('User logged in', { userId, email })
```

### Metrics to Track

1. **Performance Metrics:**
   - API response time (p50, p95, p99)
   - Database query time
   - Cache hit ratio

2. **Business Metrics:**
   - Daily/Monthly Active Users
   - Projects created per day
   - AI API calls per day
   - Template usage

3. **Error Metrics:**
   - Error rate by endpoint
   - Failed AI requests
   - Database connection errors

---

**Дата создания:** 05.12.2025  
**Статус:** Актуально  
**Версия:** 1.0

