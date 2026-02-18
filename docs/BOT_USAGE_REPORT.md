# 📊 Отчет: Использование двух ботов

## ✅ Проверка завершена

### Текущая конфигурация

#### 1. Основной бот (`TELEGRAM_BOT_TOKEN`)

**Используется в:**
- `lib/telegram.ts` - верификация, проверка подписки
- `components/auth/TelegramLogin.tsx` - через `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`

**Функции:**
- ✅ Верификация Telegram Login Widget
- ✅ Проверка подписки на канал
- ✅ Получение информации о пользователе

**Статус:** ✅ Исправлено - добавлен fallback на `TELEGRAM_BOT_TOKEN_BASE`

#### 2. Админ-бот (`TELEGRAM_BOT_TOKEN_BASE`)

**Используется в:**
- `lib/telegram-bot.ts` - админ-функции
- `app/api/telegram/webhook/route.ts` - обработка команд
- `app/api/telegram/set-webhook/route.ts` - настройка webhook

**Функции:**
- ✅ Отправка сообщений
- ✅ Админ-команды (`/start`, `/admin`)
- ✅ Генерация ссылок на админ-панель
- ✅ Статистика для админа

**Статус:** ✅ Работает правильно - есть fallback на `TELEGRAM_BOT_TOKEN`

## 🔧 Внесенные исправления

### Исправление 1: Добавлен fallback в основной бот

**Файл:** `lib/telegram.ts`

**Было:**
```typescript
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
```

**Стало:**
```typescript
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN_BASE;
```

**Результат:** Теперь основной бот будет работать, даже если установлен только `TELEGRAM_BOT_TOKEN_BASE`

## 📋 Рекомендации

### Если у вас один бот:

**Установите в Railway:**
```
TELEGRAM_BOT_TOKEN=ваш_токен
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=имя_бота_без_@
```

`TELEGRAM_BOT_TOKEN_BASE` можно не устанавливать - будет использован fallback.

### Если у вас два разных бота:

**Установите в Railway:**
```
TELEGRAM_BOT_TOKEN=токен_основного_бота
TELEGRAM_BOT_TOKEN_BASE=токен_админ_бота
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=имя_основного_бота_без_@
```

**Важно:**
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` должен соответствовать `TELEGRAM_BOT_TOKEN`
- Webhook должен быть настроен для бота с токеном `TELEGRAM_BOT_TOKEN_BASE`

## ✅ Все работает правильно

1. ✅ Основной бот использует `TELEGRAM_BOT_TOKEN` (с fallback)
2. ✅ Админ-бот использует `TELEGRAM_BOT_TOKEN_BASE` (с fallback на `TELEGRAM_BOT_TOKEN`)
3. ✅ Webhook обрабатывает команды через админ-бота
4. ✅ Fallback настроен правильно в обоих местах

## 🔍 Как проверить

1. **Проверьте диагностику:**
   ```
   https://ваш-домен.railway.app/api/telegram/debug
   ```

2. **Проверьте основной бот:**
   - Откройте `/login`
   - Попробуйте войти через Telegram
   - Должно работать

3. **Проверьте админ-бота:**
   - Откройте бота в Telegram
   - Отправьте `/start`
   - Должна прийти статистика (если вы админ)

## 📚 Дополнительная документация

- [BOT_SETUP_GUIDE.md](./BOT_SETUP_GUIDE.md) - Подробное руководство по настройке
- [BOT_USAGE_ANALYSIS.md](./BOT_USAGE_ANALYSIS.md) - Детальный анализ использования
