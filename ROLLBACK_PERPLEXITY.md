# Инструкция по откату экспериментальной функции Perplexity

## Быстрый откат (рекомендуется)

### Через Railway Variables:

1. Откройте Railway Dashboard
2. Перейдите в Variables вашего проекта
3. Найдите переменную `USE_PERPLEXITY_FOR_PROMPT`
4. Удалите её или установите значение `false`
5. Перезапустите приложение

После этого система вернётся к использованию OpenAI для генерации промптов.

## Полный откат (удаление кода)

Если вы хотите полностью удалить экспериментальный код:

### Шаг 1: Удалите файл
```bash
rm lib/ai/perplexity-prompt.ts
```

### Шаг 2: Откатите изменения в `app/api/generate/route.ts`

Замените текущий код генерации промпта на:

```typescript
// Генерация промпта
console.log('[Generate] Generating image prompt...');
let prompt: string;
try {
  prompt = await generateImagePrompt(personInfo, style);
  console.log('[Generate] Prompt generated:', prompt.substring(0, 100));
} catch (error: any) {
  console.error('[Generate] Error generating prompt:', error);
  return NextResponse.json(
    { 
      error: 'Failed to generate image prompt',
      details: error.message
    },
    { status: 500 }
  );
}
```

И удалите импорт:
```typescript
import { generateImagePromptWithPerplexity } from '@/lib/ai/perplexity-prompt';
```

### Шаг 3: Закоммитьте изменения
```bash
git add .
git commit -m "Revert: Remove Perplexity experiment, back to OpenAI"
git push origin main
```

## Проверка отката

После отката проверьте логи:
- Должно быть: `[Generate] Generating image prompt using OpenAI (default)...`
- Не должно быть: `[Generate] Generating image prompt using Perplexity (experimental)...`
