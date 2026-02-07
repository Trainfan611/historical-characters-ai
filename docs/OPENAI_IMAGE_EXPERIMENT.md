# Экспериментальная функция: OpenAI DALL-E для генерации изображений

## Описание

Это экспериментальная функция, которая использует OpenAI DALL-E 3 вместо Replicate для генерации изображений. DALL-E 3 может создавать более качественные и детализированные изображения.

## Как включить

1. Добавьте в Railway Variables (или `.env`):
   ```
   USE_OPENAI_FOR_IMAGE=true
   ```

2. Убедитесь, что у вас настроен `OPENAI_API_KEY` в Railway Variables

3. Перезапустите приложение на Railway

После этого система будет использовать OpenAI DALL-E 3 для генерации изображений вместо Replicate.

## Как откатить

### Быстрый откат (через переменную окружения)

1. Удалите или установите в Railway Variables:
   ```
   USE_OPENAI_FOR_IMAGE=false
   ```
   или просто удалите эту переменную

2. Перезапустите приложение

Система вернётся к использованию Replicate.

### Полный откат (удаление кода)

Если вы хотите полностью удалить экспериментальный код:

1. Удалите файл `lib/ai/openai-image.ts`
2. Удалите импорт из `app/api/generate/route.ts`:
   ```typescript
   import { generateImageWithOpenAI } from '@/lib/ai/openai-image';
   ```
3. Верните оригинальный код генерации изображения в `app/api/generate/route.ts`:
   ```typescript
   // Генерация изображения
   console.log('[Generate] Generating image...');
   let imageUrl: string;
   try {
     imageUrl = await generateImage(prompt);
     console.log('[Generate] Image generated:', imageUrl);
   } catch (error: any) {
     console.error('[Generate] Error generating image:', error);
     return NextResponse.json(
       { 
         error: 'Failed to generate image',
         details: error.message
       },
       { status: 500 }
     );
   }
   ```

## Преимущества OpenAI DALL-E 3

- **Высокое качество**: DALL-E 3 создаёт очень качественные и детализированные изображения
- **Лучшее понимание промптов**: DALL-E 3 лучше понимает сложные промпты и контекст
- **Единый API**: Используется тот же API ключ, что и для генерации промптов

## Недостатки

- **Стоимость**: DALL-E 3 дороже, чем Replicate (примерно $0.04-0.08 за изображение)
- **Скорость**: Может быть медленнее, чем Replicate
- **Ограничения**: DALL-E 3 имеет ограничения на размер изображения (1024x1024, 1792x1024, 1024x1792)
- **Rate limits**: OpenAI имеет более строгие лимиты на количество запросов

## Fallback

Если OpenAI DALL-E не сработает, система автоматически попробует использовать Replicate как fallback.

## Мониторинг

Следите за логами в Railway:
- `[Generate] Generating image using OpenAI DALL-E (experimental)...` - используется OpenAI
- `[Generate] Generating image using Replicate (default)...` - используется Replicate
- `[Generate] OpenAI failed, falling back to Replicate...` - OpenAI не сработал, используется fallback

## Сравнение стоимости

- **Replicate (Flux-dev)**: ~$0.003-0.005 за изображение
- **OpenAI DALL-E 3**: ~$0.04-0.08 за изображение

OpenAI примерно в 10-20 раз дороже, но может давать лучшее качество.
