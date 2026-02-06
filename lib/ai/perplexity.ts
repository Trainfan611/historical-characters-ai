import axios from 'axios';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export interface PersonInfo {
  name: string;
  description: string;
  era: string;
  appearance: string;
  style: string;
  country?: string;
  birthYear?: number;
  deathYear?: number;
}

/**
 * Поиск информации о исторической личности через Perplexity
 */
export async function searchHistoricalPerson(personName: string): Promise<PersonInfo | null> {
  if (!PERPLEXITY_API_KEY) {
    console.error('[Perplexity] PERPLEXITY_API_KEY is not set');
    throw new Error('PERPLEXITY_API_KEY is not set');
  }

  try {
    console.log(`[Perplexity] Searching for: "${personName}"`);
    
    // Улучшенный промпт с более гибким поиском
    const prompt = `Find and provide detailed information about the person named "${personName}". 
    This could be a historical figure, politician, leader, artist, scientist, or any notable person from any time period.
    
    Please provide:
    1. Full name (including full first and last name if available)
    2. Brief biography (3-5 sentences with key facts about their life, achievements, and significance)
    3. Historical era/period (e.g., Ancient, Medieval, Renaissance, 19th Century, 20th Century, Modern, Contemporary, etc.)
    4. Physical appearance description (if available from historical records, portraits, photographs, or descriptions - include details about facial features, build, hair, etc.)
    5. Country/region of origin and where they lived or worked
    6. Birth year and death year (if known, use BCE/BC for ancient dates)
    7. Notable characteristics, profession, achievements, and role in history
    8. Typical clothing or attire for their era and status (if known)
    
    If you find this person, provide comprehensive information. If this person is not found or not a real historical figure, please clearly state that.
    Format your response as a detailed, structured description suitable for AI image generation.
    Be specific about appearance, clothing, and historical context.`;

    const response = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides detailed information about historical figures, politicians, leaders, and notable people for AI image generation. Always try to find information about the person, even if the name is incomplete or in a different language.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000, // Увеличиваем для более детальной информации
      },
      {
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 секунд таймаут
      }
    );

    console.log('[Perplexity] Response status:', response.status);
    console.log('[Perplexity] Response data structure:', {
      hasChoices: !!response.data.choices,
      choicesLength: response.data.choices?.length,
    });

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) {
      console.error('[Perplexity] No content in response. Full response:', JSON.stringify(response.data, null, 2));
      return null;
    }

    console.log(`[Perplexity] Received response (${content.length} chars)`);
    console.log('[Perplexity] Response preview:', content.substring(0, 200));
    
    // Проверяем, не говорит ли ответ, что персона не найдена
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('not found') || 
        lowerContent.includes('not a real') || 
        lowerContent.includes('cannot find') ||
        lowerContent.includes('no information') ||
        (lowerContent.includes('not') && lowerContent.includes('historical figure'))) {
      console.warn('[Perplexity] Response indicates person not found');
      return null;
    }
    
    // Парсинг ответа и извлечение информации
    const personInfo = parsePersonInfo(personName, content);
    console.log(`[Perplexity] Parsed person info:`, { 
      name: personInfo.name, 
      era: personInfo.era,
      hasDescription: !!personInfo.description,
      descriptionLength: personInfo.description.length,
    });
    return personInfo;
  } catch (error: any) {
    console.error('[Perplexity] Error searching historical person:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });
    
    // Если это ошибка API ключа
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('PERPLEXITY_API_KEY is invalid or expired');
    }
    
    return null;
  }
}

/**
 * Парсинг информации о личности из ответа Perplexity
 */
