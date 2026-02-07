import { GoogleGenerativeAI } from '@google/generative-ai';
import { PersonInfo } from './perplexity';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Генерация промпта для создания изображения исторической личности через Gemini
 */
export async function generateImagePrompt(
  personInfo: PersonInfo,
  style: string = 'realistic'
): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.error('[Gemini] GEMINI_API_KEY is not set in environment variables');
    throw new Error('GEMINI_API_KEY is not set. Please configure Gemini API key in Railway Variables. Get your key at https://makersuite.google.com/app/apikey');
  }

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
      response: error.response?.data,
    });

    // Fallback промпт
    const fallbackPrompt = `A realistic portrait of ${personInfo.name}, a historical figure from the ${personInfo.era} era, 
detailed facial features, period-appropriate clothing, professional photography, high quality, 8k resolution`;
    
    console.log('[Gemini] Using fallback prompt');
    return fallbackPrompt;
  }
}
