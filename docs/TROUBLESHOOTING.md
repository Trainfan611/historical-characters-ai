# Решение проблем с Gemini и Nano Banana

## Проблема: Gemini API возвращает ошибку 403

### Симптомы:
```
[Gemini] Error generating prompt: {
  status: 403,
  message: 'Generative Language API has not been used in project...'
}
```

### Решение:

1. **Включите Generative Language API в Google Cloud Console:**
   - Перейдите на: https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=555550308426
   - Нажмите кнопку **"Enable"** (Включить)
   - Подождите 2-5 минут для активации

2. **Проверьте правильность API ключа:**
   - Убедитесь, что `GEMINI_API_KEY` установлен в Railway
   - Проверьте, что ключ не истек
   - Получите новый ключ на: https://ai.google.dev/api?hl=ru

### Временное решение:
Система автоматически переключится на **OpenAI** для генерации промптов, если Gemini недоступен. Генерация будет работать, но будет использовать OpenAI вместо Gemini.

---

## Проблема: Nano Banana возвращает ошибку 404

### Симптомы:
```
[Nano Banana] Banana.dev format also failed: Request failed with status code 404
[Nano Banana] Error generating image: All API formats failed
```

### Возможные причины:

1. **Неправильный API endpoint:**
   - Nano Banana API может использовать другой URL
   - Проверьте документацию: https://www.nano-banana.run/tutorials/api-guide

2. **Неправильный формат запроса:**
   - API может требовать другой формат данных
   - Проверьте документацию API

3. **API ключ неверный или истек:**
   - Проверьте правильность `NANO_BANANA_API_KEY`
   - Убедитесь, что ключ активен

### Решение:

1. **Проверьте переменные окружения в Railway:**
   ```
   NANO_BANANA_API_KEY=your_key_here
   NANO_BANANA_API_URL=https://api.nanobanana.ai/v1/images/generate
   ```

2. **Если используете Banana.dev:**
   ```
   BANANA_API_URL=https://api.banana.dev/start/v1
   BANANA_MODEL_KEY=flux
   ```

3. **Проверьте логи для диагностики:**
   - Посмотрите, какие endpoints пробуются
   - Проверьте формат ошибки

### Временное решение:
Система автоматически переключится на **Replicate** для генерации изображений, если Nano Banana недоступен. Генерация будет работать, но будет использовать Replicate вместо Nano Banana.

---

## Проблема: Ошибка 403 для старых изображений OpenAI DALL-E

### Симптомы:
```
⨯ upstream image response failed for https://oaidalleapiprodscus.blob.core.windows.net/... 403
```

### Причина:
Это нормально! Старые изображения, сгенерированные через OpenAI DALL-E, имеют временные URL, которые истекают через некоторое время (обычно через несколько часов).

### Решение:
Это не критично. Новые изображения будут работать нормально. Если нужно:
- Можно удалить старые генерации из БД
- Или игнорировать эти ошибки (они не влияют на работу приложения)

---

## Проверка работы fallback механизмов

### Ожидаемое поведение:

#### Сценарий 1: Все работает
```
[Gemini] Prompt generated successfully
[Nano Banana] Generation succeeded
```

#### Сценарий 2: Gemini не работает → OpenAI
```
[Gemini] Error generating prompt: status 403
[Gemini] API not enabled or invalid key, falling back to OpenAI...
[Generate] Prompt generated successfully
[Nano Banana] Generation succeeded
```

#### Сценарий 3: Nano Banana не работает → Replicate
```
[Gemini] Prompt generated successfully
[Nano Banana] Error generating image: All API formats failed
[Generate] Nano Banana failed, falling back to Replicate...
[Generate] Fallback to Replicate successful
```

#### Сценарий 4: Оба не работают → оба fallback
```
[Gemini] Error → OpenAI (fallback) ✅
[Nano Banana] Error → Replicate (fallback) ✅
[Generate] Image generation completed using Replicate (fallback)
```

---

## Чеклист диагностики

- [ ] `GEMINI_API_KEY` установлен в Railway
- [ ] `NANO_BANANA_API_KEY` установлен в Railway
- [ ] Generative Language API включен в Google Cloud Console
- [ ] Приложение перезапущено после изменения переменных
- [ ] Проверены логи на наличие ошибок
- [ ] Попробована генерация изображения
- [ ] Проверено, что fallback работает (если основной сервис не работает)

---

## Логи для проверки

После генерации проверьте логи на наличие:

### Успешная генерация:
```
[Generate] Generating image prompt...
[Gemini] Prompt generated successfully (или [Gemini] Falling back to OpenAI...)
[Generate] Prompt generated successfully, length: [число]
[Generate] Generating image using Nano Banana...
[Nano Banana] Generation succeeded (или [Generate] Nano Banana failed, falling back to Replicate...)
[Generate] Image generation completed using [сервис]
```

### Проблемы:
- Если видите только ошибки без fallback сообщений → проверьте код
- Если fallback не срабатывает → проверьте наличие `REPLICATE_API_KEY` и `OPENAI_API_KEY`

---

## Важно

**Система всегда должна работать благодаря fallback механизмам!**

Даже если Gemini и Nano Banana не работают, система автоматически переключится на:
- **OpenAI** для промптов (если Gemini недоступен)
- **Replicate** для изображений (если Nano Banana недоступен)

Это гарантирует, что генерация изображений всегда будет работать.

---

## Контакты для поддержки

Если проблемы не решаются:

1. **Gemini API:**
   - Документация: https://ai.google.dev/api?hl=ru
   - Google Cloud Console: https://console.cloud.google.com/

2. **Nano Banana:**
   - Документация: https://www.nano-banana.run/tutorials/api-guide
   - Поддержка: через их сайт

3. **Проверьте логи Railway:**
   - Откройте логи в Railway Dashboard
   - Найдите сообщения с префиксом `[Gemini]` или `[Nano Banana]`
   - Проверьте статус ошибок
