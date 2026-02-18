# Быстрое исправление webhook URL
# Использование: .\scripts\fix-webhook-url.ps1

Write-Host "=== Исправление Webhook URL ===" -ForegroundColor Cyan
Write-Host ""

# Правильный URL
$correctUrl = "https://history-character.up.railway.app/api/telegram/webhook"

Write-Host "Ожидаемый URL: $correctUrl" -ForegroundColor Yellow
Write-Host ""

# Запрашиваем токен
Write-Host "Введите токен бота из Railway (TELEGRAM_BOT_TOKEN_BASE или TELEGRAM_BOT_TOKEN):" -ForegroundColor Yellow
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
        exit 0
    }
} catch {
    Write-Host "  ⚠️  Не удалось получить информацию о webhook" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Обновление webhook на правильный URL..." -ForegroundColor Cyan
Write-Host "  URL: $correctUrl" -ForegroundColor Gray
Write-Host ""

# Обновляем webhook
try {
    $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook" -Method Post -Body @{
        url = $correctUrl
    } -ContentType "application/x-www-form-urlencoded"
    
    if ($response.ok) {
        Write-Host "✓ Webhook успешно обновлен!" -ForegroundColor Green
        Write-Host ""
        
        # Проверяем результат
        Write-Host "Проверка результата..." -ForegroundColor Cyan
        $webhookInfo = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getWebhookInfo" -Method Get
        
        Write-Host ""
        Write-Host "Текущий webhook: $($webhookInfo.result.url)" -ForegroundColor Cyan
        Write-Host "Ожидающих обновлений: $($webhookInfo.result.pending_update_count)" -ForegroundColor Cyan
        
        if ($webhookInfo.result.last_error_message) {
            Write-Host "Последняя ошибка: $($webhookInfo.result.last_error_message)" -ForegroundColor Yellow
        }
        
        if ($webhookInfo.result.url -eq $correctUrl) {
            Write-Host ""
            Write-Host "✅ Все исправлено!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Теперь попробуйте:" -ForegroundColor Yellow
            Write-Host "  1. Откройте вашего бота в Telegram" -ForegroundColor Gray
            Write-Host "  2. Отправьте команду /start" -ForegroundColor Gray
            Write-Host "  3. Если вы админ, вы получите статистику" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ Ошибка обновления webhook: $($response.description)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
