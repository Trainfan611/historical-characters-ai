# Инструкция по откату экспериментальной функции OpenAI DALL-E

## Быстрый откат (рекомендуется)

### Через Railway Variables:

1. Откройте Railway Dashboard
2. Перейдите в Variables вашего проекта
3. Найдите переменную `USE_OPENAI_FOR_IMAGE`
4. Удалите её или установите значение `false`
5. Перезапустите приложение

После этого система вернётся к использованию Replicate для генерации изображений.

## Полный откат (удаление кода)

Если вы хотите полностью удалить экспериментальный код:

### Шаг 1: Удалите файл
```bash
rm lib/ai/openai-image.ts
```

### Шаг 2: Откатите изменения в `app/api/generate/route.ts`

Замените текущий код генерации изображения на:

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

И удалите импорт:
```typescript
import { generateImageWithOpenAI } from '@/lib/ai/openai-image';
```

### Шаг 3: Закоммитьте изменения
```bash
git add .
git commit -m "Revert: Remove OpenAI DALL-E experiment, back to Replicate"
git push origin main
```

## Проверка отката

После отката проверьте логи:
- Должно быть: `[Generate] Generating image using Replicate (default)...`
- Не должно быть: `[Generate] Generating image using OpenAI DALL-E (experimental)...`
