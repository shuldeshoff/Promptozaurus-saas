import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.middleware.js';
import { templateService } from '../services/template.service.js';

interface CreateTemplateBody {
  name: string;
  content: string;
}

interface UpdateTemplateBody {
  name?: string;
  content?: string;
}

interface TemplateParams {
  id: string;
}

interface SearchQuerystring {
  q?: string;
}

export async function templateRoutes(fastify: FastifyInstance) {
  // Get all user templates
  fastify.get(
    '/api/templates',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { userId } = request.user as { userId: string };
        const templates = await templateService.getUserTemplates(userId);
        return { success: true, data: templates };
      } catch (error) {
        fastify.log.error({ err: error }, 'Get templates error');
        return reply.code(500).send({ error: 'Failed to get templates' });
      }
    }
  );

  // Search templates
  fastify.get<{ Querystring: SearchQuerystring }>(
    '/api/templates/search',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { userId } = request.user as { userId: string };
        const { q } = request.query;

        if (!q || q.trim() === '') {
          return reply.code(400).send({ error: 'Search query is required' });
        }

        const templates = await templateService.searchTemplates(userId, q);
        return { success: true, data: templates };
      } catch (error) {
        fastify.log.error({ err: error }, 'Search templates error');
        return reply.code(500).send({ error: 'Failed to search templates' });
      }
    }
  );

  // Get template by ID
  fastify.get<{ Params: TemplateParams }>(
    '/api/templates/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { userId } = request.user as { userId: string };
        const { id } = request.params;

        const template = await templateService.getTemplateById(id, userId);

        if (!template) {
          return reply.code(404).send({ error: 'Template not found' });
        }

        return { success: true, data: template };
      } catch (error) {
        fastify.log.error({ err: error }, 'Get template error');
        return reply.code(500).send({ error: 'Failed to get template' });
      }
    }
  );

  // Create template
  fastify.post<{ Body: CreateTemplateBody }>(
    '/api/templates',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { userId } = request.user as { userId: string };
        const { name, content } = request.body;

        if (!name || !name.trim()) {
          return reply.code(400).send({ error: 'Template name is required' });
        }

        if (!content || !content.trim()) {
          return reply.code(400).send({ error: 'Template content is required' });
        }

        const template = await templateService.createTemplate({
          name: name.trim(),
          content: content.trim(),
          userId,
        });

        return { success: true, data: template };
      } catch (error) {
        fastify.log.error({ err: error }, 'Create template error');
        return reply.code(500).send({ error: 'Failed to create template' });
      }
    }
  );

  // Update template
  fastify.patch<{ Params: TemplateParams; Body: UpdateTemplateBody }>(
    '/api/templates/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { userId } = request.user as { userId: string };
        const { id } = request.params;
        const { name, content } = request.body;

        if (!name && !content) {
          return reply.code(400).send({ error: 'At least one field is required' });
        }

        const updateData: UpdateTemplateBody = {};
        if (name !== undefined) updateData.name = name.trim();
        if (content !== undefined) updateData.content = content.trim();

        const template = await templateService.updateTemplate(id, userId, updateData);
        return { success: true, data: template };
      } catch (error) {
        fastify.log.error({ err: error }, 'Update template error');
        const message = error instanceof Error ? error.message : 'Failed to update template';
        return reply
          .code(error instanceof Error && error.message === 'Template not found' ? 404 : 500)
          .send({ error: message });
      }
    }
  );

  // Delete template
  fastify.delete<{ Params: TemplateParams }>(
    '/api/templates/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { userId } = request.user as { userId: string };
        const { id } = request.params;

        await templateService.deleteTemplate(id, userId);
        return { success: true, message: 'Template deleted successfully' };
      } catch (error) {
        fastify.log.error({ err: error }, 'Delete template error');
        const message = error instanceof Error ? error.message : 'Failed to delete template';
        return reply
          .code(error instanceof Error && error.message === 'Template not found' ? 404 : 500)
          .send({ error: message });
      }
    }
  );

  // Get template count
  fastify.get(
    '/api/templates/stats/count',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { userId } = request.user as { userId: string };
        const count = await templateService.getTemplateCount(userId);
        return { success: true, data: { count } };
      } catch (error) {
        fastify.log.error({ err: error }, 'Get template count error');
        return reply.code(500).send({ error: 'Failed to get template count' });
      }
    }
  );
}

