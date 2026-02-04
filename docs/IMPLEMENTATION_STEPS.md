# 🚀 Пошаговая Реализация: Платформа Генерации Изображений Исторических Личностей

## 📌 Краткое описание проекта

Веб-платформа для генерации изображений исторических личностей с помощью AI:
- ✅ Регистрация через Telegram (обязательно)
- ✅ Обязательная подписка на указанный Telegram канал
- ✅ Генерация изображений через AI (OpenRouter/Flux)
- ✅ История генераций пользователя

---

## 🎯 Технологический стек

| Компонент | Технология |
|-----------|-----------|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Backend | Next.js API Routes |
| База данных | PostgreSQL + Prisma ORM |
| Аутентификация | NextAuth.js + Telegram Bot API |
| AI генерация | OpenRouter (Flux) + Perplexity + OpenAI |
| Деплой | VPS + Caddy + PM2 |

---

## 📋 Детальные шаги реализации

### 🔧 ШАГ 1: Инициализация проекта (День 1)

#### 1.1 Создание Next.js проекта
```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
```

**Структура папок:**
```
historical-characters-ai/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (auth)/            # Auth pages
│   ├── generate/          # Страница генерации
│   ├── profile/           # Профиль пользователя
│   └── layout.tsx         # Root layout
├── components/            # React компоненты
│   ├── ui/                # Базовые UI компоненты
│   ├── auth/              # Компоненты аутентификации
│   └── generation/        # Компоненты генерации
├── lib/                   # Утилиты и хелперы
│   ├── db.ts              # Prisma client
│   ├── auth.ts            # NextAuth конфигурация
│   ├── telegram.ts        # Telegram API функции
│   └── ai/                # AI интеграции
│       ├── openrouter.ts
│       ├── perplexity.ts
│       └── openai.ts
├── prisma/                # Prisma схема и миграции
│   ├── schema.prisma
│   └── seed.ts
└── public/                # Статические файлы
```

#### 1.2 Установка зависимостей
```bash
npm install next-auth @prisma/client
npm install -D prisma @types/node
npm install axios zod react-hook-form @tanstack/react-query
npm install zustand lucide-react
```

#### 1.3 Настройка .env.example
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/historical_characters"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Telegram
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHANNEL_ID="@your-channel"  # или ID канала

# AI APIs
OPENROUTER_API_KEY="your-openrouter-key"
PERPLEXITY_API_KEY="your-perplexity-key"
OPENAI_API_KEY="your-openai-key"

# Storage (опционально для production)
S3_BUCKET_NAME=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
```

---

### 🗄️ ШАГ 2: Настройка базы данных (День 1-2)

#### 2.1 Схема Prisma (prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  telegramId    String    @unique
  username      String?
  firstName     String?
  lastName      String?
  photoUrl      String?
  isSubscribed  Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  generations   Generation[]
  subscriptions SubscriptionCheck[]
  
  @@index([telegramId])
}

model HistoricalPerson {
  id          String   @id @default(cuid())
  name        String
  nameEn      String?  // Английское имя для поиска
  description String?  @db.Text
  era         String?  // Эпоха (Древний мир, Средневековье, и т.д.)
  category    String?  // Категория (Политик, Ученый, Художник, и т.д.)
  country     String?
  birthYear   Int?
  deathYear   Int?
  imageUrl    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  generations Generation[]
  
  @@index([name])
  @@index([era])
  @@index([category])
}

model Generation {
  id                String   @id @default(cuid())
  userId            String
  historicalPersonId String?
  personName        String   // Имя для быстрого доступа
  prompt            String   @db.Text
  imageUrl          String
  style             String?  // Стиль генерации
  status            String   @default("completed") // completed, failed, processing
  errorMessage      String?  @db.Text
  createdAt         DateTime @default(now())
  
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  historicalPerson  HistoricalPerson? @relation(fields: [historicalPersonId], references: [id])
  
  @@index([userId])
  @@index([createdAt])
}

model SubscriptionCheck {
  id            String   @id @default(cuid())
  userId        String
  channelId     String
  isSubscribed  Boolean  @default(false)
  lastChecked   DateTime @default(now())
  checkedAt     DateTime @default(now())
  
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, channelId])
  @@index([userId])
}
```

#### 2.2 Миграции
```bash
npx prisma migrate dev --name init
npx prisma generate
```

#### 2.3 Seed данные (prisma/seed.ts)
- Популярные исторические личности (50-100 записей)
- Примеры: Наполеон, Цезарь, Леонардо да Винчи, и т.д.

---

### 🔐 ШАГ 3: Аутентификация через Telegram (День 2-3)

#### 3.1 Создание Telegram бота
1. Написать @BotFather в Telegram
2. Команда `/newbot`
3. Получить BOT_TOKEN
4. Настроить команды бота

#### 3.2 NextAuth конфигурация (lib/auth.ts)

```typescript
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./db"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Telegram",
      credentials: {
        id: { label: "Telegram ID", type: "text" },
        hash: { label: "Hash", type: "text" },
        username: { label: "Username", type: "text" },
        first_name: { label: "First Name", type: "text" },
        photo_url: { label: "Photo URL", type: "text" },
      },
      async authorize(credentials) {
        // Верификация Telegram данных
        // Создание/обновление пользователя в БД
        // Возврат пользователя
      },
    }),
  ],
  // ...
}
```

