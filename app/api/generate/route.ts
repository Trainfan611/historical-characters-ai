import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { searchHistoricalPerson } from '@/lib/ai/perplexity';
import { generateImagePrompt } from '@/lib/ai/gemini';
import { generateImageWithOpenAI } from '@/lib/ai/openai-image';
import { generateImageWithNanoBanana } from '@/lib/ai/nano-banana';
import { generateImage } from '@/lib/ai/openrouter';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit-simple';
import { generateImageSchema } from '@/lib/validation';
import { getUserSafe } from '@/lib/user-safe';
import { extractPersonName, extractAdditionalInfo, getFullNameForGeneration } from '@/lib/person-name-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверка подписки
    const dbUser = await getUserSafe((session.user as any).telegramId);

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!dbUser.isSubscribed) {
      return NextResponse.json(
        { error: 'Subscription required', code: 'SUBSCRIPTION_REQUIRED' },
        { status: 403 }
      );
    }

    // Проверка лимита генераций (15 в день)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const todayGenerations = await prisma.generation.count({
      where: {
        userId: dbUser.id,
        status: 'completed',
        createdAt: {
          gte: today,
        },
      },
    });

    const DAILY_LIMIT = 15;
    if (todayGenerations >= DAILY_LIMIT) {
      return NextResponse.json(
        { 
          error: 'Daily generation limit reached',
          code: 'DAILY_LIMIT_REACHED',
          limit: DAILY_LIMIT,
          used: todayGenerations,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    // Rate limiting по IP (дополнительно к лимиту по пользователю)
    // Получаем IP из заголовков (Next.js 15 не имеет request.ip)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
    
    const ipRateLimit = rateLimit(`ip:${ip}`, {
      maxRequests: 20, // Максимум 20 генераций в день с одного IP
      windowMs: 24 * 60 * 60 * 1000,
    });
    
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'IP rate limit exceeded',
          retryAfter: Math.round((ipRateLimit.resetAt - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': ipRateLimit.remaining.toString(),
            'Retry-After': Math.round((ipRateLimit.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Валидация входных данных
    let body;
    try {
      body = await request.json();
      const validated = generateImageSchema.parse(body);
      body = validated;
    } catch (error: any) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: error.errors || error.message,
        },
        { status: 400 }
      );
    }

    const { personName, personId, style = 'realistic' } = body;

    if (!personName && !personId) {
      return NextResponse.json(
        { error: 'Person name or ID is required' },
        { status: 400 }
      );
    }

    // Убеждаемся, что personName - это строка
    const personNameStr = typeof personName === 'string' ? personName : null;

    // Извлекаем только имя и фамилию для поиска в БД (убирая дополнительную информацию в скобках)
    // Например: "Уинстон Черчилль (премьер-министр)" -> "Уинстон Черчилль"
    const cleanPersonName = personNameStr ? extractPersonName(personNameStr) : null;
    
    // Сохраняем полное имя с дополнительной информацией для генерации
    const fullPersonName = personNameStr ? getFullNameForGeneration(personNameStr) : null;
    const additionalInfo = personNameStr ? extractAdditionalInfo(personNameStr) : null;

    // Поиск или получение информации о личности
    // Используем улучшенную функцию поиска/создания через интернет
    const { findOrCreatePerson } = await import('@/lib/persons');
    
    const searchName = cleanPersonName || (personId ? 
      (await prisma.historicalPerson.findUnique({ where: { id: personId } }))?.name : 
      null
    );

    if (!searchName) {
      return NextResponse.json(
        { error: 'Person name is required' },
        { status: 400 }
      );
    }

    let personInfo;
    let historicalPerson = null;

    try {
      // Эта функция автоматически ищет в БД, а если не находит - ищет через интернет (Perplexity)
      // и сохраняет найденную личность в БД для кэширования
      console.log('[Generate] Searching for person:', searchName);
      const result = await findOrCreatePerson(searchName);
      historicalPerson = result.person;
      personInfo = result.personInfo;
      
      // Обновляем имя для генерации: используем полное имя с дополнительной информацией
      if (fullPersonName && additionalInfo) {
        personInfo.name = fullPersonName;
        // Добавляем дополнительную информацию в описание, если её там нет
        if (additionalInfo && !personInfo.description.toLowerCase().includes(additionalInfo.toLowerCase())) {
          personInfo.description = `${personInfo.description} ${additionalInfo}.`.trim();
        }
      }
      
      console.log('[Generate] Person found:', personInfo.name);
      if (additionalInfo) {
        console.log('[Generate] Additional info from brackets:', additionalInfo);
      }
    } catch (error: any) {
      console.error('[Generate] Error finding person:', error);
      return NextResponse.json(
        { 
          error: error.message || 'Failed to find information about this person',
          hint: 'Попробуйте указать полное имя исторической личности'
        },
        { status: 404 }
      );
    }

    // Генерация промпта
    console.log('[Generate] ===== Starting prompt generation =====');
    let prompt: string;
    try {
      prompt = await generateImagePrompt(personInfo, style);
      console.log('[Generate] ✓ Prompt generated successfully, length:', prompt.length);
      console.log('[Generate] Prompt preview:', prompt.substring(0, 100));
    } catch (error: any) {
      console.error('[Generate] ✗ CRITICAL: Error generating prompt (fallback should have worked):', error);
      // Fallback уже должен был сработать в generateImagePrompt, но на всякий случай
      return NextResponse.json(
        { 
          error: 'Failed to generate image prompt',
          details: error.message
        },
        { status: 500 }
      );
    }

    // Генерация изображения
    // Новый приоритет: Nano Banana → OpenAI gpt-image-1 → Replicate (Flux) как финальный fallback
    console.log('[Generate] ===== Starting image generation =====');

    let imageUrl: string | null = null;
    let imageSource = 'Unknown';

    // 1) Пытаемся использовать Nano Banana, если ключ установлен
    const hasNanoBananaKey = !!process.env.NANO_BANANA_API_KEY;
    if (hasNanoBananaKey) {
      console.log('[Generate] Attempting to generate image using Nano Banana...');
      try {
        imageUrl = await generateImageWithNanoBanana(prompt);
        imageSource = 'Nano Banana';
        console.log('[Generate] ✓ Image generated successfully with Nano Banana');
        console.log('[Generate] Image URL:', imageUrl.substring(0, 200) + '...');
      } catch (nanoError: any) {
        console.error('[Generate] ✗ Nano Banana failed with error:', {
          message: nanoError.message,
          status: nanoError.response?.status,
        });
      }
    } else {
      console.log('[Generate] NANO_BANANA_API_KEY not set, skipping Nano Banana and using OpenAI/Replicate pipeline...');
    }

    // 2) Если Nano Banana не сработал или ключа нет — пробуем OpenAI
    if (!imageUrl) {
      console.log('[Generate] Attempting to generate image using OpenAI gpt-image-1...');
      try {
        imageUrl = await generateImageWithOpenAI(prompt);
        imageSource = 'OpenAI gpt-image-1';
        console.log('[Generate] ✓ Image generated successfully with OpenAI gpt-image-1');
        console.log('[Generate] Image URL:', imageUrl.substring(0, 200) + '...');
      } catch (error: any) {
        // Логируем ошибку OpenAI
        console.error('[Generate] ✗ OpenAI gpt-image-1 failed with error:', {
          message: error.message,
          status: error.response?.status,
          code: error.code,
        });
        
        // 3) Fallback: если OpenAI не сработал, пробуем Replicate
        console.log('[Generate] ===== Attempting fallback to Replicate (Flux) =====');
        console.log('[Generate] Step 1: Checking if REPLICATE_API_KEY is available...');
        
        if (!process.env.REPLICATE_API_KEY) {
          console.error('[Generate] ✗ REPLICATE_API_KEY is not set! Cannot use fallback.');
          return NextResponse.json(
            { 
              error: 'Failed to generate image',
              details: `Nano Banana ${hasNanoBananaKey ? 'failed or not available; ' : 'not configured; '}OpenAI gpt-image-1 failed: ${error.message}. Replicate fallback unavailable: REPLICATE_API_KEY not set.`
            },
            { status: 500 }
          );
        }
        
        console.log('[Generate] REPLICATE_API_KEY found, attempting Replicate generation...');
        try {
          imageUrl = await generateImage(prompt);
          imageSource = 'Replicate (fallback)';
          console.log('[Generate] ✓ Fallback to Replicate successful!');
          console.log('[Generate] Image URL:', imageUrl);
        } catch (fallbackError: any) {
          console.error('[Generate] ✗ Fallback to Replicate also failed:', {
            message: fallbackError.message,
            status: fallbackError.response?.status,
            code: fallbackError.code,
          });
          return NextResponse.json(
            { 
              error: 'Failed to generate image',
              details: `Nano Banana ${hasNanoBananaKey ? 'failed or not available; ' : 'not configured; '}OpenAI gpt-image-1 failed: ${error.message}. Replicate fallback also failed: ${fallbackError.message}`
            },
            { status: 500 }
          );
        }
      }
    }

    if (!imageUrl) {
      // На всякий случай, если все ветки не вернули URL
      return NextResponse.json(
        { 
          error: 'Failed to generate image',
          details: 'All providers (Nano Banana, OpenAI, Replicate) failed or are not configured correctly.'
        },
        { status: 500 }
      );
    }

    console.log(`[Generate] ===== Image generation completed using ${imageSource} =====`);

    // Сохранение в БД
    // Используем полное имя с дополнительной информацией для сохранения
    const generation = await prisma.generation.create({
      data: {
        userId: dbUser.id,
        historicalPersonId: historicalPerson?.id,
        personName: personInfo.name, // Используем полное имя из personInfo (с дополнительной информацией)
        prompt,
        imageUrl,
        style,
        status: 'completed',
      },
    });

    return NextResponse.json({
      success: true,
      generation: {
        id: generation.id,
        imageUrl: generation.imageUrl,
        personName: generation.personName,
        createdAt: generation.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Generate] Error in generation pipeline:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
    });
    
    // Определяем тип ошибки для более понятного сообщения
    let errorMessage = 'Failed to generate image';
    let errorDetails = error.message;
    
    if (error.message?.includes('PERPLEXITY_API_KEY')) {
      errorMessage = 'Failed to search for person information';
      errorDetails = 'Perplexity API key is missing or invalid';
    } else if (error.message?.includes('OPENAI_API_KEY')) {
      errorMessage = 'Failed to generate image prompt';
      errorDetails = 'OpenAI API key is missing or invalid';
    } else if (error.message?.includes('REPLICATE_API_KEY')) {
      errorMessage = 'Failed to generate image';
      errorDetails = 'Replicate API key is missing or invalid';
    } else if (error.message?.includes('Failed to find information')) {
      errorMessage = error.message;
      errorDetails = 'Could not find information about this person';
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
      errorDetails = error.response.data.details || error.message;
    }
    
    // Сохранение ошибки в БД если есть пользователь
    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        const dbUser = await getUserSafe((session.user as any).telegramId);
        
        if (dbUser) {
          // Пытаемся получить personName из body, но не блокируем если не получится
          let personNameForError = 'Unknown';
          try {
            const body = await request.json();
            personNameForError = body.personName || 'Unknown';
          } catch (e) {
            // Игнорируем ошибку парсинга body
          }
          
          await prisma.generation.create({
            data: {
              userId: dbUser.id,
              personName: personNameForError,
              prompt: '',
              imageUrl: '',
              status: 'failed',
              errorMessage: errorDetails,
            },
          });
        }
      }
    } catch (dbError) {
      console.error('[Generate] Error saving failed generation:', dbError);
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
