# Проверка и настройка основного бота (TELEGRAM_BOT_TOKEN)
# Использование: .\scripts\fix-main-bot-webhook.ps1

Write-Host "=== Проверка основного бота (TELEGRAM_BOT_TOKEN) ===" -ForegroundColor Cyan
Write-Host ""

# Правильный URL (если нужен webhook для основного бота)
$correctUrl = "https://history-character.up.railway.app/api/telegram/webhook"

Write-Host "Ожидаемый URL: $correctUrl" -ForegroundColor Yellow
Write-Host ""

# Запрашиваем токен
Write-Host "Введите токен основного бота из Railway (TELEGRAM_BOT_TOKEN):" -ForegroundColor Yellow
$token = Read-Host "Токен"
$token = $token.Trim()

if (-not $token) {
    Write-Host "❌ Токен не введен!" -ForegroundColor Red
    exit 1
}

# Убираем пробелы
$token = $token -replace '\s+', ''

Write-Host ""
Write-Host "Проверка токена..." -ForegroundColor Cyan

# Проверяем токен
try {
    $botInfo = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getMe" -Method Get -ErrorAction Stop
    
    if ($botInfo.ok) {
        Write-Host "✓ Токен валидный. Бот: @$($botInfo.result.username)" -ForegroundColor Green
        Write-Host "  Имя: $($botInfo.result.first_name)" -ForegroundColor Gray
        Write-Host "  ID: $($botInfo.result.id)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Токен невалидный" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Ошибка проверки токена: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Проверка текущего webhook..." -ForegroundColor Cyan

# Проверяем текущий webhook
try {
    $webhookInfo = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getWebhookInfo" -Method Get
    
    Write-Host "  Текущий URL: $($webhookInfo.result.url)" -ForegroundColor Gray
    Write-Host "  Ожидающих обновлений: $($webhookInfo.result.pending_update_count)" -ForegroundColor Gray
    
    if ($webhookInfo.result.last_error_message) {
        Write-Host "  Последняя ошибка: $($webhookInfo.result.last_error_message)" -ForegroundColor Yellow
    }
    
    if ($webhookInfo.result.url -eq $correctUrl) {
        Write-Host ""
        Write-Host "✓ Webhook уже настроен правильно!" -ForegroundColor Green
    } elseif ($webhookInfo.result.url -and $webhookInfo.result.url -ne '') {
        Write-Host ""
        Write-Host "⚠️  Webhook указывает на другой URL" -ForegroundColor Yellow
        Write-Host "  Текущий: $($webhookInfo.result.url)" -ForegroundColor Gray
        Write-Host "  Ожидаемый: $correctUrl" -ForegroundColor Gray
        
        $update = Read-Host "`nОбновить webhook на правильный URL? (y/n)"
        if ($update -eq 'y' -or $update -eq 'Y') {
            Write-Host ""
            Write-Host "Обновление webhook..." -ForegroundColor Cyan
            
            try {
                $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook" -Method Post -Body @{
                    url = $correctUrl
                } -ContentType "application/x-www-form-urlencoded"
                
                if ($response.ok) {
                    Write-Host "✓ Webhook успешно обновлен!" -ForegroundColor Green
                } else {
                    Write-Host "❌ Ошибка обновления webhook: $($response.description)" -ForegroundColor Red
                }
            } catch {
                Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host ""
        Write-Host "ℹ️  Webhook не настроен" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Примечание: Основной бот (TELEGRAM_BOT_TOKEN) обычно используется для:" -ForegroundColor Yellow
        Write-Host "  - Telegram Login Widget (авторизация)" -ForegroundColor Gray
        Write-Host "  - Проверка подписки на канал" -ForegroundColor Gray
        Write-Host "  - Получение информации о пользователе" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Webhook обычно настраивается для админ-бота (TELEGRAM_BOT_TOKEN_BASE)" -ForegroundColor Gray
        Write-Host ""
        
        $setup = Read-Host "Настроить webhook для основного бота? (y/n)"
        if ($setup -eq 'y' -or $setup -eq 'Y') {
            Write-Host ""
            Write-Host "Настройка webhook..." -ForegroundColor Cyan
            
            try {
                $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook" -Method Post -Body @{
                    url = $correctUrl
                } -ContentType "application/x-www-form-urlencoded"
                
                if ($response.ok) {
                    Write-Host "✓ Webhook успешно настроен!" -ForegroundColor Green
                } else {
                    Write-Host "❌ Ошибка настройки webhook: $($response.description)" -ForegroundColor Red
                }
            } catch {
                Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
} catch {
    Write-Host "  ⚠️  Не удалось получить информацию о webhook" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Проверка конфигурации в Railway..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Убедитесь, что в Railway установлены:" -ForegroundColor Yellow
Write-Host "  - TELEGRAM_BOT_TOKEN = токен основного бота" -ForegroundColor Gray
Write-Host "  - NEXT_PUBLIC_TELEGRAM_BOT_USERNAME = имя основного бота без @" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Проверка завершена!" -ForegroundColor Green
Write-Host ""
