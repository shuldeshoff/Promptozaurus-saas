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

interface ProjectSizeInfo {
  totalChars: number;
  contextBlocksCount: number;
  promptBlocksCount: number;
  maxContextBlockChars: number;
  isOverLimit: boolean;
  limitChars: number;
}

// Лимиты
const PROJECT_LIMITS = {
  MAX_PROJECT_CHARS: 10_000_000, // 10 млн символов на проект
  MAX_CONTEXT_BLOCK_CHARS: 5_000_000, // 5 млн символов на блок контекста
};

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

    // Validate project size if data is being updated
    if (input.data) {
      const validation = this.validateProjectSize(input.data);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
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

  /**
   * Calculate project size
   */
  calculateProjectSize(data: ProjectData): ProjectSizeInfo {
    let totalChars = 0;
    let maxContextBlockChars = 0;
    
    const contextBlocks = (data.contextBlocks || []) as any[];
    const promptBlocks = (data.promptBlocks || []) as any[];
    
    // Подсчитываем размер каждого блока контекста
    contextBlocks.forEach((block) => {
      let blockChars = 0;
      const items = block.items || [];
      
      items.forEach((item: any) => {
        blockChars += item.chars || 0;
        
        if (item.subItems) {
          item.subItems.forEach((sub: any) => {
            blockChars += sub.chars || 0;
          });
        }
      });
      
      totalChars += blockChars;
      maxContextBlockChars = Math.max(maxContextBlockChars, blockChars);
    });
    
    return {
      totalChars,
      contextBlocksCount: contextBlocks.length,
      promptBlocksCount: promptBlocks.length,
      maxContextBlockChars,
      isOverLimit: 
        totalChars > PROJECT_LIMITS.MAX_PROJECT_CHARS || 
        maxContextBlockChars > PROJECT_LIMITS.MAX_CONTEXT_BLOCK_CHARS,
      limitChars: PROJECT_LIMITS.MAX_PROJECT_CHARS,
    };
  }

  /**
   * Validate project size before update
   */
  validateProjectSize(data: ProjectData): { valid: boolean; error?: string; sizeInfo: ProjectSizeInfo } {
    const sizeInfo = this.calculateProjectSize(data);
    
    if (sizeInfo.totalChars > PROJECT_LIMITS.MAX_PROJECT_CHARS) {
      return {
        valid: false,
        error: `Project size exceeds limit: ${sizeInfo.totalChars.toLocaleString()} / ${PROJECT_LIMITS.MAX_PROJECT_CHARS.toLocaleString()} characters`,
        sizeInfo,
      };
    }
    
    if (sizeInfo.maxContextBlockChars > PROJECT_LIMITS.MAX_CONTEXT_BLOCK_CHARS) {
      return {
        valid: false,
        error: `Context block size exceeds limit: ${sizeInfo.maxContextBlockChars.toLocaleString()} / ${PROJECT_LIMITS.MAX_CONTEXT_BLOCK_CHARS.toLocaleString()} characters`,
        sizeInfo,
      };
    }
    
    return { valid: true, sizeInfo };
  }
}

export const projectService = new ProjectService();

