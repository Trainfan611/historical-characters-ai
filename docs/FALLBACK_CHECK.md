# Проверка Fallback механизмов

## Проблема

В логах видно, что:
- Gemini возвращает 403 (должен быть fallback на OpenAI)
- Nano Banana возвращает 404 (должен быть fallback на Replicate)

Но fallback не срабатывает или не видно в логах.

## Что нужно проверить

### 1. Проверьте наличие всех необходимых ключей в Railway:

```
GEMINI_API_KEY=... (опционально, есть fallback на OpenAI)
NANO_BANANA_API_KEY=... (опционально, есть fallback на Replicate)
OPENAI_API_KEY=... (ОБЯЗАТЕЛЬНО для fallback промптов)
REPLICATE_API_KEY=... (ОБЯЗАТЕЛЬНО для fallback изображений)
```

### 2. Проверьте логи после улучшений

После деплоя новых изменений в логах должны быть:

**Для промптов:**
```
[Generate] ===== Starting prompt generation =====
[Gemini] Error generating prompt: status 403
[Gemini] Falling back to OpenAI...
[Generate] ✓ Prompt generated successfully
```

**Для изображений:**
```
[Generate] ===== Starting image generation =====
[Generate] Attempting to generate image using Nano Banana...
[Nano Banana] Error generating image: All API formats failed
[Generate] ✗ Nano Banana failed with error: ...
[Generate] ===== Attempting fallback to Replicate =====
[Generate] REPLICATE_API_KEY found, attempting Replicate generation...
[Generate] ✓ Fallback to Replicate successful!
```

## Если fallback не работает

### Проблема: Нет REPLICATE_API_KEY

**Симптомы:**
```
[Generate] ✗ REPLICATE_API_KEY is not set! Cannot use fallback.
```

**Решение:**
1. Добавьте `REPLICATE_API_KEY` в Railway
2. Получите ключ на: https://replicate.com/account/api-tokens
3. Перезапустите приложение

### Проблема: Нет OPENAI_API_KEY

**Симптомы:**
```
[Gemini] Falling back to OpenAI...
[OpenAI] Error: OPENAI_API_KEY is not set
```

**Решение:**
1. Добавьте `OPENAI_API_KEY` в Railway
2. Получите ключ на: https://platform.openai.com/api-keys
3. Перезапустите приложение

## Минимальные требования для работы

Для работы системы **ОБЯЗАТЕЛЬНО** нужны:
- ✅ `OPENAI_API_KEY` - для генерации промптов (fallback для Gemini)
- ✅ `REPLICATE_API_KEY` - для генерации изображений (fallback для Nano Banana)

Опционально (если хотите использовать напрямую):
- `GEMINI_API_KEY` - для промптов (требует включения API в Google Cloud)
- `NANO_BANANA_API_KEY` - для изображений (требует правильного API endpoint)

## Проверка после деплоя

1. Попробуйте сгенерировать изображение
2. Проверьте логи в Railway
3. Убедитесь, что видите сообщения о fallback
4. Убедитесь, что генерация завершается успешно

## Ожидаемый результат

Даже если Gemini и Nano Banana не работают, система должна:
1. Использовать OpenAI для промптов ✅
2. Использовать Replicate для изображений ✅
3. Успешно генерировать изображения ✅
