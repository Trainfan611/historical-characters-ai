import { prisma } from './db';

/**
 * Безопасно получает пользователя, игнорируя отсутствие колонки isAdmin
 * Используется до применения миграции
 */
export async function getUserSafe(telegramId: string) {
  try {
    // Пытаемся получить пользователя обычным способом
    const user = await prisma.user.findUnique({
      where: { telegramId },
    });
    // Убеждаемся, что isAdmin существует, если нет - добавляем false
    if (user) {
      // Проверяем, есть ли поле isAdmin в объекте
      if (!('isAdmin' in user) || user.isAdmin === undefined) {
        return { ...(user as any), isAdmin: false };
      }
    }
    return user;
  } catch (error: any) {
    // Если колонка isAdmin не существует, получаем через raw query
    if (error?.message?.includes('isAdmin') || error?.message?.includes('does not exist')) {
      console.warn('[UserSafe] Column isAdmin does not exist. Using raw query.');
      try {
        // Пытаемся добавить колонку, если её нет (только один раз)
        try {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;
          `);
          await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "User_isAdmin_idx" ON "User"("isAdmin");
          `);
          console.log('[UserSafe] Column isAdmin added successfully');
          // После добавления колонки, перегенерируем Prisma Client
          // Но для этого нужен перезапуск, поэтому пока используем raw query
        } catch (alterError: any) {
          // Игнорируем ошибки, если колонка уже существует
          if (!alterError?.message?.includes('already exists') && !alterError?.message?.includes('duplicate')) {
            console.warn('[UserSafe] Could not add isAdmin column:', alterError.message);
          }
        }
        
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
        // Добавляем isAdmin: false по умолчанию, если колонка не существует
        return result[0] ? { ...result[0], isAdmin: false } : null;
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    // Убеждаемся, что isAdmin существует, если нет - добавляем false
    if (user) {
      // Проверяем, есть ли поле isAdmin в объекте
      if (!('isAdmin' in user) || user.isAdmin === undefined) {
        return { ...(user as any), isAdmin: false };
      }
    }
    return user;
  } catch (error: any) {
    if (error?.message?.includes('isAdmin') || error?.message?.includes('does not exist')) {
      console.warn('[UserSafe] Column isAdmin does not exist. Using raw query.');
      try {
        // Пытаемся добавить колонку, если её нет (только один раз)
        try {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;
          `);
          await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "User_isAdmin_idx" ON "User"("isAdmin");
          `);
          console.log('[UserSafe] Column isAdmin added successfully');
        } catch (alterError: any) {
          // Игнорируем ошибки, если колонка уже существует
          if (!alterError?.message?.includes('already exists') && !alterError?.message?.includes('duplicate')) {
            console.warn('[UserSafe] Could not add isAdmin column:', alterError.message);
          }
        }
        
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
        // Добавляем isAdmin: false по умолчанию, если колонка не существует
        return result[0] ? { ...result[0], isAdmin: false } : null;
      } catch (rawError) {
        console.error('[UserSafe] Raw query failed:', rawError);
        throw error;
      }
    }
    throw error;
  }
}
