import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './db';

/**
 * Проверяет, является ли текущий пользователь админом
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return false;
    }

    // Используем $queryRaw для проверки существования колонки
    // Если колонка не существует, просто возвращаем false
    try {
      const user = await prisma.user.findUnique({
        where: { telegramId: (session.user as any).telegramId },
        select: { isAdmin: true },
      });

      return user?.isAdmin || false;
    } catch (error: any) {
      // Если колонка isAdmin не существует, возвращаем false
      if (error?.message?.includes('isAdmin') || error?.message?.includes('does not exist')) {
        console.warn('[Admin] Column isAdmin does not exist yet. Please run migration.');
        return false;
      }
      throw error;
    }
  } catch (error) {
    console.error('[Admin] Error checking admin status:', error);
    return false;
  }
}

/**
 * Получает данные текущего пользователя для проверки админ-статуса
 */
export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return null;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { telegramId: (session.user as any).telegramId },
      });

      return user;
    } catch (error: any) {
      // Если колонка isAdmin не существует, все равно возвращаем пользователя
      // но без поля isAdmin
      if (error?.message?.includes('isAdmin') || error?.message?.includes('does not exist')) {
        console.warn('[Admin] Column isAdmin does not exist. Fetching user without isAdmin field.');
        // Пытаемся получить пользователя через raw query без isAdmin
        const result = await prisma.$queryRaw<Array<{ id: string; telegramId: string; username: string | null; firstName: string | null; lastName: string | null; photoUrl: string | null; isSubscribed: boolean; createdAt: Date; updatedAt: Date }>>`
          SELECT id, "telegramId", username, "firstName", "lastName", "photoUrl", "isSubscribed", "createdAt", "updatedAt"
          FROM "User"
          WHERE "telegramId" = ${(session.user as any).telegramId}
          LIMIT 1
        `;
        return result[0] || null;
      }
      throw error;
    }
  } catch (error) {
    console.error('[Admin] Error getting current user:', error);
    return null;
  }
}
