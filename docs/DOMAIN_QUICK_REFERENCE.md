# 🚀 Быстрая справка: Домены для ботов

## 📍 Где настраивать

**Railway → Ваш проект → Variables (Переменные окружения)**

## ✅ Правильный формат

### `NEXTAUTH_URL` (ОБЯЗАТЕЛЬНО)

```
✅ https://history-character.up.railway.app
✅ https://my-app.up.railway.app
✅ https://custom-domain.com
```

**Правила:**
- ✅ Начинается с `https://`
- ✅ Без слэша в конце
- ✅ Без путей (`/api`, `/admin`)
- ✅ Без порта

**Неправильно:**
```
❌ http://domain.com  (без s)
❌ domain.com  (без протокола)
❌ https://domain.com/  (слэш в конце)
❌ https://domain.com:3000  (порт)
```

## 🔗 Автоматически формируемые URL

Из `NEXTAUTH_URL` автоматически создаются:

| Переменная | Результат |
|------------|-----------|
| `NEXTAUTH_URL=https://domain.com` | Webhook: `https://domain.com/api/telegram/webhook` |
| `NEXTAUTH_URL=https://domain.com` | Админ-панель: `https://domain.com/admin?token=...` |
| `NEXTAUTH_URL=https://domain.com` | Диагностика: `https://domain.com/api/telegram/debug` |

## 🔧 Обновление webhook

После изменения `NEXTAUTH_URL`:

```powershell
# Способ 1: Скрипт
.\scripts\update-webhook.ps1

# Способ 2: API (после деплоя)
# Откройте: https://ваш-домен.railway.app/api/telegram/set-webhook
```

## ✅ Чеклист

- [ ] `NEXTAUTH_URL` = `https://ваш-домен.railway.app` (без слэша!)
- [ ] `TELEGRAM_BOT_TOKEN_BASE` или `TELEGRAM_BOT_TOKEN` установлен
- [ ] `TELEGRAM_ADMIN_ID` установлен (для админ-бота)
- [ ] Webhook обновлен после изменения домена
- [ ] Проверена диагностика: `/api/telegram/debug`

## 🐛 Быстрая диагностика

```
https://ваш-домен.railway.app/api/telegram/debug
```

**Должно быть:**
- ✅ `webhook.telegramInfo.url` = правильный URL
- ✅ `webhook.telegramInfo.pendingUpdateCount` = 0
- ✅ Нет ошибок ❌

## 📝 Пример для Railway

```
NEXTAUTH_URL=https://history-character.up.railway.app
TELEGRAM_BOT_TOKEN_BASE=1234567890:ABC...
TELEGRAM_ADMIN_ID=1437715377
```

---

📚 Подробная документация: [TELEGRAM_DOMAIN_SETUP.md](./TELEGRAM_DOMAIN_SETUP.md)
