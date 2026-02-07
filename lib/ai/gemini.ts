import { GoogleGenerativeAI } from '@google/generative-ai';
import { PersonInfo } from './perplexity';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Генерация промпта для создания изображения исторической личности через Gemini
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

      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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

      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const prompt = response.text();

      if (!prompt) {
        throw new Error('Failed to generate prompt from Gemini');
      }

      console.log('[Gemini] Prompt generated successfully:', prompt.substring(0, 100));

      // Добавляем технические параметры для лучшего качества
      return `${prompt.trim()}, high quality, detailed, professional photography, 8k resolution, historical accuracy`;
    } catch (error: any) {
      console.error('[Gemini] Error generating prompt:', {
        message: error.message,
        status: error.status,
      });

      // Если ошибка 403 (API не включен) или другая ошибка, пробуем fallback на OpenAI
      if (error.status === 403 || error.message?.includes('SERVICE_DISABLED')) {
        console.log('[Gemini] API not enabled, falling back to OpenAI...');
        return await generateImagePromptWithOpenAI(personInfo, style);
      }

      // Для других ошибок тоже пробуем OpenAI
      console.log('[Gemini] Falling back to OpenAI due to error...');
      return await generateImagePromptWithOpenAI(personInfo, style);
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
