import { createClient, RedisClientType } from 'redis';
import { config } from './index.js';

let client: RedisClientType | null = null;
let isConnected = false;
let initAttempted = false;

const REDIS_ENABLED = !!(config.redis?.host && config.redis?.port);

export async function initializeRedis(): Promise<void> {
  if (!REDIS_ENABLED) {
    console.log('Redis未配置，跳过连接');
    return;
  }

  if (initAttempted && !isConnected) {
    return;
  }

  initAttempted = true;

  try {
    client = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            return false;
          }
          return Math.min(retries * 500, 5000);
        },
      },
      password: config.redis.password || undefined,
    });

    client.on('error', () => {});
    client.on('connect', () => {
      isConnected = true;
    });

    await client.connect();
  } catch (error) {
    console.log('Redis连接失败，使用内存缓存');
    client = null;
  }
}

export async function getRedisClient(): Promise<RedisClientType | null> {
  if (!REDIS_ENABLED || !client) {
    return null;
  }
  if (!isConnected) {
    await initializeRedis();
  }
  return client;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const c = await getRedisClient();
    if (!c) return null;
    const value = await c.get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<void> {
  try {
    const c = await getRedisClient();
    if (!c) return;
    if (ttlSeconds) {
      await c.setEx(key, ttlSeconds, JSON.stringify(value));
    } else {
      await c.set(key, JSON.stringify(value));
    }
  } catch {}
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const c = await getRedisClient();
    if (!c) return;
    await c.del(key);
  } catch {}
}

export async function cacheIncr(key: string): Promise<number> {
  try {
    const c = await getRedisClient();
    if (!c) return 0;
    return await c.incr(key);
  } catch {
    return 0;
  }
}

export async function cacheExpire(key: string, seconds: number): Promise<void> {
  try {
    const c = await getRedisClient();
    if (!c) return;
    await c.expire(key, seconds);
  } catch {}
}

export async function closeRedis(): Promise<void> {
  if (client && client.isOpen) {
    await client.quit();
  }
}

export { client as redis };
