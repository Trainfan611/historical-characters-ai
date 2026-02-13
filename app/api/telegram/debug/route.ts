import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/telegram/debug
 * Диагностический endpoint для проверки всех компонентов Telegram бота
 */
export async function GET(request: NextRequest) {
  const TELEGRAM_BOT_TOKEN_BASE = process.env.TELEGRAM_BOT_TOKEN_BASE || process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_ADMIN_ID = process.env.TELEGRAM_ADMIN_ID;
  const NEXTAUTH_URL = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      hasTokenBase: !!TELEGRAM_BOT_TOKEN_BASE,
      hasToken: !!TELEGRAM_BOT_TOKEN,
      tokenLength: TELEGRAM_BOT_TOKEN_BASE?.length || TELEGRAM_BOT_TOKEN?.length || 0,
      tokenSource: TELEGRAM_BOT_TOKEN_BASE ? 'TELEGRAM_BOT_TOKEN_BASE' : 
                   TELEGRAM_BOT_TOKEN ? 'TELEGRAM_BOT_TOKEN' : 'none',
      hasAdminId: !!TELEGRAM_ADMIN_ID,
      adminId: TELEGRAM_ADMIN_ID || 'not set',
      nextAuthUrl: NEXTAUTH_URL,
    },
    webhook: {
      url: `${NEXTAUTH_URL}/api/telegram/webhook`,
      testEndpoint: `${NEXTAUTH_URL}/api/telegram/test`,
    },
    database: {
      connected: false,
      error: null as string | null,
    },
    issues: [] as string[],
  };

  // Проверка переменных окружения
  if (!TELEGRAM_BOT_TOKEN_BASE && !TELEGRAM_BOT_TOKEN) {
    diagnostics.issues.push('❌ TELEGRAM_BOT_TOKEN или TELEGRAM_BOT_TOKEN_BASE не установлен');
  }

  if (!TELEGRAM_ADMIN_ID) {
    diagnostics.issues.push('⚠️ TELEGRAM_ADMIN_ID не установлен (бот будет работать, но админ-команды недоступны)');
  }

  // Проверка подключения к базе данных
  try {
    await prisma.$queryRaw`SELECT 1`;
    diagnostics.database.connected = true;
  } catch (error: any) {
    diagnostics.database.connected = false;
    diagnostics.database.error = error.message;
    diagnostics.issues.push('❌ Ошибка подключения к базе данных');
  }

  // Проверка статистики (если БД доступна)
  if (diagnostics.database.connected) {
    try {
      const [totalUsers, totalGenerations] = await Promise.all([
        prisma.user.count().catch(() => 0),
        prisma.generation.count().catch(() => 0),
      ]);
      diagnostics.database.stats = {
        totalUsers,
        totalGenerations,
      };
    } catch (error: any) {
      diagnostics.database.statsError = error.message;
    }
  }

  // Проверка webhook через Telegram API
  if (TELEGRAM_BOT_TOKEN_BASE || TELEGRAM_BOT_TOKEN) {
    try {
      const axios = (await import('axios')).default;
      const token = TELEGRAM_BOT_TOKEN_BASE || TELEGRAM_BOT_TOKEN;
      const response = await axios.get(
        `https://api.telegram.org/bot${token}/getWebhookInfo`,
        { timeout: 5000 }
      );
      
      diagnostics.webhook.telegramInfo = {
        url: response.data.result?.url || 'not set',
        hasCustomCertificate: response.data.result?.has_custom_certificate || false,
        pendingUpdateCount: response.data.result?.pending_update_count || 0,
        lastErrorDate: response.data.result?.last_error_date,
        lastErrorMessage: response.data.result?.last_error_message,
        maxConnections: response.data.result?.max_connections,
      };

      if (!response.data.result?.url || response.data.result.url !== diagnostics.webhook.url) {
        diagnostics.issues.push(`⚠️ Webhook не настроен или настроен неправильно. Текущий: ${response.data.result?.url || 'не установлен'}, ожидаемый: ${diagnostics.webhook.url}`);
      }

      if (response.data.result?.last_error_message) {
        diagnostics.issues.push(`❌ Ошибка webhook: ${response.data.result.last_error_message}`);
      }
    } catch (error: any) {
      diagnostics.webhook.telegramError = error.message;
      diagnostics.issues.push(`❌ Не удалось проверить webhook через Telegram API: ${error.message}`);
    }
  }

  // Общий статус
  diagnostics.status = diagnostics.issues.length === 0 ? 'ok' : 
                       diagnostics.issues.some((i: string) => i.startsWith('❌')) ? 'error' : 'warning';

  return NextResponse.json(diagnostics, { 
    status: diagnostics.status === 'error' ? 500 : 200 
  });
}
