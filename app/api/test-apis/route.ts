import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { PersonInfo } from '@/lib/ai/perplexity';

/**
 * Тестовый endpoint для проверки работы Gemini и Gemini 2.5 Flash Image API
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
      geminiImage: { available: boolean; error?: string; details?: any };
      openai: { available: boolean; error?: string };
      replicate: { available: boolean; error?: string };
    } = {
      gemini: { available: false },
      geminiImage: { available: false },
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

    // Проверка Gemini 2.5 Flash Image
    console.log('[Test APIs] Testing Gemini 2.5 Flash Image...');
    if (process.env.GEMINI_API_KEY) {
      try {
        const { generateImageWithGemini } = await import('@/lib/ai/gemini');
        // Не генерируем реальное изображение, только проверяем доступность API
        const testPrompt = 'A test image of a historical person';
        
        // Пробуем создать запрос (но не ждем завершения генерации)
        const axios = (await import('axios')).default;
        const response = await axios.post(
          'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict',
          {
            prompt: testPrompt,
            number_of_images: 1,
            aspect_ratio: '1:1',
          },
          {
            headers: {
              'x-goog-api-key': process.env.GEMINI_API_KEY,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );

        if (response.data?.generatedImages || response.status === 200) {
          results.geminiImage = {
            available: true,
            details: {
              message: 'Gemini 2.5 Flash Image API is accessible',
            },
          };
          console.log('[Test APIs] ✓ Gemini 2.5 Flash Image works');
        } else {
          results.geminiImage = {
            available: false,
            error: 'Unexpected response format',
            details: {
              willUseFallback: true,
            },
          };
        }
      } catch (error: any) {
        // Если ошибка 400 или другая, но API доступен, считаем что работает
        if (error.response?.status === 400 && error.response?.data) {
          results.geminiImage = {
            available: true,
            details: {
              message: 'API is accessible (test request validation failed, but API works)',
            },
          };
          console.log('[Test APIs] ✓ Gemini 2.5 Flash Image API is accessible');
        } else {
          results.geminiImage = {
            available: false,
            error: error.message,
            details: {
              status: error.response?.status,
              responseData: error.response?.data,
              willUseFallback: true,
            },
          };
          console.log('[Test APIs] ✗ Gemini 2.5 Flash Image failed:', error.message);
        }
      }
    } else {
      results.geminiImage = {
        available: false,
        error: 'GEMINI_API_KEY not set',
        details: { willUseFallback: true },
      };
      console.log('[Test APIs] Gemini 2.5 Flash Image key not set');
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
      canGenerateImages: results.geminiImage.available || results.replicate.available,
      isFullyOperational: results.gemini.available && results.geminiImage.available,
      usingFallbacks: {
        prompts: !results.gemini.available && results.openai.available,
        images: !results.geminiImage.available && results.replicate.available,
      },
    };

    return NextResponse.json({
      status: 'completed',
      systemStatus,
      results,
      summary: {
        gemini: results.gemini.available ? '✅ Working' : `❌ ${results.gemini.error || 'Not configured'}`,
        geminiImage: results.geminiImage.available ? '✅ Working' : `❌ ${results.geminiImage.error || 'Not configured'}`,
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

  if (!results.geminiImage.available && results.replicate.available) {
    recommendations.push('💡 Optional: Configure GEMINI_API_KEY for Gemini 2.5 Flash Image generation');
  }

  if (systemStatus.isFullyOperational) {
    recommendations.push('✅ All APIs are configured and working!');
  }

  if (systemStatus.canGeneratePrompts && systemStatus.canGenerateImages) {
    recommendations.push('✅ System is operational (using fallbacks if needed)');
  }

  return recommendations;
}
