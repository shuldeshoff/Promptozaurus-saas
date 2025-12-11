import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware.js';
import { AiProviderSchema } from '@promptozaurus/shared';
import {
  aiUserConfigService,
  UserAIConfig,
} from '../services/aiUserConfig.service.js';

const ModelConfigSchema = z.object({
  id: z.string().min(1),
  provider: AiProviderSchema,
  modelId: z.string().min(1),
  modelName: z.string().min(1),
  customName: z.string().min(1),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(128000),
  isDefault: z.boolean(),
});

const SettingsSchema = z.object({
  timeout: z.number().min(10000).max(600000),
  retryCount: z.number().min(0).max(10),
  streamingEnabled: z.boolean(),
  autoSave: z.boolean(),
});

const ConfigSchema = z.object({
  settings: SettingsSchema,
  models: z.array(ModelConfigSchema),
});

export const aiConfigRoutes: FastifyPluginAsync = async (fastify) => {
  // Получить конфигурацию AI пользователя
  fastify.get(
    '/ai/config',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).userId || request.user!.id;

      try {
        const config = await aiUserConfigService.getConfig(userId);

        reply.send({
          success: true,
          data: config,
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        fastify.log.error({ error: errorMessage }, 'Failed to get AI config');
        reply.status(500).send({
          success: false,
          error: 'Failed to get AI config',
        });
      }
    }
  );

  // Сохранить конфигурацию AI пользователя
  fastify.put<{
    Body: UserAIConfig;
  }>(
    '/ai/config',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).userId || request.user!.id;

      const parseResult = ConfigSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: parseResult.error.errors[0]?.message || 'Invalid config payload',
        });
      }

      try {
        await aiUserConfigService.saveConfig(userId, parseResult.data as UserAIConfig);

        reply.send({
          success: true,
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        fastify.log.error({ error: errorMessage }, 'Failed to save AI config');
        reply.status(500).send({
          success: false,
          error: 'Failed to save AI config',
        });
      }
    }
  );
};


