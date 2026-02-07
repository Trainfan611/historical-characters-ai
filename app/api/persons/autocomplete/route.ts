import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import axios from 'axios';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * API endpoint для автодополнения имен исторических личностей
 * Возвращает конкретные варианты, например: "Николай 2 (второй)", "Николай 1 (первый)"
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const limit = parseInt(searchParams.get('limit') || '5');

    // Сначала ищем в базе данных
    const dbResults = await prisma.historicalPerson.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { nameEn: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        nameEn: true,
        era: true,
        country: true,
        birthYear: true,
        deathYear: true,
      },
    });

    // Форматируем результаты из БД
    const dbSuggestions = dbResults.map((person) => ({
      name: person.name,
      displayName: formatPersonName(person.name, person.era, person.birthYear, person.deathYear),
      era: person.era,
      source: 'database',
    }));

    // Если нашли достаточно результатов в БД, возвращаем их
    if (dbSuggestions.length >= limit) {
      return NextResponse.json({ suggestions: dbSuggestions });
    }

    // Если результатов мало, используем Perplexity для получения вариантов
    if (PERPLEXITY_API_KEY) {
      try {
        const perplexitySuggestions = await getPerplexitySuggestions(query, limit - dbSuggestions.length);
        
        // Объединяем результаты
        const allSuggestions = [...dbSuggestions, ...perplexitySuggestions];
        
        // Удаляем дубликаты
        const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) =>
          index === self.findIndex((s) => s.name.toLowerCase() === suggestion.name.toLowerCase())
        );

        return NextResponse.json({ 
          suggestions: uniqueSuggestions.slice(0, limit),
          fromInternet: perplexitySuggestions.length > 0,
        });
      } catch (error) {
        console.error('[Autocomplete] Perplexity error:', error);
        // Если Perplexity не сработал, возвращаем результаты из БД
        return NextResponse.json({ suggestions: dbSuggestions });
      }
    }

    return NextResponse.json({ suggestions: dbSuggestions });
  } catch (error) {
    console.error('Error in autocomplete:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions', suggestions: [] },
      { status: 500 }
    );
  }
}

/**
 * Получение вариантов имен через Perplexity
 */
async function getPerplexitySuggestions(query: string, limit: number): Promise<any[]> {
  if (!PERPLEXITY_API_KEY) {
    return [];
  }

  try {
    const prompt = `List ${limit} different historical figures, politicians, leaders, or notable people whose name starts with or contains "${query}".

For each person, provide:
1. Full name (with numbers or additional identifiers if applicable, e.g., "Николай II", "Николай I", "Николай Кондратьев")
2. Brief identifier in parentheses if needed (e.g., "(второй)", "(первый)", "(экономист)")
3. Era or time period
4. Country if known

Format as a list, one person per line, like:
- Николай II (второй) - 19th-20th Century, Russia
- Николай I (первый) - 19th Century, Russia
- Николай Кондратьев (экономист) - 20th Century, Russia

Only include real historical figures. Be specific with names and identifiers.`;

    const response = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides lists of historical figures with their full names and identifiers. Always include specific identifiers like numbers or professions when there are multiple people with the same name.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) {
      return [];
    }

    // Парсим ответ Perplexity
    const suggestions = parsePerplexityResponse(content, query);
    return suggestions.slice(0, limit);
  } catch (error: any) {
    console.error('[Autocomplete] Perplexity error:', error.message);
    return [];
  }
}

/**
 * Парсинг ответа Perplexity в массив подсказок
 */
function parsePerplexityResponse(content: string, query: string): any[] {
  const suggestions: any[] = [];
  const lines = content.split('\n').filter(line => line.trim());

  for (const line of lines) {
    // Ищем паттерны типа "Николай II (второй) - 19th Century, Russia"
    const match = line.match(/[-•]\s*(.+?)(?:\s*-\s*(.+?))?(?:\s*,\s*(.+?))?$/);
    if (match) {
      const fullName = match[1].trim();
      const era = match[2]?.trim() || '';
      const country = match[3]?.trim() || '';

      // Извлекаем имя и идентификатор
      const nameMatch = fullName.match(/^(.+?)\s*\((.+?)\)$/);
      let name = fullName;
      let displayName = fullName;

      if (nameMatch) {
        name = nameMatch[1].trim();
        const identifier = nameMatch[2].trim();
        displayName = `${name} (${identifier})`;
      }

      // Проверяем, что имя содержит запрос
      if (name.toLowerCase().includes(query.toLowerCase())) {
        suggestions.push({
          name: name,
          displayName: displayName,
          era: era,
          source: 'perplexity',
        });
      }
    } else {
      // Простой формат: просто имя
      const name = line.replace(/^[-•]\s*/, '').trim();
      if (name.toLowerCase().includes(query.toLowerCase()) && name.length > 2) {
        suggestions.push({
          name: name,
          displayName: name,
          era: '',
          source: 'perplexity',
        });
      }
    }
  }

  return suggestions;
}

/**
 * Форматирование имени для отображения с дополнительной информацией
 */
function formatPersonName(
  name: string,
  era?: string | null,
  birthYear?: number | null,
  deathYear?: number | null
): string {
  let displayName = name;

  // Добавляем информацию об эпохе, если есть
  if (era) {
    // Если имя уже содержит номер (например, "Николай II"), добавляем эпоху в скобках
    if (/\d+/.test(name)) {
      displayName = `${name} (${era})`;
    } else {
      displayName = name;
    }
  }

  return displayName;
}
