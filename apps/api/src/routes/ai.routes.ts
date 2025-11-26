import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware.js';
import { apiKeyService } from '../services/apiKey.service.js';
import { modelsCacheService } from '../services/modelsCache.service.js';
import { AIProviderFactory } from '../providers/factory.js';
import { AiProviderSchema } from '@promptozaurus/shared';

// Request schemas
const SendMessageSchema = z.object({
  provider: AiProviderSchema,
  model: z.string().min(1, 'Model is required'),
  prompt: z.string().min(1, 'Prompt is required'),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(100000).optional(),
});

export const aiRoutes: FastifyPluginAsync = async (fastify) => {
  // Get available models for user
  fastify.get(
    '/ai/models',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = request.user!.id;

      try {
        const models = await modelsCacheService.getUserModels(userId);

        reply.send({
          success: true,
          data: models,
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        fastify.log.error({ error: errorMessage }, 'Failed to get models');
        reply.status(500).send({
          success: false,
          error: 'Failed to get models',
        });
      }
    }
  );

  // Refresh models for a specific provider
  fastify.post<{
    Params: { provider: string };
  }>(
    '/ai/models/:provider/refresh',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = request.user!.id;
      const { provider } = request.params;

      // Validate provider
      const providerResult = AiProviderSchema.safeParse(provider);
      if (!providerResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid provider',
        });
      }

      try {
        const models = await modelsCacheService.refreshProviderModels(
          userId,
          providerResult.data
        );

        reply.send({
          success: true,
          data: models,
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        fastify.log.error({ error: errorMessage }, `Failed to refresh ${provider} models`);
        reply.status(500).send({
          success: false,
          error: 'Failed to refresh models',
        });
      }
    }
  );

  // Send message to AI
  fastify.post<{
    Body: z.infer<typeof SendMessageSchema>;
  }>(
    '/ai/send',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = request.user!.id;

      // Validate body
      const bodyResult = SendMessageSchema.safeParse(request.body);
      if (!bodyResult.success) {
        return reply.status(400).send({
          success: false,
          error: bodyResult.error.errors[0].message,
        });
      }

      const { provider, model, prompt, systemPrompt, temperature, maxTokens } =
        bodyResult.data;

      try {
        // Check if user has an active API key
        const hasKey = await apiKeyService.hasActiveKey(userId, provider);
        if (!hasKey) {
          return reply.status(403).send({
            success: false,
            error: `API key for ${provider} not configured or not active`,
          });
        }

        // Get API key
        const apiKey = await apiKeyService.getDecryptedKey(userId, provider);
        if (!apiKey) {
          return reply.status(403).send({
            success: false,
            error: 'API key not found',
          });
        }

        // Create provider instance
        const providerInstance = AIProviderFactory.createProvider(
          provider,
          apiKey
        );

        // Send message
        const response = await providerInstance.sendMessage({
          prompt,
          model,
          systemPrompt,
          temperature,
          maxTokens,
        });

        // Log the request
        fastify.log.info({
          userId,
          provider,
          model,
          promptLength: prompt.length,
          responseLength: response.content.length,
          usage: response.usage,
        });

        if (response.error) {
          return reply.status(500).send({
            success: false,
            error: response.error,
          });
        }

        reply.send({
          success: true,
          data: response,
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        fastify.log.error({ error: errorMessage }, 'Failed to send AI message');
        reply.status(500).send({
          success: false,
          error: 'Failed to send message to AI',
        });
      }
    }
  );
};

