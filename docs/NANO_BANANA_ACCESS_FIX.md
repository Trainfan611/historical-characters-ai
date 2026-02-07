# Решение проблемы "You do not have access permissions" в Nano Banana

## Проблема

В логах видно ошибку:
```
[Nano Banana] Error generating image: {
  message: 'Nano Banana API error: You do not have access permissions'
}
```

## Причины

1. **API ключ неверный или истек**
2. **API ключ не активирован**
3. **Нет доступа к API (требуется активация аккаунта)**
4. **Недостаточно кредитов на аккаунте**

## Решения

### 1. Проверьте API ключ

1. Перейдите на https://nanobananaapi.ai/api-key
2. Убедитесь, что ключ активен
3. Если ключ неверный, создайте новый
4. Скопируйте ключ полностью (без пробелов)

### 2. Проверьте аккаунт

1. Убедитесь, что аккаунт активирован
2. Проверьте баланс кредитов
3. Если нужно, пополните баланс

### 3. Проверьте переменную окружения в Railway

Убедитесь, что:
- `NANO_BANANA_API_KEY` установлен правильно
- Ключ скопирован полностью
- Нет лишних пробелов или символов
- Переменная названа точно `NANO_BANANA_API_KEY` (не `NANO_BANANA_KEY` или другие варианты)

### 4. Перезапустите приложение

После изменения переменных окружения:
1. Перезапустите приложение в Railway
2. Подождите несколько секунд
3. Попробуйте снова

## Временное решение: Fallback на Replicate

Если Nano Banana не работает, система автоматически переключится на **Replicate** для генерации изображений.

**Убедитесь, что у вас есть:**
```
REPLICATE_API_KEY=your_replicate_key_here
```

Получить ключ: https://replicate.com/account/api-tokens

## Проверка после исправления

После исправления в логах должны быть:

**Если Nano Banana работает:**
```
[Nano Banana] Task created successfully, taskId: task12345
[Nano Banana] Task completed successfully!
[Nano Banana] ✓ Generation succeeded, image URL: [URL]
```

**Если Nano Banana не работает (fallback):**
```
[Nano Banana] ✗ Error generating image: You do not have access permissions
[Generate] ===== Attempting fallback to Replicate =====
[Generate] ✓ Fallback to Replicate successful!
```

## Важно

Система имеет fallback механизмы:
- **Gemini** → **OpenAI** (для промптов)
- **Nano Banana** → **Replicate** (для изображений)

Даже если Nano Banana не работает, генерация должна продолжаться через Replicate.

## Контакты поддержки

Если проблема не решается:
- **Nano Banana Support**: support@nanobananaapi.ai
- **Документация**: https://docs.nanobananaapi.ai/quickstart
