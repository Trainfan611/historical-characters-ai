import axios from 'axios';

const NANO_BANANA_API_KEY = process.env.NANO_BANANA_API_KEY;
// Согласно официальной документации: https://docs.nanobananaapi.ai/quickstart
const NANO_BANANA_BASE_URL = 'https://api.nanobananaapi.ai/api/v1/nanobanana';

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
    console.log('[Nano Banana] Creating generation task...');
    const generateResponse = await axios.post(
      `${NANO_BANANA_BASE_URL}/generate`,
      {
        prompt: prompt,
        type: 'TEXTTOIAMGE', // Генерация из текста
        numImages: 1, // Генерируем 1 изображение
        // callBackUrl опционально, не используем для синхронного режима
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`, // Согласно документации
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    // Проверяем ответ
    if (generateResponse.data?.code !== 200) {
      throw new Error(`Nano Banana API error: ${generateResponse.data?.msg || 'Unknown error'}`);
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
    console.error('[Nano Banana] Error generating image:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });

    if (error.response?.status === 401) {
      throw new Error('NANO_BANANA_API_KEY is invalid or expired. Please check your API key at https://nanobananaapi.ai/api-key');
    }

    if (error.response?.status === 429) {
      throw new Error('Nano Banana API rate limit exceeded. Please try again later.');
    }

    if (error.response?.status === 400) {
      const errorMessage = error.response?.data?.msg || error.response?.data?.message || error.message;
      throw new Error(`Invalid request to Nano Banana API: ${errorMessage}`);
    }

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
      const statusResponse = await axios.get(
        `${NANO_BANANA_BASE_URL}/record-info`,
        {
          params: {
            taskId: taskId,
          },
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          timeout: 10000,
        }
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
