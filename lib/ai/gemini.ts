import axios from 'axios';
import { PersonInfo } from './perplexity';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Отдельный ключ для генерации изображений (Nano Banana / Gemini Image API)
const NANO_BANANA_API_KEY = process.env.NANO_BANANA_API_KEY || process.env.GEMINI_API_KEY; // Fallback на GEMINI_API_KEY если NANO_BANANA_API_KEY не установлен
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
 * Генерация изображения через Gemini 2.5 Flash Image (Nano Banana)
 * Использует правильный формат API согласно официальной документации
 * Документация: https://ai.google.dev/gemini-api/docs/image-generation?hl=ru
 * Пример: https://github.com/google-gemini/gemini-image-editing-nextjs-quickstart
 */
export async function generateImageWithGemini(prompt: string): Promise<string> {
  // Используем NANO_BANANA_API_KEY если установлен, иначе fallback на GEMINI_API_KEY
  const apiKey = NANO_BANANA_API_KEY || GEMINI_API_KEY;
  const keyName = NANO_BANANA_API_KEY ? 'NANO_BANANA_API_KEY' : 'GEMINI_API_KEY';
  
  if (!apiKey) {
    console.error('[Gemini 2.5 Flash Image] Neither NANO_BANANA_API_KEY nor GEMINI_API_KEY is set in environment variables');
    throw new Error('NANO_BANANA_API_KEY or GEMINI_API_KEY is not set. Please configure Nano Banana/Gemini API key in Railway Variables. Get your key at https://ai.google.dev/ or https://nanobananaapi.ai/');
  }

  try {
    console.log('[Gemini 2.5 Flash Image] Starting image generation with prompt:', prompt.substring(0, 100));
    console.log(`[Gemini 2.5 Flash Image] Using ${keyName}, API key length:`, apiKey?.length || 0);

    const token = apiKey?.trim();
    if (!token || token.length < 10) {
      throw new Error('GEMINI_API_KEY appears to be invalid (too short or empty)');
    }

    // Список моделей для генерации изображений (в порядке приоритета)
    // Согласно документации: https://ai.google.dev/gemini-api/docs/image-generation?hl=ru
    const imageModels = [
      'gemini-2.5-flash-image-preview',      // Основная модель для генерации изображений
      'gemini-3-pro-image-preview',           // Более продвинутая модель (если доступна)
      'gemini-2.0-flash-exp-image-generation', // Старая модель (fallback)
    ];

    console.log('[Gemini 2.5 Flash Image] Creating image generation request...');
    
    // Пробуем каждую модель по очереди
    let lastError: any = null;
    for (const modelName of imageModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
        console.log(`[Gemini 2.5 Flash Image] Trying model: ${modelName}`);
        
        // Формат запроса согласно документации и примерам
        // responseModalities: ["Text", "Image"] - обязательно для генерации изображений
        const response = await axios.post(
          `${geminiUrl}?key=${token}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 1,
              topP: 0.95,
              topK: 40,
              responseModalities: ["Text", "Image"], // Ключевой параметр для генерации изображений
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 120000, // 120 секунд для генерации изображения (может занять время)
          }
        );

        // Обрабатываем ответ согласно документации
        // Ответ содержит candidates[0].content.parts где каждый part может быть inlineData (изображение) или text
        const candidates = response.data?.candidates;
        if (!candidates || candidates.length === 0) {
          throw new Error('Gemini 2.5 Flash Image API returned no candidates');
        }

        const content = candidates[0]?.content;
        if (!content) {
          throw new Error('Gemini 2.5 Flash Image API returned no content');
        }

        const parts = content.parts || [];
        console.log(`[Gemini 2.5 Flash Image] Model ${modelName} response parts count:`, parts.length);

        // Ищем изображение в ответе (inlineData)
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            // Изображение в base64 формате
            const imageData = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            
            console.log(`[Gemini 2.5 Flash Image] ✓ Generation succeeded with model ${modelName}`);
            console.log('[Gemini 2.5 Flash Image] Image data received, length:', imageData.length, 'MIME type:', mimeType);
            
            // Конвертируем base64 в data URL для использования в браузере
            const imageUrl = `data:${mimeType};base64,${imageData}`;
            return imageUrl;
          }
        }

        // Если изображения нет, проверяем текст (может содержать описание или ошибку)
        const textParts = parts.filter((p: any) => p.text);
        if (textParts.length > 0) {
          const text = textParts[0].text;
          console.warn(`[Gemini 2.5 Flash Image] Model ${modelName}: No image data found, but text response:`, text.substring(0, 100));
        }

        throw new Error(`Model ${modelName} did not return image data in response`);
      } catch (modelError: any) {
        // Если модель не работает, пробуем следующую
        const errorStatus = modelError.response?.status;
        const errorMessage = modelError.response?.data?.error?.message || modelError.message;
        
        console.warn(`[Gemini 2.5 Flash Image] Model ${modelName} failed:`, {
          status: errorStatus,
          message: errorMessage,
        });
        
        lastError = modelError;
        
        // Если это не ошибка "модель не найдена", пробуем следующую
        if (errorStatus === 404 || errorMessage?.includes('not found') || errorMessage?.includes('not supported')) {
          console.log(`[Gemini 2.5 Flash Image] Model ${modelName} not available, trying next model...`);
          continue; // Пробуем следующую модель
        }
        
        // Для других ошибок тоже пробуем следующую модель
        continue;
      }
    }
    
    // Если все модели не сработали, пробрасываем последнюю ошибку
    throw lastError || new Error('All Gemini image generation models failed');
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
        : `${keyName} is invalid or expired`;
      throw new Error(`${errorMsg}. Please check your API key at https://ai.google.dev/ or https://nanobananaapi.ai/`);
    }

    if (errorStatus === 429) {
      throw new Error('Gemini 2.5 Flash Image API rate limit exceeded. Please try again later.');
    }

    if (errorStatus === 400) {
      const errorMessage = errorData?.error?.message || errorData?.message || error.message;
      throw new Error(`Invalid request to Gemini 2.5 Flash Image API: ${errorMessage}`);
    }

    // Пробрасываем ошибку дальше
    throw new Error(`Failed to generate image with Gemini 2.5 Flash Image: ${error.message}`);
  }
}