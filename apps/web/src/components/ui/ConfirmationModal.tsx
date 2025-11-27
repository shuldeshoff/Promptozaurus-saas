// src/components/ui/ConfirmationModal.tsx
// Портировано 1:1 из originals/src/components/ui/ConfirmationModal.js
import React from 'react';
import Modal from './Modal';
import { useTranslation } from 'react-i18next';

/**
 * Компонент модального окна для подтверждения действий
 * @param {Object} props - Свойства компонента
 * @param {boolean} props.isOpen - Флаг открытия модального окна
 * @param {function} props.onClose - Обработчик закрытия окна
 * @param {string} props.title - Заголовок модального окна
 * @param {string} props.message - Сообщение внутри модального окна
 * @param {function} props.onConfirm - Обработчик подтверждения
 * @param {string} props.confirmButtonText - Текст кнопки подтверждения
 * @param {string} props.cancelButtonText - Текст кнопки отмены
 * @param {string} props.confirmButtonClass - Дополнительные классы для кнопки подтверждения
 * @param {boolean} props.withInput - Флаг, указывающий на необходимость поля ввода
 * @param {string} props.inputDefaultValue - Значение по умолчанию для поля ввода
 * @param {Array} props.options - Массив вариантов для выбора (для выпадающего списка)
 * @returns {React.ReactElement}
 */
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  onConfirm: (inputValue?: string) => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonClass?: string;
  withInput?: boolean;
  inputDefaultValue?: string;
  options?: { value: string; label: string }[] | null;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmButtonText,
  cancelButtonText,
  confirmButtonClass = 'bg-red-600 hover:bg-red-700',
  withInput = false,
  inputDefaultValue = '',
  options = null,
}) => {
  const { t } = useTranslation('modals');

  // Используем переводы по умолчанию, если не переданы значения
  const modalTitle = title || t('confirmation.title');
  const confirmText = confirmButtonText || t('confirmation.confirmButton');
  const cancelText = cancelButtonText || t('confirmation.cancelButton');
  console.log('Rendering confirmation modal:', { isOpen, title, message, withInput, options });

  const handleConfirm = (inputValue?: string) => {
    console.log('Action confirmed:', { title, inputValue });
    onConfirm(inputValue);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      primaryButtonText={confirmText}
      secondaryButtonText={cancelText}
      onPrimaryButtonClick={handleConfirm}
      primaryButtonClassName={confirmButtonClass}
      withInput={withInput}
      inputDefaultValue={inputDefaultValue}
      options={options}
    >
      <p className="text-gray-300">{message}</p>
    </Modal>
  );
};

export default ConfirmationModal;

