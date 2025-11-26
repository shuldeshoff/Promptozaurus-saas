import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.middleware.js';
import { userService } from '../services/user.service.js';

interface UpdateProfileBody {
  name?: string;
  language?: 'en' | 'ru';
  theme?: 'dark' | 'light';
}

export async function userRoutes(fastify: FastifyInstance) {
  // Get user profile
  fastify.get(
    '/api/user/profile',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = request.user as { userId: string };
        const user = await userService.findById(userId);

        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        // Get project count
        const projectCount = await userService.getProjectCount(userId);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          language: user.language,
          theme: user.theme,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          projectCount,
          projectLimit: 10, // Free plan
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        fastify.log.error({ error: errorMessage }, 'Get profile error');
        return reply.code(500).send({ error: 'Failed to get profile' });
      }
    }
  );

  // Update user profile
  fastify.patch<{ Body: UpdateProfileBody }>(
    '/api/user/profile',
    { preHandler: authenticate },
    async (
      request,
      reply
    ) => {
      try {
        const { userId } = request.user as { userId: string };
        const { name, language, theme } = request.body;

        const updatedUser = await userService.updateProfile(userId, {
          name,
          language,
          theme,
        });

        return {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          avatarUrl: updatedUser.avatarUrl,
          language: updatedUser.language,
          theme: updatedUser.theme,
          updatedAt: updatedUser.updatedAt,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        fastify.log.error({ error: errorMessage }, 'Update profile error');
        return reply.code(500).send({ error: 'Failed to update profile' });
      }
    }
  );
}

