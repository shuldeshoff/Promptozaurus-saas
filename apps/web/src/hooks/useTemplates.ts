import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { Template } from '@promptozaurus/shared';

// Query keys
export const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: () => [...templateKeys.lists()] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
  search: (query: string) => [...templateKeys.all, 'search', query] as const,
};

// Get all templates
export function useTemplates() {
  return useQuery({
    queryKey: templateKeys.list(),
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Template[] }>('/api/templates');
      return response.data.data;
    },
  });
}

// Get single template
export function useTemplate(templateId: string | undefined) {
  return useQuery({
    queryKey: templateKeys.detail(templateId!),
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Template }>(
        `/api/templates/${templateId}`
      );
      return response.data.data;
    },
    enabled: !!templateId,
  });
}

// Search templates
export function useSearchTemplates(query: string) {
  return useQuery({
    queryKey: templateKeys.search(query),
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Template[] }>(
        `/api/templates/search`,
        { params: { q: query } }
      );
      return response.data.data;
    },
    enabled: query.length > 0,
  });
}

// Create template
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, content }: { name: string; content: string }) => {
      const response = await apiClient.post<{ success: boolean; data: Template }>(
        '/api/templates',
        { name, content }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
  });
}

// Update template
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      content,
    }: {
      id: string;
      name?: string;
      content?: string;
    }) => {
      const response = await apiClient.patch<{ success: boolean; data: Template }>(
        `/api/templates/${id}`,
        { name, content }
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
  });
}

// Delete template
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
  });
}

// Get template count
export function useTemplateCount() {
  return useQuery({
    queryKey: [...templateKeys.all, 'count'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: { count: number } }>(
        '/api/templates/stats/count'
      );
      return response.data.data.count;
    },
  });
}

