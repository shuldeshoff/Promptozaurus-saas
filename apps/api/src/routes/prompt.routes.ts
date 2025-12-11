import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.middleware.js';
import { projectService } from '../services/project.service.js';
import { compilePrompt, calculatePromptContextChars } from '../utils/prompt.utils.js';
import { PromptBlock, ProjectData, SelectedContext } from '@promptozaurus/shared';
import { PromptBlockSchema } from '@promptozaurus/shared';

interface PromptParams {
  id: string; // project id
  promptId: string;
}

interface CompilePromptBody {
  wrapWithTags?: boolean;
}

interface UpdatePromptBlocksBody {
  promptBlocks: PromptBlock[];
}

export async function promptRoutes(fastify: FastifyInstance) {
  // Update prompt blocks
  fastify.patch<{ Params: { id: string }; Body: UpdatePromptBlocksBody }>(
    '/api/projects/:id/prompt-blocks',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { userId } = request.user as { userId: string };
        const { id: projectId } = request.params;
        const { promptBlocks } = request.body;

        // Get project
        const project = await projectService.getProjectById(projectId, userId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        // Validate prompt blocks
        if (!Array.isArray(promptBlocks)) {
          return reply.code(400).send({ error: 'promptBlocks must be an array' });
        }

        // Validate each block
        for (const block of promptBlocks) {
          const validation = PromptBlockSchema.safeParse(block);
          if (!validation.success) {
            return reply.code(400).send({
              error: 'Invalid prompt block structure',
              details: validation.error.errors,
            });
          }
        }

        // Update project data
        const projectData = project.data as unknown as ProjectData;
        const updatedData: ProjectData = {
          ...projectData,
          promptBlocks,
        };

        const updatedProject = await projectService.updateProject(
          projectId,
          userId,
          { data: updatedData }
        );

        // Calculate statistics
        const totalPrompts = promptBlocks.length;
        const totalSelectedContexts = promptBlocks.reduce(
          (sum, prompt) => sum + prompt.selectedContexts.length,
          0
        );

        return {
          success: true,
          data: {
            project: updatedProject,
            stats: {
              totalPrompts,
              totalSelectedContexts,
            },
          },
        };
      } catch (error) {
        fastify.log.error({ err: error }, 'Update prompt blocks error');
        return reply.code(500).send({ error: 'Failed to update prompt blocks' });
      }
    }
  );
  // Compile prompt
  fastify.post<{ Params: PromptParams; Body: CompilePromptBody }>(
    '/api/projects/:id/prompts/:promptId/compile',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { userId } = request.user as { userId: string };
        const { id: projectId, promptId } = request.params;
        const { wrapWithTags = false } = request.body || {};

        // Get project
        const project = await projectService.getProjectById(projectId, userId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        const projectData = project.data as unknown as ProjectData;

        // Find prompt block
        const promptBlock = projectData.promptBlocks?.find(
          (p: PromptBlock) => p.id === parseInt(promptId)
        );

        if (!promptBlock) {
          return reply.code(404).send({ error: 'Prompt block not found' });
        }

        // Compile prompt
        const compiled = compilePrompt(
          promptBlock,
          projectData.contextBlocks || [],
          wrapWithTags
        );

        // Calculate context chars
        const contextChars = calculatePromptContextChars(
          promptBlock,
          projectData.contextBlocks || []
        );

        return {
          success: true,
          data: {
            compiled,
            contextChars,
            templateChars: promptBlock.template.length,
            totalChars: compiled.length,
          },
        };
      } catch (error) {
        fastify.log.error({ err: error }, 'Compile prompt error');
        return reply.code(500).send({ error: 'Failed to compile prompt' });
      }
    }
  );

  // Get prompt statistics
  fastify.get<{ Params: PromptParams }>(
    '/api/projects/:id/prompts/:promptId/stats',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { userId } = request.user as { userId: string };
        const { id: projectId, promptId } = request.params;

        // Get project
        const project = await projectService.getProjectById(projectId, userId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        const projectData = project.data as unknown as ProjectData;

        // Find prompt block
        const promptBlock = projectData.promptBlocks?.find(
          (p: PromptBlock) => p.id === parseInt(promptId)
        );

        if (!promptBlock) {
          return reply.code(404).send({ error: 'Prompt block not found' });
        }

        // Calculate statistics
        const contextChars = calculatePromptContextChars(
          promptBlock,
          projectData.contextBlocks || []
        );

        const templateChars = promptBlock.template.length;
        const selectedBlocksCount = promptBlock.selectedContexts.length;
        const selectedItemsCount = promptBlock.selectedContexts.reduce(
          (sum: number, sel: SelectedContext) => sum + sel.itemIds.length + sel.subItemIds.length,
          0
        );

        return {
          success: true,
          data: {
            contextChars,
            templateChars,
            selectedBlocksCount,
            selectedItemsCount,
          },
        };
      } catch (error) {
        fastify.log.error({ err: error }, 'Get prompt stats error');
        return reply.code(500).send({ error: 'Failed to get prompt statistics' });
      }
    }
  );
}

