# 🔧 Как обновить Telegram Webhook (Шаг 2)

## Способ 1: Через PowerShell скрипт (Windows) ⭐ Рекомендуется

### Шаг 1: Откройте PowerShell

1. Нажмите `Win + X`
2. Выберите "Windows PowerShell" или "Терминал"

### Шаг 2: Перейдите в папку проекта

```powershell
cd C:\Users\Dell\historical-characters-ai
```

### Шаг 3: Запустите скрипт

```powershell
.\scripts\update-webhook.ps1
```

Скрипт автоматически:
- Найдет токен бота в переменных окружения
- Обновит webhook на правильный URL
- Проверит, что webhook настроен правильно

**Если токен не найден**, скрипт попросит ввести его вручную.

---

## Способ 2: Через curl в PowerShell (вручную)

### Шаг 1: Получите токен бота

Токен находится в Railway в переменной `TELEGRAM_BOT_TOKEN_BASE` или `TELEGRAM_BOT_TOKEN`.

Или получите его от @BotFather в Telegram:
1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте `/mybots`
3. Выберите вашего бота
4. Выберите "API Token"
5. Скопируйте токен

### Шаг 2: Обновите webhook

Замените `ВАШ_ТОКЕН` на ваш токен:

```powershell
$token = "ВАШ_ТОКЕН"
$webhookUrl = "https://history-character.up.railway.app/api/telegram/webhook"

Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook" -Method Post -Body @{
    url = $webhookUrl
} -ContentType "application/x-www-form-urlencoded"
```

### Шаг 3: Проверьте webhook

```powershell
Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getWebhookInfo" -Method Get
```

Должны увидеть:
```json
{
  "ok": true,
  "result": {
    "url": "https://history-character.up.railway.app/api/telegram/webhook",
    "pending_update_count": 0
  }
}
```

---

## Способ 3: Через браузер (самый простой)

### Шаг 1: Получите токен бота

См. "Способ 2, Шаг 1" выше.

### Шаг 2: Откройте ссылку в браузере

Замените `ВАШ_ТОКЕН` на ваш токен:

```
https://api.telegram.org/botВАШ_ТОКЕН/setWebhook?url=https://history-character.up.railway.app/api/telegram/webhook
```

Должны увидеть:
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

### Шаг 3: Проверьте webhook

Откройте в браузере (замените `ВАШ_ТОКЕН`):

```
https://api.telegram.org/botВАШ_ТОКЕН/getWebhookInfo
```

---

## Способ 4: Через онлайн-сервисы

### Используйте Postman или Insomnia

1. Создайте POST запрос:
   - URL: `https://api.telegram.org/botВАШ_ТОКЕН/setWebhook`
   - Method: POST
   - Body (form-data):
     - `url`: `https://history-character.up.railway.app/api/telegram/webhook`

2. Отправьте запрос

---

## ✅ Проверка результата

После обновления webhook:

1. **Проверьте диагностику:**
   ```
   https://history-character.up.railway.app/api/telegram/debug
   ```
   
   Должны увидеть:
   - `status: "ok"`
   - `webhook.url` указывает на правильный домен
   - `pendingUpdateCount: 0`

2. **Отправьте боту команду `/start`**
   - Бот должен ответить статистикой (если вы админ)

3. **Проверьте логи Railway**
   - Не должно быть ошибок 404

---

## ❓ Частые проблемы

### Проблема: "Unauthorized" или "Invalid token"

**Решение:** Проверьте, что токен правильный. Токен должен начинаться с цифр и содержать двоеточие, например: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### Проблема: "Bad Request"

**Решение:** Убедитесь, что URL правильный и начинается с `https://`

### Проблема: Webhook обновился, но бот не отвечает

**Решение:**
1. Подождите 1-2 минуты (Telegram обрабатывает обновления)
2. Проверьте логи Railway на наличие ошибок
3. Убедитесь, что `NEXTAUTH_URL` в Railway установлен правильно

---

**Удачи! 🚀**
