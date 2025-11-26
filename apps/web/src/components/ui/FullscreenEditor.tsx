import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface FullscreenEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
  title?: string;
  content?: string;
}

const FullscreenEditor = ({ isOpen, onClose, onSave, title, content = '' }: FullscreenEditorProps) => {
  const { t } = useTranslation('modals');
  const [text, setText] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use provided title or default from translation
  const displayTitle = title || t('fullscreenEditor.defaultTitle');

  useEffect(() => {
    setText(content);
  }, [content]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleSave = () => {
    onSave(text);
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        const copyBtn = document.getElementById('copy-button');
        if (copyBtn) {
          const originalText = copyBtn.textContent;
          copyBtn.textContent = t('fullscreenEditor.copied');
          setTimeout(() => {
            copyBtn.textContent = originalText;
          }, 1500);
        }
      })
      .catch((err) => console.error(t('fullscreenEditor.copyError') + ':', err));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 flex flex-col" onKeyDown={handleKeyDown}>
      <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-medium text-white">{displayTitle}</h2>
        <button className="text-gray-400 hover:text-white" onClick={onClose} title={t('fullscreenEditor.closeTooltip')}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <textarea
          ref={textareaRef}
          className="w-full h-full p-4 bg-gray-800 text-white border border-gray-700 rounded
                     focus:outline-none focus:border-blue-500 resize-none"
          value={text}
          onChange={handleTextChange}
          spellCheck
        />
      </div>

      <div className="bg-gray-800 p-4 border-t border-gray-700 flex justify-between items-center">
        <div className="text-sm text-gray-400">
          {text.length} {t('fullscreenEditor.characters')}
        </div>
        <div className="flex space-x-4">
          <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors" onClick={onClose}>
            {t('fullscreenEditor.cancel')}
          </button>
          <button id="copy-button" className="px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-600 transition-colors" onClick={handleCopy}>
            {t('fullscreenEditor.copy')}
          </button>
          <button className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 transition-colors" onClick={handleSave}>
            {t('fullscreenEditor.ok')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullscreenEditor;

