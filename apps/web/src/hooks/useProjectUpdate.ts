import { useQueryClient } from '@tanstack/react-query';
import { useEditor } from '../context/EditorContext';
import { useUpdateProject } from './useProjects';
import type { ProjectData } from '@promptozaurus/shared';

/**
 * Хук для обновления проекта с автоматической инвалидацией кеша
 */
export function useProjectUpdate() {
  const queryClient = useQueryClient();
  const { currentProject, setCurrentProject } = useEditor();
  const updateProjectMutation = useUpdateProject();

  const updateProjectAndRefresh = async (data: ProjectData) => {
    if (!currentProject) {
      console.error('Нет текущего проекта для обновления');
      return null;
    }

    try {
      const updatedProject = await updateProjectMutation.mutateAsync({
        id: currentProject.id,
        data,
      });

      // Обновляем currentProject в контексте
      setCurrentProject(updatedProject);

      // Инвалидируем кеш проектов
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', currentProject.id] });

      return updatedProject;
    } catch (error) {
      console.error('Ошибка обновления проекта:', error);
      throw error;
    }
  };

  return {
    updateProjectAndRefresh,
    isUpdating: updateProjectMutation.isPending,
  };
}

