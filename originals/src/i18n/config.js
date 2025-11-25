// src/i18n/config.js - i18next configuration for multi-language support
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Импорт переводов
import ruCommon from '../locales/ru/common.json';
import ruHeader from '../locales/ru/header.json';
import ruNavigation from '../locales/ru/navigation.json';
import ruModals from '../locales/ru/modals.json';
import ruNotifications from '../locales/ru/notifications.json';
import ruBlocks from '../locales/ru/blocks.json';
import ruEditor from '../locales/ru/editor.json';
import ruAi from '../locales/ru/ai.json';
import ruBlockItem from '../locales/ru/blockItem.json';
import ruSplitModal from '../locales/ru/splitModal.json';
import ruAiConfig from '../locales/ru/aiConfig.json';

import enCommon from '../locales/en/common.json';
import enHeader from '../locales/en/header.json';
import enNavigation from '../locales/en/navigation.json';
import enModals from '../locales/en/modals.json';
import enNotifications from '../locales/en/notifications.json';
import enBlocks from '../locales/en/blocks.json';
import enEditor from '../locales/en/editor.json';
import enAi from '../locales/en/ai.json';
import enBlockItem from '../locales/en/blockItem.json';
import enSplitModal from '../locales/en/splitModal.json';
import enAiConfig from '../locales/en/aiConfig.json';

// Объединение всех переводов
const resources = {
  ru: {
    translation: {
      common: ruCommon,
      header: ruHeader,
      navigation: ruNavigation,
      modals: ruModals,
      notifications: ruNotifications,
      blocks: ruBlocks,
      editor: ruEditor,
      ai: ruAi,
      blockItem: ruBlockItem,
      splitModal: ruSplitModal,
      aiConfig: ruAiConfig
    }
  },
  en: {
    translation: {
      common: enCommon,
      header: enHeader,
      navigation: enNavigation,
      modals: enModals,
      notifications: enNotifications,
      blocks: enBlocks,
      editor: enEditor,
      ai: enAi,
      blockItem: enBlockItem,
      splitModal: enSplitModal,
      aiConfig: enAiConfig
    }
  }
};

// Get saved language from localStorage (default to English)
const savedLanguage = localStorage.getItem('appLanguage') || 'en';

i18n
  .use(LanguageDetector) // Детектор языка браузера
  .use(initReactI18next) // Интеграция с React
  .init({
    resources,
    lng: savedLanguage, // Default language
    fallbackLng: 'en', // Fallback language
    
    // List of supported languages (English first)
    supportedLngs: ['en', 'ru'],
    
    // Опции для детектора языка
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },

    interpolation: {
      escapeValue: false // React уже защищает от XSS
    },

    // Пространство имен по умолчанию
    defaultNS: 'translation',
    
    // Режим отладки (отключен в продакшене)
    debug: process.env.NODE_ENV === 'development',

    // Настройки для вложенных ключей
    keySeparator: '.',
    nsSeparator: ':',

    // Реагировать на изменение языка
    react: {
      useSuspense: false // Отключаем Suspense для совместимости с Electron
    }
  });

// Слушатель изменения языка для сохранения в localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('appLanguage', lng);
  console.log(`Language changed to: ${lng}`);
});

export default i18n;