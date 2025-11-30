import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware.js';
import { apiKeyService } from '../services/apiKey.service.js';
import { AiProviderSchema } from '@promptozaurus/shared';
import { AIProviderFactory } from '../providers/factory.js';

// Request schemas
const UpsertApiKeySchema = z.object({
  apiKey: z.string().min(1, 'API key cannot be empty'),
});

export const apiKeyRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all API keys status
  fastify.get(
    '/user/api-keys',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).userId || request.user!.id;

      const keys = await apiKeyService.getUserApiKeys(userId);

      reply.send({
        success: true,
        data: keys,
      });
    }
  );

  // Add or update API key
  fastify.post<{
    Params: { provider: string };
    Body: z.infer<typeof UpsertApiKeySchema>;
  }>(
    '/user/api-keys/:provider',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).userId || request.user!.id;
      const { provider } = request.params;
      const { apiKey } = request.body;

      // Validate provider
      const providerResult = AiProviderSchema.safeParse(provider);
      if (!providerResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid provider',
        });
      }

      // Validate body
      const bodyResult = UpsertApiKeySchema.safeParse(request.body);
      if (!bodyResult.success) {
        return reply.status(400).send({
          success: false,
          error: bodyResult.error.errors[0].message,
        });
      }

      try {
        const key = await apiKeyService.upsertApiKey(
          userId,
          providerResult.data,
          apiKey
        );

        reply.send({
          success: true,
          data: {
            id: key.id,
            provider: key.provider,
            status: key.status,
            createdAt: key.createdAt,
            updatedAt: key.updatedAt,
          },
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        fastify.log.error({ error: errorMessage }, 'Failed to upsert API key');
        reply.status(500).send({
          success: false,
          error: 'Failed to save API key',
        });
      }
    }
  );

  // Delete API key
  fastify.delete<{
    Params: { provider: string };
  }>(
    '/user/api-keys/:provider',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).userId || request.user!.id;
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
        await apiKeyService.deleteApiKey(userId, providerResult.data);

        reply.send({
          success: true,
          message: 'API key deleted',
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        fastify.log.error({ error: errorMessage }, 'Failed to delete API key');
        reply.status(500).send({
          success: false,
          error: 'Failed to delete API key',
        });
      }
    }
  );

  // Test API key connection
  fastify.post<{
    Params: { provider: string };
  }>(
    '/user/api-keys/:provider/test',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).userId || request.user!.id;
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
        // Get the API key
        const keyData = await apiKeyService.getUserApiKey(
          userId,
          providerResult.data
        );

        if (!keyData) {
          return reply.status(404).send({
            success: false,
            error: 'API key not found',
          });
        }

        // Test the API key with the provider
        try {
          const providerInstance = AIProviderFactory.createProvider(
            providerResult.data,
            keyData.key
          );

          const isValid = await providerInstance.testConnection();

          if (!isValid) {
            throw new Error('Connection test failed');
          }

          // Mark as active
          await apiKeyService.updateApiKeyStatus(
            userId,
            providerResult.data,
            'active',
            new Date()
          );

          reply.send({
            success: true,
            data: {
              provider: providerResult.data,
              status: 'active',
              message: 'API key is valid',
            },
          });
        } catch (testError) {
          // Update status to error
          await apiKeyService.updateApiKeyStatus(
            userId,
            providerResult.data,
            'error'
          );

          const errorMessage = testError instanceof Error ? testError.message : 'Connection test failed';
          fastify.log.warn({ error: errorMessage }, `API key test failed for ${providerResult.data}`);

          return reply.status(400).send({
            success: false,
            error: `API key test failed: ${errorMessage}`,
          });
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        fastify.log.error({ error: errorMessage }, 'Failed to test API key');

        reply.status(500).send({
          success: false,
          error: 'Failed to test API key',
        });
      }
    }
  );
};

