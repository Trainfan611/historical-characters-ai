import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Проверка подключения к БД
    await prisma.$queryRaw`SELECT 1`;
    
    // Проверка доступности основных таблиц
    const userCount = await prisma.user.count();
    const generationCount = await prisma.generation.count();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      stats: {
        users: userCount,
        generations: generationCount,
      },
    });
  } catch (error: any) {
    console.error('[Health Check] Error:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Database connection failed',
        message: error.message,
      },
      { status: 503 }
    );
  }
}
