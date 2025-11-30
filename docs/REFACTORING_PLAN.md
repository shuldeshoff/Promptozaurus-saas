# План рефакторинга системы кнопок

**Дата создания:** 30 ноября 2025  
**Статус:** Планирование  
**Приоритет:** Средний  

---

## Цель

Создать единую систему дизайна для кнопок, устранить дублирование кода и обеспечить визуальную консистентность во всём приложении.

**Текущее состояние:**
- 112 кнопок в 24 компонентах
- Множество дублирующихся стилей
- Несколько разных паттернов (Tailwind классы, CSS модули)
- Разные размеры padding, border-radius, hover эффекты

**Целевое состояние:**
- 5 переиспользуемых компонентов кнопок
- Единый API для всех кнопок
- TypeScript типизация
- Полная консистентность UI
- Улучшенная accessibility

---

## Компоненты для создания

### 1. Button.tsx - Основная кнопка действия

**Путь:** `apps/web/src/components/ui/Button.tsx`

**Props:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  className?: string;
}
```

**Варианты (variants):**
- `primary` - `bg-blue-600 hover:bg-blue-700` (основные действия)
- `secondary` - `bg-gray-700 hover:bg-gray-600` (отмена, второстепенные)
- `danger` - `bg-red-600 hover:bg-red-700` (удаление, опасные действия)
- `success` - `bg-green-600 hover:bg-green-700` (успешные действия, сохранение)
- `purple` - `bg-purple-600 hover:bg-purple-700` (AI-related actions)

**Размеры (sizes):**
- `sm` - `px-3 py-1 text-xs` (маленькие кнопки в списках)
- `md` - `px-4 py-2 text-sm` (стандартный размер)
- `lg` - `px-6 py-3 text-base` (большие кнопки призыва к действию)

**Дополнительные стили:**
- `rounded-lg` для всех
- `transition-colors` для плавных переходов
- `disabled:opacity-50 disabled:cursor-not-allowed`
- `whitespace-nowrap` по умолчанию

**Покрывает:** ~35 кнопок

**Примеры использования:**
```tsx
<Button variant="primary" size="md" onClick={handleSave}>
  Сохранить
</Button>

<Button variant="danger" size="sm" onClick={handleDelete} disabled={loading}>
  Удалить
</Button>

<Button variant="purple" size="lg" fullWidth loading={isGenerating}>
  Сгенерировать ответ
</Button>
```

---

### 2. IconButton.tsx - Кнопка с иконкой

**Путь:** `apps/web/src/components/ui/IconButton.tsx`

**Props:**
```typescript
interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  variant?: 'default' | 'danger' | 'success' | 'primary' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  rounded?: boolean; // rounded-full vs rounded
  disabled?: boolean;
  tooltip?: string;
  className?: string;
}
```

**Варианты (variants):**
- `default` - `text-gray-400 hover:text-gray-300 hover:bg-gray-700`
- `danger` - `text-red-400 hover:text-red-300 hover:bg-red-900/30`
- `success` - `text-green-400 hover:text-green-300 hover:bg-green-900/30`
- `primary` - `text-blue-400 hover:text-blue-300 hover:bg-blue-900/30`
- `warning` - `text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30`

**Размеры (sizes):**
- `xs` - `p-0.5` (16x16px) - очень маленькие иконки
- `sm` - `p-1` (24x24px) - стандартные иконки в тулбарах
- `md` - `p-2` (32x32px) - средние иконки
- `lg` - `p-3` (40x40px) - крупные иконки

**Дополнительные стили:**
- `rounded` по умолчанию
- `rounded-full` если `rounded={true}`
- `transition-colors`
- Автоматический tooltip через `title` атрибут

**Покрывает:** ~45 кнопок

**Примеры использования:**
```tsx
<IconButton 
  icon={<TrashIcon />} 
  variant="danger" 
  size="sm"
  tooltip="Удалить"
  onClick={handleDelete}
/>

<IconButton 
  icon={<PlusIcon />} 
  variant="primary" 
  size="md"
  rounded
  onClick={handleAdd}
/>

