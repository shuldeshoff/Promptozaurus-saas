import { useState, useEffect, useRef, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface ModalOption {
  value: string;
  label: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  primaryButtonText?: string;
  onPrimaryButtonClick?: (value?: string) => void;
  secondaryButtonText?: string;
  primaryButtonClassName?: string;
  withInput?: boolean;
  inputPlaceholder?: string;
  inputDefaultValue?: string;
  options?: ModalOption[] | null;
}

/**
 * Компонент модального окна для приложения
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
  options = null,
}: ModalProps) => {
  const { t } = useTranslation('modals');

  // Use provided texts or defaults from translation
  const primaryBtnText = primaryButtonText || t('modals.modal.defaultPrimaryButton');
  const secondaryBtnText = secondaryButtonText || t('modals.modal.defaultSecondaryButton');
  const placeholder = inputPlaceholder || t('modals.modal.defaultInputPlaceholder');

  const [inputValue, setInputValue] = useState(inputDefaultValue);
  const [selectedOption, setSelectedOption] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

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
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Обработчик нажатия клавиши Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePrimaryButtonClick();
    }
  };

  // Обработчик нажатия основной кнопки
  const handlePrimaryButtonClick = () => {
    if (onPrimaryButtonClick) {
      if (options && options.length > 0) {
        onPrimaryButtonClick(selectedOption);
      } else if (withInput) {
        onPrimaryButtonClick(inputValue);
      } else {
        onPrimaryButtonClick();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={handleOverlayClick}>
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
          <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors" onClick={onClose}>
            {secondaryBtnText}
          </button>

          <button className={`px-4 py-2 text-white rounded transition-colors ${primaryButtonClassName}`} onClick={handlePrimaryButtonClick}>
            {primaryBtnText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;

