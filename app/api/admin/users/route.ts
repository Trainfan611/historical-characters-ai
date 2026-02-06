import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/users
 * Получает список всех пользователей с их статистикой
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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search') || '';
    const subscribed = searchParams.get('subscribed');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Условия фильтрации
    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { telegramId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (subscribed === 'true') {
      where.isSubscribed = true;
    } else if (subscribed === 'false') {
      where.isSubscribed = false;
    }

    // Сортировка
    const orderBy: any = {};
    if (sortBy === 'generations') {
      // Для сортировки по количеству генераций нужен отдельный запрос
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Получаем пользователей
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          telegramId: true,
          username: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
          isSubscribed: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Получаем статистику для каждого пользователя
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [generationCount, successfulCount, lastGeneration] = await Promise.all([
          prisma.generation.count({
            where: { userId: user.id },
          }),
          prisma.generation.count({
            where: { userId: user.id, status: 'completed' },
          }),
          prisma.generation.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          }),
        ]);

        // Генерации за сегодня
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const todayGenerations = await prisma.generation.count({
          where: {
            userId: user.id,
            status: 'completed',
            createdAt: {
              gte: today,
            },
          },
        });

        return {
          ...user,
          stats: {
            totalGenerations: generationCount,
            successfulGenerations: successfulCount,
            failedGenerations: generationCount - successfulCount,
            todayGenerations,
            lastGenerationAt: lastGeneration?.createdAt || null,
          },
        };
      })
    );

    // Если сортировка по генерациям, сортируем вручную
    if (sortBy === 'generations') {
      usersWithStats.sort((a, b) => {
        const aCount = a.stats.totalGenerations;
        const bCount = b.stats.totalGenerations;
        return sortOrder === 'desc' ? bCount - aCount : aCount - bCount;
      });
    }

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[Admin Users] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}
