# PromptyFlow - Claude Code Instructions

## 🎯 Core Principles

### Communication Language
- **DEFAULT**: Respond in Russian (ru) unless explicitly asked otherwise
- **ALTERNATIVE**: Switch to English (en) when requested or contextually appropriate
- Always acknowledge which language you're using at the start of complex tasks
- Code comments: Use the UI language setting (check `src/config/language.js`)
- Variable names and function names: Always in English

### Task Execution Philosophy
- Understand first, execute second - summarize the task before starting
- Work incrementally - complete one feature fully before moving to the next
- Verify after changes - run tests and check functionality
- Commit frequently - after each meaningful change

## 🔧 Project Configuration

### Location & Structure
- **Windows Path**: `C:\MyJSProject\PromptyFlow-v-0-8-en-ru"`
- **WSL Path**: `/mnt/c/MyJSProject/PromptyFlow-v-0-8-en-ru`
- **Architecture**: Electron + React (multi-language support)
- **Languages**: JavaScript ES6+, HTML5, CSS3
- **I18n**: Built-in internationalization (en/ru)

### Tech Stack
```yaml
Core:
  - Electron: Desktop application framework
  - React: UI components with hooks
  - Node.js: Backend processes
  
Internationalization:
  - i18next: Translation management
  - react-i18next: React bindings
  
Development:
  - VS Code: Primary IDE
  - WSL Ubuntu: Development environment
  - Git: Version control
```

## 📁 Project Structure

```
PromptyFlow-v-0-8-en-ru/
├── src/
│   ├── main/              # Electron main process
│   ├── renderer/           # React application
│   │   ├── components/     # UI components
│   │   ├── services/       # Business logic
│   │   ├── store/          # State management
│   │   ├── locales/        # Translation files
│   │   │   ├── en/         # English translations
│   │   │   └── ru/         # Russian translations
│   │   └── utils/          # Utilities
│   └── preload/            # Electron preload scripts
├── scripts/                # Build and utility scripts
├── .claude/                # Claude Code configuration
│   └── commands/           # Custom commands
└── CLAUDE.md              # This file
```

## 🌍 Internationalization Rules

### Translation Management
- All UI text must use i18n keys, never hardcoded strings
- Translation keys format: `section.subsection.key`
- Keep translations in sync between en/ru files
- Default fallback language: English

### Implementation Pattern
```javascript
// ✅ Correct
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
return <button>{t('common.buttons.save')}</button>;

// ❌ Wrong
return <button>Save</button>;
```

### Language Files Structure
```javascript
// src/renderer/locales/en/translation.json
{
  "common": {
    "buttons": {
      "save": "Save",
      "cancel": "Cancel"
    }
  }
}

// src/renderer/locales/ru/translation.json
{
  "common": {
    "buttons": {
      "save": "Сохранить",
      "cancel": "Отмена"
    }
  }
}
```

## 🛡️ Safety & Backup

### Automatic Backup Protocol
```bash
# ALWAYS before major changes
bash scripts/backup-win.sh

# Backup locations
Windows: C:\MyJSProject\Backups\PromptyFlow\
WSL: ~/development/backups/PromptyFlow/
```

### Pre-task Checklist
1. Create backup: `bash scripts/backup-win.sh`
2. Verify current branch: `git branch`
3. Check uncommitted changes: `git status`
4. Run existing tests: `npm test`

## 📝 Code Style Guidelines

### JavaScript/React
```javascript
// File header (bilingual based on UI setting)
// src/path/to/file.js - Brief description
// @description: Detailed functionality
// @i18n: [en/ru] - supported languages
// @created: YYYY-MM-DD

// Modern ES6+ syntax
const ComponentName = ({ prop1, prop2 }) => {
  const { t, i18n } = useTranslation();
  
  // Conditional rendering based on language
  const isRussian = i18n.language === 'ru';
  
  return (
    <div className="component-name">
      {/* Internationalized content */}
    </div>
  );
};

export default ComponentName;
```

### CSS Organization
```css
/* Component-specific styles */
.component-name {
  /* RTL/LTR support for internationalization */
  direction: var(--text-direction);
}

/* Language-specific adjustments */
[lang="ru"] .component-name {
  /* Russian-specific styles if needed */
}
```

## 🚀 Development Commands

### Essential Commands
```bash
# Development
npm run dev           # Start with hot-reload
npm run dev:ru       # Start with Russian UI
npm run dev:en       # Start with English UI

# Building
npm run build        # Production build
npm run build:win    # Windows installer
npm run build:mac    # macOS installer
npm run build:linux  # Linux packages

# Testing & Quality
npm test             # Run all tests
npm run test:i18n    # Test translations
npm run lint         # Check code style
npm run format       # Auto-fix formatting

# Translation Management
npm run i18n:extract # Extract new translation keys
npm run i18n:sync    # Sync translations between languages
npm run i18n:validate # Check for missing translations
```

