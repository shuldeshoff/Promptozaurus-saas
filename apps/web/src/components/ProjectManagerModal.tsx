import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useProjects, useCreateProject, useDeleteProject, useUpdateProject } from '../hooks/useProjects';
import { useEditor } from '../context/EditorContext';
import { useConfirmation } from '../context/ConfirmationContext';
import ProjectSharingModal from './ProjectSharingModal';
import type { Project } from '../hooks/useProjects';
import toast from 'react-hot-toast';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectManagerModal({ isOpen, onClose }: ProjectManagerModalProps) {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const { data: projects, isLoading } = useProjects();
  const createMutation = useCreateProject();
  const deleteMutation = useDeleteProject();
  const updateMutation = useUpdateProject();
  const { currentProject, setCurrentProject } = useEditor();
  const { openConfirmation } = useConfirmation();
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [sharingProject, setSharingProject] = useState<Project | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');

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

  const handleStartRename = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setEditingProjectName(project.name);
  };

  const handleRenameProject = async (project: Project) => {
    if (!editingProjectName.trim()) {
      toast.error(t('messages.fillAllFields'));
      return;
    }

    if (editingProjectName === project.name) {
      setEditingProjectId(null);
      return;
    }

    try {
      const updatedProject = await updateMutation.mutateAsync({
        id: project.id,
        name: editingProjectName,
      });

      // Инвалидируем кеш проектов
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });

      // Если переименовываем текущий проект, обновляем его в контексте
      if (currentProject?.id === project.id) {
        setCurrentProject(updatedProject);
      }

      toast.success(t('messages.success'));
      setEditingProjectId(null);
    } catch (error) {
      toast.error(t('messages.failedToUpdate'));
    }
  };

  const handleCancelRename = () => {
    setEditingProjectId(null);
    setEditingProjectName('');
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
          <div className="mb-6">
            {isCreating ? (
              <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                <h3 className="text-sm font-medium text-gray-300 mb-3 uppercase tracking-wider">
                  {t('buttons.create')} {t('labels.project')}
                </h3>
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
                    className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-500 transition-colors"
                  >
                    {t('buttons.cancel')}
                  </button>
                  <button
                    onClick={handleCreateProject}
                    disabled={createMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {createMutation.isPending ? t('buttons.creating') : t('buttons.create')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('buttons.create')} {t('labels.project')}
              </button>
            )}
          </div>

          {/* Projects list */}
          {isLoading ? (
            <div className="text-center text-gray-400 py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-3">{t('messages.loading')}</p>
            </div>
          ) : projects && projects.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                  {t('labels.projects')}
                </h3>
                <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                  {projects.length} {projects.length === 1 ? 'проект' : 'проектов'}
                </span>
              </div>
              <div className="space-y-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`group p-4 rounded-lg transition-all cursor-pointer border ${
                      currentProject?.id === project.id
                        ? 'bg-blue-600 hover:bg-blue-500 border-blue-500'
                        : 'bg-gray-750 hover:bg-gray-700 border-gray-700 hover:border-gray-600'
                    }`}
                    onClick={() => handleSelectProject(project)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {editingProjectId === project.id ? (
                            <input
                              type="text"
                              value={editingProjectName}
                              onChange={(e) => setEditingProjectName(e.target.value)}
                              onBlur={() => handleRenameProject(project)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleRenameProject(project);
                                } else if (e.key === 'Escape') {
                                  handleCancelRename();
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:border-blue-400"
                              autoFocus
                            />
                          ) : (
                            <h3
                              className="text-white font-medium truncate cursor-text hover:text-blue-200 transition-colors"
                              onClick={(e) => handleStartRename(project, e)}
                              title="Кликните для переименования"
                            >
                              {project.name}
                            </h3>
                          )}
                          {currentProject?.id === project.id && (
                            <span className="flex-shrink-0 px-2 py-0.5 bg-blue-500 text-white text-xs rounded font-medium">
                              Активен
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>{project.data?.contextBlocks?.length || 0} контекстов</span>
                          <span>•</span>
                          <span>{project.data?.promptBlocks?.length || 0} промптов</span>
                        </div>
                      </div>
                      <div className="ml-3 flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSharingProject(project);
                          }}
                          className={`p-2 rounded transition-colors ${
                            currentProject?.id === project.id
                              ? 'text-blue-200 hover:text-white hover:bg-blue-500'
                              : 'text-gray-500 hover:text-blue-400 hover:bg-gray-600'
                          }`}
                          title={t('buttons.share', 'Поделиться')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleDeleteProject(project, e)}
                          className={`p-2 rounded transition-colors ${
                            currentProject?.id === project.id
                              ? 'text-blue-200 hover:text-white hover:bg-blue-500'
                              : 'text-gray-500 hover:text-red-400 hover:bg-gray-600'
                          }`}
                          title={t('buttons.delete')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-700 rounded-full mb-4">
                <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-300 mb-2">{t('messages.noProjects')}</p>
              <p className="text-sm text-gray-500">Нажмите кнопку выше, чтобы создать первый проект</p>
            </div>
          )}
        </div>
      </div>

      {/* Project Sharing Modal */}
      {sharingProject && (
        <ProjectSharingModal
          isOpen={!!sharingProject}
          onClose={() => setSharingProject(null)}
          projectId={sharingProject.id}
          projectName={sharingProject.name}
        />
      )}
    </div>
  );
}

