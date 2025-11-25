// tailwind.config.js - Конфигурация TailwindCSS, определяет обрабатываемые файлы и дополнительные настройки
module.exports = {
  // Пути к файлам, в которых используются классы Tailwind
  content: [
    './src/**/*.{html,js,jsx}',
  ],
  // Режим темной темы ('class' означает, что темная тема включается через класс 'dark')
  darkMode: 'class',
  // Расширения и настройки темы
  theme: {
    extend: {
      // Добавляем дополнительные цвета, используемые в нашем дизайне
      colors: {
        gray: {
          750: '#2e3748',
          850: '#1a2233',
          950: '#0f172a',
        }
      },
      // Добавляем анимации для плавных переходов
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-out',
        'highlight': 'highlight 1s ease-in-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        highlight: {
          '0%': { backgroundColor: 'transparent' },
          '30%': { backgroundColor: 'rgba(66, 153, 225, 0.2)' },
          '100%': { backgroundColor: 'transparent' }
        }
      },
      // Добавляем переходы для более плавных взаимодействий
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      }
    },
  },
  // Варианты для классов (например, hover, focus и т.д.)
  variants: {
    extend: {
      opacity: ['group-hover'],
      display: ['group-hover'],
      backgroundColor: ['active', 'focus'],
      borderColor: ['focus'],
    },
  },
  // Плагины для добавления дополнительной функциональности
  plugins: [],
}