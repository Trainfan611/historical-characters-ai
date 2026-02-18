import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * POST /api/telegram/set-webhook
 * Обновляет webhook для Telegram бота
 */
export async function POST(request: NextRequest) {
  try {
    const TELEGRAM_BOT_TOKEN_BASE = process.env.TELEGRAM_BOT_TOKEN_BASE || process.env.TELEGRAM_BOT_TOKEN;
    const NEXTAUTH_URL = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';

    if (!TELEGRAM_BOT_TOKEN_BASE) {
      return NextResponse.json(
        { error: 'TELEGRAM_BOT_TOKEN_BASE or TELEGRAM_BOT_TOKEN not set' },
        { status: 500 }
      );
    }

    // Формируем правильный URL webhook
    const webhookUrl = `${NEXTAUTH_URL}/api/telegram/webhook`;

    console.log('[Set Webhook] Updating webhook to:', webhookUrl);

    // Обновляем webhook через Telegram API
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_BASE}/setWebhook`,
      {
        url: webhookUrl,
      },
      {
        timeout: 10000,
      }
    );

    if (response.data.ok) {
      // Проверяем текущий webhook
      const webhookInfo = await axios.get(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_BASE}/getWebhookInfo`,
        { timeout: 10000 }
      );

      return NextResponse.json({
        success: true,
        message: 'Webhook updated successfully',
        webhookUrl,
        currentWebhook: webhookInfo.data.result?.url,
        pendingUpdates: webhookInfo.data.result?.pending_update_count || 0,
        lastError: webhookInfo.data.result?.last_error_message || null,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: response.data.description || 'Failed to update webhook',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Set Webhook] Error:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update webhook',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/telegram/set-webhook
 * Показывает текущий статус webhook
 */
export async function GET(request: NextRequest) {
  try {
    const TELEGRAM_BOT_TOKEN_BASE = process.env.TELEGRAM_BOT_TOKEN_BASE || process.env.TELEGRAM_BOT_TOKEN;
    const NEXTAUTH_URL = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';

    if (!TELEGRAM_BOT_TOKEN_BASE) {
      return NextResponse.json(
        { error: 'TELEGRAM_BOT_TOKEN_BASE or TELEGRAM_BOT_TOKEN not set' },
        { status: 500 }
      );
    }

    const expectedWebhookUrl = `${NEXTAUTH_URL}/api/telegram/webhook`;

    // Получаем информацию о текущем webhook
    const webhookInfo = await axios.get(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_BASE}/getWebhookInfo`,
      { timeout: 10000 }
    );

    const currentUrl = webhookInfo.data.result?.url || 'not set';
    const isCorrect = currentUrl === expectedWebhookUrl;

    return NextResponse.json({
      expectedWebhookUrl,
      currentWebhookUrl: currentUrl,
      isCorrect,
      pendingUpdates: webhookInfo.data.result?.pending_update_count || 0,
      lastError: webhookInfo.data.result?.last_error_message || null,
      lastErrorDate: webhookInfo.data.result?.last_error_date || null,
    });
  } catch (error: any) {
    console.error('[Set Webhook] Error:', error.message);
    return NextResponse.json(
      {
        error: error.message || 'Failed to get webhook info',
      },
      { status: 500 }
    );
  }
}
