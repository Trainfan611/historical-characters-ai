import axios from 'axios';

const NANO_BANANA_API_KEY = process.env.NANO_BANANA_API_KEY;
// Пробуем разные возможные URL для Banana.dev или Nano Banana
const NANO_BANANA_API_URL = process.env.NANO_BANANA_API_URL || 
  process.env.BANANA_API_URL;

/**
 * Генерация изображения через Nano Banana / Banana.dev API
 */
export async function generateImageWithNanoBanana(prompt: string): Promise<string> {
  if (!NANO_BANANA_API_KEY) {
    console.error('[Nano Banana] NANO_BANANA_API_KEY is not set in environment variables');
    throw new Error('NANO_BANANA_API_KEY is not set. Please configure Nano Banana API key in Railway Variables.');
  }

  try {
    console.log('[Nano Banana] Starting image generation with prompt:', prompt.substring(0, 100));
    console.log('[Nano Banana] API key length:', NANO_BANANA_API_KEY?.length || 0);
    console.log('[Nano Banana] API URL:', NANO_BANANA_API_URL || 'not set');

    const token = NANO_BANANA_API_KEY?.trim();
    if (!token || token.length < 10) {
      throw new Error('NANO_BANANA_API_KEY appears to be invalid (too short or empty)');
    }

    // Если URL не указан, пробуем стандартные варианты
    if (!NANO_BANANA_API_URL) {
      console.log('[Nano Banana] No API URL specified, trying Banana.dev format...');
      return await tryBananaDevFormat(token, prompt);
    }

    // Пробуем указанный URL
    try {
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
          timeout: 120000,
        }
      );

      return extractImageUrl(response.data);
    } catch (error: any) {
      // Если SSL ошибка или другая ошибка, пробуем Banana.dev формат
      if (error.code === 'EPROTO' || error.message?.includes('SSL') || error.message?.includes('tlsv1')) {
        console.log('[Nano Banana] SSL error detected, trying Banana.dev format...');
        return await tryBananaDevFormat(token, prompt);
      }
      throw error;
    }
  } catch (error: any) {
    console.error('[Nano Banana] Error generating image:', {
      message: error.message,
      code: error.code,
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

/**
 * Пробует формат Banana.dev API
 */
async function tryBananaDevFormat(apiKey: string, prompt: string): Promise<string> {
  const bananaUrl = process.env.BANANA_API_URL || 'https://api.banana.dev/start/v1';
  const modelKey = process.env.BANANA_MODEL_KEY || 'flux';
  
  console.log('[Nano Banana] Trying Banana.dev format with URL:', bananaUrl);
  
  try {
    const response = await axios.post(
      bananaUrl,
      {
        modelKey: modelKey,
        modelInputs: {
          prompt: prompt,
          num_outputs: 1,
          aspect_ratio: '1:1',
        },
      },
      {
        headers: {
          'X-Banana-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 120000,
      }
    );

    // Banana.dev возвращает ID задачи, нужно проверить статус
    if (response.data?.id) {
      console.log('[Nano Banana] Banana.dev task created:', response.data.id);
      // Нужно опросить статус задачи
      return await pollBananaDevTask(apiKey, response.data.id);
    }

    return extractImageUrl(response.data);
  } catch (error: any) {
    console.error('[Nano Banana] Banana.dev format also failed:', error.message);
    throw new Error(`Both API formats failed. Last error: ${error.message}`);
  }
}

/**
 * Опрашивает статус задачи Banana.dev
 */
async function pollBananaDevTask(apiKey: string, taskId: string, maxAttempts: number = 60): Promise<string> {
  const checkUrl = `https://api.banana.dev/check/v1`;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Ждем 2 секунды
    
    try {
      const response = await axios.post(
        checkUrl,
        {
          id: taskId,
        },
        {
          headers: {
            'X-Banana-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const data = response.data;
      
      if (data?.modelOutputs?.[0]) {
        return extractImageUrl(data.modelOutputs[0]);
      }
      
      if (data?.finished === true && data?.modelOutputs) {
        return extractImageUrl(data.modelOutputs);
      }
      
      if (data?.message?.includes('error') || data?.error) {
        throw new Error(data.message || data.error || 'Banana.dev task failed');
      }
    } catch (error: any) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      console.log(`[Nano Banana] Polling attempt ${attempt + 1}/${maxAttempts}...`);
    }
  }
  
  throw new Error('Banana.dev task timeout');
}

/**
 * Извлекает URL изображения из ответа API
 */
function extractImageUrl(data: any): string {
  if (data?.image_url) {
    return data.image_url;
  }
  if (data?.url) {
    return data.url;
  }
  if (data?.data?.[0]?.url) {
    return data.data[0].url;
  }
  if (data?.output?.[0]) {
    return data.output[0];
  }
  if (data?.modelOutputs?.[0]?.image_base64) {
    // Если это base64, нужно конвертировать или вернуть как есть
    return data.modelOutputs[0].image_base64;
  }
  if (data?.modelOutputs?.[0]?.image_url) {
    return data.modelOutputs[0].image_url;
  }
  if (Array.isArray(data) && data[0]) {
    return typeof data[0] === 'string' ? data[0] : data[0].url || data[0].image_url;
  }
  if (typeof data === 'string') {
    return data;
  }
  
  console.error('[Nano Banana] No image URL in response:', JSON.stringify(data).substring(0, 200));
  throw new Error('Failed to generate image: No URL returned from Nano Banana API');
}
