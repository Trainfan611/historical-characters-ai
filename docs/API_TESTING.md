# Тестирование API (Gemini и Nano Banana)

## Как проверить работу API

Создан специальный endpoint для проверки работы всех API:

### Endpoint: `/api/test-apis`

**Метод:** `GET`

**Требования:** Авторизация (нужна сессия)

## Как использовать

### 1. Через браузер (после авторизации)

1. Войдите в систему через Telegram
2. Откройте в браузере: `https://ваш-домен.com/api/test-apis`
3. Или локально: `http://localhost:3000/api/test-apis`

### 2. Через curl (с сессией)

```bash
curl -X GET "https://ваш-домен.com/api/test-apis" \
  -H "Cookie: next-auth.session-token=ваш-токен"
```

## Что проверяется

### 1. Gemini API
- Проверяет наличие `GEMINI_API_KEY`
- Пробует сгенерировать тестовый промпт
- Показывает, будет ли использоваться fallback на OpenAI

### 2. Nano Banana API
- Проверяет наличие `NANO_BANANA_API_KEY`
- Пробует создать задачу генерации
- Показывает, будет ли использоваться fallback на Replicate

### 3. OpenAI (fallback для промптов)
- Проверяет наличие `OPENAI_API_KEY`
- Критически важно для работы системы

### 4. Replicate (fallback для изображений)
- Проверяет наличие `REPLICATE_API_KEY`
- Критически важно для работы системы

## Формат ответа

```json
{
  "status": "completed",
  "systemStatus": {
    "canGeneratePrompts": true,
    "canGenerateImages": true,
    "isFullyOperational": false,
    "usingFallbacks": {
      "prompts": true,
      "images": true
    }
  },
  "results": {
    "gemini": {
      "available": false,
      "error": "Request failed with status code 403",
      "details": {
        "status": 403,
        "willUseFallback": true
      }
    },
    "nanoBanana": {
      "available": false,
      "error": "You do not have access permissions",
      "details": {
        "status": 401,
        "willUseFallback": true
      }
    },
    "openai": {
      "available": true
    },
    "replicate": {
      "available": true
    }
  },
  "summary": {
    "gemini": "❌ Request failed with status code 403",
    "nanoBanana": "❌ You do not have access permissions",
    "openai": "✅ Available (fallback)",
    "replicate": "✅ Available (fallback)"
  },
  "recommendations": [
    "💡 Optional: Configure GEMINI_API_KEY and enable Generative Language API for better prompts",
    "💡 Optional: Configure NANO_BANANA_API_KEY for potentially cheaper image generation",
    "✅ System is operational (using fallbacks if needed)"
  ]
}
```

## Интерпретация результатов

### ✅ Система полностью работает:
```json
{
  "isFullyOperational": true,
  "canGeneratePrompts": true,
  "canGenerateImages": true
}
```
**Значение:** Все API настроены и работают. Используются Gemini и Nano Banana.

### ✅ Система работает через fallback:
```json
{
  "isFullyOperational": false,
  "canGeneratePrompts": true,
  "canGenerateImages": true,
  "usingFallbacks": {
    "prompts": true,
    "images": true
  }
}
```
**Значение:** Gemini и Nano Banana не работают, но система использует OpenAI и Replicate. Всё работает!

### ❌ Система не может генерировать промпты:
```json
{
  "canGeneratePrompts": false
}
```
**Проблема:** Нет ни `GEMINI_API_KEY`, ни `OPENAI_API_KEY`
**Решение:** Добавьте `OPENAI_API_KEY` в Railway

### ❌ Система не может генерировать изображения:
```json
{
  "canGenerateImages": false
}
```
**Проблема:** Нет ни `NANO_BANANA_API_KEY`, ни `REPLICATE_API_KEY`
**Решение:** Добавьте `REPLICATE_API_KEY` в Railway

## Рекомендации

Endpoint автоматически генерирует рекомендации на основе результатов проверки:

- ⚠️ **CRITICAL** - нужно исправить немедленно
- 💡 **Optional** - можно настроить для улучшения
- ✅ **Working** - всё работает

## Примеры использования

### Проверка после настройки

После добавления ключей в Railway:
1. Перезапустите приложение
2. Откройте `/api/test-apis`
3. Проверьте результаты

### Диагностика проблем

Если генерация не работает:
1. Откройте `/api/test-apis`
2. Проверьте, какие API недоступны
3. Следуйте рекомендациям из ответа

## Важно

- Endpoint требует авторизации (сессия)
- Не генерирует реальные изображения (только проверяет создание задачи)
- Для Gemini генерирует тестовый промпт (может использовать fallback)
- Результаты кэшируются только во время выполнения запроса
