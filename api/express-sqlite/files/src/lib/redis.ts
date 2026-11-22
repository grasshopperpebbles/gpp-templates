import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient>;

export type RedisStatus = 'ok' | 'unavailable' | 'disabled';

let client: RedisClient | null = null;

/**
 * Shared Redis client, created on first use from REDIS_URL.
 * Returns null when REDIS_URL is unset or empty (Redis disabled).
 * The client reconnects in the background; commands fail fast while it is down
 * (no offline queue), so callers should treat Redis as optional.
 */
export function getRedis(): RedisClient | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;
  if (!client) {
    client = createClient({
      url,
      disableOfflineQueue: true,
      socket: {
        connectTimeout: 2000,
        reconnectStrategy: (retries) => Math.min(retries * 200, 2000),
      },
    });
    // Without a listener, a connection error would crash the process.
    client.on('error', () => {});
    client.connect().catch(() => {});
  }
  return client;
}

/** "ok", "unavailable" (set but not reachable) or "disabled" (no REDIS_URL). */
export async function redisStatus(timeoutMs = 1000): Promise<RedisStatus> {
  const redis = getRedis();
  if (!redis) return 'disabled';
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      redis.ping(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Redis ping timed out')), timeoutMs);
      }),
    ]);
    return 'ok';
  } catch {
    return 'unavailable';
  } finally {
    clearTimeout(timer);
  }
}

/** Close the client (called on shutdown). */
export async function closeRedis(): Promise<void> {
  const current = client;
  client = null;
  if (!current?.isOpen) return;
  try {
    await current.quit();
  } catch {
    // Not connected (still retrying): drop the socket and stop reconnecting.
    await current.disconnect().catch(() => {});
  }
}
