import { useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useTranslation } from 'react-i18next';
import ProjectList from '../components/ProjectList';
import ProjectEditor from '../components/ProjectEditor';
import SaveStatus from '../components/SaveStatus';
import AIConfigModal from '../components/AIConfigModal';
import AIResponseModal from '../components/AIResponseModal';
import { Project } from '../hooks/useProjects';
import { useAutoSave } from '../hooks/useAutoSave';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isAIConfigModalOpen, setIsAIConfigModalOpen] = useState(false);
  const [isAIResponseModalOpen, setIsAIResponseModalOpen] = useState(false);

  // Auto-save setup
  const autoSave = useAutoSave({
    project: selectedProject,
    enabled: true,
    debounceMs: 2000,
  });

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ru' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">🦖 Promptozaurus</h1>
            {selectedProject && (
              <SaveStatus
                isSaving={autoSave.isSaving}
                lastSaved={autoSave.lastSaved}
                error={autoSave.error}
                isOffline={autoSave.isOffline}
              />
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* AI Config Button */}
            <button
              onClick={() => setIsAIConfigModalOpen(true)}
              className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
              title={t('labels.aiApiKeys', 'AI API Keys')}
            >
              🔑 AI
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={() => setIsAIResponseModalOpen(true)}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              title={t('labels.aiAssistant', 'AI Assistant')}
            >
              🤖 AI
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
            >
              {i18n.language.toUpperCase()}
            </button>

            {/* User Menu */}
            {user && (
              <div className="flex items-center gap-3">
                {user.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="text-sm">
                  <div className="text-white font-medium">{user.name}</div>
                  <div className="text-gray-400 text-xs">{user.email}</div>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  {t('common:logout', 'Logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Project List Sidebar */}
        <aside className="w-80 border-r border-gray-800 overflow-y-auto">
          <ProjectList
            onSelectProject={setSelectedProject}
            selectedProjectId={selectedProject?.id}
          />
        </aside>

        {/* Project Editor Area */}
        <div className="flex-1 overflow-y-auto">
          {selectedProject ? (
            <ProjectEditor project={selectedProject} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">🦖</div>
                <p className="text-xl mb-2">{t('dashboard.selectProject', 'Select or create a project')}</p>
                <p className="text-sm">{t('dashboard.stage3progress', 'Stage 3: Context & Prompts - In Progress 🚧')}</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* AI Modals */}
      <AIConfigModal
        isOpen={isAIConfigModalOpen}
        onClose={() => setIsAIConfigModalOpen(false)}
      />
      <AIResponseModal
        isOpen={isAIResponseModalOpen}
        onClose={() => setIsAIResponseModalOpen(false)}
      />
    </div>
  );
}

