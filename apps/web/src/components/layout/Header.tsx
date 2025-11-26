import { useAuthStore } from '../../store/auth.store';
import { useTranslation } from 'react-i18next';
import { useEditor } from '../../context/EditorContext';
import { useUpdateProject } from '../../hooks/useProjects';
import SaveStatus from '../SaveStatus';

const Header = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const { currentProject } = useEditor();
  const updateMutation = useUpdateProject();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ru' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-300">
            {t('project.label', 'Project')}:
          </span>
          <span className="text-sm text-white">
            {currentProject?.name || t('project.newProject', 'New Project')}
          </span>
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
          {i18n.language === 'en' ? 'RU' : 'EN'}
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
  );
};

export default Header;

