import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectService } from '../services/project.service';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    project: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    projectShare: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  };

  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

describe('ProjectService', () => {
  let projectService: ProjectService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    projectService = new ProjectService();
    (projectService as any).prisma = mockPrisma;
    vi.clearAllMocks();
  });

  describe('createProject', () => {
    it('должен создать новый проект с валидными данными', async () => {
      const userId = 'user-123';
      const projectData = {
        name: 'Test Project',
        description: 'Test Description',
      };

      const mockProject = {
        id: 'project-123',
        ...projectData,
        userId,
        data: { contextBlocks: [], promptBlocks: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.create.mockResolvedValue(mockProject);

      const result = await projectService.createProject(userId, projectData);

      expect(result).toEqual(mockProject);
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: {
          name: projectData.name,
          userId,
          data: { contextBlocks: [], promptBlocks: [] },
        },
      });
    });

    it('должен выбросить ошибку при пустом названии', async () => {
      const userId = 'user-123';
      const projectData = {
        name: '',
      };

      await expect(
        projectService.createProject(userId, projectData)
      ).rejects.toThrow();
    });
  });

  describe('getUserProjects', () => {
    it('должен вернуть все проекты пользователя', async () => {
      const userId = 'user-123';
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Project 1',
          userId,
          data: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'project-2',
          name: 'Project 2',
          userId,
          data: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.project.findMany.mockResolvedValue(mockProjects);

      const result = await projectService.getUserProjects(userId);

      expect(result).toEqual(mockProjects);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('должен вернуть пустой массив если нет проектов', async () => {
      const userId = 'user-123';
      mockPrisma.project.findMany.mockResolvedValue([]);

      const result = await projectService.getUserProjects(userId);

      expect(result).toEqual([]);
    });
  });

  describe('updateProject', () => {
    it('должен обновить проект', async () => {
      const projectId = 'project-123';
      const userId = 'user-123';
      const updateData = {
        name: 'Updated Project',
        data: {
          contextBlocks: [
            {
              id: 'block-1',
              title: 'Context',
              items: [{ id: 'item-1', content: 'test', chars: 4 }],
            },
          ],
        },
      };

      const mockUpdatedProject = {
        id: projectId,
        ...updateData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.update.mockResolvedValue(mockUpdatedProject);

      const result = await projectService.updateProject(
        projectId,
        userId,
        updateData
      );

      expect(result).toEqual(mockUpdatedProject);
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId, userId },
        data: updateData,
      });
    });

    it('должен выбросить ошибку при превышении лимита символов', async () => {
      const projectId = 'project-123';
      const userId = 'user-123';

      // Создаем данные размером > 10M символов
      const largeContent = 'a'.repeat(11_000_000);
      const updateData = {
        data: {
          contextBlocks: [
            {
              id: 'block-1',
              title: 'Large Context',
              items: [{ id: 'item-1', content: largeContent, chars: largeContent.length }],
            },
          ],
        },
      };

      await expect(
        projectService.updateProject(projectId, userId, updateData)
      ).rejects.toThrow(/превышен лимит/i);
    });
  });

  describe('deleteProject', () => {
    it('должен удалить проект', async () => {
      const projectId = 'project-123';
      const userId = 'user-123';

      const mockDeletedProject = {
        id: projectId,
        name: 'Deleted Project',
        userId,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.delete.mockResolvedValue(mockDeletedProject);

      const result = await projectService.deleteProject(projectId, userId);

      expect(result).toEqual(mockDeletedProject);
      expect(mockPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: projectId, userId },
      });
    });
  });

  describe('calculateProjectSize', () => {
    it('должен правильно посчитать размер проекта', () => {
      const projectData = {
        contextBlocks: [
          {
            id: 'block-1',
            title: 'Context 1',
            items: [
              { id: 'item-1', content: 'test', chars: 4 },
              { id: 'item-2', content: 'hello', chars: 5 },
            ],
          },
        ],
        promptBlocks: [
          {
            id: 'prompt-1',
            title: 'Prompt 1',
            template: 'test prompt',
            chars: 11,
          },
        ],
      };

      const size = (projectService as any).calculateProjectSize(projectData);

      // 4 + 5 (context) + 11 (prompt) = 20
      expect(size).toBe(20);
    });

    it('должен не дублировать подсчет при наличии subItems', () => {
      const projectData = {
        contextBlocks: [
          {
            id: 'block-1',
            title: 'Context 1',
            items: [
              {
                id: 'item-1',
                content: 'original',
                chars: 8,
                subItems: [
                  { id: 'sub-1', content: 'part1', chars: 5 },
                  { id: 'sub-2', content: 'part2', chars: 5 },
                ],
              },
            ],
          },
        ],
      };

      const size = (projectService as any).calculateProjectSize(projectData);

      // Должен считать только subItems (5 + 5 = 10), а не item.chars (8)
      expect(size).toBe(10);
    });
  });

  describe('shareProject', () => {
    it('должен расшарить проект с другим пользователем', async () => {
      const projectId = 'project-123';
      const userId = 'user-123';
      const sharedWithEmail = 'colleague@example.com';
      const permission = 'edit';

      const mockShare = {
        id: 'share-123',
        projectId,
        sharedWithEmail,
        permission,
        createdAt: new Date(),
      };

      mockPrisma.projectShare.create.mockResolvedValue(mockShare);

      const result = await projectService.shareProject(
        projectId,
        userId,
        sharedWithEmail,
        permission
      );

      expect(result).toEqual(mockShare);
      expect(mockPrisma.projectShare.create).toHaveBeenCalledWith({
        data: {
          projectId,
          sharedWithEmail,
          permission,
        },
      });
    });
  });

  describe('getSharedProjects', () => {
    it('должен вернуть проекты, расшаренные с пользователем', async () => {
      const userEmail = 'user@example.com';

      const mockSharedProjects = [
        {
          project: {
            id: 'project-1',
            name: 'Shared Project 1',
            data: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      mockPrisma.projectShare.findMany.mockResolvedValue(mockSharedProjects);

      const result = await projectService.getSharedProjects(userEmail);

      expect(result).toHaveLength(1);
      expect(result[0].project.name).toBe('Shared Project 1');
      expect(mockPrisma.projectShare.findMany).toHaveBeenCalledWith({
        where: { sharedWithEmail: userEmail },
        include: { project: true },
      });
    });
  });
});

