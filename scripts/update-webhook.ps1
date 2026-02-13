# Скрипт для обновления Telegram webhook
# Использование: .\scripts\update-webhook.ps1

# Получаем токен из переменной окружения или запрашиваем у пользователя
$token = $env:TELEGRAM_BOT_TOKEN_BASE
if (-not $token) {
    $token = $env:TELEGRAM_BOT_TOKEN
}
if (-not $token) {
    Write-Host "Токен бота не найден в переменных окружения." -ForegroundColor Yellow
    $token = Read-Host "Введите токен бота от @BotFather"
}

# Убираем пробелы и переносы строк из токена
$token = $token.Trim()

# Проверяем формат токена
if (-not $token -or $token -notmatch '^\d+:[A-Za-z0-9_-]+$') {
    Write-Host "⚠️ Предупреждение: Токен может быть неправильного формата" -ForegroundColor Yellow
    Write-Host "Токен должен начинаться с цифр и содержать двоеточие" -ForegroundColor Yellow
    Write-Host "Пример: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz" -ForegroundColor Gray
    Write-Host ""
}

# Проверяем, что бот существует
Write-Host "Проверка токена..." -ForegroundColor Cyan
try {
    $botInfo = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getMe" -Method Get -ErrorAction Stop
    if ($botInfo.ok) {
        Write-Host "✓ Токен валидный. Бот: @$($botInfo.result.username)" -ForegroundColor Green
    } else {
        Write-Host "✗ Токен невалидный" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Ошибка проверки токена: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Возможно, токен неправильный или бот не существует" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# URL webhook
$webhookUrl = "https://historical-characters.up.railway.app/api/telegram/webhook"

Write-Host "Обновление webhook..." -ForegroundColor Cyan
Write-Host "URL: $webhookUrl" -ForegroundColor Gray

# Обновляем webhook
try {
    $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook" -Method Post -Body @{
        url = $webhookUrl
    } -ContentType "application/x-www-form-urlencoded"
    
    if ($response.ok) {
        Write-Host "✓ Webhook успешно обновлен!" -ForegroundColor Green
        Write-Host "Результат: $($response.description)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Ошибка обновления webhook" -ForegroundColor Red
        Write-Host "Описание: $($response.description)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Ошибка при обновлении webhook:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`nПроверка webhook..." -ForegroundColor Cyan

# Проверяем webhook
try {
    $webhookInfo = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getWebhookInfo" -Method Get
    
    if ($webhookInfo.ok) {
        $result = $webhookInfo.result
        Write-Host "Текущий webhook URL: $($result.url)" -ForegroundColor Cyan
        Write-Host "Ожидающий обновлений: $($result.pending_update_count)" -ForegroundColor Cyan
        
        if ($result.last_error_message) {
            Write-Host "Последняя ошибка: $($result.last_error_message)" -ForegroundColor Yellow
        }
        
        if ($result.url -eq $webhookUrl) {
            Write-Host "✓ Webhook настроен правильно!" -ForegroundColor Green
        } else {
            Write-Host "⚠ Webhook указывает на другой URL" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "✗ Ошибка при проверке webhook:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
