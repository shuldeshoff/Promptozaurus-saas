import { useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useTranslation } from 'react-i18next';
import { useEditor } from '../../context/EditorContext';
import { useUpdateProject } from '../../hooks/useProjects';
import ProjectSharingModal from '../ProjectSharingModal';
import ProjectSelectorModal from '../ProjectSelectorModal';
import AIConfigModal from '../AIConfigModal';
import QuickHelp from '../ui/QuickHelp';

const Header = () => {
  const { t, i18n } = useTranslation('header');
  const { user, logout } = useAuthStore();
  const { currentProject } = useEditor();
  const updateMutation = useUpdateProject();
  const [isSharingModalOpen, setIsSharingModalOpen] = useState(false);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [projectSelectorMode, setProjectSelectorMode] = useState<'open' | 'create' | null>(null);
  
  // Состояния для редактирования названия проекта
  const [projectName, setProjectName] = useState(currentProject?.name || '');

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ru' : 'en';
    i18n.changeLanguage(newLang);
  };

  // Синхронизация названия проекта
  useState(() => {
    if (currentProject?.name) {
      setProjectName(currentProject.name);
    } else {
      setProjectName('');
    }
  });

  // Обработчики для проектов
  const handleNewProject = () => {
    setProjectSelectorMode('create');
  };

  const handleOpenProject = () => {
    setProjectSelectorMode('open');
  };

  const handleSaveProject = async () => {
    if (!currentProject) return;
    
    // Принудительное сохранение проекта
    await updateMutation.mutateAsync({
      id: currentProject.id,
      data: currentProject.data,
    });
  };

  // Обработчики редактирования названия проекта
  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
  };

  const handleProjectNameBlur = async () => {
    if (!currentProject) return;
    
    const trimmedName = projectName.trim();
    if (trimmedName === '') {
      setProjectName(currentProject.name);
      return;
    }
    
    // Автосохранение при изменении названия
    if (trimmedName !== currentProject.name) {
      await updateMutation.mutateAsync({
        id: currentProject.id,
        name: trimmedName,
      });
    }
  };

  const handleProjectNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setProjectName(currentProject?.name || '');
      e.currentTarget.blur();
    }
  };

  return (
    <>
      <header className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        {/* Левая часть - управление проектами */}
        <div className="flex items-center gap-2">
          <button 
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
            onClick={handleNewProject}
            title={t('tooltips.createNewProject')}
          >
            {t('project.new')}
          </button>
          <button 
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
            onClick={handleOpenProject}
            title={t('tooltips.openExistingProject')}
          >
            {t('project.open')}
          </button>
          <button 
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSaveProject}
            title={t('tooltips.saveCurrentProject')}
            disabled={!currentProject}
          >
            {t('project.save')}
          </button>
          
          {/* Редактируемое название проекта */}
          <input
            type="text"
            className="px-3 py-1 bg-gray-700 border border-gray-600 text-white text-xs rounded focus:outline-none focus:border-blue-500 w-48 disabled:opacity-50 disabled:cursor-not-allowed"
            value={projectName}
            onChange={handleProjectNameChange}
            onBlur={handleProjectNameBlur}
            onKeyDown={handleProjectNameKeyDown}
            placeholder={t('project.newProject')}
            disabled={!currentProject}
            title={t('tooltips.editProjectName')}
          />

          {/* Share button */}
          <button
            onClick={() => setIsSharingModalOpen(true)}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('tooltips.shareProject')}
            disabled={!currentProject}
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
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span className="truncate">{t('share')}</span>
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

      {/* Project Sharing Modal */}
      {currentProject && (
        <ProjectSharingModal
          isOpen={isSharingModalOpen}
          onClose={() => setIsSharingModalOpen(false)}
          projectId={currentProject.id}
          projectName={currentProject.name}
        />
      )}

      {/* Project Selector Modal */}
      {projectSelectorMode && (
        <ProjectSelectorModal
          isOpen={true}
          onClose={() => setProjectSelectorMode(null)}
          mode={projectSelectorMode}
        />
      )}
    </>
  );
};

export default Header;
