import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { AiProvider } from '@promptozaurus/shared';

// AI Model interface
export interface AIModel {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  supportsVision?: boolean;
}

// AI Response interface
export interface AIResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason?: string;
  error?: string;
}

// Send message options
export interface SendMessageOptions {
  provider: AiProvider;
  model: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

// Query keys
export const aiKeys = {
  all: ['ai'] as const,
  models: () => [...aiKeys.all, 'models'] as const,
};

// Get available models
export function useAIModels() {
  return useQuery({
    queryKey: aiKeys.models(),
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: AIModel[] }>(
        '/ai/models'
      );
      return response.data.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// Refresh models for a specific provider
export function useRefreshModels() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: AiProvider) => {
      const response = await apiClient.post<{ success: boolean; data: AIModel[] }>(
        `/ai/models/${provider}/refresh`
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.models() });
    },
  });
}

// Send message to AI
export function useSendMessage() {
  return useMutation({
    mutationFn: async (options: SendMessageOptions) => {
      const response = await apiClient.post<{ success: boolean; data: AIResponse }>(
        '/ai/send',
        options
      );
      return response.data.data;
    },
  });
}

