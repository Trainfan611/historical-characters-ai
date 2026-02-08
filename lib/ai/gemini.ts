import axios from 'axios';
import { PersonInfo } from './perplexity';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Согласно официальной документации: https://ai.google.dev/api?hl=ru
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Генерация промпта для создания изображения исторической личности через Gemini
 * Документация: https://ai.google.dev/api?hl=ru
 * С fallback на OpenAI если Gemini недоступен
 */
export async function generateImagePrompt(
  personInfo: PersonInfo,
  style: string = 'realistic'
): Promise<string> {
  // Пробуем использовать Gemini, если ключ есть
  if (GEMINI_API_KEY) {
    try {
      console.log('[Gemini] Starting prompt generation for:', personInfo.name);
      console.log('[Gemini] API key length:', GEMINI_API_KEY?.length || 0);

      // Согласно документации, используем заголовок x-goog-api-key
      const systemPrompt = `You are an expert at creating detailed prompts for AI image generation. 
Create a detailed, vivid description of a historical person that will be used to generate a realistic portrait.
Focus on physical appearance, clothing, setting, and historical accuracy.`;

      const userPrompt = `Create a detailed image generation prompt for ${personInfo.name}, 
a historical figure from the ${personInfo.era} era.

Information about the person:
${personInfo.description}

Era: ${personInfo.era}
${personInfo.country ? `Country: ${personInfo.country}` : ''}
${personInfo.birthYear ? `Born: ${personInfo.birthYear}` : ''}

Style: ${style}

Create a detailed prompt (2-3 sentences) that describes:
- Physical appearance and facial features
- Clothing and attire appropriate for the era
- Setting and background
- Lighting and mood
- Historical accuracy

The prompt should be in English and suitable for AI image generation models like Flux or Stable Diffusion.`;

      // Согласно документации, формат запроса:
      // {
      //   "contents": [
      //     {
      //       "parts": [
      //         {
      //           "text": "prompt text"
      //         }
      //       ]
      //     }
      //   ]
      // }
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

      const response = await axios.post(
        GEMINI_API_URL,
        {
          contents: [
            {
              parts: [
                {
                  text: fullPrompt,
                },
              ],
            },
          ],
        },
        {
          headers: {
            'x-goog-api-key': GEMINI_API_KEY, // Согласно документации
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      // Согласно документации, ответ имеет формат:
      // {
      //   "candidates": [
      //     {
      //       "content": {
      //         "parts": [
      //           {
      //             "text": "response text"
      //           }
      //         ],
      //         "role": "model"
      //       }
      //     }
      //   ]
      // }
      const prompt = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!prompt) {
        throw new Error('Failed to generate prompt from Gemini: No text in response');
      }

      console.log('[Gemini] Prompt generated successfully:', prompt.substring(0, 100));

      // Добавляем технические параметры для лучшего качества
      return `${prompt.trim()}, high quality, detailed, professional photography, 8k resolution, historical accuracy`;
    } catch (error: any) {
      const errorStatus = error.response?.status;
      console.error('[Gemini] ✗ Error generating prompt:', {
        message: error.message,
        status: errorStatus,
        statusText: error.response?.statusText,
      });

      // Всегда пробуем fallback на OpenAI при любой ошибке
      console.log('[Gemini] ===== Attempting fallback to OpenAI =====');
      console.log('[Gemini] Error status:', errorStatus || 'unknown');
      
      if (errorStatus === 403 || errorStatus === 401) {
        console.log('[Gemini] API not enabled or invalid key, using OpenAI fallback...');
      } else {
        console.log('[Gemini] Other error occurred, using OpenAI fallback...');
      }
      
      try {
        const fallbackPrompt = await generateImagePromptWithOpenAI(personInfo, style);
        console.log('[Gemini] ✓ OpenAI fallback successful');
        return fallbackPrompt;
      } catch (fallbackError: any) {
        console.error('[Gemini] ✗ OpenAI fallback also failed:', fallbackError.message);
        // Если даже fallback не сработал, пробрасываем ошибку дальше
        throw fallbackError;
      }
    }
  }

  // Если ключа Gemini нет, используем OpenAI
  console.log('[Gemini] GEMINI_API_KEY not set, using OpenAI...');
  return await generateImagePromptWithOpenAI(personInfo, style);
}

/**
 * Fallback: генерация промпта через OpenAI
 */
async function generateImagePromptWithOpenAI(
  personInfo: PersonInfo,
  style: string = 'realistic'
): Promise<string> {
  const { generateImagePrompt: openAIGeneratePrompt } = await import('./openai');
  return await openAIGeneratePrompt(personInfo, style);
}

/**
 * Генерация изображения через Gemini 2.5 Flash Image
 * Использует правильный формат API для генерации изображений
 * Документация: https://ai.google.dev/api?hl=ru
 */
export async function generateImageWithGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.error('[Gemini 2.5 Flash Image] GEMINI_API_KEY is not set in environment variables');
    throw new Error('GEMINI_API_KEY is not set. Please configure Gemini API key in Railway Variables. Get your key at https://ai.google.dev/');
  }

  try {
    console.log('[Gemini 2.5 Flash Image] Starting image generation with prompt:', prompt.substring(0, 100));
    console.log('[Gemini 2.5 Flash Image] API key length:', GEMINI_API_KEY?.length || 0);

    const token = GEMINI_API_KEY?.trim();
    if (!token || token.length < 10) {
      throw new Error('GEMINI_API_KEY appears to be invalid (too short or empty)');
    }

    // Используем правильный формат для Gemini API с generateContent
    // Модель gemini-2.5-flash поддерживает генерацию изображений через специальный формат
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    
    console.log('[Gemini 2.5 Flash Image] Creating image generation request...');
    
    // Формат запроса для Gemini API с генерацией изображений
    const response = await axios.post(
      `${geminiUrl}?key=${token}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Generate an image: ${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 секунд для генерации изображения
      }
    );

    // Проверяем ответ - Gemini может вернуть изображение в разных форматах
    const candidates = response.data?.candidates;
    if (candidates && candidates.length > 0) {
      const content = candidates[0]?.content;
      const parts = content?.parts;
      
      // Ищем изображение в ответе
      for (const part of parts || []) {
        if (part.inlineData) {
          // Если изображение в base64
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          
          // Конвертируем base64 в data URL
          const imageUrl = `data:${mimeType};base64,${imageData}`;
          console.log('[Gemini 2.5 Flash Image] ✓ Generation succeeded (base64 image)');
          return imageUrl;
        }
      }
      
      // Если есть текст с URL изображения
      const text = parts?.find((p: any) => p.text)?.text;
      if (text) {
        // Пытаемся найти URL в тексте
        const urlMatch = text.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          console.log('[Gemini 2.5 Flash Image] ✓ Generation succeeded, image URL:', urlMatch[0]);
          return urlMatch[0];
        }
      }
    }

    throw new Error('Gemini 2.5 Flash Image API did not return image data');
  } catch (error: any) {
    const errorStatus = error.response?.status;
    const errorData = error.response?.data;
    
    console.error('[Gemini 2.5 Flash Image] ✗ Error generating image:', {
      message: error.message,
      status: errorStatus,
      statusText: error.response?.statusText,
      responseData: errorData,
    });

    // Обработка различных типов ошибок
    if (errorStatus === 401 || errorStatus === 403 || error.message?.includes('access') || error.message?.includes('permission')) {
      const errorMsg = error.message?.includes('access') || error.message?.includes('permission') 
        ? error.message 
        : 'GEMINI_API_KEY is invalid or expired';
      throw new Error(`${errorMsg}. Please check your API key at https://ai.google.dev/`);
    }

    if (errorStatus === 429) {
      throw new Error('Gemini 2.5 Flash Image API rate limit exceeded. Please try again later.');
    }

    if (errorStatus === 400) {
      const errorMessage = errorData?.error?.message || errorData?.message || error.message;
      // Если API не поддерживает генерацию изображений, выбрасываем ошибку для fallback
      if (errorMessage?.includes('image') || errorMessage?.includes('generate')) {
        throw new Error('Gemini 2.5 Flash Image does not support direct image generation via this API. Falling back to Replicate.');
      }
      throw new Error(`Invalid request to Gemini 2.5 Flash Image API: ${errorMessage}`);
    }

    // Пробрасываем ошибку дальше для fallback на Replicate
    throw new Error(`Failed to generate image with Gemini 2.5 Flash Image: ${error.message}`);
  }
}