import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/stats
 * Получает общую статистику для админ-панели
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
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Вычисляем дату начала периода
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setUTCHours(0, 0, 0, 0);

    // Общая статистика
    const [
      totalUsers,
      subscribedUsers,
      totalGenerations,
      successfulGenerations,
      failedGenerations,
      recentUsers,
      recentGenerations,
    ] = await Promise.all([
      // Всего пользователей
      prisma.user.count(),
      
      // Подписанных пользователей
      prisma.user.count({
        where: { isSubscribed: true },
      }),
      
      // Всего генераций
      prisma.generation.count(),
      
      // Успешных генераций
      prisma.generation.count({
        where: { status: 'completed' },
      }),
      
      // Неудачных генераций
      prisma.generation.count({
        where: { status: 'failed' },
      }),
      
      // Новых пользователей за период
      prisma.user.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      
      // Генераций за период
      prisma.generation.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
    ]);

    // Статистика по дням (последние N дней)
    const dailyStats = await getDailyStats(days);

    // Топ пользователей по генерациям
    const topUsers = await prisma.generation.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: startDate,
        },
        status: 'completed',
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Получаем данные пользователей для топа
    const topUsersWithData = await Promise.all(
      topUsers.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.userId },
          select: {
            id: true,
            telegramId: true,
            username: true,
            firstName: true,
            lastName: true,
            isSubscribed: true,
            createdAt: true,
          },
        });
        return {
          user,
          generationCount: item._count.id,
        };
      })
    );

    // Топ исторических личностей
    const topPersons = await prisma.generation.groupBy({
      by: ['personName'],
      where: {
        createdAt: {
          gte: startDate,
        },
        status: 'completed',
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        subscribedUsers,
        unsubscribedUsers: totalUsers - subscribedUsers,
        subscriptionRate: totalUsers > 0 ? (subscribedUsers / totalUsers) * 100 : 0,
        totalGenerations,
        successfulGenerations,
        failedGenerations,
        successRate: totalGenerations > 0 ? (successfulGenerations / totalGenerations) * 100 : 0,
      },
      period: {
        days,
        startDate,
        recentUsers,
        recentGenerations,
      },
      dailyStats,
      topUsers: topUsersWithData.filter(item => item.user !== null),
      topPersons: topPersons.map(item => ({
        personName: item.personName,
        count: item._count.id,
      })),
    });
  } catch (error: any) {
    console.error('[Admin Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Получает статистику по дням
 */
async function getDailyStats(days: number) {
  const stats: Array<{
    date: string;
    users: number;
    generations: number;
    successfulGenerations: number;
    failedGenerations: number;
  }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setUTCHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const [users, generations, successful, failed] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      }),
      prisma.generation.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      }),
      prisma.generation.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
          status: 'completed',
        },
      }),
      prisma.generation.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
          status: 'failed',
        },
      }),
    ]);

    stats.push({
      date: date.toISOString().split('T')[0],
      users,
      generations,
      successfulGenerations: successful,
      failedGenerations: failed,
    });
  }

  return stats;
}
