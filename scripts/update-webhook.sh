#!/bin/bash

# Скрипт для обновления Telegram webhook
# Использование: bash scripts/update-webhook.sh

# Получаем токен из переменной окружения или запрашиваем у пользователя
TOKEN="${TELEGRAM_BOT_TOKEN_BASE:-$TELEGRAM_BOT_TOKEN}"

if [ -z "$TOKEN" ]; then
    echo "Токен бота не найден в переменных окружения."
    read -p "Введите токен бота от @BotFather: " TOKEN
fi

# URL webhook
WEBHOOK_URL="https://historical-characters.up.railway.app/api/telegram/webhook"

echo "Обновление webhook..."
echo "URL: $WEBHOOK_URL"

# Обновляем webhook
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${TOKEN}/setWebhook" \
    -d "url=${WEBHOOK_URL}")

if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✓ Webhook успешно обновлен!"
else
    echo "✗ Ошибка обновления webhook"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
fi

echo ""
echo "Проверка webhook..."

# Проверяем webhook
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${TOKEN}/getWebhookInfo")

if echo "$WEBHOOK_INFO" | grep -q '"ok":true'; then
    URL=$(echo "$WEBHOOK_INFO" | jq -r '.result.url' 2>/dev/null)
    PENDING=$(echo "$WEBHOOK_INFO" | jq -r '.result.pending_update_count' 2>/dev/null)
    ERROR=$(echo "$WEBHOOK_INFO" | jq -r '.result.last_error_message // "нет"' 2>/dev/null)
    
    echo "Текущий webhook URL: $URL"
    echo "Ожидающий обновлений: $PENDING"
    
    if [ "$ERROR" != "нет" ] && [ "$ERROR" != "null" ]; then
        echo "Последняя ошибка: $ERROR"
    fi
    
    if [ "$URL" = "$WEBHOOK_URL" ]; then
        echo "✓ Webhook настроен правильно!"
    else
        echo "⚠ Webhook указывает на другой URL"
    fi
else
    echo "✗ Ошибка при проверке webhook"
    echo "$WEBHOOK_INFO" | jq '.' 2>/dev/null || echo "$WEBHOOK_INFO"
fi
