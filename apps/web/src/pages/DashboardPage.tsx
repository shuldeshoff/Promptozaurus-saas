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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <h1 className="text-lg md:text-2xl font-bold text-white">🦖 Promptozaurus</h1>
            {selectedProject && (
              <div className="hidden sm:block">
                <SaveStatus
                  isSaving={autoSave.isSaving}
                  lastSaved={autoSave.lastSaved}
                  error={autoSave.error}
                  isOffline={autoSave.isOffline}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* AI Config Button */}
            <button
              onClick={() => setIsAIConfigModalOpen(true)}
              className="px-2 md:px-3 py-1 text-xs md:text-sm bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
              title={t('labels.aiApiKeys', 'AI API Keys')}
            >
              <span className="hidden sm:inline">🔑 AI</span>
              <span className="sm:hidden">🔑</span>
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={() => setIsAIResponseModalOpen(true)}
              className="px-2 md:px-3 py-1 text-xs md:text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              title={t('labels.aiAssistant', 'AI Assistant')}
            >
              <span className="hidden sm:inline">🤖 AI</span>
              <span className="sm:hidden">🤖</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="hidden sm:block px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
            >
              {i18n.language.toUpperCase()}
            </button>

            {/* User Menu - Desktop */}
            {user && (
              <div className="hidden lg:flex items-center gap-3">
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

            {/* User Avatar - Mobile */}
            {user && user.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="lg:hidden w-8 h-8 rounded-full"
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Project List Sidebar */}
        <aside
          className={`
            fixed md:relative
            inset-y-0 left-0
            w-80 md:w-80
            border-r border-gray-800
            overflow-y-auto
            bg-gray-950
            z-50
            transform transition-transform duration-300
            ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          {/* Close button for mobile */}
          <div className="md:hidden flex justify-between items-center p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">{t('labels.projects', 'Projects')}</h2>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <ProjectList
            onSelectProject={(project) => {
              setSelectedProject(project);
              setIsMobileSidebarOpen(false); // Close sidebar on mobile after selection
            }}
            selectedProjectId={selectedProject?.id}
          />
        </aside>

        {/* Project Editor Area */}
        <div className="flex-1 overflow-y-auto">
          {selectedProject ? (
            <ProjectEditor project={selectedProject} />
          ) : (
            <div className="flex items-center justify-center h-full px-4">
              <div className="text-center text-gray-500 max-w-md">
                <div className="text-4xl md:text-6xl mb-4">🦖</div>
                <p className="text-lg md:text-xl mb-2">
                  {t('dashboard.selectProject', 'Select or create a project')}
                </p>
                <p className="text-xs md:text-sm">
                  {t('dashboard.stage5progress', 'Stage 5: AI Integration - Complete ✅')}
                </p>
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

