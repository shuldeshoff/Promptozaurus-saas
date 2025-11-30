import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { AiProvider } from '@promptozaurus/shared';

export interface UserAISettings {
  timeout: number;
  retryCount: number;
  streamingEnabled: boolean;
  autoSave: boolean;
}

export interface UserAIModelConfig {
  id: string;
  provider: AiProvider;
  modelId: string;
  modelName: string;
  customName: string;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
}

export interface UserAIConfig {
  settings: UserAISettings;
  models: UserAIModelConfig[];
}

const aiConfigKeys = {
  all: ['aiConfig'] as const,
  config: () => [...aiConfigKeys.all, 'config'] as const,
};

export function useAIConfig() {
  return useQuery({
    queryKey: aiConfigKeys.config(),
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: UserAIConfig }>(
        '/ai/config'
      );
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAIConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: UserAIConfig) => {
      await apiClient.put('/ai/config', config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiConfigKeys.config() });
    },
  });
}


