import { useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useTranslation } from 'react-i18next';
import { useEditor } from '../../context/EditorContext';
import ProjectManagerModal from '../ProjectManagerModal';
import AIConfigModal from '../AIConfigModal';
import QuickHelp from '../ui/QuickHelp';

const Header = () => {
  const { t, i18n } = useTranslation('header');
  const { user, logout } = useAuthStore();
  const { currentProject } = useEditor();
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ru' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <>
      <header className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        {/* Левая часть - управление проектами */}
        <div className="flex items-center gap-2">
          <button 
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center max-w-xs"
            onClick={() => setShowProjectManager(true)}
            title={currentProject?.name || t('project.selectProject', 'Выберите проект')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <span className="truncate">
              {currentProject?.name || t('project.selectProject', 'Выберите проект')}
            </span>
          </button>
        </div>

        {/* Правая часть - управление приложением */}
        <div className="flex gap-2 items-center">
          {/* Переключатель языка */}
          <button
            onClick={toggleLanguage}
            className="px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 transition-colors whitespace-nowrap"
            title={t('tooltips.switchLanguage')}
          >
            {i18n.language === 'en' ? 'EN' : 'RU'}
          </button>

          {/* Кнопка справки */}
          <button 
            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors flex items-center whitespace-nowrap"
            onClick={() => setShowHelp(true)}
            title={t('tooltips.help')}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-3 w-3 mr-1 flex-shrink-0" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <span className="truncate">{t('help')}</span>
          </button>

          {/* Кнопка настроек AI */}
          <button 
            className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors flex items-center whitespace-nowrap"
            onClick={() => setShowAIConfig(true)}
            title={t('tooltips.aiSettings')}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-3 w-3 mr-1 flex-shrink-0" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
              />
            </svg>
            <span className="truncate">{t('ai.settings')}</span>
          </button>

          {/* User info и выход */}
          {user && (
            <>
              <span className="text-xs text-gray-300 px-2 max-w-[120px] truncate whitespace-nowrap">{user.email}</span>
              <button 
                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors flex items-center whitespace-nowrap"
                onClick={logout}
                title={t('tooltips.exitApp')}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-3 w-3 mr-1 flex-shrink-0" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                  />
                </svg>
                <span className="truncate">{t('app.exit')}</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* AI Config Modal */}
      <AIConfigModal 
        isOpen={showAIConfig}
        onClose={() => setShowAIConfig(false)}
      />
      
      {/* Quick Help Modal */}
      <QuickHelp 
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {/* Project Manager Modal */}
      <ProjectManagerModal
        isOpen={showProjectManager}
        onClose={() => setShowProjectManager(false)}
      />
    </>
  );
};

export default Header;
