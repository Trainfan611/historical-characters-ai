# 🔧 Исправление Webhook

## Проблема

Webhook настроен на старый домен:
- **Текущий webhook:** `https://historical-characters-ai-production.up.railway.app/api/telegram/webhook`
- **Правильный домен:** `https://history-character.up.railway.app`

Ошибка: `Wrong response from the webhook: 404 Not Found`

## Решение

### 1. Обновите переменную окружения NEXTAUTH_URL

В Railway установите:
```
NEXTAUTH_URL=https://history-character.up.railway.app
```

### 2. Обновите webhook через Telegram API

Выполните команду (замените `ВАШ_ТОКЕН` на ваш токен бота):

```bash
curl -X POST "https://api.telegram.org/botВАШ_ТОКЕН/setWebhook?url=https://history-character.up.railway.app/api/telegram/webhook"
```

### 3. Проверьте webhook

```bash
curl "https://api.telegram.org/botВАШ_ТОКЕН/getWebhookInfo"
```

Должны увидеть:
```json
{
  "ok": true,
  "result": {
    "url": "https://history-character.up.railway.app/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

### 4. Проверьте диагностику

Откройте:
```
https://history-character.up.railway.app/api/telegram/debug
```

Должны увидеть:
- `status: "ok"` (без ошибок)
- `webhook.url` указывает на правильный домен
- `pendingUpdateCount: 0`

## Альтернативный способ через скрипт

Создайте файл `scripts/update-webhook.sh`:

```bash
#!/bin/bash

TELEGRAM_BOT_TOKEN="ваш_токен"
WEBHOOK_URL="https://history-character.up.railway.app/api/telegram/webhook"

curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${WEBHOOK_URL}"
```

Запустите:
```bash
chmod +x scripts/update-webhook.sh
./scripts/update-webhook.sh
```

## После обновления

1. Отправьте боту команду `/start`
2. Бот должен ответить статистикой (если вы админ)
3. Проверьте логи Railway на наличие ошибок

---

**Важно:** После обновления `NEXTAUTH_URL` в Railway, приложение автоматически перезапустится. Подождите 1-2 минуты перед проверкой webhook.
