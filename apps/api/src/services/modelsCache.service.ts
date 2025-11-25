import { prisma } from '../lib/prisma.js';
import { redisService } from './redis.service.js';
import { AIModel } from '../providers/base.provider.js';
import { AiProvider } from '@promptozaurus/shared';
import { AIProviderFactory } from '../providers/factory.js';
import { apiKeyService } from './apiKey.service.js';

const REDIS_KEY_PREFIX = 'models:';
const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

export const modelsCacheService = {
  /**
   * Get cached models for a specific provider
   */
  async getCachedModels(provider: AiProvider): Promise<AIModel[] | null> {
    try {
      // Try Redis first
      const redisKey = `${REDIS_KEY_PREFIX}${provider}`;
      const cached = await redisService.get(redisKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // Try database
      const dbCache = await prisma.modelsCache.findUnique({
        where: { provider },
      });

      if (dbCache) {
        const models = dbCache.models as AIModel[];
        
        // Update Redis cache
        await redisService.set(redisKey, JSON.stringify(models), CACHE_TTL);
        
        return models;
      }

      return null;
    } catch (error) {
      console.error(`Failed to get cached models for ${provider}:`, error);
      return null;
    }
  },

  /**
   * Update cached models for a specific provider
   */
  async updateCachedModels(provider: AiProvider, models: AIModel[]): Promise<void> {
    try {
      const redisKey = `${REDIS_KEY_PREFIX}${provider}`;
      
      // Update Redis
      await redisService.set(redisKey, JSON.stringify(models), CACHE_TTL);
      
      // Update database
      await prisma.modelsCache.upsert({
        where: { provider },
        update: {
          models: models as any,
          updatedAt: new Date(),
        },
        create: {
          provider,
          models: models as any,
        },
      });
    } catch (error) {
      console.error(`Failed to update cached models for ${provider}:`, error);
    }
  },

  /**
   * Get all models for a user (from all configured providers)
   */
  async getUserModels(userId: string): Promise<AIModel[]> {
    try {
      // Get user's API keys
      const apiKeys = await apiKeyService.getUserApiKeys(userId);
      const activeProviders = apiKeys
        .filter((key) => key.status === 'active')
        .map((key) => key.provider);

      if (activeProviders.length === 0) {
        return [];
      }

      // Get models for each active provider
      const modelsPromises = activeProviders.map((provider) =>
        this.getCachedModels(provider)
      );

      const modelsArrays = await Promise.all(modelsPromises);
      
      // Flatten and filter null values
      const allModels = modelsArrays
        .filter((models): models is AIModel[] => models !== null)
        .flat();

      return allModels;
    } catch (error) {
      console.error('Failed to get user models:', error);
      return [];
    }
  },

  /**
   * Refresh models for a specific provider
   */
  async refreshProviderModels(
    userId: string,
    provider: AiProvider
  ): Promise<AIModel[]> {
    try {
      // Get API key
      const apiKey = await apiKeyService.getDecryptedKey(userId, provider);
      
      if (!apiKey) {
        throw new Error('API key not found');
      }

      // Create provider instance
      const providerInstance = AIProviderFactory.createProvider(provider, apiKey);
      
      // Fetch models
      const models = await providerInstance.getModels();
      
      // Update cache
      await this.updateCachedModels(provider, models);
      
      return models;
    } catch (error) {
      console.error(`Failed to refresh models for ${provider}:`, error);
      throw error;
    }
  },

  /**
   * Refresh models for all user's active providers
   */
  async refreshAllUserModels(userId: string): Promise<void> {
    try {
      const apiKeys = await apiKeyService.getUserApiKeys(userId);
      const activeProviders = apiKeys
        .filter((key) => key.status === 'active')
        .map((key) => key.provider);

      await Promise.all(
        activeProviders.map((provider) =>
          this.refreshProviderModels(userId, provider).catch((error) => {
            console.error(`Failed to refresh ${provider} models:`, error);
          })
        )
      );
    } catch (error) {
      console.error('Failed to refresh all user models:', error);
    }
  },

  /**
   * Clear cache for a specific provider
   */
  async clearCache(provider: AiProvider): Promise<void> {
    try {
      const redisKey = `${REDIS_KEY_PREFIX}${provider}`;
      await redisService.del(redisKey);
    } catch (error) {
      console.error(`Failed to clear cache for ${provider}:`, error);
    }
  },
};

