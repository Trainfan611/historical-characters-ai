import axios from 'axios';
import { PersonInfo } from './perplexity';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Генерация промпта для создания изображения исторической личности
 */
export async function generateImagePrompt(
  personInfo: PersonInfo,
  style: string = 'realistic'
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

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

    const response = await axios.post(
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

    // Добавляем технические параметры для лучшего качества
    return `${prompt}, high quality, detailed, professional photography, 8k resolution, historical accuracy`;
  } catch (error) {
    console.error('Error generating prompt:', error);
    // Fallback промпт
    return `A realistic portrait of ${personInfo.name}, a historical figure from the ${personInfo.era} era, 
    detailed facial features, period-appropriate clothing, professional photography, high quality, 8k resolution`;
  }
}
