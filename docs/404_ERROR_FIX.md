# 🔧 Решение ошибки 404 "Not Found"

Если вы видите ошибку `{"ok":false,"error_code":404,"description":"Not Found"}`, это означает, что Telegram не может найти ваш webhook endpoint.

## 🔍 Диагностика

### Шаг 1: Проверьте, что приложение задеплоено

1. Откройте в браузере:
   ```
   https://history-character.up.railway.app
   ```
2. Если сайт не открывается — приложение еще не задеплоено на новом домене
3. Проверьте Railway:
   - Откройте проект в Railway
   - Перейдите в "Deployments"
   - Убедитесь, что последний деплой успешен (зеленый статус)

### Шаг 2: Проверьте NEXTAUTH_URL в Railway

1. Откройте проект в Railway
2. Перейдите в **Variables**
3. Найдите `NEXTAUTH_URL`
4. Убедитесь, что значение:
   ```
   https://history-character.up.railway.app
   ```
5. Если значение неправильное — обновите и сохраните
6. Подождите 1-2 минуты, пока Railway перезапустит приложение

### Шаг 3: Проверьте доступность endpoint

Откройте в браузере:
```
https://history-character.up.railway.app/api/telegram/webhook
```

**Ожидаемый результат:**
```json
{
  "message": "Telegram webhook endpoint",
  "method": "POST"
}
```

**Если видите 404:**
- Приложение еще не задеплоено на новом домене
- Или `NEXTAUTH_URL` неправильный
- Или приложение не запущено

### Шаг 4: Проверьте диагностику

Откройте в браузере:
```
https://history-character.up.railway.app/api/telegram/debug
```

Проверьте:
- `status` должен быть `"ok"` или `"warning"` (не `"error"`)
- `webhook.url` должен указывать на правильный домен
- Не должно быть ошибок в `issues`

### Шаг 5: Обновите webhook

**После того, как приложение задеплоено и `NEXTAUTH_URL` обновлен:**

1. Запустите скрипт:
   ```powershell
   .\scripts\update-webhook.ps1
   ```

2. Или вручную через браузер (замените `ВАШ_ТОКЕН`):
   ```
   https://api.telegram.org/botВАШ_ТОКЕН/setWebhook?url=https://history-character.up.railway.app/api/telegram/webhook
   ```

3. Проверьте webhook:
   ```
   https://api.telegram.org/botВАШ_ТОКЕН/getWebhookInfo
   ```

   Должны увидеть:
   ```json
   {
     "ok": true,
     "result": {
       "url": "https://history-character.up.railway.app/api/telegram/webhook",
       "pending_update_count": 0
     }
   }
   ```

---

## ✅ Чек-лист решения проблемы

- [ ] Сайт открывается: `https://historical-ai.up.railway.app`
- [ ] Endpoint доступен: `https://history-character.up.railway.app/api/telegram/webhook`
- [ ] `NEXTAUTH_URL` в Railway = `https://historical-ai.up.railway.app`
- [ ] Приложение перезапущено в Railway (после изменения переменных)
- [ ] Webhook обновлен через `setWebhook`
- [ ] Webhook проверен через `getWebhookInfo`
- [ ] Диагностика показывает `status: "ok"` или `"warning"`

---

## 🐛 Частые причины 404

### Причина 1: Приложение не задеплоено на новом домене

**Решение:**
1. Проверьте деплой в Railway
2. Убедитесь, что домен правильно настроен в Railway
3. Подождите завершения деплоя

### Причина 2: NEXTAUTH_URL не обновлен

**Решение:**
1. Обновите `NEXTAUTH_URL` в Railway
2. Подождите перезапуска приложения
3. Проверьте endpoint снова

### Причина 3: Webhook указывает на старый домен

**Решение:**
1. Обновите webhook через `setWebhook`
2. Проверьте через `getWebhookInfo`
3. Убедитесь, что URL правильный

### Причина 4: Приложение не запущено

**Решение:**
1. Проверьте логи в Railway
2. Убедитесь, что нет ошибок запуска
3. Перезапустите приложение в Railway

---

## 📞 Дополнительная помощь

Если проблема не решена:

1. Проверьте логи Railway на наличие ошибок
2. Убедитесь, что все переменные окружения установлены
3. Проверьте, что база данных доступна
4. Убедитесь, что домен правильно настроен в Railway

---

**Удачи! 🚀**
