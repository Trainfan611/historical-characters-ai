# 🤖 Руководство по настройке ботов

## 📋 Два варианта настройки

### Вариант 1: Один бот (рекомендуется) ⭐

**Используйте один бот для всех функций.**

**Настройка в Railway:**
```
TELEGRAM_BOT_TOKEN=ваш_токен_бота
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=имя_бота_без_@
```

**Что работает:**
- ✅ Telegram Login Widget (авторизация)
- ✅ Проверка подписки на канал
- ✅ Админ-команды (`/start`, `/admin`)
- ✅ Webhook для обработки команд

**Преимущества:**
- Проще настроить
- Меньше переменных окружения
- Один бот для управления

### Вариант 2: Два разных бота

**Используйте два разных бота для разных функций.**

**Настройка в Railway:**
```
TELEGRAM_BOT_TOKEN=токен_основного_бота
TELEGRAM_BOT_TOKEN_BASE=токен_админ_бота
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=имя_основного_бота_без_@
```

**Что работает:**
- ✅ `TELEGRAM_BOT_TOKEN` - основной бот (логин, проверка подписки)
- ✅ `TELEGRAM_BOT_TOKEN_BASE` - админ-бот (команды `/start`, `/admin`)

**Важно:**
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` должен соответствовать `TELEGRAM_BOT_TOKEN`
- Webhook должен быть настроен для бота с токеном `TELEGRAM_BOT_TOKEN_BASE`

## 🔍 Как проверить, какой вариант у вас

### Проверка 1: Переменные окружения

Откройте Railway → Variables и проверьте:
- Если есть только `TELEGRAM_BOT_TOKEN` → Вариант 1 (один бот)
- Если есть и `TELEGRAM_BOT_TOKEN`, и `TELEGRAM_BOT_TOKEN_BASE` → Вариант 2 (два бота)

### Проверка 2: Диагностика

Откройте:
```
https://ваш-домен.railway.app/api/telegram/debug
```

Проверьте:
- `environment.tokenSource` - какой токен используется
- `environment.hasTokenBase` - есть ли `TELEGRAM_BOT_TOKEN_BASE`
- `environment.hasToken` - есть ли `TELEGRAM_BOT_TOKEN`

## 🔧 Исправление проблем

### Проблема: Основной бот не работает

**Причина:** `TELEGRAM_BOT_TOKEN` не установлен, а `TELEGRAM_BOT_TOKEN_BASE` установлен

**Решение:**
1. Установите `TELEGRAM_BOT_TOKEN` в Railway
2. Или используйте один бот (установите `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_TOKEN_BASE` можно удалить)

### Проблема: Админ-бот не работает

**Причина:** Webhook настроен неправильно или токен неверный

**Решение:**
1. Проверьте токен через `/getMe`
2. Обновите webhook через `/setWebhook`
3. Убедитесь, что используется правильный токен (`TELEGRAM_BOT_TOKEN_BASE` или `TELEGRAM_BOT_TOKEN`)

### Проблема: Telegram Login Widget не работает

**Причина:** `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` не соответствует `TELEGRAM_BOT_TOKEN`

**Решение:**
1. Проверьте, что `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` = имя бота без @
2. Убедитесь, что этот бот соответствует `TELEGRAM_BOT_TOKEN`
3. Настройте домен в BotFather через `/setdomain`

## 📝 Чеклист настройки

### Для одного бота:
- [ ] Создан бот через @BotFather
- [ ] Получен токен
- [ ] `TELEGRAM_BOT_TOKEN` установлен в Railway
- [ ] `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` установлен (имя бота без @)
- [ ] Домен настроен в BotFather через `/setdomain`
- [ ] Webhook обновлен

### Для двух ботов:
- [ ] Созданы два бота через @BotFather
- [ ] Получены токены обоих ботов
- [ ] `TELEGRAM_BOT_TOKEN` установлен (основной бот)
- [ ] `TELEGRAM_BOT_TOKEN_BASE` установлен (админ-бот)
- [ ] `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` = имя основного бота без @
- [ ] Домен настроен в BotFather для основного бота
- [ ] Webhook обновлен для админ-бота

## 💡 Рекомендации

1. **Для большинства случаев:** Используйте один бот (Вариант 1)
2. **Для разделения функций:** Используйте два бота (Вариант 2)
3. **Всегда проверяйте:** Что `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` соответствует `TELEGRAM_BOT_TOKEN`
4. **После изменения токенов:** Обновляйте webhook
