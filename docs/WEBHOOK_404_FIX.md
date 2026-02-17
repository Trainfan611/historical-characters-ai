# 🔧 Исправление ошибки 404 при обновлении webhook

## Проблема

При попытке обновить webhook получаете:
```json
{"ok":false,"error_code":404,"description":"Not Found"}
```

## Причины

1. **Неправильный токен бота** — токен неверный или не существует
2. **Неправильный формат URL** — токен не включен в URL правильно
3. **Токен содержит лишние символы** — пробелы, переносы строк и т.д.

## Решение

### Шаг 1: Проверьте токен бота

#### Способ 1: Через @BotFather

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/mybots`
3. Выберите вашего бота
4. Выберите "API Token"
5. Скопируйте токен (он должен выглядеть как: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

#### Способ 2: Через Railway

1. Откройте ваш проект в Railway
2. Перейдите в "Variables"
3. Найдите `TELEGRAM_BOT_TOKEN_BASE` или `TELEGRAM_BOT_TOKEN`
4. Скопируйте значение (убедитесь, что нет лишних пробелов)

### Шаг 2: Проверьте формат токена

Токен должен:
- Начинаться с цифр
- Содержать двоеточие `:`
- Быть длиной примерно 45-50 символов
- Не содержать пробелов в начале или конце

**Пример правильного токена:**
```
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-1234567890
```

### Шаг 3: Обновите webhook правильно

#### Вариант A: Через PowerShell (рекомендуется)

1. Откройте PowerShell
2. Выполните:

```powershell
# Замените ВАШ_ТОКЕН на реальный токен
$token = "ВАШ_ТОКЕН"
$webhookUrl = "https://history-character.up.railway.app/api/telegram/webhook"

# Проверяем токен
Write-Host "Токен (первые 10 символов): $($token.Substring(0, [Math]::Min(10, $token.Length)))..." -ForegroundColor Cyan

# Обновляем webhook
$response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook" -Method Post -Body @{
    url = $webhookUrl
} -ContentType "application/x-www-form-urlencoded"

$response | ConvertTo-Json
```

#### Вариант B: Через браузер

1. Убедитесь, что токен правильный (см. Шаг 1)
2. Откройте в браузере (замените `ВАШ_ТОКЕН`):

```
https://api.telegram.org/botВАШ_ТОКЕН/setWebhook?url=https://history-character.up.railway.app/api/telegram/webhook
```

**Важно:** 
- Не должно быть пробелов в URL
- Токен должен быть сразу после `/bot` без пробелов
- URL должен быть полным с `https://`

#### Вариант C: Через curl (если установлен)

```bash
curl -X POST "https://api.telegram.org/botВАШ_ТОКЕН/setWebhook" \
  -d "url=https://history-character.up.railway.app/api/telegram/webhook"
```

### Шаг 4: Проверьте, что бот существует

Выполните запрос (замените `ВАШ_ТОКЕН`):

```
https://api.telegram.org/botВАШ_ТОКЕН/getMe
```

Должны увидеть:
```json
{
  "ok": true,
  "result": {
    "id": 123456789,
    "is_bot": true,
    "first_name": "Имя вашего бота",
    "username": "имя_бота"
  }
}
```

Если получаете 404 здесь — токен неправильный.

## Частые ошибки

### ❌ Ошибка 1: Пробелы в токене

**Неправильно:**
```
https://api.telegram.org/bot 1234567890:ABC... /setWebhook
```

**Правильно:**
```
https://api.telegram.org/bot1234567890:ABC.../setWebhook
```

### ❌ Ошибка 2: Неправильный формат URL

**Неправильно:**
```
https://api.telegram.org/bot/setWebhook?token=ВАШ_ТОКЕН&url=...
```

**Правильно:**
```
https://api.telegram.org/botВАШ_ТОКЕН/setWebhook?url=...
```

### ❌ Ошибка 3: Токен от другого бота

Убедитесь, что используете токен именно того бота, который должен обрабатывать команды.

## Проверка после исправления

1. **Проверьте webhook:**
   ```
   https://api.telegram.org/botВАШ_ТОКЕН/getWebhookInfo
   ```

2. **Проверьте диагностику:**
   ```
   https://history-character.up.railway.app/api/telegram/debug
   ```

3. **Отправьте боту `/start`** — бот должен ответить

## Если ничего не помогает

1. **Создайте нового бота:**
   - Откройте [@BotFather](https://t.me/BotFather)
   - Отправьте `/newbot`
   - Следуйте инструкциям
   - Получите новый токен

2. **Обновите токен в Railway:**
   - Перейдите в Variables
   - Обновите `TELEGRAM_BOT_TOKEN_BASE` или `TELEGRAM_BOT_TOKEN`
   - Сохраните

3. **Обновите webhook с новым токеном**

---

**Удачи! 🚀**
