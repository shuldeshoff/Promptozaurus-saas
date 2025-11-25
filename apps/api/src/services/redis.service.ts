import { createClient, RedisClientType } from 'redis';

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      console.warn('Redis not connected, skipping GET');
      return null;
    }
    return await this.client.get(key);
  }

  async set(key: string, value: string, expirationInSeconds?: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      console.warn('Redis not connected, skipping SET');
      return;
    }
    if (expirationInSeconds) {
      await this.client.setEx(key, expirationInSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      console.warn('Redis not connected, skipping DEL');
      return;
    }
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }
    const result = await this.client.exists(key);
    return result === 1;
  }

  isReady(): boolean {
    return this.isConnected;
  }
}

export const redisService = new RedisService();

