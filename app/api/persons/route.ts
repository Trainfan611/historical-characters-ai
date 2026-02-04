import { NextRequest, NextResponse } from 'next/server';
import { searchPersons } from '@/lib/persons';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('q');
    const era = searchParams.get('era');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const useInternet = searchParams.get('useInternet') !== 'false'; // По умолчанию включен

    // Если есть поисковый запрос, используем улучшенный поиск с интернетом
    if (search && search.length > 2) {
      const persons = await searchPersons(search, {
        useInternet,
        limit: limit + offset, // Получаем больше для пагинации
      });

      // Фильтруем по эпохе и категории если указаны
      let filtered = persons;
      if (era) {
        filtered = filtered.filter((p) => p.era === era);
      }
      if (category) {
        filtered = filtered.filter((p) => p.category === category);
      }

      // Применяем пагинацию
      const paginated = filtered.slice(offset, offset + limit);

      return NextResponse.json({
        persons: paginated,
        total: filtered.length,
        limit,
        offset,
        fromInternet: useInternet,
      });
    }

    // Если нет поискового запроса, возвращаем из БД с фильтрами
    const where: any = {};

    if (era) {
      where.era = era;
    }

    if (category) {
      where.category = category;
    }

    const [persons, total] = await Promise.all([
      prisma.historicalPerson.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { name: 'asc' },
      }),
      prisma.historicalPerson.count({ where }),
    ]);

    return NextResponse.json({
      persons,
      total,
      limit,
      offset,
      fromInternet: false,
    });
  } catch (error) {
    console.error('Error fetching persons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persons' },
      { status: 500 }
    );
  }
}
