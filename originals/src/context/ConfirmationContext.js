// src/context/ConfirmationContext.js - Контекст для работы с модальными окнами подтверждения
import React, { createContext, useContext, useState } from 'react';

console.log('Инициализация контекста подтверждения');

// Создаем контекст
const ConfirmationContext = createContext();

/**
 * Провайдер контекста для модальных окон подтверждения
 * @param {Object} props - Свойства компонента
 * @param {React.ReactNode} props.children - Дочерние элементы
 */
export function ConfirmationProvider({ children }) {
  // Состояние для модального окна подтверждения
  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmButtonText: 'Подтвердить',
    withInput: false,
    inputDefaultValue: ''
  });
  
  /**
   * Функция для открытия модального окна подтверждения
   * @param {string} title - Заголовок окна
   * @param {string} message - Сообщение в окне
   * @param {function} onConfirm - Функция, вызываемая при подтверждении
   * @param {string} confirmButtonText - Текст кнопки подтверждения
   * @param {boolean} withInput - Нужно ли поле ввода
   * @param {string} inputDefaultValue - Значение по умолчанию для поля ввода
   */
  const openConfirmation = (title, message, onConfirm, confirmButtonText = 'Подтвердить', withInput = false, inputDefaultValue = '') => {
    console.log('Открытие окна подтверждения:', { title, message, withInput, inputDefaultValue });
    setConfirmationState({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmButtonText,
      withInput,
      inputDefaultValue
    });
  };
  
  // Функция для закрытия модального окна подтверждения
  const closeConfirmation = () => {
    console.log('Закрытие окна подтверждения');
    setConfirmationState(prev => ({ ...prev, isOpen: false }));
  };
  
  const value = {
    confirmationState,
    openConfirmation,
    closeConfirmation
  };
  
  return (
    <ConfirmationContext.Provider value={value}>
      {children}
    </ConfirmationContext.Provider>
  );
}

/**
 * Хук для использования контекста подтверждения
 * @returns {Object} Контекст подтверждения
 */
export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (context === undefined) {
    throw new Error('useConfirmation должен использоваться внутри ConfirmationProvider');
  }
  return context;
}

export default ConfirmationContext;