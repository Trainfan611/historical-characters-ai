/**
 * Простой in-memory кэш для быстрого доступа
 * Для production рекомендуется использовать Redis
 */

interface CacheEntry<T> {
  data: T;
  expires: number;
}

const cache = new Map<string, CacheEntry<any>>();

// Очистка истёкших записей каждые 5 минут
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expires < now) {
      cache.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Получить данные из кэша
 */
export function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (entry.expires < Date.now()) {
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

/**
 * Сохранить данные в кэш
 */
export function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, {
    data,
    expires: Date.now() + ttlMs,
  });
}

/**
 * Удалить данные из кэша
 */
export function deleteCache(key: string): void {
  cache.delete(key);
}

/**
 * Очистить весь кэш или по паттерну
 */
export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Получить статистику кэша
 */
export function getCacheStats() {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;
  
  for (const entry of cache.values()) {
    if (entry.expires > now) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  }
  
  return {
    total: cache.size,
    valid: validEntries,
    expired: expiredEntries,
  };
}
