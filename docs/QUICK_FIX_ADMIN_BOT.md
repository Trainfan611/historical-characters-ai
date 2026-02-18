# ⚡ Быстрое исправление: Админ-бот не отвечает

## 🚀 Быстрая проверка (5 минут)

### 1. Проверьте диагностику

Откройте в браузере:
```
https://history-character.up.railway.app/api/telegram/debug
```

**Скопируйте результат и проверьте:**
- ✅ `status` должен быть `"ok"` или `"warning"` (не `"error"`)
- ✅ `environment.hasTokenBase: true` или `hasToken: true`
- ✅ `environment.hasAdminId: true`
- ✅ `webhook.telegramInfo.url` должен быть правильным

### 2. Проверьте webhook

**Получите токен из Railway:**
1. Railway → Ваш проект → Variables
2. Найдите `TELEGRAM_BOT_TOKEN_BASE` или `TELEGRAM_BOT_TOKEN`
3. Скопируйте токен

**Проверьте webhook (замените `YOUR_TOKEN`):**
```
https://api.telegram.org/botYOUR_TOKEN/getWebhookInfo
```

**Должно быть:**
- `result.url` = `https://history-character.up.railway.app/api/telegram/webhook`
- `result.pending_update_count` = 0
- `result.last_error_message` = null

### 3. Если webhook неправильный - обновите

Откройте в браузере (замените `YOUR_TOKEN`):
```
https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=https://history-character.up.railway.app/api/telegram/webhook
```

**Должно вернуться:**
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

### 4. Проверьте TELEGRAM_ADMIN_ID

1. Получите ваш Telegram ID:
   - Откройте [@userinfobot](https://t.me/userinfobot)
   - Отправьте любое сообщение
   - Скопируйте ваш ID (число, например: `1437715377`)

2. Проверьте в Railway:
   - Railway → Variables → `TELEGRAM_ADMIN_ID`
   - Должен совпадать с вашим ID (только цифры, без пробелов)

### 5. Протестируйте бота

1. Откройте вашего бота в Telegram
2. Отправьте `/start`
3. **Если вы админ:** должна прийти статистика
4. **Если вы не админ:** должно прийти сообщение об отсутствии доступа

## 🔍 Если все еще не работает

### Проверьте логи в Railway

1. Откройте Railway → Ваш проект → Logs
2. Отправьте команду `/start` боту
3. Ищите записи:
   - `[Telegram Webhook] Received update` - webhook получил обновление?
   - `[Telegram Bot] Received command` - команда обработана?
   - `[Telegram Bot] Error` - есть ли ошибки?

### Частые проблемы

#### Проблема: Webhook показывает ошибку 404

**Решение:**
1. Проверьте, что сайт доступен:
   ```
   https://history-character.up.railway.app/api/health
   ```

2. Обновите webhook (см. шаг 3 выше)

#### Проблема: Команды не обрабатываются

**Решение:**
1. Проверьте токен через `/getMe` (должен вернуть `{"ok":true}`)
2. Проверьте, что webhook настроен правильно
3. Проверьте логи в Railway

#### Проблема: Бот отвечает, но не админу

**Решение:**
1. Проверьте `TELEGRAM_ADMIN_ID` в Railway
2. Убедитесь, что ID совпадает с вашим Telegram ID
3. Перезапустите приложение в Railway

## 📞 Нужна помощь?

Пришлите:
1. Результат `/api/telegram/debug`
2. Результат `/getWebhookInfo`
3. Логи из Railway (после отправки команды боту)
