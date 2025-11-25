// src/index.js - Точка входа React приложения, где происходит монтирование корневого компонента
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import './styles/main.css';

// Импорт конфигурации i18n
import './i18n/config';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/config';
import { LanguageProvider } from './i18n/LanguageProvider';

// Создаем корень React приложения и рендерим в него основной компонент App
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </I18nextProvider>
  </React.StrictMode>
);