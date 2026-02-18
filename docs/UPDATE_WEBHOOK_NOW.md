# 🔧 Обновление Webhook - Прямо сейчас

## Способ 1: Через браузер (САМЫЙ ПРОСТОЙ) ⭐

### Шаг 1: Получите токен бота

1. Откройте **Railway** → Ваш проект
2. Перейдите в **Variables**
3. Найдите `TELEGRAM_BOT_TOKEN_BASE` или `TELEGRAM_BOT_TOKEN`
4. Скопируйте значение (формат: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Шаг 2: Обновите webhook

Откройте в браузере (замените `YOUR_BOT_TOKEN` на ваш токен):

```
https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://history-character.up.railway.app/api/telegram/webhook
```

**Пример:**
Если ваш токен `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`, то откройте:
```
https://api.telegram.org/bot1234567890:ABCdefGHIjklMNOpqrsTUVwxyz/setWebhook?url=https://history-character.up.railway.app/api/telegram/webhook
```

### Шаг 3: Проверьте результат

Вы должны увидеть:
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

### Шаг 4: Проверьте webhook

Откройте в браузере (замените `YOUR_BOT_TOKEN`):
```
https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo
```

**Должно быть:**
- `result.url` = `https://history-character.up.railway.app/api/telegram/webhook`
- `result.pending_update_count` = 0 (или небольшое число)

---

## Способ 2: Через PowerShell (если токен в переменных окружения)

Если у вас установлен токен локально:

```powershell
$token = $env:TELEGRAM_BOT_TOKEN_BASE
if (-not $token) { $token = $env:TELEGRAM_BOT_TOKEN }

$url = "https://history-character.up.railway.app/api/telegram/webhook"
Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook?url=$url" -Method Get
```

---

## Способ 3: После деплоя (через API endpoint)

После того, как изменения задеплоены:

1. Откройте в браузере:
   ```
   https://history-character.up.railway.app/api/telegram/set-webhook
   ```

2. Или отправьте POST запрос:
   ```bash
   curl -X POST https://history-character.up.railway.app/api/telegram/set-webhook
   ```

---

## ✅ Проверка работы

После обновления webhook:

1. Откройте вашего бота в Telegram
2. Отправьте `/start`
3. Если вы админ (TELEGRAM_ADMIN_ID совпадает с вашим ID), вы получите статистику

---

## 🐛 Если не работает

1. Проверьте диагностику:
   ```
   https://history-character.up.railway.app/api/telegram/debug
   ```

2. Убедитесь, что в Railway установлено:
   ```
   NEXTAUTH_URL=https://history-character.up.railway.app
   ```

3. Проверьте, что сайт доступен:
   ```
   https://history-character.up.railway.app/api/health
   ```
