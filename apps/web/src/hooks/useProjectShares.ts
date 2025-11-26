// useProjectShares - hooks для работы с project sharing
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { ProjectShare } from '@promptozaurus/shared';

// Создать новый share (приглашение)
export const useCreateProjectShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      sharedWithEmail,
      permission = 'view',
    }: {
      projectId: string;
      sharedWithEmail: string;
      permission?: 'view' | 'edit';
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: ProjectShare }>(
        `/api/projects/${projectId}/shares`,
        { sharedWithEmail, permission }
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-shares', variables.projectId] });
    },
  });
};

// Получить все shares для проекта
export const useProjectShares = (projectId: string) => {
  return useQuery({
    queryKey: ['project-shares', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data } = await apiClient.get<{ success: boolean; data: ProjectShare[] }>(
        `/api/projects/${projectId}/shares`
      );
      return data.data;
    },
    enabled: !!projectId,
  });
};

// Получить все проекты, расшаренные со мной
export const useSharedWithMe = () => {
  return useQuery({
    queryKey: ['shared-with-me'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: ProjectShare[] }>(
        '/api/shares/me'
      );
      return data.data;
    },
  });
};

// Обновить share (изменить permission или status)
export const useUpdateProjectShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shareId,
      permission,
      status,
    }: {
      shareId: string;
      permission?: 'view' | 'edit';
      status?: 'pending' | 'accepted' | 'rejected';
    }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: ProjectShare }>(
        `/api/shares/${shareId}`,
        { permission, status }
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-shares'] });
      queryClient.invalidateQueries({ queryKey: ['shared-with-me'] });
    },
  });
};

// Удалить share
export const useDeleteProjectShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shareId, projectId }: { shareId: string; projectId: string }) => {
      await apiClient.delete(`/api/shares/${shareId}`);
      return { shareId, projectId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-shares', variables.projectId] });
    },
  });
};

