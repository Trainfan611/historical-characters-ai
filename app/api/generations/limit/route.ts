import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const DAILY_LIMIT = 15;

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

    // Получаем начало сегодняшнего дня (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    // Считаем генерации за сегодня
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
