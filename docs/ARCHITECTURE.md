# 🏗️ Архитектура PromptyFlow SaaS

## 📋 Содержание

1. [Обзор архитектуры](#обзор-архитектуры)
2. [Структура проекта](#структура-проекта)
3. [Архитектура Frontend](#архитектура-frontend)
4. [Архитектура Backend](#архитектура-backend)
5. [Поток данных](#поток-данных)
6. [Безопасность](#безопасность)
7. [Производительность](#производительность)
8. [Масштабируемость](#масштабируемость)
9. [База данных](#база-данных)
10. [AI интеграция](#ai-интеграция)

---

## Обзор архитектуры

PromptyFlow — это **монорепозиторий** на TypeScript, состоящий из трёх основных пакетов:

\`\`\`
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
\`\`\`

### Технологический стек

**Frontend (apps/web):**
- **Фреймворк:** React 18.3 + Vite 5.4
- **Язык:** TypeScript 5.6
- **Стилизация:** Tailwind CSS 3.4
- **Управление состоянием:** 
  - TanStack Query (server state) - кеширование и синхронизация серверного состояния
  - Zustand (client state) - глобальное клиентское состояние
- **i18n:** react-i18next 15+ (русский/английский)
- **HTTP:** Axios 1.7
- **Routing:** React Router 6
- **UI Components:**
  - @dnd-kit (drag-and-drop)
  - react-syntax-highlighter (подсветка кода)
  - react-hot-toast (уведомления)

**Backend (apps/api):**
- **Фреймворк:** Fastify 4.28
- **Язык:** TypeScript 5.6
- **База данных:** PostgreSQL 14+ (Prisma ORM 5.22)
- **Кеширование:** Redis 7+
- **Аутентификация:** Google OAuth 2.0 + JWT
- **Безопасность:** AES-256-GCM шифрование для API ключей
- **Логирование:** Winston
- **Валидация:** Zod schemas

**Shared (packages/shared):**
- **Валидация:** Zod schemas для типобезопасности
- **Типы:** TypeScript interfaces, используемые на frontend и backend

**AI провайдеры:**
- OpenAI (GPT-4, GPT-4o, GPT-5.1)
- Anthropic (Claude 3.5, Claude 4, Claude 4.5)
- Google Gemini (1.5/2.5 Flash, Pro)
- X.AI Grok (Grok Beta, Grok Vision)
- OpenRouter (агрегатор моделей)

---

## Структура проекта

\`\`\`
Promptozaurus-saas/
├── apps/
│   ├── web/                          # Frontend приложение
│   │   ├── src/
│   │   │   ├── components/           # React компоненты
│   │   │   │   ├── layout/           # Компоненты макета
│   │   │   │   │   ├── Header.tsx              # Шапка с навигацией
│   │   │   │   │   ├── MainLayout.tsx          # Основной layout
│   │   │   │   │   └── NavigationPanel.tsx     # Панель проектов
│   │   │   │   ├── context/          # UI для управления контекстом
│   │   │   │   │   ├── ContextEditor.tsx       # Редактор контекста
│   │   │   │   │   ├── ContextItem.tsx         # Элемент контекста
│   │   │   │   │   └── SplitModal.tsx          # Модалка разделения текста
│   │   │   │   ├── prompt/           # UI для управления промптами
│   │   │   │   │   ├── PromptEditor.tsx        # Редактор промпта
│   │   │   │   │   └── PromptItem.tsx          # Элемент промпта
│   │   │   │   ├── context-selection/ # Визуальный селектор контекста
│   │   │   │   │   └── ContextSelectionPanel.tsx  # Drag-select панель
│   │   │   │   ├── ui/               # Переиспользуемые UI компоненты
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   └── Input.tsx
│   │   │   │   ├── AIConfigModal.tsx           # Настройки AI
│   │   │   │   ├── AIResponseModal.tsx         # Ответы AI
│   │   │   │   ├── ProjectList.tsx             # Список проектов
│   │   │   │   └── ConfirmationModal.tsx       # Модалка подтверждения
│   │   │   ├── pages/                # Страницы приложения
│   │   │   │   ├── LandingPage.tsx             # Лендинг для гостей
│   │   │   │   ├── DashboardPage.tsx           # Дашборд пользователя
│   │   │   │   ├── AuthCallbackPage.tsx        # OAuth callback
│   │   │   │   └── ErrorPage.tsx               # Страница ошибки
│   │   │   ├── hooks/                # Кастомные React хуки
│   │   │   │   ├── useAuth.ts                  # Аутентификация
│   │   │   │   ├── useProjects.ts              # CRUD проектов
│   │   │   │   ├── useAI.ts                    # AI интеграция
│   │   │   │   ├── useAIModels.ts              # Загрузка моделей
│   │   │   │   ├── useProjectUpdate.ts         # Обновление проекта
│   │   │   │   └── useTemplates.ts             # Библиотека шаблонов
│   │   │   ├── context/              # React Context провайдеры
│   │   │   │   ├── EditorContext.tsx           # Состояние редактора
│   │   │   │   └── ConfirmationContext.tsx     # Модалки подтверждения
│   │   │   ├── store/                # Zustand хранилища
│   │   │   │   ├── auth.store.ts               # User, tokens, login/logout
│   │   │   │   └── offline.store.ts            # Offline mode
│   │   │   ├── lib/                  # Базовые утилиты
│   │   │   │   ├── api.ts                      # Axios instance с interceptors
│   │   │   │   ├── queryClient.ts              # TanStack Query конфигурация
│   │   │   │   └── i18n.ts                     # i18next конфигурация
│   │   │   ├── locales/              # Переводы (ru/en)
│   │   │   │   ├── ru/
│   │   │   │   │   ├── common.json             # Общие строки
│   │   │   │   │   ├── editor.json             # Редактор
│   │   │   │   │   ├── aiConfig.json           # AI настройки
│   │   │   │   │   └── providers.json          # Провайдеры
│   │   │   │   └── en/
│   │   │   │       └── (аналогичная структура)
│   │   │   ├── utils/                # Вспомогательные функции
│   │   │   │   ├── nameGenerators.ts           # Генерация названий
│   │   │   │   ├── contextCalculations.ts      # Подсчет символов
│   │   │   │   └── textProcessing.ts           # Обработка текста
│   │   │   └── data/                 # Статические данные
│   │   │       └── quickHelp.ts                # Быстрая справка
│   │   ├── index.html
│   │   ├── vite.config.ts                      # Vite конфигурация
│   │   ├── tailwind.config.js                  # Tailwind настройки
│   │   └── package.json
│   │
│   └── api/                          # Backend приложение
│       ├── src/
│       │   ├── index.ts                        # Точка входа Fastify
│       │   ├── routes/               # API endpoints
│       │   │   ├── auth.routes.ts              # /auth/* - OAuth, JWT
│       │   │   ├── project.routes.ts           # /api/projects/* - CRUD проектов
│       │   │   ├── context.routes.ts           # /api/projects/:id/context-blocks
│       │   │   ├── prompt.routes.ts            # /api/projects/:id/prompt-blocks
│       │   │   ├── template.routes.ts          # /api/templates/* - библиотека
│       │   │   ├── ai.routes.ts                # /ai/* - AI интеграция
│       │   │   └── user.routes.ts              # /api/user/* - профиль, API ключи
│       │   ├── services/             # Бизнес-логика
│       │   │   ├── project.service.ts          # Управление проектами
│       │   │   ├── template.service.ts         # Библиотека шаблонов
│       │   │   ├── user.service.ts             # Управление пользователями
│       │   │   ├── modelsCache.service.ts      # Кеш моделей AI
│       │   │   └── encryption.service.ts       # Шифрование API ключей
│       │   ├── providers/            # AI провайдеры
│       │   │   ├── base.provider.ts            # Абстрактный базовый класс
│       │   │   ├── openai.provider.ts          # OpenAI интеграция
│       │   │   ├── anthropic.provider.ts       # Anthropic Claude
│       │   │   ├── gemini.provider.ts          # Google Gemini
│       │   │   ├── grok.provider.ts            # X.AI Grok
│       │   │   └── openrouter.provider.ts      # OpenRouter
│       │   ├── middleware/           # Fastify middleware
│       │   │   ├── auth.middleware.ts          # JWT проверка
│       │   │   ├── errorHandler.ts             # Обработка ошибок
│       │   │   └── cors.ts                     # CORS политики
│       │   ├── lib/                  # Базовые утилиты
│       │   │   ├── prisma.ts                   # Prisma client singleton
│       │   │   ├── redis.ts                    # Redis client
│       │   │   └── logger.ts                   # Winston logger
│       │   └── utils/                # Вспомогательные функции
│       │       └── prompt.utils.ts             # Компиляция промптов
│       ├── prisma/
│       │   ├── schema.prisma                   # Схема БД
│       │   └── migrations/                     # SQL миграции
│       │       └── YYYYMMDDHHMMSS_description/
│       │           └── migration.sql
│       ├── scripts/                  # Утилитарные скрипты
│       │   └── generate-encryption-key.ts      # Генерация ключа шифрования
│       └── package.json
│
└── packages/
    └── shared/                       # Общие типы и схемы
        ├── src/
        │   ├── types.ts                        # TypeScript interfaces
        │   ├── schemas.ts                      # Zod validation schemas
        │   └── index.ts
        └── package.json
\`\`\`

---

## Архитектура Frontend

### Иерархия компонентов

\`\`\`
App.tsx
├── ErrorBoundary                     # Перехват ошибок React
│   └── QueryClientProvider           # TanStack Query provider
│       └── ConfirmationProvider      # Глобальные модалки подтверждения
│           ├── LandingPage           # Для незалогиненных пользователей
│           │   ├── Header (guest mode)
│           │   ├── Hero section
│           │   ├── Features
│           │   └── Footer
│           │
│           └── DashboardPage         # Для авторизованных пользователей
│               └── EditorProvider    # Контекст состояния редактора
│                   └── MainLayout
│                       ├── Header (authorized mode)
│                       │   ├── Project selector
│                       │   ├── AI config button
│                       │   ├── Language switcher
│                       │   └── User menu
│                       │
│                       ├── NavigationPanel (left sidebar)
│                       │   ├── ProjectList
│                       │   ├── "Create project" button
│                       │   └── Project cards with stats
│                       │
│                       ├── BlocksPanel (middle panel)
│                       │   ├── Tabs: Context | Prompts
│                       │   ├── Context blocks list
│                       │   ├── Prompt blocks list
│                       │   └── "Create block" button
│                       │
│                       └── EditorPanel (right panel)
│                           ├── ContextEditor
│                           │   ├── Block title
│                           │   ├── Items list (drag-and-drop)
│                           │   ├── SubItems (nested)
│                           │   ├── Split modal
│                           │   └── Export button
│                           │
│                           └── PromptEditor
│                               ├── Template textarea
│                               ├── ContextSelectionPanel
│                               ├── Compiled prompt preview
│                               └── AI send button
\`\`\`

### Стратегия управления состоянием

**1. Server State (TanStack Query)**

Используется для всех данных, которые хранятся на сервере:

\`\`\`typescript
// apps/web/src/hooks/useProjects.ts
export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/api/projects')
      return response.data.data as Project[]
    },
    staleTime: 5 * 60 * 1000, // 5 минут
    cacheTime: 10 * 60 * 1000, // 10 минут
  })
}

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const response = await api.get(\`/api/projects/\${id}\`)
      return response.data.data as Project
    },
    enabled: !!id, // Запрос выполняется только если id задан
  })
}

export const useUpdateProject = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.patch(\`/api/projects/\${id}\`, { data })
      return response.data.data
    },
    onSuccess: (updatedProject) => {
      // Обновляем кеш
      queryClient.invalidateQueries(['projects'])
      queryClient.setQueryData(['projects', updatedProject.id], updatedProject)
    },
  })
}
\`\`\`

**Преимущества TanStack Query:**
- Автоматическое кеширование ответов
- Фоновое обновление данных (refetching)
- Optimistic updates
- Автоматический retry при ошибках
- Дедупликация запросов

**2. Client State (Zustand)**

Используется для локального состояния приложения:

\`\`\`typescript
// apps/web/src/store/auth.store.ts
interface AuthStore {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  login: (tokens: Tokens, user: User) => void
  logout: () => void
  updateToken: (accessToken: string) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  
  login: (tokens, user) => {
    set({ 
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user 
    })
  },
  
  logout: () => {
    set({ user: null, accessToken: null, refreshToken: null })
  },
  
  updateToken: (accessToken) => {
    set({ accessToken })
  },
}))
\`\`\`

**3. Context API**

Используется для UI состояния, которое нужно передавать глубоко в дерево компонентов:

\`\`\`typescript
// apps/web/src/context/EditorContext.tsx
interface EditorContextType {
  activeTab: 'context' | 'prompts'
  setActiveTab: (tab: 'context' | 'prompts') => void
  activeContextBlockId: number | null
  setActiveContextBlockId: (id: number | null) => void
  activePromptBlockId: number | null
  setActivePromptBlockId: (id: number | null) => void
  expandedItems: Set<number>
  toggleItemExpanded: (id: number) => void
}

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'context' | 'prompts'>('context')
  const [activeContextBlockId, setActiveContextBlockId] = useState<number | null>(null)
  const [activePromptBlockId, setActivePromptBlockId] = useState<number | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const toggleItemExpanded = (id: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <EditorContext.Provider value={{
      activeTab, setActiveTab,
      activeContextBlockId, setActiveContextBlockId,
      activePromptBlockId, setActivePromptBlockId,
      expandedItems, toggleItemExpanded,
    }}>
      {children}
    </EditorContext.Provider>
  )
}
\`\`\`

**4. Local Component State (useState)**

Используется для простого локального состояния компонента:

\`\`\`typescript
// Пример в ContextEditor.tsx
const [editingName, setEditingName] = useState(false)
const [isModalOpen, setIsModalOpen] = useState(false)
const [localTitle, setLocalTitle] = useState(block.title)
\`\`\`

### Паттерны Frontend

**1. Optimistic Updates (оптимистичные обновления)**

Обновление UI до получения ответа от сервера для лучшего UX:

\`\`\`typescript
const updateProjectMutation = useMutation({
  mutationFn: async ({ id, data }) => {
    return await api.patch(\`/api/projects/\${id}\`, { data })
  },
  
  onMutate: async (newData) => {
    // Отменяем текущие refetch запросы
    await queryClient.cancelQueries(['projects', newData.id])
    
    // Сохраняем предыдущее значение для отката
    const previousProject = queryClient.getQueryData(['projects', newData.id])
    
    // Оптимистично обновляем кеш
    queryClient.setQueryData(['projects', newData.id], (old: any) => ({
      ...old,
      ...newData.data,
    }))
    
    return { previousProject }
  },
  
  onError: (err, newData, context) => {
    // Откатываем изменения при ошибке
    if (context?.previousProject) {
      queryClient.setQueryData(['projects', newData.id], context.previousProject)
    }
    toast.error('Не удалось сохранить изменения')
  },
  
  onSuccess: (data, variables) => {
    // Инвалидируем связанные запросы
    queryClient.invalidateQueries(['projects'])
  },
})
\`\`\`

**2. Debounced Auto-Save (автосохранение с задержкой)**

Предотвращение лишних API запросов при быстром вводе:

\`\`\`typescript
import { debounce } from 'lodash'

const PromptEditor = ({ block }) => {
  const updateProject = useProjectUpdate()
  const [localTitle, setLocalTitle] = useState(block.title)
  
  // Debounced функция сохранения (вызывается не чаще раза в 500мс)
  const debouncedSave = useMemo(
    () => debounce((title: string) => {
      updateProject.mutate({
        id: block.id,
        data: { title }
      })
    }, 500),
    [block.id]
  )
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setLocalTitle(newTitle)  // Немедленное обновление UI
    debouncedSave(newTitle)  // Отложенное сохранение на сервер
  }
  
  return <input value={localTitle} onChange={handleTitleChange} />
}
\`\`\`

**3. Offline Support (поддержка оффлайн режима)**

Сохранение изменений локально, если нет сети:

\`\`\`typescript
// apps/web/src/hooks/useProjectUpdate.ts
export const useProjectUpdate = () => {
  const queryClient = useQueryClient()
  const offlineStore = useOfflineStore()

  return useMutation({
    mutationFn: async (data) => {
      const response = await api.patch(\`/api/projects/\${data.id}\`, data)
      return response.data.data
    },
    
    onError: (error: any, variables) => {
      if (!navigator.onLine) {
        // Сохраняем в localStorage для синхронизации позже
        offlineStore.addPendingChange({
          type: 'project_update',
          data: variables,
          timestamp: Date.now(),
        })
        toast.info('Нет сети. Изменения сохранены локально.')
      } else {
        toast.error('Не удалось сохранить изменения')
      }
    },
  })
}
\`\`\`

**4. Error Boundary (перехват ошибок React)**

\`\`\`typescript
// apps/web/src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error:', error, errorInfo)
    // Можно отправить на Sentry/LogRocket
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h1>Что-то пошло не так</h1>
          <button onClick={() => window.location.reload()}>
            Перезагрузить страницу
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
\`\`\`

---

## Архитектура Backend

### Слоистая архитектура

Backend построен по принципу разделения ответственности на слои:

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                      ROUTES LAYER                            │
│  • HTTP маршрутизация                                        │
│  • Валидация запросов (Zod schemas)                          │
│  • Обработка ошибок                                          │
│  • Middleware (auth, CORS, rate limiting)                    │
│  Файлы: auth.routes.ts, project.routes.ts, etc.            │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                            │
│  • Бизнес-логика приложения                                  │
│  • Авторизация (проверка прав доступа)                       │
│  • Трансформация данных                                      │
│  • Валидация бизнес-правил                                   │
│  Файлы: projectService, templateService, userService         │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA ACCESS LAYER                          │
│  • Операции с базой данных (Prisma)                          │
│  • Кеширование (Redis)                                       │
│  • Внешние API (AI провайдеры)                              │
│  • Шифрование/дешифрование                                   │
│  Файлы: prisma.ts, redis.ts, providers/                    │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### RESTful API структура

\`\`\`
📁 /auth/*                            # Аутентификация
  POST   /auth/google                 # Google OAuth callback
  POST   /auth/refresh                # Обновление access token
  
📁 /api/user                          # Профиль пользователя
  GET    /api/user                    # Получить профиль
  PATCH  /api/user                    # Обновить профиль
  POST   /api/user/api-keys/:provider # Добавить API ключ
  DELETE /api/user/api-keys/:provider # Удалить API ключ
  GET    /api/user/api-keys           # Список сохраненных ключей
  
📁 /api/projects                      # CRUD проектов
  GET    /api/projects                # Список всех проектов пользователя
  POST   /api/projects                # Создать новый проект
  GET    /api/projects/:id            # Получить проект по ID
  PATCH  /api/projects/:id            # Обновить проект
  DELETE /api/projects/:id            # Удалить проект
  
📁 /api/projects/:id/context-blocks   # Управление контекстом
  PATCH  /api/projects/:id/context-blocks        # Обновить блоки контекста
  GET    /api/projects/:id/context-blocks/stats  # Статистика (символы, элементы)
  
📁 /api/projects/:id/prompt-blocks    # Управление промптами
  PATCH  /api/projects/:id/prompt-blocks         # Обновить блоки промптов
  POST   /api/projects/:id/prompt-blocks/compile # Скомпилировать промпт
  
📁 /api/templates                     # Библиотека шаблонов
  GET    /api/templates               # Список шаблонов пользователя
  GET    /api/templates/search?q=     # Поиск по шаблонам (full-text search)
  POST   /api/templates               # Создать шаблон
  PATCH  /api/templates/:id           # Обновить шаблон
  DELETE /api/templates/:id           # Удалить шаблон
  
📁 /ai/*                              # AI интеграция
  GET    /ai/models                   # Список доступных моделей
  POST   /ai/send                     # Отправить запрос к AI
  POST   /ai/test-connection          # Тестировать API ключ провайдера
\`\`\`

### Service Layer (слой сервисов)

Вся бизнес-логика инкапсулирована в сервисах:

\`\`\`typescript
// apps/api/src/services/project.service.ts
class ProjectService {
  /**
   * Получить все проекты пользователя
   */
  async getUserProjects(userId: string): Promise<Project[]> {
    return await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        data: true,
        createdAt: true,
        updatedAt: true,
      }
    })
  }

  /**
   * Получить проект по ID с проверкой прав доступа
   */
  async getProjectById(projectId: string, userId: string): Promise<Project | null> {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId, // Проверка, что проект принадлежит пользователю
      },
    })
    
    if (!project) {
      throw new Error('Проект не найден или у вас нет доступа')
    }
    
    return project
  }

  /**
   * Обновить проект с валидацией размера
   */
  async updateProject(
    projectId: string, 
    userId: string, 
    input: UpdateProjectInput
  ): Promise<Project> {
    // 1. Проверяем права доступа
    const project = await this.getProjectById(projectId, userId)
    
    // 2. Валидируем размер проекта
    if (input.data) {
      const sizeValidation = this.validateProjectSize(input.data)
      if (!sizeValidation.valid) {
        throw new Error(sizeValidation.error)
      }
    }
    
    // 3. Обновляем в БД
    return await prisma.project.update({
      where: { id: projectId },
      data: {
        ...input,
        updatedAt: new Date(),
      }
    })
  }

  /**
   * Валидация размера проекта
   */
  validateProjectSize(data: ProjectData): { valid: boolean; error?: string } {
    const MAX_PROJECT_SIZE = 10_000_000 // 10M символов
    const MAX_BLOCK_SIZE = 5_000_000   // 5M символов

    const { totalChars, largestBlockChars } = this.calculateProjectSize(data)

    if (largestBlockChars > MAX_BLOCK_SIZE) {
      return {
        valid: false,
        error: \`Блок контекста превышает лимит (\${largestBlockChars.toLocaleString()} / \${MAX_BLOCK_SIZE.toLocaleString()} символов)\`
      }
    }

    if (totalChars > MAX_PROJECT_SIZE) {
      return {
        valid: false,
        error: \`Проект превышает лимит (\${totalChars.toLocaleString()} / \${MAX_PROJECT_SIZE.toLocaleString()} символов)\`
      }
    }

    return { valid: true }
  }

  /**
   * Подсчет размера проекта
   */
  calculateProjectSize(data: ProjectData): ProjectSizeInfo {
    let totalChars = 0
    let largestBlockChars = 0

    // Подсчет символов в блоках контекста
    for (const block of data.contextBlocks || []) {
      let blockChars = 0

      for (const item of block.items || []) {
        // Если есть subItems, считаем только их
        if (item.subItems && item.subItems.length > 0) {
          const subItemsChars = item.subItems.reduce(
            (sum, sub) => sum + (sub.chars || 0), 
            0
          )
          blockChars += subItemsChars
        } else {
          // Иначе считаем chars элемента
          blockChars += item.chars || 0
        }
      }

      totalChars += blockChars
      largestBlockChars = Math.max(largestBlockChars, blockChars)
    }

    return { totalChars, largestBlockChars }
  }

  /**
   * Создать новый проект
   */
  async createProject(userId: string, name: string): Promise<Project> {
    return await prisma.project.create({
      data: {
        userId,
        name,
        data: {
          contextBlocks: [],
          promptBlocks: [],
        },
      },
    })
  }

  /**
   * Удалить проект
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    // Проверяем права доступа
    await this.getProjectById(projectId, userId)
    
    // Удаляем
    await prisma.project.delete({
      where: { id: projectId },
    })
  }
}

export const projectService = new ProjectService()
\`\`\`

### Provider Pattern (паттерн провайдеров для AI)

Единый интерфейс для работы с разными AI провайдерами:

\`\`\`typescript
// apps/api/src/providers/base.provider.ts
export interface AIModel {
  id: string
  name: string
  provider: string
  contextWindow: number
  maxOutputTokens?: number
}

export interface SendMessageOptions {
  apiKey: string
  model: string
  messages: Array<{ role: string; content: string }>
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export abstract class BaseProvider {
  protected apiKey: string
  protected baseUrl: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || ''
    this.baseUrl = this.getDefaultBaseUrl()
  }

  protected abstract getDefaultBaseUrl(): string

  /**
   * Получить список доступных моделей
   */
  abstract getModels(apiKey?: string): Promise<AIModel[]>

  /**
   * Отправить сообщение в AI
   */
  abstract sendMessage(options: SendMessageOptions): Promise<string>

  /**
   * Проверить подключение (тест API ключа)
   */
  abstract testConnection(apiKey: string): Promise<boolean>

  /**
   * Получить fallback модели (если API недоступен)
   */
  protected getFallbackModels(): AIModel[] {
    return []
  }
}
\`\`\`

Пример конкретной реализации:

\`\`\`typescript
// apps/api/src/providers/openai.provider.ts
export class OpenAIProvider extends BaseProvider {
  protected getDefaultBaseUrl(): string {
    return 'https://api.openai.com'
  }

  protected getFallbackModels(): AIModel[] {
    return [
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextWindow: 128000 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', contextWindow: 128000 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', contextWindow: 128000 },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', contextWindow: 16385 },
      { id: 'gpt-5.1-chat-latest', name: 'GPT-5.1 Chat', provider: 'openai', contextWindow: 200000 },
    ]
  }

  async getModels(apiKey?: string): Promise<AIModel[]> {
    if (!apiKey) return this.getFallbackModels()

    try {
      const response = await fetch(\`\${this.baseUrl}/v1/models\`, {
        headers: { 'Authorization': \`Bearer \${apiKey}\` }
      })

      if (!response.ok) {
        return this.getFallbackModels()
      }

      const data = await response.json()
      return data.data
        .filter((m: any) => m.id.startsWith('gpt'))
        .map((m: any) => ({
          id: m.id,
          name: m.id,
          provider: 'openai',
          contextWindow: this.getContextWindow(m.id),
        }))
    } catch (error) {
      return this.getFallbackModels()
    }
  }

  async sendMessage(options: SendMessageOptions): Promise<string> {
    const { apiKey, model, messages, temperature = 0.7, maxTokens = 4000 } = options

    // GPT-5.1 использует другой endpoint
    const isGpt5 = model.startsWith('gpt-5')
    const endpoint = isGpt5 ? '/v1/responses' : '/v1/chat/completions'

    // Для GPT-5.1 формат запроса отличается
    const requestBody = isGpt5 
      ? {
          model,
          input: messages.map(m => m.content).join('\n\n'),
          temperature,
          max_output_tokens: maxTokens,
        }
      : {
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }

    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || 'OpenAI API error')
    }

    const data = await response.json()

    // Разный формат ответа для GPT-5.1
    if (isGpt5) {
      const messageOutput = data.output?.find((item: any) => item.type === 'message')
      const textContent = messageOutput?.content?.find((c: any) => c.type === 'output_text')?.text
      return textContent || ''
    }

    return data.choices[0]?.message?.content || ''
  }

  async testConnection(apiKey: string): Promise<boolean> {
    try {
      await this.getModels(apiKey)
      return true
    } catch {
      return false
    }
  }

  private getContextWindow(modelId: string): number {
    if (modelId.includes('gpt-5')) return 200000
    if (modelId.includes('gpt-4')) return 128000
    if (modelId.includes('gpt-3.5')) return 16385
    return 4096
  }
}
\`\`\`

### Middleware (промежуточное ПО)

**1. Authentication Middleware**

\`\`\`typescript
// apps/api/src/middleware/auth.middleware.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }
    
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    
    // Добавляем user в request
    request.user = {
      userId: decoded.userId,
      email: decoded.email,
    }
  } catch (error) {
    return reply.code(401).send({ error: 'Invalid token' })
  }
}
\`\`\`

**2. Error Handler**

\`\`\`typescript
// apps/api/src/middleware/errorHandler.ts
export function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  logger.error('Request error:', {
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
  })

  // Специальные ошибки
  if (error.message.includes('превышает лимит')) {
    return reply.code(413).send({
      error: 'PAYLOAD_TOO_LARGE',
      message: error.message,
    })
  }

  if (error.message.includes('не найден')) {
    return reply.code(404).send({
      error: 'NOT_FOUND',
      message: error.message,
    })
  }

  // Общая ошибка
  return reply.code(500).send({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Произошла внутренняя ошибка сервера',
  })
}
\`\`\`

---

## Поток данных

### Полный цикл запроса

Рассмотрим пример: пользователь редактирует содержимое элемента контекста.

\`\`\`
1. USER ACTION
   │ Пользователь вводит текст в textarea
   │
   ▼
2. COMPONENT EVENT
   │ onChange={(e) => handleItemContentChange(item.id, e.target.value)}
   │
   ▼
3. DEBOUNCE (500ms)
   │ Предотвращаем лишние запросы при быстром вводе
   │
   ▼
4. COMPONENT HANDLER
   │ const updatedBlocks = contextBlocks.map(block => 
   │   block.id === activeBlock.id ? {
   │     ...block,
   │     items: block.items.map(item =>
   │       item.id === itemId ? { ...item, content, chars: content.length } : item
   │     )
   │   } : block
   │ )
   │
   ▼
5. CUSTOM HOOK (React Query mutation)
   │ updateProjectMutation.mutate({ 
   │   id: projectId, 
   │   data: { contextBlocks: updatedBlocks } 
   │ })
   │
   ▼
6. API CALL (Axios)
   │ PATCH /api/projects/:id
   │ Body: { data: { contextBlocks: [...] } }
   │ Headers: { Authorization: 'Bearer <token>' }
   │
   ▼
7. BACKEND ROUTE (Fastify)
   │ fastify.patch('/api/projects/:id', 
   │   { preHandler: authenticate },
   │   async (request, reply) => { ... }
   │ )
   │
   ▼
8. AUTH MIDDLEWARE
   │ Проверяем JWT token
   │ Извлекаем userId из токена
   │ Добавляем request.user = { userId, email }
   │
   ▼
9. SERVICE LAYER
   │ projectService.updateProject(projectId, userId, input)
   │   1. Проверка прав доступа (проект принадлежит пользователю)
   │   2. Валидация размера проекта (не превышает 10M)
   │   3. Валидация размера блока (не превышает 5M)
   │
   ▼
10. DATABASE (Prisma + PostgreSQL)
   │ UPDATE projects
   │ SET data = $1, updated_at = NOW()
   │ WHERE id = $2 AND user_id = $3
   │ RETURNING *
   │
   ▼
11. RESPONSE BACK TO CLIENT
   │ { success: true, data: updatedProject }
   │
   ▼
12. REACT QUERY CACHE UPDATE
   │ queryClient.setQueryData(['projects', id], updatedProject)
   │ queryClient.invalidateQueries(['projects'])
   │
   ▼
13. COMPONENT RE-RENDER
   │ UI автоматически обновляется с новыми данными
\`\`\`

### Optimistic Update Flow

Для улучшения UX обновления происходят оптимистично:

\`\`\`
USER TYPES
   │
   ▼
UI UPDATES IMMEDIATELY (local state)
   │ setLocalContent(newContent)
   │
   ├─────────────────────────────────┐
   │                                 │
   ▼                                 ▼
OPTIMISTIC CACHE UPDATE        DEBOUNCED API CALL (500ms later)
   │ queryClient.setQueryData()      │
   │                                 │
   │                                 ▼
   │                            API REQUEST
   │                                 │
   │                        ┌────────┴────────┐
   │                        │                 │
   │                        ▼                 ▼
   │                    SUCCESS            ERROR
   │                        │                 │
   │                        ▼                 ▼
   └──────────────> CONFIRM UPDATE    ROLLBACK UPDATE
                          │                 │
                          │                 ▼
                          │          queryClient.setQueryData(previousValue)
                          │          toast.error('Ошибка сохранения')
                          │
                          ▼
                    ALL IN SYNC
\`\`\`

---

## Безопасность

### Аутентификация через Google OAuth 2.0 + JWT

**Полный flow аутентификации:**

\`\`\`
1. USER CLICKS "Войти через Google"
   │
   ▼
2. REDIRECT TO GOOGLE OAUTH
   │ https://accounts.google.com/o/oauth2/v2/auth?
   │   client_id=<CLIENT_ID>
   │   redirect_uri=https://promptyflow.com/auth/google/callback
   │   response_type=code
   │   scope=openid email profile
   │
   ▼
3. USER AUTHORIZES IN GOOGLE
   │ Вводит логин/пароль
   │ Подтверждает доступ к email и профилю
   │
   ▼
4. GOOGLE REDIRECTS BACK WITH CODE
   │ https://promptyflow.com/auth/google/callback?code=<AUTHORIZATION_CODE>
   │
   ▼
5. BACKEND EXCHANGES CODE FOR TOKENS
   │ POST https://oauth2.googleapis.com/token
   │ Body: {
   │   code: <AUTHORIZATION_CODE>,
   │   client_id: <CLIENT_ID>,
   │   client_secret: <CLIENT_SECRET>,
   │   redirect_uri: https://promptyflow.com/auth/google/callback,
   │   grant_type: 'authorization_code'
   │ }
   │
   ▼
6. GOOGLE RETURNS ACCESS TOKEN
   │ { access_token: '...', id_token: '...', expires_in: 3600 }
   │
   ▼
7. BACKEND FETCHES USER PROFILE
   │ GET https://www.googleapis.com/oauth2/v1/userinfo
   │ Headers: { Authorization: 'Bearer <access_token>' }
   │
   ▼
8. CREATE/UPDATE USER IN DATABASE
   │ prisma.user.upsert({
   │   where: { googleId: profile.id },
   │   create: { googleId, email, name, picture },
   │   update: { email, name, picture, lastLoginAt: new Date() }
   │ })
   │
   ▼
9. GENERATE JWT TOKENS
   │ Access Token (15 мин):
   │   jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '15m' })
   │
   │ Refresh Token (7 дней):
   │   jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
   │
   ▼
10. REDIRECT TO FRONTEND WITH TOKENS
   │ https://promptyflow.com/#/auth/callback?
   │   access_token=<JWT_ACCESS_TOKEN>
   │   &refresh_token=<JWT_REFRESH_TOKEN>
   │
   ▼
11. FRONTEND STORES TOKENS IN MEMORY
   │ useAuthStore.login({ accessToken, refreshToken }, user)
   │ navigate('/dashboard')
   │
   ▼
12. SUBSEQUENT API CALLS USE ACCESS TOKEN
   │ axios.interceptors.request.use(config => {
   │   config.headers.Authorization = \`Bearer \${accessToken}\`
   │   return config
   │ })
\`\`\`

**Обновление токена при истечении:**

\`\`\`typescript
// apps/web/src/lib/api.ts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Если 401 и это не retry попытка
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Запрашиваем новый access token
        const refreshToken = useAuthStore.getState().refreshToken
        const response = await axios.post('/auth/refresh', { refreshToken })
        
        const { accessToken } = response.data
        
        // Обновляем токен в store
        useAuthStore.getState().updateToken(accessToken)
        
        // Повторяем оригинальный запрос с новым токеном
        originalRequest.headers.Authorization = \`Bearer \${accessToken}\`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh token тоже невалиден - разлогиниваем
        useAuthStore.getState().logout()
        window.location.href = '/'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)
\`\`\`

### Шифрование API ключей

Все API ключи AI провайдеров шифруются перед сохранением в БД:

\`\`\`typescript
// apps/api/src/services/encryption.service.ts
import crypto from 'crypto'

class EncryptionService {
  private algorithm = 'aes-256-gcm'
  private key: Buffer

  constructor() {
    // Ключ шифрования из переменных окружения (32 байта для AES-256)
    const keyString = process.env.ENCRYPTION_KEY!
    this.key = Buffer.from(keyString, 'hex')
  }

  /**
   * Шифрование текста
   * Возвращает строку в формате: iv:authTag:encrypted
   */
  encrypt(text: string): string {
    // Генерируем случайный initialization vector (16 байт)
    const iv = crypto.randomBytes(16)
    
    // Создаем cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)
    
    // Шифруем текст
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Получаем authentication tag (для проверки целостности)
    const authTag = cipher.getAuthTag()
    
    // Возвращаем iv:authTag:encrypted (все в hex формате)
    return \`\${iv.toString('hex')}:\${authTag.toString('hex')}:\${encrypted}\`
  }

  /**
   * Дешифрование текста
   */
  decrypt(encrypted: string): string {
    // Разбираем строку на компоненты
    const [ivHex, authTagHex, encryptedText] = encrypted.split(':')
    
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    // Создаем decipher
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv)
    decipher.setAuthTag(authTag)
    
    // Дешифруем
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}

export const encryptionService = new EncryptionService()
\`\`\`

**Использование:**

\`\`\`typescript
// Сохранение API ключа
const encryptedKey = encryptionService.encrypt(apiKey)
await prisma.apiKey.create({
  data: {
    userId,
    provider: 'openai',
    encryptedKey, // Сохраняем зашифрованный ключ
  }
})

// Получение API ключа
const record = await prisma.apiKey.findFirst({
  where: { userId, provider: 'openai' }
})
const apiKey = encryptionService.decrypt(record.encryptedKey)
\`\`\`

### Security Best Practices

**1. Защита от SQL Injection**
- Используем Prisma ORM (параметризованные запросы)
- Все пользовательские данные валидируются через Zod schemas

**2. Защита от XSS (Cross-Site Scripting)**
- React автоматически экранирует JSX
- Для HTML используем DOMPurify
- CSP (Content Security Policy) headers

**3. CORS (Cross-Origin Resource Sharing)**
\`\`\`typescript
fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'https://promptyflow.com',
  credentials: true,
})
\`\`\`

**4. Rate Limiting**
\`\`\`typescript
fastify.register(rateLimit, {
  max: 100, // максимум 100 запросов
  timeWindow: '1 minute', // за 1 минуту
})
\`\`\`

**5. Input Validation (Zod)**
\`\`\`typescript
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
})

fastify.post('/api/projects', async (request, reply) => {
  const body = createProjectSchema.parse(request.body) // Throws если невалидно
  // ...
})
\`\`\`

---

## Производительность

### Frontend оптимизации

**1. Code Splitting (разделение кода)**

\`\`\`typescript
// apps/web/src/App.tsx
import { lazy, Suspense } from 'react'

// Ленивая загрузка страниц
const LandingPage = lazy(() => import('./pages/LandingPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Suspense>
  )
}
\`\`\`

**2. Memoization (кеширование вычислений)**

\`\`\`typescript
// Кеширование дорогих вычислений
const contextBlocksWithStats = useMemo(() => {
  return contextBlocks.map(block => {
    const totalChars = calculateTotalChars(block)
    const totalItems = block.items.length
    const totalSubItems = block.items.reduce(
      (sum, item) => sum + (item.subItems?.length || 0), 
      0
    )

    return { ...block, totalChars, totalItems, totalSubItems }
  })
}, [contextBlocks]) // Пересчитывается только при изменении contextBlocks

// Кеширование callback функций
const handleItemClick = useCallback((itemId: number) => {
  setActiveItemId(itemId)
}, []) // Функция создается только один раз
\`\`\`

**3. Debouncing (задержка выполнения)**

\`\`\`typescript
// Задержка автосохранения при вводе текста
const debouncedSave = useMemo(
  () => debounce((content: string) => {
    updateProject.mutate({ data: { content } })
  }, 500),
  []
)

const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const newContent = e.target.value
  setLocalContent(newContent) // Немедленно обновляем UI
  debouncedSave(newContent)   // Отложенное сохранение
}
\`\`\`

**4. Virtualization (виртуализация списков)**

Для больших списков (будущее):

\`\`\`typescript
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <ItemComponent item={items[index]} />
    </div>
  )}
</FixedSizeList>
\`\`\`

### Backend оптимизации

**1. Database Indexes (индексы БД)**

\`\`\`sql
-- Индекс для быстрого поиска проектов пользователя
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Индекс для быстрого поиска шаблонов пользователя
CREATE INDEX idx_templates_user_id ON templates(user_id);

-- Полнотекстовый поиск по шаблонам
CREATE INDEX idx_templates_name_tsv ON templates USING gin(name_tsv);
CREATE INDEX idx_templates_content_tsv ON templates USING gin(content_tsv);
\`\`\`

**2. Redis Caching (кеширование в Redis)**

\`\`\`typescript
// apps/api/src/services/modelsCache.service.ts
class ModelsCacheService {
  private readonly CACHE_TTL = 3600 // 1 час

  /**
   * Получить модели с кешированием
   */
  async getModels(provider: string, apiKey?: string): Promise<AIModel[]> {
    const cacheKey = \`models:\${provider}\`
    
    // Проверяем кеш
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    // Запрашиваем у провайдера
    const providerInstance = this.getProviderInstance(provider)
    const models = await providerInstance.getModels(apiKey)

    // Сохраняем в кеш
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(models))

    return models
  }

  /**
   * Инвалидировать кеш
   */
  async invalidateCache(provider: string): Promise<void> {
    await redis.del(\`models:\${provider}\`)
  }
}
\`\`\`

**3. Full-Text Search (полнотекстовый поиск)**

До оптимизации: ~7-8 секунд на тысячах записей  
После оптимизации: 1-11ms

\`\`\`typescript
// apps/api/src/services/template.service.ts
async searchTemplates(userId: string, query: string): Promise<Template[]> {
  // Используем PostgreSQL Full-Text Search с GIN индексами
  const results = await prisma.$queryRaw<Template[]>\`
    SELECT 
      id, user_id, name, content, created_at, updated_at,
      ts_rank(name_tsv || content_tsv, to_tsquery('english', \${query})) as rank
    FROM templates
    WHERE user_id = \${userId}
      AND (
        name_tsv @@ to_tsquery('english', \${query}) OR
        content_tsv @@ to_tsquery('english', \${query})
      )
    ORDER BY rank DESC, updated_at DESC
    LIMIT 100
  \`

  return results
}
\`\`\`

**Как работает Full-Text Search:**

1. При создании/обновлении шаблона автоматически создаются tsvector столбцы:
\`\`\`sql
ALTER TABLE templates 
ADD COLUMN name_tsv tsvector 
GENERATED ALWAYS AS (to_tsvector('english', name)) STORED;

ALTER TABLE templates 
ADD COLUMN content_tsv tsvector 
GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
\`\`\`

2. GIN индексы на этих столбцах:
\`\`\`sql
CREATE INDEX idx_templates_name_tsv ON templates USING gin(name_tsv);
CREATE INDEX idx_templates_content_tsv ON templates USING gin(content_tsv);
\`\`\`

3. Поиск через оператор `@@` (соответствие) и функцию `ts_rank` (ранжирование).

**4. Connection Pooling (пул соединений)**

\`\`\`typescript
// apps/api/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// В DATABASE_URL указываем параметры пула:
// postgresql://user:password@localhost:5432/db?
//   connection_limit=20&
//   pool_timeout=10
\`\`\`

**5. Query Optimization (оптимизация запросов)**

\`\`\`typescript
// ❌ Плохо: N+1 problem
const projects = await prisma.project.findMany({ where: { userId } })
for (const project of projects) {
  const user = await prisma.user.findUnique({ where: { id: project.userId } })
  // ...
}

// ✅ Хорошо: используем include
const projects = await prisma.project.findMany({
  where: { userId },
  include: {
    user: true, // Один запрос с JOIN
  },
})
\`\`\`

---

## Масштабируемость

### Horizontal Scaling (горизонтальное масштабирование)

\`\`\`
                        ┌─────────────┐
                        │    Nginx    │
                        │Load Balancer│
                        │  (SSL/TLS)  │
                        └──────┬──────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        ┌──────────┐     ┌──────────┐     ┌──────────┐
        │ Backend  │     │ Backend  │     │ Backend  │
        │Instance 1│     │Instance 2│     │Instance 3│
        │ (Fastify)│     │ (Fastify)│     │ (Fastify)│
        └────┬─────┘     └────┬─────┘     └────┬─────┘
             │                │                │
             │                │                │
             └────────────────┼────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
         ┌─────────────┐            ┌─────────────┐
         │ PostgreSQL  │            │    Redis    │
         │  (Primary)  │            │   Cluster   │
         └──────┬──────┘            └─────────────┘
                │
         ┌──────┴──────┐
         │             │
         ▼             ▼
  ┌───────────┐ ┌───────────┐
  │PostgreSQL │ │PostgreSQL │
  │(Replica 1)│ │(Replica 2)│
  └───────────┘ └───────────┘
       │             │
       └──────┬──────┘
              │
        (Read queries)
\`\`\`

**Конфигурация Nginx Load Balancer:**

\`\`\`nginx
upstream backend {
    least_conn; # Балансировка по наименьшему числу соединений
    
    server backend1.promptyflow.com:3000 weight=1;
    server backend2.promptyflow.com:3000 weight=1;
    server backend3.promptyflow.com:3000 weight=1;
}

server {
    listen 443 ssl http2;
    server_name api.promptyflow.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
\`\`\`

### Database Scaling (масштабирование БД)

**1. Read Replicas (реплики для чтения)**

\`\`\`typescript
// Разделение на чтение/запись
const prismaWrite = new PrismaClient({ datasources: { db: { url: PRIMARY_URL } } })
const prismaRead = new PrismaClient({ datasources: { db: { url: REPLICA_URL } } })

// Чтение из реплики
const projects = await prismaRead.project.findMany({ where: { userId } })

// Запись в primary
const newProject = await prismaWrite.project.create({ data: { ... } })
\`\`\`

**2. Sharding (будущее)**

Разделение данных по пользователям:

\`\`\`typescript
function getShardForUser(userId: string): 'shard1' | 'shard2' | 'shard3' {
  // Consistent hashing
  const hash = crypto.createHash('md5').update(userId).digest('hex')
  const numShards = 3
  const shardIndex = parseInt(hash.substring(0, 8), 16) % numShards
  return \`shard\${shardIndex + 1}\` as any
}

const shard = getShardForUser(userId)
const prisma = prismaClients[shard]
\`\`\`

**3. Connection Pooling с PgBouncer**

\`\`\`
Application (20 connections) ──┐
Application (20 connections) ──┼─→ PgBouncer ─→ PostgreSQL (100 connections)
Application (20 connections) ──┘     (pool)
\`\`\`

### Caching Strategy (стратегия кеширования)

**Многоуровневое кеширование:**

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                      CACHE LAYERS                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  L1: Browser Cache (React Query)                             │
│      • Automatic caching                                     │
│      • staleTime: 5-15 min                                   │
│      • cacheTime: 10 min                                     │
│      Данные: projects, templates, AI models                  │
│                                                               │
│  ────────────────────────────────────────────────────        │
│                                                               │
│  L2: Redis Cache (Backend)                                   │
│      • AI models list: 1 hour                                │
│      • User sessions: 7 days                                 │
│      • API rate limits: 1 min                                │
│      Данные: модели AI, сессии, rate limiting               │
│                                                               │
│  ────────────────────────────────────────────────────        │
│                                                               │
│  L3: PostgreSQL (Persistent Storage)                         │
│      • Permanent storage                                     │
│      • Full-text search indexes                              │
│      • Foreign key constraints                               │
│      Данные: users, projects, templates, api_keys            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## База данных

### Схема PostgreSQL

\`\`\`prisma
// apps/api/prisma/schema.prisma

model User {
  id            String    @id @default(cuid())
  googleId      String    @unique
  email         String    @unique
  name          String?
  picture       String?
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  projects      Project[]
  templates     Template[]
  apiKeys       ApiKey[]

  @@index([googleId])
  @@index([email])
}

model Project {
  id        String   @id @default(cuid())
  userId    String
  name      String
  data      Json     // ProjectData { contextBlocks, promptBlocks }
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

  // Generated columns для full-text search
  name_tsv    Unsupported("tsvector")? @default(dbgenerated("to_tsvector('english', name)"))
  content_tsv Unsupported("tsvector")? @default(dbgenerated("to_tsvector('english', content)"))

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([name_tsv], type: Gin)
  @@index([content_tsv], type: Gin)
}

model ApiKey {
  id           String   @id @default(cuid())
  userId       String
  provider     String   // 'openai' | 'anthropic' | 'gemini' | 'grok' | 'openrouter'
  encryptedKey String   @db.Text
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, provider])
  @@index([userId])
}
\`\`\`

### Типы данных

**ProjectData (хранится в JSONB):**

\`\`\`typescript
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
\`\`\`

### Миграции

Пример миграции для добавления full-text search:

\`\`\`sql
-- apps/api/prisma/migrations/20251203183130_add_fulltext_search_indexes/migration.sql

-- Добавляем tsvector столбцы
ALTER TABLE templates 
ADD COLUMN name_tsv tsvector 
GENERATED ALWAYS AS (to_tsvector('english', name)) STORED;

ALTER TABLE templates 
ADD COLUMN content_tsv tsvector 
GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

-- Создаем GIN индексы
CREATE INDEX idx_templates_name_tsv ON templates USING gin(name_tsv);
CREATE INDEX idx_templates_content_tsv ON templates USING gin(content_tsv);
\`\`\`

---

## AI интеграция

### Архитектура AI провайдеров

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT REQUEST                            │
│  POST /ai/send                                              │
│  { provider: 'openai', model: 'gpt-4o', messages: [...] }  │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI ROUTE HANDLER                          │
│  1. Authenticate user                                        │
│  2. Get API key from database (encrypted)                    │
│  3. Decrypt API key                                          │
│  4. Select provider instance                                 │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  PROVIDER FACTORY                            │
│  switch (provider) {                                         │
│    case 'openai': return new OpenAIProvider()               │
│    case 'anthropic': return new AnthropicProvider()         │
│    case 'gemini': return new GeminiProvider()               │
│    case 'grok': return new GrokProvider()                   │
│    case 'openrouter': return new OpenRouterProvider()       │
│  }                                                           │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 PROVIDER INSTANCE                            │
│  provider.sendMessage({                                      │
│    apiKey, model, messages, temperature, maxTokens          │
│  })                                                          │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│  OpenAI    │  │ Anthropic  │  │   Gemini   │
│    API     │  │    API     │  │    API     │
└────────────┘  └────────────┘  └────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI RESPONSE                                │
│  { content: 'Generated text...', usage: { ... } }           │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   RETURN TO CLIENT                           │
│  { success: true, response: 'Generated text...' }           │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### Поддерживаемые провайдеры

| Провайдер | Модели | Особенности |
|-----------|--------|-------------|
| **OpenAI** | GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-3.5-turbo, GPT-5.1 | GPT-5.1 использует `/v1/responses` endpoint |
| **Anthropic** | Claude 4.5 Sonnet/Opus, Claude 4 Sonnet/Opus, Claude 3.5 Sonnet/Haiku | Поддержка всех новых моделей Claude |
| **Google Gemini** | Gemini 2.5 Flash, Gemini 1.5 Flash/Pro | Использует v1beta API |
| **X.AI Grok** | Grok Beta, Grok Vision Beta | Новый провайдер от X.AI |
| **OpenRouter** | 100+ моделей от разных провайдеров | Агрегатор моделей |

### Пример использования

\`\`\`typescript
// Frontend: Отправка промпта в AI
const response = await api.post('/ai/send', {
  provider: 'openai',
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: compiledPrompt }
  ],
  temperature: 0.7,
  maxTokens: 2000,
})

console.log(response.data.response)
\`\`\`

---

## Мониторинг и логирование

### Winston Logger

\`\`\`typescript
// apps/api/src/lib/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
})
\`\`\`

### Метрики для отслеживания

**1. Performance Metrics (производительность):**
- API response time (p50, p95, p99)
- Database query time
- Redis cache hit ratio
- AI provider response time

**2. Business Metrics (бизнес-метрики):**
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Projects created per day
- AI API calls per day
- Template usage
- Average project size

**3. Error Metrics (ошибки):**
- Error rate by endpoint
- Failed AI requests
- Database connection errors
- Authentication failures

---

**Дата создания:** 05.12.2025  
**Последнее обновление:** 05.12.2025  
**Статус:** Актуально  
**Версия:** 2.0 (детализированная русская версия)
