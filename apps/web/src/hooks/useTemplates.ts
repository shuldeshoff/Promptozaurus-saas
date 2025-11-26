// useTemplates - hooks для работы с шаблонами через API
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { Template } from '@promptozaurus/shared';

// Получить список всех шаблонов пользователя
export const useTemplates = () => {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Template[] }>('/api/templates');
      return data.data;
    },
  });
};

// Получить содержимое конкретного шаблона по ID
export const useTemplate = (templateId: string) => {
  return useQuery({
    queryKey: ['template', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const { data } = await apiClient.get<{ success: boolean; data: Template }>(
        `/api/templates/${templateId}`
      );
      return data.data;
    },
    enabled: !!templateId,
  });
};

// Создать новый шаблон
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, content }: { name: string; content: string }) => {
      const { data } = await apiClient.post<{ success: boolean; data: Template }>('/api/templates', {
        name,
        content,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

// Обновить существующий шаблон
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      templateId,
      name,
      content,
    }: {
      templateId: string;
      name?: string;
      content?: string;
    }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: Template }>(
        `/api/templates/${templateId}`,
        { name, content }
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

// Удалить шаблон
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      await apiClient.delete(`/api/templates/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

// Поиск шаблонов (серверный поиск по name/content)
export const useSearchTemplates = (query: string) => {
  return useQuery({
    queryKey: ['templates', 'search', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const { data } = await apiClient.get<{ success: boolean; data: Template[] }>(
        `/api/templates/search?q=${encodeURIComponent(query)}`
      );
      return data.data;
    },
    enabled: !!query,
  });
};
