import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import commonEN from '../locales/en/common.json';
import commonRU from '../locales/ru/common.json';
import headerEN from '../locales/en/header.json';
import headerRU from '../locales/ru/header.json';
import navigationEN from '../locales/en/navigation.json';
import navigationRU from '../locales/ru/navigation.json';
import blocksEN from '../locales/en/blocks.json';
import blocksRU from '../locales/ru/blocks.json';
import editorEN from '../locales/en/editor.json';
import editorRU from '../locales/ru/editor.json';
import modalsEN from '../locales/en/modals.json';
import modalsRU from '../locales/ru/modals.json';
import aiEN from '../locales/en/ai.json';
import aiRU from '../locales/ru/ai.json';
import notificationsEN from '../locales/en/notifications.json';
import notificationsRU from '../locales/ru/notifications.json';
import contextSelectionEN from '../locales/en/contextSelection.json';
import contextSelectionRU from '../locales/ru/contextSelection.json';

const resources = {
  en: {
    common: commonEN,
    header: headerEN,
    navigation: navigationEN,
    blocks: blocksEN,
    editor: editorEN,
    modals: modalsEN,
    ai: aiEN,
    notifications: notificationsEN,
    contextSelection: contextSelectionEN,
  },
  ru: {
    common: commonRU,
    header: headerRU,
    navigation: navigationRU,
    blocks: blocksRU,
    editor: editorRU,
    modals: modalsRU,
    ai: aiRU,
    notifications: notificationsRU,
    contextSelection: contextSelectionRU,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

