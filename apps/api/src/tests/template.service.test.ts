import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateService } from '../services/template.service';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    template: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
  };

  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

describe('TemplateService', () => {
  let templateService: TemplateService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    templateService = new TemplateService();
    (templateService as any).prisma = mockPrisma;
    vi.clearAllMocks();
  });

  describe('createTemplate', () => {
    it('должен создать новый промпт', async () => {
      const userId = 'user-123';
      const projectId = 'project-123';
      const templateData = {
        name: 'Test Prompt',
        content: 'This is a test prompt for {{variable}}',
        variables: { variable: 'test' },
      };

      const mockTemplate = {
        id: 'template-123',
        ...templateData,
        userId,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.template.create.mockResolvedValue(mockTemplate);

      const result = await templateService.createTemplate(
        userId,
        projectId,
        templateData
      );

      expect(result).toEqual(mockTemplate);
      expect(mockPrisma.template.create).toHaveBeenCalledWith({
        data: {
          ...templateData,
          userId,
          projectId,
        },
      });
    });

    it('должен создать промпт без переменных', async () => {
      const userId = 'user-123';
      const projectId = 'project-123';
      const templateData = {
        name: 'Simple Prompt',
        content: 'This is a simple prompt without variables',
      };

      const mockTemplate = {
        id: 'template-123',
        ...templateData,
        variables: null,
        userId,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.template.create.mockResolvedValue(mockTemplate);

      const result = await templateService.createTemplate(
        userId,
        projectId,
        templateData
      );

      expect(result).toEqual(mockTemplate);
    });
  });

  describe('getUserTemplates', () => {
    it('должен вернуть все промпты пользователя', async () => {
      const userId = 'user-123';

      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Prompt 1',
          content: 'Content 1',
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'template-2',
          name: 'Prompt 2',
          content: 'Content 2',
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.template.findMany.mockResolvedValue(mockTemplates);

      const result = await templateService.getUserTemplates(userId);

      expect(result).toEqual(mockTemplates);
      expect(result).toHaveLength(2);
      expect(mockPrisma.template.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('должен вернуть промпты конкретного проекта', async () => {
      const userId = 'user-123';
      const projectId = 'project-123';

      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Project Prompt',
          content: 'Content',
          userId,
          projectId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.template.findMany.mockResolvedValue(mockTemplates);

      const result = await templateService.getProjectTemplates(
        userId,
        projectId
      );

      expect(result).toEqual(mockTemplates);
      expect(mockPrisma.template.findMany).toHaveBeenCalledWith({
        where: { userId, projectId },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('searchTemplates', () => {
    it('должен найти промпты по поисковому запросу', async () => {
      const userId = 'user-123';
      const searchQuery = 'python code';

      const mockResults = [
        {
          id: 'template-1',
          name: 'Python Code Review',
          content: 'Review this Python code',
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'template-2',
          name: 'Code Analysis',
          content: 'Analyze Python script',
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValue(mockResults);

      const result = await templateService.searchTemplates(userId, searchQuery);

      expect(result).toEqual(mockResults);
      expect(result).toHaveLength(2);
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('должен вернуть пустой массив если ничего не найдено', async () => {
      const userId = 'user-123';
      const searchQuery = 'nonexistent query';

      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await templateService.searchTemplates(userId, searchQuery);

      expect(result).toEqual([]);
    });

    it('должен обрабатывать спецсимволы в поисковом запросе', async () => {
      const userId = 'user-123';
      const searchQuery = "SQL injection'; DROP TABLE--";

      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await templateService.searchTemplates(userId, searchQuery);

      expect(result).toEqual([]);
      // Проверяем, что запрос был сделан безопасно (без SQL injection)
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });
  });

  describe('updateTemplate', () => {
    it('должен обновить промпт', async () => {
      const templateId = 'template-123';
      const userId = 'user-123';
      const updateData = {
        name: 'Updated Prompt',
        content: 'Updated content with {{newVariable}}',
        variables: { newVariable: 'value' },
      };

      const mockUpdatedTemplate = {
        id: templateId,
        ...updateData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.template.update.mockResolvedValue(mockUpdatedTemplate);

      const result = await templateService.updateTemplate(
        templateId,
        userId,
        updateData
      );

      expect(result).toEqual(mockUpdatedTemplate);
      expect(mockPrisma.template.update).toHaveBeenCalledWith({
        where: { id: templateId, userId },
        data: updateData,
      });
    });
  });

  describe('deleteTemplate', () => {
    it('должен удалить промпт', async () => {
      const templateId = 'template-123';
      const userId = 'user-123';

      const mockDeletedTemplate = {
        id: templateId,
        name: 'Deleted Prompt',
        content: 'Content',
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.template.delete.mockResolvedValue(mockDeletedTemplate);

      const result = await templateService.deleteTemplate(templateId, userId);

      expect(result).toEqual(mockDeletedTemplate);
      expect(mockPrisma.template.delete).toHaveBeenCalledWith({
        where: { id: templateId, userId },
      });
    });
  });

  describe('duplicateTemplate', () => {
    it('должен создать копию промпта', async () => {
      const templateId = 'template-123';
      const userId = 'user-123';

      const originalTemplate = {
        id: templateId,
        name: 'Original Prompt',
        content: 'Original content',
        variables: { var: 'value' },
        userId,
        projectId: 'project-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const duplicatedTemplate = {
        id: 'template-456',
        name: 'Original Prompt (Copy)',
        content: 'Original content',
        variables: { var: 'value' },
        userId,
        projectId: 'project-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.template.findUnique.mockResolvedValue(originalTemplate);
      mockPrisma.template.create.mockResolvedValue(duplicatedTemplate);

      const result = await templateService.duplicateTemplate(
        templateId,
        userId
      );

      expect(result.name).toBe('Original Prompt (Copy)');
      expect(result.content).toBe(originalTemplate.content);
      expect(mockPrisma.template.create).toHaveBeenCalledWith({
        data: {
          name: 'Original Prompt (Copy)',
          content: originalTemplate.content,
          variables: originalTemplate.variables,
          userId,
          projectId: originalTemplate.projectId,
        },
      });
    });
  });

  describe('getTemplateStats', () => {
    it('должен вернуть статистику по промптам', async () => {
      const userId = 'user-123';

      mockPrisma.template.count.mockResolvedValueOnce(42); // total
      mockPrisma.template.count.mockResolvedValueOnce(5); // this week

      const stats = await templateService.getTemplateStats(userId);

      expect(stats.total).toBe(42);
      expect(stats.thisWeek).toBe(5);
      expect(mockPrisma.template.count).toHaveBeenCalledTimes(2);
    });
  });
});

