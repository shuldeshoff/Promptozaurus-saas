import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useProjects,
  useCreateProject,
  useDeleteProject,
  useDuplicateProject,
  Project,
} from '../hooks/useProjects';

interface ProjectListProps {
  onSelectProject: (project: Project) => void;
  selectedProjectId?: string;
}

export default function ProjectList({ onSelectProject, selectedProjectId }: ProjectListProps) {
  const { t } = useTranslation('common');
  const [newProjectName, setNewProjectName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: projects, isLoading, error } = useProjects();
  const createMutation = useCreateProject();
  const deleteMutation = useDeleteProject();
  const duplicateMutation = useDuplicateProject();

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const newProject = await createMutation.mutateAsync(newProjectName);
      setNewProjectName('');
      setShowCreateForm(false);
      onSelectProject(newProject);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      if (error.response?.data?.error === 'Project limit reached') {
        alert(error.response.data.message || t('projectLimitReached'));
      } else {
        alert(t('failedToCreateProject'));
      }
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm(t('confirmDeleteProject'))) return;

    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      alert(t('failedToDeleteProject'));
    }
  };

  const handleDuplicateProject = async (id: string) => {
    try {
      const duplicated = await duplicateMutation.mutateAsync(id);
      onSelectProject(duplicated);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      if (error.response?.data?.error === 'Project limit reached') {
        alert(error.response.data.message || t('projectLimitReached'));
      } else {
        alert(t('failedToDuplicateProject'));
      }
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">{t('loading')}</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{t('failedToLoadProjects')}</div>;
  }

  const projectCount = projects?.length || 0;
  const canCreateMore = projectCount < 10;

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">{t('projects')}</h2>
          <span className="text-sm text-gray-400">
            {projectCount} / 10
          </span>
        </div>
        {canCreateMore && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            + {t('newProject')}
          </button>
        )}
        {!canCreateMore && (
          <div className="text-sm text-yellow-500 text-center">
            {t('projectLimitReached')}
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
              placeholder={t('projectName')}
              className="w-full px-3 py-2 mb-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending || !newProjectName.trim()}
                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? t('creating') : t('create')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewProjectName('');
                }}
                className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Project List */}
      <div className="flex-1 overflow-y-auto">
        {projects?.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            {t('noProjects')}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {projects?.map((project) => (
              <div
                key={project.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedProjectId === project.id
                    ? 'bg-blue-600'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
                onClick={() => onSelectProject(project)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{project.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateProject(project.id);
                      }}
                      disabled={duplicateMutation.isPending}
                      className="p-2 hover:bg-gray-600 rounded transition-colors"
                      title={t('duplicate')}
                    >
                      📋
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      disabled={deleteMutation.isPending}
                      className="p-2 hover:bg-red-600 rounded transition-colors"
                      title={t('delete')}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

