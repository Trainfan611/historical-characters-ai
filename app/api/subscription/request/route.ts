import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSalesContact } from '@/lib/subscription';
import { sendTelegramMessage } from '@/lib/telegram-bot';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const requestedPlan = typeof body?.requestedPlan === 'string' ? body.requestedPlan : 'custom';

    const telegramId = (session.user as any).telegramId as string | undefined;
    const username = session.user?.email?.replace('@telegram', '') || '';
    const displayName = session.user?.name || 'Unknown user';
    const salesContact = getSalesContact();

    const adminId = process.env.TELEGRAM_ADMIN_ID;
    if (adminId) {
      const text =
        `💳 <b>Новая заявка на подписку</b>\n\n` +
        `<b>План:</b> ${requestedPlan}\n` +
        `<b>Пользователь:</b> ${displayName}\n` +
        `<b>Telegram ID:</b> ${telegramId || '-'}\n` +
        `<b>Username:</b> ${username ? '@' + username : '-'}\n`;

      await sendTelegramMessage(adminId, text, 'HTML');
    }

    return NextResponse.json({
      success: true,
      message: 'Заявка отправлена',
      contactForCustom: salesContact,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to submit subscription request',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
