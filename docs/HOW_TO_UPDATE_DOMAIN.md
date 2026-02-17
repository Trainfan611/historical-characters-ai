# 🔄 Как обновить домен после его изменения

Если вы поменяли домен вашего приложения, нужно выполнить следующие шаги:

## 📋 Шаг 1: Обновить домен в BotFather

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/setdomain`
3. Выберите вашего бота
4. Введите **только домен** (без `https://` и без `/`):
   ```
   history-character.up.railway.app
   ```
   или
   ```
   ваш-новый-домен.com
   ```

**Важно:** Указывайте только домен, без протокола и путей!

---

## 🔧 Шаг 2: Обновить переменную окружения NEXTAUTH_URL в Railway

1. Откройте ваш проект в [Railway](https://railway.app)
2. Перейдите в **Variables** (Переменные окружения)
3. Найдите переменную `NEXTAUTH_URL`
4. Обновите её на новый домен:
   ```
   https://ваш-новый-домен.com
   ```
   или
   ```
   https://history-character.up.railway.app
   ```
5. Сохраните изменения

**Примечание:** Railway автоматически перезапустит приложение после изменения переменных.

---

## 🔗 Шаг 3: Обновить Telegram Webhook

После обновления `NEXTAUTH_URL` нужно обновить webhook для Telegram бота.

### Способ 1: Через PowerShell скрипт (Рекомендуется) ⭐

1. Откройте PowerShell
2. Перейдите в папку проекта:
   ```powershell
   cd C:\Users\Dell\historical-characters-ai
   ```
3. Запустите скрипт:
   ```powershell
   .\scripts\update-webhook.ps1
   ```
4. Скрипт попросит ввести новый домен (если не найдет в переменных окружения)

### Способ 2: Вручную через браузер

1. Получите токен бота от @BotFather:
   - Отправьте `/mybots`
   - Выберите вашего бота
   - Выберите "API Token"
   - Скопируйте токен

2. Откройте в браузере (замените `ВАШ_ТОКЕН` и `ВАШ_ДОМЕН`):
   ```
   https://api.telegram.org/botВАШ_ТОКЕН/setWebhook?url=https://ВАШ_ДОМЕН/api/telegram/webhook
   ```

   Пример:
   ```
   https://api.telegram.org/bot1234567890:ABCdefGHIjklMNOpqrsTUVwxyz/setWebhook?url=https://history-character.up.railway.app/api/telegram/webhook
   ```

3. Должны увидеть:
   ```json
   {
     "ok": true,
     "result": true,
     "description": "Webhook was set"
   }
   ```

### Способ 3: Через curl в PowerShell

```powershell
$token = "ВАШ_ТОКЕН"
$domain = "ВАШ_ДОМЕН"  # Например: history-character.up.railway.app
$webhookUrl = "https://$domain/api/telegram/webhook"

Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook" -Method Post -Body @{
    url = $webhookUrl
} -ContentType "application/x-www-form-urlencoded"
```

---

## ✅ Шаг 4: Проверка

### 1. Проверьте диагностику бота

Откройте в браузере:
```
https://ваш-новый-домен.com/api/telegram/debug
```

Должны увидеть:
- `status: "ok"` (или `"warning"`, но не `"error"`)
- `webhook.url` указывает на правильный домен
- `pendingUpdateCount: 0` (или небольшое число)

### 2. Проверьте Telegram виджет

1. Откройте страницу входа:
   ```
   https://ваш-новый-домен.com/login
   ```
2. Проверьте, что кнопка "Login with Telegram" отображается
3. Попробуйте войти — не должно быть ошибки "Bot domain invalid"

### 3. Проверьте работу бота

1. Откройте вашего бота в Telegram
2. Отправьте команду `/start`
3. Бот должен ответить (если вы админ — статистикой)

---

## 🐛 Решение проблем

### Проблема: "Bot domain invalid"

**Причины:**
- Домен не обновлен в BotFather
- Неправильный формат домена в BotFather (с `https://` или `/`)

**Решение:**
1. Проверьте, что в BotFather указан только домен (без `https://` и `/`)
2. Подождите 1-2 минуты после обновления
3. Очистите кэш браузера (Ctrl+Shift+Delete)

### Проблема: Webhook не обновляется

**Решение:**
1. Проверьте, что `NEXTAUTH_URL` обновлен в Railway
2. Подождите 1-2 минуты после обновления переменной
3. Попробуйте обновить webhook еще раз

### Проблема: Бот не отвечает

**Решение:**
1. Проверьте webhook через:
   ```
   https://api.telegram.org/botВАШ_ТОКЕН/getWebhookInfo
   ```
2. Убедитесь, что URL правильный
3. Проверьте логи Railway на наличие ошибок

---

## 📝 Чек-лист

- [ ] Домен обновлен в BotFather через `/setdomain`
- [ ] `NEXTAUTH_URL` обновлен в Railway
- [ ] Webhook обновлен на новый URL
- [ ] Диагностика бота показывает `status: "ok"` или `"warning"`
- [ ] Telegram виджет работает без ошибок
- [ ] Бот отвечает на команды

---

**Удачи! 🚀**
