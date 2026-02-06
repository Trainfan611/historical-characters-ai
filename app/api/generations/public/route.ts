import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Публичный endpoint для получения последних генераций для карусели
 * Не требует авторизации
 */
export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '12');

    // Получаем последние успешные генерации
    const generations = await prisma.generation.findMany({
      where: {
        status: 'completed',
        imageUrl: {
          not: '',
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        imageUrl: true,
        personName: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      generations: generations.map((g) => ({
        id: g.id,
        url: g.imageUrl,
        alt: g.personName,
        personName: g.personName,
      })),
    });
  } catch (error) {
    console.error('Error fetching public generations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch generations' },
      { status: 500 }
    );
  }
}
