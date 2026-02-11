import axios from 'axios';
import { lookup } from 'dns';
import { promisify } from 'util';

const NANO_BANANA_API_KEY = process.env.NANO_BANANA_API_KEY;
// Согласно официальной документации: https://docs.nanobananaapi.ai/quickstart
const NANO_BANANA_BASE_URL = 'https://api.nanobananaapi.ai/api/v1/nanobanana';

// Настройка DNS lookup для IPv4 only (согласно рекомендациям из Habr)
// Статья: https://habr.com/ru/articles/992380/
const dnsLookup = promisify(lookup);

/**
 * Создает кастомный DNS lookup для IPv4 only
 * Согласно статье Habr: Google использует IPv6 для идентификации, нужно принудительно использовать IPv4
 */
function createIPv4Lookup() {
  return async (hostname: string, options: any, callback: any) => {
    try {
      const address = await dnsLookup(hostname, { family: 4 });
      callback(null, address.address, 4);
    } catch (error: any) {
      // Fallback на стандартный lookup если IPv4 не работает
      callback(error, null, null);
    }
  };
}

/**
 * Генерация изображения через Nano Banana API
 * Документация: https://docs.nanobananaapi.ai/quickstart
 */
export async function generateImageWithNanoBanana(prompt: string): Promise<string> {
  if (!NANO_BANANA_API_KEY) {
    console.error('[Nano Banana] NANO_BANANA_API_KEY is not set in environment variables');
    throw new Error('NANO_BANANA_API_KEY is not set. Please configure Nano Banana API key in Railway Variables. Get your key at https://nanobananaapi.ai/api-key');
  }

  try {
    console.log('[Nano Banana] Starting image generation with prompt:', prompt.substring(0, 100));
    console.log('[Nano Banana] API key length:', NANO_BANANA_API_KEY?.length || 0);

    const token = NANO_BANANA_API_KEY?.trim();
    if (!token || token.length < 10) {
      throw new Error('NANO_BANANA_API_KEY appears to be invalid (too short or empty)');
    }

    // Шаг 1: Создаем задачу генерации
    // Согласно документации: POST /api/v1/nanobanana/generate
    // Применяем рекомендации из Habr: https://habr.com/ru/articles/992380/
    console.log('[Nano Banana] Creating generation task...');
    
    // Настройка axios для IPv4 only и правильных заголовков
    // Согласно рекомендациям из Habr: https://habr.com/ru/articles/992380/
    // - Принудительное использование IPv4 (избегаем IPv6 утечек)
    // - Правильные заголовки для имитации обычного браузера
    const axiosConfig: any = {
      headers: {
        'Authorization': `Bearer ${token}`, // Согласно документации
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      },
      timeout: 30000,
      // Принудительное использование IPv4 (domainStrategy: UseIPv4)
      // В Node.js это делается через family: 4 и кастомный lookup
      family: 4, // IPv4 only
      lookup: createIPv4Lookup(),
    };
    
    const generateResponse = await axios.post(
      `${NANO_BANANA_BASE_URL}/generate`,
      {
        prompt: prompt,
        type: 'TEXTTOIAMGE', // Генерация из текста
        numImages: 1, // Генерируем 1 изображение
        // callBackUrl опционально, не используем для синхронного режима
      },
      axiosConfig
    );

    // Проверяем ответ
    // Nano Banana может возвращать ошибки как в HTTP статусе, так и в теле ответа (code)
    const httpStatus = generateResponse.status;
    const responseCode = generateResponse.data?.code;
    const responseMsg = generateResponse.data?.msg;
    
    // Проверяем HTTP статус код
    if (httpStatus === 401 || responseCode === 401) {
      const errorMsg = responseMsg || 'You do not have access permissions';
      console.error('[Nano Banana] Access denied (401):', {
        httpStatus,
        responseCode,
        msg: errorMsg,
        data: generateResponse.data,
      });
      throw new Error(`Nano Banana API access denied: ${errorMsg}. Please check your API key and permissions at https://nanobananaapi.ai/api-key`);
    }
    
    // Проверяем код ответа в теле (если не 200)
    if (responseCode && responseCode !== 200) {
      console.error('[Nano Banana] API returned error:', {
        httpStatus,
        code: responseCode,
        msg: responseMsg,
        data: generateResponse.data,
      });
      
      // Если ошибка доступа, выбрасываем понятную ошибку
      if (responseCode === 401 || responseMsg?.includes('access') || responseMsg?.includes('permission')) {
        throw new Error(`Nano Banana API access denied: ${responseMsg || 'You do not have access permissions'}. Please check your API key and permissions at https://nanobananaapi.ai/api-key`);
      }
      
      throw new Error(`Nano Banana API error: ${responseMsg || 'Unknown error'}`);
    }

    const taskId = generateResponse.data?.data?.taskId;
    if (!taskId) {
      throw new Error('Nano Banana API did not return taskId');
    }

    console.log('[Nano Banana] Task created successfully, taskId:', taskId);

    // Шаг 2: Ожидаем завершения генерации и получаем результат
    const imageUrl = await waitForTaskCompletion(token, taskId);
    
    console.log('[Nano Banana] ✓ Generation succeeded, image URL:', imageUrl);
    return imageUrl;
  } catch (error: any) {
    const errorStatus = error.response?.status;
    const errorData = error.response?.data;
    const errorCode = errorData?.code; // Код ошибки в теле ответа
    
    console.error('[Nano Banana] ✗ Error generating image:', {
      message: error.message,
      httpStatus: errorStatus,
      responseCode: errorCode,
      statusText: error.response?.statusText,
      responseData: errorData,
    });

    // Обработка различных типов ошибок
    // Проверяем и HTTP статус, и код в теле ответа
    if (errorStatus === 401 || errorCode === 401 || error.message?.includes('access') || error.message?.includes('permission')) {
      const errorMsg = errorData?.msg || error.message || 'You do not have access permissions';
      throw new Error(`Nano Banana API access denied: ${errorMsg}. Please check your API key and permissions at https://nanobananaapi.ai/api-key. Make sure your API key has access to image generation features.`);
    }

    if (errorStatus === 429 || errorCode === 429) {
      throw new Error('Nano Banana API rate limit exceeded. Please try again later.');
    }

    if (errorStatus === 400 || errorCode === 400) {
      const errorMessage = errorData?.msg || errorData?.message || error.message;
      throw new Error(`Invalid request to Nano Banana API: ${errorMessage}`);
    }

    // Пробрасываем ошибку дальше для fallback на OpenAI/Replicate
    throw new Error(`Failed to generate image with Nano Banana: ${error.message}`);
  }
}

