import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { searchHistoricalPerson } from '@/lib/ai/perplexity';
import { generateImagePrompt } from '@/lib/ai/openai';
import { generateImage } from '@/lib/ai/openrouter';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверка подписки
    const dbUser = await prisma.user.findUnique({
      where: { telegramId: (session.user as any).telegramId },
    });

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

    const body = await request.json();
    const { personName, personId, style = 'realistic' } = body;

    if (!personName && !personId) {
      return NextResponse.json(
        { error: 'Person name or ID is required' },
        { status: 400 }
      );
    }

    // Поиск или получение информации о личности
    // Используем улучшенную функцию поиска/создания через интернет
    const { findOrCreatePerson } = await import('@/lib/persons');
    
    const searchName = personName || (personId ? 
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
      console.log('[Generate] Person found:', personInfo.name);
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
    console.log('[Generate] Generating image prompt...');
    let prompt: string;
    try {
      prompt = await generateImagePrompt(personInfo, style);
      console.log('[Generate] Prompt generated:', prompt.substring(0, 100));
    } catch (error: any) {
      console.error('[Generate] Error generating prompt:', error);
      return NextResponse.json(
        { 
          error: 'Failed to generate image prompt',
          details: error.message
        },
        { status: 500 }
      );
    }

    // Генерация изображения
    console.log('[Generate] Generating image...');
    let imageUrl: string;
    try {
      imageUrl = await generateImage(prompt);
      console.log('[Generate] Image generated:', imageUrl);
    } catch (error: any) {
      console.error('[Generate] Error generating image:', error);
      return NextResponse.json(
        { 
          error: 'Failed to generate image',
          details: error.message
        },
        { status: 500 }
      );
    }

    // Сохранение в БД
    const generation = await prisma.generation.create({
      data: {
        userId: dbUser.id,
        historicalPersonId: historicalPerson?.id,
        personName: personInfo.name,
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
        const dbUser = await prisma.user.findUnique({
          where: { telegramId: (session.user as any).telegramId },
        });
        
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
