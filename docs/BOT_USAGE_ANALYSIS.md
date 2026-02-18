# 📊 Анализ использования двух ботов

## 🔍 Текущая ситуация

В проекте используются два разных токена ботов:

### 1. `TELEGRAM_BOT_TOKEN` - Основной бот

**Где используется:**
- `lib/telegram.ts` - для основного функционала
- `components/auth/TelegramLogin.tsx` - через `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`

**Функции:**
- ✅ Верификация Telegram Login Widget (`verifyTelegramData`)
- ✅ Проверка подписки на канал (`checkChannelSubscription`)
- ✅ Получение информации о пользователе (`getTelegramUser`)

**Проблема:** ❌ Нет fallback на `TELEGRAM_BOT_TOKEN_BASE`

### 2. `TELEGRAM_BOT_TOKEN_BASE` - Админ-бот

**Где используется:**
- `lib/telegram-bot.ts` - для админ-функций
- `app/api/telegram/webhook/route.ts` - для обработки команд
- `app/api/telegram/set-webhook/route.ts` - для настройки webhook

**Функции:**
- ✅ Отправка сообщений (`sendTelegramMessage`)
- ✅ Админ-команды (`/start`, `/admin`)
- ✅ Генерация ссылок на админ-панель
- ✅ Статистика для админа

**Fallback:** ✅ Есть fallback на `TELEGRAM_BOT_TOKEN`

## ⚠️ Обнаруженные проблемы

### Проблема 1: Нет fallback в основном боте

**Файл:** `lib/telegram.ts`

**Текущий код:**
```typescript
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
```

**Проблема:** Если установлен только `TELEGRAM_BOT_TOKEN_BASE`, основной бот не будет работать.

**Решение:** Добавить fallback:
```typescript
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN_BASE;
```

### Проблема 2: Webhook использует админ-бота

**Файл:** `app/api/telegram/webhook/route.ts`

**Текущая ситуация:** Webhook обрабатывает команды через админ-бота, что правильно.

**Но:** Если у пользователя установлен только `TELEGRAM_BOT_TOKEN`, webhook будет работать (благодаря fallback), но это может быть не тот бот, который настроен в BotFather для домена.

## ✅ Рекомендации

### Вариант 1: Один бот (рекомендуется для простоты)

Если у вас один бот:
- Установите `TELEGRAM_BOT_TOKEN` в Railway
- `TELEGRAM_BOT_TOKEN_BASE` можно не устанавливать (будет использован fallback)

### Вариант 2: Два разных бота

Если у вас два разных бота:
- `TELEGRAM_BOT_TOKEN` - основной бот (для логина и проверки подписки)
- `TELEGRAM_BOT_TOKEN_BASE` - админ-бот (для команд `/start`, `/admin`)

**Важно:**
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` должен соответствовать `TELEGRAM_BOT_TOKEN`
- Webhook должен быть настроен для бота с токеном `TELEGRAM_BOT_TOKEN_BASE` (или `TELEGRAM_BOT_TOKEN` если `TELEGRAM_BOT_TOKEN_BASE` не установлен)

## 🔧 Исправления

1. Добавить fallback в `lib/telegram.ts`
2. Обновить документацию
3. Проверить, что webhook использует правильный токен
