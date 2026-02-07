import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkChannelSubscription } from '@/lib/telegram';
import { getUserSafe } from '@/lib/user-safe';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const channelId = process.env.TELEGRAM_CHANNEL_ID;
    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID not configured' }, { status: 500 });
    }

    const userId = (session.user as any).telegramId;
    if (!userId) {
      return NextResponse.json({ error: 'Telegram ID not found' }, { status: 400 });
    }

    // Проверка подписки через Telegram API
    console.log('[Subscription Check] Starting check for user:', userId, 'channel:', channelId);
    const isSubscribed = await checkChannelSubscription(userId, channelId);
    console.log('[Subscription Check] Result:', isSubscribed);

    // Обновление или создание записи в БД
    const dbUser = await getUserSafe(userId);

    if (dbUser) {
      await prisma.subscriptionCheck.upsert({
        where: {
          userId_channelId: {
            userId: dbUser.id,
            channelId,
          },
        },
        update: {
          isSubscribed,
          lastChecked: new Date(),
          checkedAt: new Date(),
        },
        create: {
          userId: dbUser.id,
          channelId,
          isSubscribed,
          lastChecked: new Date(),
          checkedAt: new Date(),
        },
      });

      // Обновление статуса подписки у пользователя
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { isSubscribed },
      });
    }

    return NextResponse.json({ 
      isSubscribed,
      needsRecheck: false,
    });
  } catch (error: any) {
    console.error('[Subscription Check] Error:', {
      error: error.message,
      stack: error.stack,
      response: error.response?.data,
    });
    return NextResponse.json(
      { 
        error: 'Failed to check subscription',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Используем безопасный метод получения пользователя
    const dbUser = await getUserSafe((session.user as any).telegramId);
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Получаем подписки отдельно
    const subscriptions = await prisma.subscriptionCheck.findMany({
      where: {
        userId: dbUser.id,
        channelId: process.env.TELEGRAM_CHANNEL_ID,
      },
      orderBy: {
        lastChecked: 'desc',
      },
      take: 1,
    });
    
    const dbUserWithSubscriptions = {
      ...dbUser,
      subscriptions,
    };

    const subscription = dbUserWithSubscriptions.subscriptions[0];
    const isSubscribed = subscription?.isSubscribed ?? false;

    // Проверяем, не устарела ли проверка (24 часа)
    const lastChecked = subscription?.lastChecked;
    const needsRecheck = !lastChecked || 
      (Date.now() - new Date(lastChecked).getTime()) > 24 * 60 * 60 * 1000;

    return NextResponse.json({
      isSubscribed,
      lastChecked: lastChecked?.toISOString(),
      needsRecheck,
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}
