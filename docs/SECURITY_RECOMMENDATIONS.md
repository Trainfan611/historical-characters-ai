# 🛡️ Рекомендации по защите от ботов и злоупотреблений

## 1. Rate Limiting (Ограничение частоты запросов)

### 1.1. На уровне API Routes
**Рекомендация:** Использовать библиотеку `@upstash/ratelimit` или `rate-limiter-flexible`

**Преимущества:**
- Защита от DDoS атак
- Контроль нагрузки на API
- Экономия ресурсов (AI API вызовы стоят денег)

**Реализация:**
```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Лимиты для разных endpoints
export const rateLimiters = {
  // Генерация изображений - очень строгий лимит
  generate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(15, "1 d"), // 15 запросов в день
    analytics: true,
  }),
  
  // Поиск личностей - средний лимит
  search: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 h"), // 100 запросов в час
  }),
  
  // Проверка подписки - лимит на частые проверки
  subscription: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 запросов в минуту
  }),
};
```

**Использование в API:**
```typescript
// app/api/generate/route.ts
import { rateLimiters } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const identifier = session?.user?.id || request.ip || 'anonymous';
  
  const { success, limit, remaining, reset } = await rateLimiters.generate.limit(identifier);
  
  if (!success) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        retryAfter: Math.round((reset - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        }
      }
    );
  }
  
  // Продолжаем обработку...
}
```

### 1.2. На уровне Middleware
**Рекомендация:** Добавить проверку IP и User-Agent

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// Простой in-memory rate limiter для middleware
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const path = request.nextUrl.pathname;
  
  // Лимит для API endpoints
  if (path.startsWith('/api/')) {
    const key = `${ip}:${path}`;
    const now = Date.now();
    const record = requestCounts.get(key);
    
    if (record && record.resetAt > now) {
      if (record.count > 100) { // 100 запросов в минуту
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        );
      }
      record.count++;
    } else {
      requestCounts.set(key, { count: 1, resetAt: now + 60000 });
    }
  }
  
  return NextResponse.next();
}
```

---

## 2. Защита от ботов

### 2.1. CAPTCHA (reCAPTCHA v3 или hCaptcha)
**Рекомендация:** Добавить невидимую CAPTCHA для критичных действий

**Установка:**
```bash
npm install react-google-recaptcha-v3
```

**Использование:**
```typescript
// components/Captcha.tsx
'use client';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

export function CaptchaButton({ onVerify }: { onVerify: (token: string) => void }) {
  const { executeRecaptcha } = useGoogleReCaptcha();
  
  const handleClick = async () => {
    if (!executeRecaptcha) return;
    const token = await executeRecaptcha('generate_image');
    onVerify(token);
  };
  
  return <button onClick={handleClick}>Сгенерировать</button>;
}
```

**Проверка на сервере:**
```typescript
// app/api/generate/route.ts
async function verifyCaptcha(token: string): Promise<boolean> {
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
  });
  
  const data = await response.json();
  return data.success && data.score > 0.5; // score > 0.5 = не бот
}
```

### 2.2. Проверка User-Agent и заголовков
**Рекомендация:** Блокировать подозрительные запросы

```typescript
// lib/bot-detection.ts
export function isBot(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || '';
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /postman/i
  ];
  
  return botPatterns.some(pattern => pattern.test(userAgent));
}

export function hasValidHeaders(request: NextRequest): boolean {
  // Проверяем наличие стандартных браузерных заголовков
  const requiredHeaders = ['accept', 'accept-language', 'referer'];
  return requiredHeaders.every(header => request.headers.has(header));
}
```

### 2.3. Проверка поведения пользователя
**Рекомендация:** Анализировать паттерны запросов

```typescript
// lib/behavior-analysis.ts
interface RequestPattern {
  ip: string;
  userId?: string;
  requests: number[];
  suspicious: boolean;
}

const patterns = new Map<string, RequestPattern>();

