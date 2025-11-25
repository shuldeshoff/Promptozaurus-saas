import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.middleware.js';
import { projectService } from '../services/project.service.js';

interface ProjectData {
  contextBlocks: unknown[];
  promptBlocks: unknown[];
}

interface CreateProjectBody {
  name: string;
}

interface UpdateProjectBody {
  name?: string;
  data?: ProjectData;
}

interface ImportProjectBody {
  name: string;
  data: ProjectData;
}

interface ProjectParams {
  id: string;
}

export async function projectRoutes(fastify: FastifyInstance) {
  // Get all user projects
  fastify.get(
    '/api/projects',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = request.user as { userId: string };
        const projects = await projectService.getUserProjects(userId);
        return { success: true, data: projects };
      } catch (error) {
        fastify.log.error({ err: error }, 'Get projects error');
        return reply.code(500).send({ error: 'Failed to get projects' });
      }
    }
  );

  // Get project by ID
  fastify.get<{ Params: ProjectParams }>(
    '/api/projects/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { userId } = request.user as { userId: string };
        const { id } = request.params;

        const project = await projectService.getProjectById(id, userId);

        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        return { success: true, data: project };
      } catch (error) {
        fastify.log.error({ err: error }, 'Get project error');
        return reply.code(500).send({ error: 'Failed to get project' });
      }
    }
  );

  // Create project
  fastify.post<{ Body: CreateProjectBody }>(
    '/api/projects',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { userId } = request.user as { userId: string };
        const { name } = request.body;

        // Check limit
        const canCreate = await projectService.canCreateProject(userId);
        if (!canCreate) {
          return reply.code(403).send({
            error: 'Project limit reached',
            message: 'You have reached the maximum of 10 projects for free plan',
          });
        }

        const project = await projectService.createProject({ name, userId });
        return { success: true, data: project };
      } catch (error) {
        fastify.log.error({ err: error }, 'Create project error');
        return reply.code(500).send({ error: 'Failed to create project' });
      }
    }
  );

  // Update project
  fastify.patch<{ Params: ProjectParams; Body: UpdateProjectBody }>(
    '/api/projects/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { userId } = request.user as { userId: string };
        const { id } = request.params;
        const { name, data } = request.body;

        const project = await projectService.updateProject(id, userId, { name, data });
        return { success: true, data: project };
      } catch (error) {
        fastify.log.error({ err: error }, 'Update project error');
        const message = error instanceof Error ? error.message : 'Failed to update project';
        return reply.code(error instanceof Error && error.message === 'Project not found' ? 404 : 500)
          .send({ error: message });
      }
    }
  );

  // Delete project
  fastify.delete<{ Params: ProjectParams }>(
    '/api/projects/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { userId } = request.user as { userId: string };
        const { id } = request.params;

        await projectService.deleteProject(id, userId);
        return { success: true, message: 'Project deleted successfully' };
      } catch (error) {
        fastify.log.error({ err: error }, 'Delete project error');
        const message = error instanceof Error ? error.message : 'Failed to delete project';
        return reply.code(error instanceof Error && error.message === 'Project not found' ? 404 : 500)
          .send({ error: message });
      }
    }
  );

  // Duplicate project
  fastify.post<{ Params: ProjectParams }>(
    '/api/projects/:id/duplicate',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { userId } = request.user as { userId: string };
        const { id } = request.params;

        // Check limit
        const canCreate = await projectService.canCreateProject(userId);
        if (!canCreate) {
          return reply.code(403).send({
            error: 'Project limit reached',
            message: 'You have reached the maximum of 10 projects for free plan',
          });
        }

        const project = await projectService.duplicateProject(id, userId);
        return { success: true, data: project };
      } catch (error) {
        fastify.log.error({ err: error }, 'Duplicate project error');
        const message = error instanceof Error ? error.message : 'Failed to duplicate project';
        return reply.code(error instanceof Error && error.message === 'Project not found' ? 404 : 500)
          .send({ error: message });
      }
    }
  );

  // Import project
  fastify.post<{ Body: ImportProjectBody }>(
    '/api/projects/import',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { userId } = request.user as { userId: string };
        const { name, data } = request.body;

        // Check limit
        const canCreate = await projectService.canCreateProject(userId);
        if (!canCreate) {
          return reply.code(403).send({
            error: 'Project limit reached',
            message: 'You have reached the maximum of 10 projects for free plan',
          });
        }

        const project = await projectService.importProject(userId, name, data);
        return { success: true, data: project };
      } catch (error) {
        fastify.log.error({ err: error }, 'Import project error');
        return reply.code(500).send({ error: 'Failed to import project' });
      }
    }
  );

  // Export project
  fastify.get<{ Params: ProjectParams }>(
    '/api/projects/:id/export',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { userId } = request.user as { userId: string };
        const { id } = request.params;

        const exportData = await projectService.exportProject(id, userId);
        return { success: true, data: exportData };
      } catch (error) {
        fastify.log.error({ err: error }, 'Export project error');
        const message = error instanceof Error ? error.message : 'Failed to export project';
        return reply.code(error instanceof Error && error.message === 'Project not found' ? 404 : 500)
          .send({ error: message });
      }
    }
  );
}

