/** src/server/config/cache.ts — Redis cache helper */

import { getRedis } from "./redis";

const PREFIX = "zincel:";

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const val = await redis.get(PREFIX + key);
    return val ? (JSON.parse(val) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.setex(PREFIX + key, ttlSeconds, JSON.stringify(value));
  } catch { /* silencioso */ }
}

export async function cacheInvalidate(...patterns: string[]): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    for (const pattern of patterns) {
      const keys = await redis.keys(PREFIX + pattern);
      if (keys.length > 0) await redis.del(...keys);
    }
  } catch { /* silencioso */ }
}

/** Invalida todas las claves de métricas e inteligencia del CRM */
export async function invalidarCacheCRM(): Promise<void> {
  await cacheInvalidate("actividad:*", "inteligencia:*", "dashboard:*");
}
