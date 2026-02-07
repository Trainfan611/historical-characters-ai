import axios from 'axios';

const NANO_BANANA_API_KEY = process.env.NANO_BANANA_API_KEY;
const NANO_BANANA_API_URL = process.env.NANO_BANANA_API_URL || 'https://api.nanobanana.com/v1/images/generate';

/**
 * Генерация изображения через Nano Banana API
 */
export async function generateImageWithNanoBanana(prompt: string): Promise<string> {
  if (!NANO_BANANA_API_KEY) {
    console.error('[Nano Banana] NANO_BANANA_API_KEY is not set in environment variables');
    throw new Error('NANO_BANANA_API_KEY is not set. Please configure Nano Banana API key in Railway Variables.');
  }

  try {
    console.log('[Nano Banana] Starting image generation with prompt:', prompt.substring(0, 100));
    console.log('[Nano Banana] API key length:', NANO_BANANA_API_KEY?.length || 0);

    const token = NANO_BANANA_API_KEY?.trim();
    if (!token || token.length < 10) {
      throw new Error('NANO_BANANA_API_KEY appears to be invalid (too short or empty)');
    }

    // Стандартный формат для большинства API генерации изображений
    // Если формат API отличается, нужно будет скорректировать
    const response = await axios.post(
      NANO_BANANA_API_URL,
      {
        prompt: prompt,
        num_images: 1,
        width: 1024,
        height: 1024,
        steps: 30,
        guidance_scale: 7.5,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 2 минуты таймаут
      }
    );

    // Проверяем различные возможные форматы ответа
    let imageUrl: string | null = null;

    if (response.data?.image_url) {
      imageUrl = response.data.image_url;
    } else if (response.data?.url) {
      imageUrl = response.data.url;
    } else if (response.data?.data?.[0]?.url) {
      imageUrl = response.data.data[0].url;
    } else if (response.data?.output?.[0]) {
      imageUrl = response.data.output[0];
    } else if (Array.isArray(response.data) && response.data[0]) {
      imageUrl = response.data[0];
    } else if (typeof response.data === 'string') {
      imageUrl = response.data;
    }

    if (!imageUrl) {
      console.error('[Nano Banana] No image URL in response:', response.data);
      throw new Error('Failed to generate image: No URL returned from Nano Banana API');
    }

    console.log('[Nano Banana] Generation succeeded, image URL:', imageUrl);
    return imageUrl;
  } catch (error: any) {
    console.error('[Nano Banana] Error generating image:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });

    if (error.response?.status === 401) {
      throw new Error('NANO_BANANA_API_KEY is invalid or expired. Please check your API key.');
    }

    if (error.response?.status === 429) {
      const retryAfter = error.response?.headers?.['retry-after'];
      throw new Error(`Nano Banana API rate limit exceeded. ${retryAfter ? `Retry after ${retryAfter} seconds.` : 'Please try again later.'}`);
    }

    if (error.response?.status === 400) {
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || error.message;
      throw new Error(`Invalid request to Nano Banana API: ${errorMessage}`);
    }

    throw new Error(`Failed to generate image with Nano Banana: ${error.message}`);
  }
}
