// useTemplates - hooks для работы с шаблонами (.txt файлами)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

// Получить список всех шаблонов пользователя
export const useTemplates = () => {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await apiClient.get<string[]>('/templates');
      return data;
    },
  });
};

// Получить содержимое конкретного шаблона
export const useTemplate = (filename: string) => {
  return useQuery({
    queryKey: ['template', filename],
    queryFn: async () => {
      if (!filename) return null;
      const { data } = await apiClient.get<{ content: string }>(`/templates/${encodeURIComponent(filename)}`);
      return data.content;
    },
    enabled: !!filename,
  });
};

// Создать или обновить шаблон (через mutation)
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ filename, content }: { filename: string; content: string }) => {
      const { data } = await apiClient.post('/templates', { filename, content });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

// Обновить шаблон
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ filename, content }: { filename: string; content: string }) => {
      const { data } = await apiClient.put(`/templates/${encodeURIComponent(filename)}`, { content });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

// Удалить шаблон (через mutation)
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (filename: string) => {
      await apiClient.delete(`/templates/${encodeURIComponent(filename)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

// Поиск шаблонов (используется в TemplateLibraryModal)
export const useSearchTemplates = (query: string) => {
  return useQuery({
    queryKey: ['templates', 'search', query],
    queryFn: async () => {
      const { data } = await apiClient.get<string[]>(`/templates/search?q=${encodeURIComponent(query)}`);
      return data;
    },
    enabled: !!query,
  });
};
