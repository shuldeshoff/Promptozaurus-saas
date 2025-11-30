import { redisService } from './redis.service.js';
import { AiProvider } from '@promptozaurus/shared';

const REDIS_KEY_PREFIX = 'ai:user-config:';

export interface UserAISettings {
  timeout: number;
  retryCount: number;
  streamingEnabled: boolean;
  autoSave: boolean;
}

export interface UserAIModelConfig {
  id: string;
  provider: AiProvider;
  modelId: string;
  modelName: string;
  customName: string;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
}

export interface UserAIConfig {
  settings: UserAISettings;
  models: UserAIModelConfig[];
}

const DEFAULT_SETTINGS: UserAISettings = {
  timeout: 60000,
  retryCount: 3,
  streamingEnabled: true,
  autoSave: true,
};

export const aiUserConfigService = {
  /**
   * Получить конфигурацию пользователя из Redis
   */
  async getConfig(userId: string): Promise<UserAIConfig> {
    const key = `${REDIS_KEY_PREFIX}${userId}`;

    try {
      const raw = await redisService.get(key);
      if (!raw) {
        return {
          settings: { ...DEFAULT_SETTINGS },
          models: [],
        };
      }

      const parsed = JSON.parse(raw) as Partial<UserAIConfig>;

      return {
        settings: {
          ...DEFAULT_SETTINGS,
          ...(parsed.settings || {}),
        },
        models: parsed.models || [],
      };
    } catch (error) {
      console.error('Failed to parse AI user config from Redis:', error);
      return {
        settings: { ...DEFAULT_SETTINGS },
        models: [],
      };
    }
  },

  /**
   * Сохранить конфигурацию пользователя в Redis
   */
  async saveConfig(userId: string, config: UserAIConfig): Promise<void> {
    const key = `${REDIS_KEY_PREFIX}${userId}`;

    const payload: UserAIConfig = {
      settings: {
        ...DEFAULT_SETTINGS,
        ...config.settings,
      },
      models: config.models || [],
    };

    await redisService.set(key, JSON.stringify(payload));
  },
};


