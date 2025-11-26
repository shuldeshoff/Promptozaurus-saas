import { useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useTranslation } from 'react-i18next';
import { useEditor } from '../../context/EditorContext';
import { useUpdateProject } from '../../hooks/useProjects';
import SaveStatus from '../SaveStatus';
import ProjectSharingModal from '../ProjectSharingModal';

const Header = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const { currentProject } = useEditor();
  const updateMutation = useUpdateProject();
  const [isSharingModalOpen, setIsSharingModalOpen] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ru' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <>
      <header className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-300">
              {t('project.label', 'Project')}:
            </span>
            <span className="text-sm text-white">
              {currentProject?.name || t('project.newProject', 'New Project')}
            </span>

            {/* Share button */}
            {currentProject && (
              <button
                onClick={() => setIsSharingModalOpen(true)}
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                title={t('buttons.share', 'Share')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 inline mr-1"
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
                {t('buttons.share', 'Share')}
              </button>
            )}
          </div>

          {/* Save Status Indicator */}
          {currentProject && (
            <SaveStatus
              isSaving={updateMutation.isPending}
              lastSaved={updateMutation.isSuccess ? new Date() : null}
              error={updateMutation.error as Error | null}
              isOffline={false}
            />
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Language switcher */}
          <button
            onClick={toggleLanguage}
            className="px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 transition-colors"
          >
            {/* Показываем текущий язык, а не целевой */}
            {i18n.language === 'en' ? 'EN' : 'RU'}
          </button>

          {/* User info */}
          {user && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-300">{user.email}</span>
              <button
                onClick={logout}
                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
              >
                {t('app.exit', 'Exit')}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Project Sharing Modal */}
      {currentProject && (
        <ProjectSharingModal
          isOpen={isSharingModalOpen}
          onClose={() => setIsSharingModalOpen(false)}
          projectId={currentProject.id}
          projectName={currentProject.name}
        />
      )}
    </>
  );
};

export default Header;


