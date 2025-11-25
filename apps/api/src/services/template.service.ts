import prisma from '../lib/prisma.js';
import { Template } from '@prisma/client';

interface CreateTemplateInput {
  name: string;
  content: string;
  userId: string;
}

interface UpdateTemplateInput {
  name?: string;
  content?: string;
}

class TemplateService {
  /**
   * Get all templates for a user
   */
  async getUserTemplates(userId: string): Promise<Template[]> {
    return await prisma.template.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateId: string, userId: string): Promise<Template | null> {
    return await prisma.template.findFirst({
      where: {
        id: templateId,
        userId,
      },
    });
  }

  /**
   * Create new template
   */
  async createTemplate(input: CreateTemplateInput): Promise<Template> {
    return await prisma.template.create({
      data: {
        name: input.name,
        content: input.content,
        userId: input.userId,
      },
    });
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    userId: string,
    input: UpdateTemplateInput
  ): Promise<Template> {
    // Verify ownership
    const template = await this.getTemplateById(templateId, userId);
    if (!template) {
      throw new Error('Template not found');
    }

    return await prisma.template.update({
      where: { id: templateId },
      data: input,
    });
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string, userId: string): Promise<void> {
    // Verify ownership
    const template = await this.getTemplateById(templateId, userId);
    if (!template) {
      throw new Error('Template not found');
    }

    await prisma.template.delete({
      where: { id: templateId },
    });
  }

  /**
   * Get template count for user
   */
  async getTemplateCount(userId: string): Promise<number> {
    return await prisma.template.count({
      where: { userId },
    });
  }

  /**
   * Search templates by name or content
   */
  async searchTemplates(userId: string, query: string): Promise<Template[]> {
    return await prisma.template.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}

export const templateService = new TemplateService();

