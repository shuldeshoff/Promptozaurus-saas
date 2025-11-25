// src/components/ui/LanguageSwitcher.js - Language switcher component
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageProvider';

const LanguageSwitcher = () => {
  const { currentLanguage, availableLanguages, changeLanguage, isChangingLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage);

  const handleLanguageSelect = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChangingLanguage}
        className="
          flex items-center space-x-1 px-3 py-1.5 text-xs font-medium 
          bg-gray-700 text-gray-200 rounded hover:bg-gray-600 
          transition-all duration-200 border border-gray-600
          disabled:opacity-50 disabled:cursor-not-allowed
        "
        title="Select language"
      >
        <span>{currentLang?.shortName || 'EN'}</span>
        <svg 
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="
          absolute right-0 mt-1 w-32 bg-gray-800 border border-gray-600 
          rounded shadow-lg z-50 overflow-hidden
        ">
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`
                w-full px-3 py-2 text-xs text-left transition-colors duration-150
                ${currentLanguage === lang.code 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span>{lang.name}</span>
                {currentLanguage === lang.code && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;