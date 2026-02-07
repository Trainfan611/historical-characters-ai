import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_IMAGE_API_URL = 'https://api.openai.com/v1/images/generations';

/**
 * Генерация изображения через OpenAI DALL-E
 */
export async function generateImageWithOpenAI(prompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    console.error('[OpenAI Image] OPENAI_API_KEY is not set in environment variables');
    throw new Error('OPENAI_API_KEY is not set. Please configure OpenAI API key in Railway Variables. Get your key at https://platform.openai.com/api-keys');
  }

  try {
    console.log('[OpenAI Image] Starting image generation with prompt:', prompt.substring(0, 100));
    console.log('[OpenAI Image] API key length:', OPENAI_API_KEY?.length || 0);
    
    const token = OPENAI_API_KEY?.trim();
    if (!token || token.length < 10) {
      throw new Error('OPENAI_API_KEY appears to be invalid (too short or empty)');
    }

    // Используем DALL-E 3 для генерации изображений (HD качество)
    const response = await axios.post(
      OPENAI_IMAGE_API_URL,
      {
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024', // DALL-E 3 поддерживает: 1024x1024, 1792x1024, 1024x1792
        quality: 'hd', // 'standard' или 'hd' - используем HD для лучшего качества
        response_format: 'url', // 'url' или 'b64_json'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 секунд для генерации
      }
    );

    const imageUrl = response.data.data?.[0]?.url;
    if (!imageUrl) {
      console.error('[OpenAI Image] No image URL in response:', response.data);
      throw new Error('Failed to generate image: No URL returned from OpenAI');
    }

    console.log('[OpenAI Image] Generation succeeded, image URL:', imageUrl);
    return imageUrl;
  } catch (error: any) {
    console.error('[OpenAI Image] Error generating image:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });
    
    // Специальная обработка ошибок OpenAI
    if (error.response?.status === 401) {
      throw new Error('OPENAI_API_KEY is invalid or expired. Please check your OpenAI API key at https://platform.openai.com/api-keys');
    }
    
    if (error.response?.status === 429) {
      const retryAfter = error.response?.headers?.['retry-after'];
      throw new Error(`OpenAI API rate limit exceeded. ${retryAfter ? `Retry after ${retryAfter} seconds.` : 'Please try again later.'}`);
    }
    
    if (error.response?.status === 400) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      throw new Error(`Invalid request to OpenAI API: ${errorMessage}`);
    }
    
    if (error.response?.status === 402) {
      throw new Error('OpenAI API payment required. Please check your OpenAI account balance.');
    }
    
    throw new Error(`Failed to generate image with OpenAI: ${error.message}`);
  }
}
