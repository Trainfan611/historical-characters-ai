import { prisma } from './db';

/**
 * Безопасно получает пользователя, игнорируя отсутствие колонки isAdmin
 * Используется до применения миграции
 */
export async function getUserSafe(telegramId: string) {
  try {
    // Пытаемся получить пользователя обычным способом
    return await prisma.user.findUnique({
      where: { telegramId },
    });
  } catch (error: any) {
    // Если колонка isAdmin не существует, получаем через raw query
    if (error?.message?.includes('isAdmin') || error?.message?.includes('does not exist')) {
      console.warn('[UserSafe] Column isAdmin does not exist. Using raw query.');
      try {
        const result = await prisma.$queryRaw<Array<{
          id: string;
          telegramId: string;
          username: string | null;
          firstName: string | null;
          lastName: string | null;
          photoUrl: string | null;
          isSubscribed: boolean;
          createdAt: Date;
          updatedAt: Date;
        }>>`
          SELECT id, "telegramId", username, "firstName", "lastName", "photoUrl", "isSubscribed", "createdAt", "updatedAt"
          FROM "User"
          WHERE "telegramId" = ${telegramId}
          LIMIT 1
        `;
        return result[0] || null;
      } catch (rawError) {
        console.error('[UserSafe] Raw query failed:', rawError);
        throw error; // Выбрасываем оригинальную ошибку
      }
    }
    throw error;
  }
}

/**
 * Безопасно получает пользователя по ID
 */
export async function getUserByIdSafe(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  } catch (error: any) {
    if (error?.message?.includes('isAdmin') || error?.message?.includes('does not exist')) {
      console.warn('[UserSafe] Column isAdmin does not exist. Using raw query.');
      try {
        const result = await prisma.$queryRaw<Array<{
          id: string;
          telegramId: string;
          username: string | null;
          firstName: string | null;
          lastName: string | null;
          photoUrl: string | null;
          isSubscribed: boolean;
          createdAt: Date;
          updatedAt: Date;
        }>>`
          SELECT id, "telegramId", username, "firstName", "lastName", "photoUrl", "isSubscribed", "createdAt", "updatedAt"
          FROM "User"
          WHERE id = ${userId}
          LIMIT 1
        `;
        return result[0] || null;
      } catch (rawError) {
        console.error('[UserSafe] Raw query failed:', rawError);
        throw error;
      }
    }
    throw error;
  }
}
