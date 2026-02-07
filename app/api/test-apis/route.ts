import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { PersonInfo } from '@/lib/ai/perplexity';

/**
 * Тестовый endpoint для проверки работы Gemini и Nano Banana API
 * GET /api/test-apis
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: {
      gemini: { available: boolean; error?: string; details?: any };
      nanoBanana: { available: boolean; error?: string; details?: any };
      openai: { available: boolean; error?: string };
      replicate: { available: boolean; error?: string };
    } = {
      gemini: { available: false },
      nanoBanana: { available: false },
      openai: { available: false },
      replicate: { available: false },
    };

    // Проверка Gemini
    console.log('[Test APIs] Testing Gemini...');
    if (process.env.GEMINI_API_KEY) {
      try {
        const { generateImagePrompt } = await import('@/lib/ai/gemini');
        const testPersonInfo: PersonInfo = {
          name: 'Test Person',
          description: 'A test historical person',
          era: 'Modern',
          appearance: 'Average height, brown hair',
          style: 'realistic',
        };
        
        const prompt = await generateImagePrompt(testPersonInfo, 'realistic');
        results.gemini = {
          available: true,
          details: {
            promptLength: prompt.length,
            preview: prompt.substring(0, 100),
          },
        };
        console.log('[Test APIs] ✓ Gemini works');
      } catch (error: any) {
        results.gemini = {
          available: false,
          error: error.message,
          details: {
            status: error.response?.status,
            willUseFallback: true,
          },
        };
        console.log('[Test APIs] ✗ Gemini failed:', error.message);
      }
    } else {
      results.gemini = {
        available: false,
        error: 'GEMINI_API_KEY not set',
        details: { willUseFallback: true },
      };
      console.log('[Test APIs] Gemini key not set');
    }

    // Проверка Nano Banana
    console.log('[Test APIs] Testing Nano Banana...');
    if (process.env.NANO_BANANA_API_KEY) {
      try {
        const { generateImageWithNanoBanana } = await import('@/lib/ai/nano-banana');
        // Не генерируем реальное изображение, только проверяем создание задачи
        const testPrompt = 'A test image';
        
        // Пробуем создать задачу (но не ждем завершения)
        const axios = (await import('axios')).default;
        const response = await axios.post(
          'https://api.nanobananaapi.ai/api/v1/nanobanana/generate',
          {
            prompt: testPrompt,
            type: 'TEXTTOIAMGE',
            numImages: 1,
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.NANO_BANANA_API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );

        if (response.data?.code === 200 && response.data?.data?.taskId) {
          results.nanoBanana = {
            available: true,
            details: {
              taskId: response.data.data.taskId,
              message: 'Task created successfully',
            },
          };
          console.log('[Test APIs] ✓ Nano Banana works, taskId:', response.data.data.taskId);
        } else {
          results.nanoBanana = {
            available: false,
            error: response.data?.msg || 'Unknown error',
            details: {
              code: response.data?.code,
              willUseFallback: true,
            },
          };
        }
      } catch (error: any) {
        results.nanoBanana = {
          available: false,
          error: error.message,
          details: {
            status: error.response?.status,
            responseData: error.response?.data,
            willUseFallback: true,
          },
        };
        console.log('[Test APIs] ✗ Nano Banana failed:', error.message);
      }
    } else {
      results.nanoBanana = {
        available: false,
        error: 'NANO_BANANA_API_KEY not set',
        details: { willUseFallback: true },
      };
      console.log('[Test APIs] Nano Banana key not set');
    }

    // Проверка OpenAI (fallback для промптов)
    console.log('[Test APIs] Testing OpenAI (fallback for prompts)...');
    if (process.env.OPENAI_API_KEY) {
      results.openai = { available: true };
      console.log('[Test APIs] ✓ OpenAI key available');
    } else {
      results.openai = {
        available: false,
        error: 'OPENAI_API_KEY not set - CRITICAL: prompts will fail!',
      };
      console.log('[Test APIs] ✗ OpenAI key not set - CRITICAL!');
    }

    // Проверка Replicate (fallback для изображений)
    console.log('[Test APIs] Testing Replicate (fallback for images)...');
    if (process.env.REPLICATE_API_KEY) {
      results.replicate = { available: true };
      console.log('[Test APIs] ✓ Replicate key available');
    } else {
      results.replicate = {
        available: false,
        error: 'REPLICATE_API_KEY not set - CRITICAL: image generation will fail!',
      };
      console.log('[Test APIs] ✗ Replicate key not set - CRITICAL!');
    }

    // Определяем статус системы
    const systemStatus = {
      canGeneratePrompts: results.gemini.available || results.openai.available,
      canGenerateImages: results.nanoBanana.available || results.replicate.available,
      isFullyOperational: results.gemini.available && results.nanoBanana.available,
      usingFallbacks: {
        prompts: !results.gemini.available && results.openai.available,
        images: !results.nanoBanana.available && results.replicate.available,
      },
    };

    return NextResponse.json({
      status: 'completed',
      systemStatus,
      results,
      summary: {
        gemini: results.gemini.available ? '✅ Working' : `❌ ${results.gemini.error || 'Not configured'}`,
        nanoBanana: results.nanoBanana.available ? '✅ Working' : `❌ ${results.nanoBanana.error || 'Not configured'}`,
        openai: results.openai.available ? '✅ Available (fallback)' : `❌ ${results.openai.error || 'Not set'}`,
        replicate: results.replicate.available ? '✅ Available (fallback)' : `❌ ${results.replicate.error || 'Not set'}`,
      },
      recommendations: generateRecommendations(results, systemStatus),
    });
  } catch (error: any) {
    console.error('[Test APIs] Error testing APIs:', error);
    return NextResponse.json(
      {
        error: 'Failed to test APIs',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(
  results: any,
  systemStatus: any
): string[] {
  const recommendations: string[] = [];

  if (!results.openai.available) {
    recommendations.push('⚠️ CRITICAL: Add OPENAI_API_KEY to Railway for prompt generation');
  }

  if (!results.replicate.available) {
    recommendations.push('⚠️ CRITICAL: Add REPLICATE_API_KEY to Railway for image generation');
  }

  if (!results.gemini.available && results.openai.available) {
    recommendations.push('💡 Optional: Configure GEMINI_API_KEY and enable Generative Language API for better prompts');
  }

  if (!results.nanoBanana.available && results.replicate.available) {
    recommendations.push('💡 Optional: Configure NANO_BANANA_API_KEY for potentially cheaper image generation');
  }

  if (systemStatus.isFullyOperational) {
    recommendations.push('✅ All APIs are configured and working!');
  }

  if (systemStatus.canGeneratePrompts && systemStatus.canGenerateImages) {
    recommendations.push('✅ System is operational (using fallbacks if needed)');
  }

  return recommendations;
}
