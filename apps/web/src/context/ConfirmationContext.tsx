// src/context/ConfirmationContext.tsx - Контекст для работы с модальными окнами подтверждения
// Портировано 1:1 из originals/src/context/ConfirmationContext.js
import React, { createContext, useContext, useState } from 'react';

console.log('Инициализация контекста подтверждения');

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (inputValue?: string) => void;
  confirmButtonText: string;
  confirmButtonClass?: string;
  withInput: boolean;
  inputDefaultValue: string;
  options?: { value: string; label: string }[] | null;
}

interface ConfirmationContextType {
  confirmationState: ConfirmationState;
  openConfirmation: (
    title: string,
    message: string,
    onConfirm: (inputValue?: string) => void,
    confirmButtonText?: string,
    confirmButtonClass?: string,
    withInput?: boolean,
    inputDefaultValue?: string,
    options?: { value: string; label: string }[] | null
  ) => void;
  closeConfirmation: () => void;
}

// Создаем контекст
const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

/**
 * Провайдер контекста для модальных окон подтверждения
 * @param {Object} props - Свойства компонента
 * @param {React.ReactNode} props.children - Дочерние элементы
 */
export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  // Состояние для модального окна подтверждения
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmButtonText: 'Подтвердить',
    confirmButtonClass: 'bg-red-600 hover:bg-red-700',
    withInput: false,
    inputDefaultValue: '',
    options: null,
  });

  /**
   * Функция для открытия модального окна подтверждения
   * @param {string} title - Заголовок окна
   * @param {string} message - Сообщение в окне
   * @param {function} onConfirm - Функция, вызываемая при подтверждении
   * @param {string} confirmButtonText - Текст кнопки подтверждения
   * @param {string} confirmButtonClass - CSS класс для кнопки подтверждения
   * @param {boolean} withInput - Нужно ли поле ввода
   * @param {string} inputDefaultValue - Значение по умолчанию для поля ввода
   * @param {Array} options - Опции для dropdown
   */
  const openConfirmation = (
    title: string,
    message: string,
    onConfirm: (inputValue?: string) => void,
    confirmButtonText = 'Подтвердить',
    confirmButtonClass = 'bg-red-600 hover:bg-red-700',
    withInput = false,
    inputDefaultValue = '',
    options: { value: string; label: string }[] | null = null
  ) => {
    console.log('Открытие окна подтверждения:', { title, message, withInput, inputDefaultValue, options });
    setConfirmationState({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmButtonText,
      confirmButtonClass,
      withInput,
      inputDefaultValue,
      options,
    });
  };

  // Функция для закрытия модального окна подтверждения
  const closeConfirmation = () => {
    console.log('Закрытие окна подтверждения');
    setConfirmationState((prev) => ({ ...prev, isOpen: false }));
  };

  const value: ConfirmationContextType = {
    confirmationState,
    openConfirmation,
    closeConfirmation,
  };

  return <ConfirmationContext.Provider value={value}>{children}</ConfirmationContext.Provider>;
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

