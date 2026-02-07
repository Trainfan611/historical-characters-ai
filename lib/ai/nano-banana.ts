import axios from 'axios';

const NANO_BANANA_API_KEY = process.env.NANO_BANANA_API_KEY;
// Согласно документации: https://www.nano-banana.run/tutorials/api-guide
const NANO_BANANA_BASE_URL = 'https://api.nanobanana.ai';
// Для генерации изображений из текста (если доступен)
const NANO_BANANA_GENERATE_URL = process.env.NANO_BANANA_API_URL || 
  `${NANO_BANANA_BASE_URL}/v1/images/generate`;

/**
 * Генерация изображения через Nano Banana API
 * Документация: https://www.nano-banana.run/tutorials/api-guide
 */
export async function generateImageWithNanoBanana(prompt: string): Promise<string> {
  if (!NANO_BANANA_API_KEY) {
    console.error('[Nano Banana] NANO_BANANA_API_KEY is not set in environment variables');
    throw new Error('NANO_BANANA_API_KEY is not set. Please configure Nano Banana API key in Railway Variables. Get your key from https://www.nano-banana.run');
  }

  try {
    console.log('[Nano Banana] Starting image generation with prompt:', prompt.substring(0, 100));
    console.log('[Nano Banana] API key length:', NANO_BANANA_API_KEY?.length || 0);
    console.log('[Nano Banana] API URL:', NANO_BANANA_GENERATE_URL);

    const token = NANO_BANANA_API_KEY?.trim();
    if (!token || token.length < 10) {
      throw new Error('NANO_BANANA_API_KEY appears to be invalid (too short or empty)');
    }

    // Согласно документации, используем Bearer токен
    // Пробуем endpoint для генерации из текста
    try {
      const response = await axios.post(
        NANO_BANANA_GENERATE_URL,
        {
          prompt: prompt,
          num_images: 1,
          width: 1024,
          height: 1024,
          // Дополнительные параметры, если поддерживаются
          steps: 30,
          guidance_scale: 7.5,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`, // Согласно документации
            'Content-Type': 'application/json',
          },
          timeout: 120000, // 2 минуты таймаут
        }
      );

      return extractImageUrl(response.data);
    } catch (error: any) {
      // Если endpoint /generate не существует, пробуем альтернативные варианты
      if (error.response?.status === 404) {
        console.log('[Nano Banana] /generate endpoint not found, trying alternative format...');
        return await tryAlternativeEndpoints(token, prompt);
      }
      
      // Если SSL ошибка
      if (error.code === 'EPROTO' || error.message?.includes('SSL') || error.message?.includes('tlsv1')) {
        console.log('[Nano Banana] SSL error detected, trying alternative format...');
        return await tryAlternativeEndpoints(token, prompt);
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
      throw new Error('NANO_BANANA_API_KEY is invalid or expired. Please check your API key at https://www.nano-banana.run');
    }

    if (error.response?.status === 429) {
      const retryAfter = error.response?.headers?.['retry-after'];
      throw new Error(`Nano Banana API rate limit exceeded (10 requests per minute). ${retryAfter ? `Retry after ${retryAfter} seconds.` : 'Please try again later.'}`);
    }

    if (error.response?.status === 400) {
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          error.message;
      throw new Error(`Invalid request to Nano Banana API: ${errorMessage}`);
    }

    if (error.response?.status === 500) {
      throw new Error('Nano Banana API internal server error. Please try again later.');
    }

    throw new Error(`Failed to generate image with Nano Banana: ${error.message}`);
  }
}

/**
 * Пробует альтернативные endpoints и форматы
 */
async function tryAlternativeEndpoints(apiKey: string, prompt: string): Promise<string> {
  // Пробуем разные возможные endpoints
  const alternatives = [
    `${NANO_BANANA_BASE_URL}/v1/generate`,
    `${NANO_BANANA_BASE_URL}/v1/images/create`,
    `${NANO_BANANA_BASE_URL}/v1/text-to-image`,
  ];

  for (const url of alternatives) {
    try {
      console.log('[Nano Banana] Trying alternative endpoint:', url);
      const response = await axios.post(
        url,
        {
          prompt: prompt,
          num_images: 1,
          width: 1024,
          height: 1024,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 120000,
        }
      );

      return extractImageUrl(response.data);
    } catch (error: any) {
      console.log(`[Nano Banana] Alternative endpoint ${url} failed:`, error.message);
      continue;
    }
  }

  // Если все альтернативы не сработали, пробуем Banana.dev формат
  console.log('[Nano Banana] All Nano Banana endpoints failed, trying Banana.dev format...');
  return await tryBananaDevFormat(apiKey, prompt);
}

/**
 * Пробует формат Banana.dev API (fallback)
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
      return await pollBananaDevTask(apiKey, response.data.id);
    }

    return extractImageUrl(response.data);
  } catch (error: any) {
    console.error('[Nano Banana] Banana.dev format also failed:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });
    // Пробрасываем ошибку дальше для fallback на Replicate
    throw new Error(`All Nano Banana API formats failed. Last error: ${error.message}`);
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
 * Поддерживает различные форматы ответа
 */
function extractImageUrl(data: any): string {
  // Проверяем различные возможные форматы ответа
  if (data?.image_url) {
    return data.image_url;
  }
  if (data?.url) {
    return data.url;
  }
  if (data?.image) {
    return data.image;
  }
  if (data?.data?.[0]?.url) {
    return data.data[0].url;
  }
  if (data?.data?.[0]?.image_url) {
    return data.data[0].image_url;
  }
  if (data?.output?.[0]) {
    return typeof data.output[0] === 'string' ? data.output[0] : data.output[0].url || data.output[0].image_url;
  }
  if (data?.modelOutputs?.[0]?.image_base64) {
    // Если это base64, возвращаем как есть (можно конвертировать в URL позже)
    return `data:image/png;base64,${data.modelOutputs[0].image_base64}`;
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
  throw new Error('Failed to generate image: No URL returned from Nano Banana API. Response format may be different.');
}
