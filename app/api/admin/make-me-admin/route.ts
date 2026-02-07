import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getUserSafe } from '@/lib/user-safe';

/**
 * POST /api/admin/make-me-admin
 * Временный endpoint для назначения текущего пользователя админом
 * Используйте этот endpoint один раз, чтобы назначить себя админом
 * После использования рекомендуется удалить этот файл или защитить его секретным ключом
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const telegramId = (session.user as any).telegramId;
    if (!telegramId) {
      return NextResponse.json({ error: 'Telegram ID not found' }, { status: 400 });
    }

    // Находим пользователя
    const user = await getUserSafe(telegramId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Назначаем админом через raw query (на случай если колонка еще не создана)
    try {
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;
      `;
    } catch (e) {
      // Игнорируем ошибку, если колонка уже существует
    }

    try {
      const updated = await prisma.user.update({
        where: { telegramId },
        data: { isAdmin: true },
      });
      
      console.log(`[Admin] User ${telegramId} (${updated.firstName || updated.username}) is now admin`);

      return NextResponse.json({
        success: true,
        message: 'Вы теперь админ!',
        user: {
          telegramId: updated.telegramId,
          username: updated.username,
          firstName: updated.firstName,
          isAdmin: updated.isAdmin,
        },
      });
    } catch (updateError: any) {
      // Если update не работает, используем raw query
      if (updateError?.message?.includes('isAdmin')) {
        await prisma.$executeRaw`
          UPDATE "User" SET "isAdmin" = true WHERE "telegramId" = ${telegramId};
        `;
        
        const updatedUser = await getUserSafe(telegramId);
        
        return NextResponse.json({
          success: true,
          message: 'Вы теперь админ!',
          user: {
            telegramId: updatedUser?.telegramId,
            username: updatedUser?.username,
            firstName: updatedUser?.firstName,
            isAdmin: true,
          },
        });
      }
      throw updateError;
    }

    console.log(`[Admin] User ${telegramId} (${updated.firstName || updated.username}) is now admin`);

    return NextResponse.json({
      success: true,
      message: 'Вы теперь админ!',
      user: {
        telegramId: updated.telegramId,
        username: updated.username,
        firstName: updated.firstName,
        isAdmin: updated.isAdmin,
      },
    });
  } catch (error: any) {
    console.error('[Admin] Error making user admin:', error);
    return NextResponse.json(
      { error: 'Failed to make user admin', details: error.message },
      { status: 500 }
    );
  }
}
