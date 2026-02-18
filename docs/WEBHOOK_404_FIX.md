# 🔧 Исправление ошибки 404 при обновлении webhook

## ❌ Ошибка: `{"ok":false,"error_code":404,"description":"Not Found"}`

Эта ошибка означает, что Telegram API не может найти бота с указанным токеном.

## 🔍 Причины и решения

### Причина 1: Неправильный токен

**Проверьте:**
1. Токен скопирован полностью (включая все символы)
2. Нет лишних пробелов в начале или конце
3. Токен в формате: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

**Решение:**
1. Откройте Railway → Ваш проект → Variables
2. Найдите `TELEGRAM_BOT_TOKEN_BASE` или `TELEGRAM_BOT_TOKEN`
3. Скопируйте токен заново (убедитесь, что скопировали полностью)
4. Попробуйте снова

### Причина 2: Токен устарел или бот удален

**Проверьте:**
1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/mybots`
3. Выберите вашего бота
4. Проверьте, что бот активен

**Решение:**
Если бот не найден или токен не работает:
1. Создайте нового бота через `/newbot` в BotFather
2. Получите новый токен
3. Обновите `TELEGRAM_BOT_TOKEN_BASE` в Railway
4. Попробуйте обновить webhook снова

### Причина 3: Неправильный формат URL

**Правильный формат:**
```
https://api.telegram.org/botТОКЕН/setWebhook?url=https://history-character.up.railway.app/api/telegram/webhook
```

**Неправильно:**
- Пробелы в URL
- Лишние символы
- Неправильный протокол (http вместо https)

## ✅ Правильный способ обновления

### Вариант 1: Через браузер (рекомендуется)

1. Получите токен из Railway
2. Откройте в браузере (замените `ВАШ_ТОКЕН`):
   ```
   https://api.telegram.org/botВАШ_ТОКЕН/setWebhook?url=https://history-character.up.railway.app/api/telegram/webhook
   ```

3. Убедитесь, что:
   - Нет пробелов в URL
   - Токен скопирован полностью
   - URL закодирован правильно

### Вариант 2: Через PowerShell

```powershell
# Замените YOUR_TOKEN на ваш токен
$token = "YOUR_TOKEN"
$webhookUrl = "https://history-character.up.railway.app/api/telegram/webhook"

# Сначала проверим токен
Write-Host "Проверка токена..." -ForegroundColor Cyan
try {
    $botInfo = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getMe" -Method Get
    if ($botInfo.ok) {
        Write-Host "✓ Токен валидный. Бот: @$($botInfo.result.username)" -ForegroundColor Green
    } else {
        Write-Host "❌ Токен невалидный" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Ошибка проверки токена: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Обновляем webhook
Write-Host "Обновление webhook..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook" -Method Post -Body @{
        url = $webhookUrl
    } -ContentType "application/x-www-form-urlencoded"
    
    if ($response.ok) {
        Write-Host "✓ Webhook успешно обновлен!" -ForegroundColor Green
    } else {
        Write-Host "❌ Ошибка: $($response.description)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
}
```

## 🔍 Диагностика

### Шаг 1: Проверьте токен

Откройте в браузере (замените `ВАШ_ТОКЕН`):
```
https://api.telegram.org/botВАШ_ТОКЕН/getMe
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

**Если вернулось 404:**
- Токен неправильный
- Бот удален
- Нужно получить новый токен

### Шаг 2: Проверьте текущий webhook

Откройте в браузере (замените `ВАШ_ТОКЕН`):
```
https://api.telegram.org/botВАШ_ТОКЕН/getWebhookInfo
```

Это покажет текущий статус webhook.

## 📝 Пошаговая инструкция

1. **Получите токен:**
   - Railway → Variables → `TELEGRAM_BOT_TOKEN_BASE` или `TELEGRAM_BOT_TOKEN`
   - Скопируйте полностью

2. **Проверьте токен:**
   - Откройте: `https://api.telegram.org/botВАШ_ТОКЕН/getMe`
   - Должен вернуться `{"ok":true,...}`

3. **Если токен не работает:**
   - Откройте [@BotFather](https://t.me/BotFather)
   - Отправьте `/mybots`
   - Выберите вашего бота
   - Если бот не найден, создайте нового через `/newbot`

4. **Обновите webhook:**
   - Откройте: `https://api.telegram.org/botВАШ_ТОКЕН/setWebhook?url=https://history-character.up.railway.app/api/telegram/webhook`
   - Должен вернуться `{"ok":true,"result":true}`

5. **Проверьте результат:**
   - Откройте: `https://api.telegram.org/botВАШ_ТОКЕН/getWebhookInfo`
   - `result.url` должен быть правильным

## 💡 Полезные ссылки

- [BotFather](https://t.me/BotFather) - для управления ботами
- [Telegram Bot API](https://core.telegram.org/bots/api) - документация API
- Диагностика: `https://history-character.up.railway.app/api/telegram/debug`
