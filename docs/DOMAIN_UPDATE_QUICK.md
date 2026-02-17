# ⚡ Быстрая инструкция: Обновление домена

## 🎯 Что нужно сделать после смены домена:

### 1️⃣ BotFather (Telegram)
```
/setdomain → выберите бота → введите домен (без https://)
```

### 2️⃣ Railway (Переменные окружения)
```
NEXTAUTH_URL = https://ваш-новый-домен.com
```

### 3️⃣ Обновить Webhook
Запустите скрипт:
```powershell
.\scripts\update-webhook.ps1
```

Или вручную через браузер:
```
https://api.telegram.org/botВАШ_ТОКЕН/setWebhook?url=https://ВАШ_ДОМЕН/api/telegram/webhook
```

### 4️⃣ Проверка
- Откройте: `https://ваш-новый-домен.com/api/telegram/debug`
- Проверьте виджет: `https://ваш-новый-домен.com/login`
- Отправьте `/start` боту в Telegram

---

📖 **Подробная инструкция:** [HOW_TO_UPDATE_DOMAIN.md](./HOW_TO_UPDATE_DOMAIN.md)
