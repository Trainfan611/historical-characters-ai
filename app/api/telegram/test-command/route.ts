import { NextRequest, NextResponse } from 'next/server';
import { handleTelegramCommand } from '@/lib/telegram-bot';

/**
 * POST /api/telegram/test-command
 * Тестовый endpoint для проверки обработки команд
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Симулируем обновление от Telegram
    const testUpdate = {
      update_id: 999999,
      message: {
        message_id: 1,
        from: {
          id: parseInt(process.env.TELEGRAM_ADMIN_ID || '0'),
          is_bot: false,
          first_name: 'Test',
        },
        chat: {
          id: parseInt(process.env.TELEGRAM_ADMIN_ID || '0'),
          type: 'private',
        },
        date: Math.floor(Date.now() / 1000),
        text: body.command || '/start',
      },
    };

    console.log('[Test Command] Processing test command:', {
      command: testUpdate.message.text,
      chatId: testUpdate.message.chat.id,
      fromId: testUpdate.message.from.id,
    });

    await handleTelegramCommand(testUpdate);

    return NextResponse.json({
      success: true,
      message: 'Command processed',
      command: testUpdate.message.text,
      chatId: testUpdate.message.chat.id,
    });
  } catch (error: any) {
    console.error('[Test Command] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/telegram/test-command
 * Показывает информацию о настройке
 */
export async function GET(request: NextRequest) {
  const TELEGRAM_BOT_TOKEN_BASE = process.env.TELEGRAM_BOT_TOKEN_BASE || process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_ADMIN_ID = process.env.TELEGRAM_ADMIN_ID;

  return NextResponse.json({
    hasToken: !!TELEGRAM_BOT_TOKEN_BASE,
    tokenLength: TELEGRAM_BOT_TOKEN_BASE?.length || 0,
    hasAdminId: !!TELEGRAM_ADMIN_ID,
    adminId: TELEGRAM_ADMIN_ID || 'not set',
    testEndpoint: '/api/telegram/test-command',
    usage: 'POST with { "command": "/start" } or { "command": "/admin" }',
  });
}