<IconButton 
  icon={<EditIcon />} 
  size="sm"
  onClick={handleEdit}
/>
```

---

### 3. IconTextButton.tsx - Кнопка с иконкой и текстом

**Путь:** `apps/web/src/components/ui/IconTextButton.tsx`

**Props:**
```typescript
interface IconTextButtonProps {
  icon: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: (e: React.MouseEvent) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}
```

**Layout:**
- Flex контейнер с `items-center gap-2`
- Иконка слева или справа в зависимости от `iconPosition`
- Автоматический truncate для длинного текста

**Варианты:** те же что у Button

**Размеры:** те же что у Button

**Покрывает:** ~12 кнопок

**Примеры использования:**
```tsx
<IconTextButton 
  icon={<SettingsIcon />} 
  iconPosition="left"
  variant="secondary"
  size="sm"
  onClick={openSettings}
>
  AI Settings
</IconTextButton>

<IconTextButton 
  icon={<LogoutIcon />} 
  variant="danger"
  size="sm"
  onClick={logout}
>
  Выход
</IconTextButton>
```

---

### 4. TabButton.tsx - Кнопка вкладки

**Путь:** `apps/web/src/components/ui/TabButton.tsx`

**Props:**
```typescript
interface TabButtonProps {
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}
```

**Стили:**
- **Активная вкладка:** 
  - `bg-gray-800 text-white border-b-2 border-blue-400`
  - или `text-blue-400 font-semibold`
- **Неактивная вкладка:**
  - `text-gray-400 hover:text-gray-300`
  - `hover:bg-gray-700/50`

**Покрывает:** ~8 кнопок

**Примеры использования:**
```tsx
<div className="flex gap-2">
  <TabButton 
    active={activeTab === 'providers'} 
    icon={<ShieldIcon />}
    onClick={() => setActiveTab('providers')}
  >
    Провайдеры
  </TabButton>
  
  <TabButton 
    active={activeTab === 'models'}
    icon={<ChipIcon />}
    onClick={() => setActiveTab('models')}
  >
    Модели
  </TabButton>
</div>
```

---

### 5. AddButton.tsx - Кнопка добавления

**Путь:** `apps/web/src/components/ui/AddButton.tsx`

**Props:**
```typescript
interface AddButtonProps {
  onClick?: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md';
  variant?: 'default' | 'subitem';
  disabled?: boolean;
  tooltip?: string;
  className?: string;
}
```

**Стили:**
- Border: `2px dashed` (default) или `1px dashed` (subitem)
- Background: полупрозрачный `rgba(30, 64, 175, 0.1)`
- Color: `text-blue-500`
- При hover: `border-solid`, увеличение яркости, shadow

**Варианты:**
- `default` - для основных элементов
- `subitem` - для подэлементов (меньше размер)

**Размеры:**
- `sm` - `w-7 h-7` (28x28px) для sub-items
- `md` - `w-9 h-9` (36x36px) для основных items

**Покрывает:** ~8 кнопок

**Примеры использования:**
```tsx
<AddButton 
  size="md" 
  onClick={handleAddItem}
  tooltip="Добавить элемент"
/>

<AddButton 
  size="sm" 
  variant="subitem"
  onClick={handleAddSubItem}
  tooltip="Добавить подэлемент"
