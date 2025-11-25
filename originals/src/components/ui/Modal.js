// src/components/ui/Modal.js
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Компонент модального окна для приложения
 * @param {Object} props - Свойства компонента
 * @param {boolean} props.isOpen - Флаг открытия модального окна
 * @param {function} props.onClose - Обработчик закрытия окна
 * @param {string} props.title - Заголовок модального окна
 * @param {React.ReactNode} props.children - Содержимое модального окна
 * @param {string} props.primaryButtonText - Текст основной кнопки
 * @param {function} props.onPrimaryButtonClick - Обработчик нажатия основной кнопки
 * @param {string} props.secondaryButtonText - Текст вторичной кнопки
 * @param {string} props.primaryButtonClassName - Дополнительные классы для основной кнопки
 * @param {boolean} props.withInput - Флаг, указывающий на необходимость поля ввода
 * @param {string} props.inputPlaceholder - Плейсхолдер для поля ввода
 * @param {string} props.inputDefaultValue - Значение по умолчанию для поля ввода
 * @param {Array} props.options - Массив вариантов для выбора (для выпадающего списка)
 * @returns {React.ReactElement|null}
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  primaryButtonText, 
  onPrimaryButtonClick, 
  secondaryButtonText,
  primaryButtonClassName = 'bg-blue-600 hover:bg-blue-700',
  withInput = false,
  inputPlaceholder,
  inputDefaultValue = '',
  options = null
}) => {
  const { t } = useTranslation();
  
  // Use provided texts or defaults from translation
  const primaryBtnText = primaryButtonText || t('modals.modal.defaultPrimaryButton');
  const secondaryBtnText = secondaryButtonText || t('modals.modal.defaultSecondaryButton');
  const placeholder = inputPlaceholder || t('modals.modal.defaultInputPlaceholder');
  
  console.log('Rendering modal:', { isOpen, title, withInput, options });
  
  const [inputValue, setInputValue] = useState(inputDefaultValue);
  const [selectedOption, setSelectedOption] = useState('');
  const inputRef = useRef(null);
  const selectRef = useRef(null);
  
  // Устанавливаем значение по умолчанию при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      setInputValue(inputDefaultValue);
      
      if (options && options.length > 0) {
        setSelectedOption(options[0].value);
      }
      
      // Фокусируемся на поле ввода или выпадающем списке после отрисовки компонента
      setTimeout(() => {
        if (withInput && inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        } else if (options && selectRef.current) {
          selectRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen, inputDefaultValue, withInput, options]);
  
  if (!isOpen) return null;

  // Предотвращение "всплытия" клика из оверлея на внутренние элементы
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Обработчик нажатия клавиши Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      console.log('Enter key pressed in modal input field');
      handlePrimaryButtonClick();
    }
  };
  
  // Обработчик нажатия основной кнопки
  const handlePrimaryButtonClick = () => {
    console.log('Primary button clicked in modal');
    if (options && options.length > 0) {
      onPrimaryButtonClick(selectedOption);
    } else if (withInput) {
      onPrimaryButtonClick(inputValue);
    } else {
      onPrimaryButtonClick();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-gray-800 rounded-lg max-w-md w-full shadow-lg">
        <div className="border-b border-gray-700 px-4 py-3">
          <h3 className="text-lg font-medium text-white">{title}</h3>
        </div>
        
        <div className="px-4 py-4">
          {children}
          
          {/* Если есть options, отображаем выпадающий список */}
          {options && options.length > 0 && (
            <div className="mt-4">
              <select
                ref={selectRef}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
              >
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Если withInput=true, отображаем поле ввода */}
          {withInput && (
            <div className="mt-4">
              <input
                ref={inputRef}
                type="text"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-700">
          <button
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            onClick={onClose}
          >
            {secondaryBtnText}
          </button>
          
          <button
            className={`px-4 py-2 text-white rounded transition-colors ${primaryButtonClassName}`}
            onClick={handlePrimaryButtonClick}
          >
            {primaryBtnText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;