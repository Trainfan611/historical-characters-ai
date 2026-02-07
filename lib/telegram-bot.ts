import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_ID = process.env.TELEGRAM_ADMIN_ID; // Ваш Telegram ID
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';

/**
 * Отправляет сообщение в Telegram
 */
export async function sendTelegramMessage(chatId: string, text: string, parseMode: 'HTML' | 'Markdown' = 'HTML') {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[Telegram Bot] TELEGRAM_BOT_TOKEN not set');
    return null;
  }

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
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
 * Обрабатывает команды Telegram бота
 */
export async function handleTelegramCommand(update: any) {
  const message = update.message;
  if (!message) return;

  const chatId = message.chat.id.toString();
  const text = message.text;

  // Проверяем, что это команда /admin
  if (text === '/admin' || text.startsWith('/admin ')) {
    // Проверяем, что это админ
    if (TELEGRAM_ADMIN_ID && chatId === TELEGRAM_ADMIN_ID) {
      await sendAdminLink(chatId);
    } else {
      await sendTelegramMessage(chatId, '❌ У вас нет доступа к этой команде.');
    }
  }
}
