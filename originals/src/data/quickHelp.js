// src/data/quickHelp.js - Компактная справка для быстрого доступа по F1

export const quickHelpData = {
  ru: {
    title: "Быстрая справка",
    sections: [
      {
        title: "О PromptyFlow",
        items: [
          "• Профессиональный конструктор промптов для AI",
          "• Сайт: http://promptyflow.com/",
          "• Основная идея: гибкое управление структурой контекста",
          "• Выбирайте какие части контекста включать в промпт",
          "• Создавайте многоуровневые шаблоны для разных задач"
        ]
      },
      {
        title: "🎯 Основы работы",
        items: [
          "• Создайте проект: Файл → Новый проект",
          "• Добавьте контекст: вкладка Контекст → ➕ Добавить блок",
          "• Создайте промпт: вкладка Промпт → ➕ Добавить промпт",
          "• Используйте {{context}} в шаблоне для вставки контекста"
        ]
      },
      {
        title: "📁 Гибкая структура контекста",
        items: [
          "• Блок → Элемент → Подэлемент (3 уровня)",
          "• Чекбоксы для точечного выбора нужных частей",
          "• Комбинируйте элементы из разных блоков",
          "• Один контекст — множество вариантов промптов"
        ]
      },
      {
        title: "✏️ Редактор промптов",
        items: [
          "• Шаблон: основной текст с {{context}}",
          "• Выбор контекста: отметьте нужные блоки/элементы",
          "• Компиляция: объединяет шаблон и контекст",
          "• С тегами: добавляет XML-обёртки для структуры"
        ]
      },
      {
        title: "⌨️ Горячие клавиши",
        items: [
          "• Ctrl+S — Сохранить проект",
          "• Ctrl+N — Новый проект",
          "• Ctrl+E — Полноэкранный редактор",
          "• Ctrl+C/V — Копировать/Вставить",
          "• F1 — Эта справка"
        ]
      },
      {
        title: "🤖 AI интеграция",
        items: [
          "• Настройки AI → Добавить API ключ",
          "• Скомпилировать → Отправить в AI",
          "• Поддержка: OpenAI, Claude, Gemini, Grok",
          "• Ответ можно добавить обратно в контекст"
        ]
      },
      {
        title: "💡 Советы",
        items: [
          "• Разбивайте большие тексты кнопкой 'Разделить'",
          "• Сохраняйте шаблоны для переиспользования",
          "• Группируйте связанный контекст в блоки",
          "• Используйте подэлементы для детализации"
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
          "• Website: http://promptyflow.com/",
          "• Core idea: flexible context structure management",
          "• Choose which context parts to include in prompts",
          "• Create multi-level templates for different tasks"
        ]
      },
      {
        title: "🎯 Getting Started",
        items: [
          "• Create project: File → New Project",
          "• Add context: Context tab → ➕ Add Block",
          "• Create prompt: Prompt tab → ➕ Add Prompt",
          "• Use {{context}} in template for context insertion"
        ]
      },
      {
        title: "📁 Flexible Context Structure",
        items: [
          "• Block → Item → Sub-item (3 levels)",
          "• Checkboxes for precise selection of needed parts",
          "• Combine elements from different blocks",
          "• One context — multiple prompt variations"
        ]
      },
      {
        title: "✏️ Prompt Editor",
        items: [
          "• Template: main text with {{context}}",
          "• Context selection: check needed blocks/items",
          "• Compile: combines template and context",
          "• With tags: adds XML wrappers for structure"
        ]
      },
      {
        title: "⌨️ Keyboard Shortcuts",
        items: [
          "• Ctrl+S — Save project",
          "• Ctrl+N — New project",
          "• Ctrl+E — Fullscreen editor",
          "• Ctrl+C/V — Copy/Paste",
          "• F1 — This help"
        ]
      },
      {
        title: "🤖 AI Integration",
        items: [
          "• AI Settings → Add API key",
          "• Compile → Send to AI",
          "• Supports: OpenAI, Claude, Gemini, Grok",
          "• Response can be added back to context"
        ]
      },
      {
        title: "💡 Tips",
        items: [
          "• Split large texts with 'Split' button",
          "• Save templates for reuse",
          "• Group related context in blocks",
          "• Use sub-items for detail"
        ]
      }
    ]
  }
};

export default quickHelpData;