function parsePersonInfo(name: string, content: string): PersonInfo {
  const lines = content.split('\n').filter((line) => line.trim());
  
  // Берем первые 400-500 символов как описание, стараясь закончить на полном предложении
  let description = content.substring(0, 500).trim();
  
  // Пытаемся найти конец предложения
  const lastPeriod = description.lastIndexOf('.');
  const lastExclamation = description.lastIndexOf('!');
  const lastQuestion = description.lastIndexOf('?');
  const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
  
  if (lastSentenceEnd > 100) {
    description = description.substring(0, lastSentenceEnd + 1).trim();
  }
  
  // Если описание слишком короткое, расширяем
  if (description.length < 100) {
    description = content.substring(0, 800).trim();
    const lastPeriod2 = description.lastIndexOf('.');
    if (lastPeriod2 > 100) {
      description = description.substring(0, lastPeriod2 + 1).trim();
    }
  }
  
  // Если всё ещё короткое, просто берём первые 500 символов
  if (description.length < 50) {
    description = content.substring(0, 500).trim();
  }
  
  let era = 'Unknown';
  let appearance = 'Historical figure';
  let style = 'realistic portrait';
  let country = '';
  let birthYear: number | undefined;
  let deathYear: number | undefined;

  const lowerContent = content.toLowerCase();

  // Улучшенное определение эпохи
  const eraPatterns = [
    { keywords: ['ancient', 'antiquity', 'bc', 'bce', 'before christ'], era: 'Ancient' },
    { keywords: ['medieval', 'middle ages', 'middle age'], era: 'Medieval' },
    { keywords: ['renaissance', '15th century', '16th century'], era: 'Renaissance' },
    { keywords: ['17th century', '1600s'], era: '17th Century' },
    { keywords: ['18th century', '1700s'], era: '18th Century' },
    { keywords: ['19th century', '1800s'], era: '19th Century' },
    { keywords: ['20th century', '1900s', 'world war'], era: '20th Century' },
    { keywords: ['21st century', '2000s'], era: '21st Century' },
    { keywords: ['modern', 'contemporary'], era: 'Modern' },
  ];

  for (const { keywords, era: eraName } of eraPatterns) {
    if (keywords.some(kw => lowerContent.includes(kw))) {
      era = eraName;
      break;
    }
  }

  // Извлечение страны
  const countryPatterns = [
    { keywords: ['france', 'french'], country: 'France' },
    { keywords: ['england', 'english', 'britain', 'british'], country: 'England' },
    { keywords: ['germany', 'german'], country: 'Germany' },
    { keywords: ['italy', 'italian'], country: 'Italy' },
    { keywords: ['spain', 'spanish'], country: 'Spain' },
    { keywords: ['russia', 'russian'], country: 'Russia' },
    { keywords: ['greece', 'greek'], country: 'Greece' },
    { keywords: ['egypt', 'egyptian'], country: 'Egypt' },
    { keywords: ['china', 'chinese'], country: 'China' },
    { keywords: ['japan', 'japanese'], country: 'Japan' },
    { keywords: ['india', 'indian'], country: 'India' },
    { keywords: ['america', 'american', 'united states', 'usa'], country: 'United States' },
  ];

  for (const { keywords, country: countryName } of countryPatterns) {
    if (keywords.some(kw => lowerContent.includes(kw))) {
      country = countryName;
      break;
    }
  }

  // Улучшенное извлечение годов рождения и смерти
  const yearPattern = /\b(1[0-9]{3}|20[0-2][0-9])\b/g;
  const yearMatches = content.match(yearPattern);
  
  if (yearMatches && yearMatches.length > 0) {
    const years = yearMatches.map(Number).filter((y) => y >= 1000 && y <= 2024);
    
    if (years.length >= 2) {
      // Сортируем и берем минимальный как год рождения, максимальный как смерти
      const sortedYears = [...years].sort((a, b) => a - b);
      birthYear = sortedYears[0];
      deathYear = sortedYears[sortedYears.length - 1];
      
      // Если разница слишком большая, возможно это не годы жизни
      if (deathYear - birthYear > 120) {
        // Пробуем найти более близкие годы
        for (let i = 0; i < sortedYears.length - 1; i++) {
          if (sortedYears[i + 1] - sortedYears[i] < 120) {
            birthYear = sortedYears[i];
            deathYear = sortedYears[i + 1];
            break;
          }
        }
      }
    } else if (years.length === 1) {
      // Если только один год, это может быть год рождения
      birthYear = years[0];
    }
  }

  // Попытка извлечь описание внешности
  const appearanceKeywords = ['appearance', 'looked like', 'physical', 'portrait', 'depicted'];
  for (const keyword of appearanceKeywords) {
    const index = lowerContent.indexOf(keyword);
    if (index !== -1) {
      const appearanceText = content.substring(index, index + 200);
      if (appearanceText.length > 20) {
        appearance = appearanceText.substring(0, 150);
      }
    }
  }

  return {
    name,
    description,
    era,
    appearance,
    style,
    country: country || undefined,
    birthYear,
    deathYear,
  };
}
