import { NextRequest, NextResponse } from 'next/server';
import { handleTelegramCommand } from '@/lib/telegram-bot';

/**
 * POST /api/telegram/webhook
 * Webhook для Telegram бота
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[Telegram Webhook] Received update:', {
      updateId: body.update_id,
      hasMessage: !!body.message,
      messageType: body.message?.text ? 'text' : body.message?.photo ? 'photo' : 'other',
      chatId: body.message?.chat?.id,
      fromId: body.message?.from?.id,
      text: body.message?.text?.substring(0, 50),
    });

    // Обрабатываем команды
    if (body.message) {
      await handleTelegramCommand(body);
    } else {
      console.log('[Telegram Webhook] Update without message, ignoring');
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Telegram Webhook] Error processing webhook:', {
      error: error.message,
      stack: error.stack,
    });
    // Всегда возвращаем 200, чтобы Telegram не повторял запрос
    return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
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
