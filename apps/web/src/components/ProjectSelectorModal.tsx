import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjects, useCreateProject, type Project } from '../hooks/useProjects';
import { useEditor } from '../context/EditorContext';
import toast from 'react-hot-toast';

interface ProjectSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'open' | 'create';
}

export default function ProjectSelectorModal({ isOpen, onClose, mode }: ProjectSelectorModalProps) {
  const { t } = useTranslation('common');
  const { data: projects, isLoading } = useProjects();
  const createMutation = useCreateProject();
  const { setCurrentProject } = useEditor();
  const [newProjectName, setNewProjectName] = useState('');

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
      onClose();
    } catch (error) {
      toast.error(t('messages.failedToCreateProject'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {mode === 'create' ? t('buttons.create') : t('buttons.open')} {t('labels.project')}
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
          {mode === 'create' ? (
            // Create new project form
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('labels.projectName')}
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                placeholder={t('labels.enterName')}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
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
            // Open existing project list
            <div>
              {isLoading ? (
                <div className="text-center text-gray-400 py-8">
                  {t('messages.loading')}
                </div>
              ) : projects && projects.length > 0 ? (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleSelectProject(project)}
                      className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-medium">{project.name}</h3>
                          <p className="text-sm text-gray-400">
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  {t('messages.noProjects')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

