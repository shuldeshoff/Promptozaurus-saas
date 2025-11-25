import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { ContextBlock, PromptBlock } from '@promptozaurus/shared';
import { projectKeys } from './useProjects';

// Update context blocks
export function useUpdateContextBlocks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, contextBlocks }: { projectId: string; contextBlocks: ContextBlock[] }) => {
      const response = await apiClient.patch(`/api/projects/${projectId}/context-blocks`, {
        contextBlocks,
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
    },
  });
}

// Update prompt blocks
export function useUpdatePromptBlocks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, promptBlocks }: { projectId: string; promptBlocks: PromptBlock[] }) => {
      const response = await apiClient.patch(`/api/projects/${projectId}/prompt-blocks`, {
        promptBlocks,
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
    },
  });
}

// Compile prompt
export function useCompilePrompt() {
  return useMutation({
    mutationFn: async ({
      projectId,
      promptId,
      wrapWithTags = false,
    }: {
      projectId: string;
      promptId: number;
      wrapWithTags?: boolean;
    }) => {
      const response = await apiClient.post<{
        success: boolean;
        data: {
          compiled: string;
          contextChars: number;
          templateChars: number;
          totalChars: number;
        };
      }>(`/api/projects/${projectId}/prompts/${promptId}/compile`, { wrapWithTags });
      return response.data.data;
    },
  });
}

// Get prompt stats
export function usePromptStats(projectId: string | undefined, promptId: number | undefined) {
  return useMutation({
    mutationFn: async () => {
      if (!projectId || !promptId) throw new Error('Project ID and Prompt ID are required');
      
      const response = await apiClient.get<{
        success: boolean;
        data: {
          contextChars: number;
          templateChars: number;
          selectedBlocksCount: number;
          selectedItemsCount: number;
        };
      }>(`/api/projects/${projectId}/prompts/${promptId}/stats`);
      return response.data.data;
    },
  });
}

// Get context stats
export function useContextStats(projectId: string | undefined) {
  return useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      
      const response = await apiClient.get<{
        success: boolean;
        data: {
          totalBlocks: number;
          totalItems: number;
          totalSubItems: number;
          totalChars: number;
          blockStats: Array<{
            id: number;
            title: string;
            itemsCount: number;
            subItemsCount: number;
            totalChars: number;
          }>;
        };
      }>(`/api/projects/${projectId}/context-blocks/stats`);
      return response.data.data;
    },
  });
}

