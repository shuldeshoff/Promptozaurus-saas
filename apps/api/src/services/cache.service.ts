import { redisService } from './redis.service';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

class CacheService {
  private readonly DEFAULT_TTL = 3600; // 1 hour

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisService.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cache data
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const ttl = options?.ttl || this.DEFAULT_TTL;
      const serialized = JSON.stringify(value);
      await redisService.set(key, serialized, ttl);
    } catch (error) {
      console.error(`Cache SET error for key ${key}:`, error);
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<void> {
    try {
      await redisService.del(key);
    } catch (error) {
      console.error(`Cache DELETE error for key ${key}:`, error);
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      return await redisService.exists(key);
    } catch (error) {
      console.error(`Cache EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Cache AI models list (24 hours TTL)
   */
  async cacheModels(provider: string, models: unknown[]): Promise<void> {
    const key = `models:${provider}`;
    await this.set(key, models, { ttl: 86400 }); // 24 hours
  }

  /**
   * Get cached AI models list
   */
  async getCachedModels(provider: string): Promise<unknown[] | null> {
    const key = `models:${provider}`;
    return await this.get<unknown[]>(key);
  }

  /**
   * Cache user session data (7 days TTL)
   */
  async cacheSession(sessionId: string, data: unknown): Promise<void> {
    const key = `session:${sessionId}`;
    await this.set(key, data, { ttl: 604800 }); // 7 days
  }

  /**
   * Get cached session data
   */
  async getSession(sessionId: string): Promise<unknown | null> {
    const key = `session:${sessionId}`;
    return await this.get(key);
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.delete(key);
  }

  /**
   * Generate cache key for user data
   */
  getUserCacheKey(userId: string, resource: string): string {
    return `user:${userId}:${resource}`;
  }

  /**
   * Clear all cache for a user
   */
  async clearUserCache(userId: string): Promise<void> {
    // Note: In production, you might want to use SCAN with pattern matching
    // For now, we'll just clear common keys
    const keys = ['projects', 'templates', 'api_keys', 'profile'];
    for (const key of keys) {
      await this.delete(this.getUserCacheKey(userId, key));
    }
  }
}

export const cacheService = new CacheService();

