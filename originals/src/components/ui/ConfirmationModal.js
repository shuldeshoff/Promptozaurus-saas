// src/components/ui/ConfirmationModal.js
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
const ConfirmationModal = ({
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
  options = null
}) => {
  const { t } = useTranslation();
  
  // Используем переводы по умолчанию, если не переданы значения
  const modalTitle = title || t('modals.confirmation.title');
  const confirmText = confirmButtonText || t('modals.confirmation.confirmButton');
  const cancelText = cancelButtonText || t('modals.confirmation.cancelButton');
  console.log('Rendering confirmation modal:', { isOpen, title, message, withInput, options });
  
  const handleConfirm = (inputValue) => {
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