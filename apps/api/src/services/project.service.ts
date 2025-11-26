import prisma from '../lib/prisma.js';
import { Project } from '@prisma/client';

interface ProjectData {
  contextBlocks: unknown[];
  promptBlocks: unknown[];
}

interface CreateProjectInput {
  name: string;
  userId: string;
}

interface UpdateProjectInput {
  name?: string;
  data?: ProjectData;
}

class ProjectService {
  /**
   * Get all projects for a user
   */
  async getUserProjects(userId: string): Promise<Project[]> {
    return await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Get project by ID
   */
  async getProjectById(projectId: string, userId: string): Promise<Project | null> {
    return await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });
  }

  /**
   * Create new project
   */
  async createProject(input: CreateProjectInput): Promise<Project> {
    const initialData: ProjectData = {
      contextBlocks: [],
      promptBlocks: [],
    };

    return await prisma.project.create({
      data: {
        name: input.name,
        userId: input.userId,
        data: initialData as any,
      },
    });
  }

  /**
   * Update project
   */
  async updateProject(
    projectId: string,
    userId: string,
    input: UpdateProjectInput
  ): Promise<Project> {
    // Verify ownership
    const project = await this.getProjectById(projectId, userId);
    if (!project) {
      throw new Error('Project not found');
    }

    return await prisma.project.update({
      where: { id: projectId },
      data: input as any,
    });
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    // Verify ownership
    const project = await this.getProjectById(projectId, userId);
    if (!project) {
      throw new Error('Project not found');
    }

    await prisma.project.delete({
      where: { id: projectId },
    });
  }

  /**
   * Duplicate project
   */
  async duplicateProject(projectId: string, userId: string): Promise<Project> {
    const original = await this.getProjectById(projectId, userId);
    if (!original) {
      throw new Error('Project not found');
    }

    return await prisma.project.create({
      data: {
        name: `${original.name} (Copy)`,
        userId,
        data: original.data as any,
      },
    });
  }

  /**
   * Import project from JSON
   */
  async importProject(userId: string, name: string, data: ProjectData): Promise<Project> {
    return await prisma.project.create({
      data: {
        name,
        userId,
        data: data as any,
      },
    });
  }

  /**
   * Export project to JSON
   */
  async exportProject(projectId: string, userId: string): Promise<unknown> {
    const project = await this.getProjectById(projectId, userId);
    if (!project) {
      throw new Error('Project not found');
    }

    return {
      name: project.name,
      data: project.data,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
  }

  /**
   * Get project count for user
   */
  async getProjectCount(userId: string): Promise<number> {
    return await prisma.project.count({
      where: { userId },
    });
  }

  /**
   * Check if user can create more projects
   */
  async canCreateProject(userId: string): Promise<boolean> {
    const count = await this.getProjectCount(userId);
    const limit = 10; // Free plan
    return count < limit;
  }
}

export const projectService = new ProjectService();

