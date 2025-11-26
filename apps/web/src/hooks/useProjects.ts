import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { Project as SharedProject, ProjectData as SharedProjectData } from '@promptozaurus/shared';

export interface Project extends Omit<SharedProject, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

export interface ProjectData extends SharedProjectData {}

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: () => [...projectKeys.lists()] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

// Get all projects
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Project[] }>('/api/projects');
      return response.data.data;
    },
  });
}

// Get single project
export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(projectId!),
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Project }>(
        `/api/projects/${projectId}`
      );
      return response.data.data;
    },
    enabled: !!projectId,
  });
}

// Create project
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const response = await apiClient.post<{ success: boolean; data: Project }>(
        '/api/projects',
        { name }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// Update project
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, data }: { id: string; name?: string; data?: ProjectData }) => {
      const response = await apiClient.patch<{ success: boolean; data: Project }>(
        `/api/projects/${id}`,
        { name, data }
      );
      return response.data.data;
    },
    // Optimistic updates для мгновенной реакции UI (из originals концепции)
    onMutate: async ({ id, name, data }) => {
      // Отменяем исходящие запросы для этого проекта
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) });

      // Сохраняем предыдущее значение
      const previousProject = queryClient.getQueryData<Project>(projectKeys.detail(id));

      // Оптимистично обновляем cache
      if (previousProject) {
        const optimisticProject: Project = {
          ...previousProject,
          ...(name !== undefined && { name }),
          ...(data !== undefined && { data }),
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData(projectKeys.detail(id), optimisticProject);
      }

      // Возвращаем контекст для rollback
      return { previousProject };
    },
    // Rollback при ошибке
    onError: (err, { id }, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(projectKeys.detail(id), context.previousProject);
      }
      console.error('Error updating project:', err);
    },
    // Обновляем cache после успешного сохранения
    onSuccess: (data) => {
      queryClient.setQueryData(projectKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// Delete project
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// Duplicate project
export function useDuplicateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<{ success: boolean; data: Project }>(
        `/api/projects/${id}/duplicate`
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// Import project
export function useImportProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, data }: { name: string; data: ProjectData }) => {
      const response = await apiClient.post<{ success: boolean; data: Project }>(
        '/api/projects/import',
        { name, data }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// Export project
export function useExportProject() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.get<{ success: boolean; data: unknown }>(
        `/api/projects/${id}/export`
      );
      return response.data.data;
    },
  });
}

// Compile prompt with context (для PromptEditor)
export function useCompilePrompt(promptBlockId: number, wrapWithTags: boolean) {
  return useQuery({
    queryKey: ['compile-prompt', promptBlockId, wrapWithTags],
    queryFn: async () => {
      const response = await apiClient.post<{
        success: boolean;
        data: { compiledPrompt: string; totalChars: number };
      }>('/api/projects/compile-prompt', {
        promptBlockId,
        wrapWithTags,
      });
      return response.data.data;
    },
    enabled: !!promptBlockId,
  });
}

