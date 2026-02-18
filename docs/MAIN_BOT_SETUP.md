# 🤖 Настройка основного бота (TELEGRAM_BOT_TOKEN)

## 📋 Назначение основного бота

Основной бот (`TELEGRAM_BOT_TOKEN`) используется для:

- ✅ **Telegram Login Widget** - авторизация пользователей на сайте
- ✅ **Проверка подписки** - проверка, подписан ли пользователь на канал
- ✅ **Получение информации о пользователе** - через Telegram API

## 🔧 Настройка

### 1. Получите токен бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/mybots`
3. Выберите вашего основного бота
4. Выберите "API Token"
5. Скопируйте токен

### 2. Установите в Railway

**Railway → Ваш проект → Variables:**

```
TELEGRAM_BOT_TOKEN=ваш_токен_основного_бота
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=имя_бота_без_@
```

**Пример:**
```
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=history_characters_bot
```

### 3. Настройте домен в BotFather

1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте `/setdomain`
3. Выберите вашего основного бота
4. Укажите домен: `history-character.up.railway.app`

## 🔍 Проверка

### Проверка 1: Токен валидный

Откройте в браузере (замените `YOUR_TOKEN`):
```
https://api.telegram.org/botYOUR_TOKEN/getMe
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

### Проверка 2: Telegram Login Widget работает

1. Откройте сайт: `https://history-character.up.railway.app/login`
2. Должен отображаться виджет входа через Telegram
3. Попробуйте войти

### Проверка 3: Проверка подписки работает

1. Войдите на сайт
2. Перейдите на `/generate`
3. Система должна проверить подписку на канал

## ⚠️ Важно

### Webhook для основного бота

**Обычно НЕ нужен**, так как основной бот используется для:
- Прямых API вызовов (проверка подписки, получение информации)
- Telegram Login Widget (работает через виджет, не требует webhook)

**Webhook нужен только если:**
- Вы хотите, чтобы основной бот тоже обрабатывал команды
- У вас один бот для всех функций

### Если у вас два разных бота

- **Основной бот** (`TELEGRAM_BOT_TOKEN`) - для логина и проверки подписки
- **Админ-бот** (`TELEGRAM_BOT_TOKEN_BASE`) - для команд `/start`, `/admin`

В этом случае webhook настраивается только для админ-бота.

## 🔧 Использование скрипта

Для проверки основного бота используйте:

```powershell
.\scripts\fix-main-bot-webhook.ps1
```

Скрипт проверит:
- ✅ Валидность токена
- ✅ Текущий webhook (если настроен)
- ✅ Конфигурацию в Railway

## 📝 Чеклист

- [ ] Бот создан через @BotFather
- [ ] Токен получен и установлен в Railway (`TELEGRAM_BOT_TOKEN`)
- [ ] `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` установлен (имя бота без @)
- [ ] Домен настроен в BotFather через `/setdomain`
- [ ] Токен валидный (проверено через `/getMe`)
- [ ] Telegram Login Widget работает
- [ ] Проверка подписки работает

## 🐛 Решение проблем

### Проблема: Telegram Login Widget не работает

**Причины:**
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` не соответствует токену
- Домен не настроен в BotFather
- Токен неправильный

**Решение:**
1. Проверьте, что `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` = имя бота без @
2. Настройте домен в BotFather через `/setdomain`
3. Проверьте токен через `/getMe`

### Проблема: Проверка подписки не работает

**Причины:**
- Токен неправильный
- Бот не добавлен как администратор канала
- `TELEGRAM_CHANNEL_ID` неправильный

**Решение:**
1. Проверьте токен через `/getMe`
2. Убедитесь, что бот добавлен как администратор канала
3. Проверьте `TELEGRAM_CHANNEL_ID` в Railway

## 💡 Полезные ссылки

- [BotFather](https://t.me/BotFather) - управление ботами
- Диагностика: `https://history-character.up.railway.app/api/telegram/debug`
- Проверка токена: `https://api.telegram.org/botYOUR_TOKEN/getMe`
