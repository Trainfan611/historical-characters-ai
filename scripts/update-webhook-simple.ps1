# Простое обновление webhook для Telegram бота
# Использование: .\scripts\update-webhook-simple.ps1

Write-Host "=== Обновление Telegram Webhook ===" -ForegroundColor Cyan
Write-Host ""

# Запрашиваем токен
$token = Read-Host "Введите токен бота (TELEGRAM_BOT_TOKEN_BASE или TELEGRAM_BOT_TOKEN)"
$token = $token.Trim()

if (-not $token) {
    Write-Host "❌ Токен не введен!" -ForegroundColor Red
    exit 1
}

# Проверяем формат токена
if ($token -notmatch '^\d+:[A-Za-z0-9_-]+$') {
    Write-Host "⚠️  Предупреждение: Токен может быть неправильного формата" -ForegroundColor Yellow
    Write-Host "Продолжаем..." -ForegroundColor Gray
}

# Правильный URL webhook
$correctUrl = "https://history-character.up.railway.app/api/telegram/webhook"

Write-Host ""
Write-Host "Обновление webhook..." -ForegroundColor Cyan
Write-Host "URL: $correctUrl" -ForegroundColor Gray
Write-Host ""

try {
    # Проверяем токен
    Write-Host "Проверка токена..." -ForegroundColor Cyan
    $botInfo = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getMe" -Method Get -ErrorAction Stop
    if ($botInfo.ok) {
        Write-Host "✓ Токен валидный. Бот: @$($botInfo.result.username)" -ForegroundColor Green
    } else {
        Write-Host "❌ Токен невалидный" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "Обновление webhook..." -ForegroundColor Cyan
    
    # Обновляем webhook
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
        } else {
            Write-Host ""
            Write-Host "⚠️  Webhook обновлен, но URL не совпадает" -ForegroundColor Yellow
            Write-Host "  Ожидаемый: $correctUrl" -ForegroundColor Gray
            Write-Host "  Текущий: $($webhookInfo.result.url)" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ Ошибка обновления webhook: $($response.description)" -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Message -like "*404*") {
        Write-Host ""
        Write-Host "Возможные причины:" -ForegroundColor Yellow
        Write-Host "  - Токен неправильный" -ForegroundColor Gray
        Write-Host "  - Бот не существует" -ForegroundColor Gray
    }
}

Write-Host ""
