# Скрипт для диагностики и исправления проблем с админ-ботом
# Использование: .\scripts\fix-admin-bot.ps1

Write-Host "=== Диагностика админ-бота ===" -ForegroundColor Cyan
Write-Host ""

# Получаем токен
$token = $env:TELEGRAM_BOT_TOKEN_BASE
if (-not $token) {
    $token = $env:TELEGRAM_BOT_TOKEN
}

if (-not $token) {
    Write-Host "❌ ОШИБКА: TELEGRAM_BOT_TOKEN_BASE или TELEGRAM_BOT_TOKEN не установлены!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Установите переменную окружения:" -ForegroundColor Yellow
    Write-Host "  $env:TELEGRAM_BOT_TOKEN_BASE = 'ВАШ_ТОКЕН'" -ForegroundColor Gray
    Write-Host "  или" -ForegroundColor Gray
    Write-Host "  $env:TELEGRAM_BOT_TOKEN = 'ВАШ_ТОКЕН'" -ForegroundColor Gray
    exit 1
}

$token = $token.Trim()
Write-Host "✓ Токен найден (длина: $($token.Length))" -ForegroundColor Green

# Проверяем формат токена
if ($token -notmatch '^\d+:[A-Za-z0-9_-]+$') {
    Write-Host "⚠️  Предупреждение: Токен имеет необычный формат" -ForegroundColor Yellow
}

# Проверяем токен через getMe
Write-Host ""
Write-Host "Проверка токена через Telegram API..." -ForegroundColor Cyan
try {
    $getMeResponse = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getMe" -Method Get -TimeoutSec 10
    if ($getMeResponse.ok) {
        Write-Host "✓ Токен валидный. Бот: @$($getMeResponse.result.username)" -ForegroundColor Green
    } else {
        Write-Host "❌ Токен невалидный!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Ошибка при проверке токена: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Получаем информацию о webhook
Write-Host ""
Write-Host "Проверка webhook..." -ForegroundColor Cyan
try {
    $webhookInfo = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getWebhookInfo" -Method Get -TimeoutSec 10
    if ($webhookInfo.ok) {
        $webhookUrl = $webhookInfo.result.url
        $pendingUpdates = $webhookInfo.result.pending_update_count
        $lastError = $webhookInfo.result.last_error_message
        
        Write-Host "  URL: $webhookUrl" -ForegroundColor Gray
        Write-Host "  Ожидающих обновлений: $pendingUpdates" -ForegroundColor Gray
        
        if ($lastError) {
            Write-Host "  ❌ Последняя ошибка: $lastError" -ForegroundColor Red
        }
        
        if ($pendingUpdates -gt 0) {
            Write-Host "  ⚠️  Есть необработанные обновления ($pendingUpdates)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Ошибка при проверке webhook: $($_.Exception.Message)" -ForegroundColor Red
}

# Получаем NEXTAUTH_URL
$nextAuthUrl = $env:NEXTAUTH_URL
if (-not $nextAuthUrl) {
    Write-Host ""
    Write-Host "⚠️  NEXTAUTH_URL не установлен" -ForegroundColor Yellow
    $nextAuthUrl = Read-Host "Введите полный URL вашего приложения (например, https://history-character.up.railway.app)"
}

$webhookUrl = "$nextAuthUrl/api/telegram/webhook"
Write-Host ""
Write-Host "Ожидаемый webhook URL: $webhookUrl" -ForegroundColor Cyan

# Проверяем, правильно ли настроен webhook
if ($webhookInfo.result.url -ne $webhookUrl) {
    Write-Host ""
    Write-Host "⚠️  Webhook настроен неправильно!" -ForegroundColor Yellow
    Write-Host "  Текущий: $($webhookInfo.result.url)" -ForegroundColor Gray
    Write-Host "  Ожидаемый: $webhookUrl" -ForegroundColor Gray
    
    $update = Read-Host "Обновить webhook? (y/n)"
    if ($update -eq 'y' -or $update -eq 'Y') {
        Write-Host ""
        Write-Host "Обновление webhook..." -ForegroundColor Cyan
        try {
            $setWebhookResponse = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook?url=$([System.Web.HttpUtility]::UrlEncode($webhookUrl))" -Method Get -TimeoutSec 10
            if ($setWebhookResponse.ok) {
                Write-Host "✓ Webhook успешно обновлен!" -ForegroundColor Green
            } else {
                Write-Host "❌ Ошибка при обновлении webhook: $($setWebhookResponse.description)" -ForegroundColor Red
            }
        } catch {
            Write-Host "❌ Ошибка при обновлении webhook: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "✓ Webhook настроен правильно" -ForegroundColor Green
}

# Проверяем TELEGRAM_ADMIN_ID
Write-Host ""
Write-Host "Проверка TELEGRAM_ADMIN_ID..." -ForegroundColor Cyan
$adminId = $env:TELEGRAM_ADMIN_ID
if (-not $adminId) {
    Write-Host "⚠️  TELEGRAM_ADMIN_ID не установлен!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Чтобы получить ваш Telegram ID:" -ForegroundColor Yellow
    Write-Host "  1. Откройте @userinfobot в Telegram" -ForegroundColor Gray
    Write-Host "  2. Отправьте ему любое сообщение" -ForegroundColor Gray
    Write-Host "  3. Он покажет ваш ID (число, например: 123456789)" -ForegroundColor Gray
    Write-Host ""
    $adminId = Read-Host "Введите ваш Telegram ID (или нажмите Enter, чтобы пропустить)"
    if ($adminId) {
        Write-Host ""
        Write-Host "Установите переменную окружения в Railway:" -ForegroundColor Yellow
        Write-Host "  TELEGRAM_ADMIN_ID=$adminId" -ForegroundColor Gray
    }
} else {
    Write-Host "✓ TELEGRAM_ADMIN_ID установлен: $adminId" -ForegroundColor Green
}

# Проверяем доступность endpoint
Write-Host ""
Write-Host "Проверка доступности webhook endpoint..." -ForegroundColor Cyan
try {
    $healthCheck = Invoke-WebRequest -Uri "$nextAuthUrl/api/health" -Method Get -TimeoutSec 10 -UseBasicParsing
    if ($healthCheck.StatusCode -eq 200) {
        Write-Host "✓ Сайт доступен" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Сайт недоступен: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Проверьте, что приложение развернуто и работает" -ForegroundColor Yellow
}

# Итоговая информация
Write-Host ""
Write-Host "=== Итоговая диагностика ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Для проверки работы бота:" -ForegroundColor Yellow
Write-Host "  1. Откройте вашего бота в Telegram" -ForegroundColor Gray
Write-Host "  2. Отправьте команду /start" -ForegroundColor Gray
Write-Host "  3. Если вы админ (TELEGRAM_ADMIN_ID совпадает с вашим ID), вы получите статистику" -ForegroundColor Gray
Write-Host ""
Write-Host "Для проверки диагностики через API:" -ForegroundColor Yellow
Write-Host "  Откройте: $nextAuthUrl/api/telegram/debug" -ForegroundColor Gray
Write-Host ""
