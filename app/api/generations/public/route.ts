import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Публичный endpoint для получения последних генераций для карусели
 * Не требует авторизации
 */
export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '3');

    // Список персонажей для карусели
    const featuredPersons = [
      'Путин',
      'Трамп',
      'Наполеон Бонапарт',
      'Ленин',
      'Сталин',
    ];

    // Сначала пытаемся найти генерации для конкретных персонажей
    const featuredGenerations = await prisma.generation.findMany({
      where: {
        status: 'completed',
        imageUrl: {
          not: '',
        },
        personName: {
          in: featuredPersons,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        imageUrl: true,
        personName: true,
        createdAt: true,
      },
    });

    // Группируем по имени персонажа, берем последнюю генерацию для каждого
    const uniqueFeatured = featuredGenerations.reduce((acc, gen) => {
      if (!acc[gen.personName]) {
        acc[gen.personName] = gen;
      }
      return acc;
    }, {} as Record<string, typeof featuredGenerations[0]>);

    // Сортируем по порядку в списке featuredPersons
    const sortedFeatured = featuredPersons
      .map((name) => uniqueFeatured[name])
      .filter(Boolean)
      .slice(0, limit);

    // Если не хватает изображений, добавляем последние генерации
    if (sortedFeatured.length < limit) {
      const additionalGenerations = await prisma.generation.findMany({
        where: {
          status: 'completed',
          imageUrl: {
            not: '',
          },
          personName: {
            notIn: featuredPersons,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit - sortedFeatured.length,
        select: {
          id: true,
          imageUrl: true,
          personName: true,
          createdAt: true,
        },
      });

      sortedFeatured.push(...additionalGenerations);
    }

    // Фильтруем изображения с валидными URL (исключаем старые Replicate URL, которые могут быть недоступны)
    const validGenerations = sortedFeatured
      .filter((g) => {
        const url = g.imageUrl;
        // Проверяем, что URL валидный и не является старым Replicate URL (которые могут быть недоступны)
        if (!url || url.trim() === '') return false;
        // Исключаем старые Replicate delivery URLs, которые могут быть недоступны
        if (url.includes('replicate.delivery') && !url.includes('oaidalleapiprodscus')) {
          // Проверяем, что это не старый формат Replicate
          return false;
        }
        return true;
      })
      .map((g) => ({
        id: g.id,
        url: g.imageUrl,
        alt: g.personName,
        personName: g.personName,
      }));

    return NextResponse.json({
      generations: validGenerations,
    });
  } catch (error) {
    console.error('Error fetching public generations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch generations' },
      { status: 500 }
    );
  }
}
