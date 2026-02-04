import { NextRequest, NextResponse } from 'next/server';
import { searchPersons } from '@/lib/persons';

/**
 * Специальный endpoint для расширенного поиска с интернетом
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const limit = parseInt(searchParams.get('limit') || '20');
    const useInternet = searchParams.get('useInternet') !== 'false';

    const persons = await searchPersons(query, {
      useInternet,
      limit,
    });

    return NextResponse.json({
      persons,
      total: persons.length,
      fromInternet: useInternet,
      query,
    });
  } catch (error) {
    console.error('Error in search:', error);
    return NextResponse.json(
      { error: 'Failed to search persons' },
      { status: 500 }
    );
  }
}
