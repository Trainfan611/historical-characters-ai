# Экспериментальная функция: Perplexity для генерации промптов

## Описание

Это экспериментальная функция, которая использует Perplexity API вместо OpenAI для генерации промптов для изображений. Perplexity может искать информацию в интернете и создавать более детальные описания на основе актуальных данных.

## Как включить

1. Добавьте в Railway Variables (или `.env`):
   ```
   USE_PERPLEXITY_FOR_PROMPT=true
   ```

2. Перезапустите приложение на Railway

## Как откатить

### Быстрый откат (через переменную окружения)

1. Удалите или установите в Railway Variables:
   ```
   USE_PERPLEXITY_FOR_PROMPT=false
   ```
   или просто удалите эту переменную

2. Перезапустите приложение

### Полный откат (удаление кода)

Если вы хотите полностью удалить экспериментальный код:

1. Удалите файл `lib/ai/perplexity-prompt.ts`
2. Удалите импорт из `app/api/generate/route.ts`:
   ```typescript
   import { generateImagePromptWithPerplexity } from '@/lib/ai/perplexity-prompt';
   ```
3. Верните оригинальный код генерации промпта в `app/api/generate/route.ts`:
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

## Преимущества Perplexity

- **Актуальная информация**: Perplexity ищет информацию в интернете, что может дать более свежие данные
- **Детальные описания**: Может создавать более подробные промпты на основе найденной информации
- **Историческая точность**: Может использовать актуальные исторические источники

## Недостатки

- **Скорость**: Perplexity может работать медленнее, чем OpenAI
- **Стоимость**: Может быть дороже в зависимости от использования
- **Надёжность**: Экспериментальная функция, может иметь неожиданное поведение

## Fallback

Если Perplexity не сработает, система автоматически попробует использовать OpenAI как fallback.

## Мониторинг

Следите за логами в Railway:
- `[Generate] Generating image prompt using Perplexity (experimental)...` - используется Perplexity
- `[Generate] Generating image prompt using OpenAI (default)...` - используется OpenAI
- `[Generate] Perplexity failed, falling back to OpenAI...` - Perplexity не сработал, используется fallback
