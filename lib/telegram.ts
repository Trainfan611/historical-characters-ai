import crypto from 'crypto';
import axios from 'axios';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_BASE;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

export interface TelegramAuthData {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
}

/**
 * Верификация данных от Telegram Login Widget
 */
export function verifyTelegramData(data: TelegramAuthData): boolean {
  if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN_BASE is not set');
  }

  const { hash, ...userData } = data;
  const dataCheckString = Object.keys(userData)
    .sort()
    .map((key) => `${key}=${userData[key as keyof typeof userData]}`)
    .join('\n');

  const secretKey = crypto
    .createHash('sha256')
    .update(BOT_TOKEN)
    .digest();

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return calculatedHash === hash;
}

/**
 * Проверка подписки пользователя на канал
 */
export async function checkChannelSubscription(
  userId: string,
  channelId: string
): Promise<boolean> {
  if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN_BASE is not set');
  }

  try {
    // Нормализуем channelId: убираем @ если есть, оставляем как есть для числовых ID
    const normalizedChannelId = channelId.startsWith('@') ? channelId : channelId;
    
    console.log('[Telegram] Checking subscription:', { userId, channelId: normalizedChannelId });
    
    const response = await axios.get(`${TELEGRAM_API_URL}/getChatMember`, {
      params: {
        chat_id: normalizedChannelId,
        user_id: userId,
      },
    });

    const status = response.data.result?.status;
    console.log('[Telegram] Subscription status:', { userId, status, result: response.data.result });
    
    const isSubscribed = status === 'member' || status === 'administrator' || status === 'creator';
    return isSubscribed;
  } catch (error: any) {
    console.error('[Telegram] Error checking subscription:', {
      userId,
      channelId,
      error: error.response?.data || error.message,
      status: error.response?.status,
    });
    return false;
  }
}

/**
 * Получение информации о пользователе через Telegram API
 */
export async function getTelegramUser(userId: string) {
  if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN_BASE is not set');
  }

  try {
    const response = await axios.get(`${TELEGRAM_API_URL}/getChat`, {
      params: {
        chat_id: userId,
      },
    });

    return response.data.result;
  } catch (error) {
    console.error('Error getting Telegram user:', error);
    return null;
  }
}