/**
 * Ожидает завершения задачи и возвращает URL изображения
 * Согласно документации: GET /api/v1/nanobanana/record-info?taskId=taskId
 */
async function waitForTaskCompletion(apiKey: string, taskId: string, maxWaitTime: number = 300000): Promise<string> {
  const startTime = Date.now();
  const checkInterval = 3000; // Проверяем каждые 3 секунды
  let attempts = 0;
  const maxAttempts = Math.floor(maxWaitTime / checkInterval); // Максимум попыток

  console.log('[Nano Banana] Waiting for task completion, taskId:', taskId);

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, checkInterval));
    attempts++;

    try {
      // Применяем те же настройки для IPv4 only
      const statusResponse = await axios.get(
        `${NANO_BANANA_BASE_URL}/record-info`,
        {
          params: {
            taskId: taskId,
          },
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
          },
          timeout: 10000,
          family: 4, // IPv4 only
          lookup: createIPv4Lookup(),
        } as any
      );

      const taskData = statusResponse.data;
      const successFlag = taskData?.successFlag;

      // Согласно документации:
      // 0: GENERATING - Task is currently being processed
      // 1: SUCCESS - Task completed successfully
      // 2: CREATE_TASK_FAILED - Failed to create the task
      // 3: GENERATE_FAILED - Task creation succeeded but generation failed

      if (successFlag === 0) {
        // Генерация еще идет
        if (attempts % 10 === 0) { // Логируем каждые 10 попыток (30 секунд)
          console.log(`[Nano Banana] Task is generating... (attempt ${attempts}/${maxAttempts})`);
        }
        continue;
      }

      if (successFlag === 1) {
        // Успешно завершено
        const resultImageUrl = taskData?.response?.resultImageUrl;
        if (!resultImageUrl) {
          throw new Error('Task completed but no image URL in response');
        }
        console.log('[Nano Banana] Task completed successfully!');
        return resultImageUrl;
      }

      if (successFlag === 2) {
        const errorMsg = taskData?.errorMessage || 'Failed to create task';
        throw new Error(`Nano Banana task creation failed: ${errorMsg}`);
      }

      if (successFlag === 3) {
        const errorMsg = taskData?.errorMessage || 'Generation failed';
        throw new Error(`Nano Banana generation failed: ${errorMsg}`);
      }

      // Неизвестный статус
      console.warn('[Nano Banana] Unknown successFlag:', successFlag);
      continue;
    } catch (error: any) {
      // Если ошибка при проверке статуса, продолжаем попытки
      if (error.response?.status === 404) {
        // Задача еще не найдена, продолжаем ждать
        continue;
      }
      
      // Для других ошибок логируем, но продолжаем
      if (attempts % 10 === 0) {
        console.warn(`[Nano Banana] Error checking status (attempt ${attempts}):`, error.message);
      }
    }
  }

  throw new Error(`Nano Banana task timeout after ${maxWaitTime / 1000} seconds`);
}
