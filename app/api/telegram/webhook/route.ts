import { NextRequest, NextResponse } from 'next/server';
import { handleTelegramCommand } from '@/lib/telegram-bot';

/**
 * POST /api/telegram/webhook
 * Webhook для Telegram бота
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Обрабатываем команды
    if (body.message) {
      await handleTelegramCommand(body);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Telegram Webhook] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/telegram/webhook
 * Для установки webhook
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Telegram webhook endpoint',
    method: 'POST',
  });
}
