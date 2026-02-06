# 🚀 Руководство по масштабированию до 16000 запросов/день и 50 одновременных запросов

## 📊 Требования к производительности

- **16000 запросов в день** = ~667 запросов/час = ~11 запросов/минуту
- **50 одновременных запросов** = нужна поддержка параллельной обработки

---

## 1. Оптимизация базы данных

### 1.1. Индексы для ускорения запросов

**Добавьте индексы в Prisma schema:**

```prisma
// prisma/schema.prisma

model User {
  // ... существующие поля
  @@index([telegramId, isSubscribed]) // Составной индекс для быстрой проверки подписки
  @@index([createdAt]) // Для сортировки
}

model Generation {
  // ... существующие поля
  @@index([userId, createdAt]) // Составной индекс для истории генераций
  @@index([userId, status, createdAt]) // Для подсчёта генераций за день
  @@index([createdAt]) // Для очистки старых данных
}

model HistoricalPerson {
  // ... существующие поля
  @@index([name, era]) // Для поиска
  @@fulltext([name, description]) // Полнотекстовый поиск (если поддерживается)
}
```

**Применить изменения:**
```bash
npx prisma db push
# или
npx prisma migrate dev --name add_performance_indexes
```

### 1.2. Connection Pooling

**Настройка Prisma для множественных подключений:**

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Настройка connection pool для Railway PostgreSQL
// Добавьте в DATABASE_URL параметры:
// ?connection_limit=20&pool_timeout=20
```

**Обновите DATABASE_URL в Railway:**
```
postgresql://user:pass@host:port/db?connection_limit=20&pool_timeout=20
```

---

## 2. Кэширование

### 2.1. Кэширование результатов поиска

**Создайте утилиту для кэширования:**

```typescript
// lib/cache.ts
import { prisma } from './db';

// In-memory кэш (для production используйте Redis)
const cache = new Map<string, { data: any; expires: number }>();

const CACHE_TTL = {
  personSearch: 60 * 60 * 1000, // 1 час
  personInfo: 24 * 60 * 60 * 1000, // 24 часа
  generationLimit: 60 * 1000, // 1 минута
};

export async function getCachedPerson(name: string) {
  const key = `person:${name.toLowerCase()}`;
  const cached = cache.get(key);
  
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  
  // Если нет в кэше, ищем в БД
  const person = await prisma.historicalPerson.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  });
  
  if (person) {
    cache.set(key, {
      data: person,
      expires: Date.now() + CACHE_TTL.personInfo,
    });
  }
  
  return person;
}

export function clearCache(pattern?: string) {
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
```

### 2.2. Кэширование лимита генераций

```typescript
// В app/api/generations/limit/route.ts
import { getCachedGenerationLimit } from '@/lib/cache';

export async function GET(request: NextRequest) {
  // ... проверка авторизации
  
  const cacheKey = `limit:${dbUser.id}`;
  const cached = await getCachedGenerationLimit(cacheKey);
  
  if (cached) {
    return NextResponse.json(cached);
  }
  
  // Вычисляем лимит...
  const result = { limit: 15, used, remaining, isLimitReached };
  
  // Сохраняем в кэш на 1 минуту
  await setCachedGenerationLimit(cacheKey, result, 60000);
  
  return NextResponse.json(result);
}
```

---

## 3. Оптимизация API endpoints

### 3.1. Асинхронная обработка генераций

**Для тяжёлых операций используйте очередь:**

```typescript
// lib/queue.ts
interface GenerationJob {
  userId: string;
  personName: string;
  style: string;
}

const generationQueue: GenerationJob[] = [];
let processing = false;

export async function addToQueue(job: GenerationJob) {
  generationQueue.push(job);
  processQueue();
}

async function processQueue() {
  if (processing || generationQueue.length === 0) return;
  
  processing = true;
  const job = generationQueue.shift();
  
  if (job) {
    try {
      // Обработка генерации...
      await processGeneration(job);
    } catch (error) {
      console.error('Generation failed:', error);
    }
  }
  
  processing = false;
  if (generationQueue.length > 0) {
    setTimeout(processQueue, 1000); // Обрабатываем следующую через 1 сек
  }
}
```

### 3.2. Оптимизация запросов к БД

**Используйте batch операции:**

```typescript
// Вместо множественных запросов
const todayGenerations = await prisma.generation.count({
  where: {
    userId: dbUser.id,
    status: 'completed',
    createdAt: { gte: today },
  },
});

// Используйте один запрос с агрегацией
const stats = await prisma.generation.groupBy({
  by: ['userId'],
  where: {
    userId: dbUser.id,
    createdAt: { gte: today },
  },
  _count: { id: true },
});
```

---

## 4. Настройка Railway для масштабирования

### 4.1. Горизонтальное масштабирование

**В Railway Dashboard:**

1. Откройте ваш сервис
2. Перейдите в **Settings → Scaling**
3. Настройте:
   - **Min instances:** 1
   - **Max instances:** 3-5 (для 50 одновременных запросов)
   - **CPU:** 2 GB (рекомендуется)
   - **RAM:** 2 GB (рекомендуется)

### 4.2. Переменные окружения для оптимизации

**Добавьте в Railway Variables:**

```env
# Node.js оптимизации
NODE_OPTIONS=--max-old-space-size=2048
NODE_ENV=production

# Prisma оптимизации
PRISMA_CLIENT_ENGINE_TYPE=binary

# Connection pool
DATABASE_POOL_SIZE=20
DATABASE_POOL_TIMEOUT=20
```

### 4.3. Health Check

**Создайте endpoint для проверки здоровья:**

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Проверка подключения к БД
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Database connection failed' },
      { status: 503 }
    );
  }
}
```

**Настройте в Railway:**
- Health Check Path: `/api/health`
- Health Check Interval: 30 seconds

---

## 5. Оптимизация Next.js

### 5.1. Настройка next.config.js

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Оптимизации для production
  compress: true,
  poweredByHeader: false,
  
  // Кэширование
  experimental: {
    optimizeCss: true,
  },
  
  // Оптимизация изображений
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Увеличение лимитов
  serverRuntimeConfig: {
    maxDuration: 300, // 5 минут для генерации
  },
};
```

### 5.2. Оптимизация API Routes

**Используйте streaming для долгих операций:**

```typescript
// app/api/generate/route.ts
export async function POST(request: NextRequest) {
  // ... валидация
  
  // Создаём генерацию со статусом 'processing'
  const generation = await prisma.generation.create({
    data: {
      userId: dbUser.id,
      personName: personInfo.name,
      status: 'processing',
      // ...
    },
  });
  
  // Возвращаем сразу, обработку делаем асинхронно
  processGenerationAsync(generation.id, personInfo, style);
  
  return NextResponse.json({
    success: true,
    generationId: generation.id,
    status: 'processing',
    message: 'Generation started, check status later',
  });
}
```

---

## 6. Мониторинг и метрики

### 6.1. Логирование производительности

```typescript
// lib/performance.ts
export function logPerformance(endpoint: string, duration: number) {
  if (duration > 1000) { // Логируем только медленные запросы
    console.warn(`[Performance] ${endpoint} took ${duration}ms`);
  }
}

