# 🔧 Исправление проблем с админ-ботом

> 📚 **См. также:** [TELEGRAM_DOMAIN_SETUP.md](./TELEGRAM_DOMAIN_SETUP.md) - Подробная инструкция по настройке доменов

## Быстрая диагностика

### 1. Проверьте диагностический endpoint

Откройте в браузере:
```
https://history-character.up.railway.app/api/telegram/debug
```

### 2. Автоматическое исправление webhook

Если webhook настроен неправильно, откройте в браузере (GET запрос покажет статус, POST обновит):
```
https://history-character.up.railway.app/api/telegram/set-webhook
```

Или отправьте POST запрос (можно через curl или Postman):
```bash
curl -X POST https://history-character.up.railway.app/api/telegram/set-webhook
```

Это автоматически обновит webhook на правильный URL.

**Что проверить:**
- ✅ `status: "ok"` или `"warning"` (не `"error"`)
- ✅ `environment.hasTokenBase: true` или `hasToken: true`
- ✅ `environment.hasAdminId: true`
- ✅ `webhook.telegramInfo.url` должен содержать правильный домен
- ❌ Нет ошибок с ❌ в `issues`

### 2. Используйте скрипт диагностики

Запустите скрипт на вашем компьютере:
```powershell
.\scripts\fix-admin-bot.ps1
```

Скрипт проверит:
- Валидность токена бота
- Настройку webhook
- Наличие TELEGRAM_ADMIN_ID
- Доступность сайта

## Частые проблемы и решения

### Проблема 1: Бот не отвечает на команды

**Причины:**
1. Webhook не настроен или настроен неправильно
2. TELEGRAM_BOT_TOKEN_BASE или TELEGRAM_BOT_TOKEN не установлены
3. Сайт недоступен

**Решение:**
1. Проверьте webhook через скрипт: `.\scripts\update-webhook.ps1`
2. Убедитесь, что в Railway установлены переменные:
   - `TELEGRAM_BOT_TOKEN_BASE` (или `TELEGRAM_BOT_TOKEN`)
   - `NEXTAUTH_URL=https://history-character.up.railway.app`
3. Проверьте доступность сайта: `https://history-character.up.railway.app/api/health`

### Проблема 2: Команды работают, но админ-функции недоступны

**Причины:**
1. `TELEGRAM_ADMIN_ID` не установлен
2. `TELEGRAM_ADMIN_ID` установлен неправильно (не ваш ID)

**Решение:**
1. Получите ваш Telegram ID:
   - Откройте [@userinfobot](https://t.me/userinfobot) в Telegram
   - Отправьте любое сообщение
   - Бот покажет ваш ID (число, например: `123456789`)

2. Установите в Railway:
   ```
   TELEGRAM_ADMIN_ID=ваш_telegram_id
   ```

3. Перезапустите приложение в Railway

### Проблема 3: Webhook показывает ошибку 404

**Причины:**
1. Домен в webhook не совпадает с `NEXTAUTH_URL`
2. Endpoint `/api/telegram/webhook` недоступен

**Решение:**
1. Обновите `NEXTAUTH_URL` в Railway:
   ```
   NEXTAUTH_URL=https://history-character.up.railway.app
   ```

2. Обновите webhook:
   ```powershell
   .\scripts\update-webhook.ps1
   ```

3. Проверьте доступность endpoint:
   ```
   https://history-character.up.railway.app/api/telegram/webhook
   ```
   Должен вернуть: `{"message":"Telegram webhook endpoint","method":"POST"}`

### Проблема 4: "pending_update_count" растет

**Причины:**
1. Webhook не может доставить обновления (404, 500, таймаут)
2. Endpoint возвращает ошибку

**Решение:**
1. Проверьте логи в Railway на наличие ошибок
2. Убедитесь, что endpoint возвращает 200 статус
3. Проверьте, что сайт доступен и работает

## Проверка работы бота

### Тест 1: Команда /start

1. Откройте вашего бота в Telegram
2. Отправьте `/start`
3. **Если вы админ:**
   - Должна прийти статистика с количеством пользователей и генераций
4. **Если вы не админ:**
   - Должно прийти сообщение "❌ У вас нет доступа к этой команде."

### Тест 2: Команда /admin

1. Отправьте `/admin`
2. **Если вы админ:**
   - Должна прийти ссылка на админ-панель
3. **Если вы не админ:**
   - Должно прийти сообщение "❌ У вас нет доступа к этой команде."

## Проверка логов

В Railway откройте логи и найдите записи с префиксом `[Telegram Bot]`:

```
[Telegram Bot] Received command: { chatId: '...', fromId: '...', text: '/start', ... }
[Telegram Bot] Checking admin status for stats: { chatId: '...', fromId: '...', adminId: '...', isAdmin: true }
[Telegram Bot] Sending admin stats to: ...
```

Если видите ошибки, проверьте:
- Правильность токена
- Наличие TELEGRAM_ADMIN_ID
- Доступность базы данных

## Переменные окружения в Railway

Убедитесь, что все переменные установлены:

```env
# Обязательные
TELEGRAM_BOT_TOKEN_BASE=ваш_токен_бота
# или
TELEGRAM_BOT_TOKEN=ваш_токен_бота

NEXTAUTH_URL=https://history-character.up.railway.app

# Для админ-функций
TELEGRAM_ADMIN_ID=ваш_telegram_id
```

## Полезные ссылки

- Диагностика: `https://history-character.up.railway.app/api/telegram/debug`
- Health check: `https://history-character.up.railway.app/api/health`
- Webhook endpoint: `https://history-character.up.railway.app/api/telegram/webhook`

## Если ничего не помогло

1. Проверьте логи в Railway на наличие ошибок
2. Убедитесь, что все переменные окружения установлены правильно
3. Попробуйте перезапустить приложение в Railway
4. Проверьте, что бот не заблокирован в Telegram
