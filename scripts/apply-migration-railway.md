# Инструкция по применению миграции на Railway

## Вариант 1: Через Railway CLI (рекомендуется)

1. Установите Railway CLI (если еще не установлен):
   ```bash
   npm i -g @railway/cli
   ```

2. Войдите в Railway:
   ```bash
   railway login
   ```

3. Подключитесь к проекту:
   ```bash
   railway link
   ```

4. Примените миграцию:
   ```bash
   railway run npx prisma migrate deploy
   ```

## Вариант 2: Через Railway Dashboard

1. Откройте ваш проект на Railway
2. Перейдите в раздел "Variables"
3. Убедитесь, что `DATABASE_URL` настроен
4. Перейдите в раздел "Deployments"
5. Откройте последний deployment
6. В разделе "Logs" или через "Shell" выполните:
   ```bash
   npx prisma migrate deploy
   ```

## Вариант 3: Через Prisma Studio (если есть доступ к БД)

1. Выполните локально:
   ```bash
   npx prisma db push
   ```

Но это применит изменения напрямую, без миграции.

## Проверка

После применения миграции проверьте, что поле `isAdmin` добавлено:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'isAdmin';
```

Должно вернуть:
- column_name: isAdmin
- data_type: boolean
- column_default: false
