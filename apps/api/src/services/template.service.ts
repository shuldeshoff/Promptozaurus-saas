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
   * Search templates by name or content using full-text search
   * PERFORMANCE: Uses GIN indexes for fast search on 1000+ records
   * Old method (LIKE): ~7-8 seconds on 1000 records
   * New method (tsvector): ~10-50ms on 1000+ records
   */
  async searchTemplates(userId: string, query: string): Promise<Template[]> {
    // Sanitize query for tsquery (remove special characters that could break the query)
    const sanitizedQuery = query
      .trim()
      .replace(/[&|!():*<>]/g, ' ') // Remove tsquery special chars
      .split(/\s+/)
      .filter(word => word.length > 0)
      .join(' & '); // Join with AND operator

    if (!sanitizedQuery) {
      // If query is empty after sanitization, return all templates
      return await prisma.template.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
    }

    // Use raw SQL for full-text search with GIN indexes
    // This bypasses Prisma's limitations and uses PostgreSQL's native tsvector
    // Note: We exclude tsvector columns from SELECT to avoid deserialization issues
    const templates = await prisma.$queryRaw<Template[]>`
      SELECT 
        id, user_id, name, content, created_at, updated_at
      FROM templates
      WHERE user_id = ${userId}
        AND (
          name_tsv @@ to_tsquery('english', ${sanitizedQuery})
          OR content_tsv @@ to_tsquery('english', ${sanitizedQuery})
        )
      ORDER BY 
        -- Rank by relevance (name matches are weighted higher)
        ts_rank(
          setweight(name_tsv, 'A') || setweight(content_tsv, 'B'),
          to_tsquery('english', ${sanitizedQuery})
        ) DESC,
        updated_at DESC
      LIMIT 100
    `;

    return templates;
  }

  /**
   * Fallback search for when full-text search fails (e.g., special characters)
   * Uses ILIKE for compatibility but is slower
   */
  async searchTemplatesFallback(userId: string, query: string): Promise<Template[]> {
    return await prisma.template.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }
}

export const templateService = new TemplateService();

