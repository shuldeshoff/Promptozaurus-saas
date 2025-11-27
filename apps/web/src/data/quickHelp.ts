// src/data/quickHelp.ts - Компактная справка для быстрого доступа по F1
// Портировано 1:1 из originals/src/data/quickHelp.js

export interface QuickHelpSection {
  title: string;
  items: string[];
}

export interface QuickHelpContent {
  title: string;
  sections: QuickHelpSection[];
}

export interface QuickHelpData {
  ru: QuickHelpContent;
  en: QuickHelpContent;
}

export const quickHelpData: QuickHelpData = {
  ru: {
    title: "Быстрая справка",
    sections: [
      {
        title: "О PromptyFlow",
        items: [
          "• Профессиональный конструктор промптов для AI",
          "• Сайт: https://promptyflow.com/",
          "• Основная идея: гибкое управление структурой контекста",
          "• Выбирайте какие части контекста включать в промпт",
          "• Создавайте многоуровневые шаблоны для разных задач"
        ]
      },
      {
        title: "🎯 Основы работы",
        items: [
          "• Создайте проект: кнопка Новый проект",
          "• Добавьте контекст: вкладка Контекст → ➕ Добавить блок",
          "• Создайте промпт: вкладка Промпт → ➕ Добавить промпт",
          "• Используйте {{context}} в шаблоне для вставки контекста"
        ]
      },
      {
        title: "📁 Гибкая структура контекста",
        items: [
          "• Блок → Элемент → Подэлемент (3 уровня)",
          "• Drag-select для точечного выбора нужных частей",
          "• Комбинируйте элементы из разных блоков",
          "• Один контекст — множество вариантов промптов"
        ]
      },
      {
        title: "✏️ Редактор промптов",
        items: [
          "• Шаблон: основной текст с {{context}}",
          "• Выбор контекста: выделите нужные блоки/элементы",
          "• Компиляция: объединяет шаблон и контекст",
          "• С тегами: добавляет XML-обёртки для структуры"
        ]
      },
      {
        title: "⌨️ Горячие клавиши",
        items: [
          "• Ctrl+S — Сохранить проект",
          "• Ctrl+E — Полноэкранный редактор",
          "• Ctrl+C/V — Копировать/Вставить",
          "• Esc — Закрыть модальное окно",
          "• F1 — Эта справка"
        ]
      },
      {
        title: "🤖 AI интеграция",
        items: [
          "• Настройки AI → Добавить API ключ",
          "• Скомпилировать → Отправить в AI",
          "• Поддержка: OpenAI, Claude, Gemini, Grok, OpenRouter",
          "• Тестирование ключей: кнопка Test",
          "• Ответ можно скопировать в буфер"
        ]
      },
      {
        title: "💡 Советы",
        items: [
          "• Разбивайте большие тексты кнопкой 'Разделить'",
          "• Сохраняйте шаблоны для переиспользования",
          "• Группируйте связанный контекст в блоки",
          "• Используйте подэлементы для детализации",
          "• Проекты автоматически сохраняются"
        ]
      },
      {
        title: "🔐 Безопасность",
        items: [
          "• API ключи шифруются AES-256-GCM",
          "• Данные хранятся на защищённом сервере",
          "• Google OAuth для входа",
          "• Делитесь проектами с другими пользователями"
        ]
      }
    ]
  },
  en: {
    title: "Quick Help",
    sections: [
      {
        title: "About PromptyFlow",
        items: [
          "• Professional prompt constructor for AI models",
          "• Website: https://promptyflow.com/",
          "• Core idea: flexible context structure management",
          "• Choose which context parts to include in prompts",
          "• Create multi-level templates for different tasks"
        ]
      },
      {
        title: "🎯 Getting Started",
        items: [
          "• Create project: New Project button",
          "• Add context: Context tab → ➕ Add Block",
          "• Create prompt: Prompt tab → ➕ Add Prompt",
          "• Use {{context}} in template for context insertion"
        ]
      },
      {
        title: "📁 Flexible Context Structure",
        items: [
          "• Block → Item → Sub-item (3 levels)",
          "• Drag-select for precise selection of needed parts",
          "• Combine elements from different blocks",
          "• One context — multiple prompt variations"
        ]
      },
      {
        title: "✏️ Prompt Editor",
        items: [
          "• Template: main text with {{context}}",
          "• Context selection: select needed blocks/items",
          "• Compile: combines template and context",
          "• With tags: adds XML wrappers for structure"
        ]
      },
      {
        title: "⌨️ Keyboard Shortcuts",
        items: [
          "• Ctrl+S — Save project",
          "• Ctrl+E — Fullscreen editor",
          "• Ctrl+C/V — Copy/Paste",
          "• Esc — Close modal window",
          "• F1 — This help"
        ]
      },
      {
        title: "🤖 AI Integration",
        items: [
          "• AI Settings → Add API key",
          "• Compile → Send to AI",
          "• Supports: OpenAI, Claude, Gemini, Grok, OpenRouter",
          "• Test keys: Test button",
          "• Response can be copied to clipboard"
        ]
      },
      {
        title: "💡 Tips",
        items: [
          "• Split large texts with 'Split' button",
          "• Save templates for reuse",
          "• Group related context in blocks",
          "• Use sub-items for detail",
          "• Projects auto-save automatically"
        ]
      },
      {
        title: "🔐 Security",
        items: [
          "• API keys encrypted with AES-256-GCM",
          "• Data stored on secure server",
          "• Google OAuth for login",
          "• Share projects with other users"
        ]
      }
    ]
  }
};

export default quickHelpData;

