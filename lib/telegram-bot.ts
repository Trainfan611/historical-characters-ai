import axios from 'axios';
import { prisma } from '@/lib/db';

// Используем TELEGRAM_BOT_TOKEN_BASE для админ-функций, fallback на TELEGRAM_BOT_TOKEN
const TELEGRAM_BOT_TOKEN_BASE = process.env.TELEGRAM_BOT_TOKEN_BASE || process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_ID = process.env.TELEGRAM_ADMIN_ID; // Ваш Telegram ID
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';

/**
 * Отправляет сообщение в Telegram
 */
export async function sendTelegramMessage(chatId: string, text: string, parseMode: 'HTML' | 'Markdown' = 'HTML') {
  if (!TELEGRAM_BOT_TOKEN_BASE) {
    console.error('[Telegram Bot] TELEGRAM_BOT_TOKEN_BASE and TELEGRAM_BOT_TOKEN are not set');
    return null;
  }

  try {
    const maskedToken =
      TELEGRAM_BOT_TOKEN_BASE.length > 8
        ? `${TELEGRAM_BOT_TOKEN_BASE.slice(0, 4)}...${TELEGRAM_BOT_TOKEN_BASE.slice(-4)}`
        : 'short-token';
    console.log('[Telegram Bot] Sending message', {
      chatId,
      hasToken: !!TELEGRAM_BOT_TOKEN_BASE,
      tokenLength: TELEGRAM_BOT_TOKEN_BASE.length,
      tokenPreview: maskedToken,
    });

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
  const isAdmin = TELEGRAM_ADMIN_ID && chatId === TELEGRAM_ADMIN_ID;
  
  if (!isAdmin) {
    console.log('[Telegram Bot] Admin link requested by non-admin:', {
      chatId,
      adminId: TELEGRAM_ADMIN_ID,
    });
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
  // Проверяем, что пользователь - админ (по chatId или по from.id)
  const isAdmin = TELEGRAM_ADMIN_ID && chatId === TELEGRAM_ADMIN_ID;
  
  if (!isAdmin) {
    console.log('[Telegram Bot] Stats requested by non-admin:', {
      chatId,
      adminId: TELEGRAM_ADMIN_ID,
    });
    
    // Если TELEGRAM_ADMIN_ID не установлен, отправляем информационное сообщение
    if (!TELEGRAM_ADMIN_ID) {
      await sendTelegramMessage(
        chatId,
        '⚠️ Админ-статистика недоступна: TELEGRAM_ADMIN_ID не настроен в переменных окружения.'
      );
    } else {
      await sendTelegramMessage(chatId, '❌ У вас нет доступа к этой команде.');
    }
    return;
  }

  console.log('[Telegram Bot] Sending admin stats to:', chatId);

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
  if (!message) {
    console.log('[Telegram Bot] No message in update:', JSON.stringify(update));
    return;
  }

  const chatId = message.chat.id.toString();
  const text: string = message.text || '';
  const fromId = message.from?.id?.toString();

  console.log('[Telegram Bot] Received command:', {
    chatId,
    fromId,
    text,
    hasAdminId: !!TELEGRAM_ADMIN_ID,
    adminId: TELEGRAM_ADMIN_ID,
    isAdmin: chatId === TELEGRAM_ADMIN_ID || fromId === TELEGRAM_ADMIN_ID,
  });

  // Команда: /admin — отправка ссылки на админ-панель
  if (text === '/admin' || text.startsWith('/admin ')) {
    const isAdmin = TELEGRAM_ADMIN_ID && (chatId === TELEGRAM_ADMIN_ID || fromId === TELEGRAM_ADMIN_ID);
    if (isAdmin) {
      console.log('[Telegram Bot] Admin link requested by admin');
      await sendAdminLink(chatId);
    } else {
      console.log('[Telegram Bot] Admin link requested by non-admin');
      await sendTelegramMessage(chatId, '❌ У вас нет доступа к этой команде.');
    }
    return;
  }

  // Команда: /start — краткая статистика по базе (для админа)
  if (text === '/start' || text.startsWith('/start ')) {
    console.log('[Telegram Bot] /start command received');
    await sendAdminStats(chatId);
    return;
  }

  // Если команда не распознана, отправляем помощь
  if (text.startsWith('/')) {
    console.log('[Telegram Bot] Unknown command:', text);
    const helpMessage = 
      '🤖 <b>Historical Characters AI Bot</b>\n\n' +
      'Доступные команды:\n' +
      '/start - Статистика (для админа)\n' +
      '/admin - Ссылка на админ-панель (для админа)';
    await sendTelegramMessage(chatId, helpMessage);
  }
}
