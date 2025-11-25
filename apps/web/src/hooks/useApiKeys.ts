import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { ApiKey, AiProvider } from '@promptozaurus/shared';

// Query keys
export const apiKeyKeys = {
  all: ['apiKeys'] as const,
  list: () => [...apiKeyKeys.all, 'list'] as const,
};

// Get all API keys status
export function useApiKeys() {
  return useQuery({
    queryKey: apiKeyKeys.list(),
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: ApiKey[] }>(
        '/user/api-keys'
      );
      return response.data.data;
    },
  });
}

// Add or update API key
export function useUpsertApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      provider,
      apiKey,
    }: {
      provider: AiProvider;
      apiKey: string;
    }) => {
      const response = await apiClient.post<{ success: boolean; data: ApiKey }>(
        `/user/api-keys/${provider}`,
        { apiKey }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.list() });
    },
  });
}

// Delete API key
export function useDeleteApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: AiProvider) => {
      await apiClient.delete(`/user/api-keys/${provider}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.list() });
    },
  });
}

// Test API key connection
export function useTestApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: AiProvider) => {
      const response = await apiClient.post<{
        success: boolean;
        data: { provider: AiProvider; status: string; message: string };
      }>(`/user/api-keys/${provider}/test`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.list() });
    },
  });
}

