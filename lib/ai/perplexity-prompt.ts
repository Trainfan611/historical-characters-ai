import axios from 'axios';
import { PersonInfo } from './perplexity';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * Экспериментальная функция: генерация промпта для изображения через Perplexity
 * Вместо OpenAI используем Perplexity для создания более детального промпта
 * на основе информации из интернета
 */
export async function generateImagePromptWithPerplexity(
  personInfo: PersonInfo,
  style: string = 'realistic'
): Promise<string> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY is not set');
  }

  try {
    console.log('[Perplexity Prompt] Generating image prompt for:', personInfo.name);
    
    const prompt = `Create a detailed, vivid image generation prompt for ${personInfo.name}, 
    a historical figure from the ${personInfo.era} era.
    
    Information about the person:
    ${personInfo.description}
    
    Era: ${personInfo.era}
    ${personInfo.country ? `Country: ${personInfo.country}` : ''}
    ${personInfo.birthYear ? `Born: ${personInfo.birthYear}` : ''}
    ${personInfo.deathYear ? `Died: ${personInfo.deathYear}` : ''}
    
    Style: ${style}
    
    Create a detailed prompt (2-3 sentences) that describes:
    - Physical appearance and facial features based on historical records, portraits, or photographs
    - Clothing and attire appropriate for the era and their social status
    - Setting and background that reflects their historical period
    - Lighting and mood that captures their character
    - Historical accuracy and authenticity
    
    The prompt should be in English and suitable for AI image generation models like Flux or Stable Diffusion.
    Be specific about visual details, colors, textures, and historical context.
    Focus on creating a realistic, professional portrait that accurately represents this historical figure.`;

    const models = [
      'llama-3.1-sonar-huge-128k-online',
      'llama-3.1-sonar-small-128k-online',
      'sonar',
      'llama-3.1-70b-instruct',
    ];

    let lastError: any = null;

    for (const model of models) {
      try {
        console.log(`[Perplexity Prompt] Trying model: ${model}`);

        const response = await axios.post(
          PERPLEXITY_API_URL,
          {
            model: model,
            messages: [
              {
                role: 'system',
                content: 'You are an expert at creating detailed prompts for AI image generation. You create vivid, specific descriptions of historical figures based on real information from the internet, historical records, portraits, and photographs. Your prompts are detailed, accurate, and optimized for AI image generation models.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.8,
            max_tokens: 400,
          },
          {
            headers: {
              Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        );

        const content = response.data.choices?.[0]?.message?.content;
        if (!content) {
          console.warn(`[Perplexity Prompt] No content from model: ${model}`);
          continue;
        }

        console.log(`[Perplexity Prompt] Received prompt (${content.length} chars) from model: ${model}`);
        console.log('[Perplexity Prompt] Prompt preview:', content.substring(0, 200));

        // Очищаем промпт от лишних символов и форматирования
        let cleanPrompt = content.trim();
        
        // Удаляем маркеры кода, если есть
        cleanPrompt = cleanPrompt.replace(/```[\s\S]*?```/g, '');
        cleanPrompt = cleanPrompt.replace(/`/g, '');
        
        // Удаляем префиксы типа "Prompt:" или "Image prompt:"
        cleanPrompt = cleanPrompt.replace(/^(prompt|image prompt|description):\s*/i, '');
        
        // Добавляем технические параметры для лучшего качества
        const finalPrompt = `${cleanPrompt}, high quality, detailed, professional photography, 8k resolution, historical accuracy`;
        
        console.log('[Perplexity Prompt] Final prompt length:', finalPrompt.length);
        return finalPrompt;
      } catch (error: any) {
        console.warn(`[Perplexity Prompt] Model ${model} failed:`, {
          message: error.message,
          status: error.response?.status,
        });
        lastError = error;
        continue;
      }
    }

    // Если все модели не сработали, используем fallback
    throw lastError || new Error('All Perplexity models failed');
  } catch (error: any) {
    console.error('[Perplexity Prompt] Error generating prompt:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Fallback: создаем базовый промпт на основе имеющейся информации
    console.log('[Perplexity Prompt] Using fallback prompt');
    return `A realistic portrait of ${personInfo.name}, a historical figure from the ${personInfo.era} era, 
    ${personInfo.appearance || 'detailed facial features'}, period-appropriate clothing, 
    ${personInfo.country ? `from ${personInfo.country},` : ''} 
    professional photography, high quality, detailed, 8k resolution, historical accuracy`;
  }
}
