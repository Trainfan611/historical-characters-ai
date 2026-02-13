# Скрипт для проверки токена Telegram бота
# Использование: .\scripts\check-bot-token.ps1

Write-Host "=== Проверка токена Telegram бота ===" -ForegroundColor Cyan
Write-Host ""

# Получаем токен из переменной окружения или запрашиваем у пользователя
$token = $env:TELEGRAM_BOT_TOKEN_BASE
if (-not $token) {
    $token = $env:TELEGRAM_BOT_TOKEN
}
if (-not $token) {
    Write-Host "Токен бота не найден в переменных окружения." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Как получить токен:" -ForegroundColor Cyan
    Write-Host "1. Откройте @BotFather в Telegram" -ForegroundColor Gray
    Write-Host "2. Отправьте /mybots" -ForegroundColor Gray
    Write-Host "3. Выберите вашего бота" -ForegroundColor Gray
    Write-Host "4. Выберите 'API Token'" -ForegroundColor Gray
    Write-Host "5. Скопируйте токен" -ForegroundColor Gray
    Write-Host ""
    $token = Read-Host "Введите токен бота"
}

# Убираем пробелы и переносы строк из токена
$token = $token.Trim()

# Проверяем формат токена
Write-Host "Проверка формата токена..." -ForegroundColor Cyan
if ($token -match '^\d+:[A-Za-z0-9_-]+$') {
    Write-Host "✓ Формат токена правильный" -ForegroundColor Green
} else {
    Write-Host "✗ Формат токена неправильный!" -ForegroundColor Red
    Write-Host "Токен должен быть в формате: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz" -ForegroundColor Yellow
    Write-Host "Ваш токен (первые 20 символов): $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "Проверка токена через Telegram API..." -ForegroundColor Cyan

# Проверяем, что бот существует
try {
    $botInfo = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getMe" -Method Get -ErrorAction Stop
    
    if ($botInfo.ok) {
        Write-Host "✓ Токен валидный!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Информация о боте:" -ForegroundColor Cyan
        Write-Host "  ID: $($botInfo.result.id)" -ForegroundColor Gray
        Write-Host "  Имя: $($botInfo.result.first_name)" -ForegroundColor Gray
        Write-Host "  Username: @$($botInfo.result.username)" -ForegroundColor Gray
        Write-Host "  Это бот: $($botInfo.result.is_bot)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "✓ Токен правильный, можно использовать для обновления webhook" -ForegroundColor Green
    } else {
        Write-Host "✗ Токен невалидный" -ForegroundColor Red
        exit 1
    }
} catch {
    $errorMessage = $_.Exception.Message
    Write-Host "✗ Ошибка проверки токена" -ForegroundColor Red
    
    if ($errorMessage -match "404") {
        Write-Host ""
        Write-Host "Ошибка 404 означает, что:" -ForegroundColor Yellow
        Write-Host "  - Токен неправильный" -ForegroundColor Yellow
        Write-Host "  - Бот не существует" -ForegroundColor Yellow
        Write-Host "  - Бот был удален" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Решение:" -ForegroundColor Cyan
        Write-Host "1. Проверьте токен в @BotFather (/mybots → выберите бота → API Token)" -ForegroundColor Gray
        Write-Host "2. Или создайте нового бота: /newbot" -ForegroundColor Gray
    } else {
        Write-Host "Детали ошибки: $errorMessage" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""
Write-Host "Хотите обновить webhook сейчас? (Y/N)" -ForegroundColor Cyan
$update = Read-Host

if ($update -eq "Y" -or $update -eq "y") {
    Write-Host ""
    Write-Host "Обновление webhook..." -ForegroundColor Cyan
    
    $webhookUrl = "https://historical-characters.up.railway.app/api/telegram/webhook"
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook" -Method Post -Body @{
            url = $webhookUrl
        } -ContentType "application/x-www-form-urlencoded"
        
        if ($response.ok) {
            Write-Host "✓ Webhook успешно обновлен!" -ForegroundColor Green
            Write-Host "URL: $webhookUrl" -ForegroundColor Gray
        } else {
            Write-Host "✗ Ошибка обновления webhook" -ForegroundColor Red
            Write-Host "Описание: $($response.description)" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Ошибка при обновлении webhook:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}