/>
```

---

## Порядок миграции

### Sprint 1: Критические компоненты (День 1, 2-3 часа)

**Задачи:**
1. Создать все 5 компонентов кнопок
2. Добавить в exports: `apps/web/src/components/ui/index.ts`
3. Мигрировать `AIConfigModal.tsx` (12 кнопок)
4. Мигрировать `NavigationPanel.tsx` (6 кнопок)
5. Локальное тестирование
6. Коммит: "refactor(ui): create button components and migrate AI Config + Navigation"
7. Deploy to production
8. Мониторинг и hotfix при необходимости

**Покрыто:** 18 кнопок (16% от общего числа)

---

### Sprint 2: Редакторы (День 2, 2-3 часа)

**Задачи:**
1. Мигрировать `ContextEditor.tsx` (18 кнопок)
2. Мигрировать `ContextBlockItem.tsx` (4 кнопки)
3. Мигрировать `PromptEditor.tsx` (9 кнопок)
4. Мигрировать `PromptBlockItem.tsx` (3 кнопки)
5. Тестирование редакторов
6. Коммит: "refactor(ui): migrate editors to button components"
7. Deploy to production

**Покрыто:** 34 кнопки (30% от общего числа)  
**Всего на этом этапе:** 52 кнопки (46%)

---

### Sprint 3: Модальные окна (День 3, 1-2 часа)

**Задачи:**
1. Мигрировать `AIResponseModal.tsx` (8 кнопок)
2. Мигрировать `Modal.tsx` (3 кнопки)
3. Мигрировать `SplitPreviewList.tsx` (2 кнопки)
4. Мигрировать `QuickHelp.tsx` (2 кнопки)
5. Тестирование модальных окон
6. Коммит: "refactor(ui): migrate modals to button components"
7. Deploy to production

**Покрыто:** 15 кнопок (13% от общего числа)  
**Всего на этом этапе:** 67 кнопок (60%)

---

### Sprint 4: Остальные компоненты (День 4, 2-3 часа)

**Задачи:**
1. Мигрировать `ProjectList.tsx` (10 кнопок)
2. Мигрировать `Header.tsx` (4 кнопки)
3. Мигрировать `ContextSelectionPanel.tsx` (3 кнопки)
4. Мигрировать `ContextSectionGrid.tsx` (3 кнопки)
5. Мигрировать `TemplateLibraryModal.tsx` (6 кнопок)
6. Мигрировать `ProjectSharingModal.tsx` (4 кнопки)
7. Мигрировать `WelcomeModal.tsx` (1 кнопка)
8. Мигрировать `ProjectSelectorModal.tsx` (4 кнопки)
9. Мигрировать `FullscreenEditor.tsx` (4 кнопки)
10. Мигрировать `ErrorBoundary.tsx` (2 кнопки)
11. Мигрировать `EmptyProjectState.tsx` (1 кнопка)
12. Мигрировать `SortableContextItem.tsx` (1 кнопка)
13. Мигрировать `SortableSubItem.tsx` (1 кнопка)
14. Полное тестирование всего приложения
15. Коммит: "refactor(ui): complete button components migration"
16. Deploy to production

**Покрыто:** 44 кнопки (39% от общего числа)  
**Всего на этом этапе:** 111 кнопок (99%)

---

## Детальная спецификация компонентов

### Button.tsx

```typescript
import { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'purple';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  purple: 'bg-purple-600 hover:bg-purple-700 text-white',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-lg font-medium transition-colors whitespace-nowrap';
  const disabledStyles = 'disabled:opacity-50 disabled:cursor-not-allowed';
  const widthStyle = fullWidth ? 'w-full' : '';
  
  const combinedClassName = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    disabledStyles,
    widthStyle,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      disabled={disabled || loading}
      className={combinedClassName}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  );
}
```

---

### IconButton.tsx

```typescript
import { ButtonHTMLAttributes, ReactNode } from 'react';

export type IconButtonVariant = 'default' | 'danger' | 'success' | 'primary' | 'warning';
export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  rounded?: boolean;
  tooltip?: string;
}

const variantStyles: Record<IconButtonVariant, string> = {
  default: 'text-gray-400 hover:text-gray-300 hover:bg-gray-700',
  danger: 'text-red-400 hover:text-red-300 hover:bg-red-900/30',
  success: 'text-green-400 hover:text-green-300 hover:bg-green-900/30',
  primary: 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/30',
  warning: 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30',
};

const sizeStyles: Record<IconButtonSize, string> = {
  xs: 'p-0.5',
  sm: 'p-1',
  md: 'p-2',
  lg: 'p-3',
};

