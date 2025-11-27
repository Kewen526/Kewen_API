import redisClient from '../config/redis';
import config from '../config/env';
import logger from '../utils/logger';

export class CacheService {
  private static prefix = 'kewen_api:';

  static async get<T>(key: string): Promise<T | null> {
    if (!config.cache.enabled) {
      return null;
    }

    try {
      const value = await redisClient.get(this.getKey(key));
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key: string, value: any, ttl: number = config.cache.ttl): Promise<void> {
    if (!config.cache.enabled) {
      return;
    }

    try {
      await redisClient.setEx(this.getKey(key), ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  static async delete(key: string): Promise<void> {
    if (!config.cache.enabled) {
      return;
    }

    try {
      await redisClient.del(this.getKey(key));
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  static async deletePattern(pattern: string): Promise<void> {
    if (!config.cache.enabled) {
      return;
    }

    try {
      const keys = await redisClient.keys(this.getKey(pattern));
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
    }
  }

  static async exists(key: string): Promise<boolean> {
    if (!config.cache.enabled) {
      return false;
    }

    try {
      const result = await redisClient.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  static async clear(): Promise<void> {
    if (!config.cache.enabled) {
      return;
    }

    try {
      const keys = await redisClient.keys(`${this.prefix}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  private static getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  static generateCacheKey(apiId: string, params: any): string {
    const paramString = JSON.stringify(params);
    return `api:${apiId}:${Buffer.from(paramString).toString('base64')}`;
  }
}
