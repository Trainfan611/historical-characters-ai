import { NextResponse } from 'next/server';

/**
 * Простой health check без обращения к БД
 * Используется Railway для проверки работоспособности во время деплоя
 * Быстрая проверка без блокировки билда
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'historical-characters-ai',
  });
}
