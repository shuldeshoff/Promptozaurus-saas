import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Header from '../components/layout/Header';
import ProjectList from '../components/ProjectList';
import EmptyProjectState from '../components/layout/EmptyProjectState';
import { EditorProvider, useEditor } from '../context/EditorContext';
import { Project } from '../hooks/useProjects';

function DashboardContent() {
  const { currentProject, setCurrentProject } = useEditor();
  const [isProjectsPanelCollapsed, setIsProjectsPanelCollapsed] = useState(() => {
    const saved = localStorage.getItem('projectsPanelCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('projectsPanelCollapsed', JSON.stringify(isProjectsPanelCollapsed));
  }, [isProjectsPanelCollapsed]);

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
  };

  const handleToggleCollapse = () => {
    setIsProjectsPanelCollapsed(!isProjectsPanelCollapsed);
  };

  const handleOpenProjectsPanel = () => {
    setIsProjectsPanelCollapsed(false);
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <Header />
      
      {/* Main Content with Projects Panel */}
      <main className="flex-1 overflow-hidden flex">
        {/* Left Projects Panel */}
        <ProjectList
          onSelectProject={handleSelectProject}
          selectedProjectId={currentProject?.id}
          isCollapsed={isProjectsPanelCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
        
        {/* Main Editor Area */}
        <div className="flex-1 overflow-hidden">
          {currentProject ? (
            <MainLayout />
          ) : (
            <EmptyProjectState
              isProjectsPanelCollapsed={isProjectsPanelCollapsed}
              onOpenProjectsPanel={handleOpenProjectsPanel}
            />
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

