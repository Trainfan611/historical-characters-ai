# 🔧 СРОЧНОЕ ИСПРАВЛЕНИЕ: Добавить колонку isAdmin

## ❌ Проблема
Ошибка: `The column User.isAdmin does not exist in the current database`

## ✅ Решение (3 способа)

### Способ 1: Через Railway Dashboard (САМЫЙ ПРОСТОЙ)

1. Откройте [Railway Dashboard](https://railway.app)
2. Выберите ваш проект
3. Найдите сервис **PostgreSQL** (база данных)
4. Перейдите в раздел **"Data"** или **"Query"**
5. Скопируйте и выполните этот SQL:

```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "User_isAdmin_idx" ON "User"("isAdmin");
```

6. Нажмите **"Run"** или **"Execute"**

### Способ 2: Через Railway Shell

1. Откройте Railway Dashboard → ваш проект → Deployments → последний deployment
2. Откройте **"Shell"**
3. Выполните:

```bash
npx prisma db push
```

Или:

```bash
npm run db:push
```

### Способ 3: Через Railway CLI

```bash
railway run npx prisma db push
```

---

## ✅ Проверка

После выполнения SQL проверьте:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'isAdmin';
```

Должно вернуть:
- column_name: isAdmin
- data_type: boolean
- column_default: false

---

## 🎯 После исправления

1. Перезапустите приложение на Railway (если нужно)
2. Откройте: `https://ваш-домен.railway.app/admin/setup`
3. Нажмите **"Назначить меня админом"**

---

**После этого ошибка исчезнет!** ✅
