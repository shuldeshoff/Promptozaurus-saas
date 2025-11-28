import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  useProjects,
  useCreateProject,
  useDeleteProject,
  useUpdateProject,
  Project,
} from '../hooks/useProjects';
import {
  useProjectShares,
  useCreateProjectShare,
  useDeleteProjectShare,
} from '../hooks/useProjectShares';
import { useConfirmation } from '../context/ConfirmationContext';
import { useEditor } from '../context/EditorContext';

interface ProjectListProps {
  onSelectProject: (project: Project) => void;
  selectedProjectId?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface ProjectCardProps {
  project: Project;
  isSelected: boolean;
  isEditing: boolean;
  editingName: string;
  isSharing: boolean;
  newShareEmail: string;
  contextBlocksCount: number;
  promptBlocksCount: number;
  onSelect: () => void;
  onStartRename: (e: React.MouseEvent) => void;
  onRename: () => void;
  onCancelRename: () => void;
  onEditingNameChange: (name: string) => void;
  onToggleShare: (e: React.MouseEvent) => void;
  onShareEmailChange: (email: string) => void;
  onAddShare: () => void;
  onDelete: () => void;
  onDeleteShare: (shareId: string, email: string, projectId: string) => void;
  createSharePending: boolean;
  deletePending: boolean;
  t: any;
}

function ProjectCard({
  project,
  isSelected,
  isEditing,
  editingName,
  isSharing,
  newShareEmail,
  contextBlocksCount,
  promptBlocksCount,
  onSelect,
  onStartRename,
  onRename,
  onCancelRename,
  onEditingNameChange,
  onToggleShare,
  onShareEmailChange,
  onAddShare,
  onDelete,
  onDeleteShare,
  createSharePending,
  deletePending,
  t,
}: ProjectCardProps) {
  const { data: shares = [], isLoading: sharesLoading } = useProjectShares(isSharing ? project.id : '');

  return (
    <div
      className={`rounded-lg transition-colors ${
        isSelected && !isSharing ? 'bg-blue-600' : 'bg-gray-800'
      }`}
    >
      <div
        className={`p-3 cursor-pointer ${!isSharing && 'hover:bg-gray-700'}`}
        onClick={isSharing ? undefined : onSelect}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => onEditingNameChange(e.target.value)}
                onBlur={onRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onRename();
                  if (e.key === 'Escape') onCancelRename();
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-2 py-1 bg-gray-700 border border-blue-500 rounded text-sm focus:outline-none"
                autoFocus
              />
            ) : (
              <h3
                className="font-medium truncate text-sm cursor-text hover:text-blue-300"
                onClick={onStartRename}
                title={t('labels.clickToRename', 'Нажмите для переименования')}
              >
                {project.name}
              </h3>
            )}
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
              <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>{contextBlocksCount} ctx</span>
              <span>•</span>
              <span>{promptBlocksCount} prm</span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={onToggleShare}
              className={`p-1 rounded transition-colors ${
                isSharing ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'
              }`}
              title={t('labels.shareProject', 'Поделиться')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
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
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={deletePending}
              className="p-1 hover:bg-red-600 rounded transition-colors"
              title={t('buttons.delete', 'Удалить')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
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

      {/* Share form */}
      {isSharing && (
        <div className="px-3 pb-3">
          <div className="p-3 bg-gray-900 rounded-md border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-300">
                {t('labels.shareProject', 'Поделиться проектом')}
              </h4>
              <button
                onClick={onToggleShare}
                className="text-gray-400 hover:text-white transition-colors"
                title={t('buttons.close', 'Закрыть')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex gap-2 mb-3">
              <input
                type="email"
                placeholder={t('labels.enterEmail', 'Email пользователя')}
                value={newShareEmail}
                onChange={(e) => onShareEmailChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onAddShare()}
                className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={onAddShare}
                disabled={createSharePending}
                className="px-2 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0"
              >
                {createSharePending ? '+..' : '+'}
              </button>
            </div>
            
            {sharesLoading ? (
              <p className="text-xs text-gray-400">{t('messages.loading')}</p>
            ) : shares.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 mb-2">{t('labels.sharedWith', 'Доступ предоставлен')}:</p>
                {shares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-2 bg-gray-800 rounded text-sm">
                    <span className="text-gray-300">{share.sharedWithEmail}</span>
                    <button
                      onClick={() => onDeleteShare(share.id, share.sharedWithEmail, project.id)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      {t('buttons.remove', 'Удалить')}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">{t('messages.noShares', 'Проект пока ни с кем не поделен')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectList({ onSelectProject, selectedProjectId, isCollapsed, onToggleCollapse }: ProjectListProps) {
  const { t } = useTranslation('common');
  const { openConfirmation } = useConfirmation();
  const { setCurrentProject } = useEditor();
  const [newProjectName, setNewProjectName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [sharingProjectId, setSharingProjectId] = useState<string | null>(null);
  const [newShareEmail, setNewShareEmail] = useState('');

  const { data: projects, isLoading, error } = useProjects();
  const createMutation = useCreateProject();
  const deleteMutation = useDeleteProject();
  const updateMutation = useUpdateProject();
  const createShareMutation = useCreateProjectShare();
  const deleteShareMutation = useDeleteProjectShare();

  // Проверяем, существует ли selectedProject в списке проектов
  useEffect(() => {
    if (!isLoading && projects && selectedProjectId) {
      const projectExists = projects.some(p => p.id === selectedProjectId);
      if (!projectExists) {
        // Проект был удален, очищаем currentProject
        setCurrentProject(null);
      }
    }
  }, [projects, selectedProjectId, isLoading, setCurrentProject]);

  // Если панель свернута, показываем только кнопку toggle
  if (isCollapsed) {
    return (
      <div className="w-12 h-full bg-gray-900 border-r border-gray-700 flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title={t('showProjects', 'Показать проекты')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    );
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const newProject = await createMutation.mutateAsync(newProjectName);
      setNewProjectName('');
      setShowCreateForm(false);
      onSelectProject(newProject);
      toast.success(t('projectCreated', 'Project created successfully'));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      if (error.response?.data?.error === 'Project limit reached') {
        toast.error(error.response.data.message || t('messages.projectLimitReached', 'Вы достигли максимума из 10 проектов'));
      } else {
        toast.error(t('messages.failedToCreateProject', 'Не удалось создать проект'));
      }
    }
  };

  const handleDeleteProject = async (id: string) => {
    openConfirmation(
      t('messages.confirmDeleteProject', 'Вы уверены, что хотите удалить этот проект?'),
      t('messages.confirmDeleteProjectMessage', 'Это действие нельзя отменить'),
      async () => {
    try {
      await deleteMutation.mutateAsync(id);
          // Если удаляем активный проект, очищаем currentProject
          if (selectedProjectId === id) {
            setCurrentProject(null);
          }
          toast.success(t('messages.projectDeleted', 'Проект удален'));
    } catch {
          toast.error(t('messages.failedToDeleteProject', 'Не удалось удалить проект'));
        }
    }
    );
  };

  const handleStartRename = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setEditingProjectName(project.name);
  };

  const handleRenameProject = async (projectId: string) => {
    if (!editingProjectName.trim() || editingProjectName === projects?.find(p => p.id === projectId)?.name) {
      setEditingProjectId(null);
      return;
    }

    try {
      const updatedProject = await updateMutation.mutateAsync({
        id: projectId,
        name: editingProjectName.trim(),
      });
      
      // Обновляем текущий проект если переименовали активный
      if (selectedProjectId === projectId) {
        setCurrentProject(updatedProject);
      }
      
      setEditingProjectId(null);
      toast.success(t('messages.saved', 'Сохранено'));
    } catch {
      toast.error(t('messages.saveFailed', 'Ошибка сохранения'));
      setEditingProjectId(null);
    }
  };

  const handleCancelRename = () => {
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const handleToggleShare = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sharingProjectId === projectId) {
      setSharingProjectId(null);
      setNewShareEmail('');
    } else {
      setSharingProjectId(projectId);
    }
  };

  const handleAddShare = async () => {
    if (!sharingProjectId || !newShareEmail.trim()) {
      toast.error(t('messages.enterEmail', 'Введите email'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newShareEmail)) {
      toast.error(t('messages.invalidEmail', 'Неверный формат email'));
      return;
    }

    try {
      await createShareMutation.mutateAsync({
        projectId: sharingProjectId,
        sharedWithEmail: newShareEmail.trim(),
        permission: 'edit',
      });
      setNewShareEmail('');
      toast.success(t('messages.sharedSuccessfully', 'Проект успешно расшарен'));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t('messages.failedToShare', 'Не удалось расшарить проект'));
    }
  };

  const handleDeleteShare = async (shareId: string, email: string, projectId: string) => {
    openConfirmation(
      t('messages.confirmDeleteShareMessage', { email }),
      '',
      async () => {
        try {
          await deleteShareMutation.mutateAsync({ shareId, projectId });
          toast.success(t('messages.shareDeleted', 'Доступ удален'));
        } catch {
          toast.error(t('messages.failedToShare', 'Ошибка'));
        }
      }
    );
  };

  if (isLoading) {
    return <div className="p-4 text-center">{t('messages.loading', 'Загрузка...')}</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{t('messages.failedToLoadProjects', 'Не удалось загрузить проекты')}</div>;
  }

  const projectCount = projects?.length || 0;
  const canCreateMore = projectCount < 10;

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64 border-r border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">{t('labels.projects', 'Проекты')}</h2>
          <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {projectCount} / 10
          </span>
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title={t('hideProjects', 'Скрыть проекты')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </div>
        </div>
        {canCreateMore && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center justify-center"
            title={t('labels.newProject', 'Новый проект')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        )}
        {!canCreateMore && (
          <div className="text-sm text-yellow-500 text-center">
            {t('messages.projectLimitReached', 'Вы достигли максимума из 10 проектов')}
          </div>
        )}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <form onSubmit={handleCreateProject}>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder={t('labels.projectName', 'Название проекта')}
              className="w-full px-3 py-2 mb-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending || !newProjectName.trim()}
                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? t('buttons.creating', 'Создание...') : t('buttons.create', 'Создать')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewProjectName('');
                }}
                className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('buttons.cancel', 'Отмена')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Project List */}
      <div className="flex-1 overflow-y-auto">
        {projects?.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            {t('messages.noProjects', 'Пока нет проектов. Создайте свой первый!')}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {projects?.map((project) => {
              const contextBlocks = project.data?.contextBlocks || [];
              const promptBlocks = project.data?.promptBlocks || [];
              const isSharing = sharingProjectId === project.id;
              
              return (
                <ProjectCard
                key={project.id}
                  project={project}
                  isSelected={selectedProjectId === project.id}
                  isEditing={editingProjectId === project.id}
                  editingName={editingProjectName}
                  isSharing={isSharing}
                  newShareEmail={newShareEmail}
                  contextBlocksCount={contextBlocks.length}
                  promptBlocksCount={promptBlocks.length}
                  onSelect={() => onSelectProject(project)}
                  onStartRename={(e) => handleStartRename(project, e)}
                  onRename={() => handleRenameProject(project.id)}
                  onCancelRename={handleCancelRename}
                  onEditingNameChange={setEditingProjectName}
                  onToggleShare={(e) => handleToggleShare(project.id, e)}
                  onShareEmailChange={setNewShareEmail}
                  onAddShare={handleAddShare}
                  onDelete={() => handleDeleteProject(project.id)}
                  onDeleteShare={handleDeleteShare}
                  createSharePending={createShareMutation.isPending}
                  deletePending={deleteMutation.isPending}
                  t={t}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

