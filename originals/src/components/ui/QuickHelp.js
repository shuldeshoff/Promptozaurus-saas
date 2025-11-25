// src/components/ui/QuickHelp.js - Компонент быстрой справки
import React from 'react';
import { useTranslation } from 'react-i18next';
import quickHelpData from '../../data/quickHelp';

const QuickHelp = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const helpContent = quickHelpData[currentLang] || quickHelpData.en;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Help Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
          {/* Header */}
          <div className="bg-gray-900 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center">
              <span className="mr-2">❓</span>
              {helpContent.title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {helpContent.sections.map((section, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-400 mb-3">
                    {section.title}
                  </h3>
                  <ul className="space-y-1">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-gray-300 text-sm leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            {/* Footer tip */}
            <div className="mt-6 p-4 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-700">
              <p className="text-blue-300 text-sm flex items-center">
                <span className="mr-2">💡</span>
                {currentLang === 'ru' 
                  ? 'Нажмите F1 в любой момент для вызова этой справки'
                  : 'Press F1 at any time to show this help'}
              </p>
            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-gray-900 px-6 py-3 border-t border-gray-700 flex justify-between items-center">
            <span className="text-gray-500 text-xs">
              {currentLang === 'ru' ? 'Версия 1.0.0' : 'Version 1.0.0'}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              {currentLang === 'ru' ? 'Закрыть' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuickHelp;