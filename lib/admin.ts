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

    const user = await prisma.user.findUnique({
      where: { telegramId: (session.user as any).telegramId },
      select: { isAdmin: true },
    });

    return user?.isAdmin || false;
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

    const user = await prisma.user.findUnique({
      where: { telegramId: (session.user as any).telegramId },
    });

    return user;
  } catch (error) {
    console.error('[Admin] Error getting current user:', error);
    return null;
  }
}