## 🎯 Task Execution Workflow

### For New Features
1. Understand requirements in context of both languages
2. Create backup: `bash scripts/backup-win.sh`
3. Design bilingual UI/UX considerations
4. Implement with i18n from the start
5. Test in both languages
6. Commit with descriptive message (English)

### For Bug Fixes
1. Reproduce in both language modes
2. Identify root cause
3. Fix with minimal changes
4. Verify fix in both languages
5. Update tests if needed
6. Commit with issue reference

### For Translations
1. Extract new keys: `npm run i18n:extract`
2. Add translations to both locale files
3. Validate completeness: `npm run i18n:validate`
4. Test UI in both languages
5. Commit translations separately

## 🔍 Common Patterns

### Dynamic Language Switching
```javascript
// Language switcher component
const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ru' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };
  
  return (
    <button onClick={toggleLanguage}>
      {i18n.language === 'en' ? '🇬🇧 EN' : '🇷🇺 RU'}
    </button>
  );
};
```

### Pluralization Support
```javascript
// Use i18next pluralization
t('items.count', { count: itemCount })
// en: "{{count}} item" / "{{count}} items"
// ru: "{{count}} элемент" / "{{count}} элемента" / "{{count}} элементов"
```

## 🐛 Debugging & Troubleshooting

### Language-specific Issues
- Check browser console for i18n warnings
- Verify translation keys exist in both locales
- Test with language switcher, not just startup setting
- Check for hardcoded strings: `grep -r '"[А-Яа-я]' src/`

### Common Problems
```bash
# Missing translations
npm run i18n:validate

# Language not persisting
# Check: localStorage.getItem('language')

# Wrong language on startup
# Check: src/config/language.js defaultLanguage
```

## 📚 Project-Specific Knowledge

### PromptyFlow Features
- Multi-stage prompt construction
- Template library with categories
- Variable placeholder system
- Execution matrix for complex workflows
- Context management for AI interactions
- Project state persistence
- Export/Import functionality

### Key Services
- `promptService` - Prompt generation and management
- `templateService` - Template CRUD operations
- `i18nService` - Language and translation management
- `storageService` - Data persistence
- `exportService` - Import/export functionality

## 🎨 UI/UX Principles

### Bilingual Design Considerations
- Text expansion: Russian text ~30% longer than English
- Button sizing: Use min-width to accommodate both languages
- Date/time formats: Respect locale preferences
- Number formats: Use Intl.NumberFormat
- Icons: Prefer universal symbols over text

### Accessibility
- ARIA labels must be translated
- Keyboard shortcuts should work in both languages
- Screen reader support for both languages
- RTL support ready (for future language additions)

## 🔒 Security Considerations

### Electron Security
```javascript
// Main process
webPreferences: {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true
}
```

### Translation Security
- Sanitize user input before translation
- Never use innerHTML with translated content
- Validate translation files on build
- Use React's built-in XSS protection

## 💡 Best Practices

### Do's ✅
- Always think bilingual from the start
- Test every feature in both languages
- Keep translations contextual and natural
- Use translation comments for complex keys
- Maintain consistent terminology across languages

### Don'ts ❌
- Never hardcode UI strings
- Don't mix languages in the same context
- Avoid machine translation for production
- Don't forget pluralization rules
- Never commit incomplete translations

## 🎬 Quick Start Guide

```bash
# 1. Clone and setup
cd /mnt/c/MyJSProject/PromptyFlow

# 2. Install dependencies
npm install

# 3. Create backup
bash scripts/backup-win.sh

# 4. Start development (Russian mode)
npm run dev:ru

# 5. Make changes with i18n in mind

# 6. Test both languages
npm run test:i18n

# 7. Commit changes
git add .
git commit -m "feat: add bilingual support for [feature]"
```

## 📋 Checklist for Every Task

- [ ] Backup created before starting
- [ ] Task understood and confirmed with user
- [ ] Both language versions implemented
- [ ] Translations added and validated
- [ ] Tested in both EN and RU modes
- [ ] Code follows project conventions
- [ ] Comments in appropriate language
- [ ] Changes committed with clear message
- [ ] User informed about what changed

## 🔗 External Resources

- [Electron i18n Best Practices](https://www.electronjs.org/docs/latest/tutorial/internationalization)
- [React i18next Documentation](https://react.i18next.com/)
- [i18next Pluralization](https://www.i18next.com/translation-function/plurals)

---

*Remember: You're building a professional multi-language application. Every feature should work seamlessly in both English and Russian from day one.*