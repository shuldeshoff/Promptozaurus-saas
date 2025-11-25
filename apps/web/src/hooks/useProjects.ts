import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';

export interface Project {
  id: string;
  userId: string;
  name: string;
  data: ProjectData;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectData {
  contextBlocks: unknown[];
  promptBlocks: unknown[];
}

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
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

