import { prisma } from './db';
import { searchHistoricalPerson, PersonInfo } from './ai/perplexity';

/**
 * Поиск личности в БД или создание новой через интернет
 */
export async function findOrCreatePerson(
  personName: string
): Promise<{ person: any; personInfo: PersonInfo }> {
  // Сначала ищем в БД
  let person = await prisma.historicalPerson.findFirst({
    where: {
      OR: [
        { name: { equals: personName, mode: 'insensitive' } },
        { nameEn: { equals: personName, mode: 'insensitive' } },
      ],
    },
  });

  let personInfo: PersonInfo | null;

  if (person) {
    // Если нашли в БД, используем данные из БД
    personInfo = {
      name: person.name,
      description: person.description || '',
      era: person.era || 'Unknown',
      appearance: '',
      style: 'realistic',
      country: person.country || undefined,
      birthYear: person.birthYear || undefined,
      deathYear: person.deathYear || undefined,
    };
  } else {
    // Если не нашли, ищем через Perplexity (интернет)
    console.log(`[Persons] Searching for "${personName}" via Perplexity...`);
    
    // Пробуем несколько вариантов поиска
    let searchVariants = [personName];
    
    // Если имя короткое (1-2 слова), пробуем добавить контекст
    const nameParts = personName.trim().split(/\s+/);
    if (nameParts.length === 1) {
      // Если только одно слово, пробуем с разными вариантами
      searchVariants = [
        personName,
        `${personName} историческая личность`,
        `${personName} политик`,
        `${personName} лидер`,
      ];
    }
    
    personInfo = null;
    let lastError: Error | null = null;
    
    // Пробуем каждый вариант поиска
    for (const searchVariant of searchVariants) {
      try {
        console.log(`[Persons] Trying search variant: "${searchVariant}"`);
        personInfo = await searchHistoricalPerson(searchVariant);
        
        if (personInfo) {
          console.log(`[Persons] Found information about "${personInfo.name}" from era: ${personInfo.era}`);
          break; // Успешно нашли, выходим из цикла
        }
      } catch (error: any) {
        console.error(`[Persons] Error searching with variant "${searchVariant}":`, error.message);
        lastError = error;
        // Продолжаем пробовать другие варианты
      }
    }
    
    if (!personInfo) {
      const errorMessage = lastError?.message || `Не удалось найти информацию о "${personName}" в интернете`;
      console.error(`[Persons] Failed to find information about "${personName}" after trying ${searchVariants.length} variants`);
      throw new Error(errorMessage);
    }

    // Сохраняем найденную личность в БД для кэширования
    person = await prisma.historicalPerson.create({
      data: {
        name: personInfo.name,
        nameEn: personInfo.name, // Можно улучшить, добавив перевод
        description: personInfo.description,
        era: personInfo.era,
        category: extractCategory(personInfo),
        country: personInfo.country,
        birthYear: personInfo.birthYear,
        deathYear: personInfo.deathYear,
      },
    });
  }

  return { person, personInfo };
}

/**
 * Автоматическое расширение базы через поиск в интернете
 */
export async function searchPersonsWithAutoExpand(
  searchQuery: string,
  limit: number = 5
): Promise<void> {
  try {
    // Ищем через Perplexity список исторических личностей по запросу
    const { searchHistoricalPerson } = await import('./ai/perplexity');
    
    // Используем Perplexity для поиска списка личностей
    const personInfo = await searchHistoricalPerson(searchQuery);
    
    if (personInfo) {
      // Проверяем, есть ли уже в БД
      const existing = await prisma.historicalPerson.findFirst({
        where: {
          name: { equals: personInfo.name, mode: 'insensitive' },
        },
      });

      if (!existing) {
        // Сохраняем в БД
        await prisma.historicalPerson.create({
          data: {
            name: personInfo.name,
            nameEn: personInfo.name,
            description: personInfo.description,
            era: personInfo.era,
            category: extractCategory(personInfo),
            country: personInfo.country,
            birthYear: personInfo.birthYear,
            deathYear: personInfo.deathYear,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error in auto-expand:', error);
    // Игнорируем ошибки при авторасширении
  }
}

/**
 * Извлечение категории из информации о личности
 */
function extractCategory(personInfo: PersonInfo): string | null {
  const lowerDesc = personInfo.description.toLowerCase();
  const lowerEra = personInfo.era.toLowerCase();

  if (
    lowerDesc.includes('king') ||
    lowerDesc.includes('queen') ||
    lowerDesc.includes('emperor') ||
    lowerDesc.includes('empress') ||
    lowerDesc.includes('tsar') ||
    lowerDesc.includes('president') ||
    lowerDesc.includes('ruler')
  ) {
    return 'Politician';
  }

  if (
    lowerDesc.includes('artist') ||
    lowerDesc.includes('painter') ||
    lowerDesc.includes('sculptor') ||
    lowerDesc.includes('musician') ||
    lowerDesc.includes('composer') ||
    lowerDesc.includes('writer') ||
    lowerDesc.includes('poet')
  ) {
    return 'Artist';
  }

  if (
    lowerDesc.includes('scientist') ||
    lowerDesc.includes('physicist') ||
    lowerDesc.includes('mathematician') ||
    lowerDesc.includes('inventor') ||
    lowerDesc.includes('philosopher')
  ) {
    return 'Scientist';
  }

  if (
    lowerDesc.includes('general') ||
    lowerDesc.includes('commander') ||
    lowerDesc.includes('military') ||
    lowerDesc.includes('warrior') ||
    lowerDesc.includes('soldier')
  ) {
    return 'Military';
  }

  return null;
}

/**
 * Поиск личностей с поддержкой интернет-поиска
 */
export async function searchPersons(
  query: string,
  options: {
    useInternet?: boolean;
    limit?: number;
  } = {}
): Promise<any[]> {
  const { useInternet = true, limit = 20 } = options;

  // Сначала ищем в БД
  const dbResults = await prisma.historicalPerson.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { nameEn: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: limit,
    orderBy: { name: 'asc' },
  });

  // Если включен интернет-поиск и результатов мало, ищем через Perplexity
  if (useInternet && dbResults.length < 3 && query.length > 3) {
    try {
      const personInfo = await searchHistoricalPerson(query);
      if (personInfo) {
        // Проверяем, нет ли уже в результатах
        const exists = dbResults.some(
          (p) => p.name.toLowerCase() === personInfo.name.toLowerCase()
        );

        if (!exists) {
          // Сохраняем в БД и добавляем в результаты
          const newPerson = await prisma.historicalPerson.create({
            data: {
              name: personInfo.name,
              nameEn: personInfo.name,
              description: personInfo.description,
              era: personInfo.era,
              category: extractCategory(personInfo),
              country: personInfo.country,
              birthYear: personInfo.birthYear,
              deathYear: personInfo.deathYear,
            },
          });
          dbResults.push(newPerson);
        }
      }
    } catch (error) {
      console.error('Error in internet search:', error);
      // Продолжаем с результатами из БД
    }
  }

  return dbResults;
}
