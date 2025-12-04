import { useQueryClient } from '@tanstack/react-query';
import { useEditor } from '../context/EditorContext';
import { useUpdateProject } from './useProjects';
import type { ProjectData } from '@promptozaurus/shared';
import { toast } from 'react-hot-toast';

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
      
      // ВАЖНО: Инвалидируем кеш скомпилированных промптов
      // Это заставит "Готовый промпт" обновиться после любых изменений
      queryClient.invalidateQueries({ queryKey: ['compile-prompt'] });

      return updatedProject;
    } catch (error: any) {
      console.error('Ошибка обновления проекта:', error);
      
      // Проверяем, является ли это ошибкой превышения лимита
      const isLimitError = error?.response?.data?.isLimitError || 
                          error?.response?.status === 413 ||
                          error?.response?.data?.error?.includes('exceeds limit');
      
      if (isLimitError) {
        const errorMessage = error?.response?.data?.error || 'Превышен лимит размера проекта';
        toast.error(`⚠️ ${errorMessage}`, {
          duration: 8000,
          style: {
            background: '#dc2626',
            color: '#fff',
            maxWidth: '600px',
          },
        });
      }
      
      throw error;
    }
  };

  return {
    updateProjectAndRefresh,
    isUpdating: updateProjectMutation.isPending,
  };
}

