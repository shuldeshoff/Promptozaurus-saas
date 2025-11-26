import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface CreateBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (title: string) => void;
  type: 'context' | 'prompt';
  defaultNumber: number;
}

export default function CreateBlockModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  defaultNumber,
}: CreateBlockModalProps) {
  const { t } = useTranslation('common');
  const [title, setTitle] = useState('');

  const defaultName = type === 'context'
    ? t('labels.contextBlock', 'Context Block') + ` ${defaultNumber}`
    : t('labels.promptBlock', 'Prompt Block') + ` ${defaultNumber}`;

  useEffect(() => {
    if (isOpen) {
      setTitle('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || defaultName;
    onConfirm(finalTitle);
    setTitle('');
    onClose();
  };

  const handleQuickCreate = () => {
    onConfirm(defaultName);
    setTitle('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        className="bg-gray-900 rounded-lg w-full max-w-md border border-gray-800 shadow-xl"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {type === 'context' ? '📝' : '💬'}
            {type === 'context'
              ? t('messages.createContextBlock', 'Create Context Block')
              : t('messages.createPromptBlock', 'Create Prompt Block')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('labels.blockName', 'Block name')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={defaultName}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('messages.leaveEmptyForDefault', 'Leave empty for default name')}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleQuickCreate}
              className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
            >
              ⚡ {t('buttons.quickCreate', 'Quick Create')}
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              ✓ {t('buttons.create', 'Create')}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            {t('buttons.cancel', 'Cancel')}
          </button>
        </form>

        {/* Footer hint */}
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-500 text-center">
            {t('messages.pressEscToClose', 'Press Esc to close')} • {t('messages.pressEnterToCreate', 'Press Enter to create')}
          </p>
        </div>
      </div>
    </div>
  );
}

