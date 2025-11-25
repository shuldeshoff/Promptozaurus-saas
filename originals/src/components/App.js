// src/components/App.js - Корневой компонент React, отвечающий за основную структуру приложения
import React, { useEffect } from 'react';
import MainLayout from './layout/MainLayout';
import { AppProvider } from '../context/AppContext';
import { ConfirmationProvider } from '../context/ConfirmationContext';
import ConfirmationModal from './ui/ConfirmationModal';
import { useConfirmation } from '../context/ConfirmationContext';
import AppStateService from '../services/AppStateService';
import AppInitializer from './AppInitializer';

// Обертка для модального окна подтверждения, использующая контекст подтверждения
const AppConfirmationModal = () => {
  // Импортируем контекст для модального окна
  const { confirmationState, closeConfirmation } = useConfirmation();
  
  console.log('Рендеринг AppConfirmationModal с параметрами:', {
    isOpen: confirmationState.isOpen,
    title: confirmationState.title,
    withInput: confirmationState.withInput,
    inputDefaultValue: confirmationState.inputDefaultValue
  });
  
  return (
    <ConfirmationModal
      isOpen={confirmationState.isOpen}
      onClose={closeConfirmation}
      title={confirmationState.title}
      message={confirmationState.message}
      onConfirm={confirmationState.onConfirm}
      confirmButtonText={confirmationState.confirmButtonText}
      cancelButtonText={confirmationState.cancelButtonText}
      confirmButtonClass={confirmationState.confirmButtonClass}
      withInput={confirmationState.withInput}
      inputDefaultValue={confirmationState.inputDefaultValue}
      options={confirmationState.options}
    />
  );
};

// Основной компонент приложения
const App = () => {
  console.log('Инициализация приложения');
  
  useEffect(() => {
    // Функция для обработки закрытия окна
    const handleBeforeUnload = (e) => {
      // Предотвращаем стандартное поведение только если это не наш выход
      if (!window.isExitingApp) {
        console.log('Обнаружена попытка закрытия окна');
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    // Добавляем обработчик
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Удаляем обработчик при размонтировании компонента
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  return (
    // Оборачиваем приложение в провайдеры контекстов
    <ConfirmationProvider>
      <AppProvider>
        <AppInitializer>
          {/* Рендерим основной макет приложения */}
          <MainLayout />
          
          {/* Модальное окно для подтверждения действий */}
          <AppConfirmationModal />
        </AppInitializer>
      </AppProvider>
    </ConfirmationProvider>
  );
};

export default App;