# Быстрое исправление webhook через Telegram API
# Использование: .\scripts\fix-webhook-now.ps1

$token = $env:TELEGRAM_BOT_TOKEN_BASE
if (-not $token) {
    $token = $env:TELEGRAM_BOT_TOKEN
}

if (-not $token) {
    Write-Host "❌ Токен не найден!" -ForegroundColor Red
    Write-Host "Установите TELEGRAM_BOT_TOKEN_BASE или TELEGRAM_BOT_TOKEN" -ForegroundColor Yellow
    exit 1
}

$token = $token.Trim()
$correctUrl = "https://history-character.up.railway.app/api/telegram/webhook"

Write-Host "Обновление webhook на правильный URL..." -ForegroundColor Cyan
Write-Host "URL: $correctUrl" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook" -Method Post -Body @{
        url = $correctUrl
    } -ContentType "application/x-www-form-urlencoded"
    
    if ($response.ok) {
        Write-Host "✓ Webhook успешно обновлен!" -ForegroundColor Green
        Write-Host ""
        
        # Проверяем результат
        $webhookInfo = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getWebhookInfo" -Method Get
        
        Write-Host "Текущий webhook: $($webhookInfo.result.url)" -ForegroundColor Cyan
        Write-Host "Ожидающих обновлений: $($webhookInfo.result.pending_update_count)" -ForegroundColor Cyan
        
        if ($webhookInfo.result.last_error_message) {
            Write-Host "Последняя ошибка: $($webhookInfo.result.last_error_message)" -ForegroundColor Yellow
        }
        
        if ($webhookInfo.result.url -eq $correctUrl) {
            Write-Host ""
            Write-Host "✓ Все исправлено! Теперь попробуйте отправить /start боту" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ Ошибка: $($response.description)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
}
