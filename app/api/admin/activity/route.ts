import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/activity
 * Получает активность пользователей (генерации по времени)
 */
export async function GET(request: NextRequest) {
  try {
    // Проверка прав админа
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Параметры запроса
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);
    const groupBy = searchParams.get('groupBy') || 'hour'; // 'hour' или 'day'

    // Вычисляем дату начала периода
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setUTCHours(0, 0, 0, 0);

    // Получаем все генерации за период
    const generations = await prisma.generation.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        id: true,
        userId: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            telegramId: true,
            username: true,
            firstName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Группируем по времени
    const activityMap = new Map<string, {
      timestamp: string;
      total: number;
      successful: number;
      failed: number;
      users: Set<string>;
    }>();

    generations.forEach((gen) => {
      const date = new Date(gen.createdAt);
      let key: string;

      if (groupBy === 'hour') {
        // Группируем по часам
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        key = `${date.getFullYear()}-${month}-${day}T${hour}:00:00`;
      } else {
        // Группируем по дням
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        key = `${date.getFullYear()}-${month}-${day}`;
      }

      if (!activityMap.has(key)) {
        activityMap.set(key, {
          timestamp: key,
          total: 0,
          successful: 0,
          failed: 0,
          users: new Set(),
        });
      }

      const activity = activityMap.get(key)!;
      activity.total++;
      if (gen.status === 'completed') {
        activity.successful++;
      } else {
        activity.failed++;
      }
      activity.users.add(gen.userId);
    });

    // Преобразуем в массив и сортируем
    const activity = Array.from(activityMap.values()).map((item) => ({
      timestamp: item.timestamp,
      total: item.total,
      successful: item.successful,
      failed: item.failed,
      uniqueUsers: item.users.size,
    }));

    activity.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    // Статистика по пользователям
    const userActivityMap = new Map<string, {
      userId: string;
      telegramId: string;
      username: string | null;
      firstName: string | null;
      totalGenerations: number;
      successfulGenerations: number;
      lastActivityAt: Date;
    }>();

    generations.forEach((gen) => {
      const userId = gen.userId;
      if (!userActivityMap.has(userId)) {
        userActivityMap.set(userId, {
          userId,
          telegramId: gen.user.telegramId,
          username: gen.user.username,
          firstName: gen.user.firstName,
          totalGenerations: 0,
          successfulGenerations: 0,
          lastActivityAt: gen.createdAt,
        });
      }

      const userActivity = userActivityMap.get(userId)!;
      userActivity.totalGenerations++;
      if (gen.status === 'completed') {
        userActivity.successfulGenerations++;
      }
      if (gen.createdAt > userActivity.lastActivityAt) {
        userActivity.lastActivityAt = gen.createdAt;
      }
    });

    const userActivity = Array.from(userActivityMap.values())
      .sort((a, b) => b.totalGenerations - a.totalGenerations)
      .slice(0, 20); // Топ 20 активных пользователей

    return NextResponse.json({
      period: {
        days,
        startDate,
        groupBy,
      },
      activity,
      topActiveUsers: userActivity,
    });
  } catch (error: any) {
    console.error('[Admin Activity] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity', details: error.message },
      { status: 500 }
    );
  }
}
