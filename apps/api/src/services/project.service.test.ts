import { describe, it, expect, beforeEach, vi } from 'vitest';
import { projectService } from '../services/project.service';
import prisma from '../lib/prisma';

// Mock Prisma client
vi.mock('../lib/prisma', () => ({
  default: {
    project: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('ProjectService', () => {
  const mockUserId = 'user-123';
  const mockProjectId = 'project-456';
  const mockProject = {
    id: mockProjectId,
    userId: mockUserId,
    name: 'Test Project',
    data: { contextBlocks: [], promptBlocks: [] },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserProjects', () => {
    it('should return all projects for a user', async () => {
      const mockProjects = [mockProject];
      vi.mocked(prisma.project.findMany).mockResolvedValue(mockProjects);

      const result = await projectService.getUserProjects(mockUserId);

      expect(result).toEqual(mockProjects);
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('getProjectById', () => {
    it('should return a project by id', async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue(mockProject);

      const result = await projectService.getProjectById(mockProjectId, mockUserId);

      expect(result).toEqual(mockProject);
      expect(prisma.project.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockProjectId,
          userId: mockUserId,
        },
      });
    });

    it('should return null if project not found', async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue(null);

      const result = await projectService.getProjectById('nonexistent', mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      const newProjectData = {
        name: 'New Project',
        userId: mockUserId,
      };

      vi.mocked(prisma.project.create).mockResolvedValue(mockProject);

      const result = await projectService.createProject(newProjectData);

      expect(result).toEqual(mockProject);
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          name: newProjectData.name,
          userId: newProjectData.userId,
          data: {
            contextBlocks: [],
            promptBlocks: [],
          },
        },
      });
    });
  });

  describe('updateProject', () => {
    it('should update a project', async () => {
      const updateData = {
        name: 'Updated Project',
      };

      vi.mocked(prisma.project.findFirst).mockResolvedValue(mockProject);
      vi.mocked(prisma.project.update).mockResolvedValue({
        ...mockProject,
        ...updateData,
      });

      const result = await projectService.updateProject(
        mockProjectId,
        mockUserId,
        updateData
      );

      expect(result.name).toBe(updateData.name);
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: mockProjectId },
        data: updateData,
      });
    });

    it('should throw error if project not found', async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue(null);

      await expect(
        projectService.updateProject(mockProjectId, mockUserId, { name: 'Test' })
      ).rejects.toThrow('Project not found');
    });
  });

  describe('deleteProject', () => {
    it('should delete a project', async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue(mockProject);
      vi.mocked(prisma.project.delete).mockResolvedValue(mockProject);

      await projectService.deleteProject(mockProjectId, mockUserId);

      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: mockProjectId },
      });
    });

    it('should throw error if project not found', async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue(null);

      await expect(
        projectService.deleteProject(mockProjectId, mockUserId)
      ).rejects.toThrow('Project not found');
    });
  });

  describe('duplicateProject', () => {
    it('should duplicate a project', async () => {
      const duplicatedProject = {
        ...mockProject,
        id: 'new-id',
        name: 'Test Project (Copy)',
      };

      vi.mocked(prisma.project.findFirst).mockResolvedValue(mockProject);
      vi.mocked(prisma.project.create).mockResolvedValue(duplicatedProject);

      const result = await projectService.duplicateProject(mockProjectId, mockUserId);

      expect(result.name).toContain('(Copy)');
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Project (Copy)',
          userId: mockUserId,
          data: mockProject.data,
        },
      });
    });
  });

  describe('canCreateProject', () => {
    it('should return true if user has less than 10 projects', async () => {
      vi.mocked(prisma.project.count).mockResolvedValue(5);

      const result = await projectService.canCreateProject(mockUserId);

      expect(result).toBe(true);
    });

    it('should return false if user has 10 or more projects', async () => {
      vi.mocked(prisma.project.count).mockResolvedValue(10);

      const result = await projectService.canCreateProject(mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('getProjectCount', () => {
    it('should return the count of user projects', async () => {
      vi.mocked(prisma.project.count).mockResolvedValue(7);

      const result = await projectService.getProjectCount(mockUserId);

      expect(result).toBe(7);
      expect(prisma.project.count).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });
  });

  describe('exportProject', () => {
    it('should export project data', async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue(mockProject);

      const result = await projectService.exportProject(mockProjectId, mockUserId);

      expect(result).toMatchObject({
        name: mockProject.name,
        data: mockProject.data,
        version: '1.0',
      });
      expect(result).toHaveProperty('exportedAt');
    });
  });

  describe('importProject', () => {
    it('should import project data', async () => {
      const importData = {
        contextBlocks: [],
        promptBlocks: [],
      };

      vi.mocked(prisma.project.create).mockResolvedValue(mockProject);

      const result = await projectService.importProject(
        mockUserId,
        'Imported Project',
        importData
      );

      expect(result).toEqual(mockProject);
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          name: 'Imported Project',
          userId: mockUserId,
          data: importData,
        },
      });
    });
  });
});

