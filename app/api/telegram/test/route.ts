import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/telegram/test
 * Тестовый endpoint для проверки конфигурации Telegram бота
 */
export async function GET(request: NextRequest) {
  const TELEGRAM_BOT_TOKEN_BASE = process.env.TELEGRAM_BOT_TOKEN_BASE || process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_ADMIN_ID = process.env.TELEGRAM_ADMIN_ID;
  const NEXTAUTH_URL = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';

  const config = {
    hasToken: !!TELEGRAM_BOT_TOKEN_BASE,
    tokenLength: TELEGRAM_BOT_TOKEN_BASE?.length || 0,
    tokenSource: process.env.TELEGRAM_BOT_TOKEN_BASE ? 'TELEGRAM_BOT_TOKEN_BASE' : 
                 process.env.TELEGRAM_BOT_TOKEN ? 'TELEGRAM_BOT_TOKEN' : 'none',
    hasAdminId: !!TELEGRAM_ADMIN_ID,
    adminId: TELEGRAM_ADMIN_ID || 'not set',
    webhookUrl: `${NEXTAUTH_URL}/api/telegram/webhook`,
    status: 'ok' as const,
  };

  return NextResponse.json(config, { status: 200 });
}
