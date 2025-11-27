import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ProjectList from '../components/ProjectList';
import MainLayout from '../components/layout/MainLayout';
import Header from '../components/layout/Header';
import { useProject } from '../hooks/useProjects';
import { EditorProvider, useEditor } from '../context/EditorContext';

function DashboardContent() {
  const { t } = useTranslation();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Fetch selected project with auto-refresh
  const { data: selectedProject } = useProject(selectedProjectId || undefined);

  // Update editor context when project changes
  const { setCurrentProject } = useEditor();
  
  useEffect(() => {
    setCurrentProject(selectedProject || null);
  }, [selectedProject, setCurrentProject]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Fixed Header */}
      <Header />
      
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
              setSelectedProjectId(project.id);
              setIsMobileSidebarOpen(false);
            }}
            selectedProjectId={selectedProjectId || undefined}
          />
        </aside>

        {/* Main Layout Area */}
        <div className="flex-1 overflow-hidden">
          {selectedProject ? (
            <MainLayout />
          ) : (
            <div className="flex items-center justify-center h-full px-4">
              <div className="text-center text-gray-500 max-w-md">
                <p className="text-lg md:text-xl mb-2">
                  {t('dashboard.selectProject', 'Select or create a project')}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <EditorProvider>
      <DashboardContent />
    </EditorProvider>
  );
}

