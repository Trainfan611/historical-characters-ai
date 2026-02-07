import { GoogleGenerativeAI } from '@google/generative-ai';
import { PersonInfo } from './perplexity';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Fallback на OpenAI

/**
 * Генерация промпта для создания изображения исторической личности
 * Использует Google Gemini API (в 66 раз дешевле OpenAI)
 * Fallback на OpenAI если Gemini недоступен
 */
export async function generateImagePrompt(
  personInfo: PersonInfo,
  style: string = 'realistic'
): Promise<string> {
  // Пробуем сначала Gemini (дешевле)
  if (GEMINI_API_KEY) {
    try {
      return await generateWithGemini(personInfo, style);
    } catch (error) {
      console.error('[Gemini] Error, falling back to OpenAI:', error);
      // Fallback на OpenAI если Gemini не работает
      if (OPENAI_API_KEY) {
        return await generateWithOpenAI(personInfo, style);
      }
      throw error;
    }
  }
  
  // Если Gemini не настроен, используем OpenAI
  if (OPENAI_API_KEY) {
    return await generateWithOpenAI(personInfo, style);
  }
  
  throw new Error('Neither GEMINI_API_KEY nor OPENAI_API_KEY is set');
}

/**
 * Генерация через Google Gemini API (дешевле в 66 раз)
 */
async function generateWithGemini(
  personInfo: PersonInfo,
  style: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  try {
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

    const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
    const response = await result.response;
    const prompt = response.text();

    if (!prompt) {
      throw new Error('Failed to generate prompt with Gemini');
    }

    // Добавляем технические параметры для лучшего качества
    return `${prompt}, high quality, detailed, professional photography, 8k resolution, historical accuracy`;
  } catch (error: any) {
    console.error('[Gemini] Error generating prompt:', error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

/**
 * Генерация через OpenAI API (fallback)
 */
async function generateWithOpenAI(
  personInfo: PersonInfo,
  style: string
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const axios = await import('axios');
  const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

  try {
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

    const response = await axios.default.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const prompt = response.data.choices[0]?.message?.content;
    if (!prompt) {
      throw new Error('Failed to generate prompt');
    }

    return `${prompt}, high quality, detailed, professional photography, 8k resolution, historical accuracy`;
  } catch (error: any) {
    console.error('[OpenAI] Error generating prompt:', error);
    // Fallback промпт
    return `A realistic portrait of ${personInfo.name}, a historical figure from the ${personInfo.era} era, 
    detailed facial features, period-appropriate clothing, professional photography, high quality, 8k resolution`;
  }
}
