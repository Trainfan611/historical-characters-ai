# Настройка Gemini и Nano Banana

## Переменные окружения

Добавьте следующие переменные в Railway (или в ваш `.env.local` для локальной разработки):

### Gemini API (для генерации промптов)
```
GEMINI_API_KEY=your_gemini_api_key_here
```

**Где получить ключ:**
- Перейдите на https://makersuite.google.com/app/apikey
- Создайте новый API ключ
- Скопируйте ключ и добавьте в переменные окружения

**Важно:** После получения ключа нужно включить Generative Language API в Google Cloud Console:
- Перейдите по ссылке из ошибки (если появится) или на https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview
- Нажмите "Enable" (Включить)
- Подождите несколько минут для активации

**Fallback:** Если Gemini API не включен или недоступен, система автоматически использует OpenAI для генерации промптов.

### Nano Banana API (для генерации изображений)
```
NANO_BANANA_API_KEY=your_nano_banana_api_key_here
NANO_BANANA_API_URL=https://api.nanobanana.com/v1/images/generate
```

**Для Banana.dev (альтернативный формат):**
```
NANO_BANANA_API_KEY=your_banana_api_key
BANANA_API_URL=https://api.banana.dev/start/v1
BANANA_MODEL_KEY=flux
```

**Примечание:** 
- Если URL API отличается, обновите `NANO_BANANA_API_URL`
- Если используется Banana.dev, установите `BANANA_API_URL` и `BANANA_MODEL_KEY`
- Система автоматически пробует разные форматы API при ошибках
- Если формат API отличается от стандартного, может потребоваться корректировка в `lib/ai/nano-banana.ts`

## Как это работает

1. **Генерация промпта (Gemini)**:
   - Используется Google Gemini API (`gemini-pro` модель)
   - Создает детальный промпт на основе информации об исторической личности
   - Файл: `lib/ai/gemini.ts`

2. **Генерация изображения (Nano Banana)**:
   - Используется Nano Banana API для генерации изображений
   - Принимает промпт от Gemini и создает изображение
   - Файл: `lib/ai/nano-banana.ts`
   - Fallback: если Nano Banana не работает, используется Replicate

## Проверка работы

После добавления переменных окружения:

1. Перезапустите приложение на Railway
2. Попробуйте сгенерировать изображение исторической личности
3. Проверьте логи в Railway для отладки

## Отладка

### Если Gemini не работает:
- Проверьте, что `GEMINI_API_KEY` установлен
- Проверьте логи: `[Gemini] Error generating prompt`
- Убедитесь, что ключ валидный и не истек

### Если Nano Banana не работает:
- Проверьте, что `NANO_BANANA_API_KEY` установлен
- Проверьте, что `NANO_BANANA_API_URL` правильный
- Проверьте логи: `[Nano Banana] Error generating image`
- Если формат ответа API отличается, может потребоваться корректировка в `lib/ai/nano-banana.ts`

## Формат ответа Nano Banana API

Текущая реализация поддерживает следующие форматы ответа:
- `response.data.image_url`
- `response.data.url`
- `response.data.data[0].url`
- `response.data.output[0]`
- `response.data` (если это массив)
- `response.data` (если это строка)

Если ваш API возвращает другой формат, обновите функцию `generateImageWithNanoBanana` в `lib/ai/nano-banana.ts`.

## Откат к предыдущей версии

Если нужно вернуться к использованию OpenAI для промптов и Replicate/DALL-E для изображений:

1. В `app/api/generate/route.ts` замените:
   ```typescript
   import { generateImagePrompt } from '@/lib/ai/gemini';
   ```
   на:
   ```typescript
   import { generateImagePrompt } from '@/lib/ai/openai';
   ```

2. В секции генерации изображения замените:
   ```typescript
   imageUrl = await generateImageWithNanoBanana(prompt);
   ```
   на:
   ```typescript
   imageUrl = await generateImage(prompt); // или generateImageWithOpenAI(prompt)
   ```

3. Удалите переменные `GEMINI_API_KEY` и `NANO_BANANA_API_KEY` из окружения
