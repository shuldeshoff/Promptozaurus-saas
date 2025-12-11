import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.middleware.js';
import { projectService } from '../services/project.service.js';
import { ProjectData, ContextBlock } from '@promptozaurus/shared';
import { ContextBlockSchema } from '@promptozaurus/shared';
import { calculateContextBlockChars, updateContextItemChars } from '../utils/prompt.utils.js';

interface UpdateContextBlocksParams {
  id: string; // project id
}

interface UpdateContextBlocksBody {
  contextBlocks: ContextBlock[];
}

export async function contextRoutes(fastify: FastifyInstance) {
  // Update context blocks
  fastify.patch<{ Params: UpdateContextBlocksParams; Body: UpdateContextBlocksBody }>(
    '/api/projects/:id/context-blocks',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { userId } = request.user as { userId: string };
        const { id: projectId } = request.params;
        const { contextBlocks } = request.body;

        // Get project
        const project = await projectService.getProjectById(projectId, userId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        // Validate context blocks
        if (!Array.isArray(contextBlocks)) {
          return reply.code(400).send({ error: 'contextBlocks must be an array' });
        }

        // Validate each block
        for (const block of contextBlocks) {
          const validation = ContextBlockSchema.safeParse(block);
          if (!validation.success) {
            return reply.code(400).send({
              error: 'Invalid context block structure',
              details: validation.error.errors,
            });
          }
        }

        // Update character counts for all items
        const updatedBlocks = contextBlocks.map((block) => ({
          ...block,
          items: block.items.map((item) => updateContextItemChars(item)),
        }));

        // Update project data
        const projectData = project.data as unknown as ProjectData;
        const updatedData: ProjectData = {
          ...projectData,
          contextBlocks: updatedBlocks,
        };

        const updatedProject = await projectService.updateProject(
          projectId,
          userId,
          { data: updatedData }
        );

        // Calculate statistics
        const totalBlocks = updatedBlocks.length;
        const totalItems = updatedBlocks.reduce((sum: number, block: ContextBlock) => sum + block.items.length, 0);
        const totalSubItems = updatedBlocks.reduce(
          (sum: number, block: ContextBlock) =>
            sum + block.items.reduce((itemSum: number, item) => itemSum + item.subItems.length, 0),
          0
        );
        const totalChars = updatedBlocks.reduce(
          (sum, block) => sum + calculateContextBlockChars(block),
          0
        );

        return {
          success: true,
          data: {
            project: updatedProject,
            stats: {
              totalBlocks,
              totalItems,
              totalSubItems,
              totalChars,
            },
          },
        };
      } catch (error) {
        fastify.log.error({ err: error }, 'Update context blocks error');
        return reply.code(500).send({ error: 'Failed to update context blocks' });
      }
    }
  );

  // Get context block statistics
  fastify.get<{ Params: UpdateContextBlocksParams }>(
    '/api/projects/:id/context-blocks/stats',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { userId } = request.user as { userId: string };
        const { id: projectId } = request.params;

        // Get project
        const project = await projectService.getProjectById(projectId, userId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        const projectData = project.data as unknown as ProjectData;
        const contextBlocks = projectData.contextBlocks || [];

        // Calculate statistics
        const totalBlocks = contextBlocks.length;
        const totalItems = contextBlocks.reduce((sum: number, block: ContextBlock) => sum + block.items.length, 0);
        const totalSubItems = contextBlocks.reduce(
          (sum: number, block: ContextBlock) =>
            sum + block.items.reduce((itemSum: number, item) => itemSum + item.subItems.length, 0),
          0
        );
        const totalChars = contextBlocks.reduce(
          (sum: number, block: ContextBlock) => sum + calculateContextBlockChars(block),
          0
        );

        // Block-wise statistics
        const blockStats = contextBlocks.map((block: ContextBlock) => ({
          id: block.id,
          title: block.title,
          itemsCount: block.items.length,
          subItemsCount: block.items.reduce((sum: number, item) => sum + item.subItems.length, 0),
          totalChars: calculateContextBlockChars(block),
        }));

        return {
          success: true,
          data: {
            totalBlocks,
            totalItems,
            totalSubItems,
            totalChars,
            blockStats,
          },
        };
      } catch (error) {
        fastify.log.error({ err: error }, 'Get context stats error');
        return reply.code(500).send({ error: 'Failed to get context statistics' });
      }
    }
  );
}

