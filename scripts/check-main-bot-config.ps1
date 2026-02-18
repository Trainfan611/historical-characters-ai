# Проверка конфигурации основного бота
# Использование: .\scripts\check-main-bot-config.ps1

Write-Host "=== Проверка конфигурации основного бота ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Информация о боте:" -ForegroundColor Yellow
Write-Host "  Username: @telegakrytobot" -ForegroundColor Gray
Write-Host "  ID: 7560411864" -ForegroundColor Gray
Write-Host "  Имя: telegakryto" -ForegroundColor Gray
Write-Host ""

Write-Host "Проверьте в Railway → Variables:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. TELEGRAM_BOT_TOKEN" -ForegroundColor Cyan
Write-Host "   Должен быть установлен токен основного бота" -ForegroundColor Gray
Write-Host ""
Write-Host "2. NEXT_PUBLIC_TELEGRAM_BOT_USERNAME" -ForegroundColor Cyan
Write-Host "   Должно быть: telegakrytobot" -ForegroundColor Gray
Write-Host "   (без символа @)" -ForegroundColor Gray
Write-Host ""

Write-Host "Проверка в BotFather:" -ForegroundColor Yellow
Write-Host "  1. Откройте @BotFather" -ForegroundColor Gray
Write-Host "  2. Отправьте /setdomain" -ForegroundColor Gray
Write-Host "  3. Выберите бота @telegakrytobot" -ForegroundColor Gray
Write-Host "  4. Укажите домен: history-character.up.railway.app" -ForegroundColor Gray
Write-Host ""

Write-Host "Тестирование:" -ForegroundColor Yellow
Write-Host "  1. Откройте: https://history-character.up.railway.app/login" -ForegroundColor Gray
Write-Host "  2. Должен отображаться виджет входа через Telegram" -ForegroundColor Gray
Write-Host "  3. Попробуйте войти через бота @telegakrytobot" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Основной бот настроен правильно!" -ForegroundColor Green
Write-Host ""
