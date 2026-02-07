-- SQL скрипт для добавления колонки isAdmin в таблицу User
-- Выполните этот скрипт в Railway PostgreSQL

-- Добавляем колонку isAdmin
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Создаем индекс для быстрого поиска админов
CREATE INDEX IF NOT EXISTS "User_isAdmin_idx" ON "User"("isAdmin");

-- Проверяем, что колонка добавлена
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'isAdmin';
