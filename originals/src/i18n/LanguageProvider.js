// src/i18n/LanguageProvider.js - Провайдер для управления языками
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Создаем контекст для языковых настроек
const LanguageContext = createContext();

// Хук для использования контекста языка
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

// Компонент провайдера языка
export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  // List of available languages (English first by default)
  const availableLanguages = [
    { code: 'en', name: 'English', shortName: 'EN' },
    { code: 'ru', name: 'Русский', shortName: 'RU' }
  ];

  // Функция переключения языка
  const changeLanguage = async (languageCode) => {
    if (languageCode === currentLanguage || isChangingLanguage) return;
    
    setIsChangingLanguage(true);
    try {
      await i18n.changeLanguage(languageCode);
      setCurrentLanguage(languageCode);
      
      // Сохраняем выбор в localStorage
      localStorage.setItem('appLanguage', languageCode);
      
      console.log(`Язык успешно изменен на: ${languageCode}`);
    } catch (error) {
      console.error('Ошибка при смене языка:', error);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  // Функция переключения на следующий язык (для быстрого переключения)
  const toggleLanguage = () => {
    const currentIndex = availableLanguages.findIndex(lang => lang.code === currentLanguage);
    const nextIndex = (currentIndex + 1) % availableLanguages.length;
    changeLanguage(availableLanguages[nextIndex].code);
  };

  // Получение информации о текущем языке
  const getCurrentLanguageInfo = () => {
    return availableLanguages.find(lang => lang.code === currentLanguage) || availableLanguages[0];
  };

  // Эффект для синхронизации с i18n
  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const value = {
    currentLanguage,
    availableLanguages,
    changeLanguage,
    toggleLanguage,
    getCurrentLanguageInfo,
    isChangingLanguage
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;