# Переменные окружения

## Обязательные переменные

### `GEMINI_API_KEY`
- **Назначение:** Ключ для генерации промптов через Gemini 2.5 Flash
- **Где получить:** https://ai.google.dev/
- **Fallback:** Если не установлен, используется OpenAI для генерации промптов

### `NANO_BANANA_API_KEY` (рекомендуется) или `GEMINI_API_KEY`
- **Назначение:** Ключ для генерации изображений через Gemini 2.5 Flash Image (Nano Banana)
- **Где получить:** https://ai.google.dev/ или https://nanobananaapi.ai/
- **Fallback:** Если `NANO_BANANA_API_KEY` не установлен, используется `GEMINI_API_KEY`. Если оба не установлены, используется Replicate для генерации изображений

### `REPLICATE_API_KEY` (рекомендуется)
- **Назначение:** Fallback для генерации изображений, если Gemini не работает
- **Где получить:** https://replicate.com/account/api-tokens
- **Fallback:** Если не установлен, генерация изображений может не работать при сбое Gemini

### `OPENAI_API_KEY` (рекомендуется)
- **Назначение:** Fallback для генерации промптов, если Gemini не работает
- **Где получить:** https://platform.openai.com/api-keys
- **Fallback:** Если не установлен, генерация промптов может не работать при сбое Gemini

## Опциональные переменные

### `PERPLEXITY_API_KEY`
- **Назначение:** Для поиска информации о исторических личностях и автодополнения
- **Где получить:** https://www.perplexity.ai/settings/api

### `DATABASE_URL`
- **Назначение:** URL подключения к PostgreSQL базе данных
- **Формат:** `postgresql://user:password@host:port/database`

### `NEXTAUTH_SECRET`
- **Назначение:** Секретный ключ для NextAuth.js
- **Генерация:** `openssl rand -base64 32`

### `NEXTAUTH_URL`
- **Назначение:** URL вашего приложения
- **Пример:** `https://your-domain.com`

### `TELEGRAM_BOT_TOKEN`
- **Назначение:** Токен Telegram бота для авторизации
- **Где получить:** https://t.me/BotFather

## Рекомендуемая конфигурация

Для максимальной надежности рекомендуется установить все ключи:

```env
# Основные API
GEMINI_API_KEY=your_gemini_key_here
NANO_BANANA_API_KEY=your_nano_banana_key_here

# Fallback API
OPENAI_API_KEY=your_openai_key_here
REPLICATE_API_KEY=your_replicate_key_here

# Дополнительные
PERPLEXITY_API_KEY=your_perplexity_key_here
DATABASE_URL=your_database_url
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.com
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

## Минимальная конфигурация

Для работы системы достаточно:

```env
GEMINI_API_KEY=your_gemini_key_here
DATABASE_URL=your_database_url
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.com
```

В этом случае:
- Промпты будут генерироваться через Gemini
- Изображения будут генерироваться через Gemini (если `NANO_BANANA_API_KEY` не установлен, будет использован `GEMINI_API_KEY`)
- При сбое Gemini система может не работать (нет fallback)

## Приоритет использования

### Генерация промптов:
1. `GEMINI_API_KEY` (если установлен)
2. `OPENAI_API_KEY` (fallback)

### Генерация изображений:
1. `NANO_BANANA_API_KEY` (если установлен)
2. `GEMINI_API_KEY` (fallback, если `NANO_BANANA_API_KEY` не установлен)
3. `REPLICATE_API_KEY` (fallback, если Gemini не работает)

## Проверка конфигурации

Используйте тестовый endpoint для проверки всех API:

```
GET /api/test-apis
```

Он покажет:
- Какие API доступны
- Какие ключи установлены
- Какие fallback будут использоваться
- Рекомендации по настройке

## Важно

- Все ключи должны быть установлены в Railway Variables (не в `.env` файле для production)
- Ключи чувствительны к регистру
- Не коммитьте ключи в Git
- Регулярно проверяйте срок действия ключей
