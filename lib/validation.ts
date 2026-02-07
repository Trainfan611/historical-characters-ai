/**
 * Валидация входных данных для защиты от инъекций и некорректных данных
 */
import { z } from 'zod';

/**
 * Очищает имя от markdown форматирования и других служебных символов
 */
function cleanPersonName(name: string): string {
  return name
    .replace(/\*\*/g, '') // Убираем двойные звездочки (жирный текст)
    .replace(/\*/g, '') // Убираем одинарные звездочки
    .replace(/_/g, '') // Убираем подчеркивания (курсив)
    .replace(/`/g, '') // Убираем обратные кавычки (код)
    .replace(/\[|\]/g, '') // Убираем квадратные скобки
    .replace(/#/g, '') // Убираем решетки
    .trim();
}

/**
 * Схема валидации для генерации изображения
 */
export const generateImageSchema = z.object({
  personName: z.string()
    .trim()
    .min(2, 'Имя должно быть не менее 2 символов')
    .max(200, 'Имя слишком длинное')
    .transform((val) => cleanPersonName(val)) // Очищаем от markdown перед валидацией
    .refine((val) => val.length >= 2, 'Имя должно быть не менее 2 символов после очистки')
    .refine((val) => /^[a-zA-Zа-яА-ЯёЁ\s\-'.,()]+$/.test(val), 'Недопустимые символы в имени'),
  personId: z.string().optional(),
  style: z.enum(['realistic', 'artistic', 'historical']).optional().default('realistic'),
});

/**
 * Схема валидации для поиска личностей
 */
export const searchPersonsSchema = z.object({
  q: z.string()
    .min(2, 'Поисковый запрос должен быть не менее 2 символов')
    .max(100, 'Поисковый запрос слишком длинный')
    .regex(/^[a-zA-Zа-яА-ЯёЁ\s\-'.,]+$/, 'Недопустимые символы')
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  era: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
  useInternet: z.coerce.boolean().optional().default(true),
});

/**
 * Валидация и санитизация строки
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Удаляем потенциально опасные символы
    .slice(0, 1000); // Ограничиваем длину
}
