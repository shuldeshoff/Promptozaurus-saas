import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware.js';
import { projectShareService } from '../services/projectShare.service.js';

// Request schemas
const CreateShareSchema = z.object({
  sharedWithEmail: z.string().email('Invalid email'),
  permission: z.enum(['view', 'edit']).default('view'),
});

const UpdateShareSchema = z.object({
  permission: z.enum(['view', 'edit']).optional(),
  status: z.enum(['pending', 'accepted', 'rejected']).optional(),
});

export async function projectShareRoutes(fastify: FastifyInstance) {
  // Создать новый share (приглашение)
  fastify.post<{
    Params: { projectId: string };
    Body: z.infer<typeof CreateShareSchema>;
  }>(
    '/api/projects/:projectId/shares',
    { preHandler: authenticate },
    async (request, reply) => {
      const { userId, email } = request.user as { userId: string; email: string };
      const { projectId } = request.params;

      // Валидация body
      const bodyResult = CreateShareSchema.safeParse(request.body);
      if (!bodyResult.success) {
        return reply.status(400).send({
          success: false,
          error: bodyResult.error.errors[0].message,
        });
      }

      const { sharedWithEmail, permission } = bodyResult.data;

      try {
        const share = await projectShareService.createShare({
          projectId,
          ownerId: userId,
          sharedWithEmail,
          permission,
        });

        return { success: true, data: share };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create share';
        fastify.log.error({ err: error }, 'Create share error');
        return reply.status(error instanceof Error && error.message.includes('not found') ? 404 : 400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // Получить все shares для проекта
  fastify.get<{
    Params: { projectId: string };
  }>(
    '/api/projects/:projectId/shares',
    { preHandler: authenticate },
    async (request, reply) => {
      const { userId } = request.user as { userId: string };
      const { projectId } = request.params;

      try {
        const shares = await projectShareService.getProjectShares(projectId, userId);
        return { success: true, data: shares };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get shares';
        fastify.log.error({ err: error }, 'Get shares error');
        return reply.status(error instanceof Error && error.message.includes('not found') ? 404 : 500).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // Получить все проекты, расшаренные со мной
  fastify.get(
    '/api/shares/me',
    { preHandler: authenticate },
    async (request, reply) => {
      const { email } = request.user as { email: string };

      try {
        const shares = await projectShareService.getUserSharedProjects(email);
        return { success: true, data: shares };
      } catch (error) {
        fastify.log.error({ err: error }, 'Get user shares error');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get shared projects',
        });
      }
    }
  );

  // Обновить share (изменить permission или status)
  fastify.patch<{
    Params: { shareId: string };
    Body: z.infer<typeof UpdateShareSchema>;
  }>(
    '/api/shares/:shareId',
    { preHandler: authenticate },
    async (request, reply) => {
      const { userId } = request.user as { userId: string };
      const { shareId } = request.params;

      // Валидация body
      const bodyResult = UpdateShareSchema.safeParse(request.body);
      if (!bodyResult.success) {
        return reply.status(400).send({
          success: false,
          error: bodyResult.error.errors[0].message,
        });
      }

      try {
        const share = await projectShareService.updateShare(
          shareId,
          userId,
          bodyResult.data
        );
        return { success: true, data: share };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update share';
        fastify.log.error({ err: error }, 'Update share error');
        return reply.status(error instanceof Error && error.message.includes('not found') ? 404 : 403).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // Удалить share
  fastify.delete<{
    Params: { shareId: string };
  }>(
    '/api/shares/:shareId',
    { preHandler: authenticate },
    async (request, reply) => {
      const { userId } = request.user as { userId: string };
      const { shareId } = request.params;

      try {
        await projectShareService.deleteShare(shareId, userId);
        return { success: true, message: 'Share deleted successfully' };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete share';
        fastify.log.error({ err: error }, 'Delete share error');
        return reply.status(error instanceof Error && error.message.includes('not found') ? 404 : 403).send({
          success: false,
          error: message,
        });
      }
    }
  );
}

