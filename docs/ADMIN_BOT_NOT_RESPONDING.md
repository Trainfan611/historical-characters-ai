# 🔧 Админ-бот не отвечает - Диагностика

## 🔍 Пошаговая диагностика

### Шаг 1: Проверьте webhook

Откройте в браузере (замените `YOUR_BOT_TOKEN`):
```
https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo
```

**Что проверить:**
- ✅ `result.url` должен быть правильным
- ✅ `result.pending_update_count` должен быть 0 (или небольшое число)
- ❌ `result.last_error_message` должен быть null

**Если есть ошибки:**
- Обновите webhook (см. инструкции ниже)

### Шаг 2: Проверьте диагностику

Откройте:
```
https://history-character.up.railway.app/api/telegram/debug
```

**Что проверить:**
- ✅ `environment.hasTokenBase: true` или `hasToken: true`
- ✅ `environment.hasAdminId: true`
- ✅ `webhook.telegramInfo.url` правильный
- ✅ Нет ошибок ❌ в `issues`

### Шаг 3: Проверьте логи в Railway

1. Откройте Railway → Ваш проект → Logs
2. Отправьте команду `/start` боту
3. Ищите записи с префиксом `[Telegram Bot]` или `[Telegram Webhook]`

**Что искать:**
- `[Telegram Webhook] Received update` - webhook получил обновление?
- `[Telegram Bot] Received command` - команда обработана?
- `[Telegram Bot] Error` - есть ли ошибки?

### Шаг 4: Проверьте токен

Откройте в браузере (замените `YOUR_BOT_TOKEN`):
```
https://api.telegram.org/botYOUR_BOT_TOKEN/getMe
```

**Должно вернуться:**
```json
{
  "ok": true,
  "result": {
    "id": 123456789,
    "is_bot": true,
    "first_name": "Your Bot",
    "username": "your_bot"
  }
}
```

**Если 404:**
- Токен неправильный
- Получите новый токен из BotFather

### Шаг 5: Проверьте TELEGRAM_ADMIN_ID

1. Получите ваш Telegram ID через [@userinfobot](https://t.me/userinfobot)
2. Проверьте в Railway → Variables → `TELEGRAM_ADMIN_ID`
3. Убедитесь, что ID совпадает (без пробелов, только цифры)

## 🔧 Исправление проблем

### Проблема 1: Webhook не настроен

**Решение:**
1. Обновите webhook через браузер:
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://history-character.up.railway.app/api/telegram/webhook
   ```

2. Или используйте скрипт:
   ```powershell
   .\scripts\update-webhook.ps1
   ```

### Проблема 2: Токен неправильный

**Решение:**
1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте `/mybots`
3. Выберите вашего бота
4. Выберите "API Token"
5. Скопируйте токен
6. Обновите в Railway → Variables → `TELEGRAM_BOT_TOKEN_BASE` или `TELEGRAM_BOT_TOKEN`

### Проблема 3: TELEGRAM_ADMIN_ID неправильный

**Решение:**
1. Получите ваш Telegram ID через [@userinfobot](https://t.me/userinfobot)
2. Обновите в Railway → Variables → `TELEGRAM_ADMIN_ID`
3. Перезапустите приложение

### Проблема 4: Бот не получает обновления

**Причины:**
- Webhook указывает на неправильный URL
- Сайт недоступен
- Endpoint возвращает ошибку

**Решение:**
1. Проверьте доступность сайта:
   ```
   https://history-character.up.railway.app/api/health
   ```

2. Проверьте webhook endpoint:
   ```
   https://history-character.up.railway.app/api/telegram/webhook
   ```
   Должен вернуть: `{"message":"Telegram webhook endpoint","method":"POST"}`

3. Обновите webhook (см. Проблема 1)

### Проблема 5: Команды обрабатываются, но нет ответа

**Причины:**
- Ошибка при отправке сообщения
- Токен неверный
- Chat ID неправильный

**Решение:**
1. Проверьте логи в Railway на наличие ошибок
2. Проверьте токен через `/getMe`
3. Убедитесь, что `TELEGRAM_ADMIN_ID` правильный

## 🧪 Тестирование

### Тест 1: Проверка обработки команд

Откройте в браузере:
```
https://history-character.up.railway.app/api/telegram/test-command
```

Отправьте POST запрос с телом:
```json
{
  "command": "/start"
}
```

**Ожидаемый результат:**
- Команда обработана
- Сообщение отправлено в Telegram

### Тест 2: Проверка отправки сообщений

Проверьте логи в Railway после отправки команды боту. Должны быть записи:
- `[Telegram Webhook] Received update`
- `[Telegram Bot] Received command`
- `[Telegram Bot] Sending message`
- `[Telegram Bot] Message sent successfully`

## 📝 Чеклист

- [ ] Webhook настроен правильно
- [ ] Токен валидный (проверено через `/getMe`)
- [ ] `TELEGRAM_ADMIN_ID` установлен и правильный
- [ ] `TELEGRAM_BOT_TOKEN_BASE` или `TELEGRAM_BOT_TOKEN` установлен
- [ ] Сайт доступен
- [ ] Webhook endpoint доступен
- [ ] Нет ошибок в логах Railway
- [ ] Команды обрабатываются (видно в логах)

## 💡 Полезные команды

### Проверка webhook:
```
https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo
```

### Обновление webhook:
```
https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://history-character.up.railway.app/api/telegram/webhook
```

### Проверка токена:
```
https://api.telegram.org/botYOUR_BOT_TOKEN/getMe
```

### Диагностика:
```
https://history-character.up.railway.app/api/telegram/debug
```

### Тест команды:
```
POST https://history-character.up.railway.app/api/telegram/test-command
Body: { "command": "/start" }
```
