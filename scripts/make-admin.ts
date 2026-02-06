/**
 * Скрипт для назначения пользователя админом
 * Использование: npx tsx scripts/make-admin.ts <telegramId>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin(telegramId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      console.error(`❌ Пользователь с Telegram ID ${telegramId} не найден`);
      process.exit(1);
    }

    const updated = await prisma.user.update({
      where: { telegramId },
      data: { isAdmin: true },
    });

    console.log(`✅ Пользователь ${updated.firstName || updated.username || telegramId} теперь админ`);
    console.log(`   Telegram ID: ${updated.telegramId}`);
    console.log(`   Username: @${updated.username || 'нет'}`);
  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const telegramId = process.argv[2];

if (!telegramId) {
  console.error('❌ Укажите Telegram ID пользователя');
  console.log('Использование: npx tsx scripts/make-admin.ts <telegramId>');
  process.exit(1);
}

makeAdmin(telegramId);