#### 3.3 Telegram Login Widget компонент
- Использовать официальный Telegram Login Widget
- Обработка callback после авторизации
- Сохранение данных пользователя

#### 3.4 Проверка подписки на канал (lib/telegram.ts)

```typescript
export async function checkChannelSubscription(
  userId: string,
  channelId: string
): Promise<boolean> {
  // Использование Telegram Bot API getChatMember
  // Проверка статуса пользователя в канале
  // Обновление SubscriptionCheck в БД
  // Возврат true/false
}
```

#### 3.5 Middleware для проверки подписки
- Создать middleware.ts в корне проекта
- Проверка подписки перед доступом к генератору
- Редирект на страницу подписки если не подписан

---

### 🤖 ШАГ 4: Интеграция с AI сервисами (День 3-5)

#### 4.1 Perplexity API (lib/ai/perplexity.ts)
```typescript
export async function searchHistoricalPerson(name: string) {
  // Запрос к Perplexity API
  // Получение информации о личности
  // Извлечение ключевых характеристик
  // Возврат структурированных данных
}
```

#### 4.2 OpenAI API (lib/ai/openai.ts)
```typescript
export async function generatePrompt(
  personName: string,
  personInfo: PersonInfo,
  style?: string
) {
  // Использование GPT-4 для создания детального промпта
  // Оптимизация для генерации изображений
  // Возврат готового промпта
}
```

#### 4.3 OpenRouter API (lib/ai/openrouter.ts)
```typescript
export async function generateImage(prompt: string) {
  // Запрос к OpenRouter (Flux модель)
  // Генерация изображения
  // Сохранение изображения (локально или S3)
  // Возврат URL изображения
}
```

#### 4.4 Основной flow генерации (app/api/generate/route.ts)
1. Проверка подписки пользователя
2. Поиск информации о личности (Perplexity)
3. Формирование промпта (OpenAI)
4. Генерация изображения (OpenRouter)
5. Сохранение в БД
6. Возврат результата

---

### 🎨 ШАГ 5: Frontend - Главная страница (День 5-7)

#### 5.1 Layout (app/layout.tsx)
- Header с навигацией
- Кнопка входа через Telegram
- Footer

#### 5.2 Главная страница (app/page.tsx)
- Hero секция
- Популярные личности (карусель)
- Примеры генераций
- CTA кнопка

#### 5.3 Компоненты UI
- Button, Card, Input, Modal
- Skeleton loaders
- Toast notifications

---

### 🖼️ ШАГ 6: Frontend - Генератор (День 7-9)

#### 6.1 Страница генерации (app/generate/page.tsx)
- Поиск исторической личности
- Выбор параметров (стиль, качество)
- Кнопка генерации
- Preview области

#### 6.2 Обработка генерации
- Отправка запроса
- Отображение прогресса
- Показ результата
- Кнопки действий (скачать, сохранить, поделиться)

#### 6.3 История генераций (app/profile/generations/page.tsx)
- Список всех генераций
- Фильтры и сортировка
- Удаление генераций

---

### 🧪 ШАГ 7: Тестирование и оптимизация (День 9-10)

#### 7.1 Тестирование
- Unit тесты для API
- Integration тесты
- E2E тесты основных сценариев

#### 7.2 Оптимизация
- Кэширование промптов
- Оптимизация изображений
- Lazy loading
- Database индексы

---

### 🚀 ШАГ 8: Деплой (День 10-12)

#### 8.1 Подготовка
- Production переменные окружения
- Оптимизация сборки
- Миграции БД

#### 8.2 Настройка VPS
- Установка Node.js, PostgreSQL
- Настройка Caddy
- SSL сертификаты
- PM2 конфигурация

#### 8.3 CI/CD
- GitHub Actions
- Автоматический деплой
- Мониторинг

---

## 📝 Чеклист MVP

### Backend
- [ ] Prisma схема и миграции
- [ ] NextAuth с Telegram провайдером
- [ ] Проверка подписки на канал
- [ ] API для генерации изображений
- [ ] Интеграция с Perplexity, OpenAI, OpenRouter
- [ ] API для истории генераций

### Frontend
- [ ] Главная страница
- [ ] Страница генерации
- [ ] Страница профиля
- [ ] История генераций
- [ ] Компоненты UI
- [ ] Адаптивный дизайн

### Инфраструктура
- [ ] База данных настроена
- [ ] Переменные окружения
- [ ] Деплой на VPS
- [ ] SSL сертификаты
- [ ] Мониторинг

---

## 🎯 Приоритеты разработки

1. **Критично (MVP):**
   - Аутентификация через Telegram
   - Проверка подписки
   - Базовая генерация изображений
   - Простой UI

2. **Важно:**
   - История генераций
   - Оптимизация промптов
   - Обработка ошибок

3. **Желательно:**
   - Множественные стили
   - Социальные функции
   - Аналитика

---

## 📞 Контакты и поддержка

После реализации проекта, для настройки:
- Telegram Bot Token
- Channel ID для подписки
- API ключи для AI сервисов

Все это настраивается через переменные окружения (.env файл).
