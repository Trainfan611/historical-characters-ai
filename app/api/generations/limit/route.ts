import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getCache, setCache } from '@/lib/cache-simple';

const DAILY_LIMIT = 15;
const CACHE_TTL = 60 * 1000; // 1 минута

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { telegramId: (session.user as any).telegramId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Проверяем кэш
    const cacheKey = `limit:${dbUser.id}`;
    const cached = getCache<{ used: number; remaining: number; isLimitReached: boolean }>(cacheKey);
    
    if (cached) {
      return NextResponse.json({
        limit: DAILY_LIMIT,
        used: cached.used,
        remaining: cached.remaining,
        isLimitReached: cached.isLimitReached,
        cached: true,
      });
    }
    
    // Получаем начало сегодняшнего дня (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    // Считаем генерации за сегодня (оптимизированный запрос)
    const todayGenerations = await prisma.generation.count({
      where: {
        userId: dbUser.id,
        status: 'completed',
        createdAt: {
          gte: today,
        },
      },
    });

    const remaining = Math.max(0, DAILY_LIMIT - todayGenerations);
    const used = todayGenerations;
    const isLimitReached = todayGenerations >= DAILY_LIMIT;
    
    // Сохраняем в кэш
    setCache(cacheKey, { used, remaining, isLimitReached }, CACHE_TTL);

    return NextResponse.json({
      limit: DAILY_LIMIT,
      used,
      remaining,
      isLimitReached: todayGenerations >= DAILY_LIMIT,
    });
  } catch (error) {
    console.error('Error getting generation limit:', error);
    return NextResponse.json(
      { error: 'Failed to get generation limit' },
      { status: 500 }
    );
  }
}
