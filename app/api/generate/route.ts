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
    console.error('Error generating image:', error);
    
    // Сохранение ошибки в БД если есть пользователь
    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        const dbUser = await prisma.user.findUnique({
          where: { telegramId: (session.user as any).telegramId },
        });
        
        if (dbUser) {
          await prisma.generation.create({
            data: {
              userId: dbUser.id,
              personName: (await request.json()).personName || 'Unknown',
              prompt: '',
              imageUrl: '',
              status: 'failed',
              errorMessage: error.message || 'Unknown error',
            },
          });
        }
      }
    } catch (dbError) {
      console.error('Error saving failed generation:', dbError);
    }

    return NextResponse.json(
      { error: 'Failed to generate image', message: error.message },
      { status: 500 }
    );
  }
}
