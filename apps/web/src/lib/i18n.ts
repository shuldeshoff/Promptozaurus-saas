import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import commonEN from '../locales/en/common.json';
import commonRU from '../locales/ru/common.json';
import headerEN from '../locales/en/header.json';
import headerRU from '../locales/ru/header.json';
import navigationEN from '../locales/en/navigation.json';
import navigationRU from '../locales/ru/navigation.json';
import blocksEN from '../locales/en/blocks.json';
import blocksRU from '../locales/ru/blocks.json';
import blockItemEN from '../locales/en/blockItem.json';
import blockItemRU from '../locales/ru/blockItem.json';
import editorEN from '../locales/en/editor.json';
import editorRU from '../locales/ru/editor.json';
import modalsEN from '../locales/en/modals.json';
import modalsRU from '../locales/ru/modals.json';
import splitModalEN from '../locales/en/splitModal.json';
import splitModalRU from '../locales/ru/splitModal.json';
import aiEN from '../locales/en/ai.json';
import aiRU from '../locales/ru/ai.json';
import aiConfigEN from '../locales/en/aiConfig.json';
import aiConfigRU from '../locales/ru/aiConfig.json';
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
    blockItem: blockItemEN,
    editor: editorEN,
    modals: modalsEN,
    splitModal: splitModalEN,
    ai: aiEN,
    aiConfig: aiConfigEN,
    notifications: notificationsEN,
    contextSelection: contextSelectionEN,
  },
  ru: {
    common: commonRU,
    header: headerRU,
    navigation: navigationRU,
    blocks: blocksRU,
    blockItem: blockItemRU,
    editor: editorRU,
    modals: modalsRU,
    splitModal: splitModalRU,
    ai: aiRU,
    aiConfig: aiConfigRU,
    notifications: notificationsRU,
    contextSelection: contextSelectionRU,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('i18nextLng') || 'ru', // Берём из localStorage или ru по умолчанию
    fallbackLng: 'en',
    defaultNS: 'common',
    debug: false, // Отключаем debug в production
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

