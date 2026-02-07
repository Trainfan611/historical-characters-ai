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
