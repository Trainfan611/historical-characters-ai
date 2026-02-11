import axios from 'axios';
import { prisma } from '@/lib/db';

const TELEGRAM_BOT_TOKEN_BASE = process.env.TELEGRAM_BOT_TOKEN_BASE;
const TELEGRAM_ADMIN_ID = process.env.TELEGRAM_ADMIN_ID; // Ваш Telegram ID
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';

/**
 * Отправляет сообщение в Telegram
 */
export async function sendTelegramMessage(chatId: string, text: string, parseMode: 'HTML' | 'Markdown' = 'HTML') {
  if (!TELEGRAM_BOT_TOKEN_BASE) {
    console.warn('[Telegram Bot] TELEGRAM_BOT_TOKEN_BASE not set');
    return null;
  }

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_BASE}/sendMessage`,
      {
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('[Telegram Bot] Error sending message:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Генерирует ссылку на админ-панель и отправляет её в Telegram
 */
export async function sendAdminLink(chatId: string) {
  if (!TELEGRAM_ADMIN_ID || chatId !== TELEGRAM_ADMIN_ID) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Генерируем токен напрямую (без вызова API)
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    // Формируем URL с токеном
    const adminUrl = `${NEXTAUTH_URL}/admin?token=${token}`;

    const message = `🔐 <b>Ссылка на админ-панель</b>\n\n` +
      `Ссылка действительна 1 час\n\n` +
      `<code>${adminUrl}</code>\n\n` +
      `Или перейдите по прямой ссылке:\n` +
      `${adminUrl}`;

    await sendTelegramMessage(chatId, message);
    return { success: true, url: adminUrl, token };
  } catch (error: any) {
    console.error('[Telegram Bot] Error generating admin link:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Отправляет краткую статистику по базе для админа
 */
export async function sendAdminStats(chatId: string) {
  if (!TELEGRAM_ADMIN_ID || chatId !== TELEGRAM_ADMIN_ID) {
    await sendTelegramMessage(chatId, '❌ У вас нет доступа к этой команде.');
    return;
  }

  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalUsers, totalPersons, totalGenerations, todayGenerations] = await Promise.all([
      prisma.user.count(),
      prisma.historicalPerson.count(),
      prisma.generation.count(),
      prisma.generation.count({
        where: {
          createdAt: {
            gte: startOfToday,
          },
        },
      }),
    ]);

    const format = (n: number) => n.toLocaleString('ru-RU');

    const message =
      '📊 <b>Статистика Historical Characters</b>\n\n' +
      `<b>Пользователей:</b> ${format(totalUsers)}\n` +
      `<b>Исторических персонажей:</b> ${format(totalPersons)}\n` +
      `<b>Генераций всего:</b> ${format(totalGenerations)}\n` +
      `<b>Генераций сегодня:</b> ${format(todayGenerations)}\n`;

    await sendTelegramMessage(chatId, message, 'HTML');
  } catch (error: any) {
    console.error('[Telegram Bot] Error sending admin stats:', error);
    await sendTelegramMessage(chatId, '⚠️ Не удалось получить статистику. Проверьте логи сервера.');
  }
}

/**
 * Обрабатывает команды Telegram бота
 */
export async function handleTelegramCommand(update: any) {
  const message = update.message;
  if (!message) return;

  const chatId = message.chat.id.toString();
  const text: string = message.text || '';

  // Команда: /admin — отправка ссылки на админ-панель
  if (text === '/admin' || text.startsWith('/admin ')) {
    if (TELEGRAM_ADMIN_ID && chatId === TELEGRAM_ADMIN_ID) {
      await sendAdminLink(chatId);
    } else {
      await sendTelegramMessage(chatId, '❌ У вас нет доступа к этой команде.');
    }
    return;
  }

  // Команда: /stats — краткая статистика по базе
  if (text === '/stats' || text.startsWith('/stats ')) {
    await sendAdminStats(chatId);
    return;
  }
}