export default function IconButton({
  icon,
  variant = 'default',
  size = 'sm',
  rounded = false,
  tooltip,
  disabled,
  className = '',
  ...props
}: IconButtonProps) {
  const baseStyles = 'transition-colors inline-flex items-center justify-center';
  const disabledStyles = 'disabled:opacity-50 disabled:cursor-not-allowed';
  const roundedStyle = rounded ? 'rounded-full' : 'rounded';
  
  const combinedClassName = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    roundedStyle,
    disabledStyles,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      disabled={disabled}
      className={combinedClassName}
      title={tooltip}
      {...props}
    >
      {icon}
    </button>
  );
}
```

---

### IconTextButton.tsx

```typescript
import { ButtonHTMLAttributes, ReactNode } from 'react';

export type IconTextButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'purple';
export type IconTextButtonSize = 'sm' | 'md' | 'lg';

export interface IconTextButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  iconPosition?: 'left' | 'right';
  variant?: IconTextButtonVariant;
  size?: IconTextButtonSize;
  children: ReactNode;
}

const variantStyles: Record<IconTextButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  purple: 'bg-purple-600 hover:bg-purple-700 text-white',
};

const sizeStyles: Record<IconTextButtonSize, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function IconTextButton({
  icon,
  iconPosition = 'left',
  variant = 'primary',
  size = 'md',
  disabled,
  children,
  className = '',
  ...props
}: IconTextButtonProps) {
  const baseStyles = 'rounded-lg font-medium transition-colors inline-flex items-center gap-2 whitespace-nowrap';
  const disabledStyles = 'disabled:opacity-50 disabled:cursor-not-allowed';
  
  const combinedClassName = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    disabledStyles,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      disabled={disabled}
      className={combinedClassName}
      {...props}
    >
      {iconPosition === 'left' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
      <span className="truncate">{children}</span>
      {iconPosition === 'right' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </button>
  );
}
```

---

### TabButton.tsx

```typescript
import { ButtonHTMLAttributes, ReactNode } from 'react';

export interface TabButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export default function TabButton({
  active = false,
  icon,
  disabled,
  children,
  className = '',
  ...props
}: TabButtonProps) {
  const baseStyles = 'px-6 py-3 font-medium transition-all inline-flex items-center gap-2';
  const activeStyles = active
    ? 'text-white bg-gray-800 border-b-2 border-blue-400'
    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50';
  const disabledStyles = 'disabled:opacity-50 disabled:cursor-not-allowed';
  
  const combinedClassName = [
    baseStyles,
    activeStyles,
    disabledStyles,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      disabled={disabled}
      className={combinedClassName}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
```

---

### AddButton.tsx

```typescript
import { ButtonHTMLAttributes } from 'react';

export type AddButtonSize = 'sm' | 'md';
export type AddButtonVariant = 'default' | 'subitem';

export interface AddButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: AddButtonSize;
  variant?: AddButtonVariant;
  tooltip?: string;
}

const sizeStyles: Record<AddButtonSize, string> = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
};

const variantStyles: Record<AddButtonVariant, string> = {
  default: 'border-2 dashed',
  subitem: 'border dashed',
};

export default function AddButton({
  size = 'md',
  variant = 'default',
  tooltip,
  disabled,
  className = '',
  ...props
}: AddButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg border-blue-600 bg-blue-600/10 text-blue-500 hover:border-blue-500 hover:border-solid hover:bg-blue-600/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all';
  const disabledStyles = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-dashed';
  
  const combinedClassName = [
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    disabledStyles,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      disabled={disabled}
      className={combinedClassName}
      title={tooltip}
      {...props}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
        />
      </svg>
    </button>
  );
}
```

---

## Карта миграции по файлам

### Критический путь (Приоритет 1)

| Файл | Кнопок | Компоненты для использования | Сложность |
|------|--------|------------------------------|-----------|
| `AIConfigModal.tsx` | 12 | Button, IconButton, TabButton | Средняя |
| `NavigationPanel.tsx` | 6 | IconButton, AddButton | Низкая |

### Редакторы (Приоритет 2)

| Файл | Кнопок | Компоненты для использования | Сложность |
|------|--------|------------------------------|-----------|
| `ContextEditor.tsx` | 18 | IconButton, Button, AddButton | Высокая |
| `ContextBlockItem.tsx` | 4 | IconButton, AddButton | Низкая |
| `PromptEditor.tsx` | 9 | IconButton, Button | Средняя |
| `PromptBlockItem.tsx` | 3 | IconButton | Низкая |

### Модальные окна (Приоритет 3)

| Файл | Кнопок | Компоненты для использования | Сложность |
|------|--------|------------------------------|-----------|
| `AIResponseModal.tsx` | 8 | Button, IconButton | Средняя |
| `Modal.tsx` | 3 | Button | Низкая |
| `SplitPreviewList.tsx` | 2 | Button | Низкая |
| `QuickHelp.tsx` | 2 | Button | Низкая |

### Остальные (Приоритет 4)

| Файл | Кнопок | Компоненты для использования | Сложность |
|------|--------|------------------------------|-----------|
| `ProjectList.tsx` | 10 | IconButton, Button | Средняя |
| `Header.tsx` | 4 | IconTextButton | Низкая |
| `ContextSelectionPanel.tsx` | 3 | Button | Низкая |
| `ContextSectionGrid.tsx` | 3 | Button, IconButton | Низкая |
| `TemplateLibraryModal.tsx` | 6 | Button | Низкая |
| `ProjectSharingModal.tsx` | 4 | Button | Низкая |
| `WelcomeModal.tsx` | 1 | Button | Низкая |
| `ProjectSelectorModal.tsx` | 4 | Button | Низкая |
| `FullscreenEditor.tsx` | 4 | IconButton | Низкая |
| `ErrorBoundary.tsx` | 2 | Button | Низкая |
| `EmptyProjectState.tsx` | 1 | IconTextButton | Низкая |
| `SortableContextItem.tsx` | 1 | IconButton (drag handle) | Низкая |
| `SortableSubItem.tsx` | 1 | IconButton (drag handle) | Низкая |

---

## Примеры миграции

### До (текущий код):

```tsx
// AIConfigModal.tsx
<button
  onClick={handleSave}
  disabled={upsertMutation.isPending}
  className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
>
  {upsertMutation.isPending ? 'Проверка...' : 'Сохранить и проверить'}
</button>
```

### После (с компонентом):

```tsx
// AIConfigModal.tsx
import { Button } from '../ui';

<Button
  variant="purple"
  size="md"
  onClick={handleSave}
  loading={upsertMutation.isPending}
>
  Сохранить и проверить
</Button>
```

---

### До (icon button):

```tsx
// NavigationPanel.tsx
<button
  className={`p-1 rounded-full transition-colors ${
    currentProject 
      ? 'bg-blue-700 hover:bg-blue-600 text-white cursor-pointer' 
      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
  }`}
  onClick={handleAddContextBlock}
  disabled={!currentProject}
  title="Добавить блок контекста"
>
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
</button>
```

### После (с компонентом):

```tsx
// NavigationPanel.tsx
import { IconButton, PlusIcon } from '../ui';

<IconButton
  icon={<PlusIcon />}
  variant={currentProject ? 'primary' : 'default'}
  size="sm"
  rounded
  disabled={!currentProject}
  tooltip="Добавить блок контекста"
  onClick={handleAddContextBlock}
/>
```

---

## Оценка времени по этапам

| Этап | Задачи | Время | Кнопок |
|------|--------|-------|--------|
| **Sprint 0** | Создание компонентов | 2-3 ч | 0 → 5 компонентов |
| **Sprint 1** | AI Config + Navigation | 1 ч | 18 (16%) |
| **Sprint 2** | Редакторы | 2 ч | 34 (30%) |
| **Sprint 3** | Модальные окна | 1 ч | 15 (13%) |
| **Sprint 4** | Остальные компоненты | 2 ч | 44 (39%) |
| **Sprint 5** | Тестирование | 1-2 ч | Все 111 (99%) |
| **Sprint 6** | Документация | 0.5 ч | - |
| **ИТОГО** | | **9-12 часов** | **111/112** |

---

## Метрики успеха

### Код качество
- [ ] 0 дублирования стилей кнопок
- [ ] -400 строк кода (примерная экономия)
- [ ] 100% TypeScript типизация
- [ ] Все кнопки используют компоненты

### UI консистентность
- [ ] Все кнопки одного size имеют одинаковую высоту
- [ ] Единый border-radius (8px / rounded-lg)
- [ ] Единые hover эффекты
- [ ] Единые disabled states

### UX улучшения
- [ ] Все кнопки имеют tooltips где необходимо
- [ ] Loading states работают везде
- [ ] Keyboard navigation улучшен
- [ ] Touch targets минимум 44x44px на мобильных

### Performance
- [ ] Нет регрессии по bundle size
- [ ] Нет новых re-renders
- [ ] Tree-shaking работает корректно

---

## Риски и митигация

### Риск 1: Визуальные регрессии
**Вероятность:** Средняя  
**Влияние:** Среднее  
**Митигация:**
- Делать скриншоты до/после каждого компонента
- Тестировать на всех breakpoints
- Использовать visual regression testing если возможно

### Риск 2: Функциональные баги
**Вероятность:** Низкая  
**Влияние:** Высокое  
**Митигация:**
- Миграция по одному компоненту за раз
- Полное тестирование после каждого sprint
- Откат при критичных багах

### Риск 3: Затянутые сроки
**Вероятность:** Средняя  
**Влияние:** Низкое  
**Митигация:**
- Чёткие временные рамки для каждого sprint
- Можно остановиться после любого sprint
- Приоритизация: критичные компоненты первыми

### Риск 4: Сопротивление со стороны API компонентов
**Вероятность:** Низкая  
**Влияние:** Среднее  
**Митигация:**
- Prop `className` для кастомизации
- Гибкий API с разумными defaults
- Документация с примерами

---

## Checklist выполнения

### Sprint 0: Подготовка
- [ ] Создать `apps/web/src/components/ui/Button.tsx`
- [ ] Создать `apps/web/src/components/ui/IconButton.tsx`
- [ ] Создать `apps/web/src/components/ui/IconTextButton.tsx`
- [ ] Создать `apps/web/src/components/ui/TabButton.tsx`
- [ ] Создать `apps/web/src/components/ui/AddButton.tsx`
- [ ] Создать `apps/web/src/components/ui/icons/` (общие иконки SVG)
- [ ] Обновить `apps/web/src/components/ui/index.ts` с exports
- [ ] Написать базовые тесты для каждого компонента
- [ ] Создать example page для визуальной проверки

### Sprint 1: AI Config + Navigation
- [ ] Мигрировать `AIConfigModal.tsx`
- [ ] Мигрировать `NavigationPanel.tsx`
- [ ] Локальное тестирование
- [ ] Коммит и деплой
- [ ] Production тестирование

### Sprint 2: Редакторы
- [ ] Мигрировать `ContextEditor.tsx`
- [ ] Мигрировать `ContextBlockItem.tsx`
- [ ] Мигрировать `PromptEditor.tsx`
- [ ] Мигрировать `PromptBlockItem.tsx`
- [ ] Локальное тестирование
- [ ] Коммит и деплой
- [ ] Production тестирование

### Sprint 3: Модальные окна
- [ ] Мигрировать `AIResponseModal.tsx`
- [ ] Мигрировать `Modal.tsx`
- [ ] Мигрировать `SplitPreviewList.tsx`
- [ ] Мигрировать `QuickHelp.tsx`
- [ ] Локальное тестирование
- [ ] Коммит и деплой
- [ ] Production тестирование

### Sprint 4: Остальные компоненты
- [ ] Мигрировать `ProjectList.tsx`
- [ ] Мигрировать `Header.tsx`
- [ ] Мигрировать `ContextSelectionPanel.tsx`
- [ ] Мигрировать `ContextSectionGrid.tsx`
- [ ] Мигрировать `TemplateLibraryModal.tsx`
- [ ] Мигрировать `ProjectSharingModal.tsx`
- [ ] Мигрировать `WelcomeModal.tsx`
- [ ] Мигрировать `ProjectSelectorModal.tsx`
- [ ] Мигрировать `FullscreenEditor.tsx`
- [ ] Мигрировать `ErrorBoundary.tsx`
- [ ] Мигрировать `EmptyProjectState.tsx`
- [ ] Мигрировать `SortableContextItem.tsx`
- [ ] Мигрировать `SortableSubItem.tsx`
- [ ] Локальное тестирование
- [ ] Коммит и деплой
- [ ] Production тестирование

### Sprint 5: Финализация
- [ ] Полное регрессионное тестирование
- [ ] Проверка на всех breakpoints (mobile, tablet, desktop)
- [ ] Проверка accessibility (keyboard, screen readers)
- [ ] Performance тестирование
- [ ] Удалить неиспользуемые CSS классы
- [ ] Обновить документацию

### Sprint 6: Документация
- [ ] Создать `docs/UI_COMPONENTS.md`
- [ ] Добавить примеры использования
- [ ] Документировать все props
- [ ] Создать гайд по выбору правильной кнопки
- [ ] Добавить troubleshooting секцию

---

## Альтернативные подходы

### Вариант A: Использовать готовую UI библиотеку
**Библиотеки:** Radix UI, Headless UI, shadcn/ui

**Плюсы:**
- ✅ Готовые accessibility features
- ✅ Протестированные компоненты
- ✅ Хорошая документация

**Минусы:**
- ❌ Зависимость от внешней библиотеки
- ❌ Может потребовать больше переделок
- ❌ Увеличение bundle size

**Решение:** Не рекомендуется, так как текущие кнопки уже работают хорошо, нужна только стандартизация.

---

### Вариант B: CSS Modules вместо Tailwind
**Подход:** Создать `.module.css` для каждого компонента кнопки

**Плюсы:**
- ✅ Изоляция стилей
- ✅ Меньше verbose JSX

**Минусы:**
- ❌ Меньше гибкости
- ❌ Дополнительные файлы
- ❌ Отход от текущего паттерна (Tailwind)

**Решение:** Не рекомендуется, оставляем Tailwind для консистентности.

---

### Вариант C: Styled Components
**Подход:** Использовать CSS-in-JS библиотеку

**Плюсы:**
- ✅ Динамические стили
- ✅ Theming из коробки

**Минусы:**
- ❌ Дополнительная зависимость
- ❌ Runtime overhead
- ❌ Больше bundle size

**Решение:** Не рекомендуется для данного проекта.

---

## Рекомендации

### Делать:
✅ Мигрировать постепенно (sprint by sprint)  
✅ Тестировать после каждого этапа  
✅ Коммитить часто с понятными сообщениями  
✅ Делать скриншоты до/после  
✅ Документировать API компонентов  

### Не делать:
❌ Не мигрировать все файлы разом  
❌ Не менять логику, только UI  
❌ Не добавлять новые features во время рефакторинга  
❌ Не деплоить без тестирования  
❌ Не удалять старый код до завершения миграции  

---

## Следующие шаги

1. **Обсудить приоритеты** - решить, когда начинать рефакторинг
2. **Выбрать стратегию** - постепенная или быстрая миграция
3. **Создать ветку** - `feature/button-components-refactoring`
4. **Начать Sprint 0** - создание базовых компонентов
5. **Review и approval** - перед деплоем в production

---

## Дополнительные улучшения (опционально)

### После основного рефакторинга можно добавить:

1. **ButtonGroup.tsx** - для группировки кнопок (тулбары)
2. **ToggleButton.tsx** - для on/off состояний
3. **DropdownButton.tsx** - кнопка с выпадающим меню
4. **FloatingActionButton.tsx** - FAB для мобильных
5. **LinkButton.tsx** - кнопка-ссылка (для навигации)

---

## Примечания

- Все компоненты должны поддерживать `React.forwardRef` для доступа к DOM элементу
- Использовать `clsx` или `cn` утилиту для объединения классов
- Все компоненты должны экспортироваться через `apps/web/src/components/ui/index.ts`
- Добавить JSDoc комментарии для лучшего DX в IDE

---

**Статус:** План готов к исполнению  
**Автор:** AI Assistant  
**Последнее обновление:** 30 ноября 2025

