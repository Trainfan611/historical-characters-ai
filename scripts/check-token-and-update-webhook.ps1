# Проверка токена и обновление webhook
# Использование: .\scripts\check-token-and-update-webhook.ps1

Write-Host "=== Проверка токена и обновление webhook ===" -ForegroundColor Cyan
Write-Host ""

# Запрашиваем токен
Write-Host "Введите токен бота (можно скопировать из Railway Variables):" -ForegroundColor Yellow
Write-Host "Формат: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz" -ForegroundColor Gray
Write-Host ""
$token = Read-Host "Токен"
$token = $token.Trim()

if (-not $token) {
    Write-Host "❌ Токен не введен!" -ForegroundColor Red
    exit 1
}

# Убираем возможные пробелы
$token = $token -replace '\s+', ''

Write-Host ""
Write-Host "Проверка токена..." -ForegroundColor Cyan

# Проверяем токен через getMe
try {
    $botInfo = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getMe" -Method Get -ErrorAction Stop
    
    if ($botInfo.ok) {
        Write-Host "✓ Токен валидный!" -ForegroundColor Green
        Write-Host "  Бот: @$($botInfo.result.username)" -ForegroundColor Gray
        Write-Host "  Имя: $($botInfo.result.first_name)" -ForegroundColor Gray
        Write-Host "  ID: $($botInfo.result.id)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Токен невалидный: $($botInfo.description)" -ForegroundColor Red
        exit 1
    }
} catch {
    $errorMsg = $_.Exception.Message
    Write-Host "❌ Ошибка проверки токена!" -ForegroundColor Red
    
    if ($errorMsg -like "*404*") {
        Write-Host ""
        Write-Host "Возможные причины:" -ForegroundColor Yellow
        Write-Host "  1. Токен неправильный или неполный" -ForegroundColor Gray
        Write-Host "  2. Бот был удален" -ForegroundColor Gray
        Write-Host "  3. В токене есть лишние пробелы или символы" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Решение:" -ForegroundColor Yellow
        Write-Host "  1. Откройте Railway → Variables" -ForegroundColor Gray
        Write-Host "  2. Найдите TELEGRAM_BOT_TOKEN_BASE или TELEGRAM_BOT_TOKEN" -ForegroundColor Gray
        Write-Host "  3. Скопируйте токен заново (убедитесь, что скопировали полностью)" -ForegroundColor Gray
        Write-Host "  4. Или создайте нового бота через @BotFather" -ForegroundColor Gray
    } else {
        Write-Host "  Ошибка: $errorMsg" -ForegroundColor Red
    }
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
} catch {
    Write-Host "  ⚠️  Не удалось получить информацию о webhook" -ForegroundColor Yellow
}

# Правильный URL
$correctUrl = "https://history-character.up.railway.app/api/telegram/webhook"

Write-Host ""
Write-Host "Обновление webhook..." -ForegroundColor Cyan
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
        }
    } else {
        Write-Host "❌ Ошибка обновления webhook: $($response.description)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
