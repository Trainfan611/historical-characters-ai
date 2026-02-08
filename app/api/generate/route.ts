import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { searchHistoricalPerson } from '@/lib/ai/perplexity';
import { generateImagePrompt } from '@/lib/ai/gemini';
import { generateImageWithGemini } from '@/lib/ai/gemini';
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
    // Используем ТОЛЬКО Gemini 2.5 Flash Image для генерации изображений
    console.log('[Generate] ===== Starting image generation =====');
    console.log('[Generate] Generating image using Gemini 2.5 Flash Image (Nano Banana)...');
    
    let imageUrl: string;
    let imageSource = 'Gemini 2.5 Flash Image';
    
    try {
      imageUrl = await generateImageWithGemini(prompt);
      console.log('[Generate] ✓ Image generated successfully with Gemini 2.5 Flash Image');
      console.log('[Generate] Image URL:', imageUrl.substring(0, 100) + '...');
    } catch (error: any) {
      // Логируем ошибку
      console.error('[Generate] ✗ Gemini 2.5 Flash Image failed with error:', {
        message: error.message,
        status: error.response?.status,
        code: error.code,
        stack: error.stack?.substring(0, 200),
      });
      
      // Возвращаем ошибку без fallback - используем только Gemini
      return NextResponse.json(
        { 
          error: 'Failed to generate image',
          details: `Gemini 2.5 Flash Image failed: ${error.message}. Please check GEMINI_API_KEY and ensure it has access to image generation models.`
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
