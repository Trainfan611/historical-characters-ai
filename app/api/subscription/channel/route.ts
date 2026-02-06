import { NextResponse } from 'next/server';

export async function GET() {
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  
  if (!channelId) {
    return NextResponse.json({ error: 'Channel ID not configured' }, { status: 500 });
  }

  // Формируем ссылку на канал
  // Если channelId начинается с @, используем его напрямую
  // Если это числовой ID, используем его
  const channelLink = channelId.startsWith('@') 
    ? `https://t.me/${channelId.slice(1)}`
    : `https://t.me/${channelId}`;

  return NextResponse.json({ channelLink });
}