// Использование
const start = Date.now();
// ... обработка запроса
logPerformance('/api/generate', Date.now() - start);
```

### 6.2. Метрики Railway

**Мониторьте в Railway Dashboard:**
- CPU Usage
- Memory Usage
- Request Rate
- Error Rate
- Response Time

---

## 7. Оптимизация внешних API вызовов

### 7.1. Кэширование результатов Perplexity

```typescript
// lib/ai/perplexity.ts
import { getCachedPerson, setCachedPerson } from '@/lib/cache';

export async function searchHistoricalPerson(personName: string) {
  // Сначала проверяем кэш
  const cached = await getCachedPerson(personName);
  if (cached) {
    return cached;
  }
  
  // Если нет в кэше, делаем запрос
  const result = await searchViaPerplexity(personName);
  
  // Сохраняем в кэш на 24 часа
  await setCachedPerson(personName, result, 24 * 60 * 60 * 1000);
  
  return result;
}
```

### 7.2. Retry механизм для внешних API

```typescript
// lib/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## 8. Чек-лист для внедрения

### Высокий приоритет (сделать сразу):

- [ ] **Добавить индексы в БД** (пункт 1.1)
- [ ] **Настроить connection pooling** (пункт 1.2)
- [ ] **Увеличить ресурсы Railway** (CPU: 2GB, RAM: 2GB)
- [ ] **Настроить горизонтальное масштабирование** (3-5 инстансов)
- [ ] **Добавить кэширование лимита генераций** (пункт 2.2)

### Средний приоритет (в течение недели):

- [ ] **Кэширование результатов поиска** (пункт 2.1)
- [ ] **Оптимизировать запросы к БД** (пункт 3.2)
- [ ] **Добавить health check endpoint** (пункт 4.3)
- [ ] **Настроить мониторинг** (пункт 6)

### Низкий приоритет (оптимизация):

- [ ] **Асинхронная обработка генераций** (пункт 3.1)
- [ ] **Retry механизм для внешних API** (пункт 7.2)
- [ ] **Streaming для долгих операций** (пункт 5.2)

---

## 9. Оценка стоимости

### Railway:
- **Starter Plan:** $5/месяц (1 инстанс, 512MB RAM)
- **Developer Plan:** $20/месяц (до 5 инстансов, 2GB RAM каждый)
- **Для 50 одновременных запросов:** рекомендуется Developer Plan

### PostgreSQL:
- Railway PostgreSQL: включён в план
- Или внешний (Supabase, Neon): бесплатный tier обычно достаточен

### Внешние API:
- **Perplexity:** ~$0.001 за запрос = $16/день для 16000 запросов
- **OpenAI:** ~$0.01 за промпт = $160/день
- **Replicate:** ~$0.01 за изображение = $160/день

**Итого:** ~$336/день на API + $20/месяц на инфраструктуру

---

## 10. Быстрый старт (MVP)

**Минимальные изменения для поддержки нагрузки:**

1. **Добавьте индексы в БД:**
```bash
npx prisma db push
```

2. **Обновите Railway настройки:**
   - CPU: 2GB
   - RAM: 2GB
   - Instances: 3

3. **Добавьте кэширование лимита:**
   - Используйте простой in-memory кэш (уже добавлен в код)

4. **Мониторьте метрики:**
   - Следите за CPU/Memory в Railway Dashboard
   - Проверяйте время ответа API

Эти изменения позволят обрабатывать до 16000 запросов/день и 50 одновременных запросов.
