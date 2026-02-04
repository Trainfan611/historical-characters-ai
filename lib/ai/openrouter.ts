import axios from 'axios';

// Используем Replicate API для генерации изображений (Flux модель)
// Альтернативно можно использовать OpenRouter, но он требует другой подход
const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY || process.env.OPENROUTER_API_KEY;
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

/**
 * Генерация изображения через Replicate (Flux модель)
 * Если REPLICATE_API_KEY не установлен, можно использовать OpenRouter через другой endpoint
 */
export async function generateImage(prompt: string): Promise<string> {
  // Попытка использовать Replicate если доступен
  if (REPLICATE_API_KEY && !process.env.OPENROUTER_API_KEY) {
    return await generateWithReplicate(prompt);
  }

  // Fallback: используем OpenRouter через правильный endpoint
  // Или можно использовать другой сервис
  return await generateWithOpenRouter(prompt);
}

/**
 * Генерация через Replicate API
 */
async function generateWithReplicate(prompt: string): Promise<string> {
  if (!REPLICATE_API_KEY) {
    throw new Error('REPLICATE_API_KEY is not set');
  }

  try {
    // Создаем prediction
    const createResponse = await axios.post(
      REPLICATE_API_URL,
      {
        version: 'black-forest-labs/flux-1.1-pro', // или другой version ID
        input: {
          prompt: prompt,
          num_outputs: 1,
        },
      },
      {
        headers: {
          Authorization: `Token ${REPLICATE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const predictionId = createResponse.data.id;
    let prediction = createResponse.data;

    // Ждем завершения генерации
    while (prediction.status === 'starting' || prediction.status === 'processing') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const statusResponse = await axios.get(
        `${REPLICATE_API_URL}/${predictionId}`,
        {
          headers: {
            Authorization: `Token ${REPLICATE_API_KEY}`,
          },
        }
      );
      
      prediction = statusResponse.data;
    }

    if (prediction.status === 'succeeded' && prediction.output?.[0]) {
      const imageUrl = prediction.output[0];
      // Скачиваем и сохраняем изображение локально
      return await downloadAndSaveImage(imageUrl);
    }

    throw new Error('Generation failed: ' + prediction.error);
  } catch (error: any) {
    console.error('Error generating with Replicate:', error);
    throw error;
  }
}

/**
 * Генерация через OpenRouter (альтернативный метод)
 * Примечание: OpenRouter может не поддерживать генерацию изображений напрямую
 * В этом случае нужно использовать другой сервис или настроить правильный endpoint
 */
async function generateWithOpenRouter(prompt: string): Promise<string> {
  // Для MVP используем заглушку или другой сервис
  // В production нужно настроить правильный endpoint для генерации изображений
  
  // Временное решение: возвращаем placeholder
  // В реальном проекте нужно использовать правильный API для генерации изображений
  throw new Error(
    'OpenRouter image generation not implemented. Please set REPLICATE_API_KEY or use another image generation service.'
  );
}

/**
 * Скачивание и сохранение изображения по URL
 */
async function downloadAndSaveImage(imageUrl: string): Promise<string> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  try {
    // Скачиваем изображение
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    const buffer = Buffer.from(response.data);
    
    // Определяем расширение из URL или Content-Type
    let ext = 'png';
    if (imageUrl.includes('.jpg') || imageUrl.includes('.jpeg')) {
      ext = 'jpg';
    } else if (imageUrl.includes('.webp')) {
      ext = 'webp';
    }
    
    // Создаем директорию если не существует
    const uploadDir = path.join(process.cwd(), 'public', 'generations');
    await fs.mkdir(uploadDir, { recursive: true });

    // Генерируем уникальное имя файла
    const filename = `generation-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Сохраняем файл
    await fs.writeFile(filepath, buffer);

    // Возвращаем URL
    return `/generations/${filename}`;
  } catch (error) {
    console.error('Error downloading image:', error);
    // Если не удалось скачать, возвращаем оригинальный URL
    return imageUrl;
  }
}