export function analyzeBehavior(request: NextRequest, userId?: string): boolean {
  const ip = request.ip || 'unknown';
  const now = Date.now();
  
  let pattern = patterns.get(ip);
  if (!pattern) {
    pattern = { ip, userId, requests: [], suspicious: false };
    patterns.set(ip, pattern);
  }
  
  // Добавляем текущий запрос
  pattern.requests.push(now);
  
  // Оставляем только последние 5 минут
  pattern.requests = pattern.requests.filter(time => now - time < 300000);
  
  // Проверяем подозрительные паттерны
  if (pattern.requests.length > 50) { // > 50 запросов за 5 минут
    pattern.suspicious = true;
    return false;
  }
  
  // Проверяем равномерность запросов (боты делают запросы слишком равномерно)
  if (pattern.requests.length > 10) {
    const intervals = [];
    for (let i = 1; i < pattern.requests.length; i++) {
      intervals.push(pattern.requests[i] - pattern.requests[i-1]);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => 
      sum + Math.pow(interval - avgInterval, 2), 0
    ) / intervals.length;
    
    // Слишком низкая вариативность = бот
    if (variance < 1000) { // менее 1 секунды вариации
      pattern.suspicious = true;
      return false;
    }
  }
  
  return true;
}
```

---

## 3. Защита на уровне инфраструктуры

### 3.1. Cloudflare (рекомендуется)
**Преимущества:**
- DDoS защита
- Rate limiting
- Bot detection
- WAF (Web Application Firewall)
- Кэширование статики

**Настройка:**
1. Подключить домен к Cloudflare
2. Включить "Bot Fight Mode"
3. Настроить Rate Limiting Rules:
   - `/api/generate` - 15 запросов в день на IP
   - `/api/persons` - 100 запросов в час на IP
4. Включить WAF правила

### 3.2. Railway Protection
**Рекомендация:** Использовать встроенные возможности Railway

- Настроить переменные окружения для ограничений
- Использовать Railway Metrics для мониторинга
- Настроить автоматическое масштабирование

---

## 4. Дополнительные меры защиты

### 4.1. Валидация входных данных
**Рекомендация:** Использовать Zod для строгой валидации

```typescript
// lib/validation.ts
import { z } from 'zod';

export const generateSchema = z.object({
  personName: z.string()
    .min(2, 'Имя должно быть не менее 2 символов')
    .max(100, 'Имя слишком длинное')
    .regex(/^[a-zA-Zа-яА-ЯёЁ\s-]+$/, 'Недопустимые символы'),
  style: z.enum(['realistic', 'artistic']).optional(),
});

// В API route
const body = await request.json();
const validated = generateSchema.parse(body);
```

### 4.2. Логирование подозрительной активности
**Рекомендация:** Сохранять логи всех запросов

```typescript
// lib/audit-log.ts
export async function logRequest(request: NextRequest, userId?: string, suspicious = false) {
  await prisma.auditLog.create({
    data: {
      ip: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent'),
      path: request.nextUrl.pathname,
      method: request.method,
      userId,
      suspicious,
      timestamp: new Date(),
    },
  });
}
```

### 4.3. IP Whitelist/Blacklist
**Рекомендация:** Блокировать известные боты и разрешать только доверенные IP

```typescript
// lib/ip-filter.ts
const BLACKLIST = process.env.IP_BLACKLIST?.split(',') || [];
const WHITELIST = process.env.IP_WHITELIST?.split(',') || [];

export function isIPAllowed(ip: string): boolean {
  if (WHITELIST.length > 0 && !WHITELIST.includes(ip)) {
    return false;
  }
  if (BLACKLIST.includes(ip)) {
    return false;
  }
  return true;
}
```

### 4.4. Задержка между запросами
**Рекомендация:** Добавить минимальную задержку между генерациями

```typescript
// В API generate
const lastGeneration = await prisma.generation.findFirst({
  where: { userId: dbUser.id },
  orderBy: { createdAt: 'desc' },
});

if (lastGeneration) {
  const timeSinceLastGen = Date.now() - lastGeneration.createdAt.getTime();
  const MIN_DELAY = 5000; // 5 секунд между генерациями
  
  if (timeSinceLastGen < MIN_DELAY) {
    return NextResponse.json(
      { error: 'Please wait before generating another image' },
      { status: 429 }
    );
  }
}
```

---

## 5. Мониторинг и алерты

### 5.1. Метрики для отслеживания
- Количество запросов в минуту/час
- Количество ошибок 429 (Rate Limit)
- Количество подозрительных запросов
- Среднее время ответа API

### 5.2. Алерты
**Рекомендация:** Настроить уведомления при:
- Превышении лимита запросов
- Обнаружении бота
- Необычной активности

---

## 6. Приоритетные меры для вашего проекта

### Высокий приоритет:
1. ✅ **Rate Limiting на `/api/generate`** - уже есть (15 в день)
2. ⚠️ **Добавить Rate Limiting на другие API** - `/api/persons`, `/api/subscription/check`
3. ⚠️ **IP-based rate limiting** - защита от одного IP
4. ⚠️ **Валидация входных данных** - защита от SQL injection и XSS

### Средний приоритет:
5. ⚠️ **CAPTCHA для генерации** - дополнительная защита
6. ⚠️ **Логирование подозрительной активности**
7. ⚠️ **Cloudflare** - если бюджет позволяет

### Низкий приоритет:
8. ⚠️ **Анализ поведения пользователя**
9. ⚠️ **IP Whitelist/Blacklist**

---

## 7. Быстрая реализация (MVP)

Для быстрого внедрения рекомендую:

1. **Добавить простой rate limiter на основе Redis/In-memory**
2. **Валидация всех входных данных через Zod**
3. **Логирование всех запросов к `/api/generate`**
4. **Минимальная задержка между генерациями (5-10 секунд)**

Это даст базовую защиту без сложной инфраструктуры.
