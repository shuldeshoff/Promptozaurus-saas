/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gray: {
          750: '#2e3748',
          850: '#1a2233',
          950: '#0f172a',
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        highlight: 'highlight 1s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        highlight: {
          '0%': { backgroundColor: 'transparent' },
          '30%': { backgroundColor: 'rgba(66, 153, 225, 0.2)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      // Добавляем переходы для более плавных взаимодействий (из originals)
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      }
    },
  },
  // Варианты для классов (из originals)
  variants: {
    extend: {
      opacity: ['group-hover'],
      display: ['group-hover'],
      backgroundColor: ['active', 'focus'],
      borderColor: ['focus'],
    },
  },
  plugins: [],
};

