import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjects, useCreateProject, useDeleteProject } from '../hooks/useProjects';
import { useEditor } from '../context/EditorContext';
import { useConfirmation } from '../context/ConfirmationContext';
import type { Project } from '../hooks/useProjects';
import toast from 'react-hot-toast';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectManagerModal({ isOpen, onClose }: ProjectManagerModalProps) {
  const { t } = useTranslation('common');
  const { data: projects, isLoading } = useProjects();
  const createMutation = useCreateProject();
  const deleteMutation = useDeleteProject();
  const { currentProject, setCurrentProject } = useEditor();
  const { openConfirmation } = useConfirmation();
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    toast.success(t('messages.success'));
    onClose();
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error(t('messages.fillAllFields'));
      return;
    }

    try {
      const newProject = await createMutation.mutateAsync(newProjectName);
      setCurrentProject(newProject);
      toast.success(t('messages.success'));
      setNewProjectName('');
      setIsCreating(false);
      onClose();
    } catch (error) {
      toast.error(t('messages.failedToCreateProject'));
    }
  };

  const handleDeleteProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    
    openConfirmation(
      t('messages.confirmDeleteProject'),
      `${t('messages.confirmDelete')} "${project.name}"?`,
      async () => {
        try {
          await deleteMutation.mutateAsync(project.id);
          
          // Если удаляем текущий проект, сбрасываем его
          if (currentProject?.id === project.id) {
            setCurrentProject(null);
          }
          
          toast.success(t('messages.success'));
        } catch (error) {
          toast.error(t('messages.failedToDeleteProject'));
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {t('labels.projects')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Create new project section */}
          {isCreating ? (
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <h3 className="text-lg font-medium text-white mb-3">{t('buttons.create')} {t('labels.project')}</h3>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                placeholder={t('labels.enterName')}
                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-3"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewProjectName('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  {t('buttons.cancel')}
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? t('buttons.creating') : t('buttons.create')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full mb-6 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {t('buttons.create')} {t('labels.project')}
            </button>
          )}

          {/* Projects list */}
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">
              {t('messages.loading')}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
                {t('labels.projects')} ({projects.length})
              </h3>
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`p-4 rounded-lg transition-colors cursor-pointer ${
                    currentProject?.id === project.id
                      ? 'bg-blue-700 hover:bg-blue-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => handleSelectProject(project)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-medium flex items-center">
                        {project.name}
                        {currentProject?.id === project.id && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-500 text-xs rounded">
                            {t('labels.active')}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {new Date(project.updatedAt).toLocaleDateString()} • 
                        {' '}{project.data?.contextBlocks?.length || 0} {t('labels.contextBlocks')} • 
                        {' '}{project.data?.promptBlocks?.length || 0} {t('labels.prompts')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteProject(project, e)}
                      className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-gray-600 rounded transition-colors"
                      title={t('buttons.delete')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg mb-2">{t('messages.noProjects')}</p>
              <p className="text-sm text-gray-500">{t('messages.createFirstProject', 'Создайте свой первый проект')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

