# 🌐 Настройка доменов для Telegram ботов

## 📍 Где настраиваются домены

Домены настраиваются в **Railway** (или другой платформе деплоя) в разделе **Variables** (Переменные окружения).

## 🔑 Обязательные переменные для ботов

### 1. `NEXTAUTH_URL` (ОБЯЗАТЕЛЬНО)

**Где:** Railway → Ваш проект → Variables → `NEXTAUTH_URL`

**Формат:**
```
https://ваш-домен.railway.app
```

**Примеры правильного формата:**
```
✅ https://history-character.up.railway.app
✅ https://my-app.up.railway.app
✅ https://custom-domain.com
```

**Примеры неправильного формата:**
```
❌ http://history-character.up.railway.app  (без https)
❌ history-character.up.railway.app  (без протокола)
❌ https://history-character.up.railway.app/  (лишний слэш в конце)
❌ https://history-character.up.railway.app/api  (с путем)
```

**Важно:**
- ✅ Должен начинаться с `https://`
- ✅ Должен заканчиваться доменом (без слэша в конце)
- ✅ Без путей (`/api`, `/admin` и т.д.)
- ✅ Без порта (Railway автоматически использует 443 для HTTPS)

### 2. `TELEGRAM_BOT_TOKEN_BASE` или `TELEGRAM_BOT_TOKEN`

**Где:** Railway → Ваш проект → Variables

**Формат:**
```
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

**Пример:**
```
TELEGRAM_BOT_TOKEN_BASE=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

**Важно:**
- Используется для отправки сообщений и настройки webhook
- Если установлены оба, приоритет у `TELEGRAM_BOT_TOKEN_BASE`

### 3. `TELEGRAM_ADMIN_ID` (для админ-бота)

**Где:** Railway → Ваш проект → Variables

**Формат:**
```
123456789
```

**Пример:**
```
TELEGRAM_ADMIN_ID=1437715377
```

**Как получить:**
1. Откройте [@userinfobot](https://t.me/userinfobot) в Telegram
2. Отправьте любое сообщение
3. Бот покажет ваш ID (число)

## 🔗 Как домены используются в коде

### Webhook URL формируется автоматически:

```typescript
const webhookUrl = `${NEXTAUTH_URL}/api/telegram/webhook`
```

**Пример:**
- Если `NEXTAUTH_URL = https://history-character.up.railway.app`
- То webhook будет: `https://history-character.up.railway.app/api/telegram/webhook`

### Ссылки на админ-панель:

```typescript
const adminUrl = `${NEXTAUTH_URL}/admin?token=${token}`
```

**Пример:**
- Если `NEXTAUTH_URL = https://history-character.up.railway.app`
- То ссылка будет: `https://history-character.up.railway.app/admin?token=abc123...`

## ✅ Чеклист настройки

### Для работы основного бота (авторизация):

- [ ] `NEXTAUTH_URL` установлен в Railway (формат: `https://домен.railway.app`)
- [ ] `TELEGRAM_BOT_TOKEN` или `TELEGRAM_BOT_TOKEN_BASE` установлен
- [ ] `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` установлен (имя бота без @)
- [ ] В BotFather настроен домен через `/setdomain`

### Для работы админ-бота:

- [ ] Все вышеперечисленное
- [ ] `TELEGRAM_ADMIN_ID` установлен (ваш Telegram ID)
- [ ] Webhook обновлен на правильный URL (см. ниже)

## 🔧 Обновление webhook после изменения домена

После изменения `NEXTAUTH_URL` нужно обновить webhook:

### Способ 1: Через скрипт (рекомендуется)

```powershell
.\scripts\update-webhook.ps1
```

Скрипт автоматически:
1. Возьмет `NEXTAUTH_URL` из переменных окружения
2. Сформирует правильный webhook URL
3. Обновит webhook через Telegram API

### Способ 2: Через API endpoint (после деплоя)

Откройте в браузере:
```
https://ваш-домен.railway.app/api/telegram/set-webhook
```

Или отправьте POST запрос:
```bash
curl -X POST https://ваш-домен.railway.app/api/telegram/set-webhook
```

### Способ 3: Вручную через Telegram API

Откройте в браузере (замените `YOUR_BOT_TOKEN`):
```
https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://ваш-домен.railway.app/api/telegram/webhook
```

## 🐛 Частые ошибки

### Ошибка 1: Webhook показывает 404

**Причина:** `NEXTAUTH_URL` не совпадает с реальным доменом приложения

**Решение:**
1. Проверьте реальный домен в Railway (Settings → Domains)
2. Убедитесь, что `NEXTAUTH_URL` точно совпадает
3. Обновите webhook (см. выше)

### Ошибка 2: "Wrong response from the webhook: 404 Not Found"

**Причина:** Webhook указывает на старый домен

**Решение:**
1. Обновите `NEXTAUTH_URL` в Railway
2. Обновите webhook через один из способов выше
3. Подождите 1-2 минуты после деплоя

### Ошибка 3: Бот не отвечает на команды

**Причина:** Webhook не настроен или настроен неправильно

**Решение:**
1. Проверьте диагностику: `https://ваш-домен.railway.app/api/telegram/debug`
2. Убедитесь, что webhook URL правильный
3. Обновите webhook

## 📊 Проверка правильности настройки

### 1. Проверьте диагностику

Откройте:
```
https://ваш-домен.railway.app/api/telegram/debug
```

**Что должно быть:**
- ✅ `environment.nextAuthUrl` = ваш домен
- ✅ `webhook.telegramInfo.url` = `https://ваш-домен.railway.app/api/telegram/webhook`
- ✅ `webhook.telegramInfo.pendingUpdateCount` = 0 (или небольшое число)
- ✅ Нет ошибок с ❌ в `issues`

### 2. Проверьте webhook вручную

Откройте в браузере (замените `YOUR_BOT_TOKEN`):
```
https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo
```

**Что должно быть:**
- ✅ `result.url` = `https://ваш-домен.railway.app/api/telegram/webhook`
- ✅ `result.pending_update_count` = 0
- ✅ `result.last_error_message` = null (или отсутствует)

## 📝 Пример полной конфигурации в Railway

```
NEXTAUTH_URL=https://history-character.up.railway.app
NEXTAUTH_SECRET=ваш-секретный-ключ
TELEGRAM_BOT_TOKEN_BASE=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_ADMIN_ID=1437715377
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_CHANNEL_ID=@your_channel
```

## 🔄 После изменения домена

1. ✅ Обновите `NEXTAUTH_URL` в Railway
2. ✅ Подождите 1-2 минуты (приложение перезапустится)
3. ✅ Обновите webhook (через скрипт или API)
4. ✅ Проверьте диагностику
5. ✅ Протестируйте бота (отправьте `/start`)

## 💡 Важные замечания

- **Не используйте `http://`** - только `https://`
- **Не добавляйте слэш в конце** - `https://domain.com` ✅, `https://domain.com/` ❌
- **Не добавляйте пути** - только домен
- **Railway автоматически предоставляет HTTPS** - не нужно настраивать SSL вручную
- **После изменения переменных** приложение автоматически перезапускается
