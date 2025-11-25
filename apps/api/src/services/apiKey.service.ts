import { prisma } from '../lib/prisma.js';
import { encrypt, decrypt } from './encryption.service.js';
import { AiProvider } from '@promptozaurus/shared';

export const apiKeyService = {
  /**
   * Get all API keys for a user (without decrypted values)
   */
  async getUserApiKeys(userId: string) {
    const keys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        status: true,
        lastTestedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { provider: 'asc' },
    });

    return keys;
  },

  /**
   * Get a specific API key for a user (with decrypted value)
   */
  async getUserApiKey(userId: string, provider: AiProvider) {
    const key = await prisma.apiKey.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });

    if (!key) {
      return null;
    }

    return {
      ...key,
      key: decrypt(key.encryptedKey),
    };
  },

  /**
   * Create or update an API key for a user
   */
  async upsertApiKey(userId: string, provider: AiProvider, apiKey: string) {
    const encryptedKey = encrypt(apiKey);

    const key = await prisma.apiKey.upsert({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      update: {
        encryptedKey,
        status: 'not_configured',
        lastTestedAt: null,
      },
      create: {
        userId,
        provider,
        encryptedKey,
        status: 'not_configured',
      },
    });

    return key;
  },

  /**
   * Delete an API key
   */
  async deleteApiKey(userId: string, provider: AiProvider) {
    await prisma.apiKey.delete({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });
  },

  /**
   * Update API key status
   */
  async updateApiKeyStatus(
    userId: string,
    provider: AiProvider,
    status: 'not_configured' | 'active' | 'error',
    lastTestedAt?: Date
  ) {
    await prisma.apiKey.update({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      data: {
        status,
        lastTestedAt: lastTestedAt || new Date(),
      },
    });
  },

  /**
   * Get decrypted API key for internal use (e.g., making AI requests)
   */
  async getDecryptedKey(userId: string, provider: AiProvider): Promise<string | null> {
    const keyData = await this.getUserApiKey(userId, provider);
    return keyData ? keyData.key : null;
  },

  /**
   * Check if user has an active API key for a provider
   */
  async hasActiveKey(userId: string, provider: AiProvider): Promise<boolean> {
    const key = await prisma.apiKey.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      select: { status: true },
    });

    return key?.status === 'active';
  },
};

