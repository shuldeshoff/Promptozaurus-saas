import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjects } from '../../hooks/useProjects';
import * as api from '../../lib/api';

// Mock API
vi.mock('../../lib/api');

describe('useProjects', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('useProjectsQuery', () => {
    it('должен загрузить список проектов', async () => {
      const mockProjects = [
        {
          id: '1',
          name: 'Project 1',
          data: { contextBlocks: [], promptBlocks: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Project 2',
          data: { contextBlocks: [], promptBlocks: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(api.getProjects).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useProjects(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProjects);
      expect(result.current.data).toHaveLength(2);
    });

    it('должен обработать ошибку при загрузке', async () => {
      vi.mocked(api.getProjects).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useProjects(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('должен показать статус загрузки', () => {
      vi.mocked(api.getProjects).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useProjects(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useCreateProject', () => {
    it('должен создать новый проект', async () => {
      const newProject = {
        id: '3',
        name: 'New Project',
        data: { contextBlocks: [], promptBlocks: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(api.createProject).mockResolvedValue(newProject);

      const { result } = renderHook(() => useProjects(), { wrapper });

      result.current.createProject.mutate({ name: 'New Project' });

      await waitFor(() => {
        expect(result.current.createProject.isSuccess).toBe(true);
      });

      expect(api.createProject).toHaveBeenCalledWith({ name: 'New Project' });
    });

    it('должен обработать ошибку при создании', async () => {
      vi.mocked(api.createProject).mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useProjects(), { wrapper });

      result.current.createProject.mutate({ name: 'Failed Project' });

      await waitFor(() => {
        expect(result.current.createProject.isError).toBe(true);
      });
    });
  });

  describe('useUpdateProject', () => {
    it('должен обновить проект', async () => {
      const updatedProject = {
        id: '1',
        name: 'Updated Project',
        data: { contextBlocks: [], promptBlocks: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(api.updateProject).mockResolvedValue(updatedProject);

      const { result } = renderHook(() => useProjects(), { wrapper });

      result.current.updateProject.mutate({
        id: '1',
        name: 'Updated Project',
      });

      await waitFor(() => {
        expect(result.current.updateProject.isSuccess).toBe(true);
      });

      expect(api.updateProject).toHaveBeenCalledWith('1', { name: 'Updated Project' });
    });
  });

  describe('useDeleteProject', () => {
    it('должен удалить проект', async () => {
      vi.mocked(api.deleteProject).mockResolvedValue(undefined);

      const { result } = renderHook(() => useProjects(), { wrapper });

      result.current.deleteProject.mutate('1');

      await waitFor(() => {
        expect(result.current.deleteProject.isSuccess).toBe(true);
      });

      expect(api.deleteProject).toHaveBeenCalledWith('1');
    });

    it('должен обработать ошибку при удалении', async () => {
      vi.mocked(api.deleteProject).mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useProjects(), { wrapper });

      result.current.deleteProject.mutate('1');

      await waitFor(() => {
        expect(result.current.deleteProject.isError).toBe(true);
      });
    });
  });
});

