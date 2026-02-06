/**
 * Простой in-memory rate limiter для быстрой защиты
 * Для production рекомендуется использовать Redis (@upstash/ratelimit)
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Очистка старых записей каждые 5 минут
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Окно времени в миллисекундах
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Простой rate limiter
 * @param identifier - Уникальный идентификатор (IP, userId, etc.)
 * @param config - Конфигурация лимита
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = identifier;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Если записи нет или окно истекло, создаём новую
  if (!record || record.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  // Если лимит превышен
  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  // Увеличиваем счётчик
  record.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Предустановленные конфигурации для разных endpoints
 */
export const rateLimitConfigs = {
  // Генерация изображений - очень строгий лимит
  generate: {
    maxRequests: 15,
    windowMs: 24 * 60 * 60 * 1000, // 24 часа
  },
  
  // Поиск личностей
  search: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 час
  },
  
  // Проверка подписки
  subscription: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 минута
  },
  
  // Общие API запросы
  api: {
    maxRequests: 200,
    windowMs: 60 * 1000, // 1 минута
  },
};
