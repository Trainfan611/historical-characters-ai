#!/usr/bin/env node
/**
 * Автоматический скрипт для настройки на Railway
 * Применяет миграции базы данных
 */

const { execSync } = require('child_process');

console.log('🚀 Начинаем настройку базы данных на Railway...\n');

try {
  console.log('📦 Применяем миграции Prisma...');
  
  // Пытаемся применить миграции
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Миграции применены через migrate deploy');
  } catch (error) {
    console.log('⚠️  migrate deploy не сработал, пробуем db push...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Миграции применены через db push');
  }
  
  console.log('\n✅ База данных обновлена успешно!');
  console.log('\n📝 Следующий шаг:');
  console.log('1. Откройте ваше приложение в браузере');
  console.log('2. Войдите через Telegram');
  console.log('3. Перейдите на: https://ваш-домен.railway.app/admin/setup');
  console.log('4. Нажмите "Назначить меня админом"');
  console.log('\n🎉 Готово!');
  
} catch (error) {
  console.error('❌ Ошибка при применении миграций:', error.message);
  process.exit(1);
}
