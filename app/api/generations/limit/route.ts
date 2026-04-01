import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getCache, setCache } from '@/lib/cache-simple';
import { getUserSafe } from '@/lib/user-safe';
import { getDailyLimitForUser, getSalesContact, getUserPlan } from '@/lib/subscription';

const CACHE_TTL = 60 * 1000; // 1 минута

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await getUserSafe((session.user as any).telegramId);

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Проверяем кэш
    const userTelegramId = (session.user as any).telegramId as string | undefined;
    const plan = getUserPlan(userTelegramId, dbUser.isSubscribed);
    const dailyLimit = getDailyLimitForUser(userTelegramId, dbUser.isSubscribed);
    const cacheKey = `limit:${dbUser.id}:${plan?.id || 'none'}`;
    const cached = getCache<{ used: number; remaining: number; isLimitReached: boolean }>(cacheKey);
    
    if (cached) {
      return NextResponse.json({
        limit: dailyLimit,
        used: cached.used,
        remaining: cached.remaining,
        isLimitReached: cached.isLimitReached,
        plan: plan?.id || null,
        planName: plan?.name || null,
        priceRubPerMonth: plan?.priceRubPerMonth || null,
        contactForCustom: getSalesContact(),
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

    const remaining = Math.max(0, dailyLimit - todayGenerations);
    const used = todayGenerations;
    const isLimitReached = todayGenerations >= dailyLimit;
    
    // Сохраняем в кэш
    setCache(cacheKey, { used, remaining, isLimitReached }, CACHE_TTL);

    return NextResponse.json({
      limit: dailyLimit,
      used,
      remaining,
      isLimitReached,
      plan: plan?.id || null,
      planName: plan?.name || null,
      priceRubPerMonth: plan?.priceRubPerMonth || null,
      contactForCustom: getSalesContact(),
    });
  } catch (error) {
    console.error('Error getting generation limit:', error);
    return NextResponse.json(
      { error: 'Failed to get generation limit' },
      { status: 500 }
    );
  }
}
