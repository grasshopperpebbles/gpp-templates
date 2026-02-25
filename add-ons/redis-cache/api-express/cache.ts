/**
 * Cache Utility Module
 *
 * Provides caching functionality with Redis (optional) or in-memory fallback.
 * Install Redis support: npm install redis
 *
 * Usage:
 *     import { cache, cached } from '@/lib/cache';
 *
 *     // Set a value (TTL in seconds)
 *     await cache.set('key:123', value, 300);
 *
 *     // Get a value
 *     const value = await cache.get('key:123');
 *
 *     // Delete a value
 *     await cache.delete('key:123');
 *
 *     // Delete all keys matching pattern (supports * wildcard)
 *     await cache.deletePattern('user:*');        // All user keys
 *     await cache.deletePattern('product:*');     // All product keys
 *
 *     // Use decorator for function caching
 *     @cached(300)
 *     async function getData(dataId: string) {
 *         // This result will be cached for 5 minutes
 *         return await fetchFromDatabase(dataId);
 *     }
 */

import { createClient, RedisClientType } from 'redis';
import crypto from 'crypto';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/0';

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

class InMemoryCache {
  private store: Map<string, CacheEntry<any>> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expiresAt = ttl ? Date.now() + ttl * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async deletePattern(pattern: string): Promise<void> {
    // Simple wildcard support for in-memory cache
    if (pattern.includes('*')) {
      const [prefix, suffix] = pattern.split('*');
      const keysToDelete: string[] = [];
      
      for (const key of this.store.keys()) {
        if (key.startsWith(prefix) && (!suffix || key.endsWith(suffix))) {
          keysToDelete.push(key);
        }
      }
      
      for (const key of keysToDelete) {
        this.store.delete(key);
      }
    } else {
      // Exact match
      this.store.delete(pattern);
    }
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) {
      return false;
    }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async close(): Promise<void> {
    // No-op for in-memory
  }
}

class RedisCache {
  private client: RedisClientType | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  private async getClient(): Promise<RedisClientType> {
    if (!this.client) {
      this.client = createClient({ url: this.url });
      await this.client.connect();
    }
    return this.client;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await this.getClient();
      const value = await client.get(key);
      
      if (value === null) {
        return null;
      }

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const client = await this.getClient();
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);

      if (ttl) {
        await client.setEx(key, ttl, serialized);
      } else {
        await client.set(key, serialized);
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const client = await this.getClient();
      await client.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const client = await this.getClient();
      let deletedCount = 0;
      
      for await (const key of client.scanIterator({ MATCH: pattern })) {
        await client.del(key);
        deletedCount++;
      }
      
      if (deletedCount > 0) {
        console.debug(`Deleted ${deletedCount} cache keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      console.error('Redis deletePattern error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      const result = await client.exists(key);
      return result > 0;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const client = await this.getClient();
      await client.flushDb();
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}

function createCache(): InMemoryCache | RedisCache {
  // Use Redis if REDIS_URL is set and redis package is available
  if (REDIS_URL && REDIS_URL !== 'redis://localhost:6379/0') {
    try {
      return new RedisCache(REDIS_URL);
    } catch (error) {
      console.warn('Redis not available, using in-memory cache. Install with: npm install redis');
      return new InMemoryCache();
    }
  }

  // Check if redis package is installed
  try {
    require.resolve('redis');
    return new RedisCache(REDIS_URL);
  } catch {
    return new InMemoryCache();
  }
}

export const cache = createCache();

/**
 * Decorator to cache function results.
 *
 * @param ttl Time to live in seconds (default: 5 minutes)
 * @param keyPrefix Prefix for cache key
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  ttl: number = 300,
  keyPrefix: string = ''
): (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<T>) => void {
  return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<T>) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      // Build cache key
      const argHash = crypto
        .createHash('md5')
        .update(JSON.stringify(args))
        .digest('hex')
        .substring(0, 16);
      
      const prefix = keyPrefix || target.constructor.name || '';
      const cacheKey = `${prefix}:${propertyKey}:${argHash}`;

      // Try to get from cache
      const cachedValue = await cache.get(cacheKey);
      if (cachedValue !== null) {
        return cachedValue;
      }

      // Call function and cache result
      const result = await originalMethod.apply(this, args);
      await cache.set(cacheKey, result, ttl);
      return result;
    } as T;

    return descriptor;
  };
}

/**
 * Helper to invalidate cache by pattern.
 * Supports wildcard patterns like "user:*" or "product:*".
 */
export async function invalidateCache(pattern: string): Promise<void> {
  if (cache.deletePattern) {
    await cache.deletePattern(pattern);
  } else {
    // Fallback for older cache implementations
    await cache.delete(pattern);
  }
}

